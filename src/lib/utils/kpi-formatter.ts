import type { OutputFormat } from "@/lib/schemas/deck-schema";

/**
 * Returns character-length-aware responsive font size classes for KPI headline numbers.
 * Completely eliminates text truncation (no `truncate`), preventing `$1,200,000` or `₹2,070,000`
 * from being cut off with ellipses.
 */
export function getKpiValueSizeClass(value: string | undefined | null, format: OutputFormat = "carousel"): string {
  const str = String(value || "").trim();
  const len = str.length;

  if (format === "presentation") {
    // 4-column compact horizontal slide layout
    if (len <= 6) return "text-2xl xl:text-3xl";
    if (len <= 9) return "text-xl xl:text-2xl";
    return "text-base xl:text-lg";
  }

  if (format === "infographic") {
    // 2-column or 4-column vertical poster strip
    if (len <= 6) return "text-xl sm:text-2xl";
    if (len <= 9) return "text-lg sm:text-xl";
    return "text-base sm:text-lg";
  }

  // format === "carousel" (2x2 grid on 4:5 slide)
  if (len <= 6) return "text-2xl md:text-3xl xl:text-4xl";
  if (len <= 10) return "text-xl md:text-2xl xl:text-3xl";
  return "text-lg md:text-xl xl:text-2xl";
}
