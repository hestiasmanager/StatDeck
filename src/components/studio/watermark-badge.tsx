import React from "react";
import { StatDeckMark } from "@/components/ui/statdeck-mark";

interface WatermarkBadgeProps {
  visible?: boolean;
  className?: string;
  accentColor?: string;
  customLogoUrl?: string | null;
  customLogoAlt?: string;
}

export function WatermarkBadge({
  visible = true,
  className = "",
  customLogoUrl,
  customLogoAlt = "Brand Logo",
}: WatermarkBadgeProps) {
  if (!visible && !customLogoUrl) return null;

  return (
    <div className={`inline-flex items-center gap-2 shrink-0 ${className}`}>
      {/* Custom Brand Logo (Creator/Agency) */}
      {customLogoUrl && (
        <div className="flex items-center shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={customLogoUrl}
            alt={customLogoAlt}
            className="h-5 max-w-[80px] object-contain rounded-sm"
            crossOrigin="anonymous"
          />
        </div>
      )}

      {/* Made with StatDeck pill (Visible on Free tier) */}
      {visible && (
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0F172A] border border-slate-600/50 text-[11px] leading-none shrink-0 select-none shadow-xs transition-opacity hover:opacity-95"
          title="StatDeck — Visual Analytics Studio"
        >
          <span className="w-3.5 h-3.5 rounded-[4px] bg-[#FFFFFF] flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
            <StatDeckMark
              className="w-full h-full"
              frameColor="#FFFFFF"
              innerColor="#FFFFFF"
              barColor="#2563EB"
              hasBorder={false}
            />
          </span>
          <span className="font-sans inline-flex items-center gap-1 leading-none">
            <span className="text-[#CBD5E1] font-normal">Made with</span>
            <span className="text-[#FFFFFF] font-semibold">StatDeck</span>
          </span>
        </div>
      )}
    </div>
  );
}
