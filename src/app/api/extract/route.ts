import { NextRequest, NextResponse } from "next/server";
import { extractDeckAST } from "@/lib/ai/extract-ast";
import { checkRateLimit } from "@/lib/cache/rate-limit";
import { OutputFormatSchema } from "@/lib/schemas/deck-schema";
import { z } from "zod";

const RequestBodySchema = z.object({
  content: z.string().min(10).max(50000),
  format: OutputFormatSchema.default("carousel"),
  templateId: z.string().default("clean-bento"),
});

export async function POST(req: NextRequest) {
  try {
    // 1. IP / Client Rate Limiting (Sliding Window)
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const rateLimitCheck = await checkRateLimit(`rate:extract:${ip}`, 15, 600000);
    if (!rateLimitCheck.success) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please wait a few minutes or upgrade your plan.",
          reset: rateLimitCheck.reset,
        },
        { status: 429 }
      );
    }

    // 2. Parse & Validate Body
    const json = await req.json();
    const parseResult = RequestBodySchema.safeParse(json);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { content, format, templateId } = parseResult.data;

    const clientOpenRouterKey = req.headers.get("x-openrouter-key") || undefined;
    const clientOpenRouterModel = req.headers.get("x-openrouter-model") || undefined;
    const clientGeminiKey = req.headers.get("x-gemini-key") || undefined;
    const clientOpenAiKey = req.headers.get("x-openai-key") || undefined;

    // 3. Execute Structured LLM Extraction (with Redis Cache + OpenRouter / Gemini / OpenAI + Heuristic Engine)
    const result = await extractDeckAST(content, format, templateId, {
      clientOpenRouterKey,
      clientOpenRouterModel,
      clientGeminiKey,
      clientOpenAiKey,
    });

    return NextResponse.json({
      success: true,
      ast: result.ast,
      cached: result.cached,
      modelUsed: result.modelUsed,
    });
  } catch (error) {
    console.error("Extraction API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to extract structured deck",
      },
      { status: 500 }
    );
  }
}
