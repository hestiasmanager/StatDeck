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
 * Resolves atomic cell strings for a comparison table row, ensuring
 * that any joined pipe string (e.g. "$42,500 | $48,100 | $51,000") is split
 * into its own column cells and the total cell count strictly matches headers.
 */
export function resolveRowCells(row: ComparisonRow, targetCount: number): string[] {
  let rawSegments: string[] = [];

  if (Array.isArray(row.values) && row.values.length > 0) {
    if (row.values[0] === row.feature || row.values.length === targetCount) {
      rawSegments = [...row.values];
    } else {
      rawSegments = [row.feature, ...row.values];
    }
  } else {
    rawSegments = [row.feature, row.colA || "", ...(row.colB ? [row.colB] : [])];
  }

  // Expand any segment that contains " | "
  const expanded: string[] = [];
  for (const seg of rawSegments) {
    if (typeof seg === "string" && seg.includes(" | ")) {
      expanded.push(...seg.split(" | ").map((s) => s.trim()));
    } else if (typeof seg === "string") {
      expanded.push(seg.trim());
    } else {
      expanded.push("");
    }
  }

  // Guarantee exact length matching targetCount
  while (expanded.length < targetCount) {
    expanded.push("");
  }
  return expanded.slice(0, targetCount);
}

export function ComparisonTableBlock({
  title,
  headers,
  rows,
  inkColor = "#0F172A",
  surfaceBorder = "#E2E8F0",
  accentColor = "#2563EB",
}: ComparisonTableBlockProps) {
  const hasColB = rows.some((r) => r.colB && r.colB.trim().length > 0);

  // If any header contains " | ", split it into separate columns
  let displayHeaders: string[] = [];
  for (const h of headers) {
    if (typeof h === "string" && h.includes(" | ")) {
      displayHeaders.push(...h.split(" | ").map((s) => s.trim()));
    } else if (typeof h === "string") {
      displayHeaders.push(h.trim());
    }
  }

  // If 2 headers are provided but rows contain 3 populated columns (feature, colA, colB),
  // infer leading header contextually rather than hardcoding static "Dimension"
  if (displayHeaders.length === 2 && hasColB) {
    displayHeaders = ["Metric / Dimension", displayHeaders[0], displayHeaders[1]];
  }

  // Ensure at least 2 headers
  if (displayHeaders.length < 2) {
    displayHeaders = ["Metric / Feature", "Value"];
  }

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
              const cellValues = resolveRowCells(row, displayHeaders.length);

              return (
                <tr
                  key={idx}
                  className="border-b last:border-b-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  style={{ borderColor: surfaceBorder }}
                >
                  {cellValues.map((val, cIdx) => (
                    <td
                      key={cIdx}
                      className={`py-2.5 px-3 ${
                        cIdx === 0
                          ? "font-medium opacity-80"
                          : cIdx === cellValues.length - 1
                          ? "font-semibold"
                          : "opacity-80"
                      }`}
                      style={{ color: inkColor }}
                    >
                      {val}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
