"use client";

import React from "react";
import type { DeckAST } from "@/lib/schemas/deck-schema";
import { EDITORIAL_THEMES, DEFAULT_THEME_ID } from "@/lib/themes/registry";
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
  const theme = EDITORIAL_THEMES[ast.templateId] || EDITORIAL_THEMES[DEFAULT_THEME_ID];
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
        </div>

        {/* Magazine Footer */}
        <div
          className="border-t border-black/10 dark:border-white/10 pt-4 flex items-center justify-between gap-3 mt-auto shrink-0"
          style={{ borderColor: theme.surfaceBorder }}
        >
          <div className="flex items-center gap-2 text-xs font-mono opacity-65" style={{ color: theme.ink }}>
            {ast.meta.date && <span>{ast.meta.date} •</span>}
            <span className="truncate max-w-[200px]">
              {ast.meta.sourceCitations[0] ? `Source: ${ast.meta.sourceCitations[0]}` : "Swipe for breakdown 👉"}
            </span>
          </div>
          <WatermarkBadge visible={ast.watermark} />
        </div>
      </div>
    ),
  });

  // Slide 2: Metrics Dashboard
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
        <div className="grid grid-cols-2 gap-4 my-auto">
          {ast.kpis.map((kpi, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl border border-black/10 dark:border-white/10 flex flex-col justify-between shadow-2xs transition-all hover:scale-[1.02]"
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
        <div className="border-t pt-4 flex items-center justify-between" style={{ borderColor: theme.surfaceBorder }}>
          <span className="text-xs font-mono opacity-60" style={{ color: theme.ink }}>
            Core Metrics
          </span>
          <WatermarkBadge visible={ast.watermark} />
        </div>
      </div>
    ),
  });

  // Slide 3: Visual Chart (if present)
  if (ast.charts.length > 0) {
    const chart = ast.charts[0];
    slides.push({
      id: "chart",
      title: "Data Story",
      content: (
        <div className="flex flex-col justify-between h-full p-10 md:p-12">
          <div className="flex flex-col gap-1 border-b pb-4" style={{ borderColor: theme.surfaceBorder }}>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.accent }}>
              Visual Analytics
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
          <div className="border-t pt-4 flex items-center justify-between" style={{ borderColor: theme.surfaceBorder }}>
            <span className="text-xs font-mono opacity-60" style={{ color: theme.ink }}>
              Data Breakdown
            </span>
            <WatermarkBadge visible={ast.watermark} />
          </div>
        </div>
      ),
    });
  }

  // Slide 4: Strategic Takeaway Blocks (if present)
  if (ast.blocks.length > 0) {
    const block = ast.blocks[0];
    slides.push({
      id: "blocks",
      title: "Strategy",
      content: (
        <div className="flex flex-col justify-between h-full p-10 md:p-12">
          <div className="flex flex-col gap-1 border-b pb-4" style={{ borderColor: theme.surfaceBorder }}>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.accent }}>
              Strategic Breakdown
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: theme.ink, fontFamily: theme.fontDisplay }}>
              {"title" in block && block.title ? block.title : "Core Insights"}
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
              Strategic Insights
            </span>
            <WatermarkBadge visible={ast.watermark} />
          </div>
        </div>
      ),
    });
  }

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
          <WatermarkBadge visible={ast.watermark} />
        </div>
      </div>
    ),
  });

  return slides;
}
