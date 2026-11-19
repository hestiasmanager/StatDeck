"use client";

import React, { useState } from "react";
import type { ChartBlock } from "@/lib/schemas/deck-schema";
import { formatChartValue } from "./chart-format";

interface SvgLineChartProps {
  chart: ChartBlock;
  accentColor?: string;
  inkColor?: string;
}

/**
 * Computes a smooth cubic bezier SVG path across points using Catmull-Rom spline conversion.
 */
function getSmoothCurvedPath(points: { x: number; y: number }[]): string {
  if (points.length <= 1) return "";
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const prev = points[i - 1] || current;
    const afterNext = points[i + 2] || next;

    const cp1x = current.x + (next.x - prev.x) / 6;
    const cp1y = current.y + (next.y - prev.y) / 6;
    const cp2x = next.x - (afterNext.x - current.x) / 6;
    const cp2y = next.y - (afterNext.y - current.y) / 6;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${next.x.toFixed(1)} ${next.y.toFixed(1)}`;
  }
  return d;
}

export function SvgLineChart({
  chart,
  accentColor = "#2563EB",
  inkColor = "#0F172A",
}: SvgLineChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const data = chart.data || [];
  if (data.length === 0) return null;

  const width = 500;
  const height = 230;
  const paddingX = 44;
  const paddingY = 36;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const minValue = Math.min(...data.map((d) => d.value), 0);
  const range = maxValue - minValue || 1;

  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1 || 1)) * (width - 2 * paddingX);
    const y = height - paddingY - ((d.value - minValue) / range) * (height - 2 * paddingY);
    return { x, y, ...d, originalIndex: i };
  });

  const smoothPathD = getSmoothCurvedPath(points);
  const areaD = `${smoothPathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  // Find Min, Max, and Latest indices for editorial badges
  let maxIdx = 0;
  let minIdx = 0;
  data.forEach((d, i) => {
    if (d.value > data[maxIdx].value) maxIdx = i;
    if (d.value < data[minIdx].value) minIdx = i;
  });
  const latestIdx = data.length - 1;

  // Grid levels
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="w-full flex flex-col items-center select-none">
      <svg viewBox={`0 0 ${width} ${height + 20}`} className="w-full max-h-[290px] overflow-visible">
        {/* Subtle Horizontal Dashed Gridlines */}
        {gridLevels.map((lvl) => {
          const y = height - paddingY - lvl * (height - 2 * paddingY);
          return (
            <line
              key={lvl}
              x1={paddingX}
              y1={y}
              x2={width - paddingX}
              y2={y}
              stroke={inkColor}
              strokeOpacity="0.08"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
          );
        })}

        {/* Baseline */}
        <line
          x1={paddingX}
          y1={height - paddingY}
          x2={width - paddingX}
          y2={height - paddingY}
          stroke={inkColor}
          strokeOpacity="0.15"
          strokeWidth="1.5"
        />

        {/* Gradient fill defs */}
        <defs>
          <linearGradient id={`area-grad-${chart.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.38" />
            <stop offset="60%" stopColor={accentColor} stopOpacity="0.12" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Smooth Area fill */}
        <path d={areaD} fill={`url(#area-grad-${chart.id})`} />

        {/* Smooth Stroke line */}
        <path
          d={smoothPathD}
          fill="none"
          stroke={accentColor}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data Points & Callout Badges */}
        {points.map((p, idx) => {
          const isMax = idx === maxIdx;
          const isMin = idx === minIdx && minIdx !== maxIdx;
          const isLatest = idx === latestIdx && idx !== maxIdx && idx !== minIdx;
          const isHovered = hoveredIdx === idx;
          const showPill = isMax || isMin || isLatest || isHovered;

          let badgeLabel = "";
          const fmtVal = formatChartValue(p.value, chart.unit);
          if (isHovered) badgeLabel = fmtVal;
          else if (isMax) badgeLabel = `High: ${fmtVal}`;
          else if (isMin) badgeLabel = `Low: ${fmtVal}`;
          else if (isLatest) badgeLabel = `Latest: ${fmtVal}`;

          const pillWidth = Math.max(76, badgeLabel.length * 6.5 + 16);

          return (
            <g
              key={idx}
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Outer halo on hover */}
              {isHovered && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="10"
                  fill={accentColor}
                  fillOpacity="0.25"
                  className="animate-pulse"
                />
              )}

              {/* Point circle */}
              <circle
                cx={p.x}
                cy={p.y}
                r={isHovered ? "6" : isMax || isLatest ? "5" : "4"}
                fill={isMax ? "#10B981" : isMin ? "#F43F5E" : accentColor}
                stroke="#FFFFFF"
                strokeWidth="2.5"
                filter="drop-shadow(0px 1px 3px rgba(0,0,0,0.2))"
              />

              {/* Labeled Pill Badge above key points */}
              {showPill && (
                <g className="pointer-events-none transition-all duration-200">
                  <rect
                    x={p.x - pillWidth / 2}
                    y={Math.max(6, p.y - 28)}
                    width={pillWidth}
                    height="19"
                    rx="5"
                    fill={isHovered || isMax ? inkColor : `${inkColor}DD`}
                    filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.2))"
                  />
                  <text
                    x={p.x}
                    y={Math.max(6, p.y - 28) + 13}
                    textAnchor="middle"
                    fontSize="9.5"
                    fontWeight="700"
                    fontFamily="var(--font-jetbrains-mono), monospace"
                    className="tabular-nums"
                    fill="#FFFFFF"
                  >
                    {badgeLabel}
                  </text>
                </g>
              )}

              {/* X-axis category label */}
              <text
                x={p.x}
                y={height - paddingY + 18}
                textAnchor="middle"
                fontSize="10"
                fontWeight={isHovered ? "600" : "500"}
                fill={inkColor}
                opacity={isHovered ? 1 : 0.75}
              >
                {p.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
