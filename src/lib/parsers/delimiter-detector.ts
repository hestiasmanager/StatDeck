/**
 * Auto-detects table delimiters (;, \t, ,, |) across CSVs, TSVs, and pasted Notes tables.
 * Inspects rows outside of quotes to evaluate frequency and consistency.
 */
export function detectDelimiter(text: string): string {
  if (!text) return ",";

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .slice(0, 25);

  if (lines.length === 0) return ",";

  const candidates = [";", "\t", ",", "|"];
  let bestDelimiter = ",";
  let bestScore = -1;

  for (const delim of candidates) {
    const counts = lines.map((line) => {
      let inQuote = false;
      let count = 0;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuote = !inQuote;
        } else if (char === delim && !inQuote) {
          count++;
        }
      }
      return count;
    });

    const positiveCounts = counts.filter((c) => c > 0);
    // Requires delimiter to appear in at least 2 lines (or all lines if only 1 line)
    const minRequiredLines = lines.length === 1 ? 1 : Math.min(2, lines.length);

    if (positiveCounts.length >= minRequiredLines) {
      const avg = positiveCounts.reduce((a, b) => a + b, 0) / positiveCounts.length;
      // Variance in column count across lines
      const variance =
        positiveCounts.reduce((acc, c) => acc + Math.pow(c - avg, 2), 0) /
        positiveCounts.length;

      // Penalize high variance (prefer consistent column count across rows)
      const consistency = 1 / (1 + variance);
      const rowRatio = positiveCounts.length / lines.length;

      // Prioritize ; and \t when they clearly structure the table
      const delimWeight = delim === ";" ? 1.25 : delim === "\t" ? 1.25 : 1.0;
      const score = avg * consistency * rowRatio * delimWeight;

      if (score > bestScore) {
        bestScore = score;
        bestDelimiter = delim;
      }
    }
  }

  return bestDelimiter;
}
