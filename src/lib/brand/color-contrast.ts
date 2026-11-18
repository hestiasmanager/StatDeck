/**
 * WCAG 2.1 Contrast & Relative Luminance Algorithm
 */

export interface ContrastResult {
  ratio: number;
  isAaCompliant: boolean;
  isAaaCompliant: boolean;
  adjustedHex: string;
}

/**
 * Converts a 3 or 6 char hex color into [r, g, b] (0-255).
 */
export function hexToRgb(hex: string): [number, number, number] {
  let cleanHex = hex.replace("#", "").trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(cleanHex, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Converts [r, g, b] (0-255) back to #RRGGBB.
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Calculates relative luminance according to WCAG 2.1 definition.
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [sR, sG, sB] = [r, g, b].map((val) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * sR + 0.7152 * sG + 0.0722 * sB;
}

/**
 * Calculates contrast ratio between two hex colors.
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  const lum1 = getRelativeLuminance(r1, g1, b1);
  const lum2 = getRelativeLuminance(r2, g2, b2);
  const brighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (brighter + 0.05) / (darker + 0.05);
}

/**
 * Evaluates contrast and dynamically shifts lightness/saturation
 * until the color meets WCAG AA (>= 4.5:1) against the target background.
 */
export function ensureWcagAaCompliance(
  foregroundHex: string,
  backgroundHex: string = "#FFFFFF"
): ContrastResult {
  const initialRatio = getContrastRatio(foregroundHex, backgroundHex);
  if (initialRatio >= 4.5) {
    return {
      ratio: Math.round(initialRatio * 100) / 100,
      isAaCompliant: true,
      isAaaCompliant: initialRatio >= 7.0,
      adjustedHex: foregroundHex,
    };
  }

  // Adjust lightness iteratively
  const [bgR, bgG, bgB] = hexToRgb(backgroundHex);
  const bgLuminance = getRelativeLuminance(bgR, bgG, bgB);
  const shouldDarken = bgLuminance > 0.5;

  let [r, g, b] = hexToRgb(foregroundHex);
  let adjustedRatio = initialRatio;
  let iterations = 0;

  while (adjustedRatio < 4.5 && iterations < 30) {
    iterations++;
    const factor = shouldDarken ? 0.92 : 1.08;
    r = Math.min(255, Math.max(0, r * factor));
    g = Math.min(255, Math.max(0, g * factor));
    b = Math.min(255, Math.max(0, b * factor));
    adjustedRatio = getContrastRatio(rgbToHex(r, g, b), backgroundHex);
  }

  const finalHex = rgbToHex(r, g, b);

  return {
    ratio: Math.round(adjustedRatio * 100) / 100,
    isAaCompliant: adjustedRatio >= 4.5,
    isAaaCompliant: adjustedRatio >= 7.0,
    adjustedHex: finalHex,
  };
}
