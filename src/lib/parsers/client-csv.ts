import Papa from "papaparse";
import { computeTableRollups } from "./table-rollups";
import { detectHeaderAndRows } from "./header-detector";
import { detectDelimiter } from "./delimiter-detector";

export interface ParsedCsvSummary {
  headers: string[];
  totalRows: number;
  previewRows: Array<Record<string, unknown>>;
  markdownTable: string;
}

/**
 * Client-side CSV/TSV/semicolon parser using native file.text() and Papa.parse.
 * Parses raw grid as 2D array first (header: false), auto-detects delimiter (;, \t, ,),
 * scans the first 15 rows to detect the true header row (skipping leading titles/disclaimers),
 * trims trailing empty columns, pre-computes JavaScript aggregations & rollups,
 * and formats a rich, structured prompt payload for the visual AST synthesizer.
 */
export async function parseCsvFileClientSide(file: File): Promise<ParsedCsvSummary> {
  const rawText = await file.text();
  if (!rawText || rawText.trim().length === 0) {
    throw new Error("The uploaded CSV file is empty.");
  }

  // Strip UTF-8 BOM if present
  const cleanText = rawText.replace(/^\uFEFF/, "");
  const detectedDelimiter = detectDelimiter(cleanText);

  // 1. Parse raw rows as a 2D array first (header: false) with auto-detected delimiter
  const results = Papa.parse<unknown[]>(cleanText, {
    header: false,
    skipEmptyLines: "greedy",
    dynamicTyping: true,
    delimiter: detectedDelimiter,
    delimitersToGuess: [",", ";", "\t", "|"],
  });

  const rawGrid = results.data as unknown[][];
  if (!rawGrid || rawGrid.length === 0) {
    throw new Error("No data found in the CSV file.");
  }

  // 2. Smart Header Row Detection scanning first 15 rows
  const { headers, rows } = detectHeaderAndRows(rawGrid);

  if (rows.length === 0) {
    throw new Error("No valid data rows found in the CSV file.");
  }

  // 3. Pre-compute JavaScript rollups across all columns
  const rollupsSummary = computeTableRollups(headers, rows, file.name);

  const previewRows = rows.slice(0, 50);

  // 4. Build markdown table preserving exact headers and escaped cells
  const headerLine = `| ${headers.join(" | ")} |`;
  const separatorLine = `| ${headers.map(() => "---").join(" | ")} |`;
  const rowLines = previewRows.map((row) => {
    const cells = headers.map((h) => {
      const val = row[h];
      if (val === null || val === undefined) return "";
      return String(val).replace(/\|/g, "\\|");
    });
    return `| ${cells.join(" | ")} |`;
  });

  const markdownTable = [
    rollupsSummary.formattedSummary,
    "",
    "DATA ROWS (FIRST 50):",
    headerLine,
    separatorLine,
    ...rowLines,
  ].join("\n");

  return {
    headers,
    totalRows: rows.length,
    previewRows,
    markdownTable,
  };
}
