"use client";

import React, { useState } from "react";
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
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const data = chart.data || [];
  if (data.length === 0) return null;

  const total = data.reduce((acc, curr) => acc + curr.value, 0) || 1;
  const radius = 68;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  // Find top metric for center display default
  const topItem = [...data].sort((a, b) => b.value - a.value)[0];
  const activeItem = hoveredIdx !== null ? data[hoveredIdx] : topItem;
  const activePercent = Math.round((activeItem.value / total) * 100);

  let accumulatedPercent = 0;

  return (
    <div className="w-full flex flex-col md:flex-row items-center justify-center gap-8 py-3 select-none">
      {/* Donut SVG */}
      <div className="relative w-48 h-48 flex items-center justify-center flex-shrink-0">
        <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90 transform overflow-visible">
          {/* Subtle Track circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="transparent"
            stroke={inkColor}
            strokeOpacity="0.06"
            strokeWidth={strokeWidth}
          />

          {data.map((d, i) => {
            const percent = d.value / total;
            const strokeDasharray = `${Math.max(2, percent * circumference - 2)} ${circumference}`;
            const strokeDashoffset = -accumulatedPercent * circumference;
            accumulatedPercent += percent;
            const strokeColor = d.color || colorPalette[i % colorPalette.length];
            const isHovered = hoveredIdx === i;

            return (
              <circle
                key={i}
                cx="100"
                cy="100"
                r={radius}
                fill="transparent"
                stroke={strokeColor}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="cursor-pointer transition-all duration-200"
                style={{
                  opacity: hoveredIdx !== null && !isHovered ? 0.45 : 1,
                  filter: isHovered ? "drop-shadow(0px 2px 6px rgba(0,0,0,0.25))" : undefined,
                }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}

          {/* SVG Centered Text */}
          <g className="rotate-90 origin-center pointer-events-none">
            <text
              x="100"
              y="94"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="24"
              fontWeight="800"
              fontFamily="var(--font-jetbrains-mono), monospace"
              className="tabular-nums"
              fill={inkColor}
            >
              {activePercent}%
            </text>
            <text
              x="100"
              y="115"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="10"
              fontWeight="600"
              letterSpacing="0.05em"
              className="uppercase tracking-wider opacity-60"
              fill={inkColor}
            >
              {activeItem.label.length > 14 ? `${activeItem.label.slice(0, 12)}…` : activeItem.label}
            </text>
          </g>
        </svg>
      </div>

      {/* Clean 2-Column Legend with Color Dots */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 max-w-sm w-full">
        {data.map((d, i) => {
          const color = d.color || colorPalette[i % colorPalette.length];
          const pct = Math.round((d.value / total) * 100);
          const isHovered = hoveredIdx === i;

          return (
            <div
              key={i}
              className={`flex items-center justify-between gap-2 text-xs p-1.5 rounded-lg cursor-pointer transition-all ${
                isHovered ? "bg-black/5 dark:bg-white/10 ring-1 ring-current/20" : ""
              }`}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-2xs"
                  style={{ backgroundColor: color }}
                />
                <span
                  className={`truncate ${isHovered ? "font-bold" : "font-medium"}`}
                  style={{ color: inkColor }}
                  title={d.label}
                >
                  {d.label}
                </span>
              </div>
              <span
                className="font-mono text-[11px] font-bold opacity-80 tabular-nums flex-shrink-0"
                style={{ color: inkColor }}
              >
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
