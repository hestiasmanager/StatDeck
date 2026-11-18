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
  feature: z.string().max(40),
  colA: z.string().max(80),
  colB: z.string().max(80),
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
    headers: z.tuple([z.string().max(40), z.string().max(40)]),
    rows: z.array(ComparisonRowSchema).min(2).max(6),
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
  date: z.string().optional().describe("Publication or analysis date"),
});

export const OutputFormatSchema = z.enum(["infographic", "carousel", "presentation"]);

export const DeckSchema = z.object({
  id: z.string().uuid().optional(),
  meta: DeckMetaSchema,
  kpis: z.array(KpiCardSchema).min(1).max(4).describe("1 to 4 core high-impact metrics"),
  charts: z.array(ChartBlockSchema).max(2).describe("0 to 2 primary data charts"),
  blocks: z.array(BlockSchema).max(4).describe("Structured process, comparison, or takeaway blocks"),
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
