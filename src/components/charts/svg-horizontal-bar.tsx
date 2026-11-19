"use client";

import React, { useState } from "react";
import type { ChartBlock } from "@/lib/schemas/deck-schema";
import { formatChartValue } from "./chart-format";

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
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const data = chart.data || [];
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const rowHeight = 40;
  const chartHeight = data.length * rowHeight + 24;
  const maxLabelLen = Math.max(...data.map((d) => (d.label || "").trim().length), 10);
  const labelWidth = Math.max(145, Math.min(195, Math.round(maxLabelLen * 7.5 + 15)));
  const barMaxAvailable = 260;
  const totalSvgWidth = labelWidth + barMaxAvailable + 85;

  // Vertical dashed gridlines at 25%, 50%, 75%, 100%
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="w-full select-none">
      <svg
        viewBox={`0 0 ${totalSvgWidth} ${chartHeight}`}
        className="w-full overflow-visible"
        aria-label={chart.title}
      >
        {/* Subtle Vertical Dashed Gridlines */}
        {gridLevels.map((lvl) => {
          const x = labelWidth + lvl * barMaxAvailable;
          return (
            <line
              key={lvl}
              x1={x}
              y1="4"
              x2={x}
              y2={chartHeight - 8}
              stroke={inkColor}
              strokeOpacity="0.08"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
          );
        })}

        {/* Rows */}
        {data.map((d, i) => {
          const y = i * rowHeight + 10;
          const barWidth = Math.max(16, (d.value / maxValue) * barMaxAvailable);
          const barFill = d.color || accentColor;
          const isHovered = hoveredIdx === i;

          return (
            <g
              key={i}
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Category Label */}
              <text
                x="0"
                y={y + 15}
                fontSize="12"
                fontWeight={isHovered ? "600" : "500"}
                fill={inkColor}
                opacity={isHovered ? 1 : 0.85}
              >
                {d.label}
              </text>

              {/* Background Bar Track */}
              <rect
                x={labelWidth}
                y={y}
                width={barMaxAvailable}
                height="20"
                rx="6"
                ry="6"
                fill={inkColor}
                fillOpacity="0.05"
              />

              {/* Horizontal Bar with rounded caps */}
              <rect
                x={labelWidth}
                y={y}
                width={barWidth}
                height="20"
                rx="6"
                ry="6"
                fill={barFill}
                fillOpacity={isHovered ? 1 : 0.88}
                filter={isHovered ? "drop-shadow(0px 2px 6px rgba(0,0,0,0.18))" : undefined}
                className="transition-all duration-200"
              />

              {/* Direct Value Label */}
              <text
                x={labelWidth + barWidth + 10}
                y={y + 15}
                fontSize="12"
                fontWeight="700"
                fontFamily="var(--font-jetbrains-mono), monospace"
                className="tabular-nums"
                fill={isHovered ? accentColor : inkColor}
              >
                {formatChartValue(d.value, chart.unit)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
