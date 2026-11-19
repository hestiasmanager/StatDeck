"use client";

import React, { useState } from "react";
import type { ChartBlock } from "@/lib/schemas/deck-schema";
import { formatChartValue } from "./chart-format";
import { SvgHorizontalBar } from "./svg-horizontal-bar";

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
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const data = chart.data || [];
  if (data.length === 0) return null;

  // Auto-switch to Horizontal Bar Chart whenever ANY label is longer than 10 characters
  // so category names never overlap or collide
  const hasLongLabels = data.some((d) => (d.label || "").trim().length > 10);
  if (hasLongLabels) {
    return <SvgHorizontalBar chart={chart} accentColor={accentColor} inkColor={inkColor} />;
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const chartHeight = 220;
  const barWidth = Math.max(22, Math.min(48, Math.floor(400 / (data.length * 1.5))));
  const gap = Math.floor(barWidth * 0.45);
  const totalWidth = data.length * (barWidth + gap);
  const viewBoxWidth = Math.max(totalWidth + 60, 480);

  // Horizontal dashed gridlines at 25%, 50%, 75%, 100%
  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  const topPadding = 25;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center select-none flex-1 min-h-0">
      <svg
        viewBox={`0 -${topPadding} ${viewBoxWidth} ${chartHeight + 65 + topPadding}`}
        className="w-full h-full max-h-full overflow-visible"
        aria-label={chart.title}
      >
        {/* Subtle Horizontal Dashed Gridlines */}
        {gridLevels.map((lvl) => {
          const y = chartHeight - lvl * (chartHeight - 40);
          const gridVal = Math.round(maxValue * lvl);
          return (
            <g key={lvl}>
              <line
                x1="24"
                y1={y}
                x2={viewBoxWidth - 24}
                y2={y}
                stroke={inkColor}
                strokeOpacity="0.08"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x="20"
                y={y + 3}
                textAnchor="end"
                fontSize="9"
                fontFamily="var(--font-jetbrains-mono), monospace"
                className="tabular-nums"
                fill={inkColor}
                opacity="0.35"
              >
                {formatChartValue(gridVal, chart.unit)}
              </text>
            </g>
          );
        })}

        {/* Baseline */}
        <line
          x1="20"
          y1={chartHeight}
          x2={viewBoxWidth - 20}
          y2={chartHeight}
          stroke={inkColor}
          strokeOpacity="0.15"
          strokeWidth="1.5"
        />

        {/* Bars & Labels */}
        {data.map((d, i) => {
          const barHeight = Math.max(8, (d.value / maxValue) * (chartHeight - 40));
          const x = 36 + i * (barWidth + gap);
          const y = chartHeight - barHeight;
          const barFill = d.color || accentColor;
          const isHovered = hoveredIdx === i;

          return (
            <g
              key={i}
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Direct Value Label above Bar */}
              <text
                x={x + barWidth / 2}
                y={y - 8}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fontFamily="var(--font-jetbrains-mono), monospace"
                className="tabular-nums"
                fill={isHovered ? accentColor : inkColor}
                opacity={isHovered ? 1 : 0.85}
              >
                {formatChartValue(d.value, chart.unit)}
              </text>

              {/* Bar rectangle with clean rounded caps */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="6"
                ry="6"
                fill={barFill}
                fillOpacity={isHovered ? 1 : 0.88}
                filter={isHovered ? "drop-shadow(0px 4px 8px rgba(0,0,0,0.15))" : undefined}
                className="transition-all duration-200"
              />

              {/* Category label below baseline */}
              <text
                x={x + barWidth / 2}
                y={chartHeight + 22}
                textAnchor="middle"
                fontSize="11"
                fontWeight={isHovered ? "600" : "500"}
                fill={inkColor}
                opacity={isHovered ? 1 : 0.75}
              >
                {d.label}
              </text>

              {/* Interactive Tooltip Callout on Hover */}
              {isHovered && (
                <g className="pointer-events-none transition-all duration-200">
                  <rect
                    x={x + barWidth / 2 - Math.max(45, (formatChartValue(d.value, chart.unit).length * 8 + 24) / 2)}
                    y={Math.max(10, y - 38)}
                    width={Math.max(90, formatChartValue(d.value, chart.unit).length * 8 + 24)}
                    height="24"
                    rx="6"
                    fill={inkColor}
                    filter="drop-shadow(0 2px 6px rgba(0,0,0,0.25))"
                  />
                  <text
                    x={x + barWidth / 2}
                    y={Math.max(10, y - 38) + 16}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fontFamily="var(--font-jetbrains-mono), monospace"
                    className="tabular-nums"
                    fill="#FFFFFF"
                  >
                    {formatChartValue(d.value, chart.unit)}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
