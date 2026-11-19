import Papa from "papaparse";
import { computeTableRollups } from "./table-rollups";
import { detectHeaderAndRows } from "./header-detector";

export interface NotesEnrichmentResult {
  enrichedText: string;
  hasTable: boolean;
  tableType?: "pipe" | "csv";
  rowCount?: number;
  rollupsCount?: number;
}

/**
 * Checks whether user notes contain a pipe-delimited (|) markdown table
 * or comma-delimited (CSV/TSV) data table. If detected, runs `detectHeaderAndRows`
 * and `computeTableRollups` to compute deterministic JavaScript sums, averages,
 * and column metrics, prepending them to the prompt so the LLM uses exact math.
 */
export function enrichNotesWithTableRollups(text: string): NotesEnrichmentResult {
  if (!text || text.trim().length === 0) {
    return { enrichedText: text, hasTable: false };
  }

  // Already enriched? Avoid double-prepending
  if (text.includes("PRE-COMPUTED JAVASCRIPT ROLLUPS")) {
    return { enrichedText: text, hasTable: true };
  }

  // 1. Try detecting pipe-delimited markdown table
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const pipeLines = lines.filter((l) => l.includes("|"));

  if (pipeLines.length >= 2) {
    // Parse pipe lines into 2D grid
    const rawGrid: string[][] = [];
    for (const line of pipeLines) {
      // Strip leading and trailing pipes if present
      const cleanLine = line.replace(/^\|/, "").replace(/\|$/, "");
      const cells = cleanLine.split("|").map((c) => c.trim());
      // Skip markdown divider lines (e.g. |---|---| or :---:)
      const isDivider = cells.length > 0 && cells.every((c) => /^:?-+:?$/.test(c));
      if (!isDivider && cells.length >= 2) {
        rawGrid.push(cells);
      }
    }

    if (rawGrid.length >= 2) {
      try {
        const { headers, rows } = detectHeaderAndRows(rawGrid);
        if (headers.length >= 2 && rows.length >= 1) {
          const rollupsSummary = computeTableRollups(headers, rows, "Pasted Notes Table");
          const hasNumericData = rollupsSummary.rollups.some((r) => r.isNumeric && r.total !== undefined);
          if (hasNumericData) {
            const enrichedText = `${rollupsSummary.formattedSummary}\n\nORIGINAL USER NOTES:\n${text}`;
            return {
              enrichedText,
              hasTable: true,
              tableType: "pipe",
              rowCount: rows.length,
              rollupsCount: rollupsSummary.rollups.filter((r) => r.isNumeric).length,
            };
          }
        }
      } catch (err) {
        console.warn("Failed to compute rollups for pipe table:", err);
      }
    }
  }

  // 2. Try detecting CSV or TSV tabular data
  try {
    const parseResult = Papa.parse<string[]>(text, {
      header: false,
      skipEmptyLines: true,
    });

    if (parseResult.data && parseResult.data.length >= 2) {
      // Find rows that have >= 2 columns
      const multiColRows = parseResult.data.filter((r) => Array.isArray(r) && r.length >= 2);
      if (multiColRows.length >= 2) {
        const targetColCount = multiColRows[0].length;
        const consistentRows = multiColRows.filter(
          (r) => Math.abs(r.length - targetColCount) <= 1
        );

        if (consistentRows.length >= 2) {
          const { headers, rows } = detectHeaderAndRows(consistentRows);
          // Check that headers look like table headers (not long prose sentences)
          const validHeaderLengths = headers.every((h) => h.length > 0 && h.length < 50);
          if (headers.length >= 2 && rows.length >= 1 && validHeaderLengths) {
            const rollupsSummary = computeTableRollups(headers, rows, "Pasted CSV Notes");
            const hasNumericData = rollupsSummary.rollups.some((r) => r.isNumeric && r.total !== undefined);
            if (hasNumericData) {
              const enrichedText = `${rollupsSummary.formattedSummary}\n\nORIGINAL USER NOTES:\n${text}`;
              return {
                enrichedText,
                hasTable: true,
                tableType: "csv",
                rowCount: rows.length,
                rollupsCount: rollupsSummary.rollups.filter((r) => r.isNumeric).length,
              };
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn("Failed to compute rollups for CSV notes:", err);
  }

  return { enrichedText: text, hasTable: false };
}
