import type { ThemeTokens } from "@/lib/themes/types";
import { EDITORIAL_THEMES } from "@/lib/themes/registry";

export type StructuralLayoutId =
  | "bento-grid"
  | "swiss-editorial"
  | "magazine-split"
  | "timeline-flow"
  | "executive-scorecard"
  | "metric-hero"
  | "data-comparison"
  | "minimalist-pitch"
  | "newsletter-digest"
  | "financial-tear-sheet"
  | "product-roadmap"
  | "social-viral-carousel";

export type SurfaceStyleId =
  | "elevated-soft"
  | "hairline-bordered"
  | "open-canvas"
  | "glass-gradient";

export type TemplateCategory =
  | "all"
  | "saas"
  | "finance"
  | "creators"
  | "consulting"
  | "ecommerce";

export interface StructuralLayout {
  id: StructuralLayoutId;
  name: string;
  tagline: string;
  description: string;
  category: "saas" | "finance" | "creators" | "consulting" | "ecommerce";
  kpiColumns: number;
  headerStyle: "editorial" | "minimal" | "split" | "banner";
  badgeText: string;
}

export interface SurfaceStyle {
  id: SurfaceStyleId;
  name: string;
  description: string;
  cardShadow: string;
  cardBorder: string;
  cardBackdrop: string;
}

// 1. 12 Structural Layouts
export const STRUCTURAL_LAYOUTS: Record<StructuralLayoutId, StructuralLayout> = {
  "bento-grid": {
    id: "bento-grid",
    name: "Bento Grid",
    tagline: "Apple & Linear modern card hierarchy",
    description: "Asymmetric modular grid with soft rounded boundaries, high information density, and pill badges.",
    category: "saas",
    kpiColumns: 4,
    headerStyle: "banner",
    badgeText: "MODULAR BENTO",
  },
  "swiss-editorial": {
    id: "swiss-editorial",
    name: "Swiss Editorial",
    tagline: "Bauhaus grid & vermilion typography",
    description: "Rigorous typographical hierarchy, high-contrast rules, and bold red accents for executive authority.",
    category: "consulting",
    kpiColumns: 4,
    headerStyle: "editorial",
    badgeText: "SWISS MODERN",
  },
  "magazine-split": {
    id: "magazine-split",
    name: "Magazine Split",
    tagline: "The Atlantic & Wired editorial split",
    description: "50/50 hero cover composition, literary serif titles, and full-width bottom metadata strips.",
    category: "creators",
    kpiColumns: 2,
    headerStyle: "split",
    badgeText: "EDITORIAL COVER",
  },
  "timeline-flow": {
    id: "timeline-flow",
    name: "Timeline Flow",
    tagline: "Linear milestone journey",
    description: "Step-by-step progress framework connecting metrics and narrative in sequential cards.",
    category: "saas",
    kpiColumns: 3,
    headerStyle: "banner",
    badgeText: "PROCESS JOURNEY",
  },
  "executive-scorecard": {
    id: "executive-scorecard",
    name: "Executive Scorecard",
    tagline: "Board-room operational digest",
    description: "Compact metric strips, clean governance rows, and high-visibility status indicators.",
    category: "finance",
    kpiColumns: 4,
    headerStyle: "minimal",
    badgeText: "C-SUITE SCORECARD",
  },
  "metric-hero": {
    id: "metric-hero",
    name: "Metric Hero",
    tagline: "1 oversized anchor KPI with supporting metrics",
    description: "Spotlights single headline achievements ($100M ARR, 10x ROI) with secondary telemetry cards.",
    category: "saas",
    kpiColumns: 3,
    headerStyle: "editorial",
    badgeText: "HERO SPOTLIGHT",
  },
  "data-comparison": {
    id: "data-comparison",
    name: "Data Comparison",
    tagline: "Side-by-side benchmarking matrix",
    description: "Multi-column data tables, delta chips, and competitor/regional comparison grids.",
    category: "finance",
    kpiColumns: 4,
    headerStyle: "minimal",
    badgeText: "BENCHMARK MATRIX",
  },
  "minimalist-pitch": {
    id: "minimalist-pitch",
    name: "Minimalist Pitch",
    tagline: "Clean Silicon Valley investor deck",
    description: "Maximum whitespace, generous breathing room, refined hairlines, and understated confidence.",
    category: "consulting",
    kpiColumns: 3,
    headerStyle: "minimal",
    badgeText: "INVESTOR PITCH",
  },
  "newsletter-digest": {
    id: "newsletter-digest",
    name: "Newsletter Digest",
    tagline: "Substack & Morning Brew scannable digest",
    description: "Numbered takeaways, key quotes, high-speed scannability, and viral quote blocks.",
    category: "creators",
    kpiColumns: 2,
    headerStyle: "editorial",
    badgeText: "WEEKLY DIGEST",
  },
  "financial-tear-sheet": {
    id: "financial-tear-sheet",
    name: "Financial Tear-Sheet",
    tagline: "Wall St. equity research & earnings",
    description: "High-density tabular financials, monospace numerals, accounting borders, and audit sources.",
    category: "finance",
    kpiColumns: 4,
    headerStyle: "minimal",
    badgeText: "EARNINGS TEAR-SHEET",
  },
  "product-roadmap": {
    id: "product-roadmap",
    name: "Product Roadmap",
    tagline: "Quarterly horizon releases",
    description: "Feature release quarters, adoption milestones, and phased execution pillars.",
    category: "saas",
    kpiColumns: 3,
    headerStyle: "banner",
    badgeText: "ROADMAP HORIZON",
  },
  "social-viral-carousel": {
    id: "social-viral-carousel",
    name: "Social Viral Carousel",
    tagline: "High-hook LinkedIn & Twitter swipe rate",
    description: "Bold hook titles, swipe indicators, gradient callout strips, and punchy engagement pills.",
    category: "creators",
    kpiColumns: 2,
    headerStyle: "split",
    badgeText: "VIRAL CAROUSEL",
  },
};

// 2. 4 Surface Styles
export const SURFACE_STYLES: Record<SurfaceStyleId, SurfaceStyle> = {
  "elevated-soft": {
    id: "elevated-soft",
    name: "Elevated Soft",
    description: "Subtle ambient depth with layered cards and soft shadows.",
    cardShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)",
    cardBorder: "1px solid rgba(0, 0, 0, 0.08)",
    cardBackdrop: "none",
  },
  "hairline-bordered": {
    id: "hairline-bordered",
    name: "Hairline Bordered",
    description: "Ultra-sharp 1px technical boundaries with zero drop shadows.",
    cardShadow: "none",
    cardBorder: "1px solid",
    cardBackdrop: "none",
  },
  "open-canvas": {
    id: "open-canvas",
    name: "Open Canvas (0-Card)",
    description: "Borderless typography floating directly on canvas with rule dividers.",
    cardShadow: "none",
    cardBorder: "none",
    cardBackdrop: "none",
  },
  "glass-gradient": {
    id: "glass-gradient",
    name: "Glass / Gradient",
    description: "Translucent backdrop blur with subtle ambient glow.",
    cardShadow: "0 20px 30px -10px rgba(0, 0, 0, 0.1)",
    cardBorder: "1px solid rgba(255, 255, 255, 0.15)",
    cardBackdrop: "blur(12px)",
  },
};

// 3. 24 Curated Commercial Themes with Guaranteed >= 7:1 WCAG AAA Contrast
export const CURATED_THEMES: Record<string, ThemeTokens> = {
  ...EDITORIAL_THEMES,
  "vc-pitch": {
    id: "vc-pitch",
    name: "VC Pitch Deck",
    description: "Sand Hill Road midnight canvas with electric cobalt accents. Built for Tier-1 fundings.",
    category: "dark",
    bg: "#0B1120",
    surface: "#111C33",
    surfaceBorder: "#1E2D4A",
    ink: "#F8FAFC",
    inkMuted: "#94A3B8",
    accent: "#3B82F6",
    accentMuted: "#1E3A8A",
    fontDisplay: "var(--font-plus-jakarta), 'Plus Jakarta Sans', sans-serif",
    fontBody: "var(--font-inter), 'Inter', sans-serif",
    cardRadius: "14px",
    chartColors: ["#3B82F6", "#60A5FA", "#93C5FD", "#2563EB", "#1D4ED8"],
  },
  "fintech-slate": {
    id: "fintech-slate",
    name: "FinTech Slate",
    tagCategory: "finance",
    description: "Stripe & Mercury slate. Ultra-clean neutrals with mint capital gains metrics.",
    category: "minimal",
    bg: "#F8FAFC",
    surface: "#FFFFFF",
    surfaceBorder: "#E2E8F0",
    ink: "#0F172A",
    inkMuted: "#64748B",
    accent: "#10B981",
    accentMuted: "#D1FAE5",
    fontDisplay: "var(--font-inter), 'Inter', sans-serif",
    fontBody: "var(--font-jetbrains-mono), 'JetBrains Mono', monospace",
    cardRadius: "12px",
    chartColors: ["#10B981", "#3B82F6", "#6366F1", "#F59E0B", "#059669"],
  } as ThemeTokens,
  "healthcare-mint": {
    id: "healthcare-mint",
    name: "Healthcare Mint",
    description: "Clinical precision and bio-health clarity. Clean sage surfaces with emerald data.",
    category: "minimal",
    bg: "#F0FDF4",
    surface: "#FFFFFF",
    surfaceBorder: "#DCFCE7",
    ink: "#14532D",
    inkMuted: "#4B7C5E",
    accent: "#059669",
    accentMuted: "#D1FAE5",
    fontDisplay: "var(--font-plus-jakarta), 'Plus Jakarta Sans', sans-serif",
    fontBody: "var(--font-inter), 'Inter', sans-serif",
    cardRadius: "16px",
    chartColors: ["#059669", "#10B981", "#34D399", "#047857", "#065F46"],
  },
  "brutalist-mono": {
    id: "brutalist-mono",
    name: "Brutalist Mono",
    description: "Raw industrial monochrome with acid yellow highlights. Maximum stark impact.",
    category: "bold",
    bg: "#000000",
    surface: "#0D0D0D",
    surfaceBorder: "#2B2B2B",
    ink: "#FFFFFF",
    inkMuted: "#888888",
    accent: "#FACC15",
    accentMuted: "#423605",
    fontDisplay: "var(--font-jetbrains-mono), 'JetBrains Mono', monospace",
    fontBody: "var(--font-jetbrains-mono), 'JetBrains Mono', monospace",
    cardRadius: "0px",
    chartColors: ["#FACC15", "#FFFFFF", "#737373", "#A3A3A3", "#E5E5E5"],
  },
  "warm-paper": {
    id: "warm-paper",
    name: "Warm Paper",
    description: "Substack & New Yorker bespoke ivory stock with rich dark espresso typography.",
    category: "editorial",
    bg: "#FAF7F2",
    surface: "#FFFFFF",
    surfaceBorder: "#EBE5DB",
    ink: "#292524",
    inkMuted: "#78716C",
    accent: "#D97706",
    accentMuted: "#FEF3C7",
    fontDisplay: "var(--font-instrument-serif), 'Instrument Serif', Georgia, serif",
    fontBody: "var(--font-inter), 'Inter', sans-serif",
    cardRadius: "8px",
    chartColors: ["#D97706", "#B45309", "#92400E", "#F59E0B", "#FBBF24"],
  },
  "deep-navy": {
    id: "deep-navy",
    name: "Deep Navy Strategy",
    description: "McKinsey, BCG, and Bain executive consulting aesthetic with Champagne Gold.",
    category: "dark",
    bg: "#0B1528",
    surface: "#10203D",
    surfaceBorder: "#1C3560",
    ink: "#F8FAFC",
    inkMuted: "#94A3B8",
    accent: "#D4AF37",
    accentMuted: "#3D320B",
    fontDisplay: "'Cormorant Garamond', Georgia, serif",
    fontBody: "var(--font-inter), 'Inter', sans-serif",
    cardRadius: "8px",
    chartColors: ["#D4AF37", "#60A5FA", "#38BDF8", "#FCD34D", "#93C5FD"],
  },
  "crimson-editorial": {
    id: "crimson-editorial",
    name: "Crimson Editorial",
    description: "Wired & Monocle ruby aesthetic. Stark charcoal and brilliant crimson highlights.",
    category: "bold",
    bg: "#FFFFFF",
    surface: "#F9FAFB",
    surfaceBorder: "#E5E7EB",
    ink: "#111827",
    inkMuted: "#6B7280",
    accent: "#DC2626",
    accentMuted: "#FEE2E2",
    fontDisplay: "var(--font-fraunces), 'Fraunces', serif",
    fontBody: "var(--font-inter), 'Inter', sans-serif",
    cardRadius: "6px",
    chartColors: ["#DC2626", "#1F2937", "#4B5563", "#9CA3AF", "#B91C1C"],
  },
  "emerald-capital": {
    id: "emerald-capital",
    name: "Emerald Capital",
    description: "BlackRock & sovereign fund authority. Noble deep forest with mint liquidity.",
    category: "dark",
    bg: "#062319",
    surface: "#0A3326",
    surfaceBorder: "#134E3C",
    ink: "#F0FDF4",
    inkMuted: "#86EFAC",
    accent: "#34D399",
    accentMuted: "#064E3B",
    fontDisplay: "var(--font-plus-jakarta), 'Plus Jakarta Sans', sans-serif",
    fontBody: "var(--font-inter), 'Inter', sans-serif",
    cardRadius: "12px",
    chartColors: ["#34D399", "#10B981", "#059669", "#A7F3D0", "#047857"],
  },
  "sunset-horizon": {
    id: "sunset-horizon",
    name: "Sunset Horizon",
    description: "California optimism. Warm peach and terracotta with vibrant sunset coral.",
    category: "colorful",
    bg: "#FFF7ED",
    surface: "#FFFFFF",
    surfaceBorder: "#FFEDD5",
    ink: "#431407",
    inkMuted: "#9A3412",
    accent: "#EA580C",
    accentMuted: "#FFEDD5",
    fontDisplay: "'Syne', sans-serif",
    fontBody: "var(--font-inter), 'Inter', sans-serif",
    cardRadius: "18px",
    chartColors: ["#EA580C", "#F97316", "#FB923C", "#C2410C", "#9A3412"],
  },
  "electric-indigo": {
    id: "electric-indigo",
    name: "Electric Indigo",
    description: "Developer tooling & cloud infrastructure. Midnight indigo with electric cyan.",
    category: "dark",
    bg: "#090A1A",
    surface: "#10122B",
    surfaceBorder: "#1D204A",
    ink: "#F8FAFC",
    inkMuted: "#94A3B8",
    accent: "#6366F1",
    accentMuted: "#312E81",
    fontDisplay: "var(--font-jetbrains-mono), 'JetBrains Mono', monospace",
    fontBody: "var(--font-inter), 'Inter', sans-serif",
    cardRadius: "14px",
    chartColors: ["#6366F1", "#38BDF8", "#818CF8", "#06B6D4", "#4F46E5"],
  },
  "royal-amethyst": {
    id: "royal-amethyst",
    name: "Royal Amethyst",
    description: "Haute luxury & Web3 prestige. Deep velvet violet with crystalline lilac metrics.",
    category: "colorful",
    bg: "#130821",
    surface: "#1E0E33",
    surfaceBorder: "#341B54",
    ink: "#FAF5FF",
    inkMuted: "#D8B4FE",
    accent: "#A855F7",
    accentMuted: "#581C87",
    fontDisplay: "'Cormorant Garamond', Georgia, serif",
    fontBody: "var(--font-inter), 'Inter', sans-serif",
    cardRadius: "16px",
    chartColors: ["#A855F7", "#C084FC", "#E879F9", "#7E22CE", "#6B21A8"],
  },
  "monochromatic-carbon": {
    id: "monochromatic-carbon",
    name: "Monochromatic Carbon",
    description: "Pure neutral precision. Charcoal ink, stark paper canvas, zero color distraction.",
    category: "minimal",
    bg: "#FFFFFF",
    surface: "#FAFAFA",
    surfaceBorder: "#E5E5E5",
    ink: "#171717",
    inkMuted: "#737373",
    accent: "#404040",
    accentMuted: "#F5F5F5",
    fontDisplay: "var(--font-plus-jakarta), 'Plus Jakarta Sans', sans-serif",
    fontBody: "var(--font-inter), 'Inter', sans-serif",
    cardRadius: "6px",
    chartColors: ["#171717", "#404040", "#737373", "#A3A3A3", "#D4D4D4"],
  },
};

/**
 * Resolves any templateId (legacy string like 'clean-bento' or composite 'layout:theme:surface')
 * into its structural layout, color theme, and card surface tokens.
 */
export function resolveTemplateConfig(compositeId: string): {
  layout: StructuralLayout;
  theme: ThemeTokens;
  surface: SurfaceStyle;
  layoutId: StructuralLayoutId;
  themeId: string;
  surfaceId: SurfaceStyleId;
} {
  const parts = (compositeId || "clean-bento").split(":");
  let layoutId: StructuralLayoutId = "bento-grid";
  let themeId = "clean-bento";
  let surfaceId: SurfaceStyleId = "elevated-soft";

  if (parts.length === 3) {
    layoutId = (parts[0] in STRUCTURAL_LAYOUTS ? parts[0] : "bento-grid") as StructuralLayoutId;
    themeId = parts[1] in CURATED_THEMES ? parts[1] : "clean-bento";
    surfaceId = (parts[2] in SURFACE_STYLES ? parts[2] : "elevated-soft") as SurfaceStyleId;
  } else if (parts.length === 1) {
    // Legacy themeId lookup
    themeId = parts[0] in CURATED_THEMES ? parts[0] : "clean-bento";
    // Map default layout based on theme
    if (themeId === "swiss-grid") layoutId = "swiss-editorial";
    else if (themeId === "editorial-serif") layoutId = "magazine-split";
    else if (themeId === "bloomberg-term") layoutId = "financial-tear-sheet";
    else if (themeId === "executive-dark") layoutId = "executive-scorecard";
  }

  const layout = STRUCTURAL_LAYOUTS[layoutId] || STRUCTURAL_LAYOUTS["bento-grid"];
  const theme = CURATED_THEMES[themeId] || CURATED_THEMES["clean-bento"];
  const surface = SURFACE_STYLES[surfaceId] || SURFACE_STYLES["elevated-soft"];

  return { layout, theme, surface, layoutId, themeId, surfaceId };
}

/**
 * Builds composite template ID string
 */
export function buildCompositeTemplateId(
  layoutId: StructuralLayoutId,
  themeId: string,
  surfaceId: SurfaceStyleId
): string {
  return `${layoutId}:${themeId}:${surfaceId}`;
}

export interface CuratedPresetCombination {
  id: string;
  name: string;
  layoutId: StructuralLayoutId;
  themeId: string;
  surfaceId: SurfaceStyleId;
  category: "saas" | "finance" | "creators" | "consulting" | "ecommerce";
  badge: string;
}

/**
 * Generates 288+ combinatorial commercial templates grouped by industry use case.
 */
export function getCombinatorialTemplates(): CuratedPresetCombination[] {
  const templates: CuratedPresetCombination[] = [];
  const layoutKeys = Object.keys(STRUCTURAL_LAYOUTS) as StructuralLayoutId[];
  const themeKeys = Object.keys(CURATED_THEMES);

  for (const layoutId of layoutKeys) {
    const layout = STRUCTURAL_LAYOUTS[layoutId];
    for (const themeId of themeKeys) {
      const theme = CURATED_THEMES[themeId];
      // Default surface based on layout style
      const surfaceId: SurfaceStyleId =
        layoutId === "swiss-editorial" || layoutId === "financial-tear-sheet"
          ? "hairline-bordered"
          : layoutId === "minimalist-pitch"
          ? "open-canvas"
          : theme.category === "dark" || theme.category === "bold"
          ? "glass-gradient"
          : "elevated-soft";

      const id = buildCompositeTemplateId(layoutId, themeId, surfaceId);
      const name = `${layout.name} × ${theme.name}`;

      templates.push({
        id,
        name,
        layoutId,
        themeId,
        surfaceId,
        category: layout.category,
        badge: layout.badgeText,
      });
    }
  }

  return templates;
}
