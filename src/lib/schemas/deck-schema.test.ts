import { DeckSchema, normalizeExtractionDeck } from "./deck-schema";
import { SAMPLE_PRESETS } from "../ai/presets";

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

  console.log("All DeckSchema tests passed!");
}

if (process.argv[1]?.endsWith("deck-schema.test.ts")) {
  testDeckSchemaValidation();
}
