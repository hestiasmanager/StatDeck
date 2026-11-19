/**
 * Pre-computes deterministic JavaScript metrics, rollups, and aggregations
 * on uploaded CSV / Excel datasets to preserve real column headers and exact numbers.
 */

export interface CurrencySubtotal {
  currency: string;
  count: number;
  total: number;
  average: number;
  min: number;
  max: number;
}

export interface ColumnRollup {
  header: string;
  isNumeric: boolean;
  unit: string;
  count: number;
  total?: number;
  average?: number;
  min?: number;
  minLabel?: string;
  max?: number;
  maxLabel?: string;
  isMixedCurrency?: boolean;
  currencyBreakdowns?: CurrencySubtotal[];
}

export interface TableRollupSummary {
  headers: string[];
  totalRows: number;
  rollups: ColumnRollup[];
  formattedSummary: string;
}

const SUMMARY_ROW_REGEX = /^(grand\s*)?(sub)?total\b|\bsummary\b/i;

/**
 * Detects whether a row represents an aggregation or summary row (e.g. Total, Grand Total, Subtotal).
 */
export function isSummaryOrTotalRow(
  row: Record<string, unknown>,
  headers: string[]
): boolean {
  if (!row) return false;
  // Inspect the first 3 columns (typically identifier/category columns)
  const colsToCheck = Math.min(headers.length, 3);
  for (let c = 0; c < colsToCheck; c++) {
    const val = row[headers[c]];
    if (val !== null && val !== undefined) {
      const str = String(val).trim();
      if (SUMMARY_ROW_REGEX.test(str)) {
        return true;
      }
    }
  }
  return false;
}

const KNOWN_CURRENCY_SYMBOLS = new Set(["$", "€", "£", "¥", "₹", "₩"]);

/**
 * Extracts a numeric value from a cell, handling:
 * - Parenthesized accounting negatives: ($1,234.50) or (400) -> -1234.5, -400
 * - Currency symbols ($, €, £, ¥, ₹, ₩) and percentages (%)
 * - Trailing k, m, b multipliers: $45.2k -> 45200, 1.5M -> 1500000, 2.3B -> 2300000000
 * - Thousands separators (commas) and European decimal commas
 */
export function parseCleanNumber(val: unknown): { num: number; unit: string } | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "number") {
    if (isNaN(val) || !isFinite(val)) return null;
    return { num: val, unit: "" };
  }

  let str = String(val).trim();
  if (!str) return null;

  // Check for parenthesized accounting negatives: ($1,234.50), (400), (12.5%)
  let isNegative = false;
  const parenMatch = str.match(/^\s*\((.*)\)\s*$/);
  if (parenMatch) {
    isNegative = true;
    str = parenMatch[1].trim();
  }

  // Determine prefix or suffix unit ($, €, £, ¥, ₹, ₩, %)
  let unit = "";
  if (str.startsWith("$") || str.includes("($)")) unit = "$";
  else if (str.startsWith("€") || str.includes("(€)")) unit = "€";
  else if (str.startsWith("£") || str.includes("(£)")) unit = "£";
  else if (str.startsWith("¥") || str.includes("(¥)")) unit = "¥";
  else if (str.startsWith("₹") || str.includes("(₹)") || /^\s*Rs\.?\s*/i.test(str)) unit = "₹";
  else if (str.startsWith("₩") || str.includes("(₩)")) unit = "₩";
  else if (str.endsWith("%") || str.includes("(%)")) unit = "%";
  else if (str.endsWith("$")) unit = "$";
  else if (str.endsWith("€")) unit = "€";
  else if (str.endsWith("£")) unit = "£";
  else if (str.endsWith("¥")) unit = "¥";
  else if (str.endsWith("₹")) unit = "₹";
  else if (/\bUSD\b/i.test(str)) unit = "$";
  else if (/\bEUR\b/i.test(str)) unit = "€";
  else if (/\bGBP\b/i.test(str)) unit = "£";
  else if (/\bINR\b/i.test(str)) unit = "₹";
  else if (/\bJPY\b/i.test(str)) unit = "¥";

  // Strip currency symbols, percentages, and internal parentheses
  let cleanStr = str
    .replace(/[$,€£¥₹₩%()]/g, "")
    .replace(/\b(USD|EUR|GBP|INR|JPY|Rs\.?)\b/gi, "")
    .trim();

  // Check for leading minus/plus sign
  if (cleanStr.startsWith("-")) {
    isNegative = true;
    cleanStr = cleanStr.slice(1).trim();
  } else if (cleanStr.startsWith("+")) {
    cleanStr = cleanStr.slice(1).trim();
  }

  // Handle European decimal comma (e.g. "12,50" -> "12.50") vs thousands commas (e.g. "12,500" -> "12500")
  if (/^\d+,\d{1,2}$/.test(cleanStr)) {
    cleanStr = cleanStr.replace(",", ".");
  } else {
    cleanStr = cleanStr.replace(/,/g, "");
  }

  // Detect trailing k/m/b multiplier
  let multiplier = 1;
  const multiplierMatch = cleanStr.match(/([0-9.]+)\s*([kmbKMB])$/);
  if (multiplierMatch) {
    cleanStr = multiplierMatch[1];
    const suffix = multiplierMatch[2].toLowerCase();
    if (suffix === "k") multiplier = 1_000;
    else if (suffix === "m") multiplier = 1_000_000;
    else if (suffix === "b") multiplier = 1_000_000_000;
  }

  const num = parseFloat(cleanStr);
  if (isNaN(num) || !isFinite(num)) return null;

  const finalNum = (isNegative ? -1 : 1) * num * multiplier;
  return { num: finalNum, unit };
}

/**
 * Computes rollups (sum, avg, min, max, YoY deltas) across all columns.
 * Excludes summary and total rows before calculating metrics so totals are never double-counted.
 * Safely groups mixed currencies to prevent adding different currency symbols together.
 */
export function computeTableRollups(
  headers: string[],
  rows: Array<Record<string, unknown>>,
  fileName: string
): TableRollupSummary {
  const totalRows = rows.length;
  const rollups: ColumnRollup[] = [];

  // Exclude summary and total rows before computing rollups
  const dataRows = rows.filter((row) => !isSummaryOrTotalRow(row, headers));
  const activeRows = dataRows.length > 0 ? dataRows : rows;

  // Determine label/category column (typically first non-numeric column)
  const categoryColumn = headers[0] || "Item";

  for (const header of headers) {
    const numbers: number[] = [];
    const unitsCount: Record<string, number> = {};
    const rowLabels: string[] = [];
    const itemsWithUnit: Array<{ num: number; unit: string; label: string }> = [];

    for (let i = 0; i < activeRows.length; i++) {
      const row = activeRows[i];
      const parsed = parseCleanNumber(row[header]);
      if (parsed !== null) {
        numbers.push(parsed.num);
        if (parsed.unit) {
          unitsCount[parsed.unit] = (unitsCount[parsed.unit] || 0) + 1;
        }
        const label = String(row[categoryColumn] || `Row ${i + 1}`).trim();
        rowLabels.push(label);
        itemsWithUnit.push({ num: parsed.num, unit: parsed.unit, label });
      }
    }

    // If >= 40% of non-empty values are valid numbers, treat as numeric column
    if (numbers.length >= Math.max(1, Math.floor(activeRows.length * 0.4))) {
      const count = numbers.length;
      const presentCurrencies = Object.keys(unitsCount).filter((u) => KNOWN_CURRENCY_SYMBOLS.has(u));

      // Mixed currency safety: If multiple distinct currency symbols exist in this column,
      // group and summarize by currency instead of adding Euros + Rupees + Pounds into one bogus sum.
      if (presentCurrencies.length > 1) {
        const currencyBreakdowns: CurrencySubtotal[] = presentCurrencies.map((curr) => {
          const currItems = itemsWithUnit.filter((it) => it.unit === curr);
          const currNums = currItems.map((it) => it.num);
          const currTotal = currNums.reduce((acc, c) => acc + c, 0);
          const currAvg = currTotal / currNums.length;
          return {
            currency: curr,
            count: currItems.length,
            total: Math.round(currTotal * 100) / 100,
            average: Math.round(currAvg * 100) / 100,
            min: Math.round(Math.min(...currNums) * 100) / 100,
            max: Math.round(Math.max(...currNums) * 100) / 100,
          };
        });

        rollups.push({
          header,
          isNumeric: true,
          unit: "Mixed Currencies",
          count,
          total: undefined, // Omit aggregate total to prevent summing across currencies
          average: undefined,
          min: undefined,
          max: undefined,
          isMixedCurrency: true,
          currencyBreakdowns,
        });
      } else {
        const total = numbers.reduce((acc, curr) => acc + curr, 0);
        const average = total / count;

        let min = numbers[0];
        let minLabel = rowLabels[0] || "";
        let max = numbers[0];
        let maxLabel = rowLabels[0] || "";

        for (let i = 1; i < numbers.length; i++) {
          if (numbers[i] < min) {
            min = numbers[i];
            minLabel = rowLabels[i] || "";
          }
          if (numbers[i] > max) {
            max = numbers[i];
            maxLabel = rowLabels[i] || "";
          }
        }

        // Determine predominant unit
        let dominantUnit = "";
        let maxUnitCount = 0;
        for (const [u, cnt] of Object.entries(unitsCount)) {
          if (cnt > maxUnitCount) {
            dominantUnit = u;
            maxUnitCount = cnt;
          }
        }
        if (!dominantUnit && header.toLowerCase().includes("revenue")) dominantUnit = "$";
        if (!dominantUnit && header.toLowerCase().includes("percent")) dominantUnit = "%";
        if (!dominantUnit && header.toLowerCase().includes("growth")) dominantUnit = "%";

        rollups.push({
          header,
          isNumeric: true,
          unit: dominantUnit,
          count,
          total: Math.round(total * 100) / 100,
          average: Math.round(average * 100) / 100,
          min: Math.round(min * 100) / 100,
          minLabel,
          max: Math.round(max * 100) / 100,
          maxLabel,
          isMixedCurrency: false,
        });
      }
    } else {
      rollups.push({
        header,
        isNumeric: false,
        unit: "",
        count: activeRows.length,
      });
    }
  }

  // Format pre-computed summaries for the prompt
  const summaryLines: string[] = [
    `DATASET FILE: ${fileName}`,
    `TOTAL VALID ROWS: ${totalRows} (${activeRows.length} data rows, excluding summary/total rows)`,
    `EXACT COLUMN HEADERS: [${headers.map((h) => `"${h}"`).join(", ")}]`,
    "",
    "PRE-COMPUTED JAVASCRIPT ROLLUPS (Use exact column names & computed numbers for KPIs, charts, and table headers):",
  ];

  const numericRollups = rollups.filter((r) => r.isNumeric);
  if (numericRollups.length > 0) {
    for (const r of numericRollups) {
      if (r.isMixedCurrency && r.currencyBreakdowns && r.currencyBreakdowns.length > 0) {
        const breakdownStrs = r.currencyBreakdowns.map((b) => {
          const isPrefix = KNOWN_CURRENCY_SYMBOLS.has(b.currency);
          const fmt = (v: number) => {
            const abs = Math.abs(v).toLocaleString("en-US");
            const sign = v < 0 ? "-" : "";
            return isPrefix ? `${sign}${b.currency}${abs}` : `${sign}${abs} ${b.currency}`;
          };
          return `${b.currency}: Total = ${fmt(b.total)} (avg: ${fmt(b.average)}, n=${b.count})`;
        });

        summaryLines.push(
          `- Column "${r.header}": [FLAG: Mixed Currencies - DO NOT sum across currencies into one number] | Subtotals by Currency: ${breakdownStrs.join(" | ")}`
        );
      } else if (r.total !== undefined) {
        const u = r.unit;
        const isPrefix = KNOWN_CURRENCY_SYMBOLS.has(u);
        const formatRollupValue = (v: number | undefined) => {
          if (v === undefined) return "N/A";
          const isNeg = v < 0;
          const absStr = Math.abs(v).toLocaleString("en-US");
          const sign = isNeg ? "-" : "";
          return isPrefix ? `${sign}${u}${absStr}` : `${sign}${absStr}${u}`;
        };
        const fmtTotal = formatRollupValue(r.total);
        const fmtAvg = formatRollupValue(r.average);
        const fmtMax = formatRollupValue(r.max);
        const fmtMin = formatRollupValue(r.min);

        summaryLines.push(
          `- Column "${r.header}": Total = ${fmtTotal} | Average = ${fmtAvg} | Max = ${fmtMax} (Row: "${r.maxLabel}") | Min = ${fmtMin} (Row: "${r.minLabel}")`
        );
      }
    }

    // Look for period-over-period or YoY comparisons (e.g. 2024 vs 2025, Previous vs Current)
    const validComparisonRollups = numericRollups.filter((r) => !r.isMixedCurrency && r.total !== undefined);
    if (validComparisonRollups.length >= 2) {
      const r1 = validComparisonRollups[0];
      const r2 = validComparisonRollups[1];
      if (r1.total && r2.total && r1.total !== 0) {
        const deltaPct = Math.round(((r2.total - r1.total) / Math.abs(r1.total)) * 1000) / 10;
        const sign = deltaPct >= 0 ? "+" : "";
        summaryLines.push(
          `- Computed YoY Comparison: "${r2.header}" vs "${r1.header}": ${sign}${deltaPct}% delta`
        );
      }
    }
  } else {
    summaryLines.push("- (All columns are categorical / qualitative entries)");
  }

  return {
    headers,
    totalRows,
    rollups,
    formattedSummary: summaryLines.join("\n"),
  };
}
