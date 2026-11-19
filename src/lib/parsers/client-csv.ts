import Papa from "papaparse";
import { computeTableRollups } from "./table-rollups";

export interface ParsedCsvSummary {
  headers: string[];
  totalRows: number;
  previewRows: Array<Record<string, unknown>>;
  markdownTable: string;
}

/**
 * Client-side CSV/TSV parser using native file.text() and synchronous Papa.parse.
 * Preserves exact column headers, pre-computes JavaScript aggregations & rollups,
 * and formats a rich, structured prompt payload for the visual AST synthesizer.
 */
export async function parseCsvFileClientSide(file: File): Promise<ParsedCsvSummary> {
  const rawText = await file.text();
  if (!rawText || rawText.trim().length === 0) {
    throw new Error("The uploaded CSV file is empty.");
  }

  // Strip UTF-8 BOM if present
  const cleanText = rawText.replace(/^\uFEFF/, "");

  const results = Papa.parse(cleanText, {
    header: true,
    skipEmptyLines: "greedy",
    dynamicTyping: true,
  });

  // Filter out completely empty rows
  const rawData = (results.data as Array<Record<string, unknown>>).filter(
    (row) => row && Object.values(row).some((val) => val !== null && val !== undefined && String(val).trim() !== "")
  );

  if (!rawData || rawData.length === 0) {
    throw new Error("No valid data rows found in the CSV file.");
  }

  let headers = (results.meta.fields || []).map((h) => h?.trim()).filter(Boolean);
  if (headers.length === 0 && rawData.length > 0) {
    headers = Object.keys(rawData[0] || {}).map((h) => h?.trim()).filter(Boolean);
  }
  if (headers.length === 0) {
    headers = ["Item", "Value", "Metric"];
  }

  // Pre-compute JavaScript rollups across all columns
  const rollupsSummary = computeTableRollups(headers, rawData, file.name);

  const previewRows = rawData.slice(0, 50);

  // Build markdown table preserving exact headers and escaped cells
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
    totalRows: rawData.length,
    previewRows,
    markdownTable,
  };
}
