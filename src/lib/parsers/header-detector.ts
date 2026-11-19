import { parseCleanNumber } from "./table-rollups";

export interface HeaderDetectionResult {
  headerRowIndex: number;
  headers: string[];
  rows: Array<Record<string, unknown>>;
  totalRawRows: number;
}

/**
 * Scans the first 15 rows of a 2D raw grid (from CSV or Excel) to find the true header row.
 * Skips title, disclaimer, and blank rows, trims trailing empty columns, and provides
 * clean fallback column names for any empty header cells.
 */
export function detectHeaderAndRows(rawGrid: unknown[][]): HeaderDetectionResult {
  if (!rawGrid || rawGrid.length === 0) {
    return {
      headerRowIndex: 0,
      headers: ["Item", "Value", "Metric"],
      rows: [],
      totalRawRows: 0,
    };
  }

  const maxScanRows = Math.min(15, rawGrid.length);
  let bestRowIndex = 0;
  let highestScore = -Infinity;

  for (let r = 0; r < maxScanRows; r++) {
    const row = rawGrid[r];
    if (!row || !Array.isArray(row)) continue;

    // Filter non-empty trimmed string cells in candidate row
    const cells = row.map((c) => (c === null || c === undefined ? "" : String(c).trim()));
    const nonEmptyCells = cells.filter((c) => c.length > 0);

    // If fewer than 2 non-empty cells, penalize unless entire grid is 1 column
    if (nonEmptyCells.length < 2) {
      if (nonEmptyCells.length === 1 && highestScore < 0) {
        bestRowIndex = r;
      }
      continue;
    }

    let stringCellCount = 0;
    let numericCellCount = 0;

    for (const cell of nonEmptyCells) {
      const parsed = parseCleanNumber(cell);
      // If it parses cleanly as a pure number, it is likely data, not a header label
      if (parsed !== null && !isNaN(Number(cell.replace(/[$,€£¥%]/g, "").trim()))) {
        numericCellCount++;
      } else {
        // String labels like "Quarter", "Department", "Revenue ($)", "2024 Actuals"
        stringCellCount++;
      }
    }

    // Headers are predominantly text labels
    let score = stringCellCount * 3 - numericCellCount * 4;

    // Check correlation with following 1-4 rows (data rows should have matching column density)
    let followingRowsWithData = 0;
    const lookAheadCount = Math.min(rawGrid.length, r + 5);
    for (let nextR = r + 1; nextR < lookAheadCount; nextR++) {
      const nextRow = rawGrid[nextR];
      if (Array.isArray(nextRow)) {
        const nextNonEmpty = nextRow.filter(
          (c) => c !== null && c !== undefined && String(c).trim() !== ""
        );
        if (nextNonEmpty.length >= 2) {
          followingRowsWithData++;
        }
      }
    }

    // Strong bonus if followed by rows with matching data density
    score += followingRowsWithData * 4;

    if (score > highestScore) {
      highestScore = score;
      bestRowIndex = r;
    }
  }

  // Find the maximum column index that actually contains data in the header row or any data row
  let maxColIndex = 0;
  for (let r = bestRowIndex; r < rawGrid.length; r++) {
    const row = rawGrid[r];
    if (!Array.isArray(row)) continue;
    for (let c = row.length - 1; c >= 0; c--) {
      const val = row[c];
      if (val !== null && val !== undefined && String(val).trim() !== "") {
        if (c > maxColIndex) {
          maxColIndex = c;
        }
        break;
      }
    }
  }

  // Extract and clean header names
  const rawHeaderRow = rawGrid[bestRowIndex] || [];
  const headers: string[] = [];
  const headerCounts: Record<string, number> = {};

  for (let c = 0; c <= maxColIndex; c++) {
    const rawVal = rawHeaderRow[c];
    let name = rawVal !== null && rawVal !== undefined ? String(rawVal).trim() : "";
    if (!name) {
      name = `Column ${c + 1}`;
    }

    // Deduplicate duplicate column headers (e.g. "Total", "Total (2)")
    if (headerCounts[name] !== undefined) {
      headerCounts[name]++;
      headers.push(`${name} (${headerCounts[name]})`);
    } else {
      headerCounts[name] = 1;
      headers.push(name);
    }
  }

  // Build row objects from bestRowIndex + 1 onwards, skipping completely blank rows
  const rows: Array<Record<string, unknown>> = [];
  for (let r = bestRowIndex + 1; r < rawGrid.length; r++) {
    const row = rawGrid[r];
    if (!Array.isArray(row)) continue;

    let hasData = false;
    const rowObj: Record<string, unknown> = {};

    for (let c = 0; c <= maxColIndex; c++) {
      const val = row[c];
      const strVal = val !== null && val !== undefined ? String(val).trim() : "";
      if (strVal.length > 0) {
        hasData = true;
      }
      rowObj[headers[c]] = val !== null && val !== undefined ? val : "";
    }

    if (hasData) {
      rows.push(rowObj);
    }
  }

  return {
    headerRowIndex: bestRowIndex,
    headers,
    rows,
    totalRawRows: rawGrid.length,
  };
}
