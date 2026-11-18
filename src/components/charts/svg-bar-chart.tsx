import React from "react";
import type { ChartBlock } from "@/lib/schemas/deck-schema";

interface SvgBarChartProps {
  chart: ChartBlock;
  accentColor?: string;
  inkColor?: string;
}

export function SvgBarChart({
  chart,
  accentColor = "#2563EB",
  inkColor = "#0F172A",
}: SvgBarChartProps) {
  const data = chart.data || [];
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const chartHeight = 220;
  const barWidth = Math.max(20, Math.min(48, Math.floor(400 / (data.length * 1.5))));
  const gap = Math.floor(barWidth * 0.4);
  const totalWidth = data.length * (barWidth + gap);

  return (
    <div className="w-full flex flex-col items-center">
      <svg
        viewBox={`0 0 ${Math.max(totalWidth + 40, 480)} ${chartHeight + 60}`}
        className="w-full max-h-[300px] overflow-visible"
        aria-label={chart.title}
      >
        {/* Baseline */}
        <line
          x1="20"
          y1={chartHeight}
          x2={Math.max(totalWidth + 20, 460)}
          y2={chartHeight}
          stroke={inkColor}
          strokeOpacity="0.2"
          strokeWidth="1.5"
        />

        {data.map((d, i) => {
          const barHeight = Math.max(8, (d.value / maxValue) * (chartHeight - 40));
          const x = 30 + i * (barWidth + gap);
          const y = chartHeight - barHeight;
          const barFill = d.color || accentColor;

          return (
            <g key={i} className="transition-all duration-300">
              {/* Value Label above Bar */}
              <text
                x={x + barWidth / 2}
                y={y - 8}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill={inkColor}
              >
                {d.value}
                {chart.unit}
              </text>

              {/* Bar rectangle */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="6"
                ry="6"
                fill={barFill}
                fillOpacity="0.9"
              />

              {/* Category label below baseline */}
              <text
                x={x + barWidth / 2}
                y={chartHeight + 20}
                textAnchor="middle"
                fontSize="11"
                fill={inkColor}
                opacity="0.75"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
