import type { DeckAST } from "@/lib/schemas/deck-schema";
import { EDITORIAL_THEMES, DEFAULT_THEME_ID } from "@/lib/themes/registry";

/**
 * Generates a clean, standalone, self-contained single-file HTML presentation
 * that can be opened offline in any browser or shared directly.
 */
export function generateStandaloneHtml(ast: DeckAST): string {
  const theme = EDITORIAL_THEMES[ast.templateId] || EDITORIAL_THEMES[DEFAULT_THEME_ID];
  const title = ast.meta.title || "StatDeck Presentation";

  const kpisHtml = (ast.kpis || [])
    .map(
      (kpi) => `
    <div class="kpi-card">
      <div class="kpi-value">${kpi.value}</div>
      <div class="kpi-label">${kpi.label}</div>
      ${kpi.delta ? `<div class="kpi-delta ${kpi.deltaType || ''}">${kpi.delta}</div>` : ""}
    </div>`
    )
    .join("");

  const chartsHtml = (ast.charts || [])
    .map((chart) => {
      const maxVal = Math.max(...chart.data.map((d) => d.value), 1);
      const barsHtml = chart.data
        .map(
          (d) => `
        <div class="bar-row">
          <div class="bar-label">${d.label}</div>
          <div class="bar-track">
            <div class="bar-fill" style="width: ${Math.max(4, Math.round((d.value / maxVal) * 100))}%;"></div>
          </div>
          <div class="bar-val">${d.value.toLocaleString()}</div>
        </div>`
        )
        .join("");

      return `
      <div class="content-card">
        <h3>${chart.title || "Chart"}</h3>
        <div class="chart-container">
          ${barsHtml}
        </div>
      </div>`;
    })
    .join("");

  const blocksHtml = (ast.blocks || [])
    .map((b) => {
      if (b.type === "key_takeaways" && b.bullets) {
        const bulletsHtml = (b.bullets || [])
          .map(
            (bullet) => `
          <div class="takeaway-card">
            <div class="takeaway-icon">✓</div>
            <div>
              <strong>${bullet.headline}</strong>
              <p>${bullet.detail}</p>
            </div>
          </div>`
          )
          .join("");
        return `
        <div class="content-card">
          <h3>${b.title || "Key Takeaways"}</h3>
          ${bulletsHtml}
        </div>`;
      }

      if (b.type === "comparison_table" && b.headers && b.rows) {
        const headersHtml = b.headers.map((h) => `<th>${h}</th>`).join("");
        const rowsHtml = b.rows
          .map(
            (r) =>
              `<tr>${(r.cells || []).map((c) => `<td>${c || "—"}</td>`).join("")}</tr>`
          )
          .join("");
        return `
        <div class="content-card">
          <h3>${b.title || "Data Comparison"}</h3>
          <div class="table-wrapper">
            <table>
              <thead><tr>${headersHtml}</tr></thead>
              <tbody>${rowsHtml}</tbody>
            </table>
          </div>
        </div>`;
      }

      return "";
    })
    .filter(Boolean)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — StatDeck</title>
  <style>
    :root {
      --bg: ${theme.bg};
      --surface: ${theme.surface};
      --border: ${theme.surfaceBorder};
      --ink: ${theme.ink};
      --ink-muted: ${theme.inkMuted};
      --accent: ${theme.accent};
      --radius: ${theme.cardRadius || "14px"};
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--ink);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 20px;
    }
    .deck-container {
      width: 100%;
      max-width: 840px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .header-card, .content-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 28px 32px;
      box-shadow: 0 4px 20px -2px rgba(0,0,0,0.04);
    }
    .category-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--accent);
      background: ${theme.accent}15;
      padding: 4px 12px;
      border-radius: 999px;
      margin-bottom: 12px;
    }
    h1 {
      font-size: 28px;
      font-weight: 900;
      line-height: 1.2;
      margin-bottom: 8px;
    }
    h3 {
      font-size: 18px;
      font-weight: 800;
      margin-bottom: 16px;
    }
    .subtitle {
      font-size: 15px;
      color: var(--ink-muted);
      line-height: 1.5;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
    }
    .kpi-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 110px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.02);
    }
    .kpi-value {
      font-size: 26px;
      font-weight: 800;
      font-family: monospace;
      color: var(--accent);
    }
    .kpi-label {
      font-size: 12px;
      font-weight: 600;
      margin-top: 8px;
    }
    .kpi-delta {
      font-size: 11px;
      font-weight: 700;
      font-family: monospace;
      margin-top: 4px;
      color: #10B981;
    }
    .chart-container {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 8px;
    }
    .bar-row {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 13px;
    }
    .bar-label {
      width: 140px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .bar-track {
      flex: 1;
      height: 18px;
      background: ${theme.surfaceBorder};
      border-radius: 6px;
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      background: var(--accent);
      border-radius: 6px;
      transition: width 0.3s ease;
    }
    .bar-val {
      width: 70px;
      text-align: right;
      font-family: monospace;
      font-weight: 700;
    }
    .takeaway-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 12px 16px;
      display: flex;
      gap: 12px;
      align-items: flex-start;
      margin-bottom: 8px;
    }
    .takeaway-icon {
      width: 20px;
      height: 20px;
      background: ${theme.accent}20;
      color: var(--accent);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: bold;
      flex-shrink: 0;
    }
    .table-wrapper {
      overflow-x: auto;
      margin-top: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th, td {
      padding: 10px 14px;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }
    th {
      font-weight: 700;
      color: var(--ink-muted);
      background: ${theme.surfaceBorder}40;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: var(--ink-muted);
      margin-top: 16px;
    }
  </style>
</head>
<body>
  <div class="deck-container">
    <div class="header-card">
      ${ast.meta.category ? `<div class="category-badge">${ast.meta.category}</div>` : ""}
      <h1>${title}</h1>
      ${ast.meta.subtitle ? `<div class="subtitle">${ast.meta.subtitle}</div>` : ""}
    </div>

    ${ast.kpis && ast.kpis.length > 0 ? `<div class="kpi-grid">${kpisHtml}</div>` : ""}
    ${chartsHtml}
    ${blocksHtml}

    <div class="footer">
      Generated with <strong>StatDeck</strong> · Visual Analytics Studio
    </div>
  </div>
</body>
</html>`;
}

/**
 * Downloads standalone HTML file directly to user machine.
 */
export function exportStandaloneHtmlFile(ast: DeckAST): void {
  const html = generateStandaloneHtml(ast);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const filename =
    (ast.meta.title || "statdeck")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "statdeck-presentation";
  a.href = url;
  a.download = `${filename}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
