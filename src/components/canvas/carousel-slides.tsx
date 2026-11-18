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

  // Slide 1: Cover
  slides.push({
    id: "cover",
    title: "Cover",
    content: (
      <div className="flex flex-col justify-between h-full p-12">
        {ast.meta.category && (
          <span
            className="self-start px-3.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md"
            style={{ backgroundColor: theme.accentMuted, color: theme.accent }}
          >
            {ast.meta.category}
          </span>
        )}
        <div className="my-auto flex flex-col gap-4">
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
              className="text-lg opacity-80 leading-relaxed"
              style={{ color: theme.ink }}
              contentEditable={Boolean(onUpdateText)}
              suppressContentEditableWarning
              onBlur={(e) => onUpdateText?.("meta.subtitle", e.currentTarget.textContent || "")}
            >
              {ast.meta.subtitle}
            </p>
          )}
        </div>
        <div className="border-t pt-4 flex items-center justify-between" style={{ borderColor: theme.surfaceBorder }}>
          <span className="text-xs font-mono opacity-60" style={{ color: theme.ink }}>
            Swipe for deep dive 👉
          </span>
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
      <div className="flex flex-col justify-between h-full p-12">
        <div className="flex flex-col gap-1 border-b pb-4" style={{ borderColor: theme.surfaceBorder }}>
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.accent }}>
            Key Performance Indicators
          </span>
          <h2 className="text-2xl font-bold" style={{ color: theme.ink, fontFamily: theme.fontDisplay }}>
            The Hard Numbers
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-4 my-auto">
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
              <span className="text-3xl font-extrabold tracking-tight" style={{ color: theme.accent }}>
                {kpi.value}
              </span>
              <div className="mt-2">
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
        <div className="flex flex-col justify-between h-full p-12">
          <div className="flex flex-col gap-1 border-b pb-4" style={{ borderColor: theme.surfaceBorder }}>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.accent }}>
              Visual Analytics
            </span>
            <h2 className="text-2xl font-bold" style={{ color: theme.ink, fontFamily: theme.fontDisplay }}>
              {chart.title}
            </h2>
          </div>
          <div
            className="p-6 rounded-2xl border my-auto"
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
        <div className="flex flex-col justify-between h-full p-12">
          <div className="flex flex-col gap-1 border-b pb-4" style={{ borderColor: theme.surfaceBorder }}>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.accent }}>
              Strategic Breakdown
            </span>
            <h2 className="text-2xl font-bold" style={{ color: theme.ink, fontFamily: theme.fontDisplay }}>
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
      <div className="flex flex-col justify-between h-full p-12 text-center">
        <span
          className="self-center px-3.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md"
          style={{ backgroundColor: theme.accentMuted, color: theme.accent }}
        >
          Summary & Next Steps
        </span>
        <div className="my-auto flex flex-col gap-4 max-w-sm mx-auto">
          <h2 className="text-3xl font-extrabold" style={{ color: theme.ink, fontFamily: theme.fontDisplay }}>
            Key Takeaways
          </h2>
          <p className="text-sm opacity-80 leading-relaxed" style={{ color: theme.ink }}>
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
