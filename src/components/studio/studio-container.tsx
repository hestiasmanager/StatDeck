"use client";

import React, { useReducer, useEffect, useState, useRef, useCallback } from "react";
import type { DeckAST, OutputFormat } from "@/lib/schemas/deck-schema";
import type { BrandKit } from "@/lib/schemas/brand-kit-schema";
import { applyBrandKitToTheme } from "@/lib/themes/registry";
import { SAMPLE_PRESETS } from "@/lib/ai/presets";
import { FormatSwitcher } from "@/components/studio/format-switcher";
import { ThemePicker } from "@/components/studio/theme-picker";
import { InputTray } from "@/components/studio/input-tray";
import { ExportModal } from "@/components/studio/export-modal";
import { BrandKitModal } from "@/components/studio/brand-kit-modal";
import { ApiKeyModal } from "@/components/studio/api-key-modal";
import { ZoomToolbar } from "@/components/studio/zoom-toolbar";
import { InfographicCanvas } from "@/components/canvas/infographic-canvas";
import { CarouselCanvas } from "@/components/canvas/carousel-canvas";
import { PresentationCanvas } from "@/components/canvas/presentation-canvas";
import {
  Undo2,
  Redo2,
  Download,
  Sparkles,
  Globe,
  Key,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";

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
  | { type: "UNDO" }
  | { type: "REDO" };

function studioReducer(state: StudioState, action: StudioAction): StudioState {
  switch (action.type) {
    case "SET_AST": {
      return {
        past: [...state.past, state.present],
        present: action.payload,
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1.0);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isBrandKitOpen, setIsBrandKitOpen] = useState(false);
  const [isApiKeyOpen, setIsApiKeyOpen] = useState(false);

  const canvasViewportRef = useRef<HTMLDivElement>(null);
  const infographicRef = useRef<HTMLDivElement>(null);

  // Fit to screen calculator
  const handleFitToScreen = useCallback(() => {
    if (!canvasViewportRef.current) return;
    const container = canvasViewportRef.current;
    const availableWidth = container.clientWidth - 48; // padding
    const availableHeight = container.clientHeight - 80; // toolbar + padding

    const format = state.present.format;
    let targetWidth = 540;
    let targetHeight = 740;

    if (format === "presentation") {
      targetWidth = 800;
      targetHeight = 520;
    } else if (format === "infographic") {
      targetWidth = 800;
      targetHeight = 1400;
    }

    const scaleX = availableWidth / targetWidth;
    const scaleY = availableHeight / targetHeight;

    // For infographic, fit mostly to width so it fills nicely and scrolls
    let newScale = format === "infographic" ? scaleX : Math.min(scaleX, scaleY);
    // Clamp between 0.4 and 1.2
    newScale = Math.max(0.4, Math.min(1.2, Math.round(newScale * 100) / 100));
    setZoom(newScale);
  }, [state.present.format]);

  // Auto-fit on initial mount or format change if screen is small
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1440) {
      handleFitToScreen();
    }
  }, [state.present.format, handleFitToScreen]);

  // Keyboard shortcuts: Undo/Redo, Escape for Fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
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

  const currentAst = state.present;

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
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-sm font-black text-xs">
                S
              </div>
              <span className="font-extrabold tracking-tight text-base hidden sm:inline">
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
            {/* Undo / Redo */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-lg p-0.5 border border-slate-200/80 dark:border-slate-700/60">
              <button
                onClick={() => dispatch({ type: "UNDO" })}
                disabled={state.past.length === 0}
                title="Undo (Ctrl+Z)"
                className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => dispatch({ type: "REDO" })}
                disabled={state.future.length === 0}
                title="Redo (Ctrl+Shift+Z)"
                className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* API Key Settings Button */}
            <button
              onClick={() => setIsApiKeyOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
              title="Configure Gemini or OpenAI Keys"
            >
              <Key className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden md:inline">API Key</span>
            </button>

            {/* Brand Kit Button */}
            <button
              onClick={() => setIsBrandKitOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden md:inline">Brand Kit</span>
            </button>

            {/* Export Assets Button */}
            <button
              onClick={() => setIsExportOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all hover:scale-102"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </header>
      )}

      {/* 2. Main Studio Body */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Collapsible Left Sidebar */}
        <aside
          className={`h-full border-r border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md flex flex-col gap-5 p-4 overflow-y-auto transition-all duration-300 ease-in-out z-20 flex-shrink-0 ${
            isFullscreen
              ? "hidden"
              : isSidebarOpen
              ? "w-80 md:w-96 opacity-100 translate-x-0"
              : "w-0 p-0 border-0 opacity-0 -translate-x-full pointer-events-none"
          }`}
        >
          {/* Data Ingestion Section */}
          <section className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Data Ingestion
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

        {/* Canvas Viewport (Independent Isolated Scroll Container) */}
        <div
          ref={canvasViewportRef}
          className="flex-1 h-full overflow-auto relative p-6 flex flex-col items-center justify-start bg-slate-100/80 dark:bg-slate-950"
        >
          {currentAst.format === "infographic" && (
            <InfographicCanvas
              ref={infographicRef}
              ast={currentAst}
              onUpdateText={handleUpdateText}
              scale={zoom}
            />
          )}

          {currentAst.format === "carousel" && (
            <CarouselCanvas
              ast={currentAst}
              onUpdateText={handleUpdateText}
              scale={zoom}
            />
          )}

          {currentAst.format === "presentation" && (
            <PresentationCanvas
              ast={currentAst}
              onUpdateText={handleUpdateText}
              scale={zoom}
            />
          )}

          {/* Floating Zoom & Maximize Controls Toolbar */}
          <div className="fixed bottom-6 right-6 z-30">
            <ZoomToolbar
              zoom={zoom}
              onZoomIn={() => setZoom((z) => Math.min(1.6, Math.round((z + 0.1) * 10) / 10))}
              onZoomOut={() => setZoom((z) => Math.max(0.4, Math.round((z - 0.1) * 10) / 10))}
              onResetZoom={() => setZoom(1.0)}
              onFitToScreen={handleFitToScreen}
              isFullscreen={isFullscreen}
              onToggleFullscreen={() => setIsFullscreen((prev) => !prev)}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
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

      <ApiKeyModal
        isOpen={isApiKeyOpen}
        onClose={() => setIsApiKeyOpen(false)}
      />
    </div>
  );
}
