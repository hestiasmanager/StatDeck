import { z } from "zod";

/**
 * Chart Type options supported across both Browser SVG renderer and native PPTX exporter.
 */
export const ChartTypeSchema = z.enum([
  "bar",
  "horizontal_bar",
  "donut",
  "line",
  "area",
]);

export const ChartDataPointSchema = z.object({
  label: z.string().describe("Short label for category or time interval"),
  value: z.number().describe("Numerical value"),
  secondaryValue: z.number().optional().describe("Optional comparison/baseline value"),
  color: z.string().optional().describe("Optional custom hex override"),
});

export const ChartBlockSchema = z.object({
  id: z.string(),
  type: ChartTypeSchema,
  title: z.string().max(80).describe("Chart headline or takeaway"),
  unit: z.string().default("").describe("Unit label, e.g. '$M', '%', 'users'"),
  xAxisLabel: z.string().optional(),
  yAxisLabel: z.string().optional(),
  data: z.array(ChartDataPointSchema).min(2).max(12),
});

export const KpiCardSchema = z.object({
  id: z.string(),
  value: z.string().max(20).describe("Bold formatted figure, e.g. '$42.8M', '+184%'"),
  label: z.string().max(40).describe("Descriptive metric name"),
  delta: z.string().max(25).optional().describe("e.g. '+38% YoY', '-4.2% MoM'"),
  deltaType: z.enum(["positive", "negative", "neutral"]).default("neutral"),
  description: z.string().max(100).optional().describe("One sentence micro-context"),
});

export const ProcessStepSchema = z.object({
  step: z.number().int().min(1),
  title: z.string().max(60),
  description: z.string().max(160),
});

export const ComparisonRowSchema = z.object({
  feature: z.string().max(80),
  colA: z.string().max(120),
  colB: z.string().max(120).optional(),
  values: z.array(z.string().max(120)).optional(),
});

export const BlockSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string(),
    type: z.literal("numbered_steps"),
    title: z.string().max(80).optional(),
    steps: z.array(ProcessStepSchema).min(2).max(5),
  }),
  z.object({
    id: z.string(),
    type: z.literal("comparison_table"),
    title: z.string().max(80).optional(),
    headers: z.array(z.string().max(80)).min(2),
    rows: z.array(ComparisonRowSchema).min(2).max(10),
  }),
  z.object({
    id: z.string(),
    type: z.literal("pros_cons"),
    title: z.string().max(80).optional(),
    pros: z.array(z.string().max(120)).min(1).max(5),
    cons: z.array(z.string().max(120)).min(1).max(5),
  }),
  z.object({
    id: z.string(),
    type: z.literal("callout_quote"),
    quote: z.string().max(240),
    author: z.string().max(60),
    role: z.string().max(80).optional(),
  }),
  z.object({
    id: z.string(),
    type: z.literal("key_takeaways"),
    title: z.string().max(80).optional(),
    bullets: z.array(
      z.object({
        headline: z.string().max(50),
        detail: z.string().max(140),
      })
    ).min(2).max(5),
  }),
]);

export const DeckMetaSchema = z.object({
  title: z.string().min(3).max(120).describe("Punchy editorial headline"),
  subtitle: z.string().max(200).describe("Contextual subtitle or thesis statement"),
  category: z.string().max(35).optional().describe("Topic badge e.g. 'Fintech', 'SaaS Metrics'"),
  sourceCitations: z.array(z.string().max(100)).max(4).default([]).describe("Data sources cited"),
  readTime: z.string().optional().describe("e.g. '2 min read'"),
  date: z
    .string()
    .optional()
    .describe(
      "Publication or analysis date strictly from source. Leave blank or omit if no explicit year or date appears in the input - do NOT invent placeholder dates like '2023-Q3'"
    ),
});

export const OutputFormatSchema = z.enum(["infographic", "carousel", "presentation"]);

export const DeckSchema = z.object({
  id: z.string().uuid().optional(),
  meta: DeckMetaSchema,
  kpis: z.array(KpiCardSchema).min(1).max(4).describe("1 to 4 core high-impact metrics"),
  charts: z.array(ChartBlockSchema).max(6).describe("0 to 6 primary data charts"),
  blocks: z.array(BlockSchema).max(10).describe("Structured process, comparison, or takeaway blocks"),
  templateId: z.string().default("clean-bento"),
  format: OutputFormatSchema.default("carousel"),
  brandKitId: z.string().optional(),
  watermark: z.boolean().default(true),
});

export type DeckAST = z.infer<typeof DeckSchema>;
export type DeckMeta = z.infer<typeof DeckMetaSchema>;
export type KpiCard = z.infer<typeof KpiCardSchema>;
export type ChartBlock = z.infer<typeof ChartBlockSchema>;
export type ContentBlock = z.infer<typeof BlockSchema>;
export type ChartType = z.infer<typeof ChartTypeSchema>;
export type ChartDataPoint = z.infer<typeof ChartDataPointSchema>;
export type OutputFormat = z.infer<typeof OutputFormatSchema>;

/**
 * Flat Gemini-compatible extraction block schema.
 * Avoids z.discriminatedUnion() and z.tuple() which break Gemini API's OpenAPI/Protobuf response_schema compiler
 * ("Proto field is not repeating, cannot start list").
 */
export const ExtractionBlockSchema = z.object({
  id: z.string().optional(),
  type: z.enum([
    "numbered_steps",
    "comparison_table",
    "pros_cons",
    "callout_quote",
    "key_takeaways",
  ]),
  title: z.string().optional(),
  steps: z
    .array(
      z.object({
        step: z.number().int().optional(),
        title: z.string(),
        description: z.string(),
      })
    )
    .optional(),
  headers: z.array(z.string()).optional(),
  rows: z
    .array(
      z.object({
        feature: z.string(),
        colA: z.string(),
        colB: z.string().optional(),
        values: z.array(z.string()).optional(),
      })
    )
    .optional(),
  pros: z.array(z.string()).optional(),
  cons: z.array(z.string()).optional(),
  quote: z.string().optional(),
  author: z.string().optional(),
  role: z.string().optional(),
  bullets: z
    .array(
      z.object({
        headline: z.string(),
        detail: z.string(),
      })
    )
    .optional(),
});

export const ExtractionDeckSchema = z.object({
  id: z.string().optional(),
  meta: DeckMetaSchema,
  kpis: z.array(KpiCardSchema).min(1).max(4).describe("1 to 4 core high-impact metrics"),
  charts: z.array(ChartBlockSchema).max(6).describe("0 to 6 primary data charts"),
  blocks: z.array(ExtractionBlockSchema).max(10).describe("Structured process, comparison, or takeaway blocks"),
  templateId: z.string().default("clean-bento"),
  format: OutputFormatSchema.default("carousel"),
  brandKitId: z.string().optional(),
  watermark: z.boolean().default(true),
});

export type ExtractionDeck = z.infer<typeof ExtractionDeckSchema>;

export function normalizeExtractionDeck(
  raw: ExtractionDeck,
  format?: OutputFormat,
  templateId?: string
): DeckAST {
  const normalizedBlocks: ContentBlock[] = [];

  for (let i = 0; i < (raw.blocks || []).length; i++) {
    const b = raw.blocks[i];
    const blockId = b.id || `block-${i + 1}`;

    if (b.type === "numbered_steps") {
      const validSteps = (b.steps || [])
        .filter((s) => s && (s.title?.trim() || s.description?.trim()))
        .map((s, idx) => ({
          step: s.step || idx + 1,
          title: s.title?.trim() || `Step ${idx + 1}`,
          description: s.description?.trim() || "",
        }));
      if (validSteps.length > 0) {
        normalizedBlocks.push({
          id: blockId,
          type: "numbered_steps",
          title: b.title?.trim() || undefined,
          steps: validSteps,
        });
      }
    } else if (b.type === "comparison_table") {
      const headers = (b.headers || []).map((h) => h?.trim()).filter(Boolean);
      const validRows = (b.rows || [])
        .filter((r) => r && (r.feature?.trim() || r.colA?.trim() || (r.values && r.values.length > 0)))
        .map((r) => ({
          feature: r.feature?.trim() || "Item",
          colA: r.colA?.trim() || "",
          colB: r.colB?.trim() || undefined,
          values: r.values?.map((v) => v?.trim() || "") || undefined,
        }));
      if (validRows.length > 0) {
        normalizedBlocks.push({
          id: blockId,
          type: "comparison_table",
          title: b.title?.trim() || undefined,
          headers: headers.length >= 2 ? headers : ["Dimension", "Value"],
          rows: validRows,
        });
      }
    } else if (b.type === "pros_cons") {
      const validPros = (b.pros || []).map((p) => p?.trim()).filter(Boolean);
      const validCons = (b.cons || []).map((c) => c?.trim()).filter(Boolean);
      if (validPros.length > 0 || validCons.length > 0) {
        normalizedBlocks.push({
          id: blockId,
          type: "pros_cons",
          title: b.title?.trim() || undefined,
          pros: validPros,
          cons: validCons,
        });
      }
    } else if (b.type === "callout_quote") {
      if (b.quote && b.quote.trim().length > 0) {
        normalizedBlocks.push({
          id: blockId,
          type: "callout_quote",
          quote: b.quote.trim(),
          author: b.author?.trim() || "Key Insight",
          role: b.role?.trim() || undefined,
        });
      }
    } else if (b.type === "key_takeaways") {
      const validBullets = (b.bullets || [])
        .filter((bullet) => bullet && (bullet.headline?.trim() || bullet.detail?.trim()))
        .map((bullet) => ({
          headline: bullet.headline?.trim() || "",
          detail: bullet.detail?.trim() || "",
        }));
      if (validBullets.length > 0) {
        normalizedBlocks.push({
          id: blockId,
          type: "key_takeaways",
          title: b.title?.trim() || undefined,
          bullets: validBullets,
        });
      }
    }
  }

  const normalizedKpis: KpiCard[] = (raw.kpis || []).map((kpi, idx) => ({
    id: kpi.id || `kpi-${idx + 1}`,
    value: kpi.value,
    label: kpi.label,
    delta: kpi.delta,
    deltaType: kpi.deltaType || "neutral",
    description: kpi.description,
  }));

  const normalizedCharts: ChartBlock[] = (raw.charts || []).map((chart, idx) => ({
    id: chart.id || `chart-${idx + 1}`,
    type: chart.type,
    title: chart.title,
    unit: chart.unit || "",
    xAxisLabel: chart.xAxisLabel,
    yAxisLabel: chart.yAxisLabel,
    data: chart.data,
  }));

  const rawDate = raw.meta?.date?.trim();
  const cleanDate =
    rawDate &&
    !/^(2023-q3|placeholder|n\/?a|unknown|none|null|undefined)$/i.test(rawDate)
      ? rawDate
      : undefined;

  const normalizedMeta = {
    ...raw.meta,
    date: cleanDate,
  };

  return {
    id: raw.id,
    meta: normalizedMeta,
    kpis: normalizedKpis,
    charts: normalizedCharts,
    blocks: normalizedBlocks,
    templateId: templateId || raw.templateId || "clean-bento",
    format: format || raw.format || "carousel",
    brandKitId: raw.brandKitId,
    watermark: raw.watermark ?? true,
  };
}
