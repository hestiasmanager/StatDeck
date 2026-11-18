import React from "react";
import { Sparkles } from "lucide-react";

interface WatermarkBadgeProps {
  visible?: boolean;
  className?: string;
}

export function WatermarkBadge({ visible = true, className = "" }: WatermarkBadgeProps) {
  if (!visible) return null;

  return (
    <div className={`flex items-center gap-2 text-xs tracking-wide opacity-75 font-mono select-none ${className}`}>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
        <span className="font-medium">Visualized with StatDeck</span>
      </div>
      <span className="opacity-40 select-none">·</span>
      <span className="text-[11px] hover:underline cursor-pointer flex-shrink-0">statdeck.ai</span>
    </div>
  );
}
