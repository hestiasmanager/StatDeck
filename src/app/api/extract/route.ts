import { NextRequest, NextResponse } from "next/server";
import { extractDeckAST } from "@/lib/ai/extract-ast";
import { checkRateLimit } from "@/lib/cache/rate-limit";
import { OutputFormatSchema } from "@/lib/schemas/deck-schema";
import { z } from "zod";

// Vercel serverless function max duration (seconds)
export const maxDuration = 30;

const RequestBodySchema = z.object({
  content: z.string().min(10).max(50000),
  format: OutputFormatSchema.default("carousel"),
  templateId: z.string().default("clean-bento"),
});

export async function POST(req: NextRequest) {
  // Set up 20-second abort controller so extraction never hangs indefinitely
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort(new Error("AI extraction timed out after 20 seconds"));
  }, 20000);

  try {
    // 1. IP / Client Rate Limiting (Sliding Window)
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const rateLimitCheck = await checkRateLimit(`rate:extract:${ip}`, 15, 600000);
    if (!rateLimitCheck.success) {
      clearTimeout(timeoutId);
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
      clearTimeout(timeoutId);
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

    // 3. Execute Structured LLM Extraction with 20s abort signal
    const result = await extractDeckAST(content, format, templateId, {
      clientOpenRouterKey,
      clientOpenRouterModel,
      clientGeminiKey,
      clientOpenAiKey,
      abortSignal: abortController.signal,
    });

    clearTimeout(timeoutId);

    return NextResponse.json({
      success: true,
      ast: result.ast,
      cached: result.cached,
      modelUsed: result.modelUsed,
    });
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("Extraction API error:", error);

    const isTimeout =
      abortController.signal.aborted ||
      (error instanceof Error &&
        (error.name === "AbortError" ||
          error.message.toLowerCase().includes("timed out") ||
          error.message.toLowerCase().includes("aborted")));

    if (isTimeout) {
      return NextResponse.json(
        {
          error: "AI extraction timed out after 20 seconds. Please try again or check your model/API key.",
        },
        { status: 504 }
      );
    }

    const message = error instanceof Error ? error.message : "Failed to extract structured deck";
    const status = message.includes("No AI API key found") ? 400 : 500;
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
