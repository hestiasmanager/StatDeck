import Papa from "papaparse";
import { computeTableRollups } from "./table-rollups";
import { detectHeaderAndRows } from "./header-detector";
import { detectDelimiter } from "./delimiter-detector";

export interface NotesEnrichmentResult {
  enrichedText: string;
  hasTable: boolean;
  tableType?: "pipe" | "csv";
  rowCount?: number;
  rollupsCount?: number;
}

/**
 * Bounds the final prompt payload safely under 45,000 characters,
 * avoiding the 50,000-char RequestBodySchema rejection while preserving
 * 100% accurate JavaScript pre-computed rollups across all rows.
 */
function capEnrichedText(
  summaryHeader: string,
  originalText: string,
  totalRows?: number
): string {
  const MAX_TOTAL_CHARS = 45000;
  const headerBlock = `${summaryHeader}\n\nORIGINAL USER NOTES:\n`;
  const availableSpace = MAX_TOTAL_CHARS - headerBlock.length - 200;

  if (originalText.length <= availableSpace) {
    return `${headerBlock}${originalText}`;
  }

  // Clean boundary truncation at a newline
  const sliceCandidate = originalText.slice(0, Math.max(500, availableSpace));
  const lastNewline = sliceCandidate.lastIndexOf("\n");
  const cleanSlice = lastNewline > 200 ? sliceCandidate.slice(0, lastNewline) : sliceCandidate;
  const omittedChars = originalText.length - cleanSlice.length;

  return `${headerBlock}${cleanSlice}\n\n[... truncated ${omittedChars.toLocaleString()} characters of additional rows for brevity; exact totals and metrics across all ${totalRows ?? "all"} rows are pre-computed above ...]`;
}

/**
 * Checks whether user notes contain a pipe-delimited (|) markdown table
 * or comma-delimited (CSV/TSV/semicolon) data table. If detected, runs `detectHeaderAndRows`
 * and `computeTableRollups` to compute deterministic JavaScript sums, averages,
 * and column metrics across ALL rows locally first, prepending them to the prompt.
 *
 * Caps the raw ORIGINAL USER NOTES so the total payload sent to /api/extract
 * stays safely under 45,000 characters (preserving 100% accurate totals).
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
          const hasNumericData = rollupsSummary.rollups.some(
            (r) => r.isNumeric && (r.total !== undefined || r.isMixedCurrency)
          );
          if (hasNumericData) {
            const enrichedText = capEnrichedText(rollupsSummary.formattedSummary, text, rows.length);
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

  // 2. Try detecting CSV, TSV, or Semicolon (;) tabular data
  try {
    const detectedDelim = detectDelimiter(text);
    const parseResult = Papa.parse<string[]>(text, {
      header: false,
      skipEmptyLines: true,
      delimiter: detectedDelim,
      delimitersToGuess: [",", ";", "\t", "|"],
    });

    if (parseResult.data && parseResult.data.length >= 2) {
      // Find rows that have >= 2 columns
      const multiColRows = parseResult.data.filter((r) => Array.isArray(r) && r.length >= 2);
      if (multiColRows.length >= 2) {
        // Find the dominant (mode) column count among multi-column rows
        // so leading titles or trailing narrative sentences don't distort table filtering
        const colFrequencies: Record<number, number> = {};
        for (const row of multiColRows) {
          colFrequencies[row.length] = (colFrequencies[row.length] || 0) + 1;
        }

        let targetColCount = 2;
        let maxFreq = 0;
        for (const [colLenStr, freq] of Object.entries(colFrequencies)) {
          const colLen = Number(colLenStr);
          if (freq > maxFreq) {
            maxFreq = freq;
            targetColCount = colLen;
          }
        }

        const consistentRows = multiColRows.filter(
          (r) => Math.abs(r.length - targetColCount) <= 1
        );

        if (consistentRows.length >= 2) {
          const { headers, rows } = detectHeaderAndRows(consistentRows);
          // Check that headers look like table headers (not long prose sentences)
          const validHeaderLengths = headers.every((h) => h.length > 0 && h.length < 50);
          if (headers.length >= 2 && rows.length >= 1 && validHeaderLengths) {
            const rollupsSummary = computeTableRollups(headers, rows, "Pasted CSV Notes");
            const hasNumericData = rollupsSummary.rollups.some(
              (r) => r.isNumeric && (r.total !== undefined || r.isMixedCurrency)
            );
            if (hasNumericData) {
              const enrichedText = capEnrichedText(rollupsSummary.formattedSummary, text, rows.length);
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

  // Safe fallback for non-table raw text > 45,000 characters
  if (text.length > 45000) {
    const cleanSlice = text.slice(0, 44000);
    const lastNewline = cleanSlice.lastIndexOf("\n");
    const finalSlice = lastNewline > 1000 ? cleanSlice.slice(0, lastNewline) : cleanSlice;
    return {
      enrichedText: `${finalSlice}\n\n[... truncated ${text.length - finalSlice.length} characters for brevity ...]`,
      hasTable: false,
    };
  }

  return { enrichedText: text, hasTable: false };
}
