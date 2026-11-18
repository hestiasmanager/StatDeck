import React from "react";
import { Check, X } from "lucide-react";

interface ProsConsBlockProps {
  title?: string;
  pros: string[];
  cons: string[];
  inkColor?: string;
  surfaceBorder?: string;
}

export function ProsConsBlock({
  title,
  pros,
  cons,
  inkColor = "#0F172A",
  surfaceBorder = "#E2E8F0",
}: ProsConsBlockProps) {
  return (
    <div className="w-full flex flex-col gap-3">
      {title && (
        <h4 className="text-sm font-bold uppercase tracking-wider opacity-80" style={{ color: inkColor }}>
          {title}
        </h4>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Pros Column */}
        <div className="p-3.5 rounded-xl border flex flex-col gap-2" style={{ borderColor: surfaceBorder }}>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
            <Check className="w-4 h-4" /> Strategic Upside
          </span>
          <ul className="flex flex-col gap-1.5 text-xs">
            {pros.map((pro, i) => (
              <li key={i} className="flex items-start gap-2" style={{ color: inkColor }}>
                <span className="text-emerald-500 font-bold">•</span>
                <span className="leading-snug opacity-90">{pro}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Cons Column */}
        <div className="p-3.5 rounded-xl border flex flex-col gap-2" style={{ borderColor: surfaceBorder }}>
          <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide flex items-center gap-1.5">
            <X className="w-4 h-4" /> Risks & Tradeoffs
          </span>
          <ul className="flex flex-col gap-1.5 text-xs">
            {cons.map((con, i) => (
              <li key={i} className="flex items-start gap-2" style={{ color: inkColor }}>
                <span className="text-rose-500 font-bold">•</span>
                <span className="leading-snug opacity-90">{con}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
