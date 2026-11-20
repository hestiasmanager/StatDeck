import Papa from "papaparse";
import { computeTableRollups } from "./table-rollups";
import { detectHeaderAndRows } from "./header-detector";
import { detectDelimiter } from "./delimiter-detector";
import type { DeckAST } from "@/lib/schemas/deck-schema";

/**
 * Converts a standard Google Sheets sharing or edit URL into a direct CSV export endpoint.
 */
export function normalizeGoogleSheetsUrl(inputUrl: string): string {
  const trimmed = inputUrl.trim();

  // Pattern: https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/...
  const match = trimmed.match(
    /https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/
  );

  if (match && match[1]) {
    const spreadsheetId = match[1];
    // Check if gid is present
    const gidMatch = trimmed.match(/gid=([0-9]+)/);
    const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : "";
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv${gidParam}`;
  }

  return trimmed;
}

/**
 * Refreshes an existing DeckAST with fresh CSV data, strictly preserving
 * the existing templateId, brandKitId, slide order, title, and theme tokens.
 */
export function refreshDeckWithCsvData(
  existingAst: DeckAST,
  rawCsvText: string
): DeckAST {
  if (!rawCsvText || rawCsvText.trim().length === 0) {
    throw new Error("CSV payload is empty.");
  }

  const cleanText = rawCsvText.replace(/^\uFEFF/, "");
  const delimiter = detectDelimiter(cleanText);

  const results = Papa.parse<unknown[]>(cleanText, {
    header: false,
    skipEmptyLines: "greedy",
    dynamicTyping: true,
    delimiter,
  });

  const rawGrid = results.data as unknown[][];
  const { headers, rows } = detectHeaderAndRows(rawGrid);

  if (rows.length === 0) {
    throw new Error("No data rows found in CSV.");
  }

  const rollupsSummary = computeTableRollups(headers, rows, "live-sync.csv");
  const newAst = JSON.parse(JSON.stringify(existingAst)) as DeckAST;

  // 1. Update charts with fresh rows/labels
  if (newAst.charts && newAst.charts.length > 0) {
    const primaryChart = newAst.charts[0];
    const numericCols = rollupsSummary.rollups.filter((r) => r.isNumeric && r.count > 0);

    if (numericCols.length > 0) {
      const targetCol = numericCols[0];
      const categoryCol = headers.find((h) => h !== targetCol.header) || headers[0];

      // Refresh data points preserving custom colors if any
      const updatedData = rows.slice(0, 10).map((row, idx) => {
        const existingPoint = primaryChart.data[idx];
        const rawVal = row[targetCol.header];
        const numVal =
          typeof rawVal === "number"
            ? rawVal
            : parseFloat(String(rawVal).replace(/[^0-9.-]+/g, "")) || 0;

        return {
          label: String(row[categoryCol] || `Item ${idx + 1}`),
          value: numVal,
          color: existingPoint?.color,
          sourceRow: idx + 2,
        };
      });

      if (updatedData.length >= 2) {
        primaryChart.data = updatedData;
      }
    }
  }

  // 2. Update KPIs with fresh summary totals and rollups
  if (newAst.kpis && newAst.kpis.length > 0) {
    const numericCols = rollupsSummary.rollups.filter((r) => r.isNumeric && r.count > 0);
    newAst.kpis.forEach((kpi, idx) => {
      const col = numericCols[idx % numericCols.length];
      if (col && col.total !== undefined) {
        if (idx === 0) {
          kpi.value = `${col.unit || ""}${col.total.toLocaleString()}`;
          kpi.label = `Total ${col.header}`;
          kpi.sourceRow = "Computed Rollup (Sum)";
        } else if (idx === 1 && col.average !== undefined) {
          kpi.value = `${col.unit || ""}${Math.round(col.average).toLocaleString()}`;
          kpi.label = `Average ${col.header}`;
          kpi.sourceRow = "Computed Rollup (Avg)";
        }
      }
    });
  }

  return newAst;
}
