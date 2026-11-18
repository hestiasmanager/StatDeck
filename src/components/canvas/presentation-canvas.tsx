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
    // Slide 1: Cover
    {
      id: "deck-cover",
      content: (
        <div className="flex flex-col justify-between h-full p-12">
          {ast.meta.category && (
            <span
              className="self-start px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md"
              style={{ backgroundColor: theme.accentMuted, color: theme.accent }}
            >
              {ast.meta.category}
            </span>
          )}
          <div className="my-auto flex flex-col gap-4 max-w-2xl">
            <h1
              className="text-4xl font-extrabold tracking-tight leading-tight"
              style={{ color: theme.ink, fontFamily: theme.fontDisplay }}
              contentEditable={Boolean(onUpdateText)}
              suppressContentEditableWarning
              onBlur={(e) => onUpdateText?.("meta.title", e.currentTarget.textContent || "")}
            >
              {ast.meta.title}
            </h1>
            {ast.meta.subtitle && (
              <p
                className="text-base opacity-80 leading-relaxed"
                style={{ color: theme.ink }}
                contentEditable={Boolean(onUpdateText)}
                suppressContentEditableWarning
                onBlur={(e) => onUpdateText?.("meta.subtitle", e.currentTarget.textContent || "")}
              >
                {ast.meta.subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: theme.surfaceBorder }}>
            <span className="text-xs font-mono opacity-60">
              {ast.meta.date ? `${ast.meta.date} • ` : ""}Source: {ast.meta.sourceCitations[0] || "StatDeck"}
            </span>
            <WatermarkBadge visible={ast.watermark} />
          </div>
        </div>
      ),
    },
    // Slide 2: KPIs & Executive Summary
    {
      id: "deck-kpis",
      content: (
        <div className="flex flex-col justify-between h-full p-12">
          <div className="flex flex-col gap-1 border-b pb-4" style={{ borderColor: theme.surfaceBorder }}>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.accent }}>
              Key Metrics
            </span>
            <h2 className="text-2xl font-bold" style={{ color: theme.ink, fontFamily: theme.fontDisplay }}>
              Executive Performance Summary
            </h2>
          </div>
          <div className="grid grid-cols-4 gap-4 my-auto">
            {ast.kpis.map((kpi, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl border flex flex-col justify-between"
                style={{
                  backgroundColor: theme.surface,
                  borderColor: theme.surfaceBorder,
                  borderRadius: theme.cardRadius,
                }}
              >
                <span className="text-3xl font-extrabold" style={{ color: theme.accent }}>
                  {kpi.value}
                </span>
                <div className="mt-3">
                  <span className="text-xs font-semibold block" style={{ color: theme.ink }}>
                    {kpi.label}
                  </span>
                  {kpi.delta && (
                    <span
                      className={`text-[11px] font-bold mt-1 block ${
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
          <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: theme.surfaceBorder }}>
            <span className="text-xs font-mono opacity-60">Executive Summary</span>
            <WatermarkBadge visible={ast.watermark} />
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
              <div className="flex flex-col justify-between h-full p-12">
                <div className="flex flex-col gap-1 border-b pb-4" style={{ borderColor: theme.surfaceBorder }}>
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.accent }}>
                    Data Analytics
                  </span>
                  <h2 className="text-2xl font-bold" style={{ color: theme.ink, fontFamily: theme.fontDisplay }}>
                    {ast.charts[0].title}
                  </h2>
                </div>
                <div
                  className="p-6 rounded-2xl border my-auto max-w-3xl mx-auto w-full"
                  style={{
                    backgroundColor: theme.surface,
                    borderColor: theme.surfaceBorder,
                    borderRadius: theme.cardRadius,
                  }}
                >
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
                <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: theme.surfaceBorder }}>
                  <span className="text-xs font-mono opacity-60">{ast.charts[0].title}</span>
                  <WatermarkBadge visible={ast.watermark} />
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
              <div className="flex flex-col justify-between h-full p-12">
                <div className="flex flex-col gap-1 border-b pb-4" style={{ borderColor: theme.surfaceBorder }}>
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.accent }}>
                    Strategic Breakdown
                  </span>
                  <h2 className="text-2xl font-bold" style={{ color: theme.ink, fontFamily: theme.fontDisplay }}>
                    {"title" in ast.blocks[0] && ast.blocks[0].title ? ast.blocks[0].title : "Implementation Levers"}
                  </h2>
                </div>
                <div className="my-auto max-w-3xl mx-auto w-full">
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
                <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: theme.surfaceBorder }}>
                  <span className="text-xs font-mono opacity-60">Key Takeaways</span>
                  <WatermarkBadge visible={ast.watermark} />
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
