"use client";

import React, { useState } from "react";
import type { DeckAST } from "@/lib/schemas/deck-schema";
import {
  Layers,
  Plus,
  Copy,
  Trash2,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  CheckCircle,
  Table,
  FileText,
  Sparkles,
  ArrowUpDown,
} from "lucide-react";

export interface SlideItemMeta {
  id: string;
  index: number;
  type: "cover" | "kpi" | "chart" | "block";
  title: string;
  subType?: string;
}

interface SlideFilmstripProps {
  ast: DeckAST;
  currentSlideIndex: number;
  totalSlides: number;
  onSelectSlide: (index: number) => void;
  onReorderSlide?: (fromIndex: number, toIndex: number) => void;
  onDuplicateSlide?: (index: number) => void;
  onDeleteSlide?: (index: number) => void;
  onAddSlide?: (type: "kpi" | "chart" | "takeaways" | "table") => void;
  accentColor?: string;
}

export function SlideFilmstrip({
  ast,
  currentSlideIndex,
  totalSlides,
  onSelectSlide,
  onReorderSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onAddSlide,
  accentColor = "#2563EB",
}: SlideFilmstripProps) {
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  // Generate slide metadata sequence matching canvas builders
  const slideItems: SlideItemMeta[] = [];

  // Slide 1: Cover
  slideItems.push({
    id: "cover",
    index: 0,
    type: "cover",
    title: ast.meta.title || "Cover Slide",
  });

  // Slide 2: KPIs (if present)
  let currentIndex = 1;
  if (ast.kpis && ast.kpis.length > 0) {
    slideItems.push({
      id: "kpis",
      index: currentIndex,
      type: "kpi",
      title: "Core Metrics",
    });
    currentIndex++;
  }

  // Slide 3+: Charts
  ast.charts.forEach((chart, cIdx) => {
    slideItems.push({
      id: chart.id || `chart-${cIdx}`,
      index: currentIndex,
      type: "chart",
      title: chart.title || `Chart ${cIdx + 1}`,
      subType: chart.type,
    });
    currentIndex++;
  });

  // Slide 4+: Blocks
  ast.blocks.forEach((block, bIdx) => {
    const blockTitle =
      "title" in block && block.title
        ? block.title
        : block.type === "callout_quote"
        ? (block as { quote?: string }).quote?.slice(0, 24) || "Executive Quote"
        : `Block ${bIdx + 1}`;

    slideItems.push({
      id: block.id || `block-${bIdx}`,
      index: currentIndex,
      type: "block",
      title: blockTitle,
      subType: block.type,
    });
    currentIndex++;
  });

  const getSlideIcon = (item: SlideItemMeta) => {
    switch (item.type) {
      case "cover":
        return <FileText className="w-3.5 h-3.5" />;
      case "kpi":
        return <Layers className="w-3.5 h-3.5" />;
      case "chart":
        return <BarChart3 className="w-3.5 h-3.5" />;
      case "block":
        if (item.subType === "comparison_table") return <Table className="w-3.5 h-3.5" />;
        return <CheckCircle className="w-3.5 h-3.5" />;
      default:
        return <FileText className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="w-full min-w-0 flex items-center justify-between gap-3 px-4 py-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-10 flex-shrink-0">
      {/* Filmstrip Slides Horizontal Track */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none flex-1">
        {slideItems.map((item, idx) => {
          const isActive = currentSlideIndex === idx;

          return (
            <div
              key={item.id || idx}
              className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex-shrink-0 text-left select-none ${
                isActive
                  ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 shadow-xs ring-1 ring-blue-500/40"
                  : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/70 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
              onClick={() => onSelectSlide(idx)}
            >
              <div
                className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: isActive ? `${accentColor}20` : undefined,
                  color: isActive ? accentColor : undefined,
                }}
              >
                {getSlideIcon(item)}
              </div>

              <div className="flex flex-col min-w-0 max-w-[110px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Slide {idx + 1}
                </span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {item.title}
                </span>
              </div>

              {/* Hover Action Controls (Reorder, Duplicate, Delete) */}
              <div
                className="hidden group-hover:flex items-center gap-0.5 ml-1 pl-1.5 border-l border-slate-200 dark:border-slate-700 pointer-events-auto z-20"
                onClick={(e) => e.stopPropagation()}
              >
                {idx > 0 && onReorderSlide && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onReorderSlide(idx, idx - 1);
                    }}
                    title="Move Left"
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                )}
                {idx < slideItems.length - 1 && onReorderSlide && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onReorderSlide(idx, idx + 1);
                    }}
                    title="Move Right"
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
                {onDuplicateSlide && item.type !== "cover" && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDuplicateSlide(idx);
                    }}
                    title="Duplicate Slide"
                    className="p-1 rounded-md text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                )}
                {onDeleteSlide && item.type !== "cover" && slideItems.length > 2 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDeleteSlide(idx);
                    }}
                    title="Delete Slide"
                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Slide Dropdown Menu */}
      <div className="relative shrink-0">
        <button
          onClick={() => setIsAddMenuOpen((prev) => !prev)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-bold transition-all bg-white dark:bg-slate-900 shadow-2xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add Slide</span>
        </button>

        {isAddMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setIsAddMenuOpen(false)}
            />
            <div className="absolute bottom-full right-0 mb-2 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-1 z-40 text-xs animate-in fade-in slide-in-from-bottom-2 duration-150">
              <span className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Choose Slide Type
              </span>
              <button
                onClick={() => {
                  onAddSlide?.("chart");
                  setIsAddMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 transition-colors text-left"
              >
                <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
                <span>Visual Chart Slide</span>
              </button>
              <button
                onClick={() => {
                  onAddSlide?.("kpi");
                  setIsAddMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 transition-colors text-left"
              >
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                <span>KPI Metrics Slide</span>
              </button>
              <button
                onClick={() => {
                  onAddSlide?.("takeaways");
                  setIsAddMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 transition-colors text-left"
              >
                <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                <span>Key Takeaways Slide</span>
              </button>
              <button
                onClick={() => {
                  onAddSlide?.("table");
                  setIsAddMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 transition-colors text-left"
              >
                <Table className="w-3.5 h-3.5 text-blue-500" />
                <span>Comparison Table Slide</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
