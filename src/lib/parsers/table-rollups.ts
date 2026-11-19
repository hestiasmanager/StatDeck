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

/**
 * Extracts a numeric value from a cell, stripping currency symbols, commas, and percentage signs.
 */
function parseCleanNumber(val: unknown): { num: number; unit: string } | null {
  if (val === null || val === undefined) return null;
  const str = String(val).trim();
  if (!str) return null;

  // Determine prefix unit ($ / € / £ / ¥)
  let unit = "";
  if (str.startsWith("$") || str.includes("($)")) unit = "$";
  else if (str.startsWith("€") || str.includes("(€)")) unit = "€";
  else if (str.startsWith("£") || str.includes("(£)")) unit = "£";
  else if (str.startsWith("¥") || str.includes("(¥)")) unit = "¥";
  else if (str.endsWith("%") || str.includes("(%)")) unit = "%";

  const cleanStr = str.replace(/[$,€£¥%]/g, "").replace(/,/g, "").trim();
  const num = parseFloat(cleanStr);
  if (isNaN(num)) return null;

  return { num, unit };
}

/**
 * Computes rollups (sum, avg, min, max, YoY deltas) across all columns.
 */
export function computeTableRollups(
  headers: string[],
  rows: Array<Record<string, unknown>>,
  fileName: string
): TableRollupSummary {
  const totalRows = rows.length;
  const rollups: ColumnRollup[] = [];

  // Determine label/category column (typically first non-numeric column)
  const categoryColumn = headers[0] || "Item";

  for (const header of headers) {
    const numbers: number[] = [];
    const unitsCount: Record<string, number> = {};
    const rowLabels: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
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
    if (numbers.length >= Math.max(1, Math.floor(rows.length * 0.4))) {
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
        count: rows.length,
      });
    }
  }

  // Format pre-computed summaries for the prompt
  const summaryLines: string[] = [
    `DATASET FILE: ${fileName}`,
    `TOTAL VALID ROWS: ${totalRows}`,
    `EXACT COLUMN HEADERS: [${headers.map((h) => `"${h}"`).join(", ")}]`,
    "",
    "PRE-COMPUTED JAVASCRIPT ROLLUPS (Use exact column names & computed numbers for KPIs, charts, and table headers):",
  ];

  const numericRollups = rollups.filter((r) => r.isNumeric && r.total !== undefined);
  if (numericRollups.length > 0) {
    for (const r of numericRollups) {
      const u = r.unit;
      const fmtTotal = u === "$" ? `$${r.total?.toLocaleString()}` : `${r.total?.toLocaleString()}${u}`;
      const fmtAvg = u === "$" ? `$${r.average?.toLocaleString()}` : `${r.average?.toLocaleString()}${u}`;
      const fmtMax = u === "$" ? `$${r.max?.toLocaleString()}` : `${r.max?.toLocaleString()}${u}`;
      const fmtMin = u === "$" ? `$${r.min?.toLocaleString()}` : `${r.min?.toLocaleString()}${u}`;

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
