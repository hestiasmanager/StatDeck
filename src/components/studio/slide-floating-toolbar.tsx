"use client";

import React, { useState } from "react";
import type { DeckAST, ChartType } from "@/lib/schemas/deck-schema";
import {
  BarChart2,
  BarChartHorizontal,
  PieChart,
  LineChart,
  Table,
  Sparkles,
  SlidersHorizontal,
  Loader2,
  Wand2,
  Briefcase,
  Scissors,
  FilePlus2,
  Columns,
  Grid3X3,
} from "lucide-react";

interface SlideFloatingToolbarProps {
  ast: DeckAST;
  currentSlideIndex: number;
  slideTarget:
    | { type: "cover" }
    | { type: "kpi" }
    | { type: "chart"; chartIndex: number }
    | { type: "block"; blockIndex: number }
    | null;
  onUpdateChartType: (chartIndex: number, chartType: ChartType) => void;
  onOpenChartDrawer: (chartIndex: number) => void;
  onRewriteSlide: (action: "shorten" | "detail" | "executive") => Promise<void>;
  isRewriting?: boolean;
}

export function SlideFloatingToolbar({
  ast,
  currentSlideIndex,
  slideTarget,
  onUpdateChartType,
  onOpenChartDrawer,
  onRewriteSlide,
  isRewriting = false,
}: SlideFloatingToolbarProps) {
  const [showRewriteMenu, setShowRewriteMenu] = useState(false);

  if (!slideTarget) return null;

  const currentChart =
    slideTarget.type === "chart" ? (ast.charts || [])[slideTarget.chartIndex] : null;

  return (
    <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-xl text-slate-800 dark:text-slate-100 z-30 transition-all mb-3 animate-in fade-in duration-150">
      {/* 1. Slide Badge */}
      <span className="text-[10px] font-mono font-bold uppercase text-slate-400 dark:text-slate-500 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
        Slide {currentSlideIndex + 1}
      </span>

      <div className="h-4 w-px bg-slate-200 dark:border-slate-800 mx-0.5" />

      {/* 2. Chart Type Switcher (If Active Slide is a Chart) */}
      {slideTarget.type === "chart" && currentChart && (
        <>
          <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl">
            <button
              onClick={() => onUpdateChartType(slideTarget.chartIndex, "bar")}
              className={`p-1.5 rounded-lg transition-colors ${
                currentChart.type === "bar"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
              title="Vertical Bar Chart"
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onUpdateChartType(slideTarget.chartIndex, "horizontal_bar")}
              className={`p-1.5 rounded-lg transition-colors ${
                currentChart.type === "horizontal_bar"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
              title="Horizontal Bar Chart"
            >
              <BarChartHorizontal className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onUpdateChartType(slideTarget.chartIndex, "donut")}
              className={`p-1.5 rounded-lg transition-colors ${
                currentChart.type === "donut"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
              title="Donut Chart"
            >
              <PieChart className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onUpdateChartType(slideTarget.chartIndex, "line")}
              className={`p-1.5 rounded-lg transition-colors ${
                currentChart.type === "line" || currentChart.type === "area"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
              title="Line Chart"
            >
              <LineChart className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Edit Data in Grid Drawer */}
          <button
            onClick={() => onOpenChartDrawer(slideTarget.chartIndex)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors border border-blue-200 dark:border-blue-900/50"
            title="Open Editable Chart Spreadsheet"
          >
            <Table className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">Edit Data</span>
          </button>

          <div className="h-4 w-px bg-slate-200 dark:border-slate-800 mx-0.5" />
        </>
      )}

      {/* 3. AI Rewrite 1-Click Dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowRewriteMenu((prev) => !prev)}
          disabled={isRewriting}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all border border-indigo-200 dark:border-indigo-900/50 cursor-pointer"
          title="Rewrite this slide with AI"
        >
          {isRewriting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          )}
          <span>{isRewriting ? "Rewriting..." : "AI Rewrite"}</span>
        </button>

        {showRewriteMenu && (
          <div className="absolute top-full mt-2 left-0 w-48 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-1.5 flex flex-col gap-1 z-40 animate-in fade-in duration-100">
            <button
              onClick={async () => {
                setShowRewriteMenu(false);
                await onRewriteSlide("shorten");
              }}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
            >
              <Scissors className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <div>
                <span className="block font-bold">Shorten</span>
                <span className="block text-[10px] text-slate-400 font-normal">Punchy & concise</span>
              </div>
            </button>

            <button
              onClick={async () => {
                setShowRewriteMenu(false);
                await onRewriteSlide("detail");
              }}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
            >
              <FilePlus2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <div>
                <span className="block font-bold">Add Detail</span>
                <span className="block text-[10px] text-slate-400 font-normal">Analytical depth</span>
              </div>
            </button>

            <button
              onClick={async () => {
                setShowRewriteMenu(false);
                await onRewriteSlide("executive");
              }}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
            >
              <Briefcase className="w-3.5 h-3.5 text-purple-500 shrink-0" />
              <div>
                <span className="block font-bold">Executive Tone</span>
                <span className="block text-[10px] text-slate-400 font-normal">Boardroom C-suite</span>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
