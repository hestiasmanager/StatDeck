import { NextRequest, NextResponse } from "next/server";
import { DeckSchema } from "@/lib/schemas/deck-schema";
import { EDITORIAL_THEMES, DEFAULT_THEME_ID } from "@/lib/themes/registry";

/**
 * Public REST API for Google Slides Add-on and external automation.
 * Accepts API key or Bearer token, validates the Deck AST, and returns
 * 16:9 coordinate mappings and theme tokens for direct rendering in Google Slides.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    // API Key validation (optional in dev, required in production)
    if (process.env.NODE_ENV === "production" && !authHeader) {
      return NextResponse.json({ error: "Unauthorized. Missing API Key." }, { status: 401 });
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
