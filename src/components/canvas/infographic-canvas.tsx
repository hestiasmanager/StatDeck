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
import { getKpiValueSizeClass } from "@/lib/utils/kpi-formatter";

interface InfographicCanvasProps {
  ast: DeckAST;
  onUpdateText?: (path: string, newText: string) => void;
  scale?: number;
}

export const InfographicCanvas = React.forwardRef<HTMLDivElement, InfographicCanvasProps>(
  function InfographicCanvas({ ast, onUpdateText, scale = 1 }, ref) {
    const theme = EDITORIAL_THEMES[ast.templateId] || EDITORIAL_THEMES[DEFAULT_THEME_ID];

    return (
      <div
        className="flex justify-center my-4 transition-all duration-200"
        style={{
          width: `${800 * scale}px`,
        }}
      >
        <div
          ref={ref}
          id="statdeck-infographic-canvas"
          data-statdeck-canvas="infographic"
          className="relative shadow-2xl transition-all duration-200 font-sans border rounded-2xl overflow-hidden flex-shrink-0"
          style={{
            width: "800px",
            minHeight: "1400px",
            backgroundColor: theme.bg,
            borderColor: theme.surfaceBorder,
            color: theme.ink,
            fontFamily: theme.fontBody,
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            marginBottom: `${(scale - 1) * 1400}px`,
          }}
        >
        <div className="p-12 md:p-14 flex flex-col gap-10">
          {/* Header Banner */}
          <header className="flex flex-col gap-3 border-b border-black/10 dark:border-white/10 pb-8" style={{ borderColor: theme.surfaceBorder }}>
            {ast.meta.category && (
              <div className="flex items-center gap-2">
                <span
                  className="self-start px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest rounded-full border border-black/10 dark:border-white/10 shadow-2xs inline-flex items-center gap-1.5"
                  style={{
                    backgroundColor: theme.accentMuted,
                    color: theme.accent,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.accent }} />
                  {ast.meta.category}
                </span>
              </div>
            )}
            <h1
              className="text-4xl md:text-5xl font-black tracking-tight leading-[1.08]"
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
            <div className="w-14 h-1 rounded-full my-1" style={{ backgroundColor: theme.accent }} />
            {ast.meta.subtitle && (
              <p
                className="text-lg opacity-85 leading-relaxed font-normal max-w-2xl"
                style={{ color: theme.ink, fontFamily: theme.fontBody }}
                contentEditable={Boolean(onUpdateText)}
                suppressContentEditableWarning
                onBlur={(e) => onUpdateText?.("meta.subtitle", e.currentTarget.textContent || "")}
              >
                {ast.meta.subtitle}
              </p>
            )}
            {ast.executiveSummary && (
              <p
                className="text-base opacity-80 leading-relaxed font-normal max-w-2xl mt-2.5"
                style={{ color: theme.ink, fontFamily: theme.fontBody }}
                contentEditable={Boolean(onUpdateText)}
                suppressContentEditableWarning
                onBlur={(e) => onUpdateText?.("executiveSummary", e.currentTarget.textContent || "")}
              >
                {ast.executiveSummary}
              </p>
            )}
            {ast.coverHighlights && ast.coverHighlights.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 max-w-2xl">
                {ast.coverHighlights.slice(0, 3).map((highlight, hIdx) => (
                  <div
                    key={hIdx}
                    className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/10"
                    style={{
                      backgroundColor: `${theme.accent}0A`,
                      borderColor: theme.surfaceBorder,
                      color: theme.ink,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: theme.accent }}
                    />
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>
            )}
          </header>

          {/* KPI 4-Card Strip (Optional: skipped for qualitative docs without KPIs) */}
          {ast.kpis && ast.kpis.length > 0 && (
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4 items-stretch">
              {ast.kpis.map((kpi, index) => (
                <div
                  key={kpi.id || index}
                  className="p-6 rounded-2xl border border-black/10 dark:border-white/10 flex flex-col justify-between h-full min-h-[120px] shadow-2xs transition-all hover:scale-[1.02]"
                  style={{
                    backgroundColor: theme.surface,
                    borderColor: theme.surfaceBorder,
                    borderRadius: theme.cardRadius,
                  }}
                >
                  <span
                    className={`${getKpiValueSizeClass(
                      kpi.value,
                      "infographic"
                    )} font-extrabold tracking-tight font-mono tabular-nums leading-tight block max-w-full break-normal`}
                    style={{ color: theme.accent }}
                    contentEditable={Boolean(onUpdateText)}
                    suppressContentEditableWarning
                    onBlur={(e) => onUpdateText?.(`kpis.${index}.value`, e.currentTarget.textContent || "")}
                  >
                    {kpi.value}
                  </span>
                  <div className="mt-3">
                    <span
                      className="text-xs font-semibold leading-snug block opacity-90"
                      style={{ color: theme.ink }}
                      contentEditable={Boolean(onUpdateText)}
                      suppressContentEditableWarning
                      onBlur={(e) => onUpdateText?.(`kpis.${index}.label`, e.currentTarget.textContent || "")}
                    >
                      {kpi.label}
                    </span>
                    {kpi.delta && (
                      <span
                        className={`text-[11px] font-bold font-mono tabular-nums mt-1.5 block ${
                          kpi.deltaType === "positive"
                            ? "text-emerald-500"
                            : kpi.deltaType === "negative"
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
            </section>
          )}

          {/* KPI Analytical Narrative Callout */}
          {ast.kpis && ast.kpis.length > 0 && ast.kpiNarrative && (
            <div
              className="px-5 py-3 rounded-xl border border-black/5 dark:border-white/10 flex items-center gap-3 shadow-2xs"
              style={{
                backgroundColor: `${theme.accent}08`,
                borderColor: theme.surfaceBorder,
              }}
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: theme.accent }}
              />
              <p
                className="text-xs md:text-sm leading-relaxed opacity-90 font-medium"
                style={{ color: theme.ink }}
                contentEditable={Boolean(onUpdateText)}
                suppressContentEditableWarning
                onBlur={(e) => onUpdateText?.("kpiNarrative", e.currentTarget.textContent || "")}
              >
                {ast.kpiNarrative}
              </p>
            </div>
          )}

          {/* Primary Chart Section */}
          {ast.charts.map((chart) => {
            if (!chart.data || chart.data.length === 0) return null;
            return (
              <section
                key={chart.id}
                className="p-6 md:p-8 rounded-2xl border border-black/10 dark:border-white/10 flex flex-col gap-5 shadow-2xs"
                style={{
                  backgroundColor: theme.surface,
                  borderColor: theme.surfaceBorder,
                  borderRadius: theme.cardRadius,
                }}
              >
                <div className="flex flex-col gap-1 border-b border-black/10 dark:border-white/10 pb-3" style={{ borderColor: theme.surfaceBorder }}>
                  <span className="text-[11px] font-bold uppercase tracking-wider font-mono opacity-60" style={{ color: theme.accent }}>
                    Visual Analytics
                  </span>
                  <h3
                    className="text-xl font-extrabold tracking-tight"
                    style={{ color: theme.ink, fontFamily: theme.fontDisplay }}
                  >
                    {chart.title}
                  </h3>
                </div>

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

                {/* "What This Shows" Callout Strip */}
                {(chart.chartInsight || ast.chartInsight) && (
                  <div
                    className="mt-2 px-4 py-2 rounded-xl border border-black/5 dark:border-white/10 flex items-start gap-2.5"
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
              </section>
            );
          })}

          {/* Structured Retention Blocks */}
          {ast.blocks.map((block) => {
            if (
              block.type !== "numbered_steps" &&
              block.type !== "comparison_table" &&
              block.type !== "pros_cons" &&
              block.type !== "callout_quote" &&
              block.type !== "key_takeaways"
            ) {
              return null;
            }

            return (
              <section
                key={block.id}
                className="p-6 md:p-8 rounded-2xl border border-black/10 dark:border-white/10 shadow-2xs"
                style={{
                  backgroundColor: theme.surface,
                  borderColor: theme.surfaceBorder,
                  borderRadius: theme.cardRadius,
                }}
              >
                {block.type === "numbered_steps" && (
                  <ProcessStepsBlock
                    title={block.title}
                    steps={block.steps}
                    accentColor={theme.accent}
                    inkColor={theme.ink}
                    surfaceBorder={theme.surfaceBorder}
                  />
                )}
                {block.type === "comparison_table" && (
                  <ComparisonTableBlock
                    title={block.title}
                    headers={block.headers}
                    rows={block.rows}
                    inkColor={theme.ink}
                    surfaceBorder={theme.surfaceBorder}
                    accentColor={theme.accent}
                  />
                )}
                {block.type === "pros_cons" && (
                  <ProsConsBlock
                    title={block.title}
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
              </section>
            );
          })}

          {/* Footer & Source Citations */}
          <footer className="mt-auto border-t pt-6 flex items-center justify-between" style={{ borderColor: theme.surfaceBorder }}>
            {ast.meta.sourceCitations.length > 0 ? (
              <p className="text-xs opacity-60 font-mono">
                Source: {ast.meta.sourceCitations.join(" • ")}
              </p>
            ) : (
              <div />
            )}
            <WatermarkBadge visible={ast.watermark} accentColor={theme.accent} />
          </footer>
        </div>
      </div>
    </div>
    );
  }
);
