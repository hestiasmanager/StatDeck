"use client";

import React, { useState, useEffect, useRef } from "react";
import type { DeckAST } from "@/lib/schemas/deck-schema";
import { getThemeTokens } from "@/lib/themes/registry";
import { ChevronLeft, ChevronRight, Monitor } from "lucide-react";
import { SvgBarChart } from "@/components/charts/svg-bar-chart";
import { SvgHorizontalBar } from "@/components/charts/svg-horizontal-bar";
import { SvgDonutChart } from "@/components/charts/svg-donut-chart";
import { SvgLineChart } from "@/components/charts/svg-line-chart";
import { ProcessStepsBlock } from "@/components/blocks/process-steps";
import { ComparisonTableBlock } from "@/components/blocks/comparison-table";
import { ProsConsBlock } from "@/components/blocks/pros-cons-block";
import { CalloutQuoteBlock } from "@/components/blocks/callout-quote";
import { KeyTakeawaysBlock } from "@/components/blocks/key-takeaways";
import { WatermarkBadge } from "@/components/studio/watermark-badge";
import { getKpiValueSizeClass } from "@/lib/utils/kpi-formatter";

interface PresentationCanvasProps {
  ast: DeckAST;
  onUpdateText?: (path: string, newText: string) => void;
  scale?: number;
  currentSlideIndex?: number;
  onSlideChange?: (index: number) => void;
}

export function PresentationCanvas({
  ast,
  onUpdateText,
  scale = 1,
  currentSlideIndex: controlledIndex,
  onSlideChange,
}: PresentationCanvasProps) {
  const [internalSlideIndex, setInternalSlideIndex] = useState(0);
  const theme = getThemeTokens(ast.templateId);

  // Deck identity tracking to reset slide index back to 0 whenever a new deck is synthesized
  const deckKey =
    ast.id ||
    `${ast.meta.title}-${ast.meta.date || ""}-${ast.kpis?.length ?? 0}-${ast.charts?.length ?? 0}-${ast.blocks?.length ?? 0}`;
  const prevDeckKeyRef = useRef(deckKey);

  useEffect(() => {
    if (prevDeckKeyRef.current !== deckKey) {
      prevDeckKeyRef.current = deckKey;
      if (onSlideChange) {
        onSlideChange(0);
      } else {
        setInternalSlideIndex(0);
      }
    }
  }, [deckKey, onSlideChange]);

  const effectiveIndex = controlledIndex !== undefined ? controlledIndex : internalSlideIndex;

  const setSlide = (newIndex: number) => {
    const clamped = Math.min(Math.max(0, newIndex), Math.max(0, slides.length - 1));
    if (onSlideChange) {
      onSlideChange(clamped);
    } else {
      setInternalSlideIndex(clamped);
    }
  };

  // Cover slide dynamic typography & pills calculations
  const title = ast.meta.title || "";
  const titleLen = title.length;
  const summaryLen = (ast.executiveSummary || "").length;
  const isLongCover = titleLen > 30 || summaryLen > 140;
  const maxCoverHighlights = isLongCover ? 2 : 3;

  const coverTitleClass =
    titleLen <= 26
      ? "text-5xl"
      : titleLen <= 40
      ? "text-4xl"
      : "text-3xl leading-[1.08]";

  // 16:9 Slides Sequence
  const rawSlides = [
    // Slide 1: Cover (Magazine Cover Design)
    {
      id: "cover",
      content: (
        <div className="flex flex-col h-full justify-between overflow-hidden px-12 py-6 relative">
          {ast.meta.category && (
            <div className="flex items-center gap-2 shrink-0">
              <span
                className="px-3.5 py-0.5 text-[11px] font-bold uppercase tracking-widest rounded-full border border-black/10 dark:border-white/10 shadow-2xs inline-flex items-center gap-1.5"
                style={{ backgroundColor: theme.accentMuted, color: theme.accent }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.accent }} />
                {ast.meta.category}
              </span>
            </div>
          )}
          <div className={`flex-1 min-h-0 flex flex-col justify-center overflow-hidden max-w-2xl ${isLongCover ? "gap-2.5" : "gap-3"}`}>
            <h1
              className={`font-black tracking-tight ${coverTitleClass}`}
              style={{
                color: theme.ink,
                fontFamily: theme.fontDisplay,
              }}
              contentEditable={Boolean(onUpdateText)}
              suppressContentEditableWarning
              onBlur={(e) => onUpdateText?.("meta.title", e.currentTarget.textContent || "")}
            >
              {ast.meta.title}
            </h1>
            <div className="w-12 h-1 rounded-full shrink-0" style={{ backgroundColor: theme.accent }} />
            {ast.meta.subtitle && (
              <p
                className="text-sm leading-snug opacity-85 font-normal max-w-xl"
                style={{ color: theme.ink, fontFamily: theme.fontBody }}
                contentEditable={Boolean(onUpdateText)}
                suppressContentEditableWarning
                onBlur={(e) => onUpdateText?.("meta.subtitle", e.currentTarget.textContent || "")}
              >
                {ast.meta.subtitle}
              </p>
            )}
            {/* Executive Summary */}
            {ast.executiveSummary && (
              <p
                className="text-sm leading-snug opacity-80 font-normal max-w-xl"
                style={{ color: theme.ink, fontFamily: theme.fontBody }}
                contentEditable={Boolean(onUpdateText)}
                suppressContentEditableWarning
                onBlur={(e) => onUpdateText?.("executiveSummary", e.currentTarget.textContent || "")}
              >
                {ast.executiveSummary}
              </p>
            )}
            {/* Cover Takeaway Highlights (dynamic max 2 or 3 pills) */}
            {ast.coverHighlights && ast.coverHighlights.length > 0 && (
              <div className={`flex flex-col ${isLongCover ? "gap-1.5" : "gap-2"} mt-1 max-w-xl shrink-0`}>
                {ast.coverHighlights.slice(0, maxCoverHighlights).map((highlight, hIdx) => (
                  <div
                    key={hIdx}
                    className="flex items-start gap-2 py-2 px-3 text-xs leading-snug font-medium rounded-lg border border-black/5 dark:border-white/10"
                    style={{
                      backgroundColor: `${theme.accent}0A`,
                      borderColor: theme.surfaceBorder,
                      color: theme.ink,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1"
                      style={{ backgroundColor: theme.accent }}
                    />
                    <span className="leading-snug">{highlight}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <footer
            className="shrink-0 pt-3 mt-2 border-t border-black/10 dark:border-white/10 flex items-center justify-between gap-3"
            style={{ borderColor: theme.surfaceBorder }}
          >
            <span className="text-xs font-mono opacity-60">
              {ast.meta.date ? `${ast.meta.date} • ` : ""}Source: {ast.meta.sourceCitations[0] || "StatDeck"}
            </span>
            <WatermarkBadge visible={ast.watermark} accentColor={theme.accent} customLogoUrl={ast.brandLogoUrl} />
          </footer>
        </div>
      ),
    },
    // Slide 2: KPIs & Executive Summary (Optional: skipped for qualitative docs without KPIs)
    ...(ast.kpis && ast.kpis.length > 0
      ? [
          {
            id: "kpis",
            content: (
              <div className="flex flex-col h-full justify-between overflow-hidden px-12 pt-8 pb-5">
                <div className="flex flex-col gap-1 border-b pb-3 shrink-0" style={{ borderColor: theme.surfaceBorder }}>
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.accent }}>
                    Key Metrics
                  </span>
                  <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: theme.ink, fontFamily: theme.fontDisplay }}>
                    Executive Performance Summary
                  </h2>
                </div>
                <div className="flex-1 min-h-0 flex flex-col justify-center gap-3 overflow-hidden">
                  <div className="grid grid-cols-4 gap-4 my-auto items-stretch">
                    {ast.kpis.map((kpi, idx) => (
                      <div
                        key={idx}
                        className="p-4 md:p-5 rounded-2xl border border-black/10 dark:border-white/10 flex flex-col justify-between h-full min-h-[110px] shadow-2xs transition-all hover:scale-[1.02] overflow-hidden min-w-0"
                        style={{
                          backgroundColor: theme.surface,
                          borderColor: theme.surfaceBorder,
                          borderRadius: theme.cardRadius,
                        }}
                      >
                        <span
                          className={`${getKpiValueSizeClass(
                            kpi.value,
                            "presentation"
                          )} font-extrabold tracking-tight font-mono tabular-nums leading-tight block max-w-full break-normal`}
                          style={{ color: theme.accent }}
                          title={kpi.value}
                        >
                          {kpi.value}
                        </span>
                        <div className="mt-3">
                          <span className="text-xs font-semibold leading-snug block opacity-90" style={{ color: theme.ink }}>
                            {kpi.label}
                          </span>
                          {kpi.delta && (
                            <span
                              className={`text-[11px] font-bold font-mono tabular-nums mt-1.5 block ${
                                kpi.deltaType === "positive" ||
                                (!kpi.deltaType &&
                                  (kpi.delta.startsWith("+") ||
                                    kpi.delta.toLowerCase().includes("free") ||
                                    kpi.delta.toLowerCase().includes("saved")))
                                  ? "text-emerald-500"
                                  : kpi.deltaType === "negative" ||
                                    (!kpi.deltaType && kpi.delta.startsWith("-"))
                                  ? "text-rose-500"
                                  : "opacity-60"
                              }`}
                            >
                              {kpi.delta}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* KPI Analytical Narrative Callout */}
                  {ast.kpiNarrative && (
                    <div
                      className="px-4 py-2 rounded-xl border border-black/5 dark:border-white/10 flex items-start gap-2.5 shrink-0"
                      style={{
                        backgroundColor: `${theme.accent}08`,
                        borderColor: theme.surfaceBorder,
                      }}
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: theme.accent }}
                      />
                      <p
                        className="text-xs leading-relaxed opacity-85 font-medium"
                        style={{ color: theme.ink }}
                        contentEditable={Boolean(onUpdateText)}
                        suppressContentEditableWarning
                        onBlur={(e) => onUpdateText?.("kpiNarrative", e.currentTarget.textContent || "")}
                        title={ast.kpiNarrative}
                      >
                        {ast.kpiNarrative}
                      </p>
                    </div>
                  )}
                </div>
                <footer className="shrink-0 pt-3 mt-2 border-t flex items-center justify-between" style={{ borderColor: theme.surfaceBorder }}>
                  <span className="text-xs font-mono opacity-60">Executive Summary</span>
                  <WatermarkBadge visible={ast.watermark} accentColor={theme.accent} customLogoUrl={ast.brandLogoUrl} />
                </footer>
              </div>
            ),
          },
        ]
      : []),
    // Slide 3+: Visual Charts (Dynamic 0 to 6 charts)
    ...ast.charts.map((chart, chartIdx) => ({
      id: chart.id || `chart-${chartIdx}`,
      content: (
        <div className="flex flex-col h-full justify-between overflow-hidden px-12 pt-8 pb-5">
          <div className="flex flex-col gap-0.5 border-b pb-3 shrink-0" style={{ borderColor: theme.surfaceBorder }}>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.accent }}>
              Visual Analytics {ast.charts.length > 1 ? `(${chartIdx + 1}/${ast.charts.length})` : ""}
            </span>
            <h2 className="text-2xl font-bold truncate" style={{ color: theme.ink, fontFamily: theme.fontDisplay }}>
              {chart.title}
            </h2>
          </div>
          <div className="flex-1 min-h-0 flex flex-col justify-center gap-3 overflow-hidden">
            <div
              className="p-3 rounded-2xl border max-w-3xl mx-auto w-full flex items-center justify-center overflow-hidden flex-1 min-h-0"
              style={{
                backgroundColor: theme.surface,
                borderColor: theme.surfaceBorder,
                borderRadius: theme.cardRadius,
              }}
            >
              <div className="w-full h-full flex items-center justify-center">
                {chart.type === "bar" && (
                  <SvgBarChart chart={chart} accentColor={theme.accent} inkColor={theme.ink} />
                )}
                {chart.type === "horizontal_bar" && (
                  <SvgHorizontalBar chart={chart} accentColor={theme.accent} inkColor={theme.ink} />
                )}
                {chart.type === "donut" && (
                  <SvgDonutChart
                    chart={chart}
                    colorPalette={theme.chartColors}
                    inkColor={theme.ink}
                  />
                )}
                {(chart.type === "line" || chart.type === "area") && (
                  <SvgLineChart chart={chart} accentColor={theme.accent} inkColor={theme.ink} />
                )}
              </div>
            </div>
            {/* "What This Shows" Callout Strip */}
            {(chart.chartInsight || ast.chartInsight) && (
              <div
                className="px-3.5 py-1.5 rounded-xl border border-black/5 dark:border-white/10 flex items-start gap-2.5 shrink-0"
                style={{
                  backgroundColor: `${theme.accent}0A`,
                  borderColor: theme.surfaceBorder,
                }}
              >
                <span
                  className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md text-white flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: theme.accent }}
                >
                  What This Shows
                </span>
                <p
                  className="text-xs leading-relaxed font-medium opacity-90"
                  style={{ color: theme.ink }}
                  title={chart.chartInsight || ast.chartInsight}
                >
                  {chart.chartInsight || ast.chartInsight}
                </p>
              </div>
            )}
          </div>
          <footer className="shrink-0 pt-3 mt-2 border-t flex items-center justify-between" style={{ borderColor: theme.surfaceBorder }}>
            <span className="text-xs font-mono opacity-60 truncate max-w-[400px]">{chart.title}</span>
            <WatermarkBadge visible={ast.watermark} accentColor={theme.accent} customLogoUrl={ast.brandLogoUrl} />
          </footer>
        </div>
      ),
    })),

    // Slide 4+: Structured Blocks (with comparison_table paginated into max 5 rows per slide)
    ...ast.blocks.flatMap((block, bIdx) => {
      if (block.type === "comparison_table" && block.rows && block.rows.length > 5) {
        const chunkSize = 5;
        const totalParts = Math.ceil(block.rows.length / chunkSize);
        return Array.from({ length: totalParts }, (_, p) => {
          const chunkRows = block.rows.slice(p * chunkSize, (p + 1) * chunkSize);
          const startRow = p * chunkSize + 1;
          const endRow = Math.min(block.rows.length, (p + 1) * chunkSize);
          return {
            id: `block-${bIdx + 1}-table-p${p + 1}`,
            content: (
              <div className="flex flex-col h-full justify-between overflow-hidden px-12 pt-8 pb-5">
                <div className="flex flex-col gap-1 border-b pb-3 shrink-0" style={{ borderColor: theme.surfaceBorder }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.accent }}>
                      Comparison Table {totalParts > 1 ? `(${p + 1}/${totalParts})` : ""}
                    </span>
                    <span className="text-xs font-mono opacity-60">
                      Rows {startRow}–{endRow} of {block.rows.length}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold truncate" style={{ color: theme.ink, fontFamily: theme.fontDisplay }}>
                    {block.title || "Comparison Matrix"}
                  </h2>
                </div>
                <div className="flex-1 min-h-0 flex flex-col justify-center gap-3 overflow-hidden max-w-3xl mx-auto w-full">
                  <div className="my-auto flex flex-col justify-start items-start pt-2">
                    <ComparisonTableBlock
                      headers={block.headers}
                      rows={chunkRows}
                      inkColor={theme.ink}
                      surfaceBorder={theme.surfaceBorder}
                      accentColor={theme.accent}
                    />
                  </div>
                </div>
                <footer className="shrink-0 pt-3 mt-2 border-t flex items-center justify-between" style={{ borderColor: theme.surfaceBorder }}>
                  <span className="text-xs font-mono opacity-60">Rows {startRow}–{endRow} of {block.rows.length}</span>
                  <WatermarkBadge visible={ast.watermark} accentColor={theme.accent} customLogoUrl={ast.brandLogoUrl} />
                </footer>
              </div>
            ),
          };
        });
      }
      return [
        {
          id: block.id || `block-${bIdx + 1}`,
          content: (
            <div className="flex flex-col h-full justify-between overflow-hidden px-12 pt-8 pb-5">
              <div className="flex flex-col gap-1 border-b pb-3 shrink-0" style={{ borderColor: theme.surfaceBorder }}>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.accent }}>
                  Strategic Breakdown
                </span>
                <h2 className="text-2xl font-bold truncate" style={{ color: theme.ink, fontFamily: theme.fontDisplay }}>
                  {"title" in block && block.title
                    ? block.title
                    : block.type === "key_takeaways"
                    ? "Key Takeaways"
                    : "Strategic Breakdown"}
                </h2>
              </div>
              <div className="flex-1 min-h-0 flex flex-col justify-center gap-3 overflow-hidden max-w-3xl mx-auto w-full">
                <div className="my-auto">
                  {block.type === "numbered_steps" && (
                    <ProcessStepsBlock
                      steps={block.steps}
                      accentColor={theme.accent}
                      inkColor={theme.ink}
                      surfaceBorder={theme.surfaceBorder}
                    />
                  )}
                  {block.type === "comparison_table" && (
                    <div className="w-full flex flex-col justify-start items-start pt-2">
                      <ComparisonTableBlock
                        headers={block.headers}
                        rows={block.rows}
                        inkColor={theme.ink}
                        surfaceBorder={theme.surfaceBorder}
                        accentColor={theme.accent}
                      />
                    </div>
                  )}
                  {block.type === "pros_cons" && (
                    <ProsConsBlock
                      pros={block.pros}
                      cons={block.cons}
                      inkColor={theme.ink}
                      surfaceBorder={theme.surfaceBorder}
                    />
                  )}
                  {block.type === "callout_quote" && (
                    <CalloutQuoteBlock
                      quote={block.quote}
                      author={block.author}
                      role={block.role}
                      accentColor={theme.accent}
                      inkColor={theme.ink}
                      surfaceBorder={theme.surfaceBorder}
                    />
                  )}
                  {block.type === "key_takeaways" && (
                    <KeyTakeawaysBlock
                      title={block.title}
                      bullets={block.bullets}
                      accentColor={theme.accent}
                      inkColor={theme.ink}
                      surfaceBorder={theme.surfaceBorder}
                    />
                  )}
                </div>
              </div>
              <footer className="shrink-0 pt-3 mt-2 border-t flex items-center justify-between" style={{ borderColor: theme.surfaceBorder }}>
                <span className="text-xs font-mono opacity-60">{"title" in block && block.title ? block.title : "Key Takeaways"}</span>
                <WatermarkBadge visible={ast.watermark} accentColor={theme.accent} customLogoUrl={ast.brandLogoUrl} />
              </footer>
            </div>
          ),
        },
      ];
    }),
  ];

  // Apply slideOrder if defined
  let slides = rawSlides;
  if (ast.slideOrder && ast.slideOrder.length > 0) {
    const orderMap = new Map(ast.slideOrder.map((id, idx) => [id, idx]));
    slides = [...rawSlides].sort((a, b) => {
      const orderA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999;
      const orderB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999;
      return orderA - orderB;
    });
  }

  const safeSlideIndex = Math.min(Math.max(0, effectiveIndex), Math.max(0, slides.length - 1));

  return (
    <div className="flex flex-col items-center gap-4 my-auto py-2">
      {/* 16:9 Presentation Canvas Container with Scale */}
      <div
        className="relative flex items-center justify-center transition-all duration-200"
        style={{
          width: `${800 * scale}px`,
          height: `${450 * scale}px`,
        }}
      >
        <div
          id="presentation-active-slide"
          data-statdeck-canvas="presentation"
          className="relative w-[800px] h-[450px] rounded-2xl shadow-2xl overflow-hidden border transition-all duration-200 flex-shrink-0"
          style={{
            backgroundColor: theme.bg,
            borderColor: theme.surfaceBorder,
            color: theme.ink,
            transform: `scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          {slides[safeSlideIndex]?.content}
        </div>
      </div>

      {/* Slide Navigation */}
      <div className="flex items-center gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-md text-xs font-medium z-10">
        <button
          onClick={() => setSlide(safeSlideIndex - 1)}
          disabled={safeSlideIndex === 0}
          className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors cursor-pointer"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="flex items-center gap-1.5 font-mono">
          <Monitor className="w-3.5 h-3.5 text-blue-500" />
          16:9 Slide {safeSlideIndex + 1} of {slides.length}
        </span>

        <button
          onClick={() => setSlide(safeSlideIndex + 1)}
          disabled={safeSlideIndex >= slides.length - 1}
          className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors cursor-pointer"
          aria-label="Next Slide"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
