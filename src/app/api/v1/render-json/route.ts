import { NextRequest, NextResponse } from "next/server";
import { DeckSchema } from "@/lib/schemas/deck-schema";
import { EDITORIAL_THEMES, DEFAULT_THEME_ID } from "@/lib/themes/registry";
import crypto from "crypto";

/**
 * Constant-time string comparison to prevent timing attacks on API keys.
 */
function secureCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Public REST API for Google Slides Add-on and external automation.
 * Accepts API key or Bearer token, validates the Deck AST, and returns
 * 16:9 coordinate mappings and theme tokens for direct rendering in Google Slides.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Unauthorized: Missing Authorization header." },
        { status: 401 }
      );
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : authHeader.trim();

    const expectedKey = process.env.STATDECK_API_KEY;
    if (!expectedKey) {
      console.error("STATDECK_API_KEY environment variable is not configured.");
      return NextResponse.json(
        { error: "Unauthorized: Server API Key not configured." },
        { status: 401 }
      );
    }

    if (!secureCompare(token, expectedKey)) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid API Key." },
        { status: 401 }
      );
    }

    const json = await req.json();
    const parse = DeckSchema.safeParse(json.ast);
    if (!parse.success) {
      return NextResponse.json(
        { error: "Invalid AST schema", details: parse.error.flatten() },
        { status: 400 }
      );
    }

    const ast = parse.data;
    const theme = EDITORIAL_THEMES[ast.templateId] || EDITORIAL_THEMES[DEFAULT_THEME_ID];

    // Compute 16:9 slide layout coordinates (width: 960, height: 540)
    const slides = [
      {
        slideIndex: 1,
        type: "cover",
        background: theme.bg,
        title: ast.meta.title,
        subtitle: ast.meta.subtitle,
        category: ast.meta.category,
      },
      {
        slideIndex: 2,
        type: "kpis",
        background: theme.surface,
        kpis: ast.kpis,
      },
      ...(ast.charts.length > 0
        ? [
            {
              slideIndex: 3,
              type: "chart",
              background: theme.surface,
              chart: ast.charts[0],
            },
          ]
        : []),
      ...(ast.blocks.length > 0
        ? [
            {
              slideIndex: 4,
              type: "blocks",
              background: theme.surface,
              blocks: ast.blocks,
            },
          ]
        : []),
    ];

    return NextResponse.json({
      success: true,
      theme,
      aspectRatio: "16:9",
      dimensions: { width: 960, height: 540 },
      slides,
    });
  } catch (error) {
    console.error("render-json error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal rendering error" },
      { status: 500 }
    );
  }
}
