import type { DeckAST, OutputFormat, KpiCard, ChartBlock, ContentBlock } from "@/lib/schemas/deck-schema";

/**
 * Truncates text at the nearest word boundary without cutting off mid-word
 * or leaving unclosed parentheses/brackets.
 */
export function truncateAtWordBoundary(text: string, maxLength: number): string {
  if (!text) return "";
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;

  const substr = trimmed.slice(0, maxLength);
  const lastSpace = substr.lastIndexOf(" ");

  let result = lastSpace > maxLength * 0.6 ? substr.slice(0, lastSpace).trim() : substr.trim();

  // Strip trailing dangling punctuation, hyphens, colons, or unclosed brackets
  result = result.replace(/[,;:\-—–(\[]+$/, "").trim();

  // If an opening parenthesis was opened without closing, balance or remove it
  const openCount = (result.match(/\(/g) || []).length;
  const closeCount = (result.match(/\)/g) || []).length;
  if (openCount > closeCount) {
    result = result.replace(/\([^)]*$/, "").trim();
  }

  return result;
}

/**
 * Intelligent deterministic heuristic extractor.
 * Converts ANY raw CSV, Excel markdown table, or scraped article text
 * into a rich, accurate, data-backed DeckAST without requiring external LLM API calls.
 */
export function extractHeuristicDeckAST(
  rawContent: string,
  format: OutputFormat = "carousel",
  templateId: string = "clean-bento"
): DeckAST {
  const lines = rawContent
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Check if content contains tabular data (CSV / Excel markdown table)
  const isTable = lines.some((l) => l.startsWith("|") && l.endsWith("|"));

  if (isTable) {
    return parseTableToAST(rawContent, format, templateId);
  }

  return parseArticleTextToAST(rawContent, format, templateId);
}

/**
 * Parses markdown table or CSV lines into real KPIs, charts, and comparison tables.
 */
function parseTableToAST(content: string, format: OutputFormat, templateId: string): DeckAST {
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);

  // Extract dataset title if present
  let title = "Data & Performance Overview";
  const firstLine = lines[0];
  if (firstLine.toLowerCase().includes("dataset:") || firstLine.toLowerCase().includes("file:")) {
    title = firstLine.replace(/^(csv dataset:|excel file:)/i, "").split("(")[0].trim();
  }

  // Find table header and rows
  const tableLines = lines.filter((l) => l.startsWith("|") && l.endsWith("|") && !l.includes("---"));
  if (tableLines.length < 2) {
    return parseArticleTextToAST(content, format, templateId);
  }

  const headerCells = tableLines[0]
    .split("|")
    .map((c) => c.trim())
    .filter(Boolean);

  const dataRows: Array<Record<string, string>> = [];
  for (let i = 1; i < tableLines.length; i++) {
    const cells = tableLines[i]
      .split("|")
      .map((c) => c.trim())
      .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

    if (cells.length > 0) {
      const rowObj: Record<string, string> = {};
      headerCells.forEach((header, idx) => {
        rowObj[header] = cells[idx] || "";
      });
      dataRows.push(rowObj);
    }
  }

  // Identify categorical vs numerical columns
  const numericColumns: Array<{ name: string; numbers: number[]; unit: string }> = [];
  let categoryColumn = headerCells[0];

  headerCells.forEach((header) => {
    const rawValues = dataRows.map((r) => r[header] || "");
    const cleanNumbers: number[] = [];
    let detectedUnit = "";

    rawValues.forEach((val) => {
      if (val.includes("%")) detectedUnit = "%";
      else if (val.includes("$")) detectedUnit = "$";
      else if (val.toLowerCase().includes("k")) detectedUnit = "K";
      else if (val.toLowerCase().includes("m")) detectedUnit = "M";

      const num = parseFloat(val.replace(/[$,%kKmM\s]/g, ""));
      if (!isNaN(num)) {
        cleanNumbers.push(num);
      }
    });

    if (cleanNumbers.length >= Math.max(2, dataRows.length * 0.6)) {
      numericColumns.push({ name: header.replace(/_/g, " "), numbers: cleanNumbers, unit: detectedUnit });
    } else if (categoryColumn === headerCells[0] && cleanNumbers.length < dataRows.length * 0.3) {
      categoryColumn = header;
    }
  });

function formatNumberCompact(num: number, unit: string = ""): string {
  if (unit === "%") {
    return `${Math.round(num * 10) / 10}%`;
  }
  const prefix = unit === "$" ? "$" : "";
  const suffix = unit && unit !== "$" && unit !== "%" ? unit : "";

  if (Math.abs(num) >= 1_000_000) {
    return `${prefix}${(num / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(num) >= 10_000) {
    return `${prefix}${(num / 1_000).toFixed(1)}K`;
  }
  if (Math.abs(num) >= 1_000) {
    return `${prefix}${num.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }
  if (Number.isInteger(num)) {
    return `${prefix}${num}${suffix}`;
  }
  return `${prefix}${Math.round(num * 10) / 10}${suffix}`;
}

  // Construct 1 to 4 KPIs
  const kpis: KpiCard[] = [];

  if (numericColumns.length > 0) {
    numericColumns.slice(0, 4).forEach((col, idx) => {
      const nums = col.numbers;
      const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
      const max = Math.max(...nums);

      const formattedVal = formatNumberCompact(avg, col.unit);
      const formattedMax = formatNumberCompact(max, col.unit);

      kpis.push({
        id: `kpi-gen-${idx + 1}`,
        value: formattedVal,
        label: col.name,
        delta: `Max: ${formattedMax}`,
        deltaType: "positive",
        description: `Average across ${dataRows.length} entries`,
      });
    });
  } else {
    kpis.push({
      id: "kpi-gen-1",
      value: String(dataRows.length),
      label: "Total Records",
      delta: "100% Parsed",
      deltaType: "neutral",
      description: "Data parsed client-side",
    });
  }

  // Construct Chart
  const charts: ChartBlock[] = [];
  if (numericColumns.length > 0 && dataRows.length > 0) {
    const primaryNumCol = numericColumns[0];
    const chartData = dataRows.slice(0, 8).map((row, i) => {
      const label = row[categoryColumn] || `Item ${i + 1}`;
      const num = primaryNumCol.numbers[i] ?? 0;
      return {
        label: truncateAtWordBoundary(label, 20),
        value: Math.round(num * 10) / 10,
      };
    });

    charts.push({
      id: "chart-gen-1",
      type: "bar",
      title: `${primaryNumCol.name} by ${categoryColumn.replace(/_/g, " ")}`,
      unit: primaryNumCol.unit,
      xAxisLabel: categoryColumn.replace(/_/g, " "),
      yAxisLabel: primaryNumCol.name,
      data: chartData,
    });
  }

  // Construct Blocks (Comparison table from rows)
  const blocks: ContentBlock[] = [];
  if (dataRows.length >= 2 && headerCells.length >= 3) {
    const headers: [string, string] = [
      headerCells[1]?.replace(/_/g, " ") || "Metric A",
      headerCells[2]?.replace(/_/g, " ") || "Metric B",
    ];

    const rows = dataRows.slice(0, 5).map((r) => ({
      feature: truncateAtWordBoundary(r[categoryColumn] || "Entry", 35),
      colA: truncateAtWordBoundary(r[headerCells[1]] || "N/A", 35),
      colB: truncateAtWordBoundary(r[headerCells[2]] || "N/A", 35),
    }));

    blocks.push({
      id: "block-table-1",
      type: "comparison_table",
      title: "Breakdown Comparison",
      headers,
      rows,
    });
  }

  return {
    meta: {
      title: truncateAtWordBoundary(title, 80),
      subtitle: truncateAtWordBoundary(`Analysis of ${dataRows.length} entries across ${headerCells.length} data dimensions.`, 180),
      category: "Dataset Analysis",
      sourceCitations: ["Uploaded File (Client-Side Parsed)"],
      date: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    },
    kpis,
    charts,
    blocks,
    templateId,
    format,
    watermark: true,
  };
}

/**
 * Parses article text / URL content into real quantitative KPIs and takeaways.
 */
function parseArticleTextToAST(content: string, format: OutputFormat, templateId: string): DeckAST {
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);

  // 1. Title Extraction
  let title = "Executive Overview & Insights";
  let subtitle = "Synthesized data breakdown and strategic takeaways.";
  let source = "StatDeck Research";

  for (const line of lines) {
    if (line.toLowerCase().startsWith("title:")) {
      title = line.replace(/^title:/i, "").trim();
    } else if (line.toLowerCase().startsWith("source:")) {
      source = line.replace(/^source:/i, "").trim();
    } else if (line.toLowerCase().startsWith("summary:") || line.toLowerCase().startsWith("excerpt:")) {
      subtitle = line.replace(/^(summary:|excerpt:)/i, "").trim();
    }
  }

  if (title === "Executive Overview & Insights" && lines[0] && !lines[0].startsWith("|")) {
    title = lines[0].replace(/^[#\s]+/, "");
  }

  title = truncateAtWordBoundary(title, 80);
  subtitle = truncateAtWordBoundary(subtitle, 180);

  // 2. Scan for Numbers, Percentages, and Dollar Amounts in Prose
  // Matches "$42.8M", "84.2%", "3.5x", "12,000", "+24%"
  const numberMatches: Array<{ value: string; label: string; num: number }> = [];
  const numRegex = /([+-]?\$?\d+(?:\.\d+)?(?:%|x|M|B|K|k|m|b)?)\s+([a-zA-Z\s]{3,24})/g;

  let match;
  while ((match = numRegex.exec(content)) !== null) {
    const rawVal = match[1].trim();
    const label = match[2].trim().replace(/\b(the|and|or|in|of|to|is|was|were)\b/gi, "").trim();
    const cleanNum = parseFloat(rawVal.replace(/[$,%xKkMmBb]/g, ""));

    if (rawVal.length >= 2 && !isNaN(cleanNum) && label.length >= 3) {
      numberMatches.push({
        value: rawVal,
        label: label.charAt(0).toUpperCase() + label.slice(1),
        num: cleanNum,
      });
    }
    if (numberMatches.length >= 6) break;
  }

  // Build KPIs from real extracted numbers
  const kpis: KpiCard[] = [];
  if (numberMatches.length > 0) {
    numberMatches.slice(0, 4).forEach((m, idx) => {
      kpis.push({
        id: `kpi-text-${idx + 1}`,
        value: m.value,
        label: truncateAtWordBoundary(m.label, 35),
        deltaType: "neutral",
        description: "Extracted from source text",
      });
    });
  }

  // Build Chart from extracted numbers (Never invent mock charts if no numbers exist)
  const charts: ChartBlock[] = [];
  if (numberMatches.length >= 2) {
    charts.push({
      id: "chart-text-1",
      type: "bar",
      title: "Extracted Quantitative Metrics",
      unit: "",
      data: numberMatches.slice(0, 6).map((m) => ({
        label: truncateAtWordBoundary(m.label, 18),
        value: Math.min(m.num, 1000),
      })),
    });
  }

  // Extract Process Steps or Takeaways from bullet points
  const bullets = lines
    .filter((l) => /^[•\-*]\s+/.test(l) || /^\d+\.\s+/.test(l))
    .map((l) => l.replace(/^[•\-*\d.]+\s+/, "").trim())
    .filter((l) => l.length > 10);

  const blocks: ContentBlock[] = [];
  if (bullets.length >= 2) {
    blocks.push({
      id: "block-steps-1",
      type: "numbered_steps",
      title: "Core Actionable Takeaways",
      steps: bullets.slice(0, 4).map((b, idx) => {
        const parts = b.split(/[:–—]/);
        const stepTitle = parts[0] ? truncateAtWordBoundary(parts[0].trim(), 50) : `Key Step ${idx + 1}`;
        const stepDesc = parts[1] ? truncateAtWordBoundary(parts[1].trim(), 140) : truncateAtWordBoundary(b, 140);
        return {
          step: idx + 1,
          title: stepTitle,
          description: stepDesc,
        };
      }),
    });
  } else {
    blocks.push({
      id: "block-quote-1",
      type: "callout_quote",
      quote: truncateAtWordBoundary(
        lines.find((l) => l.length > 40 && l.length < 180) || "Data synthesized directly from source narrative.",
        180
      ),
      author: truncateAtWordBoundary(source, 60),
      role: "Key Finding",
    });
  }

  return {
    meta: {
      title: truncateAtWordBoundary(title, 80),
      subtitle: truncateAtWordBoundary(subtitle, 180),
      category: "Intelligence Report",
      sourceCitations: [truncateAtWordBoundary(source, 80)],
      date: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    },
    kpis,
    charts,
    blocks,
    templateId,
    format,
    watermark: true,
  };
}
