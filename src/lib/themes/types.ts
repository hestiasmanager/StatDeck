export interface ThemeTokens {
  id: string;
  name: string;
  description: string;
  category: "minimal" | "editorial" | "dark" | "bold" | "colorful";
  bg: string;
  surface: string;
  surfaceBorder: string;
  ink: string;
  inkMuted: string;
  accent: string;
  accentMuted: string;
  fontDisplay: string;
  fontBody: string;
  fontDisplayUrl?: string;
  cardRadius: string;
  chartColors: string[];
}
