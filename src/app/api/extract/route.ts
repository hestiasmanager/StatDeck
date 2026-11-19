import { NextRequest, NextResponse } from "next/server";
import { extractDeckAST } from "@/lib/ai/extract-ast";
import { checkRateLimit } from "@/lib/cache/rate-limit";
import { OutputFormatSchema } from "@/lib/schemas/deck-schema";
import { enrichNotesWithTableRollups } from "@/lib/parsers/notes-table-enricher";
import { z } from "zod";

// Vercel serverless function max duration (seconds)
export const maxDuration = 60;

const RequestBodySchema = z.object({
  content: z.string().min(10).max(50000),
  format: OutputFormatSchema.default("carousel"),
  templateId: z.string().default("clean-bento"),
  deepAnalysis: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  console.time("extract");
  const startTime = Date.now();

  // Set up 45-second abort controller so extraction never hangs indefinitely
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort(new Error("AI extraction timed out after 45 seconds"));
  }, 45000);

  try {
    // 1. IP / Client Rate Limiting (Sliding Window)
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const rateLimitCheck = await checkRateLimit(`rate:extract:${ip}`, 15, 600000);
    if (!rateLimitCheck.success) {
      clearTimeout(timeoutId);
      const elapsedMs = Date.now() - startTime;
      console.warn(`[API /api/extract] Rate limit exceeded for IP ${ip} after ${elapsedMs}ms`);
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please wait a few minutes or upgrade your plan.",
          reset: rateLimitCheck.reset,
          elapsedMs,
        },
        { status: 429 }
      );
    }

    // 2. Parse & Validate Body
    const json = await req.json();
    const parseResult = RequestBodySchema.safeParse(json);
    if (!parseResult.success) {
      clearTimeout(timeoutId);
      const elapsedMs = Date.now() - startTime;
      console.warn(`[API /api/extract] Invalid request payload after ${elapsedMs}ms:`, parseResult.error.flatten());
      return NextResponse.json(
        { error: "Invalid request payload", details: parseResult.error.flatten(), elapsedMs },
        { status: 400 }
      );
    }

    const { content, format, templateId, deepAnalysis } = parseResult.data;

    // Run computeTableRollups on pipe/CSV content if not already pre-computed
    const finalContent = content.includes("PRE-COMPUTED JAVASCRIPT ROLLUPS")
      ? content
      : enrichNotesWithTableRollups(content).enrichedText;

    const clientOpenRouterKey = req.headers.get("x-openrouter-key") || undefined;
    const clientOpenRouterModel = req.headers.get("x-openrouter-model") || undefined;
    const clientGeminiKey = req.headers.get("x-gemini-key") || undefined;
    const clientOpenAiKey = req.headers.get("x-openai-key") || undefined;

    // 3. Execute Structured LLM Extraction (defaults to gemini-3.5-flash-lite)
    const result = await extractDeckAST(finalContent, format, templateId, {
      clientOpenRouterKey,
      clientOpenRouterModel,
      clientGeminiKey,
      clientOpenAiKey,
      deepAnalysis,
      abortSignal: abortController.signal,
    });

    clearTimeout(timeoutId);
    console.timeEnd("extract");
    const elapsedMs = Date.now() - startTime;
    console.log(
      `[API /api/extract] Succeeded in ${elapsedMs}ms | model: ${result.modelUsed} | cached: ${result.cached} | deep: ${deepAnalysis}`
    );

    return NextResponse.json({
      success: true,
      ast: result.ast,
      cached: result.cached,
      modelUsed: result.modelUsed,
      elapsedMs,
    });
  } catch (error) {
    clearTimeout(timeoutId);
    console.timeEnd("extract");
    const elapsedMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorName = error instanceof Error ? error.name : "UnknownError";

    console.error(`[API /api/extract] FAILED after ${elapsedMs}ms:`, {
      name: errorName,
      message: errorMessage,
      aborted: abortController.signal.aborted,
      stack: errorStack,
    });

    const isTimeout =
      abortController.signal.aborted ||
      (error instanceof Error &&
        (error.name === "AbortError" ||
          error.message.toLowerCase().includes("timed out") ||
          error.message.toLowerCase().includes("aborted")));

    if (isTimeout) {
      return NextResponse.json(
        {
          error: `AI extraction timed out after ${elapsedMs}ms. Please try again or check your model/API key.`,
          statusCode: 504,
          elapsedMs,
        },
        { status: 504 }
      );
    }

    let status = 500;
    const rawStatus = (error as { status?: number; statusCode?: number })?.status ||
                      (error as { status?: number; statusCode?: number })?.statusCode;

    if (rawStatus && typeof rawStatus === "number" && rawStatus >= 400 && rawStatus <= 599) {
      status = rawStatus;
    } else if (
      errorMessage.includes("429") ||
      errorMessage.toLowerCase().includes("rate limit") ||
      errorMessage.toLowerCase().includes("quota") ||
      errorMessage.toLowerCase().includes("resource_exhausted")
    ) {
      status = 429;
    } else if (
      errorMessage.includes("401") ||
      errorMessage.includes("403") ||
      errorMessage.toLowerCase().includes("api key") ||
      errorMessage.toLowerCase().includes("unauthorized") ||
      errorMessage.toLowerCase().includes("forbidden")
    ) {
      status = 401;
    } else if (
      errorMessage.includes("400") ||
      errorMessage.toLowerCase().includes("bad request") ||
      errorMessage.toLowerCase().includes("schema") ||
      errorMessage.toLowerCase().includes("invalid")
    ) {
      status = 400;
    }

    return NextResponse.json(
      { error: errorMessage, statusCode: status, elapsedMs },
      { status }
    );
  }
}
