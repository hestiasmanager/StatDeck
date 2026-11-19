"use client";

import React, { useState, useRef } from "react";
import type { DeckAST } from "@/lib/schemas/deck-schema";
import { getThemeTokens } from "@/lib/themes/registry";
import { exportDeckToPptx } from "@/lib/exporters/pptx-exporter";
import { exportElementToPng } from "@/lib/exporters/png-exporter";
import { exportElementToSvg } from "@/lib/exporters/svg-exporter";
import { exportCarouselToPdf } from "@/lib/exporters/pdf-carousel-exporter";
import { exportSlidesToZip } from "@/lib/exporters/zip-slides-exporter";
import { exportStandaloneHtmlFile } from "@/lib/exporters/standalone-html-exporter";
import { buildCarouselSlides } from "@/components/canvas/carousel-slides";
import {
  Download,
  Presentation,
  FileImage,
  FileCode,
  FileText,
  Archive,
  Code2,
  Share2,
  Copy,
  Check,
  X,
  Sparkles,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  ast: DeckAST;
  userTier?: "free" | "creator" | "agency";
  activeCanvasRef?: React.RefObject<HTMLDivElement | null>;
}

type ExportCategory = "all" | "slides" | "image" | "web";

export function ExportModal({
  isOpen,
  onClose,
  ast,
  userTier = "free",
  activeCanvasRef,
}: ExportModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<ExportCategory>("all");
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState("");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [hasCopiedShareUrl, setHasCopiedShareUrl] = useState(false);
  const [hasCopiedEmbed, setHasCopiedEmbed] = useState(false);
  const [pngScale, setPngScale] = useState<number>(2);

  const offscreenContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const isFree = userTier === "free";
  const theme = getThemeTokens(ast.templateId);
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

  const getSlideElements = (): HTMLElement[] => {
    const container = offscreenContainerRef.current;
    let slideNodes: HTMLElement[] = container
      ? (Array.from(container.querySelectorAll("[data-carousel-slide]")) as HTMLElement[])
      : [];

    if (slideNodes.length === 0) {
      const activeSlide =
        document.getElementById("carousel-active-slide") ||
        document.getElementById("presentation-active-slide");
      if (activeSlide) slideNodes.push(activeSlide);
    }
    return slideNodes;
  };

  // 1. Native PowerPoint Export (.pptx)
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

  // 2. High-DPI PNG Export (.png)
  const handlePngExport = async () => {
    setIsExporting(true);
    setExportMessage(`Rasterizing crisp ${pngScale}x High-DPI Canvas PNG...`);
    try {
      const activeElement = getActiveCanvasElement();
      if (!activeElement) {
        throw new Error("No active canvas element found to export.");
      }
      const filename = slugifyFilename(ast.meta.title, ast.format, "png");
      await exportElementToPng(activeElement, filename, pngScale);
    } catch (err) {
      alert(err instanceof Error ? err.message : "PNG export failed");
    } finally {
      setIsExporting(false);
      setExportMessage("");
    }
  };

  // 3. Vector SVG Export (.svg)
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

  // 4. LinkedIn Multi-Slide Carousel PDF (.pdf)
  const handleCarouselPdfExport = async () => {
    setIsExporting(true);
    setExportMessage("Mounting all carousel slides for multi-page PDF compilation...");
    try {
      const slideNodes = getSlideElements();
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

  // 5. Individual Slides ZIP (.zip of numbered PNGs)
  const handleZipExport = async () => {
    setIsExporting(true);
    setExportMessage("Capturing all slides into high-DPI ZIP archive...");
    try {
      const slideNodes = getSlideElements();
      if (slideNodes.length === 0) {
        throw new Error("Unable to capture slide nodes for ZIP archive.");
      }
      await exportSlidesToZip(slideNodes, ast.meta.title, (current, total) => {
        setExportMessage(`Rendering slide ${current} of ${total} to PNG...`);
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "ZIP Slides export failed");
    } finally {
      setIsExporting(false);
      setExportMessage("");
    }
  };

  // 6. Standalone HTML / Embed
  const handleHtmlExport = () => {
    try {
      exportStandaloneHtmlFile(ast);
    } catch (err) {
      alert(err instanceof Error ? err.message : "HTML export failed");
    }
  };

  const handleCopyEmbedSnippet = async () => {
    let url = shareUrl;
    if (!url) {
      setIsSharing(true);
      try {
        const res = await fetch("/api/share", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ast, format: ast.format, templateId: ast.templateId }),
        });
        const data = await res.json();
        if (data.ok && data.shareUrl) {
          url = data.shareUrl;
          setShareUrl(data.shareUrl);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSharing(false);
      }
    }

    const embedUrl = url || "https://stat-deck.vercel.app";
    const snippet = `<iframe src="${embedUrl}" width="100%" height="640" style="border:none;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.08);" title="${ast.meta.title || "StatDeck"}"></iframe>`;
    await navigator.clipboard.writeText(snippet);
    setHasCopiedEmbed(true);
    setTimeout(() => setHasCopiedEmbed(false), 2500);
  };

  // 7. Live Shareable Web Link (/s/[shareToken])
  const handleGenerateShareLink = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setHasCopiedShareUrl(true);
      setTimeout(() => setHasCopiedShareUrl(false), 2500);
      return;
    }

    setIsSharing(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ast, format: ast.format, templateId: ast.templateId }),
      });
      const data = await res.json();
      if (data.ok && data.shareUrl) {
        setShareUrl(data.shareUrl);
        await navigator.clipboard.writeText(data.shareUrl);
        setHasCopiedShareUrl(true);
        setTimeout(() => setHasCopiedShareUrl(false), 2500);
      } else {
        throw new Error(data.error || "Failed to generate share link.");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Sharing failed");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      {/* Hidden Offscreen Container Mounting ALL Carousel Slides for PDF & ZIP Export */}
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

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full p-6 flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Export Studio Assets
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose from 7 commercial export workflows
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
          {(
            [
              { id: "all", label: "All Formats" },
              { id: "slides", label: "Decks & Carousels" },
              { id: "image", label: "Images & Vectors" },
              { id: "web", label: "Share & Embed" },
            ] as const
          ).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                selectedCategory === cat.id
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Free Tier Notice */}
        {isFree && (
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-300">
            <Sparkles className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="font-semibold">StatDeck Commercial Suite</span>
              <span className="opacity-80 mt-0.5">
                All 7 workflows are unlocked. Free exports include a discreet editorial attribution badge.
              </span>
            </div>
          </div>
        )}

        {/* Export Options Grid */}
        <div className="flex flex-col gap-2.5">
          {/* SECTION 1: DECKS & SLIDES */}
          {(selectedCategory === "all" || selectedCategory === "slides") && (
            <>
              {/* Native PPTX */}
              <button
                onClick={handlePptxExport}
                disabled={isExporting}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-orange-500/80 bg-slate-50 dark:bg-slate-950/40 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                    <Presentation className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 block">
                      Native PowerPoint (.pptx)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      100% editable shapes & native PowerPoint charts
                    </span>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 font-bold">
                  PPTX
                </span>
              </button>

              {/* LinkedIn Multi-Page PDF Carousel */}
              <button
                onClick={handleCarouselPdfExport}
                disabled={isExporting}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-red-500/80 bg-slate-50 dark:bg-slate-950/40 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-red-600 dark:group-hover:text-red-400 block">
                      LinkedIn Carousel PDF (.pdf)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      1080×1350 4:5 swipeable multi-page document ({carouselSlides.length} slides)
                    </span>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 font-bold">
                  PDF
                </span>
              </button>

              {/* Individual Slides ZIP */}
              <button
                onClick={handleZipExport}
                disabled={isExporting}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-500/80 bg-slate-50 dark:bg-slate-950/40 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                    <Archive className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 block">
                      Individual Slides ZIP Archive (.zip)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Packaged numbered slide-01.png, slide-02.png for Instagram & X threads
                    </span>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 font-bold">
                  ZIP
                </span>
              </button>
            </>
          )}

          {/* SECTION 2: IMAGES & VECTORS */}
          {(selectedCategory === "all" || selectedCategory === "image") && (
            <>
              {/* High-DPI PNG */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                    <FileImage className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                      High-DPI Retina Image (.png)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Crisp raster capture for sharing and documentation
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={pngScale}
                    onChange={(e) => setPngScale(Number(e.target.value))}
                    className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-200 font-mono"
                  >
                    <option value={2}>2x DPI</option>
                    <option value={3}>3x Retina</option>
                  </select>
                  <button
                    onClick={handlePngExport}
                    disabled={isExporting}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Download
                  </button>
                </div>
              </div>

              {/* Clean Vector SVG */}
              <button
                onClick={handleSvgExport}
                disabled={isExporting}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/80 bg-slate-50 dark:bg-slate-950/40 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 block">
                      Vector Scalable Graphic (.svg)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Pure vector format with embedded web fonts for Figma & Illustrator
                    </span>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold">
                  SVG
                </span>
              </button>
            </>
          )}

          {/* SECTION 3: WEB & EMBED */}
          {(selectedCategory === "all" || selectedCategory === "web") && (
            <>
              {/* Standalone HTML File */}
              <button
                onClick={handleHtmlExport}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-cyan-500/80 bg-slate-50 dark:bg-slate-950/40 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-100 dark:bg-cyan-950 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 block">
                      Standalone Offline HTML (.html)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Self-contained presentation file runnable in any browser offline
                    </span>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 font-bold">
                  HTML
                </span>
              </button>

              {/* Live Shareable Web Link & Embed */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                        Live Shareable Web Link
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                        Sub-10ms public link with responsive presentation viewer
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-bold">
                    WEB
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                  <button
                    onClick={handleGenerateShareLink}
                    disabled={isSharing}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-xs"
                  >
                    {isSharing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : hasCopiedShareUrl ? (
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{hasCopiedShareUrl ? "Link Copied!" : "Copy Share Link"}</span>
                  </button>

                  <button
                    onClick={handleCopyEmbedSnippet}
                    disabled={isSharing}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
                  >
                    {hasCopiedEmbed ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Code2 className="w-3.5 h-3.5" />
                    )}
                    <span>{hasCopiedEmbed ? "Embed Copied!" : "Embed Code"}</span>
                  </button>

                  {shareUrl && (
                    <a
                      href={shareUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                      title="Open shared page"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Progress Spinner */}
        {isExporting && (
          <div className="flex items-center justify-center gap-2 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 animate-pulse bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/50">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{exportMessage}</span>
          </div>
        )}

        {/* Hidden offscreen container rendering all slides for high-res PDF and ZIP export */}
        <div
          ref={offscreenContainerRef}
          aria-hidden="true"
          style={{
            position: "fixed",
            left: "-9999px",
            top: "-9999px",
            width: "540px",
            opacity: 0,
            pointerEvents: "none",
            zIndex: -999,
          }}
        >
          {carouselSlides.map((slide, idx) => (
            <div
              key={`offscreen-slide-${slide.id || idx}`}
              data-carousel-slide="true"
              className="relative w-[540px] h-[675px] rounded-2xl overflow-hidden border flex-shrink-0 mb-4"
              style={{
                backgroundColor: theme.bg,
                borderColor: theme.surfaceBorder,
                color: theme.ink,
              }}
            >
              {slide.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
