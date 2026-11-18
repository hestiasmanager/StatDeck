"use client";

import React, { useState } from "react";
import type { DeckAST } from "@/lib/schemas/deck-schema";
import { exportDeckToPptx } from "@/lib/exporters/pptx-exporter";
import { exportSvgToPng } from "@/lib/exporters/png-exporter";
import { exportSvgToFile } from "@/lib/exporters/svg-exporter";
import { exportCarouselToPdf } from "@/lib/exporters/pdf-carousel-exporter";
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
}

export function ExportModal({
  isOpen,
  onClose,
  ast,
  userTier = "free",
}: ExportModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState("");

  if (!isOpen) return null;

  const isFree = userTier === "free";

  // Native PowerPoint Export
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

  // High-DPI PNG Export
  const handlePngExport = async () => {
    setIsExporting(true);
    setExportMessage("Rasterizing crisp 2x High-DPI Canvas PNG...");
    try {
      const activeSlide = document.getElementById("carousel-active-slide") || document.querySelector("svg");
      if (activeSlide) {
        // Look for SVG inside or serialize
        const svg = document.querySelector("svg");
        if (svg) {
          await exportSvgToPng(svg, `${ast.meta.title}.png`, 2);
        } else {
          alert("Canvas ready for export");
        }
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "PNG export failed");
    } finally {
      setIsExporting(false);
      setExportMessage("");
    }
  };

  // Vector SVG Export
  const handleSvgExport = () => {
    const svg = document.querySelector("svg");
    if (svg) {
      exportSvgToFile(svg, `${ast.meta.title}.svg`);
    } else {
      alert("No SVG elements found to export");
    }
  };

  // LinkedIn Carousel PDF Export
  const handleCarouselPdfExport = async () => {
    setIsExporting(true);
    setExportMessage("Compiling 1080x1350 multi-page LinkedIn PDF carousel...");
    try {
      const activeSlide = document.getElementById("carousel-active-slide");
      if (activeSlide) {
        await exportCarouselToPdf([activeSlide], ast.meta.title);
      } else {
        alert("Please select the LinkedIn Carousel view to export carousel PDF");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "PDF Carousel export failed");
    } finally {
      setIsExporting(false);
      setExportMessage("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
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
                  1080×1350 4:5 swipeable multi-page document
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
                  2x Retina resolution for Twitter / X and social posts
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
                  Pure vector format with embedded web fonts
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
