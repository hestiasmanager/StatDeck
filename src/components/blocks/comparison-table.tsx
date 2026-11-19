import React from "react";
import type { ComparisonRowSchema } from "@/lib/schemas/deck-schema";
import { z } from "zod";

type ComparisonRow = z.infer<typeof ComparisonRowSchema>;

interface ComparisonTableBlockProps {
  title?: string;
  headers: string[];
  rows: ComparisonRow[];
  inkColor?: string;
  surfaceBorder?: string;
  accentColor?: string;
}

/**
 * Resolves flat cells for a row 1-to-1 matching headers,
 * prioritizing row.cells, with fallback to legacy row properties.
 */
export function getRowCells(row: ComparisonRow, targetCount: number): string[] {
  let cells: string[] = [];

  if (Array.isArray(row.cells) && row.cells.length > 0) {
    cells = [...row.cells];
  } else if (Array.isArray(row.values) && row.values.length > 0) {
    if (row.values.length === targetCount || row.values[0] === row.feature) {
      cells = [...row.values];
    } else {
      cells = [row.feature || "", ...row.values];
    }
  } else {
    cells = [
      row.feature || "",
      row.colA || "",
      ...(row.colB ? [row.colB] : []),
    ];
  }

  // Expand any cells that contain " | "
  const expanded: string[] = [];
  for (const c of cells) {
    if (typeof c === "string" && c.includes(" | ")) {
      expanded.push(...c.split(" | ").map((s) => s.trim()));
    } else {
      expanded.push(typeof c === "string" ? c.trim() : String(c ?? ""));
    }
  }

  return expanded;
}

// Alias for backwards compatibility
export const resolveRowCells = getRowCells;

export function ComparisonTableBlock({
  title,
  headers,
  rows,
  inkColor = "#0F172A",
  surfaceBorder = "#E2E8F0",
  accentColor = "#2563EB",
}: ComparisonTableBlockProps) {
  // If any header contains " | ", split it into separate columns
  const displayHeaders = headers.flatMap((h) =>
    typeof h === "string" && h.includes(" | ") ? h.split(" | ").map((s) => s.trim()) : [h]
  );

  return (
    <div className="w-full flex flex-col gap-3">
      {title && (
        <h4 className="text-sm font-bold uppercase tracking-wider opacity-80" style={{ color: inkColor }}>
          {title}
        </h4>
      )}
      <div className="w-full overflow-hidden rounded-xl border" style={{ borderColor: surfaceBorder }}>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b" style={{ borderColor: surfaceBorder }}>
              {displayHeaders.map((header, colIdx) => (
                <th
                  key={colIdx}
                  className={`py-2.5 px-3 font-semibold ${
                    colIdx === 0
                      ? "opacity-70"
                      : colIdx === displayHeaders.length - 1
                      ? "font-bold"
                      : "opacity-90"
                  }`}
                  style={{
                    color: colIdx === displayHeaders.length - 1 ? accentColor : inkColor,
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const cells = getRowCells(row, displayHeaders.length);

              return (
                <tr
                  key={idx}
                  className="border-b last:border-b-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  style={{ borderColor: surfaceBorder }}
                >
                  {displayHeaders.map((_, colIdx) => {
                    const rawVal = cells[colIdx];
                    const val = rawVal && rawVal.trim() !== "" ? rawVal : "—";
                    return (
                      <td
                        key={colIdx}
                        className={`py-2.5 px-3 ${
                          colIdx === 0
                            ? "font-medium opacity-80"
                            : colIdx === displayHeaders.length - 1
                            ? "font-semibold"
                            : "opacity-80"
                        }`}
                        style={{ color: inkColor }}
                      >
                        {val}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
