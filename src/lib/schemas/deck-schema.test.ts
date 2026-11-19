import { DeckSchema, normalizeExtractionDeck } from "./deck-schema";
import { SAMPLE_PRESETS } from "../ai/presets";
import { resolveRowCells } from "../../components/blocks/comparison-table";

// Simple assertion test runner for standalone validation
export function testDeckSchemaValidation() {
  console.log("Running DeckSchema validation tests...");

  for (const [key, preset] of Object.entries(SAMPLE_PRESETS)) {
    const parseResult = DeckSchema.safeParse(preset);
    if (!parseResult.success) {
      console.error(`Validation failed for preset: ${key}`, parseResult.error.format());
      throw new Error(`Preset ${key} is invalid according to DeckSchema`);
    }
    console.log(`[PASS] Preset '${key}' validated successfully.`);
  }

  // Test invalid schema catching
  const invalidDeck = {
    meta: { title: "No" }, // title too short (<3)
    kpis: [], // empty KPIs
    charts: [],
    blocks: [],
  };

  const failResult = DeckSchema.safeParse(invalidDeck);
  if (failResult.success) {
    throw new Error("Invalid deck unexpectedly passed validation!");
  }
  console.log("[PASS] Invalid deck correctly rejected by DeckSchema directly.");

  // Test resilient normalizer on messy LLM payload with nulls and out-of-bound arrays
  const messyLlmPayload = {
    meta: {
      title: "Messy Financial Analysis",
      subtitle: null, // should get safe default
      date: null, // should be stripped to undefined
      category: null,
      sourceCitations: ["Source 1", "Source 2", "Source 3", "Source 4", "Source 5", "Source 6"], // > 4 items
    },
    executiveSummary: null,
    kpis: [
      { value: "$10M", label: "Revenue", delta: null, description: null },
      { value: "45%", label: "Gross Margin", delta: "+5%", deltaType: "positive" },
      { value: "120", label: "Clients", delta: null },
      { value: "99%", label: "Uptime" },
      { value: "$2M", label: "Extra KPI 5" }, // 5th KPI, should be clamped to 4
      { value: "15", label: "Extra KPI 6" },
    ],
    charts: [
      {
        type: "pie", // non-standard -> should normalize to "donut"
        title: "Cost Breakdown",
        data: [
          { label: "Engineering", value: 45 },
          { label: "Sales", value: 30 },
          { label: "Marketing", value: 15 },
          { label: "Operations", value: 10 },
        ],
      },
    ],
    blocks: [
      {
        type: "key_takeaways",
        title: null,
        bullets: [
          { headline: "Bullet 1", detail: "Detail 1" },
          { headline: "Bullet 2", detail: "Detail 2" },
          { headline: "Bullet 3", detail: "Detail 3" },
          { headline: "Bullet 4", detail: "Detail 4" },
          { headline: "Bullet 5", detail: "Detail 5" },
          { headline: "Bullet 6", detail: "Detail 6" }, // > 5 bullets -> clamped to 5
        ],
      },
    ],
  };

  const normalized = normalizeExtractionDeck(messyLlmPayload);
  const normalizedParse = DeckSchema.safeParse(normalized);

  if (!normalizedParse.success) {
    const issues = normalizedParse.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`normalizeExtractionDeck failed to produce valid DeckAST: ${issues}`);
  }

  // Assertions on normalized fields
  if (normalized.kpis.length !== 4) {
    throw new Error(`Expected 4 clamped KPIs, got ${normalized.kpis.length}`);
  }
  if (normalized.charts[0].type !== "donut") {
    throw new Error(`Expected 'pie' to normalize to 'donut', got ${normalized.charts[0].type}`);
  }
  if (normalized.meta.sourceCitations.length !== 4) {
    throw new Error(`Expected 4 clamped source citations, got ${normalized.meta.sourceCitations.length}`);
  }
  if (typeof normalized.meta.subtitle !== "string" || normalized.meta.subtitle.length === 0) {
    throw new Error("Expected non-empty subtitle fallback");
  }
  if (normalized.meta.date !== undefined) {
    throw new Error("Expected null date to be stripped to undefined");
  }
  console.log("[PASS] normalizeExtractionDeck successfully resilient to nulls, enum mapping, and array clamping.");

  // Test comparison table pipe cell splitting
  const pipeComparisonPayload = {
    meta: { title: "Regional Revenue Matrix" },
    kpis: [{ value: "$141.6K", label: "Total Revenue" }],
    charts: [],
    blocks: [
      {
        type: "comparison_table",
        headers: ["Region", "Q1 | Q2 | Q3"], // piped header
        rows: [
          { feature: "North America", colA: "$42,500 | $48,100 | $51,000" },
          { feature: "Europe", colA: "$31,200 | $34,800 | $38,000" },
        ],
      },
    ],
  };

  const pipeNormalized = normalizeExtractionDeck(pipeComparisonPayload);
  const compBlock = pipeNormalized.blocks[0];
  if (compBlock.type !== "comparison_table") {
    throw new Error("Expected comparison_table block");
  }
  if (compBlock.headers.length !== 4) {
    throw new Error(`Expected 4 split headers, got ${compBlock.headers.length} (${compBlock.headers.join(", ")})`);
  }
  // Check row.cells flat array
  if (!Array.isArray(compBlock.rows[0].cells) || compBlock.rows[0].cells.length !== 4) {
    throw new Error(`Expected row.cells to be array of 4, got ${JSON.stringify(compBlock.rows[0].cells)}`);
  }
  if (
    compBlock.rows[0].cells[0] !== "North America" ||
    compBlock.rows[0].cells[1] !== "$42,500" ||
    compBlock.rows[0].cells[2] !== "$48,100" ||
    compBlock.rows[0].cells[3] !== "$51,000"
  ) {
    throw new Error(`Unexpected row.cells content: ${JSON.stringify(compBlock.rows[0].cells)}`);
  }

  const row1Cells = resolveRowCells(compBlock.rows[0], compBlock.headers.length);
  if (row1Cells.length !== 4) {
    throw new Error(`Expected 4 resolved row cells, got ${row1Cells.length}`);
  }
  if (row1Cells[0] !== "North America" || row1Cells[1] !== "$42,500" || row1Cells[2] !== "$48,100" || row1Cells[3] !== "$51,000") {
    throw new Error(`Unexpected resolved cell contents: ${JSON.stringify(row1Cells)}`);
  }
  console.log("[PASS] comparison_table flat cells array and 1-to-1 column mapping verified.");

  // Test explicit cells format:
  const explicitCellsPayload = {
    meta: { title: "Direct Matrix" },
    kpis: [{ value: "100%", label: "Target" }],
    charts: [],
    blocks: [
      {
        type: "comparison_table",
        headers: ["Region", "Product", "Q1 Rev"],
        rows: [
          { cells: ["West", "Enterprise Suite", "$90,900"] },
          { cells: ["East", "Pro Plan", "$54,500"] },
        ],
      },
    ],
  };
  const normExplicit = normalizeExtractionDeck(explicitCellsPayload);
  const explicitTable = normExplicit.blocks[0];
  if (explicitTable.type !== "comparison_table") throw new Error("Expected comparison_table");
  if (explicitTable.headers[0] !== "Region" || explicitTable.headers[1] !== "Product" || explicitTable.headers[2] !== "Q1 Rev") {
    throw new Error("Headers shifted or mutated unexpectedly");
  }
  if (
    explicitTable.rows[0].cells[0] !== "West" ||
    explicitTable.rows[0].cells[1] !== "Enterprise Suite" ||
    explicitTable.rows[0].cells[2] !== "$90,900"
  ) {
    throw new Error(`Column 1-to-1 mapping failed: ${JSON.stringify(explicitTable.rows[0].cells)}`);
  }
  console.log("[PASS] Explicit cells 1-to-1 mapping without column shift verified.");

  console.log("All DeckSchema tests passed!");
}

if (process.argv[1]?.endsWith("deck-schema.test.ts")) {
  testDeckSchemaValidation();
}
