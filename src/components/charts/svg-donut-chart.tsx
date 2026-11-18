import React from "react";
import type { ChartBlock } from "@/lib/schemas/deck-schema";

interface SvgDonutChartProps {
  chart: ChartBlock;
  colorPalette?: string[];
  inkColor?: string;
}

const DEFAULT_PALETTE = ["#2563EB", "#3B82F6", "#60A5FA", "#93C5FD", "#10B981", "#F59E0B"];

export function SvgDonutChart({
  chart,
  colorPalette = DEFAULT_PALETTE,
  inkColor = "#0F172A",
}: SvgDonutChartProps) {
  const data = chart.data || [];
  if (data.length === 0) return null;

  const total = data.reduce((acc, curr) => acc + curr.value, 0) || 1;
  const radius = 70;
  const strokeWidth = 26;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="w-full flex flex-col md:flex-row items-center justify-center gap-6 py-2">
      {/* Donut SVG */}
      <div className="relative w-44 h-44 flex items-center justify-center">
        <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90 transform">
          {data.map((d, i) => {
            const percent = d.value / total;
            const strokeDasharray = `${percent * circumference} ${circumference}`;
            const strokeDashoffset = -accumulatedPercent * circumference;
            accumulatedPercent += percent;
            const strokeColor = d.color || colorPalette[i % colorPalette.length];

            return (
              <circle
                key={i}
                cx="100"
                cy="100"
                r={radius}
                fill="transparent"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-bold" style={{ color: inkColor }}>
            100%
          </span>
          <span className="text-[10px] uppercase tracking-wider opacity-60" style={{ color: inkColor }}>
            Total
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2 max-w-xs">
        {data.map((d, i) => {
          const color = d.color || colorPalette[i % colorPalette.length];
          const pct = Math.round((d.value / total) * 100);
          const hasPercentSign = String(d.value).endsWith("%");
          const isPercentUnit = chart.unit === "%" || chart.unit?.includes("%") || hasPercentSign;
          const valueText = isPercentUnit
            ? hasPercentSign
              ? d.value
              : `${d.value}%`
            : chart.unit === "$"
            ? `$${d.value} (${pct}%)`
            : `${d.value}${chart.unit ? ` ${chart.unit}` : ""} (${pct}%)`;

          return (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="font-medium truncate" style={{ color: inkColor }}>
                {d.label}
              </span>
              <span className="ml-auto opacity-70 font-mono" style={{ color: inkColor }}>
                {valueText}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
