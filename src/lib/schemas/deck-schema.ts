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
  sourceQuote: z.string().optional().describe("Verbatim excerpt or audit quote for this data point"),
  sourcePage: z.union([z.string(), z.number()]).optional().describe("Page number or document section reference"),
  sourceRow: z.union([z.string(), z.number()]).optional().describe("CSV or spreadsheet row number reference"),
});

export const ChartBlockSchema = z.object({
  id: z.string(),
  type: ChartTypeSchema,
  title: z.string().max(80).describe("Chart headline or takeaway"),
  unit: z.string().default("").describe("Unit label, e.g. '$M', '%', 'users'"),
  xAxisLabel: z.string().optional(),
  yAxisLabel: z.string().optional(),
  data: z.array(ChartDataPointSchema).min(2).max(12),
  chartInsight: z.string().optional().describe("1-2 sentence 'What This Shows' analytical insight"),
});

export const KpiCardSchema = z.object({
  id: z.string(),
  value: z.string().max(20).describe("Bold formatted figure, e.g. '$42.8M', '+184%'"),
  label: z.string().max(40).describe("Descriptive metric name"),
  delta: z.string().max(25).optional().describe("e.g. '+38% YoY', '-4.2% MoM'"),
  deltaType: z.enum(["positive", "negative", "neutral"]).default("neutral"),
  description: z.string().max(100).optional().describe("One sentence micro-context"),
  sourceQuote: z.string().optional().describe("Verbatim excerpt or audit quote for this metric"),
  sourcePage: z.union([z.string(), z.number()]).optional().describe("Page number or document section reference"),
  sourceRow: z.union([z.string(), z.number()]).optional().describe("CSV or spreadsheet row number reference"),
});

export const ProcessStepSchema = z.object({
  step: z.number().int().min(1),
  title: z.string().max(60),
  description: z.string().max(160),
});

export const ComparisonRowSchema = z.object({
  cells: z.array(z.string().max(120)).describe("Flat 1-to-1 array of cell values matching headers"),
  feature: z.string().max(80).optional(),
  colA: z.string().max(120).optional(),
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
  executiveSummary: z.string().optional(),
  coverHighlights: z.array(z.string()).max(3).optional(),
  kpiNarrative: z.string().optional(),
  chartInsight: z.string().optional(),
});

export const OutputFormatSchema = z.enum(["infographic", "carousel", "presentation"]);

export const DeckSchema = z.object({
  id: z.string().uuid().optional(),
  meta: DeckMetaSchema,
  executiveSummary: z
    .string()
    .default("")
    .describe("1-2 sentence executive briefing or narrative overview of the deck rendered on Slide 1"),
  coverHighlights: z
    .array(z.string().max(100))
    .max(3)
    .default([])
    .describe("Up to 3 high-impact takeaway bullet points for Slide 1 (Cover)"),
  kpis: z.array(KpiCardSchema).min(0).max(4).default([]).describe("0 to 4 core high-impact metrics"),
  kpiNarrative: z
    .string()
    .default("")
    .describe("1-2 sentence analytical narrative explaining the KPI performance directly below the cards on Slide 2"),
  charts: z.array(ChartBlockSchema).max(6).describe("0 to 6 primary data charts"),
  chartInsight: z
    .string()
    .default("")
    .describe("1-2 sentence 'What This Shows' callout strip directly below the chart on Slide 3"),
  blocks: z.array(BlockSchema).max(10).describe("Structured process, comparison, or takeaway blocks"),
  templateId: z.string().default("clean-bento"),
  format: OutputFormatSchema.default("carousel"),
  brandKitId: z.string().optional(),
  watermark: z.boolean().default(true),
  slideOrder: z.array(z.string()).optional(),
});

export type DeckAST = z.infer<typeof DeckSchema>;
export type DeckMeta = z.infer<typeof DeckMetaSchema>;
export type KpiCard = z.infer<typeof KpiCardSchema>;
export type ChartBlock = z.infer<typeof ChartBlockSchema>;
export type ContentBlock = z.infer<typeof BlockSchema>;
export type BlockType = ContentBlock["type"];
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
        cells: z.array(z.string()).optional(),
        feature: z.string().optional(),
        colA: z.string().optional(),
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
  kpis: z.array(KpiCardSchema).min(0).max(4).default([]).describe("0 to 4 core high-impact metrics"),
  charts: z.array(ChartBlockSchema).max(6).describe("0 to 6 primary data charts"),
  blocks: z.array(ExtractionBlockSchema).max(10).describe("Structured process, comparison, or takeaway blocks"),
  templateId: z.string().default("clean-bento"),
  format: OutputFormatSchema.default("carousel"),
  brandKitId: z.string().optional(),
  watermark: z.boolean().default(true),
  slideOrder: z.array(z.string()).optional(),
});

export type ExtractionDeck = z.infer<typeof ExtractionDeckSchema>;

/**
 * Recursively strips null and undefined values from objects and arrays
 * so that optional fields in Zod schemas do not fail when receiving null.
 */
function stripNulls<T>(value: T): T {
  if (value === null || value === undefined) return undefined as unknown as T;
  if (Array.isArray(value)) {
    return value.map(stripNulls).filter((v) => v !== undefined) as unknown as T;
  }
  if (typeof value === "object") {
    const res: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== null && v !== undefined) {
        res[k] = stripNulls(v);
      }
    }
    return res as unknown as T;
  }
  return value;
}

export function normalizeExtractionDeck(
  rawInput: unknown,
  format?: OutputFormat,
  templateId?: string
): DeckAST {
  // Strip nulls recursively
  const cleaned = (stripNulls(rawInput) as Record<string, any>) || {};

  // Unwrap if nested under { deck: ... } or { data: ... } or { ast: ... }
  const raw: Record<string, any> =
    cleaned.deck || cleaned.data || cleaned.ast || cleaned;

  const rawAny = raw as Record<string, unknown>;
  const rawMetaAny = (raw.meta || {}) as Record<string, unknown>;

  // 1. Meta Normalization
  const rawTitle =
    (typeof rawMetaAny.title === "string" && rawMetaAny.title.trim()) ||
    (typeof rawAny.title === "string" && rawAny.title.trim()) ||
    "Executive Visual Summary";
  const title = (rawTitle.length >= 3 ? rawTitle : `${rawTitle} Deck`).slice(0, 120);

  const subtitle = (
    (typeof rawMetaAny.subtitle === "string" && rawMetaAny.subtitle.trim()) ||
    (typeof rawAny.subtitle === "string" && rawAny.subtitle.trim()) ||
    "Key strategic takeaways, quantitative benchmarks, and narrative overview."
  ).slice(0, 200);

  const category =
    typeof rawMetaAny.category === "string" && rawMetaAny.category.trim()
      ? rawMetaAny.category.trim().slice(0, 35)
      : undefined;

  const readTime =
    typeof rawMetaAny.readTime === "string" && rawMetaAny.readTime.trim()
      ? rawMetaAny.readTime.trim().slice(0, 35)
      : undefined;

  const rawDate =
    typeof rawMetaAny.date === "string" ? rawMetaAny.date.trim() : undefined;
  const cleanDate =
    rawDate &&
    !/^(2023-q3|placeholder|n\/?a|unknown|none|null|undefined)$/i.test(rawDate)
      ? rawDate.slice(0, 50)
      : undefined;

  const rawCitations = Array.isArray(rawMetaAny.sourceCitations)
    ? rawMetaAny.sourceCitations
    : Array.isArray(rawAny.sourceCitations)
    ? rawAny.sourceCitations
    : [];
  const sourceCitations = rawCitations
    .filter((c): c is string => typeof c === "string" && c.trim().length > 0)
    .map((c) => c.trim().slice(0, 100))
    .slice(0, 4);

  // 2. Executive Narratives
  const executiveSummary =
    (typeof rawAny.executiveSummary === "string" && rawAny.executiveSummary.trim()) ||
    (typeof rawMetaAny.executiveSummary === "string" && rawMetaAny.executiveSummary.trim()) ||
    "";

  const rawHighlights = Array.isArray(rawAny.coverHighlights)
    ? rawAny.coverHighlights
    : Array.isArray(rawMetaAny.coverHighlights)
    ? rawMetaAny.coverHighlights
    : [];
  const coverHighlights = rawHighlights
    .filter((h): h is string => typeof h === "string" && h.trim().length > 0)
    .map((h) => h.trim().slice(0, 100))
    .slice(0, 3);

  const kpiNarrative =
    (typeof rawAny.kpiNarrative === "string" && rawAny.kpiNarrative.trim()) ||
    (typeof rawMetaAny.kpiNarrative === "string" && rawMetaAny.kpiNarrative.trim()) ||
    "";

  const rawTopChartInsight =
    (typeof rawAny.chartInsight === "string" && rawAny.chartInsight.trim()) ||
    (typeof rawMetaAny.chartInsight === "string" && rawMetaAny.chartInsight.trim()) ||
    (Array.isArray(raw.charts) && typeof raw.charts[0]?.chartInsight === "string" && raw.charts[0].chartInsight.trim()) ||
    "";
  const chartInsight = rawTopChartInsight.slice(0, 500);

  // 3. KPIs Normalization (Clamped 1 to 4)
  const rawKpis: any[] = Array.isArray(raw.kpis) ? raw.kpis : [];
  const normalizedKpis: KpiCard[] = rawKpis
    .filter((k) => k && (k.value !== undefined || k.label !== undefined))
    .map((kpi, idx) => {
      const valStr =
        typeof kpi.value === "string"
          ? kpi.value.trim()
          : typeof kpi.value === "number"
          ? String(kpi.value)
          : "—";
      const lblStr =
        typeof kpi.label === "string" && kpi.label.trim()
          ? kpi.label.trim()
          : `Metric ${idx + 1}`;
      const deltaStr =
        typeof kpi.delta === "string" && kpi.delta.trim() && !/^(null|undefined|none|n\/?a)$/i.test(kpi.delta.trim())
          ? kpi.delta.trim().slice(0, 25)
          : undefined;
      const deltaType =
        kpi.deltaType === "positive" || kpi.deltaType === "negative" || kpi.deltaType === "neutral"
          ? kpi.deltaType
          : "neutral";
      const descStr =
        typeof kpi.description === "string" && kpi.description.trim()
          ? kpi.description.trim().slice(0, 100)
          : undefined;

      return {
        id: kpi.id || `kpi-${idx + 1}`,
        value: valStr.slice(0, 20) || "—",
        label: lblStr.slice(0, 40),
        delta: deltaStr,
        deltaType,
        description: descStr,
      };
    })
    .slice(0, 4);


  // 4. Charts Normalization (Clamped 0 to 6, data clamped 2 to 12)
  const rawCharts: any[] = Array.isArray(raw.charts) ? raw.charts : [];
  const normalizedCharts: ChartBlock[] = [];

  for (let idx = 0; idx < rawCharts.length; idx++) {
    const chart = rawCharts[idx];
    if (!chart || typeof chart !== "object") continue;

    // Normalize chart type enum
    const rawType = String(chart.type || "").toLowerCase().trim();
    let type: ChartType = "bar";
    if (rawType === "horizontal_bar") type = "horizontal_bar";
    else if (rawType === "donut" || rawType === "pie") type = "donut";
    else if (rawType === "line" || rawType === "spline" || rawType === "trend") type = "line";
    else if (rawType === "area") type = "area";
    else type = "bar";

    const chartTitle = (
      typeof chart.title === "string" && chart.title.trim()
        ? chart.title.trim()
        : `Chart ${idx + 1}`
    ).slice(0, 80);

    const unit = typeof chart.unit === "string" ? chart.unit.trim().slice(0, 20) : "";
    const xAxisLabel =
      typeof chart.xAxisLabel === "string" && chart.xAxisLabel.trim()
        ? chart.xAxisLabel.trim().slice(0, 40)
        : undefined;
    const yAxisLabel =
      typeof chart.yAxisLabel === "string" && chart.yAxisLabel.trim()
        ? chart.yAxisLabel.trim().slice(0, 40)
        : undefined;

    // Filter and normalize data points (numbers required, clamped 2 to 12)
    const rawData: any[] = Array.isArray(chart.data) ? chart.data : [];
    const validData: ChartDataPoint[] = [];

    for (let pIdx = 0; pIdx < rawData.length; pIdx++) {
      const p = rawData[pIdx];
      if (!p || typeof p !== "object") continue;
      const lbl = (typeof p.label === "string" ? p.label.trim() : `Point ${pIdx + 1}`).slice(0, 50);
      const rawVal = p.value;
      const numVal =
        typeof rawVal === "number" && !isNaN(rawVal)
          ? rawVal
          : parseFloat(String(rawVal).replace(/[^0-9.-]/g, "")) || 0;

      const secVal =
        typeof p.secondaryValue === "number" && !isNaN(p.secondaryValue)
          ? p.secondaryValue
          : undefined;

      validData.push({
        label: lbl || `Point ${pIdx + 1}`,
        value: numVal,
        secondaryValue: secVal,
        color: typeof p.color === "string" && p.color.startsWith("#") ? p.color : undefined,
      });
    }

    // Clamp points to 12 max
    const clampedData = validData.slice(0, 12);

    // If only 1 data point, add a baseline comparison to satisfy min(2)
    if (clampedData.length === 1) {
      clampedData.push({ label: "Baseline", value: 0 });
    }

    // Drop chart if fewer than 2 data points
    if (clampedData.length >= 2) {
      const cInsight =
        typeof chart.chartInsight === "string" && chart.chartInsight.trim()
          ? chart.chartInsight.trim().slice(0, 300)
          : idx === 0 && chartInsight
          ? chartInsight
          : undefined;

      normalizedCharts.push({
        id: chart.id || `chart-${idx + 1}`,
        type,
        title: chartTitle,
        unit,
        xAxisLabel,
        yAxisLabel,
        data: clampedData,
        chartInsight: cInsight,
      });
    }

    if (normalizedCharts.length >= 6) break;
  }

  // 5. Blocks Normalization (Clamped 0 to 10)
  const rawBlocks: any[] = Array.isArray(raw.blocks) ? raw.blocks : [];
  const normalizedBlocks: ContentBlock[] = [];

  for (let i = 0; i < rawBlocks.length; i++) {
    const b = rawBlocks[i];
    if (!b || typeof b !== "object") continue;
    const blockId = b.id || `block-${i + 1}`;
    const blockTitle = typeof b.title === "string" && b.title.trim() ? b.title.trim().slice(0, 80) : undefined;

    if (b.type === "numbered_steps") {
      const rawSteps = Array.isArray(b.steps) ? b.steps : [];
      const validSteps = rawSteps
        .filter((s: any) => s && (s.title || s.description))
        .map((s: any, idx: number) => ({
          step: typeof s.step === "number" ? s.step : idx + 1,
          title: (typeof s.title === "string" ? s.title.trim() : `Step ${idx + 1}`).slice(0, 60),
          description: (typeof s.description === "string" ? s.description.trim() : "").slice(0, 160),
        }))
        .slice(0, 5);

      if (validSteps.length >= 2) {
        normalizedBlocks.push({
          id: blockId,
          type: "numbered_steps",
          title: blockTitle,
          steps: validSteps,
        });
      }
    } else if (b.type === "comparison_table") {
      const rawHeaders = Array.isArray(b.headers) ? b.headers : [];
      let headers: string[] = [];
      for (const h of rawHeaders) {
        if (typeof h === "string" && h.includes(" | ")) {
          headers.push(...h.split(" | ").map((s) => s.trim()));
        } else if (typeof h === "string" && h.trim().length > 0) {
          headers.push(h.trim());
        }
      }
      headers = headers.map((h) => h.slice(0, 80));

      const rawRows = Array.isArray(b.rows) ? b.rows : [];
      const validRows = rawRows
        .filter((r: any) => r && (r.cells || r.feature || r.colA || (Array.isArray(r.values) && r.values.length > 0)))
        .map((r: any) => {
          let segments: string[] = [];
          if (Array.isArray(r.cells) && r.cells.length > 0) {
            segments = r.cells.map((v: any) => (typeof v === "string" ? v : String(v || "")));
          } else if (Array.isArray(r.values) && r.values.length > 0) {
            if (r.values.length === headers.length || r.values[0] === r.feature) {
              segments = r.values.map((v: any) => (typeof v === "string" ? v : String(v || "")));
            } else {
              segments = [
                typeof r.feature === "string" ? r.feature : "",
                ...r.values.map((v: any) => (typeof v === "string" ? v : String(v || ""))),
              ];
            }
          } else {
            segments = [
              typeof r.feature === "string" ? r.feature : "Item",
              typeof r.colA === "string" ? r.colA : "",
              ...(typeof r.colB === "string" && r.colB.trim() ? [r.colB] : []),
            ];
          }

          // Expand any segment containing " | "
          const cells: string[] = [];
          for (const s of segments) {
            if (typeof s === "string" && s.includes(" | ")) {
              cells.push(...s.split(" | ").map((part) => part.trim()));
            } else {
              cells.push(typeof s === "string" ? s.trim() : "");
            }
          }

          // Clean cells to max 120 chars each
          const finalCells = cells.map((c) => c.slice(0, 120));

          return {
            cells: finalCells,
            feature: (finalCells[0] || "Item").slice(0, 80),
            colA: (finalCells[1] || "").slice(0, 120),
            colB: finalCells[2] ? finalCells[2].slice(0, 120) : undefined,
            values: finalCells,
          };
        })
        .slice(0, 10);

      // If headers count is less than the columns discovered in rows, expand headers
      const maxRowColumns = validRows.length > 0
        ? Math.max(...validRows.map((r: any) => (r.cells ? r.cells.length : 2)), 2)
        : 2;
      while (headers.length < maxRowColumns) {
        headers.push(`Column ${headers.length + 1}`);
      }

      // Ensure every row's cells array has at least headers.length elements (pad with empty string)
      for (const row of validRows) {
        while (row.cells.length < headers.length) {
          row.cells.push("");
        }
      }

      if (validRows.length >= 2) {
        normalizedBlocks.push({
          id: blockId,
          type: "comparison_table",
          title: blockTitle,
          headers: headers.length >= 2 ? headers : ["Dimension", "Value"],
          rows: validRows,
        });
      }
    } else if (b.type === "pros_cons") {
      const rawPros = Array.isArray(b.pros) ? b.pros : [];
      const rawCons = Array.isArray(b.cons) ? b.cons : [];
      const validPros = rawPros
        .filter((p: any): p is string => typeof p === "string" && p.trim().length > 0)
        .map((p: string) => p.trim().slice(0, 120))
        .slice(0, 5);
      const validCons = rawCons
        .filter((c: any): c is string => typeof c === "string" && c.trim().length > 0)
        .map((c: string) => c.trim().slice(0, 120))
        .slice(0, 5);

      if (validPros.length >= 1 && validCons.length >= 1) {
        normalizedBlocks.push({
          id: blockId,
          type: "pros_cons",
          title: blockTitle,
          pros: validPros,
          cons: validCons,
        });
      }
    } else if (b.type === "callout_quote") {
      const quote = typeof b.quote === "string" ? b.quote.trim().slice(0, 240) : "";
      if (quote.length > 0) {
        normalizedBlocks.push({
          id: blockId,
          type: "callout_quote",
          quote,
          author: (typeof b.author === "string" && b.author.trim() ? b.author.trim() : "Key Insight").slice(0, 60),
          role: typeof b.role === "string" && b.role.trim() ? b.role.trim().slice(0, 80) : undefined,
        });
      }
    } else if (b.type === "key_takeaways") {
      const rawBullets = Array.isArray(b.bullets) ? b.bullets : [];
      const validBullets = rawBullets
        .filter((bullet: any) => bullet && (bullet.headline || bullet.detail))
        .map((bullet: any) => ({
          headline: (typeof bullet.headline === "string" ? bullet.headline.trim() : "Takeaway").slice(0, 50),
          detail: (typeof bullet.detail === "string" ? bullet.detail.trim() : "").slice(0, 140),
        }))
        .slice(0, 5);

      if (validBullets.length >= 2) {
        normalizedBlocks.push({
          id: blockId,
          type: "key_takeaways",
          title: blockTitle,
          bullets: validBullets,
        });
      }
    }

    if (normalizedBlocks.length >= 10) break;
  }

  // 6. Output format and template
  const validFormat: OutputFormat =
    format === "infographic" || format === "presentation" || format === "carousel"
      ? format
      : raw.format === "infographic" || raw.format === "presentation" || raw.format === "carousel"
      ? raw.format
      : "carousel";

  const validTemplate =
    typeof templateId === "string" && templateId.trim()
      ? templateId.trim()
      : typeof raw.templateId === "string" && raw.templateId.trim()
      ? raw.templateId.trim()
      : "clean-bento";

  const normalizedMeta: DeckMeta = {
    title,
    subtitle,
    category,
    sourceCitations,
    readTime,
    date: cleanDate,
    executiveSummary: executiveSummary || undefined,
    coverHighlights: coverHighlights.length > 0 ? coverHighlights : undefined,
    kpiNarrative: kpiNarrative || undefined,
    chartInsight: chartInsight || undefined,
  };

  return {
    id: typeof raw.id === "string" ? raw.id : undefined,
    meta: normalizedMeta,
    executiveSummary,
    coverHighlights,
    kpis: normalizedKpis,
    kpiNarrative,
    charts: normalizedCharts,
    chartInsight,
    blocks: normalizedBlocks,
    templateId: validTemplate,
    format: validFormat,
    brandKitId: typeof raw.brandKitId === "string" ? raw.brandKitId : undefined,
    watermark: raw.watermark ?? true,
  };
}
