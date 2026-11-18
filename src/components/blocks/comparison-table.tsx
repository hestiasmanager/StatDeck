import React from "react";
import type { ComparisonRowSchema } from "@/lib/schemas/deck-schema";
import { z } from "zod";

type ComparisonRow = z.infer<typeof ComparisonRowSchema>;

interface ComparisonTableBlockProps {
  title?: string;
  headers: [string, string];
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
              <th className="py-2.5 px-3 font-semibold opacity-60" style={{ color: inkColor }}>
                Dimension
              </th>
              <th className="py-2.5 px-3 font-semibold" style={{ color: inkColor }}>
                {headers[0]}
              </th>
              <th className="py-2.5 px-3 font-semibold" style={{ color: accentColor }}>
                {headers[1]}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={idx}
                className="border-b last:border-b-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                style={{ borderColor: surfaceBorder }}
              >
                <td className="py-2.5 px-3 font-medium opacity-70" style={{ color: inkColor }}>
                  {row.feature}
                </td>
                <td className="py-2.5 px-3 opacity-80" style={{ color: inkColor }}>
                  {row.colA}
                </td>
                <td className="py-2.5 px-3 font-semibold" style={{ color: inkColor }}>
                  {row.colB}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
