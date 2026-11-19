"use client";

import React, { useReducer, useEffect, useState, useRef, useCallback } from "react";
import type { DeckAST, OutputFormat, ChartType, BlockType } from "@/lib/schemas/deck-schema";
import type { BrandKit } from "@/lib/schemas/brand-kit-schema";
import { applyBrandKitToTheme, getThemeTokens } from "@/lib/themes/registry";
import { SAMPLE_PRESETS } from "@/lib/ai/presets";
import { FormatSwitcher } from "@/components/studio/format-switcher";
import { ThemePicker } from "@/components/studio/theme-picker";
import { InputTray } from "@/components/studio/input-tray";
import { ExportModal } from "@/components/studio/export-modal";
import { BrandKitModal } from "@/components/studio/brand-kit-modal";
import { TemplateGalleryModal } from "@/components/studio/template-gallery-modal";
import { SlideFilmstrip } from "@/components/studio/slide-filmstrip";
import { SlideLayoutModal } from "@/components/studio/slide-layout-modal";
import { CommandPalette } from "@/components/studio/command-palette";
import { InfographicCanvas } from "@/components/canvas/infographic-canvas";
import { CarouselCanvas } from "@/components/canvas/carousel-canvas";
import { PresentationCanvas } from "@/components/canvas/presentation-canvas";
import {
  Undo2,
  Redo2,
  Download,
  Sparkles,
  Globe,
  LayoutGrid,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  ZoomIn,
  ZoomOut,
  Scan,
  Maximize2,
  Minimize2,
  Layers,
  ScrollText,
  Monitor,
  SlidersHorizontal,
  Command,
} from "lucide-react";
import { StatDeckMark } from "@/components/ui/statdeck-mark";

// --- Helper to map slide index to AST elements ---
function getSlideTarget(
  ast: DeckAST,
  slideIndex: number
):
  | { type: "cover" }
  | { type: "kpi" }
  | { type: "chart"; chartIndex: number }
  | { type: "block"; blockIndex: number }
  | null {
  if (slideIndex === 0) return { type: "cover" };
  const hasKpi = Boolean(ast.kpis && ast.kpis.length > 0);
  let tracker = 1;
  if (hasKpi) {
    if (slideIndex === 1) return { type: "kpi" };
    tracker = 2;
  }
  const chartIdx = slideIndex - tracker;
  if (chartIdx >= 0 && chartIdx < ast.charts.length) {
    return { type: "chart", chartIndex: chartIdx };
  }
  const blockIdx = slideIndex - tracker - ast.charts.length;
  if (blockIdx >= 0 && blockIdx < ast.blocks.length) {
    return { type: "block", blockIndex: blockIdx };
  }
  return null;
}

// --- Studio State & Reducer with Undo/Redo ---
interface StudioState {
  past: DeckAST[];
  present: DeckAST;
  future: DeckAST[];
}

type StudioAction =
  | { type: "SET_AST"; payload: DeckAST }
  | { type: "SET_FORMAT"; payload: OutputFormat }
  | { type: "SET_THEME"; payload: string }
  | { type: "UPDATE_TEXT"; payload: { path: string; value: string } }
  | { type: "APPLY_BRAND_KIT"; payload: BrandKit }
  | { type: "REORDER_SLIDES"; payload: { fromIndex: number; toIndex: number } }
  | { type: "DUPLICATE_SLIDE"; payload: { slideIndex: number } }
  | { type: "DELETE_SLIDE"; payload: { slideIndex: number } }
  | { type: "ADD_SLIDE"; payload: { type: "chart" | "kpi" | "takeaways" | "table" } }
  | { type: "UPDATE_CHART_TYPE"; payload: { chartIndex: number; chartType: ChartType } }
  | { type: "UPDATE_BLOCK_TYPE"; payload: { blockIndex: number; blockType: BlockType } }
  | { type: "UNDO" }
  | { type: "REDO" };

function studioReducer(state: StudioState, action: StudioAction): StudioState {
  switch (action.type) {
    case "SET_AST": {
      const synthesisId =
        action.payload.id ||
        (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `deck-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
      return {
        past: [...state.past, state.present],
        present: {
          ...action.payload,
          id: synthesisId,
        },
        future: [],
      };
    }

    case "SET_FORMAT": {
      return {
        ...state,
        present: { ...state.present, format: action.payload },
      };
    }

    case "SET_THEME": {
      return {
        past: [...state.past, state.present],
        present: { ...state.present, templateId: action.payload },
        future: [],
      };
    }

    case "UPDATE_TEXT": {
      const { path, value } = action.payload;
      const newAst = JSON.parse(JSON.stringify(state.present)) as DeckAST;

      const keys = path.split(".");
      let target: Record<string, unknown> = newAst as unknown as Record<string, unknown>;
      for (let i = 0; i < keys.length - 1; i++) {
        const key = isNaN(Number(keys[i])) ? keys[i] : Number(keys[i]);
        target = target[key as keyof typeof target] as Record<string, unknown>;
      }
      const lastKey = keys[keys.length - 1];
      target[lastKey] = value;

      return {
        past: [...state.past, state.present],
        present: newAst,
        future: [],
      };
    }

    case "APPLY_BRAND_KIT": {
      const brandThemeId = applyBrandKitToTheme(action.payload);
      return {
        past: [...state.past, state.present],
        present: {
          ...state.present,
          templateId: brandThemeId,
        },
        future: [],
      };
    }

    case "REORDER_SLIDES": {
      const { fromIndex, toIndex } = action.payload;
      const newAst = JSON.parse(JSON.stringify(state.present)) as DeckAST;
      const fromTarget = getSlideTarget(newAst, fromIndex);
      const toTarget = getSlideTarget(newAst, toIndex);

      if (fromTarget?.type === "chart" && toTarget?.type === "chart") {
        const [moved] = newAst.charts.splice(fromTarget.chartIndex, 1);
        newAst.charts.splice(toTarget.chartIndex, 0, moved);
      } else if (fromTarget?.type === "block" && toTarget?.type === "block") {
        const [moved] = newAst.blocks.splice(fromTarget.blockIndex, 1);
        newAst.blocks.splice(toTarget.blockIndex, 0, moved);
      }
      return {
        past: [...state.past, state.present],
        present: newAst,
        future: [],
      };
    }

    case "DUPLICATE_SLIDE": {
      const { slideIndex } = action.payload;
      const newAst = JSON.parse(JSON.stringify(state.present)) as DeckAST;
      const target = getSlideTarget(newAst, slideIndex);
      if (target?.type === "chart") {
        const original = newAst.charts[target.chartIndex];
        const clone = { ...original, id: `chart-${Date.now()}` };
        newAst.charts.splice(target.chartIndex + 1, 0, clone);
      } else if (target?.type === "block") {
        const original = newAst.blocks[target.blockIndex];
        const clone = { ...original, id: `block-${Date.now()}` };
        newAst.blocks.splice(target.blockIndex + 1, 0, clone);
      }
      return {
        past: [...state.past, state.present],
        present: newAst,
        future: [],
      };
    }

    case "DELETE_SLIDE": {
      const { slideIndex } = action.payload;
      const newAst = JSON.parse(JSON.stringify(state.present)) as DeckAST;
      const target = getSlideTarget(newAst, slideIndex);
      if (target?.type === "chart") {
        newAst.charts.splice(target.chartIndex, 1);
      } else if (target?.type === "block") {
        newAst.blocks.splice(target.blockIndex, 1);
      }
      return {
        past: [...state.past, state.present],
        present: newAst,
        future: [],
      };
    }

    case "ADD_SLIDE": {
      const newAst = JSON.parse(JSON.stringify(state.present)) as DeckAST;
      const slideType = action.payload.type;
      if (slideType === "chart") {
        newAst.charts.push({
          id: `chart-${Date.now()}`,
          type: "bar",
          title: "Performance Distribution",
          unit: "%",
          data: [
            { label: "Segment Alpha", value: 65 },
            { label: "Segment Beta", value: 92 },
            { label: "Segment Gamma", value: 48 },
          ],
        });
      } else if (slideType === "kpi") {
        if (!newAst.kpis || newAst.kpis.length === 0) {
          newAst.kpis = [
            { id: "kpi-1", label: "Annual Run Rate", value: "$4.2M", delta: "+34% YoY", deltaType: "positive" },
            { id: "kpi-2", label: "Retention Rate", value: "98.4%", delta: "+1.8%", deltaType: "positive" },
            { id: "kpi-3", label: "LTV / CAC", value: "5.2x", delta: "Optimal", deltaType: "positive" },
          ];
        } else {
          newAst.kpis.push({
            id: `kpi-${Date.now()}`,
            label: "Operational Velocity",
            value: "99.9%",
            delta: "+0.4%",
            deltaType: "positive",
          });
        }
      } else if (slideType === "takeaways") {
        newAst.blocks.push({
          id: `block-${Date.now()}`,
          type: "key_takeaways",
          title: "Strategic Priorities & Next Steps",
          bullets: [
            {
              headline: "Accelerate GTM Pipeline",
              detail: "Prioritize top-tier enterprise accounts with specialized white-glove onboarding.",
            },
            {
              headline: "Improve Gross Margin Velocity",
              detail: "Streamline infrastructure overhead to maximize operational leverage.",
            },
          ],
        });
      } else if (slideType === "table") {
        newAst.blocks.push({
          id: `block-${Date.now()}`,
          type: "comparison_table",
          title: "Quarterly Performance Benchmarks",
          headers: ["Metric", "Target", "Actual", "Status"],
          rows: [
            { cells: ["Net New ARR", "$500,000", "$620,000", "Exceeded"] },
            { cells: ["Gross Margin", "80%", "83.5%", "Healthy"] },
            { cells: ["Net Churn", "< 1.0%", "0.6%", "Strong"] },
          ],
        });
      }
      return {
        past: [...state.past, state.present],
        present: newAst,
        future: [],
      };
    }

    case "UPDATE_CHART_TYPE": {
      const { chartIndex, chartType } = action.payload;
      const newAst = JSON.parse(JSON.stringify(state.present)) as DeckAST;
      if (newAst.charts[chartIndex]) {
        newAst.charts[chartIndex].type = chartType;
      }
      return {
        past: [...state.past, state.present],
        present: newAst,
        future: [],
      };
    }

    case "UPDATE_BLOCK_TYPE": {
      const { blockIndex, blockType } = action.payload;
      const newAst = JSON.parse(JSON.stringify(state.present)) as DeckAST;
      if (newAst.blocks[blockIndex]) {
        newAst.blocks[blockIndex].type = blockType;
      }
      return {
        past: [...state.past, state.present],
        present: newAst,
        future: [],
      };
    }

    case "UNDO": {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, state.past.length - 1);
      return {
        past: newPast,
        present: previous,
        future: [state.present, ...state.future],
      };
    }

    case "REDO": {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      return {
        past: [...state.past, state.present],
        present: next,
        future: newFuture,
      };
    }

    default:
      return state;
  }
}

interface StudioContainerProps {
  initialAst?: DeckAST;
}

export function StudioContainer({ initialAst }: StudioContainerProps) {
  const [state, dispatch] = useReducer(studioReducer, {
    past: [],
    present: initialAst || SAMPLE_PRESETS["saas-churn-metrics"],
    future: [],
  });

  // UI state for minimize / maximize & responsive layout
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024;
    }
    return true;
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1.0);
  const [isAutoFit, setIsAutoFit] = useState(true);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Modals state
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isBrandKitOpen, setIsBrandKitOpen] = useState(false);
  const [isTemplateGalleryOpen, setIsTemplateGalleryOpen] = useState(false);
  const [isSlideLayoutOpen, setIsSlideLayoutOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const canvasViewportRef = useRef<HTMLDivElement>(null);
  const infographicRef = useRef<HTMLDivElement>(null);

  const currentAst = state.present;
  const theme = getThemeTokens(currentAst.templateId);

  // Total slides count
  const totalSlides =
    1 +
    (currentAst.kpis && currentAst.kpis.length > 0 ? 1 : 0) +
    currentAst.charts.length +
    currentAst.blocks.length;

  // Reset slide index on AST synthesis switch
  useEffect(() => {
    setCurrentSlideIndex(0);
  }, [currentAst.id]);

  // True auto-fit zoom calculator with 32px+ balanced margins and 0 horizontal scrollbar
  const calculateAutoFit = useCallback(() => {
    if (!canvasViewportRef.current) return;
    const container = canvasViewportRef.current;
    // 64px total horizontal margin (32px left + 32px right)
    const availableWidth = Math.max(300, container.clientWidth - 64);
    // 140px total vertical margin (toolbar + filmstrip + 32px vertical room)
    const availableHeight = Math.max(300, container.clientHeight - 140);

    const format = state.present.format;
    let targetWidth = 540;
    let targetHeight = 725;

    if (format === "presentation") {
      targetWidth = 800;
      targetHeight = 500;
    } else if (format === "infographic") {
      targetWidth = 800;
      targetHeight = 1400;
    }

    const scaleX = availableWidth / targetWidth;
    const scaleY = availableHeight / targetHeight;

    // For infographic, fit mostly to width with max 1.0 so it scrolls vertically
    let newScale = format === "infographic" ? Math.min(1.0, scaleX) : Math.min(scaleX, scaleY);
    newScale = Math.max(0.4, Math.min(1.25, Math.round(newScale * 100) / 100));
    setZoom(newScale);
  }, [state.present.format]);

  // ResizeObserver to automatically calculate zoom when viewport or sidebar resizes
  useEffect(() => {
    if (!canvasViewportRef.current) return;
    const el = canvasViewportRef.current;

    const observer = new ResizeObserver(() => {
      if (isAutoFit) {
        calculateAutoFit();
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [calculateAutoFit, isAutoFit]);

  // Recalculate auto-fit when format, sidebar state, or fullscreen toggles
  useEffect(() => {
    if (isAutoFit) {
      calculateAutoFit();
    }
  }, [state.present.format, isSidebarOpen, isFullscreen, calculateAutoFit, isAutoFit]);

  const handleFitToScreen = () => {
    setIsAutoFit(true);
    calculateAutoFit();
  };

  // Keyboard shortcuts: Cmd+K, Undo/Redo, Escape for Fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isCommandPaletteOpen) {
          setIsCommandPaletteOpen(false);
        } else if (isFullscreen) {
          setIsFullscreen(false);
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          dispatch({ type: "REDO" });
        } else {
          e.preventDefault();
          dispatch({ type: "UNDO" });
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        dispatch({ type: "REDO" });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  const handleUpdateText = (path: string, newText: string) => {
    dispatch({ type: "UPDATE_TEXT", payload: { path, value: newText } });
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 select-none">
      {/* 1. Header Bar (Hidden in Fullscreen Mode) */}
      {!isFullscreen && (
        <header className="h-14 flex-shrink-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between z-40">
          <div className="flex items-center gap-3">
            {/* Sidebar Toggle Button */}
            <button
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isSidebarOpen ? "Minimize Sidebar (Ctrl+B)" : "Expand Sidebar"}
              aria-label="Toggle Sidebar"
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeftOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              )}
            </button>

            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <StatDeckMark className="w-6 h-6 flex-shrink-0" barColor="#2563EB" />
              <span className="font-extrabold tracking-tight text-base hidden sm:inline text-slate-900 dark:text-slate-100">
                StatDeck
              </span>
            </div>

            <div className="h-4 w-px bg-slate-200 dark:border-slate-800 hidden sm:block mx-1" />

            {/* Format Switcher */}
            <FormatSwitcher
              currentFormat={currentAst.format}
              onChangeFormat={(format) => dispatch({ type: "SET_FORMAT", payload: format })}
            />
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            {/* Command Palette Trigger */}
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
              title="Command Palette (Cmd+K / Ctrl+K)"
            >
              <Command className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[11px] font-mono text-slate-400">⌘K</span>
            </button>

            {/* Undo / Redo */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-lg p-0.5 border border-slate-200/80 dark:border-slate-700/60">
              <button
                onClick={() => dispatch({ type: "UNDO" })}
                disabled={state.past.length === 0}
                title="Undo (Ctrl+Z)"
                className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 transition-colors cursor-pointer"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => dispatch({ type: "REDO" })}
                disabled={state.future.length === 0}
                title="Redo (Ctrl+Shift+Z)"
                className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 transition-colors cursor-pointer"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Template Gallery Button (288+ Combinations) */}
            <button
              onClick={() => setIsTemplateGalleryOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="Open Template Gallery (288+ Combinations)"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden sm:inline">Templates</span>
            </button>

            {/* Brand Kit Button */}
            <button
              onClick={() => setIsBrandKitOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden md:inline">Brand Kit</span>
            </button>

            {/* Export Assets Button */}
            <button
              onClick={() => setIsExportOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all hover:scale-102 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </header>
      )}

      {/* 2. Main Studio Body */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Mobile/Tablet Drawer Backdrop Overlay (< 1024px) */}
        {isSidebarOpen && !isFullscreen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity"
            aria-label="Close sidebar overlay"
          />
        )}

        {/* Collapsible Left Sidebar (Slide-over Drawer on Mobile/Tablet < 1024px) */}
        <aside
          className={`h-full border-r border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex flex-col gap-5 p-4 overflow-y-auto transition-all duration-300 ease-in-out lg:relative fixed inset-y-0 left-0 z-50 lg:z-20 flex-shrink-0 ${
            isFullscreen
              ? "hidden"
              : isSidebarOpen
              ? "w-80 lg:w-96 shadow-2xl lg:shadow-none opacity-100 translate-x-0"
              : "w-0 p-0 border-0 opacity-0 -translate-x-full pointer-events-none"
          }`}
        >
          {/* Mobile Drawer Close Header */}
          <div className="flex items-center justify-between lg:hidden pb-1 border-b border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Studio Controls
            </span>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close Drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Data Ingestion Section */}
          <section className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Add Your Content
            </span>
            <InputTray
              currentFormat={currentAst.format}
              currentTemplateId={currentAst.templateId}
              onAstLoaded={(ast) => dispatch({ type: "SET_AST", payload: ast })}
            />
          </section>

          {/* Editorial Themes Picker */}
          <section>
            <ThemePicker
              currentThemeId={currentAst.templateId}
              onSelectTheme={(themeId) => dispatch({ type: "SET_THEME", payload: themeId })}
              onOpenGallery={() => setIsTemplateGalleryOpen(true)}
            />
          </section>

          {/* Editorial Tip Card */}
          <div className="mt-auto p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-indigo-900 dark:text-indigo-300 flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Direct Inline Edit:</strong> Click on any headline, number, or label to edit in real time with zero extra LLM calls.
            </span>
          </div>
        </aside>

        {/* Floating Expand Sidebar Button when Minimized */}
        {!isFullscreen && !isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-4 left-4 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:scale-105"
          >
            <PanelLeftOpen className="w-3.5 h-3.5 text-blue-500" />
            <span>Controls</span>
          </button>
        )}

        {/* Fullscreen Exit Badge */}
        {isFullscreen && (
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/80 text-white backdrop-blur-md border border-white/20 shadow-xl text-xs font-semibold hover:bg-black transition-all hover:scale-105"
          >
            <X className="w-3.5 h-3.5" />
            <span>Exit Fullscreen (Esc)</span>
          </button>
        )}

        {/* Canvas & Filmstrip Column */}
        <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden relative">
          {/* Canvas Viewport (Independent Isolated Scroll Container) */}
          <div
            ref={canvasViewportRef}
            className="flex-1 min-w-0 h-full overflow-auto relative p-6 flex flex-col items-center justify-start bg-slate-100/80 dark:bg-slate-950 pb-36"
          >
            {currentAst.format === "infographic" && (
              <InfographicCanvas
                key={`${currentAst.id || "infographic"}-${currentAst.templateId}`}
                ref={infographicRef}
                ast={currentAst}
                onUpdateText={handleUpdateText}
                scale={zoom}
              />
            )}

            {currentAst.format === "carousel" && (
              <CarouselCanvas
                key={`${currentAst.id || "carousel"}-${currentAst.templateId}`}
                ast={currentAst}
                onUpdateText={handleUpdateText}
                scale={zoom}
                currentSlideIndex={currentSlideIndex}
                onSlideChange={setCurrentSlideIndex}
              />
            )}

            {currentAst.format === "presentation" && (
              <PresentationCanvas
                key={`${currentAst.id || "presentation"}-${currentAst.templateId}`}
                ast={currentAst}
                onUpdateText={handleUpdateText}
                scale={zoom}
                currentSlideIndex={currentSlideIndex}
                onSlideChange={setCurrentSlideIndex}
              />
            )}
          </div>

          {/* Floating Bottom Quick Action Bar */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-3.5 py-1.5 rounded-full border border-slate-200/90 dark:border-slate-800 shadow-2xl transition-all max-w-[95%] pointer-events-auto ${
              !isFullscreen && (currentAst.format === "carousel" || currentAst.format === "presentation")
                ? "bottom-16"
                : "bottom-5"
            }`}
          >
              {/* Format Quick Switcher */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-full">
                {(
                  [
                    { id: "carousel", label: "Carousel", sub: "4:5", icon: <Layers className="w-3.5 h-3.5" /> },
                    { id: "infographic", label: "Infographic", sub: "Poster", icon: <ScrollText className="w-3.5 h-3.5" /> },
                    { id: "presentation", label: "Deck", sub: "16:9", icon: <Monitor className="w-3.5 h-3.5" /> },
                  ] as const
                ).map((fmt) => {
                  const isActive = currentAst.format === fmt.id;
                  return (
                    <button
                      key={fmt.id}
                      onClick={() => dispatch({ type: "SET_FORMAT", payload: fmt.id })}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                        isActive
                          ? "bg-white dark:bg-slate-950 text-blue-600 dark:text-blue-400 shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                      }`}
                    >
                      {fmt.icon}
                      <span className="hidden sm:inline">{fmt.label}</span>
                      <span className="inline sm:hidden">{fmt.sub}</span>
                    </button>
                  );
                })}
              </div>

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

              {/* Slide Layout Switcher (For Carousel and Presentation) */}
              {currentAst.format !== "infographic" && (
                <>
                  <button
                    onClick={() => setIsSlideLayoutOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Change Active Slide Layout / Chart Type"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-blue-500" />
                    <span className="hidden sm:inline">Layout</span>
                  </button>
                  <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />
                </>
              )}

              {/* Zoom Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setIsAutoFit(false);
                    setZoom((z) => Math.max(0.4, Math.round((z - 0.1) * 10) / 10));
                  }}
                  disabled={zoom <= 0.4}
                  className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 text-slate-600 dark:text-slate-300 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setIsAutoFit(false);
                    setZoom(1.0);
                  }}
                  title="Reset Zoom (100%)"
                  className="px-2 py-0.5 rounded font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  onClick={() => {
                    setIsAutoFit(false);
                    setZoom((z) => Math.min(1.6, Math.round((z + 0.1) * 10) / 10));
                  }}
                  disabled={zoom >= 1.6}
                  className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 text-slate-600 dark:text-slate-300 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleFitToScreen}
                  title="Fit to Screen"
                  className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Scan className="w-3 h-3" />
                  <span className="hidden sm:inline">Fit</span>
                </button>
                <button
                  onClick={() => setIsFullscreen((prev) => !prev)}
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                  className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors hidden sm:block"
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

              {/* Quick Export Button */}
              <button
                onClick={() => setIsExportOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full shadow-xs transition-all hover:scale-102 flex-shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            </div>

          {/* Bottom Slide Filmstrip Navigator (Carousel & Presentation Modes) */}
          {!isFullscreen && (currentAst.format === "carousel" || currentAst.format === "presentation") && (
            <SlideFilmstrip
              ast={currentAst}
              currentSlideIndex={currentSlideIndex}
              totalSlides={totalSlides}
              onSelectSlide={setCurrentSlideIndex}
              onReorderSlide={(from, to) =>
                dispatch({ type: "REORDER_SLIDES", payload: { fromIndex: from, toIndex: to } })
              }
              onDuplicateSlide={(idx) =>
                dispatch({ type: "DUPLICATE_SLIDE", payload: { slideIndex: idx } })
              }
              onDeleteSlide={(idx) =>
                dispatch({ type: "DELETE_SLIDE", payload: { slideIndex: idx } })
              }
              onAddSlide={(type) => dispatch({ type: "ADD_SLIDE", payload: { type } })}
              accentColor={theme.accent}
            />
          )}
        </div>
      </main>

      {/* Modals & Dialogs */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        ast={currentAst}
        userTier="free"
        activeCanvasRef={infographicRef}
      />

      <BrandKitModal
        isOpen={isBrandKitOpen}
        onClose={() => setIsBrandKitOpen(false)}
        onApplyBrandKit={(kit) => dispatch({ type: "APPLY_BRAND_KIT", payload: kit })}
      />

      <TemplateGalleryModal
        isOpen={isTemplateGalleryOpen}
        onClose={() => setIsTemplateGalleryOpen(false)}
        currentTemplateId={currentAst.templateId}
        onSelectTemplate={(templateId) => dispatch({ type: "SET_THEME", payload: templateId })}
      />

      <SlideLayoutModal
        isOpen={isSlideLayoutOpen}
        onClose={() => setIsSlideLayoutOpen(false)}
        ast={currentAst}
        currentSlideIndex={currentSlideIndex}
        onUpdateChartType={(chartIndex, chartType) =>
          dispatch({ type: "UPDATE_CHART_TYPE", payload: { chartIndex, chartType } })
        }
        onUpdateBlockType={(blockIndex, blockType) =>
          dispatch({ type: "UPDATE_BLOCK_TYPE", payload: { blockIndex, blockType } })
        }
        onSelectTheme={(themeId) => dispatch({ type: "SET_THEME", payload: themeId })}
        onOpenTemplateGallery={() => setIsTemplateGalleryOpen(true)}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSetFormat={(fmt) => dispatch({ type: "SET_FORMAT", payload: fmt })}
        onOpenTemplates={() => setIsTemplateGalleryOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onUndo={() => dispatch({ type: "UNDO" })}
        onRedo={() => dispatch({ type: "REDO" })}
        onFitToScreen={handleFitToScreen}
        onToggleFullscreen={() => setIsFullscreen((prev) => !prev)}
        onAddSlide={(type) => dispatch({ type: "ADD_SLIDE", payload: { type } })}
      />
    </div>
  );
}
