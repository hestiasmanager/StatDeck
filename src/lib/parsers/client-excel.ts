import * as XLSX from "xlsx";

export interface ParsedExcelSummary {
  sheetNames: string[];
  activeSheet: string;
  totalRows: number;
  markdownTable: string;
}

/**
 * Client-side Excel parser. Converts spreadsheet array buffer into clean Markdown table.
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
  const sampleRows = jsonData.slice(0, 40);

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
    `Excel File: ${file.name} (Sheet: "${activeSheet}", Total Rows: ${jsonData.length})`,
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
