"use client";

import React, { useState, useRef } from "react";
import type { DeckAST } from "@/lib/schemas/deck-schema";
import { EDITORIAL_THEMES, DEFAULT_THEME_ID } from "@/lib/themes/registry";
import { exportDeckToPptx } from "@/lib/exporters/pptx-exporter";
import { exportElementToPng } from "@/lib/exporters/png-exporter";
import { exportElementToSvg } from "@/lib/exporters/svg-exporter";
import { exportCarouselToPdf } from "@/lib/exporters/pdf-carousel-exporter";
import { buildCarouselSlides } from "@/components/canvas/carousel-slides";
import {
  Download,
  Presentation,
  FileImage,
  FileCode,
  FileText,
  X,
  Sparkles,
  Loader2,
} from "lucide-react";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  ast: DeckAST;
  userTier?: "free" | "creator" | "agency";
  activeCanvasRef?: React.RefObject<HTMLDivElement | null>;
}

export function ExportModal({
  isOpen,
  onClose,
  ast,
  userTier = "free",
  activeCanvasRef,
}: ExportModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState("");
  const offscreenContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const isFree = userTier === "free";
  const theme = EDITORIAL_THEMES[ast.templateId] || EDITORIAL_THEMES[DEFAULT_THEME_ID];
  const carouselSlides = buildCarouselSlides(ast);

  // Helper to slugify filenames cleanly
  const slugifyFilename = (title: string, format: string, ext: string): string => {
    const safe = (title || "statdeck")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 45);
    return `${safe || "statdeck"}-${format}.${ext}`;
  };

  // Helper to find the active canvas element
  const getActiveCanvasElement = (): HTMLElement | null => {
    if (activeCanvasRef?.current) {
      return activeCanvasRef.current;
    }
    return (
      document.getElementById("statdeck-infographic-canvas") ||
      document.getElementById("carousel-active-slide") ||
      document.getElementById("presentation-active-slide") ||
      (document.querySelector("[data-statdeck-canvas]") as HTMLElement | null)
    );
  };

  // 1. Native PowerPoint Export
  const handlePptxExport = async () => {
    setIsExporting(true);
    setExportMessage("Generating native PowerPoint slides & native charts...");
    try {
      await exportDeckToPptx(ast);
    } catch (err) {
      alert(err instanceof Error ? err.message : "PPTX export failed");
    } finally {
      setIsExporting(false);
      setExportMessage("");
    }
  };

  // 2. High-DPI PNG Export (Targets active canvas ref via html-to-image)
  const handlePngExport = async () => {
    setIsExporting(true);
    setExportMessage("Rasterizing crisp 2x High-DPI Canvas PNG...");
    try {
      const activeElement = getActiveCanvasElement();
      if (!activeElement) {
        throw new Error("No active canvas element found to export.");
      }
      const filename = slugifyFilename(ast.meta.title, ast.format, "png");
      await exportElementToPng(activeElement, filename, 2);
    } catch (err) {
      alert(err instanceof Error ? err.message : "PNG export failed");
    } finally {
      setIsExporting(false);
      setExportMessage("");
    }
  };

  // 3. Vector SVG Export (Targets active canvas ref via html-to-image)
  const handleSvgExport = async () => {
    setIsExporting(true);
    setExportMessage("Serializing clean vector SVG with embedded fonts...");
    try {
      const activeElement = getActiveCanvasElement();
      if (!activeElement) {
        throw new Error("No active canvas element found to export.");
      }
      const filename = slugifyFilename(ast.meta.title, ast.format, "svg");
      await exportElementToSvg(activeElement, filename);
    } catch (err) {
      alert(err instanceof Error ? err.message : "SVG export failed");
    } finally {
      setIsExporting(false);
      setExportMessage("");
    }
  };

  // 4. LinkedIn Multi-Slide Carousel PDF Export (Iterates all mounted offscreen slides)
  const handleCarouselPdfExport = async () => {
    setIsExporting(true);
    setExportMessage("Mounting all carousel slides for multi-page PDF compilation...");
    try {
      const container = offscreenContainerRef.current;
      const slideNodes: HTMLElement[] = container
        ? (Array.from(container.querySelectorAll("[data-carousel-slide]")) as HTMLElement[])
        : [];

      // Fallback: If offscreen container children couldn't be queried, fallback to active slide
      if (slideNodes.length === 0) {
        const activeSlide = document.getElementById("carousel-active-slide");
        if (activeSlide) slideNodes.push(activeSlide);
      }

      if (slideNodes.length === 0) {
        throw new Error("Unable to capture carousel slides for PDF generation.");
      }

      setExportMessage(`Compiling ${slideNodes.length}-slide LinkedIn PDF carousel...`);
      await exportCarouselToPdf(slideNodes, ast.meta.title);
    } catch (err) {
      alert(err instanceof Error ? err.message : "PDF Carousel export failed");
    } finally {
      setIsExporting(false);
      setExportMessage("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {/* Hidden Offscreen Container Mounting ALL Carousel Slides for PDF Export */}
      <div
        ref={offscreenContainerRef}
        id="offscreen-carousel-container"
        aria-hidden="true"
        style={{
          position: "fixed",
          left: "-9999px",
          top: 0,
          width: "540px",
          pointerEvents: "none",
          opacity: 1,
          zIndex: -9999,
        }}
      >
        {carouselSlides.map((slide) => (
          <div
            key={slide.id}
            data-carousel-slide={slide.id}
            style={{
              width: "540px",
              height: "675px",
              backgroundColor: theme.bg,
              borderColor: theme.surfaceBorder,
              color: theme.ink,
              position: "relative",
              overflow: "hidden",
              marginBottom: "20px",
            }}
          >
            {slide.content}
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Export Graphic Assets
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Tier Notice */}
        {isFree && (
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-300">
            <Sparkles className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="font-semibold">Free Tier Export</span>
              <span className="opacity-80 mt-0.5">
                Exports include an editorial footer badge. Upgrade to Creator or Agency to remove watermarks and unlock native PowerPoint charts.
              </span>
            </div>
          </div>
        )}

        {/* Export Buttons Grid */}
        <div className="flex flex-col gap-2.5">
          {/* Native PPTX */}
          <button
            onClick={handlePptxExport}
            disabled={isExporting}
            className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-950/40 text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-orange-600 dark:text-orange-400">
                <Presentation className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  Native PowerPoint (.pptx)
                </span>
                <span className="text-[11px] text-slate-500">
                  100% editable shapes & native PowerPoint charts
                </span>
              </div>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 font-bold">
              Agency
            </span>
          </button>

          {/* LinkedIn Multi-Page PDF Carousel */}
          <button
            onClick={handleCarouselPdfExport}
            disabled={isExporting}
            className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-950/40 text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950 flex items-center justify-center text-red-600 dark:text-red-400">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  LinkedIn Carousel PDF
                </span>
                <span className="text-[11px] text-slate-500">
                  1080×1350 4:5 swipeable multi-page document ({carouselSlides.length} slides)
                </span>
              </div>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-bold">
              PDF
            </span>
          </button>

          {/* High-DPI PNG */}
          <button
            onClick={handlePngExport}
            disabled={isExporting}
            className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-950/40 text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <FileImage className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  High-DPI Image (.png)
                </span>
                <span className="text-[11px] text-slate-500">
                  2x Retina resolution capturing full typography & layout
                </span>
              </div>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
              PNG
            </span>
          </button>

          {/* Clean Vector SVG */}
          <button
            onClick={handleSvgExport}
            disabled={isExporting}
            className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-950/40 text-left transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <FileCode className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  Vector Scalable Graphic (.svg)
                </span>
                <span className="text-[11px] text-slate-500">
                  Pure vector format with embedded web fonts & inline charts
                </span>
              </div>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold">
              SVG
            </span>
          </button>
        </div>

        {/* Progress Spinner */}
        {isExporting && (
          <div className="flex items-center justify-center gap-2 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{exportMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
