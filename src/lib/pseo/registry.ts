import type { OutputFormat } from "@/lib/schemas/deck-schema";

export interface PseoConfig {
  slug: string;
  title: string;
  metaDescription: string;
  h1: string;
  subtitle: string;
  targetFormat: OutputFormat;
  defaultTemplateId: string;
  samplePresetKey: "saas-churn-metrics" | "ai-infrastructure-costs";
  features: string[];
}

export const PSEO_WORKFLOWS: Record<string, PseoConfig> = {
  "csv-to-infographic": {
    slug: "csv-to-infographic",
    title: "CSV to Infographic Generator — Turn Spreadsheets into Visual Posters",
    metaDescription: "Convert raw CSV files and spreadsheets into brand-locked vertical infographics with charts and KPI metrics in seconds.",
    h1: "Convert CSV Spreadsheets to High-Impact Infographics",
    subtitle: "Parse numerical columns directly in your browser. Generate clean 800×2000 visual data posters with zero server compute.",
    targetFormat: "infographic",
    defaultTemplateId: "clean-bento",
    samplePresetKey: "saas-churn-metrics",
    features: [
      "100% Client-Side CSV Parsing (zero server storage)",
      "Automatic KPI card & trend detection",
      "High-DPI Retina PNG and vector SVG export",
    ],
  },
  "url-to-linkedin-carousel": {
    slug: "url-to-linkedin-carousel",
    title: "URL to LinkedIn Carousel Generator — Turn Articles into 4:5 Slides",
    metaDescription: "Transform any blog post, article, or research link into a 5-8 slide swipeable LinkedIn PDF carousel with charts.",
    h1: "Turn Any Article URL into a Swipeable LinkedIn Carousel",
    subtitle: "Clean readability extraction strips ads and navigation to build high-retention 4:5 PDF slides ready to upload to LinkedIn.",
    targetFormat: "carousel",
    defaultTemplateId: "minimalist-tech",
    samplePresetKey: "ai-infrastructure-costs",
    features: [
      "Automatic 4:5 aspect ratio pagination (1080×1350)",
      "Multi-page PDF download ready for LinkedIn document posts",
      "Editorial serif and modern dark themes",
    ],
  },
  "pdf-to-presentation": {
    slug: "pdf-to-presentation",
    title: "PDF to Presentation Deck — Convert PDF Reports to Editable PowerPoint",
    metaDescription: "Convert dense PDF whitepapers and financial reports into native editable .pptx presentation decks.",
    h1: "Convert PDF Research Reports to Native PowerPoint Decks",
    subtitle: "Extract executive metrics and tabular data into 16:9 widescreen slides with real PowerPoint shapes and native charts.",
    targetFormat: "presentation",
    defaultTemplateId: "executive-dark",
    samplePresetKey: "saas-churn-metrics",
    features: [
      "Client-side PDF text layer parsing via pdf.js",
      "Native .pptx generation with pptxgenjs",
      "Editable shapes and charts in PowerPoint or Google Slides",
    ],
  },
  "saas-metrics-to-carousel": {
    slug: "saas-metrics-to-carousel",
    title: "SaaS Metrics to LinkedIn Carousel — Visualize Retention, NDR & CAC",
    metaDescription: "Turn B2B SaaS benchmarks, churn rates, and retention curves into viral swipeable carousels for LinkedIn.",
    h1: "Visualize SaaS Metrics & Benchmarks for LinkedIn",
    subtitle: "Present NDR, ACV tiers, and LTV/CAC ratios in stunning editorial layouts that founders and VCs bookmark.",
    targetFormat: "carousel",
    defaultTemplateId: "clean-bento",
    samplePresetKey: "saas-churn-metrics",
    features: [
      "2-column SaaS comparison tables",
      "Automatic positive/negative delta indicators",
      "1-click export to PDF and high-res PNG",
    ],
  },
  "research-paper-to-infographic": {
    slug: "research-paper-to-infographic",
    title: "Research Paper to Infographic — Synthesize Academic Papers Visually",
    metaDescription: "Convert arXiv papers, biomedical studies, and whitepapers into publication-ready visual summaries.",
    h1: "Turn Academic Papers into Publication-Grade Infographics",
    subtitle: "Condense methodology, quantitative findings, and key takeaways into an authoritative editorial poster.",
    targetFormat: "infographic",
    defaultTemplateId: "editorial-serif",
    samplePresetKey: "ai-infrastructure-costs",
    features: [
      "Academic citation and source attribution",
      "Numbered methodology process steps",
      "Financial Times and Atlantic editorial typography",
    ],
  },
  "excel-to-slides": {
    slug: "excel-to-slides",
    title: "Excel to Slides — Convert .xlsx Workbooks to Presentation Decks",
    metaDescription: "Parse Excel spreadsheets client-side and build polished 16:9 presentation slides instantly.",
    h1: "Convert Excel Spreadsheets into Executive Slides",
    subtitle: "Upload your workbook and let StatDeck synthesize key figures into clean slides without uploading files to third-party servers.",
    targetFormat: "presentation",
    defaultTemplateId: "swiss-grid",
    samplePresetKey: "saas-churn-metrics",
    features: [
      "Client-side SheetJS parsing (0 bytes uploaded)",
      "Instant 16:9 widescreen mapping",
      "Native editable PowerPoint export",
    ],
  },
};

export const PSEO_SLUGS = Object.keys(PSEO_WORKFLOWS);
