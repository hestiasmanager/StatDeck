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
import { SourceProvenancePopover } from "@/components/studio/source-provenance-popover";
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
  const isDarkTheme =
    theme.category === "dark" ||
    theme.bg.toLowerCase().startsWith("#0") ||
    theme.bg.toLowerCase().startsWith("#1");
  const slides: CarouselSlideData[] = [];

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

  // Slide 1: Cover (Magazine Cover Design)
  slides.push({
    id: "cover",
    title: "Cover",
    content: (
      <div className="flex flex-col h-full justify-between overflow-hidden p-10 md:p-12 relative">
        {/* Topic Category Pill Badge */}
        {ast.meta.category && (
          <div className="flex items-center gap-2 shrink-0">
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
        <div className={`flex-1 min-h-0 flex flex-col justify-center overflow-hidden ${isLongCover ? "gap-2.5" : "gap-3"}`}>
          <h1
            className={`font-black tracking-tight ${coverTitleClass}`}
            style={{ color: theme.ink, fontFamily: theme.fontDisplay }}
            contentEditable={Boolean(onUpdateText)}
            suppressContentEditableWarning
            onBlur={(e) => onUpdateText?.("meta.title", e.currentTarget.textContent || "")}
          >
            {ast.meta.title}
          </h1>

          {/* Clean Accent Rule */}
          <div
            className="w-14 h-1 rounded-full shrink-0"
            style={{ backgroundColor: theme.accent }}
          />

          {/* 1-Line Deck Subtitle */}
          {ast.meta.subtitle && (
            <p
              className="text-sm leading-snug opacity-85 font-normal max-w-lg"
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
              className="text-sm leading-snug opacity-80 font-normal max-w-lg"
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
            <div className={`flex flex-col ${isLongCover ? "gap-1.5" : "gap-2"} mt-1 max-w-lg shrink-0`}>
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

        {/* Magazine Footer */}
        <footer
          className="shrink-0 pt-3 mt-2 border-t border-black/10 dark:border-white/10 flex items-center justify-between gap-3"
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
          <WatermarkBadge visible={ast.watermark} accentColor={theme.accent} customLogoUrl={ast.brandLogoUrl} />
        </footer>
      </div>
    ),
  });

  // Slide 2: Metrics Dashboard (Optional: skipped for qualitative docs without KPIs)
  if (ast.kpis && ast.kpis.length > 0) {
    slides.push({
      id: "kpis",
      title: "Core Metrics",
      content: (
        <div className="flex flex-col h-full justify-between overflow-hidden p-10 md:p-12">
          <div className="flex flex-col gap-1 border-b pb-4 shrink-0" style={{ borderColor: theme.surfaceBorder }}>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.accent }}>
              Key Performance Indicators
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: theme.ink, fontFamily: theme.fontDisplay }}>
              The Hard Numbers
            </h2>
          </div>
          <div className="flex-1 min-h-0 flex flex-col justify-center gap-3 overflow-visible relative z-10">
            <div className="grid grid-cols-2 gap-4 items-stretch my-auto">
              {ast.kpis.map((kpi, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-2xl border border-black/10 dark:border-white/10 flex flex-col justify-between h-full min-h-[140px] shadow-2xs transition-all hover:scale-[1.02] overflow-visible"
                  style={{
                    backgroundColor: theme.surface,
                    borderColor: theme.surfaceBorder,
                    borderRadius: theme.cardRadius,
                  }}
                >
                  <div className="flex items-start justify-between gap-2 overflow-visible">
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
                    <SourceProvenancePopover
                      quote={kpi.sourceQuote}
                      page={kpi.sourcePage}
                      row={kpi.sourceRow}
                      side="bottom"
                      accentColor={theme.accent}
                      inkColor={theme.ink}
                      isDark={isDarkTheme}
                      onUpdateCitation={(quote, ref) => {
                        onUpdateText?.(`kpis.${idx}.sourceQuote`, quote);
                        onUpdateText?.(`kpis.${idx}.sourcePage`, ref);
                      }}
                    />
                  </div>
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
                className="p-3 rounded-xl border border-black/5 dark:border-white/10 flex items-start gap-2.5 shrink-0"
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
          </div>
          <footer className="shrink-0 pt-3 mt-2 border-t flex items-center justify-between" style={{ borderColor: theme.surfaceBorder }}>
            <span className="text-xs font-mono opacity-60" style={{ color: theme.ink }}>
              Core Metrics
            </span>
            <WatermarkBadge visible={ast.watermark} accentColor={theme.accent} customLogoUrl={ast.brandLogoUrl} />
          </footer>
        </div>
      ),
    });
  }

  // Slide 3+: Visual Charts (Dynamic 0 to 6 charts)
  ast.charts.forEach((chart, chartIdx) => {
    slides.push({
      id: chart.id || `chart-${chartIdx}`,
      title: chart.title || `Chart ${chartIdx + 1}`,
      content: (
        <div className="flex flex-col h-full justify-between overflow-hidden p-10 md:p-12">
          <div className="flex items-center justify-between border-b pb-4 shrink-0" style={{ borderColor: theme.surfaceBorder }}>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.accent }}>
                Visual Analytics {ast.charts.length > 1 ? `(${chartIdx + 1}/${ast.charts.length})` : ""}
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: theme.ink, fontFamily: theme.fontDisplay }}>
                {chart.title}
              </h2>
            </div>
            {chart.data?.[0] && (
              <SourceProvenancePopover
                quote={chart.data[0].sourceQuote}
                page={chart.data[0].sourcePage}
                row={chart.data[0].sourceRow}
                accentColor={theme.accent}
                inkColor={theme.ink}
                isDark={isDarkTheme}
                onUpdateCitation={(quote, ref) => {
                  onUpdateText?.(`charts.${chartIdx}.data.0.sourceQuote`, quote);
                  onUpdateText?.(`charts.${chartIdx}.data.0.sourcePage`, ref);
                }}
              />
            )}
          </div>
          <div className="flex-1 min-h-0 flex flex-col justify-center gap-3 overflow-hidden">
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
                className="px-3.5 py-2 rounded-xl border border-black/5 dark:border-white/10 flex items-start gap-2.5 shrink-0"
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
            <span className="text-xs font-mono opacity-60" style={{ color: theme.ink }}>
              {chart.title || "Data Breakdown"}
            </span>
            <WatermarkBadge visible={ast.watermark} accentColor={theme.accent} customLogoUrl={ast.brandLogoUrl} />
          </footer>
        </div>
      ),
    });
  });

  // Slide 4+: Structured Blocks (with comparison_table paginated into max 5 rows per slide)
  ast.blocks.forEach((block, bIdx) => {
    if (block.type === "comparison_table" && block.rows && block.rows.length > 5) {
      const chunkSize = 5;
      const totalParts = Math.ceil(block.rows.length / chunkSize);
      for (let p = 0; p < totalParts; p++) {
        const chunkRows = block.rows.slice(p * chunkSize, (p + 1) * chunkSize);
        const startRow = p * chunkSize + 1;
        const endRow = Math.min(block.rows.length, (p + 1) * chunkSize);
        slides.push({
          id: `block-${bIdx + 1}-table-p${p + 1}`,
          title: `${block.title || "Comparison"} (Rows ${startRow}–${endRow})`,
          content: (
            <div className="flex flex-col h-full justify-between overflow-hidden p-10 md:p-12">
              <div className="flex flex-col gap-1 border-b pb-4 shrink-0" style={{ borderColor: theme.surfaceBorder }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.accent }}>
                    Comparison Table {totalParts > 1 ? `(${p + 1}/${totalParts})` : ""}
                  </span>
                  <span className="text-xs font-mono opacity-60">
                    Rows {startRow}–{endRow} of {block.rows.length}
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: theme.ink, fontFamily: theme.fontDisplay }}>
                  {block.title || "Comparison Matrix"}
                </h2>
              </div>
              <div className="flex-1 min-h-0 flex flex-col justify-center gap-3 overflow-hidden">
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
                <span className="text-xs font-mono opacity-60" style={{ color: theme.ink }}>
                  Rows {startRow}–{endRow} of {block.rows.length}
                </span>
                <WatermarkBadge visible={ast.watermark} accentColor={theme.accent} customLogoUrl={ast.brandLogoUrl} />
              </footer>
            </div>
          ),
        });
      }
    } else {
      slides.push({
        id: block.id || `block-${bIdx + 1}`,
        title: "title" in block && block.title ? block.title : `Insight ${bIdx + 1}`,
        content: (
          <div className="flex flex-col h-full justify-between overflow-hidden p-10 md:p-12">
            <div className="flex flex-col gap-1 border-b pb-4 shrink-0" style={{ borderColor: theme.surfaceBorder }}>
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
            <div className="flex-1 min-h-0 flex flex-col justify-center gap-3 overflow-hidden">
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
                  <div className="flex flex-col justify-start items-start pt-2">
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
              <span className="text-xs font-mono opacity-60" style={{ color: theme.ink }}>
                {"title" in block && block.title ? block.title : "Strategic Insights"}
              </span>
              <WatermarkBadge visible={ast.watermark} accentColor={theme.accent} customLogoUrl={ast.brandLogoUrl} />
            </footer>
          </div>
        ),
      });
    }
  });

  // Apply slideOrder if defined
  if (ast.slideOrder && ast.slideOrder.length > 0) {
    const orderMap = new Map(ast.slideOrder.map((id, idx) => [id, idx]));
    slides.sort((a, b) => {
      const orderA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999;
      const orderB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999;
      return orderA - orderB;
    });
  }

  // Slide 5: Outro & Citations
  slides.push({
    id: "outro",
    title: "Conclusion",
    content: (
      <div className="flex flex-col h-full justify-between overflow-hidden p-10 md:p-12 text-center">
        <span
          className="self-center px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest rounded-full border border-black/10 dark:border-white/10 shrink-0"
          style={{ backgroundColor: theme.accentMuted, color: theme.accent }}
        >
          Summary & Next Steps
        </span>
        <div className="flex-1 min-h-0 flex flex-col justify-center gap-3 overflow-hidden">
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
        </div>
        <footer className="shrink-0 pt-3 mt-2 border-t flex items-center justify-between" style={{ borderColor: theme.surfaceBorder }}>
          <span className="text-xs font-mono opacity-60" style={{ color: theme.ink }}>
            Summary
          </span>
          <WatermarkBadge visible={ast.watermark} accentColor={theme.accent} customLogoUrl={ast.brandLogoUrl} />
        </footer>
      </div>
    ),
  });

  return slides;
}
