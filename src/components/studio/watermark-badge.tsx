import React from "react";
import { Sparkles } from "lucide-react";

interface WatermarkBadgeProps {
  visible?: boolean;
}

export function WatermarkBadge({ visible = true }: WatermarkBadgeProps) {
  if (!visible) return null;

  return (
    <div className="flex items-center justify-between border-t border-black/10 dark:border-white/10 pt-3 mt-4 text-xs tracking-wide opacity-75 font-mono">
      <div className="flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-blue-500" />
        <span className="font-medium">Visualized with StatDeck</span>
      </div>
      <span className="text-[11px] hover:underline cursor-pointer">statdeck.ai</span>
    </div>
  );
}
