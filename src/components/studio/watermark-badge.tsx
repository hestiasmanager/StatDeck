import React from "react";
import { StatDeckMark } from "@/components/ui/statdeck-mark";

interface WatermarkBadgeProps {
  visible?: boolean;
  className?: string;
  accentColor?: string;
}

export function WatermarkBadge({
  visible = true,
  className = "",
  accentColor = "#2563EB",
}: WatermarkBadgeProps) {
  if (!visible) return null;

  return (
    <div
      className={`inline-flex items-center gap-1.5 text-[11px] font-medium tracking-wide opacity-65 select-none transition-opacity hover:opacity-100 ${className}`}
    >
      <StatDeckMark className="w-3.5 h-3.5 flex-shrink-0" barColor={accentColor} />
      <span className="font-sans">Made with StatDeck</span>
    </div>
  );
}
