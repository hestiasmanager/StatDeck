import { parseHTML } from "linkedom";
import { ensureWcagAaCompliance } from "./color-contrast";
import type { BrandKit } from "@/lib/schemas/brand-kit-schema";

/**
 * Scrapes a target website domain to discover high-res logos/favicons,
 * dominant CSS hex colors, and Google Font pairings without runtime canvas crashes.
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

  // Sanitize out canvas and script tags to prevent DOM parser crashes (e.g. createCanvas is not a function)
  const sanitizedHtml = (rawHtml || "")
    .replace(/<canvas\b[^<]*(?:(?!<\/canvas>)<[^<]*)*<\/canvas>/gi, "")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // 1. Regex-safe metadata extraction (guaranteed zero runtime DOM engine crashes)
  const themeColorMatch = sanitizedHtml.match(/<meta[^>]*name=["'](?:theme-color|msapplication-TileColor)["'][^>]*content=["']([^"']+)["']/i);
  const themeColorMeta = themeColorMatch?.[1];

  const appleTouchMatch = sanitizedHtml.match(/<link[^>]*rel=["'](?:apple-touch-icon|apple-touch-icon-precomposed)["'][^>]*href=["']([^"']+)["']/i);
  const svgIconMatch = sanitizedHtml.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*type=["']image\/svg\+xml["'][^>]*href=["']([^"']+)["']/i);
  const iconMatch = sanitizedHtml.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i);
  const ogImageMatch = sanitizedHtml.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);

  // Optional DOM parsing with safe error guard
  let candidateIcon = svgIconMatch?.[1] || appleTouchMatch?.[1] || iconMatch?.[1] || ogImageMatch?.[1];
  let googleFontHref: string | undefined;

  try {
    const { document } = parseHTML(sanitizedHtml || "<html><head></head><body></body></html>");
    if (!candidateIcon) {
      const appleIcon = document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute("href");
      const svgIcon = document.querySelector('link[rel="icon"][type="image/svg+xml"]')?.getAttribute("href");
      const regularIcon = document.querySelector('link[rel="icon"]')?.getAttribute("href");
      const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute("content");
      candidateIcon = svgIcon || appleIcon || regularIcon || ogImage || undefined;
    }
    const fontNode = document.querySelector('link[href*="fonts.googleapis.com/css"]');
    if (fontNode) {
      googleFontHref = fontNode.getAttribute("href") || undefined;
    }
  } catch (domErr) {
    console.warn("DOM parsing skipped for brand kit, using regex extractions:", domErr);
  }

  // Resolve logo URL
  let logoUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
  if (candidateIcon) {
    try {
      logoUrl = new URL(candidateIcon, urlObj.origin).toString();
    } catch {
      logoUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
    }
  }

  // 2. Color Palette Discovery
  // Extract hex colors from inline CSS styles and markup
  const hexRegex = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;
  const hexMatches = sanitizedHtml.match(hexRegex) || [];

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

  // Validate WCAG AA compliance against light canvas background
  const contrastCheck = ensureWcagAaCompliance(primaryCandidate, "#FFFFFF");

  // 3. Font Discovery
  let displayFont = "Inter";
  let bodyFont = "Inter";

  if (!googleFontHref) {
    const fontMatch = sanitizedHtml.match(/href=["'](https?:\/\/fonts\.googleapis\.com\/css[^"']*)["']/i);
    if (fontMatch?.[1]) {
      googleFontHref = fontMatch[1];
    }
  }

  if (googleFontHref) {
    const familyMatch = googleFontHref.match(/family=([^&:]+)/);
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
      googleFontUrl: googleFontHref,
    },
    wcagContrastRatio: contrastCheck.ratio,
    isWcagCompliant: contrastCheck.isAaCompliant,
    isDefault: false,
  };
}
