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

export function ComparisonTableBlock({
  title,
  headers,
  rows,
  inkColor = "#0F172A",
  surfaceBorder = "#E2E8F0",
  accentColor = "#2563EB",
}: ComparisonTableBlockProps) {
  const hasColB = rows.some((r) => r.colB && r.colB.trim().length > 0);

  // If 2 headers are provided but rows contain 3 populated columns (feature, colA, colB),
  // infer leading header contextually rather than hardcoding static "Dimension"
  let displayHeaders = headers;
  if (headers.length === 2 && hasColB) {
    displayHeaders = ["Metric / Dimension", headers[0], headers[1]];
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
              const cellValues: string[] = [];
              if (displayHeaders.length === 2) {
                cellValues.push(row.feature);
                cellValues.push(row.colA || row.colB || "");
              } else {
                cellValues.push(row.feature);
                cellValues.push(row.colA || "");
                if (displayHeaders.length >= 3) {
                  cellValues.push(row.colB || "");
                }
                if (row.values && row.values.length > 3) {
                  for (let c = 3; c < displayHeaders.length; c++) {
                    cellValues.push(row.values[c] || "");
                  }
                }
              }

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
