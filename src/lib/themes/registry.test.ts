import { getThemeTokens } from "./registry";

console.log("--- Testing getThemeTokens resolution ---");

const t1 = getThemeTokens("swiss-grid");
if (t1.id !== "swiss-grid") throw new Error(`Direct ID failed: ${t1.id}`);
console.log("[PASS] Direct theme ID 'swiss-grid' resolved.");

const t2 = getThemeTokens("bento-grid:cyber-neon:elevated-soft");
if (t2.id !== "cyber-neon") throw new Error(`Composite ID failed: ${t2.id}`);
console.log("[PASS] Composite ID 'bento-grid:cyber-neon:elevated-soft' resolved.");

const t3 = getThemeTokens("swiss-editorial:bloomberg-term:hairline-bordered");
if (t3.id !== "bloomberg-term") throw new Error(`Composite ID failed: ${t3.id}`);
if (t3.cardRadius !== "4px") throw new Error(`Hairline surface failed: ${t3.cardRadius}`);
console.log("[PASS] Composite ID with hairline-bordered surface resolved with 4px cardRadius.");

const t4 = getThemeTokens("metric-hero:fintech-slate:open-canvas");
if (t4.id !== "fintech-slate") throw new Error(`Composite ID failed: ${t4.id}`);
if (t4.cardRadius !== "0px") throw new Error(`Open canvas surface failed: ${t4.cardRadius}`);
console.log("[PASS] Composite ID with open-canvas surface resolved with 0px cardRadius.");

const t5 = getThemeTokens("bento-grid:executive-dark:glass-gradient");
if (t5.id !== "executive-dark") throw new Error(`Composite ID failed: ${t5.id}`);
if (t5.cardRadius !== "20px") throw new Error(`Glass gradient surface failed: ${t5.cardRadius}`);
console.log("[PASS] Composite ID with glass-gradient surface resolved with 20px cardRadius.");

const t6 = getThemeTokens(undefined);
if (t6.id !== "clean-bento") throw new Error(`Undefined fallback failed: ${t6.id}`);
console.log("[PASS] Undefined themeId falls back to clean-bento.");

console.log("ALL THEME REGISTRY TESTS PASSED!");
