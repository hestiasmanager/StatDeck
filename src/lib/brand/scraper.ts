import { parseHTML } from "linkedom";
import { ensureWcagAaCompliance } from "./color-contrast";
import type { BrandKit } from "@/lib/schemas/brand-kit-schema";

/**
 * Scrapes a target website domain to discover high-res logos/favicons,
 * dominant CSS hex colors, and Google Font pairings.
 */
export async function scrapeBrandKitFromDomain(domainOrUrl: string): Promise<BrandKit> {
  let targetUrl = domainOrUrl.trim();
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    targetUrl = `https://${targetUrl}`;
  }

  const urlObj = new URL(targetUrl);
  const hostname = urlObj.hostname.replace(/^www\./, "");
  const brandName = hostname.split(".")[0].charAt(0).toUpperCase() + hostname.split(".")[0].slice(1);

  let rawHtml = "";
  try {
    const response = await fetch(urlObj.origin, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 (StatDeck Brand Scraper)",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (response.ok) {
      rawHtml = await response.text();
    }
  } catch (fetchErr) {
    console.warn("Brand scrape request timed out or was blocked, using fallback heuristics:", fetchErr);
  }

  const { document } = parseHTML(rawHtml || "<html><head></head><body></body></html>");

  // 1. Logo Discovery
  let logoUrl: string | undefined;

  // Check Apple Touch Icon or High-Res Icon
  const appleIcon = document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute("href");
  const svgIcon = document.querySelector('link[rel="icon"][type="image/svg+xml"]')?.getAttribute("href");
  const regularIcon = document.querySelector('link[rel="icon"]')?.getAttribute("href");
  const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute("content");

  const candidateIcon = svgIcon || appleIcon || regularIcon || ogImage;
  if (candidateIcon) {
    try {
      logoUrl = new URL(candidateIcon, urlObj.origin).toString();
    } catch {
      logoUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
    }
  } else {
    logoUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
  }

  // 2. Color Palette Discovery
  // Sample hex colors from inline styles, style blocks, and theme-color meta tags
  const themeColorMeta = document.querySelector('meta[name="theme-color"]')?.getAttribute("content");
  const hexRegex = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;
  const hexMatches = rawHtml.match(hexRegex) || [];

  // Count frequency of hex colors (excluding stark white #ffffff and pure black #000000)
  const colorFrequency: Record<string, number> = {};
  for (const hex of hexMatches) {
    const normalized = hex.toUpperCase();
    if (
      normalized !== "#FFF" &&
      normalized !== "#FFFFFF" &&
      normalized !== "#000" &&
      normalized !== "#000000" &&
      normalized.length === 7
    ) {
      colorFrequency[normalized] = (colorFrequency[normalized] || 0) + 1;
    }
  }

  const sortedColors = Object.entries(colorFrequency).sort((a, b) => b[1] - a[1]);
  const primaryCandidate = themeColorMeta || sortedColors[0]?.[0] || "#2563EB";
  const secondaryCandidate = sortedColors[1]?.[0] || "#0F172A";
  const accentCandidate = sortedColors[2]?.[0] || "#10B981";

  // Validate WCAG AA compliance against #FFFFFF background
  const contrastCheck = ensureWcagAaCompliance(primaryCandidate, "#FFFFFF");

  // 3. Font Discovery
  let displayFont = "Inter";
  let bodyFont = "Inter";

  const googleFontLink = document.querySelector('link[href*="fonts.googleapis.com/css"]')?.getAttribute("href");
  if (googleFontLink) {
    const familyMatch = googleFontLink.match(/family=([^&:]+)/);
    if (familyMatch?.[1]) {
      displayFont = decodeURIComponent(familyMatch[1].replace(/\+/g, " "));
      bodyFont = displayFont;
    }
  }

  return {
    name: brandName,
    domain: hostname,
    logoUrl,
    colors: {
      primary: contrastCheck.adjustedHex,
      secondary: secondaryCandidate,
      accent: accentCandidate,
      background: "#FFFFFF",
      surface: "#F8FAFC",
      text: "#0F172A",
    },
    fonts: {
      display: displayFont,
      body: bodyFont,
      googleFontUrl: googleFontLink || undefined,
    },
    wcagContrastRatio: contrastCheck.ratio,
    isWcagCompliant: contrastCheck.isAaCompliant,
    isDefault: false,
  };
}
