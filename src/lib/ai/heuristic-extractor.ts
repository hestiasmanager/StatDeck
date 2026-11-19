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
 * Deterministic tabular spreadsheet extractor.
 * Converts uploaded CSV or Excel markdown tables into a data-backed DeckAST
 * using verified mathematical rollups and real column headers.
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

  // Unstructured text without an AI key: throw clear error prompt instead of hallucinating placeholder rows
  throw new Error(
    "AI service unavailable. Please configure GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY in your environment."
  );
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
    throw new Error(
      "Unable to parse table rows. Please ensure GOOGLE_GENERATIVE_AI_API_KEY is configured in your environment."
    );
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

  // Construct Blocks (Comparison table preserving exact dataset headers)
  const blocks: ContentBlock[] = [];
  if (dataRows.length >= 2 && headerCells.length >= 2) {
    const headers: string[] =
      headerCells.length >= 3
        ? [
            headerCells[0]?.replace(/_/g, " ") || "Dimension",
            headerCells[1]?.replace(/_/g, " ") || "Metric A",
            headerCells[2]?.replace(/_/g, " ") || "Metric B",
          ]
        : [
            headerCells[0]?.replace(/_/g, " ") || "Dimension",
            headerCells[1]?.replace(/_/g, " ") || "Value",
          ];

    const rows = dataRows.slice(0, 5).map((r) => ({
      feature: truncateAtWordBoundary(r[categoryColumn] || "Entry", 35),
      colA: truncateAtWordBoundary(r[headerCells[1]] || "N/A", 35),
      colB: headerCells[2] ? truncateAtWordBoundary(r[headerCells[2]] || "N/A", 35) : "",
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
    executiveSummary: `Deterministic analysis synthesizing ${dataRows.length} records across ${headerCells.length} primary metrics.`,
    coverHighlights: [
      `Aggregated ${dataRows.length} dataset records`,
      `Extracted ${kpis.length} core quantitative KPIs`,
      `Built ${charts.length} visual distribution charts`,
    ],
    kpis,
    kpiNarrative: `Primary metrics derived directly from deterministic JavaScript rollups across ${dataRows.length} data rows.`,
    charts,
    chartInsight: charts[0]?.title ? `Visual distribution for ${charts[0].title}.` : "",
    blocks,
    templateId,
    format,
    watermark: true,
  };
}
