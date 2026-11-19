"use client";

import React, { useState } from "react";
import type { DeckAST } from "@/lib/schemas/deck-schema";
import { EDITORIAL_THEMES, DEFAULT_THEME_ID } from "@/lib/themes/registry";
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

interface PresentationCanvasProps {
  ast: DeckAST;
  onUpdateText?: (path: string, newText: string) => void;
  scale?: number;
}

export function PresentationCanvas({ ast, onUpdateText, scale = 1 }: PresentationCanvasProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const theme = EDITORIAL_THEMES[ast.templateId] || EDITORIAL_THEMES[DEFAULT_THEME_ID];

  // 16:9 Slides Sequence
  const slides = [
    // Slide 1: Cover (Magazine Cover Design)
    {
      id: "deck-cover",
      content: (
        <div className="flex flex-col justify-between h-full px-12 pt-10 pb-6 relative overflow-hidden">
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
          <div className="my-auto flex flex-col justify-center max-w-2xl">
            <h1
              className="text-4xl md:text-5xl font-black tracking-tight leading-[1.08] mb-3"
              style={{ color: theme.ink, fontFamily: theme.fontDisplay }}
              contentEditable={Boolean(onUpdateText)}
              suppressContentEditableWarning
              onBlur={(e) => onUpdateText?.("meta.title", e.currentTarget.textContent || "")}
            >
              {ast.meta.title}
            </h1>
            <div className="w-14 h-1 rounded-full my-3" style={{ backgroundColor: theme.accent }} />
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
    // Slide 2: KPIs & Executive Summary
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
          <div className="grid grid-cols-4 gap-4 my-auto flex-1 min-h-0 items-center">
            {ast.kpis.map((kpi, idx) => (
              <div
                key={idx}
                className="p-5 md:p-6 rounded-2xl border border-black/10 dark:border-white/10 flex flex-col justify-between shadow-2xs transition-all hover:scale-[1.02]"
                style={{
                  backgroundColor: theme.surface,
                  borderColor: theme.surfaceBorder,
                  borderRadius: theme.cardRadius,
                }}
              >
                <span
                  className="text-3xl md:text-4xl font-extrabold tracking-tight font-mono tabular-nums leading-none"
                  style={{ color: theme.accent }}
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
          <div className="flex items-center justify-between border-t pt-3 mt-auto shrink-0" style={{ borderColor: theme.surfaceBorder }}>
            <span className="text-xs font-mono opacity-60">Executive Summary</span>
            <WatermarkBadge visible={ast.watermark} accentColor={theme.accent} />
          </div>
        </div>
      ),
    },
    // Slide 3: Chart Visualization
    ...(ast.charts.length > 0
      ? [
          {
            id: "deck-chart",
            content: (
              <div className="flex flex-col justify-between h-full px-12 pt-8 pb-5">
                <div className="flex flex-col gap-0.5 border-b pb-3 shrink-0" style={{ borderColor: theme.surfaceBorder }}>
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.accent }}>
                    Data Analytics
                  </span>
                  <h2 className="text-2xl font-bold truncate" style={{ color: theme.ink, fontFamily: theme.fontDisplay }}>
                    {ast.charts[0].title}
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
                    {ast.charts[0].type === "bar" && (
                      <SvgBarChart chart={ast.charts[0]} accentColor={theme.accent} inkColor={theme.ink} />
                    )}
                    {ast.charts[0].type === "horizontal_bar" && (
                      <SvgHorizontalBar chart={ast.charts[0]} accentColor={theme.accent} inkColor={theme.ink} />
                    )}
                    {ast.charts[0].type === "donut" && (
                      <SvgDonutChart
                        chart={ast.charts[0]}
                        colorPalette={theme.chartColors}
                        inkColor={theme.ink}
                      />
                    )}
                    {(ast.charts[0].type === "line" || ast.charts[0].type === "area") && (
                      <SvgLineChart chart={ast.charts[0]} accentColor={theme.accent} inkColor={theme.ink} />
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t pt-3 mt-auto shrink-0" style={{ borderColor: theme.surfaceBorder }}>
                  <span className="text-xs font-mono opacity-60 truncate max-w-[400px]">{ast.charts[0].title}</span>
                  <WatermarkBadge visible={ast.watermark} accentColor={theme.accent} />
                </div>
              </div>
            ),
          },
        ]
      : []),
    // Slide 4: Structured Blocks
    ...(ast.blocks.length > 0
      ? [
          {
            id: "deck-blocks",
            content: (
              <div className="flex flex-col justify-between h-full px-12 pt-8 pb-5">
                <div className="flex flex-col gap-1 border-b pb-3 shrink-0" style={{ borderColor: theme.surfaceBorder }}>
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.accent }}>
                    Strategic Breakdown
                  </span>
                  <h2 className="text-2xl font-bold truncate" style={{ color: theme.ink, fontFamily: theme.fontDisplay }}>
                    {"title" in ast.blocks[0] && ast.blocks[0].title ? ast.blocks[0].title : "Implementation Levers"}
                  </h2>
                </div>
                <div className="my-auto max-w-3xl mx-auto w-full flex-1 min-h-0 overflow-hidden flex flex-col justify-center">
                  {ast.blocks[0].type === "numbered_steps" && (
                    <ProcessStepsBlock
                      steps={ast.blocks[0].steps}
                      accentColor={theme.accent}
                      inkColor={theme.ink}
                      surfaceBorder={theme.surfaceBorder}
                    />
                  )}
                  {ast.blocks[0].type === "comparison_table" && (
                    <ComparisonTableBlock
                      headers={ast.blocks[0].headers}
                      rows={ast.blocks[0].rows}
                      inkColor={theme.ink}
                      surfaceBorder={theme.surfaceBorder}
                      accentColor={theme.accent}
                    />
                  )}
                  {ast.blocks[0].type === "pros_cons" && (
                    <ProsConsBlock
                      pros={ast.blocks[0].pros}
                      cons={ast.blocks[0].cons}
                      inkColor={theme.ink}
                      surfaceBorder={theme.surfaceBorder}
                    />
                  )}
                  {ast.blocks[0].type === "callout_quote" && (
                    <CalloutQuoteBlock
                      quote={ast.blocks[0].quote}
                      author={ast.blocks[0].author}
                      role={ast.blocks[0].role}
                      accentColor={theme.accent}
                      inkColor={theme.ink}
                      surfaceBorder={theme.surfaceBorder}
                    />
                  )}
                  {ast.blocks[0].type === "key_takeaways" && (
                    <KeyTakeawaysBlock
                      title={ast.blocks[0].title}
                      bullets={ast.blocks[0].bullets}
                      accentColor={theme.accent}
                      inkColor={theme.ink}
                      surfaceBorder={theme.surfaceBorder}
                    />
                  )}
                </div>
                <div className="flex items-center justify-between border-t pt-3 mt-auto shrink-0" style={{ borderColor: theme.surfaceBorder }}>
                  <span className="text-xs font-mono opacity-60">Key Takeaways</span>
                  <WatermarkBadge visible={ast.watermark} accentColor={theme.accent} />
                </div>
              </div>
            ),
          },
        ]
      : []),
  ];

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
          {slides[currentSlideIndex].content}
        </div>
      </div>

      {/* Slide Navigation */}
      <div className="flex items-center gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-md text-xs font-medium z-10">
        <button
          onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentSlideIndex === 0}
          className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="flex items-center gap-1.5 font-mono">
          <Monitor className="w-3.5 h-3.5 text-blue-500" />
          16:9 Slide {currentSlideIndex + 1} of {slides.length}
        </span>

        <button
          onClick={() => setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1))}
          disabled={currentSlideIndex === slides.length - 1}
          className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
          aria-label="Next Slide"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
