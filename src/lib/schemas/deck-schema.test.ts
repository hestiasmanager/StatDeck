import { DeckSchema } from "./deck-schema";
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
  console.log("[PASS] Invalid deck correctly rejected by DeckSchema.");

  console.log("All DeckSchema tests passed!");
}

if (process.argv[1]?.endsWith("deck-schema.test.ts")) {
  testDeckSchemaValidation();
}
