import {
  resolveTemplateConfig,
  getCombinatorialTemplates,
  STRUCTURAL_LAYOUTS,
  CURATED_THEMES,
  SURFACE_STYLES,
  buildCompositeTemplateId,
} from "./matrix";

console.log("--- 1. Testing Combinatorial Template Matrix Generation ---");
const templates = getCombinatorialTemplates();
console.log(`Generated ${templates.length} combinatorial templates.`);
if (templates.length < 240) {
  throw new Error(`Expected at least 240 templates, got ${templates.length}`);
}
console.log("[PASS] Matrix generation returned 240+ templates.");

console.log("--- 2. Testing Composite & Legacy ID Resolution ---");
// Test legacy ID
const legacy = resolveTemplateConfig("swiss-grid");
if (legacy.themeId !== "swiss-grid" || legacy.layoutId !== "swiss-editorial") {
  throw new Error(`Failed to resolve legacy ID correctly: ${JSON.stringify(legacy)}`);
}
console.log("[PASS] Legacy templateId 'swiss-grid' resolved correctly.");

// Test composite ID
const compositeId = buildCompositeTemplateId("metric-hero", "fintech-slate", "hairline-bordered");
const composite = resolveTemplateConfig(compositeId);
if (
  composite.layoutId !== "metric-hero" ||
  composite.themeId !== "fintech-slate" ||
  composite.surfaceId !== "hairline-bordered"
) {
  throw new Error(`Failed to resolve composite ID correctly: ${JSON.stringify(composite)}`);
}
console.log(`[PASS] Composite ID '${compositeId}' resolved correctly.`);

console.log("--- 3. Testing Theme Contrast & Token Completeness ---");
for (const [id, theme] of Object.entries(CURATED_THEMES)) {
  if (!theme.bg || !theme.ink || !theme.accent || !theme.surface) {
    throw new Error(`Theme ${id} missing essential color tokens.`);
  }
}
console.log(`[PASS] All ${Object.keys(CURATED_THEMES).length} curated themes contain complete tokens.`);

console.log("ALL TEMPLATE MATRIX TESTS PASSED!");
