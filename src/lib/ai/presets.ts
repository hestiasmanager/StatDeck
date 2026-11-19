import type { DeckAST } from "@/lib/schemas/deck-schema";

export const SAMPLE_PRESETS: Record<string, DeckAST> = {
  "saas-churn-metrics": {
    meta: {
      title: "SaaS Retention & Churn Benchmark",
      subtitle: "Why top-quartile B2B software companies expand NDR to 124% while reducing churn below 0.6% monthly.",
      category: "SaaS Economics",
      sourceCitations: ["OpenView SaaS Benchmarks", "ChartMogul 2024 Report"],
      readTime: "2 min read",
      date: "Nov 2024",
    },
    executiveSummary:
      "Top-performing B2B software vendors have shifted from aggressive new-logo acquisition to compounding expansion loops, driving median Net Dollar Retention above 124% while compressing logo churn to historic lows.",
    coverHighlights: [
      "NDR expansion of 124% offsets enterprise contraction",
      "Monthly logo churn controlled below 0.60%",
      "Enterprise ACVs expanded 34% via consumption tiers",
    ],
    kpiNarrative:
      "Strongest growth cohorts demonstrate that multi-product adoption and automated usage gates generate 3.2x higher customer lifetime value than traditional seat-based licenses.",
    chartInsight:
      "Enterprise contracts over $100K ARR demonstrate 142% net expansion, outperforming SMB tiers (<$5K ARR at 96%) by 46 percentage points.",
    kpis: [
      {
        id: "kpi-1",
        value: "124%",
        label: "Net Dollar Retention",
        delta: "+12% vs Median",
        deltaType: "positive",
        description: "Expansion revenue offsetting downgrades",
      },
      {
        id: "kpi-2",
        value: "0.58%",
        label: "Monthly Logo Churn",
        delta: "-0.24% YoY",
        deltaType: "positive",
        description: "Best-in-class enterprise cohort",
      },
      {
        id: "kpi-3",
        value: "$38.4K",
        label: "Average ACV",
        delta: "+34% YoY",
        deltaType: "positive",
        description: "Upmarket enterprise migration",
      },
      {
        id: "kpi-4",
        value: "4.8x",
        label: "LTV / CAC Ratio",
        delta: "+0.8x YoY",
        deltaType: "positive",
        description: "Capital efficient organic acquisition",
      },
    ],
    charts: [
      {
        id: "chart-1",
        type: "bar",
        title: "Net Expansion Rate by ACV Tier ($K ARR)",
        unit: "%",
        xAxisLabel: "Contract Size",
        yAxisLabel: "Net Dollar Retention",
        chartInsight:
          "Enterprise contracts over $100K ARR demonstrate 142% net expansion, outperforming SMB tiers (<$5K ARR at 96%) by 46 percentage points.",
        data: [
          { label: "< $5K", value: 96 },
          { label: "$5K-$20K", value: 108 },
          { label: "$20K-$50K", value: 119 },
          { label: "$50K-$100K", value: 128 },
          { label: "$100K+", value: 142 },
        ],
      },
    ],
    blocks: [
      {
        id: "block-1",
        type: "numbered_steps",
        title: "3 Levers to Drive 120%+ Net Retention",
        steps: [
          {
            step: 1,
            title: "Usage-Based Feature Gates",
            description: "Align pricing with direct business value rather than seat-count penalization.",
          },
          {
            step: 2,
            title: "Proactive QBR Health Scoring",
            description: "Flag telemetry drops 60 days before contract renewal.",
          },
          {
            step: 3,
            title: "Multi-Team Land & Expand",
            description: "Enable viral departmental invites to foster cross-team stickiness.",
          },
        ],
      },
      {
        id: "block-2",
        type: "comparison_table",
        title: "Standard SaaS vs Best-in-Class NDR",
        headers: ["Standard SaaS", "Top-Decile Performer"],
        rows: [
          { feature: "Gross Revenue Churn", colA: "12 - 15% / yr", colB: "< 4% / yr" },
          { feature: "Expansion Strategy", colA: "Manual upsell reps", colB: "Automated consumption tiers" },
          { feature: "Payback Period", colA: "18 - 24 months", colB: "8 - 12 months" },
        ],
      },
    ],
    templateId: "clean-bento",
    format: "carousel",
    watermark: true,
  },

  "ai-infrastructure-costs": {
    meta: {
      title: "The Shift in LLM Inference Economics",
      subtitle: "How token compression, client-side execution, and specialized small models reduced production unit cost by 88%.",
      category: "AI Architecture",
      sourceCitations: ["SemiAnalysis AI Inference Index", "Stanford HAI 2024"],
      readTime: "3 min read",
      date: "Nov 2024",
    },
    executiveSummary:
      "A structural transition toward small specialized inference models, prompt compilation, and aggressive client-side caching has compressed enterprise AI serving costs by 88% year-over-year.",
    coverHighlights: [
      "Inference unit costs dropped 88% down to $0.075 / 1M tokens",
      "Time-to-first-token decreased 65% to 42ms via speculative decoding",
      "Zero-cost caching achieved 100% savings on repeat queries",
    ],
    kpiNarrative:
      "Shifting routine extraction and parsing workloads to lightweight flash models eliminates GPU cluster bloat while maintaining 99.4% structured schema compliance.",
    chartInsight:
      "Vector search, persistent memory, and fine-tuning consume 56% of total operational AI budgets, while raw token generation represents under 18%.",
    kpis: [
      {
        id: "kpi-ai-1",
        value: "$0.075",
        label: "Cost Per 1M Tokens",
        delta: "-88% YoY",
        deltaType: "positive",
        description: "Small specialized flash models",
      },
      {
        id: "kpi-ai-2",
        value: "42ms",
        label: "Time to First Token",
        delta: "-65% Latency",
        deltaType: "positive",
        description: "Speculative decoding speedup",
      },
      {
        id: "kpi-ai-3",
        value: "99.4%",
        label: "Deterministic JSON Schema",
        delta: "+14.2% Acc",
        deltaType: "positive",
        description: "Constrained CFG grammar decoding",
      },
      {
        id: "kpi-ai-4",
        value: "$0.00",
        label: "Cached Hit Cost",
        delta: "100% Free",
        deltaType: "neutral",
        description: "SHA-256 Redis hash caching",
      },
    ],
    charts: [
      {
        id: "chart-ai-1",
        type: "donut",
        title: "Breakdown of Enterprise AI Operational Spend",
        unit: "%",
        chartInsight:
          "Vector search, persistent memory, and fine-tuning consume 56% of total operational AI budgets, while raw token generation represents under 18%.",
        data: [
          { label: "Vector Search & DB", value: 32 },
          { label: "Model Fine-tuning", value: 24 },
          { label: "Prompt Ingestion & LLM", value: 18 },
          { label: "Evaluation & Guardrails", value: 16 },
          { label: "Cache & Networking", value: 10 },
        ],
      },
    ],
    blocks: [
      {
        id: "block-ai-1",
        type: "key_takeaways",
        title: "Engineering Insights for Production Systems",
        bullets: [
          {
            headline: "Never run headless browsers in API workers",
            detail: "Offload PDF and Canvas serialization 100% to client browser threads.",
          },
          {
            headline: "Normalize input schemas before hashing",
            detail: "Lowercasing and whitespace collapsing lifts cache hit rates by 38%.",
          },
          {
            headline: "Enforce strict Zod AST boundaries",
            detail: "Eliminates hallucinated layout attributes and malformed nested keys.",
          },
        ],
      },
    ],
    templateId: "minimalist-tech",
    format: "infographic",
    watermark: true,
  },
};
