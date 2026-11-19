/**
 * Pre-computes deterministic JavaScript metrics, rollups, and aggregations
 * on uploaded CSV / Excel datasets to preserve real column headers and exact numbers.
 */

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

/**
 * Extracts a numeric value from a cell, handling:
 * - Parenthesized accounting negatives: ($1,234.50) or (400) -> -1234.5, -400
 * - Currency symbols ($, €, £, ¥) and percentages (%)
 * - Trailing k, m, b multipliers: $45.2k -> 45200, 1.5M -> 1500000, 2.3B -> 2300000000
 * - Thousands separators (commas) and whitespace
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

  // Determine prefix or suffix unit ($ / € / £ / ¥ / %)
  let unit = "";
  if (str.startsWith("$") || str.includes("($)")) unit = "$";
  else if (str.startsWith("€") || str.includes("(€)")) unit = "€";
  else if (str.startsWith("£") || str.includes("(£)")) unit = "£";
  else if (str.startsWith("¥") || str.includes("(¥)")) unit = "¥";
  else if (str.endsWith("%") || str.includes("(%)")) unit = "%";

  // Strip currency symbols, percentages, commas, and internal parentheses
  let cleanStr = str.replace(/[$,€£¥%()]/g, "").replace(/,/g, "").trim();

  // Check for leading minus/plus sign
  if (cleanStr.startsWith("-")) {
    isNegative = true;
    cleanStr = cleanStr.slice(1).trim();
  } else if (cleanStr.startsWith("+")) {
    cleanStr = cleanStr.slice(1).trim();
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
      }
    }

    // If >= 40% of non-empty values are valid numbers, treat as numeric column
    if (numbers.length >= Math.max(1, Math.floor(activeRows.length * 0.4))) {
      const count = numbers.length;
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
      });
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

  const numericRollups = rollups.filter((r) => r.isNumeric && r.total !== undefined);
  if (numericRollups.length > 0) {
    for (const r of numericRollups) {
      const u = r.unit;
      const isPrefix = u === "$" || u === "€" || u === "£" || u === "¥" || u === "₹";
      const fmtTotal = isPrefix ? `${u}${r.total?.toLocaleString("en-US")}` : `${r.total?.toLocaleString("en-US")}${u}`;
      const fmtAvg = isPrefix ? `${u}${r.average?.toLocaleString("en-US")}` : `${r.average?.toLocaleString("en-US")}${u}`;
      const fmtMax = isPrefix ? `${u}${r.max?.toLocaleString("en-US")}` : `${r.max?.toLocaleString("en-US")}${u}`;
      const fmtMin = isPrefix ? `${u}${r.min?.toLocaleString("en-US")}` : `${r.min?.toLocaleString("en-US")}${u}`;

      summaryLines.push(
        `- Column "${r.header}": Total = ${fmtTotal} | Average = ${fmtAvg} | Max = ${fmtMax} (Row: "${r.maxLabel}") | Min = ${fmtMin} (Row: "${r.minLabel}")`
      );
    }

    // Look for period-over-period or YoY comparisons (e.g. 2024 vs 2025, Previous vs Current)
    if (numericRollups.length >= 2) {
      const r1 = numericRollups[0];
      const r2 = numericRollups[1];
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
