import React from "react";
import type { ChartBlock } from "@/lib/schemas/deck-schema";

interface SvgHorizontalBarProps {
  chart: ChartBlock;
  accentColor?: string;
  inkColor?: string;
}

export function SvgHorizontalBar({
  chart,
  accentColor = "#2563EB",
  inkColor = "#0F172A",
}: SvgHorizontalBarProps) {
  const data = chart.data || [];
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const rowHeight = 36;
  const chartHeight = data.length * rowHeight + 20;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 500 ${chartHeight}`}
        className="w-full overflow-visible"
        aria-label={chart.title}
      >
        {data.map((d, i) => {
          const y = i * rowHeight + 10;
          const barWidth = Math.max(12, (d.value / maxValue) * 300);
          const barFill = d.color || accentColor;

          return (
            <g key={i}>
              {/* Category Label */}
              <text
                x="0"
                y={y + 14}
                fontSize="12"
                fontWeight="500"
                fill={inkColor}
                opacity="0.85"
              >
                {d.label}
              </text>

              {/* Horizontal Bar */}
              <rect
                x="140"
                y={y}
                width={barWidth}
                height="18"
                rx="4"
                ry="4"
                fill={barFill}
                fillOpacity="0.88"
              />

              {/* Value Label */}
              <text
                x={140 + barWidth + 8}
                y={y + 14}
                fontSize="12"
                fontWeight="600"
                fill={inkColor}
              >
                {d.value}
                {chart.unit}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
