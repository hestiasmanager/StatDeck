import * as XLSX from "xlsx";
import { computeTableRollups, parseCleanNumber } from "./table-rollups";
import { detectHeaderAndRows } from "./header-detector";

export interface SheetSummary {
  name: string;
  rowCount: number;
  columnCount: number;
  score: number;
}

export interface ParsedExcelSummary {
  sheetNames: string[];
  activeSheet: string;
  sheetSummaries: SheetSummary[];
  headers: string[];
  totalRows: number;
  previewRows: Array<Record<string, unknown>>;
  markdownTable: string;
}

const LOW_VALUE_SHEET_NAMES = /^(cover|notes?|readme|instructions?|about|disclaimer|toc|index)$/i;

/**
 * Scores an individual worksheet by table density: row count, column count, and numeric cell density.
 * Penalizes empty or 1-column notes/cover sheets.
 */
function scoreSheet(
  sheetName: string,
  rawGrid: unknown[][]
): { score: number; rowCount: number; maxCols: number } {
  if (!rawGrid || rawGrid.length === 0) {
    return { score: 0, rowCount: 0, maxCols: 0 };
  }

  let nonEmptyRows = 0;
  let maxCols = 0;
  let numericCells = 0;
  let textCells = 0;

  for (const row of rawGrid) {
    if (!Array.isArray(row)) continue;
    let rowHasData = false;
    let colsInRow = 0;

    for (let c = 0; c < row.length; c++) {
      const val = row[c];
      if (val !== null && val !== undefined && String(val).trim() !== "") {
        rowHasData = true;
        colsInRow = c + 1;
        const parsed = parseCleanNumber(val);
        if (parsed !== null) {
          numericCells++;
        } else {
          textCells++;
        }
      }
    }

    if (rowHasData) {
      nonEmptyRows++;
      if (colsInRow > maxCols) {
        maxCols = colsInRow;
      }
    }
  }

  if (nonEmptyRows === 0 || maxCols === 0) {
    return { score: 0, rowCount: 0, maxCols: 0 };
  }

  // If sheet only has 1 column, it's almost certainly a readme, cover, or notes sheet
  let score = 0;
  if (maxCols <= 1) {
    score = nonEmptyRows * 0.1;
  } else {
    // Rich tabular sheets have multiple columns, numerous rows, and high numeric density
    score = nonEmptyRows * 2 + maxCols * 5 + numericCells * 4 + textCells * 1;
  }

  // Penalize typical low-value sheet names (e.g. "Cover", "Notes")
  if (LOW_VALUE_SHEET_NAMES.test(sheetName.trim())) {
    score = Math.max(0, score - 200);
  }

  return { score, rowCount: nonEmptyRows, maxCols };
}

/**
 * Client-side Excel parser. Converts spreadsheet array buffer into clean Markdown table
 * with smart header row detection, multi-sheet density scoring, and pre-computed rollups.
 */
export async function parseExcelFileClientSide(
  file: File,
  targetSheet?: string
): Promise<ParsedExcelSummary> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error("The Excel workbook contains no valid sheets.");
  }

  // Score all sheets in workbook
  const sheetSummaries: SheetSummary[] = [];
  const sheetGrids: Record<string, unknown[][]> = {};
  let bestSheet = workbook.SheetNames[0];
  let highestScore = -Infinity;

  for (const name of workbook.SheetNames) {
    const ws = workbook.Sheets[name];
    const rawGrid: unknown[][] = ws
      ? (XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as unknown[][])
      : [];
    sheetGrids[name] = rawGrid;

    const { score, rowCount, maxCols } = scoreSheet(name, rawGrid);
    sheetSummaries.push({
      name,
      rowCount,
      columnCount: maxCols,
      score,
    });

    if (score > highestScore) {
      highestScore = score;
      bestSheet = name;
    }
  }

  // Determine active sheet: user-selected targetSheet or auto-detected best sheet
  const activeSheet =
    targetSheet && workbook.SheetNames.includes(targetSheet) ? targetSheet : bestSheet;

  const activeRawGrid = sheetGrids[activeSheet] || [];
  if (activeRawGrid.length === 0) {
    throw new Error(`Sheet '${activeSheet}' is empty.`);
  }

  // Smart Header Row Detection scanning first 15 rows of the active sheet
  const { headers, rows } = detectHeaderAndRows(activeRawGrid);

  if (rows.length === 0) {
    throw new Error(`No valid data rows found in sheet '${activeSheet}'.`);
  }

  // Pre-compute JavaScript rollups across active sheet
  const rollupsSummary = computeTableRollups(
    headers,
    rows,
    `${file.name} [Sheet: "${activeSheet}"]`
  );

  const previewRows = rows.slice(0, 50);

  const headerLine = `| ${headers.join(" | ")} |`;
  const separatorLine = `| ${headers.map(() => "---").join(" | ")} |`;
  const rowLines = previewRows.map((row) => {
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
    sheetSummaries,
    headers,
    totalRows: rows.length,
    previewRows,
    markdownTable,
  };
}
