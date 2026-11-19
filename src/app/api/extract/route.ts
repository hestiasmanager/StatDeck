import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/cache/rate-limit";
import {
  DeckSchema,
  normalizeExtractionDeck,
  OutputFormatSchema,
  type DeckAST,
} from "@/lib/schemas/deck-schema";
import { enrichNotesWithTableRollups } from "@/lib/parsers/notes-table-enricher";
import { STATDECK_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { redis } from "@/lib/cache/redis";
import { computeContentHash } from "@/lib/cache/content-hash";
import { extractHeuristicDeckAST } from "@/lib/ai/heuristic-extractor";
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

  // Set up 25-second abort controller for direct fetch
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort(new Error("AI extraction timed out after 25 seconds"));
  }, 25000);

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

    // 3. Check Redis Cache
    const hash = computeContentHash(finalContent, format);
    const cacheKey = `statdeck:cache:v1:${hash}`;
    try {
      const cachedData = await redis.get<DeckAST>(cacheKey);
      if (cachedData) {
        clearTimeout(timeoutId);
        console.timeEnd("extract");
        const elapsedMs = Date.now() - startTime;
        console.log(`[API /api/extract] Served from Redis cache in ${elapsedMs}ms`);
        return NextResponse.json({
          success: true,
          ast: cachedData,
          cached: true,
          modelUsed: "redis-cache",
          elapsedMs,
        });
      }
    } catch {
      // Ignore Redis failures
    }

    // 4. Resolve API Keys
    const clientGeminiKey = req.headers.get("x-gemini-key")?.trim() || undefined;
    const clientOpenRouterKey = req.headers.get("x-openrouter-key")?.trim() || undefined;
    const clientOpenRouterModel = req.headers.get("x-openrouter-model")?.trim() || undefined;
    const clientOpenAiKey = req.headers.get("x-openai-key")?.trim() || undefined;

    const geminiKey =
      (clientGeminiKey && clientGeminiKey.length > 15 ? clientGeminiKey : undefined) ||
      process.env.GEMINI_API_KEY?.trim() ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
      process.env.GOOGLE_API_KEY?.trim();

    const openRouterKey =
      (clientOpenRouterKey && clientOpenRouterKey.length > 15 ? clientOpenRouterKey : undefined) ||
      process.env.OPENROUTER_API_KEY?.trim();

    const openAiKey =
      (clientOpenAiKey && clientOpenAiKey.length > 15 ? clientOpenAiKey : undefined) ||
      process.env.OPENAI_API_KEY?.trim();

    // 5. Execute Direct Fetch to Google Gemini (Primary Default)
    if (geminiKey) {
      const selectedModel = deepAnalysis ? "gemini-4-hydrogen" : "gemini-3.5-flash-lite";
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${geminiKey}`;

      const promptText = `Target Output Format: ${format}
Template Style: ${templateId}

Transform the following raw text or dataset into a structured JSON deck AST:

${finalContent}`;

      const requestBody = {
        system_instruction: {
          parts: [{ text: STATDECK_SYSTEM_PROMPT }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: promptText }],
          },
        ],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
        },
      };

      const geminiRes = await fetch(geminiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);
      console.timeEnd("extract");
      const elapsedMs = Date.now() - startTime;

      // Immediately return exact Google API status code and error message if non-200
      if (!geminiRes.ok) {
        const errData = await geminiRes.json().catch(() => null);
        const googleMessage =
          errData?.error?.message ||
          errData?.message ||
          geminiRes.statusText ||
          `Google Gemini API responded with HTTP ${geminiRes.status}`;

        console.error(
          `[API /api/extract] Gemini API failed with status ${geminiRes.status} in ${elapsedMs}ms:`,
          googleMessage
        );

        return NextResponse.json(
          {
            error: googleMessage,
            statusCode: geminiRes.status,
            details: errData?.error?.details || errData,
            elapsedMs,
          },
          { status: geminiRes.status }
        );
      }

      // Parse JSON from candidates
      const data = await geminiRes.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        return NextResponse.json(
          {
            error: "Gemini response did not contain any text candidates",
            statusCode: 502,
            elapsedMs,
          },
          { status: 502 }
        );
      }

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(rawText);
      } catch (parseErr) {
        return NextResponse.json(
          {
            error: `Failed to parse JSON returned from Gemini: ${
              parseErr instanceof Error ? parseErr.message : String(parseErr)
            }`,
            statusCode: 422,
            raw: rawText.slice(0, 500),
            elapsedMs,
          },
          { status: 422 }
        );
      }

      // Normalize and validate strictly against DeckSchema
      const normalizedAst = normalizeExtractionDeck(parsedJson, format, templateId);
      const zodResult = DeckSchema.safeParse(normalizedAst);

      if (!zodResult.success) {
        const issueDetails = zodResult.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; ");
        console.error("[API /api/extract] DeckSchema validation failed:", issueDetails);
        return NextResponse.json(
          {
            error: `Extracted deck failed schema validation: ${issueDetails}`,
            statusCode: 422,
            details: zodResult.error.flatten(),
            issues: issueDetails,
            elapsedMs,
          },
          { status: 422 }
        );
      }

      const validatedAst = zodResult.data;
      await redis.set(cacheKey, validatedAst, { ex: 604800 }).catch(() => null);

      console.log(`[API /api/extract] Direct fetch succeeded in ${elapsedMs}ms | model: google/${selectedModel}`);

      return NextResponse.json({
        success: true,
        ast: validatedAst,
        cached: false,
        modelUsed: `google/${selectedModel}`,
        elapsedMs,
      });
    }

    // 6. Direct Fetch to OpenRouter (Secondary if OpenRouter key is provided)
    if (openRouterKey) {
      const selectedModel = clientOpenRouterModel || "google/gemini-2.5-flash";
      const openRouterUrl = "https://openrouter.ai/api/v1/chat/completions";

      const orRes = await fetch(openRouterUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://statdeck.ai",
          "X-Title": "StatDeck Visual Deck Synthesizer",
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: "system", content: STATDECK_SYSTEM_PROMPT },
            {
              role: "user",
              content: `Target Output Format: ${format}\nTemplate Style: ${templateId}\n\nRAW CONTENT TO SYNTHESIZE:\n${finalContent}`,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
        }),
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);
      console.timeEnd("extract");
      const elapsedMs = Date.now() - startTime;

      if (!orRes.ok) {
        const errData = await orRes.json().catch(() => null);
        const orMessage = errData?.error?.message || orRes.statusText || `OpenRouter responded with HTTP ${orRes.status}`;
        return NextResponse.json(
          { error: orMessage, statusCode: orRes.status, elapsedMs },
          { status: orRes.status }
        );
      }

      const data = await orRes.json();
      const rawText = data?.choices?.[0]?.message?.content;
      if (!rawText) {
        return NextResponse.json(
          { error: "OpenRouter response did not contain message content", statusCode: 502, elapsedMs },
          { status: 502 }
        );
      }

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(rawText);
      } catch (parseErr) {
        return NextResponse.json(
          { error: "Failed to parse JSON from OpenRouter", statusCode: 422, elapsedMs },
          { status: 422 }
        );
      }

      const normalizedAst = normalizeExtractionDeck(parsedJson, format, templateId);
      const zodResult = DeckSchema.safeParse(normalizedAst);
      if (!zodResult.success) {
        const issueDetails = zodResult.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; ");
        console.error("[API /api/extract] DeckSchema validation failed (OpenRouter):", issueDetails);
        return NextResponse.json(
          {
            error: `Extracted deck failed schema validation: ${issueDetails}`,
            statusCode: 422,
            details: zodResult.error.flatten(),
            issues: issueDetails,
            elapsedMs,
          },
          { status: 422 }
        );
      }

      await redis.set(cacheKey, zodResult.data, { ex: 604800 }).catch(() => null);
      return NextResponse.json({
        success: true,
        ast: zodResult.data,
        cached: false,
        modelUsed: `openrouter/${selectedModel}`,
        elapsedMs,
      });
    }

    // 7. Direct Fetch to OpenAI (Tertiary if OpenAI key is provided)
    if (openAiKey) {
      const openAiUrl = "https://api.openai.com/v1/chat/completions";
      const oaiRes = await fetch(openAiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: STATDECK_SYSTEM_PROMPT },
            {
              role: "user",
              content: `Target Output Format: ${format}\nTemplate Style: ${templateId}\n\nRAW CONTENT TO SYNTHESIZE:\n${finalContent}`,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
        }),
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);
      console.timeEnd("extract");
      const elapsedMs = Date.now() - startTime;

      if (!oaiRes.ok) {
        const errData = await oaiRes.json().catch(() => null);
        const oaiMessage = errData?.error?.message || oaiRes.statusText || `OpenAI responded with HTTP ${oaiRes.status}`;
        return NextResponse.json(
          { error: oaiMessage, statusCode: oaiRes.status, elapsedMs },
          { status: oaiRes.status }
        );
      }

      const data = await oaiRes.json();
      const rawText = data?.choices?.[0]?.message?.content;
      if (!rawText) {
        return NextResponse.json(
          { error: "OpenAI response did not contain message content", statusCode: 502, elapsedMs },
          { status: 502 }
        );
      }

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(rawText);
      } catch (parseErr) {
        return NextResponse.json(
          { error: "Failed to parse JSON from OpenAI", statusCode: 422, elapsedMs },
          { status: 422 }
        );
      }

      const normalizedAst = normalizeExtractionDeck(parsedJson, format, templateId);
      const zodResult = DeckSchema.safeParse(normalizedAst);
      if (!zodResult.success) {
        const issueDetails = zodResult.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; ");
        console.error("[API /api/extract] DeckSchema validation failed (OpenRouter):", issueDetails);
        return NextResponse.json(
          {
            error: `Extracted deck failed schema validation: ${issueDetails}`,
            statusCode: 422,
            details: zodResult.error.flatten(),
            issues: issueDetails,
            elapsedMs,
          },
          { status: 422 }
        );
      }

      await redis.set(cacheKey, zodResult.data, { ex: 604800 }).catch(() => null);
      return NextResponse.json({
        success: true,
        ast: zodResult.data,
        cached: false,
        modelUsed: "openai/gpt-4o-mini",
        elapsedMs,
      });
    }

    // 8. Fallback: Deterministic Tabular Spreadsheet Parser (No key needed for uploaded CSV/Excel tables)
    if (finalContent.includes("|") || finalContent.includes(",")) {
      try {
        const heuristicAst = extractHeuristicDeckAST(finalContent, format, templateId);
        clearTimeout(timeoutId);
        console.timeEnd("extract");
        const elapsedMs = Date.now() - startTime;
        return NextResponse.json({
          success: true,
          ast: heuristicAst,
          cached: false,
          modelUsed: "deterministic-tabular-parser",
          elapsedMs,
        });
      } catch {
        // Fall through to 401
      }
    }

    clearTimeout(timeoutId);
    console.timeEnd("extract");
    const elapsedMs = Date.now() - startTime;

    return NextResponse.json(
      {
        error:
          "No AI API key configured. Please set GEMINI_API_KEY in your environment variables or provide an API key.",
        statusCode: 401,
        elapsedMs,
      },
      { status: 401 }
    );
  } catch (error) {
    clearTimeout(timeoutId);
    console.timeEnd("extract");
    const elapsedMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(`[API /api/extract] Unhandled exception after ${elapsedMs}ms:`, errorMessage);

    const isTimeout =
      abortController.signal.aborted ||
      (error instanceof Error &&
        (error.name === "AbortError" ||
          error.message.toLowerCase().includes("timed out") ||
          error.message.toLowerCase().includes("aborted")));

    if (isTimeout) {
      return NextResponse.json(
        {
          error: `AI extraction timed out after ${elapsedMs}ms.`,
          statusCode: 504,
          elapsedMs,
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        error: errorMessage,
        statusCode: 500,
        elapsedMs,
      },
      { status: 500 }
    );
  }
}
