import React from "react";
import { Quote } from "lucide-react";

interface CalloutQuoteBlockProps {
  quote: string;
  author: string;
  role?: string;
  accentColor?: string;
  inkColor?: string;
  surfaceBorder?: string;
}

export function CalloutQuoteBlock({
  quote,
  author,
  role,
  accentColor = "#2563EB",
  inkColor = "#0F172A",
  surfaceBorder = "#E2E8F0",
}: CalloutQuoteBlockProps) {
  return (
    <div
      className="w-full p-4 rounded-xl border relative overflow-hidden flex flex-col gap-2"
      style={{ borderColor: surfaceBorder }}
    >
      <Quote
        className="w-8 h-8 absolute right-3 bottom-2 opacity-10 pointer-events-none"
        style={{ color: accentColor }}
      />
      <p className="text-sm italic font-medium leading-relaxed pr-6" style={{ color: inkColor }}>
        &ldquo;{quote}&rdquo;
      </p>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs font-bold" style={{ color: accentColor }}>
          — {author}
        </span>
        {role && (
          <span className="text-[11px] opacity-70" style={{ color: inkColor }}>
            ({role})
          </span>
        )}
      </div>
    </div>
  );
}
