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
        <div className="p-12 flex flex-col gap-10">
          {/* Header Banner */}
          <header className="flex flex-col gap-3 border-b pb-8" style={{ borderColor: theme.surfaceBorder }}>
            {ast.meta.category && (
              <span
                className="self-start px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md"
                style={{
                  backgroundColor: theme.accentMuted,
                  color: theme.accent,
                }}
              >
                {ast.meta.category}
              </span>
            )}
            <h1
              className="text-4xl font-extrabold tracking-tight leading-tight"
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
            {ast.meta.subtitle && (
              <p
                className="text-lg opacity-80 leading-relaxed font-normal"
                style={{ color: theme.ink }}
                contentEditable={Boolean(onUpdateText)}
                suppressContentEditableWarning
                onBlur={(e) => onUpdateText?.("meta.subtitle", e.currentTarget.textContent || "")}
              >
                {ast.meta.subtitle}
              </p>
            )}
          </header>

          {/* KPI 4-Card Strip */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ast.kpis.map((kpi, index) => (
              <div
                key={kpi.id || index}
                className="p-5 rounded-2xl border flex flex-col justify-between transition-all"
                style={{
                  backgroundColor: theme.surface,
                  borderColor: theme.surfaceBorder,
                  borderRadius: theme.cardRadius,
                }}
              >
                <span
                  className="text-3xl font-extrabold tracking-tight leading-none"
                  style={{ color: theme.accent }}
                  contentEditable={Boolean(onUpdateText)}
                  suppressContentEditableWarning
                  onBlur={(e) => onUpdateText?.(`kpis.${index}.value`, e.currentTarget.textContent || "")}
                >
                  {kpi.value}
                </span>
                <div className="mt-3">
                  <span
                    className="text-xs font-semibold leading-tight block"
                    style={{ color: theme.ink }}
                    contentEditable={Boolean(onUpdateText)}
                    suppressContentEditableWarning
                    onBlur={(e) => onUpdateText?.(`kpis.${index}.label`, e.currentTarget.textContent || "")}
                  >
                    {kpi.label}
                  </span>
                  {kpi.delta && (
                    <span
                      className={`text-[11px] font-bold mt-1 block ${
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

          {/* Primary Chart Section */}
          {ast.charts.map((chart) => {
            if (!chart.data || chart.data.length === 0) return null;
            return (
              <section
                key={chart.id}
                className="p-6 rounded-2xl border flex flex-col gap-4 shadow-sm"
                style={{
                  backgroundColor: theme.surface,
                  borderColor: theme.surfaceBorder,
                  borderRadius: theme.cardRadius,
                }}
              >
                <h3
                  className="text-base font-bold tracking-tight"
                  style={{ color: theme.ink, fontFamily: theme.fontDisplay }}
                >
                  {chart.title}
                </h3>

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
                className="p-6 rounded-2xl border shadow-sm"
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
            <WatermarkBadge visible={ast.watermark} />
          </footer>
        </div>
      </div>
    </div>
    );
  }
);
