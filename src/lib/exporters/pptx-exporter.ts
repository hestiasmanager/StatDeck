import pptxgen from "pptxgenjs";
import type { DeckAST } from "@/lib/schemas/deck-schema";
import { EDITORIAL_THEMES, DEFAULT_THEME_ID } from "@/lib/themes/registry";
import { resolveRowCells } from "@/components/blocks/comparison-table";

/**
 * Strips '#' from hex colors for pptxgenjs compatibility.
 */
function toHex(color: string): string {
  return color.replace("#", "").toUpperCase();
}

/**
 * 100% Client-Side Native PowerPoint Generator.
 * Creates real editable text frames, shapes, and native PowerPoint charts.
 */
export async function exportDeckToPptx(ast: DeckAST, filename?: string): Promise<void> {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_16x9";
  pptx.author = "StatDeck";
  pptx.company = "StatDeck.ai";
  pptx.title = ast.meta.title;

  const theme = EDITORIAL_THEMES[ast.templateId] || EDITORIAL_THEMES[DEFAULT_THEME_ID];
  const bgHex = toHex(theme.bg);
  const surfaceHex = toHex(theme.surface);
  const inkHex = toHex(theme.ink);
  const inkMutedHex = toHex(theme.inkMuted);
  const accentHex = toHex(theme.accent);

  // ----------------------------------------------------
  // Slide 1: Cover Slide
  // ----------------------------------------------------
  const slide1 = pptx.addSlide();
  slide1.background = { color: bgHex };

  // Category Tag
  if (ast.meta.category) {
    slide1.addText(ast.meta.category.toUpperCase(), {
      x: 1.0,
      y: 1.5,
      w: 8.0,
      h: 0.4,
      fontSize: 12,
      bold: true,
      color: accentHex,
      fontFace: "Calibri",
    });
  }

  // Title
  slide1.addText(ast.meta.title, {
    x: 1.0,
    y: 2.2,
    w: 11.3,
    h: 1.8,
    fontSize: 36,
    bold: true,
    color: inkHex,
    fontFace: "Arial",
  });

  // Subtitle
  if (ast.meta.subtitle) {
    slide1.addText(ast.meta.subtitle, {
      x: 1.0,
      y: 4.0,
      w: 11.0,
      h: 0.9,
      fontSize: 16,
      color: inkMutedHex,
      fontFace: "Calibri",
    });
  }

  // Executive Summary & Highlights
  if (ast.executiveSummary) {
    slide1.addText(ast.executiveSummary, {
      x: 1.0,
      y: 4.9,
      w: 11.0,
      h: 0.7,
      fontSize: 13,
      color: inkHex,
      fontFace: "Calibri",
    });
  }

  if (ast.coverHighlights && ast.coverHighlights.length > 0) {
    const highlightsText = ast.coverHighlights.map((h) => `• ${h}`).join("   |   ");
    slide1.addText(highlightsText, {
      x: 1.0,
      y: 5.6,
      w: 11.0,
      h: 0.4,
      fontSize: 11,
      bold: true,
      color: accentHex,
    });
  }

  // Citations / Date
  const dateStr = ast.meta.date ? `${ast.meta.date} • ` : "";
  const citationStr = `${dateStr}Source: ${ast.meta.sourceCitations.join(", ") || "StatDeck"}`;
  slide1.addText(citationStr, {
    x: 1.0,
    y: 6.2,
    w: 11.0,
    h: 0.4,
    fontSize: 11,
    color: inkMutedHex,
  });

  // Watermark for free tier
  if (ast.watermark) {
    slide1.addText("Made with StatDeck", {
      x: 9.0,
      y: 6.8,
      w: 4.0,
      h: 0.3,
      fontSize: 9,
      color: inkMutedHex,
      align: "right",
    });
  }

  // ----------------------------------------------------
  // Slide 2: KPIs & Executive Summary (Optional: skipped if no KPIs)
  // ----------------------------------------------------
  if (ast.kpis && ast.kpis.length > 0) {
    const slide2 = pptx.addSlide();
    slide2.background = { color: bgHex };

    slide2.addText("EXECUTIVE METRICS", {
      x: 1.0,
      y: 0.8,
      w: 11.3,
      h: 0.4,
      fontSize: 14,
      bold: true,
      color: accentHex,
    });

    slide2.addText(ast.meta.title, {
      x: 1.0,
      y: 1.3,
      w: 11.3,
      h: 0.6,
      fontSize: 22,
      bold: true,
      color: inkHex,
    });

    // Render KPI Cards (up to 4 cards)
    const cardCount = Math.min(ast.kpis.length, 4);
    const cardWidth = 2.6;
    const gap = 0.3;
    const startX = 1.0;

    ast.kpis.slice(0, 4).forEach((kpi, index) => {
      const xPos = startX + index * (cardWidth + gap);

      // Card background box
      slide2.addShape(pptx.ShapeType.roundRect, {
        x: xPos,
        y: 2.3,
        w: cardWidth,
        h: 3.2,
        fill: { color: surfaceHex },
        line: { color: toHex(theme.surfaceBorder), width: 1 },
        rectRadius: 0.1,
      });

      // KPI Value
      slide2.addText(kpi.value, {
        x: xPos + 0.2,
        y: 2.6,
        w: cardWidth - 0.4,
        h: 0.8,
        fontSize: 32,
        bold: true,
        color: accentHex,
        align: "center",
      });

      // KPI Label
      slide2.addText(kpi.label, {
        x: xPos + 0.2,
        y: 3.5,
        w: cardWidth - 0.4,
        h: 0.6,
        fontSize: 14,
        bold: true,
        color: inkHex,
        align: "center",
      });

      // KPI Delta
      if (kpi.delta) {
        slide2.addText(kpi.delta, {
          x: xPos + 0.2,
          y: 4.2,
          w: cardWidth - 0.4,
          h: 0.4,
          fontSize: 12,
          color: kpi.deltaType === "positive" ? "10B981" : "EF4444",
          align: "center",
        });
      }

      // Micro description
      if (kpi.description) {
        slide2.addText(kpi.description, {
          x: xPos + 0.2,
          y: 4.7,
          w: cardWidth - 0.4,
          h: 0.6,
          fontSize: 10,
          color: inkMutedHex,
          align: "center",
        });
      }
    });

    if (ast.kpiNarrative) {
      slide2.addText(ast.kpiNarrative, {
        x: 1.0,
        y: 5.8,
        w: 11.3,
        h: 0.6,
        fontSize: 12,
        color: inkHex,
        italic: true,
      });
    }
  }

  // ----------------------------------------------------
  // Dynamic Charts: Native PowerPoint Charts (0 to 6 charts)
  // ----------------------------------------------------
  ast.charts.forEach((chart, chartIdx) => {
    const chartSlide = pptx.addSlide();
    chartSlide.background = { color: bgHex };

    chartSlide.addText(
      ast.charts.length > 1 ? `DATA VISUALIZATION (${chartIdx + 1}/${ast.charts.length})` : "DATA VISUALIZATION",
      {
        x: 1.0,
        y: 0.8,
        w: 11.3,
        h: 0.4,
        fontSize: 13,
        bold: true,
        color: accentHex,
      }
    );

    chartSlide.addText(chart.title, {
      x: 1.0,
      y: 1.3,
      w: 11.3,
      h: 0.6,
      fontSize: 22,
      bold: true,
      color: inkHex,
    });

    // Prepare native chart data format
    const chartData = [
      {
        name: chart.unit || "Value",
        labels: chart.data.map((d) => d.label),
        values: chart.data.map((d) => d.value),
      },
    ];

    // Map chart type
    let pptxChartType = pptx.ChartType.bar;
    if (chart.type === "donut") pptxChartType = pptx.ChartType.doughnut;
    else if (chart.type === "line" || chart.type === "area") pptxChartType = pptx.ChartType.line;
    else if (chart.type === "horizontal_bar") pptxChartType = pptx.ChartType.bar;

    const chartColors = theme.chartColors.map((c) => toHex(c));

    chartSlide.addChart(pptxChartType, chartData, {
      x: 1.0,
      y: 2.1,
      w: 11.3,
      h: 4.1,
      showLegend: chart.type === "donut",
      chartColors,
      barDir: chart.type === "horizontal_bar" ? "bar" : "col",
      plotArea: { fill: { color: surfaceHex } },
    });

    const insightText = chart.chartInsight || ast.chartInsight;
    if (insightText) {
      chartSlide.addText(`What This Shows: ${insightText}`, {
        x: 1.0,
        y: 6.4,
        w: 11.3,
        h: 0.4,
        fontSize: 11,
        color: inkMutedHex,
        bold: true,
      });
    }
  });

  // ----------------------------------------------------
  // Dynamic Structured Takeaway Blocks (with pagination)
  // ----------------------------------------------------
  ast.blocks.forEach((block, bIdx) => {
    if (block.type === "numbered_steps") {
      const chunkSize = 4;
      const totalParts = Math.ceil(block.steps.length / chunkSize);
      for (let p = 0; p < totalParts; p++) {
        const chunkSteps = block.steps.slice(p * chunkSize, (p + 1) * chunkSize);
        const stepSlide = pptx.addSlide();
        stepSlide.background = { color: bgHex };

        stepSlide.addText(
          totalParts > 1 ? `EXECUTION FRAMEWORK (${p + 1}/${totalParts})` : "STRATEGIC BREAKDOWN",
          {
            x: 1.0,
            y: 0.8,
            w: 11.3,
            h: 0.4,
            fontSize: 13,
            bold: true,
            color: accentHex,
          }
        );

        stepSlide.addText(block.title || "Process Steps", {
          x: 1.0,
          y: 1.3,
          w: 11.3,
          h: 0.6,
          fontSize: 22,
          bold: true,
          color: inkHex,
        });

        chunkSteps.forEach((step, idx) => {
          const yPos = 2.2 + idx * 1.3;
          stepSlide.addShape(pptx.ShapeType.ellipse, {
            x: 1.0,
            y: yPos,
            w: 0.5,
            h: 0.5,
            fill: { color: accentHex },
          });
          stepSlide.addText(String(step.step || p * chunkSize + idx + 1), {
            x: 1.0,
            y: yPos,
            w: 0.5,
            h: 0.5,
            fontSize: 14,
            bold: true,
            color: "FFFFFF",
            align: "center",
          });

          stepSlide.addText(step.title, {
            x: 1.8,
            y: yPos - 0.05,
            w: 10.0,
            h: 0.4,
            fontSize: 16,
            bold: true,
            color: inkHex,
          });

          stepSlide.addText(step.description, {
            x: 1.8,
            y: yPos + 0.35,
            w: 10.0,
            h: 0.6,
            fontSize: 13,
            color: inkMutedHex,
          });
        });
      }
    } else if (block.type === "comparison_table") {
      const chunkSize = 5;
      const totalParts = Math.ceil(block.rows.length / chunkSize);
      const displayHeaders = block.headers.flatMap((h) =>
        typeof h === "string" && h.includes(" | ") ? h.split(" | ").map((s) => s.trim()) : [h]
      );

      for (let p = 0; p < totalParts; p++) {
        const chunkRows = block.rows.slice(p * chunkSize, (p + 1) * chunkSize);
        const tableSlide = pptx.addSlide();
        tableSlide.background = { color: bgHex };

        tableSlide.addText(
          totalParts > 1 ? `COMPARISON MATRIX (${p + 1}/${totalParts})` : "COMPARISON MATRIX",
          {
            x: 1.0,
            y: 0.8,
            w: 11.3,
            h: 0.4,
            fontSize: 13,
            bold: true,
            color: accentHex,
          }
        );

        tableSlide.addText(block.title || "Comparative Analysis", {
          x: 1.0,
          y: 1.3,
          w: 11.3,
          h: 0.6,
          fontSize: 22,
          bold: true,
          color: inkHex,
        });

        const tableRows: pptxgen.TableRow[] = [];
        tableRows.push(
          displayHeaders.map((h, i) => ({
            text: h,
            options: {
              bold: true,
              fontSize: 12,
              color: i === displayHeaders.length - 1 ? accentHex : inkHex,
              fill: { color: surfaceHex },
            },
          }))
        );

        chunkRows.forEach((row) => {
          const cells = resolveRowCells(row, displayHeaders.length);
          const tableCells: pptxgen.TableCell[] = displayHeaders.map((_, cIdx) => {
            const raw = cells[cIdx];
            const text = raw && raw.trim() !== "" ? raw : "—";
            return {
              text,
              options: {
                bold: cIdx === 0 || cIdx === displayHeaders.length - 1,
                fontSize: 11,
                color: cIdx === displayHeaders.length - 1 ? accentHex : inkHex,
              },
            };
          });
          tableRows.push(tableCells);
        });

        tableSlide.addTable(tableRows, {
          x: 1.0,
          y: 2.1,
          w: 11.3,
          autoPage: false,
          border: { type: "solid", pt: 1, color: "CBD5E1" },
        });
      }
    } else {
      const blockSlide = pptx.addSlide();
      blockSlide.background = { color: bgHex };

      blockSlide.addText("STRATEGIC INSIGHTS", {
        x: 1.0,
        y: 0.8,
        w: 11.3,
        h: 0.4,
        fontSize: 13,
        bold: true,
        color: accentHex,
      });

      if ("title" in block && block.title) {
        blockSlide.addText(block.title, {
          x: 1.0,
          y: 1.3,
          w: 11.3,
          h: 0.6,
          fontSize: 22,
          bold: true,
          color: inkHex,
        });
      }

      if (block.type === "key_takeaways") {
        block.bullets.forEach((b, idx) => {
          const yPos = 2.2 + idx * 1.1;
          blockSlide.addText(`• ${b.headline}`, {
            x: 1.0,
            y: yPos,
            w: 11.0,
            h: 0.4,
            fontSize: 15,
            bold: true,
            color: accentHex,
          });
          blockSlide.addText(b.detail, {
            x: 1.4,
            y: yPos + 0.35,
            w: 10.6,
            h: 0.6,
            fontSize: 13,
            color: inkMutedHex,
          });
        });
      } else if (block.type === "callout_quote") {
        blockSlide.addText(`"${block.quote}"`, {
          x: 1.5,
          y: 2.5,
          w: 10.0,
          h: 1.8,
          fontSize: 22,
          italic: true,
          color: inkHex,
        });
        if (block.author) {
          blockSlide.addText(`— ${block.author}${block.role ? `, ${block.role}` : ""}`, {
            x: 1.5,
            y: 4.5,
            w: 10.0,
            h: 0.5,
            fontSize: 14,
            bold: true,
            color: accentHex,
          });
        }
      }
    }
  });

  const safeTitle = (ast.meta.title || "statdeck-presentation")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 45) || "statdeck-presentation";
  const exportName = filename || `${safeTitle}.pptx`;
  await pptx.writeFile({ fileName: exportName });
}
