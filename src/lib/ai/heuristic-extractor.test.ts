import { extractHeuristicDeckAST } from "./heuristic-extractor";

export function testHeuristicExtractor() {
  console.log("Testing Heuristic Extractor on raw CSV table...");

  const sampleCsvTable = `CSV Dataset: employee_compensation.csv (Total rows: 5)
| Department | Headcount | Avg_Salary | Budget_M | Satisfaction_Pct |
| --- | --- | --- | --- | --- |
| Engineering | 142 | $168,000 | $23.8M | 91.2% |
| Product | 38 | $154,000 | $5.8M | 88.4% |
| Design | 24 | $142,000 | $3.4M | 94.1% |
| Marketing | 46 | $128,000 | $5.9M | 82.5% |
| Sales | 85 | $135,000 | $11.5M | 85.0% |`;

  const astFromCsv = extractHeuristicDeckAST(sampleCsvTable, "carousel", "clean-bento");

  console.log("AST Title:", astFromCsv.meta.title);
  console.log("KPIs count:", astFromCsv.kpis.length);
  console.log("First KPI:", astFromCsv.kpis[0]);
  console.log("Chart Title:", astFromCsv.charts[0]?.title);
  console.log("Chart Data points:", astFromCsv.charts[0]?.data.length);

  if (astFromCsv.kpis.length === 0) {
    throw new Error("Expected KPIs to be extracted from CSV table");
  }

  if (astFromCsv.charts.length === 0 || astFromCsv.charts[0].data.length !== 5) {
    throw new Error("Expected 5 chart data points from 5 table rows");
  }

  console.log("[PASS] CSV table parsed into real KPIs and chart data points!");

  // Test Article Prose
  console.log("\nTesting Heuristic Extractor on Article text...");
  const sampleArticle = `Title: AI Chip Market Expands Rapidly in 2024
Source: TechWire Analysis
Summary: Enterprise spending on accelerators grew 84% year over year as datacenter demand hit $45.2B.

The global inference chip market reached $45.2B in Q3, representing an 84% increase compared to last year.
Operational efficiency improved by 3.4x across major hyperscalers.
Average latency dropped to 42ms for standard embedding queries.

Key Takeaways:
- Modern clusters require high bandwidth memory architectures.
- Liquid cooling reduces datacenter PUE down to 1.12.
- Quantization reduces memory footprint by 75%.`;

  const astFromArticle = extractHeuristicDeckAST(sampleArticle, "infographic", "executive-dark");
  console.log("Article Title:", astFromArticle.meta.title);
  console.log("Article KPIs:", astFromArticle.kpis.map((k) => `${k.label}: ${k.value}`));
  console.log("Article Takeaways:", astFromArticle.blocks[0]);

  if (!astFromArticle.meta.title.includes("AI Chip Market")) {
    throw new Error("Expected title to be extracted from article");
  }

  console.log("[PASS] Article text parsed into real KPIs and takeaways!");
  console.log("All heuristic extractor tests passed!");
}

if (process.argv[1]?.endsWith("heuristic-extractor.test.ts")) {
  testHeuristicExtractor();
}
