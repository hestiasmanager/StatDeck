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
        headers: ["Metric", "Standard SaaS", "Top-Decile Performer"],
        rows: [
          {
            cells: ["Gross Revenue Churn", "12 - 15% / yr", "< 4% / yr"],
            feature: "Gross Revenue Churn",
            colA: "12 - 15% / yr",
            colB: "< 4% / yr",
          },
          {
            cells: ["Expansion Strategy", "Manual upsell reps", "Automated consumption tiers"],
            feature: "Expansion Strategy",
            colA: "Manual upsell reps",
            colB: "Automated consumption tiers",
          },
          {
            cells: ["Payback Period", "18 - 24 months", "8 - 12 months"],
            feature: "Payback Period",
            colA: "18 - 24 months",
            colB: "8 - 12 months",
          },
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

  "agency-client-report": {
    meta: {
      title: "Q3 Multi-Channel Growth & ROAS Performance",
      subtitle: "Meta, Google & TikTok Paid Performance vs $150K Target Budget",
      category: "Paid Acquisition",
      sourceCitations: ["Stripe & TripleWhale Blended Attribution", "Google Ads & Meta Business Manager"],
      readTime: "2 min read",
      date: "Q3 2026",
    },
    executiveSummary:
      "Paid acquisition scaled efficiently in Q3, delivering a 3.82x blended ROAS against the 3.20x target while driving customer acquisition costs down 14% year-over-year through creative testing.",
    coverHighlights: [
      "Blended ROAS expanded 18% QoQ to 3.8x",
      "Total ad spend managed at $142.5K (-5% vs Budget)",
      "Customer Acquisition Cost compressed to $42.10",
    ],
    kpiNarrative:
      "Google Search brand defense and high-intent commercial terms generated peak efficiency, while Meta dynamic creative testing unlocked scalable mid-funnel volume.",
    chartInsight:
      "Google Search delivered 4.6x ROAS on $48K spend, while Meta Prospecting drove the largest absolute volume of new paying accounts at 3.9x.",
    kpis: [
      {
        id: "agency-kpi-1",
        value: "3.8x",
        label: "Blended ROAS",
        delta: "+18% QoQ",
        deltaType: "positive",
        description: "Exceeded 3.2x client target",
        sourceQuote: "Blended ROAS reached 3.82x across Google, Meta, and TikTok, outperforming the 3.2x client target.",
        sourceRow: "Attribution Sheet Row 14",
        sourcePage: "Slide 2",
      },
      {
        id: "agency-kpi-2",
        value: "$142.5K",
        label: "Total Ad Spend",
        delta: "-5% vs Budget",
        deltaType: "positive",
        description: "Disciplined budget pacing",
        sourceQuote: "Total paid media expenditure was $142,480 against an authorized $150,000 envelope.",
        sourceRow: "Spend Ledger Row 3",
      },
      {
        id: "agency-kpi-3",
        value: "$42.10",
        label: "Blended CPA",
        delta: "-14% YoY",
        deltaType: "positive",
        description: "Post-click conversion lift",
        sourceQuote: "Average customer acquisition cost declined to $42.10 from $48.95 in Q2.",
        sourceRow: "CPA Analysis Row 19",
      },
      {
        id: "agency-kpi-4",
        value: "+24.2%",
        label: "Conversion Lift",
        delta: "+3.4% CVR",
        deltaType: "positive",
        description: "Landing page experiment lift",
        sourceQuote: "Post-click landing page experiments drove a +24.2% lift in net checkout completion.",
        sourcePage: "Experiment Report P. 4",
      },
    ],
    charts: [
      {
        id: "agency-chart-1",
        type: "bar",
        title: "Channel ROAS vs 3.2x Target",
        unit: "x",
        xAxisLabel: "Paid Channel",
        yAxisLabel: "Return on Ad Spend",
        chartInsight:
          "Google Search delivered 4.6x ROAS on $48K spend, while Meta Prospecting drove the largest absolute volume of new paying accounts at 3.9x.",
        data: [
          { label: "Google Search", value: 4.6, sourceQuote: "Google Search Brand & Non-Brand yielded 4.64x return on $48K spend." },
          { label: "Meta Ads", value: 3.9, sourceQuote: "Meta Prospecting & Retargeting blended at 3.91x." },
          { label: "YouTube Shorts", value: 3.1, sourceQuote: "YouTube direct-response testing reached 3.12x." },
          { label: "TikTok Paid", value: 2.4, sourceQuote: "TikTok top-of-funnel discovery campaign yielded 2.41x ROAS." },
        ],
      },
    ],
    blocks: [
      {
        id: "agency-block-1",
        type: "numbered_steps",
        title: "Q4 Budget Scaling Protocol",
        steps: [
          {
            step: 1,
            title: "Reallocate TikTok Budget",
            description: "Shift 20% of underperforming discovery spend to high-intent Google Search non-brand terms.",
          },
          {
            step: 2,
            title: "Meta Iteration Engine",
            description: "Deploy 8 new UGC hook variations weekly for top 2 hero conversion angles.",
          },
          {
            step: 3,
            title: "Automated ROAS Scaling",
            description: "Increase daily budgets by 15% weekly whenever 7-day rolling ROAS holds above 3.5x.",
          },
        ],
      },
    ],
    templateId: "clean-bento",
    format: "carousel",
    watermark: true,
  },

  "ecommerce-d2c-performance": {
    meta: {
      title: "D2C Brand Performance: Unit Economics & Retention",
      subtitle: "Analysis of 42,000 Orders Across Skincare & Wellness Collections",
      category: "E-Commerce",
      sourceCitations: ["Shopify Plus Analytics", "Klaviyo Cohort Report"],
      readTime: "2 min read",
      date: "Q3 2026",
    },
    executiveSummary:
      "Strong product bundling incentives expanded Average Order Value by 12% to $86.50, while 60-day repeat purchase velocity climbed to 38.4%, lifting contribution margin to $28.40 per order.",
    coverHighlights: [
      "AOV reached $86.50 (+12% YoY)",
      "Repeat purchase rate climbed to 38.4%",
      "Gross margin expanded 340 bps to 71.2%",
    ],
    kpiNarrative:
      "Replenishment subscription funnels and post-purchase bundle prompts generated 48% higher 90-day LTV compared to one-off checkout baskets.",
    chartInsight:
      "Hero Restorative Serum generated 42% of total Q3 gross GMV, serving as the foundational customer acquisition anchor for subsequent SKU cross-sells.",
    kpis: [
      {
        id: "d2c-kpi-1",
        value: "$86.50",
        label: "Average Order Value",
        delta: "+12% YoY",
        deltaType: "positive",
        description: "Bundling incentives lift",
        sourceQuote: "Bundled checkout incentives lifted median cart value from $77.20 to $86.50.",
        sourceRow: "Shopify Sales Summary Row 8",
      },
      {
        id: "d2c-kpi-2",
        value: "38.4%",
        label: "Repeat Purchase Rate",
        delta: "+5.2% QoQ",
        deltaType: "positive",
        description: "60-day repurchase cohort",
        sourceQuote: "60-day repeat customer rate climbed to 38.4% following automated replenishment flows.",
        sourcePage: "Klaviyo Cohort Report P. 3",
      },
      {
        id: "d2c-kpi-3",
        value: "71.2%",
        label: "Gross Margin",
        delta: "+340 bps",
        deltaType: "positive",
        description: "Manufacturing volume savings",
        sourceQuote: "Consolidated product gross margin expanded to 71.2% via volume manufacturing discounts.",
        sourceRow: "COGS Analysis Line 12",
      },
      {
        id: "d2c-kpi-4",
        value: "$28.40",
        label: "Net Contribution",
        delta: "+22% YoY",
        deltaType: "positive",
        description: "Margin per order after ad spend",
        sourceQuote: "Contribution Margin after ad spend and 3PL fulfillment averaged $28.40 per order.",
        sourceRow: "P&L Line 22",
      },
    ],
    charts: [
      {
        id: "d2c-chart-1",
        type: "donut",
        title: "Q3 GMV Share by Product Collection",
        unit: "%",
        chartInsight:
          "Hero Restorative Serum generated 42% of total Q3 gross GMV, serving as the foundational customer acquisition anchor for subsequent SKU cross-sells.",
        data: [
          { label: "Restorative Serum", value: 42, sourceQuote: "Serum SKU represented $1.2M of $2.85M quarterly GMV." },
          { label: "Daily Moisturizer", value: 28, sourceQuote: "Moisturizer cross-sell attached to 34% of first orders." },
          { label: "Gentle Cleanser", value: 18, sourceQuote: "Cleanser bundle retention exceeded 44% at 90 days." },
          { label: "Mineral SPF 50", value: 12, sourceQuote: "New SPF release contributed $340K in initial seasonal launch." },
        ],
      },
    ],
    blocks: [
      {
        id: "d2c-block-1",
        type: "comparison_table",
        title: "First-Time vs Returning VIP Unit Economics",
        headers: ["Metric", "First-Time Buyer", "Returning VIP (2+ Orders)"],
        rows: [
          {
            cells: ["Average Order Value", "$74.20", "$108.40"],
            feature: "Average Order Value",
            colA: "$74.20",
            colB: "$108.40",
          },
          {
            cells: ["Marketing Acquisition Cost", "$38.50 (Paid Meta/Google)", "$4.20 (Klaviyo SMS/Email)"],
            feature: "Marketing Acquisition Cost",
            colA: "$38.50 (Paid Meta/Google)",
            colB: "$4.20 (Klaviyo SMS/Email)",
          },
          {
            cells: ["Blended Return on Ad Spend", "1.92x", "8.65x"],
            feature: "Blended Return on Ad Spend",
            colA: "1.92x",
            colB: "8.65x",
          },
        ],
      },
    ],
    templateId: "editorial-serif",
    format: "carousel",
    watermark: true,
  },

  "creator-newsletter-growth": {
    meta: {
      title: "The Media Engine: 12-Month Audience & Revenue Breakdown",
      subtitle: "Scaling from 10K to 85K Subscribers with $285K Annualized Run Rate",
      category: "Creator Economy",
      sourceCitations: ["Beehiiv Publication Analytics", "Stripe Financial Reports"],
      readTime: "3 min read",
      date: "Q3 2026",
    },
    executiveSummary:
      "The publication expanded from 10,000 to 84,200 active readers while maintaining a 48.6% open rate, driving forward advertising bookings to an annualized run rate of $285,000.",
    coverHighlights: [
      "Subscriber base expanded 340% to 84.2K",
      "30-day open rate maintained at 48.6%",
      "Sponsorship inventory locked at $285K ARR",
    ],
    kpiNarrative:
      "Proprietary visual data graphics account for 68% of organic LinkedIn and X referral inbound subscribers, generating zero-CAC compounding growth.",
    chartInsight:
      "Newsletter primary header sponsorships represent 56% of total revenue ($160K), complemented by high-margin bespoke cohort playbooks ($35K).",
    kpis: [
      {
        id: "creator-kpi-1",
        value: "84.2K",
        label: "Active Readers",
        delta: "+340% YoY",
        deltaType: "positive",
        description: "Verified clean subscribers",
        sourceQuote: "Active verified subscriber count reached 84,219 across weekly editions.",
        sourceRow: "Audience Overview Row 5",
      },
      {
        id: "creator-kpi-2",
        value: "48.6%",
        label: "30-Day Open Rate",
        delta: "2.2x Benchmark",
        deltaType: "positive",
        description: "Exceptional sender trust",
        sourceQuote: "Unique 30-day open rate maintained at 48.6% with 8.4% average click-through rate.",
        sourcePage: "Delivery Metrics P. 1",
      },
      {
        id: "creator-kpi-3",
        value: "$285K",
        label: "Sponsor Run Rate",
        delta: "+190% YoY",
        deltaType: "positive",
        description: "Forward locked ad bookings",
        sourceQuote: "Forward bookings locked in $285,000 in annualized sponsorship inventory.",
        sourceRow: "Ledger Row 41",
      },
      {
        id: "creator-kpi-4",
        value: "$55.00",
        label: "Primary Slot CPM",
        delta: "+$15 vs Q1",
        deltaType: "positive",
        description: "Premium executive readership",
        sourceQuote: "Primary header placement booked out at $55.00 CPM through Q1 2027.",
        sourceRow: "Media Kit Pricing Table",
      },
    ],
    charts: [
      {
        id: "creator-chart-1",
        type: "horizontal_bar",
        title: "Annualized Revenue by Monetization Stream ($K)",
        unit: "$K",
        xAxisLabel: "Revenue in Thousands ($K)",
        yAxisLabel: "Stream",
        chartInsight:
          "Newsletter primary header sponsorships represent 56% of total revenue ($160K), complemented by high-margin bespoke cohort playbooks ($35K).",
        data: [
          { label: "Primary Header Ads", value: 160, sourceQuote: "Primary ad slot generated $160K across 48 weekly dispatches." },
          { label: "Brand Partnerships", value: 75, sourceQuote: "Multi-week partner campaigns booked $75K." },
          { label: "Digital Playbooks", value: 35, sourceQuote: "Quarterly research playbooks delivered $35K at 96% margin." },
          { label: "Curated Affiliate", value: 15, sourceQuote: "B2B SaaS tool recommendations yielded $15K passive ARR." },
        ],
      },
    ],
    blocks: [
      {
        id: "creator-block-1",
        type: "key_takeaways",
        title: "3 Rules for Newsletter Compounding",
        bullets: [
          {
            headline: "Aggressive list pruning drives inbox deliverability",
            detail: "Automatically purge non-openers every 60 days to keep Google Postmaster reputation at 99.8%.",
          },
          {
            headline: "Sell 6-month partner packages, not single drops",
            detail: "Multi-issue commitments stabilize quarterly cash flow and eliminate weekly outbound sales stress.",
          },
          {
            headline: "Publish 1 benchmark visual report per quarter",
            detail: "Data-dense infographic carousels generate 68% of all external LinkedIn and X referral discovery.",
          },
        ],
      },
    ],
    templateId: "swiss-grid",
    format: "carousel",
    watermark: true,
  },
};
