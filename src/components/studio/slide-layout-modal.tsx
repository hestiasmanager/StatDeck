"use client";

import React from "react";
import {
  X,
  BarChart,
  BarChartHorizontal,
  PieChart,
  TrendingUp,
  Table,
  CheckCircle,
  Layers,
  Sparkles,
} from "lucide-react";
import type { DeckAST, ChartType, BlockType } from "@/lib/schemas/deck-schema";

interface SlideLayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  ast: DeckAST;
  currentSlideIndex: number;
  onUpdateChartType: (chartIndex: number, newType: ChartType) => void;
  onUpdateBlockType: (blockIndex: number, newType: BlockType) => void;
}

export function SlideLayoutModal({
  isOpen,
  onClose,
  ast,
  currentSlideIndex,
  onUpdateChartType,
  onUpdateBlockType,
}: SlideLayoutModalProps) {
  if (!isOpen) return null;

  // Determine what type of slide currentSlideIndex corresponds to
  let slideType: "cover" | "kpi" | "chart" | "block" = "cover";
  let targetIndex = 0;

  if (currentSlideIndex === 0) {
    slideType = "cover";
  } else {
    let indexTracker = 1;
    if (ast.kpis && ast.kpis.length > 0) {
      if (currentSlideIndex === indexTracker) {
        slideType = "kpi";
      }
      indexTracker++;
    }

    if (slideType !== "kpi") {
      const chartCount = ast.charts.length;
      if (currentSlideIndex < indexTracker + chartCount) {
        slideType = "chart";
        targetIndex = currentSlideIndex - indexTracker;
      } else {
        slideType = "block";
        targetIndex = currentSlideIndex - indexTracker - chartCount;
      }
    }
  }

  const activeChart = slideType === "chart" ? ast.charts[targetIndex] : null;
  const activeBlock = slideType === "block" ? ast.blocks[targetIndex] : null;

  const chartOptions: Array<{ type: ChartType; label: string; desc: string; icon: React.ReactNode }> = [
    {
      type: "bar",
      label: "Vertical Bar Chart",
      desc: "Standard vertical column comparison",
      icon: <BarChart className="w-4 h-4 text-blue-500" />,
    },
    {
      type: "horizontal_bar",
      label: "Horizontal Bar Chart",
      desc: "Ideal for long category labels and rankings",
      icon: <BarChartHorizontal className="w-4 h-4 text-blue-500" />,
    },
    {
      type: "donut",
      label: "Donut / Share Chart",
      desc: "Portion-of-whole composition and breakdown",
      icon: <PieChart className="w-4 h-4 text-blue-500" />,
    },
    {
      type: "line",
      label: "Line Trend Chart",
      desc: "Time-series trajectory and continuous growth",
      icon: <TrendingUp className="w-4 h-4 text-blue-500" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Slide Layout Settings (Slide {currentSlideIndex + 1})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {slideType === "chart" && activeChart ? (
          <div className="flex flex-col gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Swap visualization type for <strong>{activeChart.title || "this chart"}</strong> in 1 click:
            </span>
            <div className="grid grid-cols-1 gap-2">
              {chartOptions.map((opt) => {
                const isSelected = activeChart.type === opt.type;
                return (
                  <button
                    key={opt.type}
                    onClick={() => {
                      onUpdateChartType(targetIndex, opt.type);
                      onClose();
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-500"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        {opt.icon}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                          {opt.label}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                          {opt.desc}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                        Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : slideType === "kpi" ? (
          <div className="flex flex-col gap-3 text-xs text-slate-600 dark:text-slate-300">
            <p>
              This is your <strong>Core Metrics Slide</strong>. You can click on any metric value or label directly on the canvas to edit in real time.
            </p>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="font-semibold block mb-1">Total KPIs: {ast.kpis?.length ?? 0}</span>
              <span className="text-slate-500 text-[11px]">
                Numbers automatically use character-length-aware responsive scaling without truncation.
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 text-xs text-slate-600 dark:text-slate-300">
            <p>
              Layout customization is active. You can edit headlines, labels, and citations directly by clicking any text on the slide canvas.
            </p>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
