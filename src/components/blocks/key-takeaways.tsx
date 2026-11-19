import React from "react";
import { CheckCircle } from "lucide-react";

interface KeyTakeawaysBlockProps {
  title?: string;
  bullets: Array<{ headline: string; detail: string }>;
  accentColor: string;
  inkColor: string;
  surfaceBorder: string;
}

export function KeyTakeawaysBlock({
  title = "Key Takeaways",
  bullets,
  accentColor,
  inkColor,
  surfaceBorder,
}: KeyTakeawaysBlockProps) {
  if (!bullets || bullets.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {title && (
        <h4 className="text-base font-bold tracking-tight" style={{ color: inkColor }}>
          {title}
        </h4>
      )}
      <div className="flex flex-col gap-3">
        {bullets.map((bullet, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 p-3.5 rounded-xl border transition-all"
            style={{ borderColor: surfaceBorder }}
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
            >
              <CheckCircle className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold" style={{ color: inkColor }}>
                {bullet.headline}
              </span>
              <span className="text-[11px] opacity-75 leading-relaxed" style={{ color: inkColor }}>
                {bullet.detail}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
