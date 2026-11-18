import Papa from "papaparse";

export interface ParsedCsvSummary {
  headers: string[];
  totalRows: number;
  previewRows: Array<Record<string, unknown>>;
  markdownTable: string;
}

/**
 * Client-side CSV/TSV parser using native file.text() and synchronous Papa.parse.
 * Completely eliminates asynchronous web worker hangs and handles BOM / empty rows cleanly.
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

  const previewRows = rawData.slice(0, 50);

  // Build compact markdown table for the AST synthesizer
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
    `CSV Dataset: ${file.name} (Total rows: ${rawData.length})`,
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
