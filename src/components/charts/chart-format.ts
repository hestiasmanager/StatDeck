/**
 * Formats a chart data value with proper currency symbol prefixing,
 * thousands separators, and unit suffixes.
 * E.g.:
 * - formatChartValue(54500, "$") => "$54,500"
 * - formatChartValue(1234.5, "€") => "€1,234.5"
 * - formatChartValue(85, "%") => "85%"
 * - formatChartValue(42, "users") => "42 users"
 * - formatChartValue(100) => "100"
 */
export function formatChartValue(val: number, unit?: string): string {
  if (val === null || val === undefined || isNaN(val)) return "0";

  const u = (unit || "").trim();
  const numStr =
    Math.round(val * 100) / 100 === Math.round(val)
      ? Math.round(val).toLocaleString("en-US")
      : Number(val.toFixed(1)).toLocaleString("en-US");

  // Prefix currency symbols: $, €, £, ¥, ₹
  if (u === "$" || u === "€" || u === "£" || u === "¥" || u === "₹") {
    return `${u}${numStr}`;
  }

  // Currency with suffix like $M, $K, $B, €M
  if (/^[\$€£¥₹]/.test(u)) {
    return `${u.charAt(0)}${numStr}${u.slice(1)}`;
  }

  // Percentage
  if (u === "%") {
    return `${numStr}%`;
  }

  // Standard suffix unit (e.g. "users", "ms", "pts")
  return u ? `${numStr} ${u}` : numStr;
}
