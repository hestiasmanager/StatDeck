import {
  getContrastRatio,
  ensureWcagAaCompliance,
  hexToRgb,
  rgbToHex,
} from "./color-contrast";

export function testColorContrastAlgorithms() {
  console.log("Running Color Contrast & WCAG compliance tests...");

  // 1. Black on White should be 21:1
  const blackOnWhite = getContrastRatio("#000000", "#FFFFFF");
  if (Math.abs(blackOnWhite - 21) > 0.1) {
    throw new Error(`Expected black on white ratio ~21, got ${blackOnWhite}`);
  }
  console.log(`[PASS] Black on White contrast ratio: ${blackOnWhite.toFixed(2)}:1`);

  // 2. White on White should be 1:1
  const whiteOnWhite = getContrastRatio("#FFFFFF", "#FFFFFF");
  if (Math.abs(whiteOnWhite - 1) > 0.01) {
    throw new Error(`Expected white on white ratio 1, got ${whiteOnWhite}`);
  }
  console.log(`[PASS] White on White contrast ratio: ${whiteOnWhite.toFixed(2)}:1`);

  // 3. Low contrast yellow (#FFFF00) against white (#FFFFFF) should be adjusted
  const adjusted = ensureWcagAaCompliance("#FFE600", "#FFFFFF");
  if (!adjusted.isAaCompliant) {
    throw new Error(`Expected adjusted color to be AA compliant (>= 4.5), got ${adjusted.ratio}`);
  }
  console.log(`[PASS] #FFE600 adjusted to ${adjusted.adjustedHex} with ratio ${adjusted.ratio}:1`);

  // 4. Hex roundtrip
  const [r, g, b] = hexToRgb("#2563EB");
  const roundtrip = rgbToHex(r, g, b);
  if (roundtrip.toUpperCase() !== "#2563EB") {
    throw new Error(`Hex roundtrip failed. Expected #2563EB, got ${roundtrip}`);
  }
  console.log("[PASS] Hex/RGB roundtrip verified.");

  console.log("All color contrast tests passed!");
}

if (process.argv[1]?.endsWith("color-contrast.test.ts")) {
  testColorContrastAlgorithms();
}
