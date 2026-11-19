import * as XLSX from "xlsx";
import { computeTableRollups } from "./table-rollups";

export interface ParsedExcelSummary {
  sheetNames: string[];
  activeSheet: string;
  totalRows: number;
  markdownTable: string;
}

/**
 * Client-side Excel parser. Converts spreadsheet array buffer into clean Markdown table
 * with pre-computed JavaScript aggregations and exact column headers.
 */
export async function parseExcelFileClientSide(file: File): Promise<ParsedExcelSummary> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error("The Excel workbook contains no valid sheets.");
  }

  const activeSheet = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[activeSheet];

  // Convert sheet to json rows
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    raw: false,
    defval: "",
  });

  if (!jsonData || jsonData.length === 0) {
    throw new Error(`Sheet '${activeSheet}' is empty.`);
  }

  const headers = Object.keys(jsonData[0] || {});
  const sampleRows = jsonData.slice(0, 50);

  // Pre-compute JavaScript rollups
  const rollupsSummary = computeTableRollups(headers, jsonData, `${file.name} [Sheet: "${activeSheet}"]`);

  const headerLine = `| ${headers.join(" | ")} |`;
  const separatorLine = `| ${headers.map(() => "---").join(" | ")} |`;
  const rowLines = sampleRows.map((row) => {
    const cells = headers.map((h) => {
      const val = row[h];
      return String(val ?? "").replace(/\|/g, "\\|");
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
    sheetNames: workbook.SheetNames,
    activeSheet,
    totalRows: jsonData.length,
    markdownTable,
  };
}
