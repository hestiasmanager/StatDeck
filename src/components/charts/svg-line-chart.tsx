import React from "react";
import type { ChartBlock } from "@/lib/schemas/deck-schema";

interface SvgLineChartProps {
  chart: ChartBlock;
  accentColor?: string;
  inkColor?: string;
}

export function SvgLineChart({
  chart,
  accentColor = "#2563EB",
  inkColor = "#0F172A",
}: SvgLineChartProps) {
  const data = chart.data || [];
  if (data.length === 0) return null;

  const width = 480;
  const height = 220;
  const paddingX = 40;
  const paddingY = 30;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const minValue = Math.min(...data.map((d) => d.value), 0);
  const range = maxValue - minValue || 1;

  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1 || 1)) * (width - 2 * paddingX);
    const y = height - paddingY - ((d.value - minValue) / range) * (height - 2 * paddingY);
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${
    height - paddingY
  } Z`;

  return (
    <div className="w-full flex flex-col items-center">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-h-[280px] overflow-visible">
        {/* Subtle grid line */}
        <line
          x1={paddingX}
          y1={height - paddingY}
          x2={width - paddingX}
          y2={height - paddingY}
          stroke={inkColor}
          strokeOpacity="0.2"
          strokeWidth="1.5"
        />

        {/* Gradient fill */}
        <defs>
          <linearGradient id={`area-grad-${chart.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.35" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path d={areaD} fill={`url(#area-grad-${chart.id})`} />

        {/* Stroke line */}
        <path
          d={pathD}
          fill="none"
          stroke={accentColor}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots & Labels */}
        {points.map((p, idx) => (
          <g key={idx}>
            <circle
              cx={p.x}
              cy={p.y}
              r="5"
              fill={accentColor}
              stroke="#FFFFFF"
              strokeWidth="2"
            />
            {/* Value Label */}
            <text
              x={p.x}
              y={p.y - 10}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill={inkColor}
            >
              {p.value}
              {chart.unit}
            </text>
            {/* X-axis label */}
            <text
              x={p.x}
              y={height - paddingY + 18}
              textAnchor="middle"
              fontSize="10"
              fill={inkColor}
              opacity="0.75"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
