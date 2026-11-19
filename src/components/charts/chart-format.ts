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
  const isNegative = val < 0;
  const absVal = Math.abs(val);
  const numStr =
    Math.round(absVal * 100) / 100 === Math.round(absVal)
      ? Math.round(absVal).toLocaleString("en-US")
      : Number(absVal.toFixed(1)).toLocaleString("en-US");
  const sign = isNegative ? "-" : "";

  // Prefix currency symbols: $, €, £, ¥, ₹ (e.g. -$1,200, -€500)
  if (u === "$" || u === "€" || u === "£" || u === "¥" || u === "₹") {
    return `${sign}${u}${numStr}`;
  }

  // Currency with suffix like $M, $K, $B, €M (e.g. -$2.4M)
  if (/^[\$€£¥₹]/.test(u)) {
    return `${sign}${u.charAt(0)}${numStr}${u.slice(1)}`;
  }

  // Percentage (e.g. -14.2%)
  if (u === "%") {
    return `${sign}${numStr}%`;
  }

  // Standard suffix unit (e.g. -42 users)
  return u ? `${sign}${numStr} ${u}` : `${sign}${numStr}`;
}
