"use client";

import React from "react";
import type { DeckAST } from "@/lib/schemas/deck-schema";
import { getThemeTokens } from "@/lib/themes/registry";
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
import { ArrowRight } from "lucide-react";

export interface CarouselSlideData {
  id: string;
  title: string;
  content: React.ReactNode;
}

/**
 * Builds the sequence of 4:5 swipeable LinkedIn carousel slides from a DeckAST.
 */
export function buildCarouselSlides(
  ast: DeckAST,
  onUpdateText?: (path: string, newText: string) => void
): CarouselSlideData[] {
  const theme = getThemeTokens(ast.templateId);
  const slides: CarouselSlideData[] = [];

  // Slide 1: Cover (Magazine Cover Design)
  slides.push({
    id: "cover",
    title: "Cover",
    content: (
      <div className="flex flex-col justify-between h-full p-10 md:p-12 relative overflow-hidden">
        {/* Topic Category Pill Badge */}
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

        {/* Magazine Editorial Headline & Accent Rule */}
        <div className="my-auto flex flex-col justify-center">
          <h1
            className="text-4xl md:text-5xl font-black tracking-tight leading-[1.08] mb-3"
            style={{ color: theme.ink, fontFamily: theme.fontDisplay }}
            contentEditable={Boolean(onUpdateText)}
            suppressContentEditableWarning
            onBlur={(e) => onUpdateText?.("meta.title", e.currentTarget.textContent || "")}
          >
            {ast.meta.title}
          </h1>

          {/* Clean Accent Rule */}
          <div
            className="w-14 h-1 rounded-full my-3"
            style={{ backgroundColor: theme.accent }}
          />

          {/* 1-Line Deck Subtitle */}
          {ast.meta.subtitle && (
            <p
              className="text-base md:text-lg opacity-85 leading-relaxed font-normal max-w-lg mt-1"
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
              className="text-xs md:text-sm opacity-80 leading-relaxed font-normal max-w-lg mt-2.5"
              style={{ color: theme.ink, fontFamily: theme.fontBody }}
              contentEditable={Boolean(onUpdateText)}
              suppressContentEditableWarning
              onBlur={(e) => onUpdateText?.("executiveSummary", e.currentTarget.textContent || "")}
            >
              {ast.executiveSummary}
            </p>
          )}

          {/* Cover Takeaway Highlights */}
          {ast.coverHighlights && ast.coverHighlights.length > 0 && (
            <div className="flex flex-col gap-1.5 mt-3 max-w-lg">
              {ast.coverHighlights.slice(0, 3).map((highlight, hIdx) => (
                <div
                  key={hIdx}
                  className="flex items-start gap-2 text-[11px] md:text-xs font-medium px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/10"
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

        {/* Magazine Footer */}
        <div
          className="border-t border-black/10 dark:border-white/10 pt-4 flex items-center justify-between gap-3 mt-auto shrink-0"
          style={{ borderColor: theme.surfaceBorder }}
        >
          <div className="flex items-center gap-2 text-xs font-mono opacity-65" style={{ color: theme.ink }}>
            {ast.meta.date && <span>{ast.meta.date} •</span>}
            {ast.meta.sourceCitations[0] ? (
              <span className="truncate max-w-[200px]">Source: {ast.meta.sourceCitations[0]}</span>
            ) : (
              <span className="inline-flex items-center gap-1 font-medium font-sans">
                <span>Swipe</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-70" />
              </span>
            )}
          </div>
          <WatermarkBadge visible={ast.watermark} accentColor={theme.accent} />
        </div>
      </div>
    ),
  });

  // Slide 2: Metrics Dashboard (Optional: skipped for qualitative docs without KPIs)
  if (ast.kpis && ast.kpis.length > 0) {
    slides.push({
      id: "kpis",
      title: "Core Metrics",
      content: (
        <div className="flex flex-col justify-between h-full p-10 md:p-12">
          <div className="flex flex-col gap-1 border-b pb-4" style={{ borderColor: theme.surfaceBorder }}>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.accent }}>
              Key Performance Indicators
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: theme.ink, fontFamily: theme.fontDisplay }}>
              The Hard Numbers
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 items-stretch my-auto">
            {ast.kpis.map((kpi, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl border border-black/10 dark:border-white/10 flex flex-col justify-between h-full min-h-[140px] shadow-2xs transition-all hover:scale-[1.02]"
                style={{
                  backgroundColor: theme.surface,
                  borderColor: theme.surfaceBorder,
                  borderRadius: theme.cardRadius,
                }}
              >
                <span
                  className={`${getKpiValueSizeClass(
                    kpi.value,
                    "carousel"
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
              className="mt-2.5 p-3 rounded-xl border border-black/5 dark:border-white/10 flex items-start gap-2.5 shrink-0"
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
              >
                {ast.kpiNarrative}
              </p>
            </div>
          )}
          <div className="border-t pt-4 flex items-center justify-between" style={{ borderColor: theme.surfaceBorder }}>
            <span className="text-xs font-mono opacity-60" style={{ color: theme.ink }}>
              Core Metrics
            </span>
            <WatermarkBadge visible={ast.watermark} accentColor={theme.accent} />
          </div>
        </div>
      ),
    });
  }

  // Slide 3+: Visual Charts (Dynamic 0 to 6 charts)
  ast.charts.forEach((chart, chartIdx) => {
    slides.push({
      id: chart.id || `chart-${chartIdx + 1}`,
      title: chart.title || `Chart ${chartIdx + 1}`,
      content: (
        <div className="flex flex-col justify-between h-full p-10 md:p-12">
          <div className="flex flex-col gap-1 border-b pb-4" style={{ borderColor: theme.surfaceBorder }}>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.accent }}>
              Visual Analytics {ast.charts.length > 1 ? `(${chartIdx + 1}/${ast.charts.length})` : ""}
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: theme.ink, fontFamily: theme.fontDisplay }}>
              {chart.title}
            </h2>
          </div>
          <div
            className="p-6 md:p-8 rounded-2xl border border-black/10 dark:border-white/10 my-auto shadow-2xs"
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.surfaceBorder,
              borderRadius: theme.cardRadius,
            }}
          >
            {chart.type === "bar" && (
              <SvgBarChart chart={chart} accentColor={theme.accent} inkColor={theme.ink} />
            )}
            {chart.type === "horizontal_bar" && (
              <SvgHorizontalBar chart={chart} accentColor={theme.accent} inkColor={theme.ink} />
            )}
            {chart.type === "donut" && (
              <SvgDonutChart chart={chart} colorPalette={theme.chartColors} inkColor={theme.ink} />
            )}
            {(chart.type === "line" || chart.type === "area") && (
              <SvgLineChart chart={chart} accentColor={theme.accent} inkColor={theme.ink} />
            )}
          </div>
          {/* "What This Shows" Callout Strip */}
          {(chart.chartInsight || ast.chartInsight) && (
            <div
              className="mt-2.5 px-3.5 py-2 rounded-xl border border-black/5 dark:border-white/10 flex items-start gap-2.5 shrink-0"
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
          <div className="border-t pt-4 flex items-center justify-between" style={{ borderColor: theme.surfaceBorder }}>
            <span className="text-xs font-mono opacity-60" style={{ color: theme.ink }}>
              {chart.title || "Data Breakdown"}
            </span>
            <WatermarkBadge visible={ast.watermark} accentColor={theme.accent} />
          </div>
        </div>
      ),
    });
  });

  // Slide 4+: Structured Blocks (1-to-1 matching SlideFilmstrip)
  ast.blocks.forEach((block, bIdx) => {
    slides.push({
      id: block.id || `block-${bIdx + 1}`,
      title: "title" in block && block.title ? block.title : `Insight ${bIdx + 1}`,
      content: (
        <div className="flex flex-col justify-between h-full p-10 md:p-12">
            <div className="flex flex-col gap-1 border-b pb-4" style={{ borderColor: theme.surfaceBorder }}>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.accent }}>
                Strategic Breakdown
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: theme.ink, fontFamily: theme.fontDisplay }}>
                {"title" in block && block.title
                  ? block.title
                  : block.type === "key_takeaways"
                  ? "Key Takeaways"
                  : "Core Insights"}
              </h2>
            </div>
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
            <div className="border-t pt-4 flex items-center justify-between" style={{ borderColor: theme.surfaceBorder }}>
              <span className="text-xs font-mono opacity-60" style={{ color: theme.ink }}>
                {"title" in block && block.title ? block.title : "Strategic Insights"}
              </span>
              <WatermarkBadge visible={ast.watermark} accentColor={theme.accent} />
            </div>
          </div>
        ),
      });
  });

  // Slide 5: Outro & Citations
  slides.push({
    id: "outro",
    title: "Conclusion",
    content: (
      <div className="flex flex-col justify-between h-full p-10 md:p-12 text-center">
        <span
          className="self-center px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest rounded-full border border-black/10 dark:border-white/10"
          style={{ backgroundColor: theme.accentMuted, color: theme.accent }}
        >
          Summary & Next Steps
        </span>
        <div className="my-auto flex flex-col gap-4 max-w-sm mx-auto">
          <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: theme.ink, fontFamily: theme.fontDisplay }}>
            Key Takeaways
          </h2>
          <p className="text-sm opacity-85 leading-relaxed font-normal" style={{ color: theme.ink }}>
            {ast.meta.subtitle || "Data synthesized deterministically from source report."}
          </p>
          {ast.meta.sourceCitations.length > 0 && (
            <div className="text-xs opacity-60 font-mono mt-4">
              Sources: {ast.meta.sourceCitations.join(", ")}
            </div>
          )}
        </div>
        <div className="border-t pt-4 flex items-center justify-between" style={{ borderColor: theme.surfaceBorder }}>
          <span className="text-xs font-mono opacity-60" style={{ color: theme.ink }}>
            Summary
          </span>
          <WatermarkBadge visible={ast.watermark} accentColor={theme.accent} />
        </div>
      </div>
    ),
  });

  return slides;
}
