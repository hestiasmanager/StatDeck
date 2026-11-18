import pptxgen from "pptxgenjs";
import type { DeckAST } from "@/lib/schemas/deck-schema";
import { EDITORIAL_THEMES, DEFAULT_THEME_ID } from "@/lib/themes/registry";

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
      y: 4.2,
      w: 11.0,
      h: 1.2,
      fontSize: 18,
      color: inkMutedHex,
      fontFace: "Calibri",
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
    slide1.addText("Visualized with StatDeck • statdeck.ai", {
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
  // Slide 2: KPIs & Executive Summary
  // ----------------------------------------------------
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

  // ----------------------------------------------------
  // Slide 3: Native PowerPoint Chart (if chart exists)
  // ----------------------------------------------------
  if (ast.charts.length > 0) {
    const chart = ast.charts[0];
    const slide3 = pptx.addSlide();
    slide3.background = { color: bgHex };

    slide3.addText("DATA VISUALIZATION", {
      x: 1.0,
      y: 0.8,
      w: 11.3,
      h: 0.4,
      fontSize: 13,
      bold: true,
      color: accentHex,
    });

    slide3.addText(chart.title, {
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

    slide3.addChart(pptxChartType, chartData, {
      x: 1.0,
      y: 2.1,
      w: 11.3,
      h: 4.4,
      showLegend: chart.type === "donut",
      chartColors,
      barDir: chart.type === "horizontal_bar" ? "bar" : "col",
      plotArea: { fill: { color: surfaceHex } },
    });
  }

  // ----------------------------------------------------
  // Slide 4: Structured Takeaway Blocks (Steps or Comparison)
  // ----------------------------------------------------
  if (ast.blocks.length > 0) {
    const block = ast.blocks[0];
    const slide4 = pptx.addSlide();
    slide4.background = { color: bgHex };

    slide4.addText("STRATEGIC BREAKDOWN", {
      x: 1.0,
      y: 0.8,
      w: 11.3,
      h: 0.4,
      fontSize: 13,
      bold: true,
      color: accentHex,
    });

    if ("title" in block && block.title) {
      slide4.addText(block.title, {
        x: 1.0,
        y: 1.3,
        w: 11.3,
        h: 0.6,
        fontSize: 22,
        bold: true,
        color: inkHex,
      });
    }

    if (block.type === "numbered_steps") {
      block.steps.forEach((step, idx) => {
        const yPos = 2.2 + idx * 1.3;
        // Step number badge
        slide4.addShape(pptx.ShapeType.ellipse, {
          x: 1.0,
          y: yPos,
          w: 0.5,
          h: 0.5,
          fill: { color: accentHex },
        });
        slide4.addText(String(step.step), {
          x: 1.0,
          y: yPos,
          w: 0.5,
          h: 0.5,
          fontSize: 14,
          bold: true,
          color: "FFFFFF",
          align: "center",
        });

        slide4.addText(step.title, {
          x: 1.8,
          y: yPos - 0.05,
          w: 10.0,
          h: 0.4,
          fontSize: 16,
          bold: true,
          color: inkHex,
        });

        slide4.addText(step.description, {
          x: 1.8,
          y: yPos + 0.35,
          w: 10.0,
          h: 0.6,
          fontSize: 13,
          color: inkMutedHex,
        });
      });
    }
  }

  const exportName = filename || `${ast.meta.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pptx`;
  await pptx.writeFile({ fileName: exportName });
}
