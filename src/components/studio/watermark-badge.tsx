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
}: WatermarkBadgeProps) {
  if (!visible) return null;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0F172A] border border-slate-600/50 text-[11px] leading-none shrink-0 select-none shadow-xs transition-opacity hover:opacity-95 ${className}`}
      title="StatDeck — Visual Analytics Studio"
    >
      {/* Small white rounded-square badge containing #2563EB bars */}
      <span className="w-3.5 h-3.5 rounded-[4px] bg-[#FFFFFF] flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
        <StatDeckMark
          className="w-full h-full"
          frameColor="#FFFFFF"
          innerColor="#FFFFFF"
          barColor="#2563EB"
          hasBorder={false}
        />
      </span>
      {/* Dual-tone text: 'Made with' in #CBD5E1 and 'StatDeck' in #FFFFFF font-semibold */}
      <span className="font-sans inline-flex items-center gap-1 leading-none">
        <span className="text-[#CBD5E1] font-normal">Made with</span>
        <span className="text-[#FFFFFF] font-semibold">StatDeck</span>
      </span>
    </div>
  );
}
