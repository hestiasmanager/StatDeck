"use client";

import React, { useState } from "react";
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
  const [prevDeckKey, setPrevDeckKey] = useState(deckKey);

  if (prevDeckKey !== deckKey) {
    setPrevDeckKey(deckKey);
    if (onSlideChange) {
      onSlideChange(0);
    } else {
      setInternalSlideIndex(0);
    }
  }

  const effectiveIndex = controlledIndex !== undefined ? controlledIndex : internalSlideIndex;

  const setSlide = (newIndex: number) => {
    const clamped = Math.min(Math.max(0, newIndex), Math.max(0, slides.length - 1));
    if (onSlideChange) {
      onSlideChange(clamped);
    } else {
      setInternalSlideIndex(clamped);
    }
  };

  // 16:9 Slides Sequence
  const slides = [
    // Slide 1: Cover (Magazine Cover Design)
    {
      id: "deck-cover",
      content: (
        <div className="flex flex-col justify-between h-full px-12 py-7 relative overflow-hidden">
          {ast.meta.category && (
            <div className="flex items-center gap-2">
              <span
                className="px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest rounded-full border border-black/10 dark:border-white/10 shadow-2xs inline-flex items-center gap-1.5"
                style={{ backgroundColor: theme.accentMuted, color: theme.accent }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.accent }} />
                {ast.meta.category}
              </span>
            </div>
          )}
          <div className="my-auto flex flex-col justify-center max-w-2xl flex-1 min-h-0">
            <h1
              className="text-4xl md:text-5xl font-black tracking-tight leading-[1.08] mb-2"
              style={{ color: theme.ink, fontFamily: theme.fontDisplay }}
              contentEditable={Boolean(onUpdateText)}
              suppressContentEditableWarning
              onBlur={(e) => onUpdateText?.("meta.title", e.currentTarget.textContent || "")}
            >
              {ast.meta.title}
            </h1>
            <div className="w-14 h-1 rounded-full my-2" style={{ backgroundColor: theme.accent }} />
            {ast.meta.subtitle && (
              <p
                className="text-base md:text-lg opacity-85 leading-relaxed font-normal max-w-xl"
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
                className="text-xs md:text-sm opacity-80 leading-relaxed font-normal max-w-xl mt-2"
                style={{ color: theme.ink, fontFamily: theme.fontBody }}
                contentEditable={Boolean(onUpdateText)}
                suppressContentEditableWarning
                onBlur={(e) => onUpdateText?.("executiveSummary", e.currentTarget.textContent || "")}
              >
                {ast.executiveSummary}
              </p>
            )}
            {/* Cover Takeaway Highlights (limit to 2 items to guarantee footer breathing room) */}
            {ast.coverHighlights && ast.coverHighlights.length > 0 && (
              <div className="flex flex-col gap-1.5 mt-2 max-w-xl">
                {ast.coverHighlights.slice(0, 2).map((highlight, hIdx) => (
                  <div
                    key={hIdx}
                    className="flex items-start gap-2 text-xs font-medium px-3 py-1 rounded-lg border border-black/5 dark:border-white/10"
                    style={{
                      backgroundColor: `${theme.accent}0A`,
                      borderColor: theme.surfaceBorder,
                      color: theme.ink,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                      style={{ backgroundColor: theme.accent }}
                    />
                    <span className="leading-snug">{highlight}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between border-t border-black/10 dark:border-white/10 pt-3 mt-auto shrink-0" style={{ borderColor: theme.surfaceBorder }}>
            <span className="text-xs font-mono opacity-60">
              {ast.meta.date ? `${ast.meta.date} • ` : ""}Source: {ast.meta.sourceCitations[0] || "StatDeck"}
            </span>
            <WatermarkBadge visible={ast.watermark} accentColor={theme.accent} />
          </div>
        </div>
      ),
    },
    // Slide 2: KPIs & Executive Summary (Optional: skipped for qualitative docs without KPIs)
    ...(ast.kpis && ast.kpis.length > 0
      ? [
          {
            id: "deck-kpis",
            content: (
              <div className="flex flex-col justify-between h-full px-12 pt-8 pb-5">
                <div className="flex flex-col gap-1 border-b pb-3 shrink-0" style={{ borderColor: theme.surfaceBorder }}>
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.accent }}>
                    Key Metrics
                  </span>
                  <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: theme.ink, fontFamily: theme.fontDisplay }}>
                    Executive Performance Summary
                  </h2>
                </div>
                <div className="grid grid-cols-4 gap-4 my-auto flex-1 min-h-0 items-stretch">
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
                    className="mt-2.5 px-4 py-2 rounded-xl border border-black/5 dark:border-white/10 flex items-start gap-2.5 shrink-0"
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
                <div className="flex items-center justify-between border-t pt-3 mt-auto shrink-0" style={{ borderColor: theme.surfaceBorder }}>
                  <span className="text-xs font-mono opacity-60">Executive Summary</span>
                  <WatermarkBadge visible={ast.watermark} accentColor={theme.accent} />
                </div>
              </div>
            ),
          },
        ]
      : []),
    // Slide 3+: Visual Charts (Dynamic 0 to 6 charts)
    ...ast.charts.map((chart, chartIdx) => ({
      id: chart.id || `deck-chart-${chartIdx + 1}`,
      content: (
        <div className="flex flex-col justify-between h-full px-12 pt-8 pb-5">
          <div className="flex flex-col gap-0.5 border-b pb-3 shrink-0" style={{ borderColor: theme.surfaceBorder }}>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.accent }}>
              Visual Analytics {ast.charts.length > 1 ? `(${chartIdx + 1}/${ast.charts.length})` : ""}
            </span>
            <h2 className="text-2xl font-bold truncate" style={{ color: theme.ink, fontFamily: theme.fontDisplay }}>
              {chart.title}
            </h2>
          </div>
          <div
            className="flex-1 min-h-0 my-2 p-3 rounded-2xl border max-w-3xl mx-auto w-full flex items-center justify-center overflow-hidden"
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.surfaceBorder,
              borderRadius: theme.cardRadius,
            }}
          >
            <div className="w-full h-full max-h-[220px] flex items-center justify-center">
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
              className="mt-2 px-3.5 py-1.5 rounded-xl border border-black/5 dark:border-white/10 flex items-start gap-2.5 shrink-0"
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
          <div className="flex items-center justify-between border-t pt-3 mt-auto shrink-0" style={{ borderColor: theme.surfaceBorder }}>
            <span className="text-xs font-mono opacity-60 truncate max-w-[400px]">{chart.title}</span>
            <WatermarkBadge visible={ast.watermark} accentColor={theme.accent} />
          </div>
        </div>
      ),
    })),

    // Slide 4+: Structured Blocks (1-to-1 matching SlideFilmstrip)
    ...ast.blocks.map((block, bIdx) => ({
      id: block.id || `deck-block-${bIdx + 1}`,
      content: (
        <div className="flex flex-col justify-between h-full px-12 pt-8 pb-5">
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
          <div className="my-auto max-w-3xl mx-auto w-full flex-1 min-h-0 overflow-hidden flex flex-col justify-center">
            {block.type === "numbered_steps" && (
              <ProcessStepsBlock
                steps={block.steps}
                accentColor={theme.accent}
                inkColor={theme.ink}
                surfaceBorder={theme.surfaceBorder}
              />
            )}
            {block.type === "comparison_table" && (
              <ComparisonTableBlock
                headers={block.headers}
                rows={block.rows}
                inkColor={theme.ink}
                surfaceBorder={theme.surfaceBorder}
                accentColor={theme.accent}
              />
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
          <div className="flex items-center justify-between border-t pt-3 mt-auto shrink-0" style={{ borderColor: theme.surfaceBorder }}>
            <span className="text-xs font-mono opacity-60">{"title" in block && block.title ? block.title : "Key Takeaways"}</span>
            <WatermarkBadge visible={ast.watermark} accentColor={theme.accent} />
          </div>
        </div>
      ),
    })),
  ];

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
