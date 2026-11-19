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

// Helper to call Google Gemini API with zero thinking for 3.8 and low thinking for hydrogen
async function callGeminiModel(
  model: string,
  apiKey: string,
  promptText: string,
  signal: AbortSignal
): Promise<Response> {
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const generationConfig: Record<string, any> = {
    temperature: 0,
    responseMimeType: "application/json",
  };
  if (model.includes("3.8") || model.includes("gemini-3.8")) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  } else if (model.includes("hydrogen") || model.includes("gemini-4")) {
    generationConfig.thinkingConfig = { thinkingLevel: "low" };
  }

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
    generationConfig,
  };

  return await fetch(geminiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
    signal,
  });
}

// Helper to call OpenAI API
async function callOpenAiModel(
  apiKey: string,
  promptText: string,
  signal: AbortSignal
): Promise<Response> {
  const openAiUrl = "https://api.openai.com/v1/chat/completions";
  return await fetch(openAiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: STATDECK_SYSTEM_PROMPT },
        { role: "user", content: promptText },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    }),
    signal,
  });
}

// Helper to call OpenRouter API
async function callOpenRouterModel(
  apiKey: string,
  model: string,
  promptText: string,
  signal: AbortSignal
): Promise<Response> {
  const openRouterUrl = "https://openrouter.ai/api/v1/chat/completions";
  return await fetch(openRouterUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://statdeck.ai",
      "X-Title": "StatDeck Visual Deck Synthesizer",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: STATDECK_SYSTEM_PROMPT },
        { role: "user", content: promptText },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    }),
    signal,
  });
}

// Helper to validate and normalize raw JSON into DeckAST
function validateExtractedAst(
  rawText: string,
  format: any,
  templateId: string,
  modelName: string
): { success: true; ast: DeckAST } | { success: false; error: string; statusCode: number; details?: any } {
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawText);
  } catch (parseErr) {
    return {
      success: false,
      error: `Failed to parse JSON returned from ${modelName}: ${
        parseErr instanceof Error ? parseErr.message : String(parseErr)
      }`,
      statusCode: 422,
      details: rawText.slice(0, 500),
    };
  }

  const normalizedAst = normalizeExtractionDeck(parsedJson, format, templateId);
  const zodResult = DeckSchema.safeParse(normalizedAst);

  if (!zodResult.success) {
    const issueDetails = zodResult.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    console.error(`[API /api/extract] DeckSchema validation failed for ${modelName}:`, issueDetails);
    return {
      success: false,
      error: `Extracted deck failed schema validation: ${issueDetails}`,
      statusCode: 422,
      details: zodResult.error.flatten(),
    };
  }

  return { success: true, ast: zodResult.data };
}

export async function POST(req: NextRequest) {
  console.time("extract");
  const startTime = Date.now();

  // Set up 45-second overall abort controller for direct fetch
  const overallAbortController = new AbortController();
  const overallTimeoutId = setTimeout(() => {
    overallAbortController.abort(new Error("AI extraction timed out after 45 seconds"));
  }, 45000);

  try {
    // 1. IP / Client Rate Limiting (Sliding Window)
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const rateLimitCheck = await checkRateLimit(`rate:extract:${ip}`, 15, 600000);
    if (!rateLimitCheck.success) {
      clearTimeout(overallTimeoutId);
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
      clearTimeout(overallTimeoutId);
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
        clearTimeout(overallTimeoutId);
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

    const promptText = `Target Output Format: ${format}
Template Style: ${templateId}

Transform the following raw text or dataset into a structured JSON deck AST:

${finalContent}`;

    let successfulAst: DeckAST | null = null;
    let successfulModel: string | null = null;
    let lastError: { error: string; statusCode: number; details?: any } | null = null;

    // 5. Execute Direct Fetch to Google Gemini with Automatic 503/429 Fallback and Per-Model 10s Timeout
    if (geminiKey) {
      const geminiCandidates = deepAnalysis
        ? ["gemini-4-hydrogen", "gemini-3.8-flash", "gemini-3.5-flash-lite"]
        : ["gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-4-hydrogen"];

      for (const model of geminiCandidates) {
        // Individual 10s timeout per model attempt so a single stalled model doesn't exhaust the full budget
        const modelController = new AbortController();
        const modelTimeoutId = setTimeout(() => {
          modelController.abort(new Error(`Model ${model} timed out after 10000ms`));
        }, 10000);

        const onOverallAbort = () => {
          modelController.abort(overallAbortController.signal.reason);
        };
        overallAbortController.signal.addEventListener("abort", onOverallAbort, { once: true });

        try {
          const geminiRes = await callGeminiModel(model, geminiKey, promptText, modelController.signal);

          if (geminiRes.ok) {
            const data = await geminiRes.json();
            const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!rawText) {
              console.warn(`[API /api/extract] Gemini model ${model} returned empty candidates. Trying fallback...`);
              lastError = {
                error: `Gemini ${model} returned empty text candidates`,
                statusCode: 502,
              };
              continue;
            }

            const validated = validateExtractedAst(rawText, format, templateId, `google/${model}`);
            if (!validated.success) {
              console.warn(`[API /api/extract] Gemini model ${model} schema mismatch. Trying fallback...`);
              lastError = {
                error: validated.error,
                statusCode: validated.statusCode,
                details: validated.details,
              };
              continue;
            }

            successfulAst = validated.ast;
            successfulModel = `google/${model}`;
            break;
          }

          // Handle Non-200 Google response
          const errData = await geminiRes.json().catch(() => null);
          const googleMessage =
            errData?.error?.message ||
            errData?.message ||
            geminiRes.statusText ||
            `Google Gemini API responded with HTTP ${geminiRes.status}`;

          lastError = {
            error: googleMessage,
            statusCode: geminiRes.status,
            details: errData?.error?.details || errData,
          };

          const isTransient =
            geminiRes.status === 503 ||
            geminiRes.status === 429 ||
            geminiRes.status === 500 ||
            geminiRes.status === 502 ||
            geminiRes.status === 504;

          if (isTransient) {
            console.warn(
              `[API /api/extract] Gemini model ${model} failed with HTTP ${geminiRes.status} (${googleMessage}). Immediately falling back in same request...`
            );
            continue;
          }

          // Non-transient error like 400 (bad key or malformed request) - stop attempting Gemini models
          console.error(`[API /api/extract] Gemini API failed with non-transient status ${geminiRes.status}:`, googleMessage);
          break;
        } catch (fetchErr) {
          if (overallAbortController.signal.aborted) throw fetchErr;

          const isModelTimeout =
            modelController.signal.aborted ||
            (fetchErr instanceof Error &&
              (fetchErr.name === "AbortError" || fetchErr.message.toLowerCase().includes("timed out")));

          if (isModelTimeout) {
            console.warn(
              `[API /api/extract] Gemini model ${model} timed out after 10000ms. Immediately falling back in same request...`
            );
            lastError = {
              error: `Gemini model ${model} timed out after 10s`,
              statusCode: 504,
            };
            continue;
          }

          console.warn(`[API /api/extract] Network error on model ${model}:`, fetchErr);
          lastError = {
            error: fetchErr instanceof Error ? fetchErr.message : String(fetchErr),
            statusCode: 502,
          };
          continue;
        } finally {
          clearTimeout(modelTimeoutId);
          overallAbortController.signal.removeEventListener("abort", onOverallAbort);
        }
      }
    }

    // 6. Direct Fetch to OpenAI (Fallback or tertiary provider with 10s timeout)
    if (!successfulAst && openAiKey) {
      const oaiController = new AbortController();
      const oaiTimeoutId = setTimeout(() => {
        oaiController.abort(new Error("OpenAI gpt-4o-mini timed out after 10000ms"));
      }, 10000);
      const onOverallAbort = () => oaiController.abort(overallAbortController.signal.reason);
      overallAbortController.signal.addEventListener("abort", onOverallAbort, { once: true });

      try {
        console.warn("[API /api/extract] Invoking OpenAI gpt-4o-mini provider...");
        const oaiRes = await callOpenAiModel(openAiKey, promptText, oaiController.signal);

        if (oaiRes.ok) {
          const data = await oaiRes.json();
          const rawText = data?.choices?.[0]?.message?.content;

          if (rawText) {
            const validated = validateExtractedAst(rawText, format, templateId, "openai/gpt-4o-mini");
            if (validated.success) {
              successfulAst = validated.ast;
              successfulModel = "openai/gpt-4o-mini";
            } else {
              lastError = {
                error: validated.error,
                statusCode: validated.statusCode,
                details: validated.details,
              };
            }
          } else {
            lastError = {
              error: "OpenAI response did not contain message content",
              statusCode: 502,
            };
          }
        } else {
          const errData = await oaiRes.json().catch(() => null);
          const oaiMessage = errData?.error?.message || oaiRes.statusText || `OpenAI responded with HTTP ${oaiRes.status}`;
          lastError = {
            error: oaiMessage,
            statusCode: oaiRes.status,
            details: errData?.error?.details || errData,
          };
        }
      } catch (oaiErr) {
        if (overallAbortController.signal.aborted) throw oaiErr;
        console.warn("[API /api/extract] OpenAI fetch error:", oaiErr);
      } finally {
        clearTimeout(oaiTimeoutId);
        overallAbortController.signal.removeEventListener("abort", onOverallAbort);
      }
    }

    // 7. Direct Fetch to OpenRouter (Fallback if OpenRouter key is provided with 10s timeout)
    if (!successfulAst && openRouterKey) {
      const selectedModel = clientOpenRouterModel || "google/gemini-2.5-flash";
      const orController = new AbortController();
      const orTimeoutId = setTimeout(() => {
        orController.abort(new Error(`OpenRouter ${selectedModel} timed out after 10000ms`));
      }, 10000);
      const onOverallAbort = () => orController.abort(overallAbortController.signal.reason);
      overallAbortController.signal.addEventListener("abort", onOverallAbort, { once: true });

      try {
        console.warn(`[API /api/extract] Invoking OpenRouter provider (${selectedModel})...`);
        const orRes = await callOpenRouterModel(openRouterKey, selectedModel, promptText, orController.signal);

        if (orRes.ok) {
          const data = await orRes.json();
          const rawText = data?.choices?.[0]?.message?.content;

          if (rawText) {
            const validated = validateExtractedAst(rawText, format, templateId, `openrouter/${selectedModel}`);
            if (validated.success) {
              successfulAst = validated.ast;
              successfulModel = `openrouter/${selectedModel}`;
            } else {
              lastError = {
                error: validated.error,
                statusCode: validated.statusCode,
                details: validated.details,
              };
            }
          } else {
            lastError = {
              error: "OpenRouter response did not contain message content",
              statusCode: 502,
            };
          }
        } else {
          const errData = await orRes.json().catch(() => null);
          const orMessage = errData?.error?.message || orRes.statusText || `OpenRouter responded with HTTP ${orRes.status}`;
          lastError = {
            error: orMessage,
            statusCode: orRes.status,
            details: errData?.error?.details || errData,
          };
        }
      } catch (orErr) {
        if (overallAbortController.signal.aborted) throw orErr;
        console.warn("[API /api/extract] OpenRouter fetch error:", orErr);
      } finally {
        clearTimeout(orTimeoutId);
        overallAbortController.signal.removeEventListener("abort", onOverallAbort);
      }
    }

    // If any provider succeeded, cache and return validated AST
    if (successfulAst && successfulModel) {
      clearTimeout(overallTimeoutId);
      console.timeEnd("extract");
      const elapsedMs = Date.now() - startTime;
      await redis.set(cacheKey, successfulAst, { ex: 604800 }).catch(() => null);
      console.log(`[API /api/extract] Extraction succeeded in ${elapsedMs}ms | model: ${successfulModel}`);

      return NextResponse.json({
        success: true,
        ast: successfulAst,
        cached: false,
        modelUsed: successfulModel,
        elapsedMs,
      });
    }

    // 8. Fallback: Deterministic Tabular Spreadsheet Parser (No key needed for uploaded CSV/Excel tables)
    if (finalContent.includes("|") || finalContent.includes(",") || finalContent.includes(";")) {
      try {
        const heuristicAst = extractHeuristicDeckAST(finalContent, format, templateId);
        clearTimeout(overallTimeoutId);
        console.timeEnd("extract");
        const elapsedMs = Date.now() - startTime;
        console.log(`[API /api/extract] Succeeded with deterministic parser in ${elapsedMs}ms`);
        return NextResponse.json({
          success: true,
          ast: heuristicAst,
          cached: false,
          modelUsed: "deterministic-tabular-parser",
          elapsedMs,
        });
      } catch {
        // Fall through to error
      }
    }

    clearTimeout(overallTimeoutId);
    console.timeEnd("extract");
    const elapsedMs = Date.now() - startTime;

    // Return the exact error and status code from the last provider attempted
    if (lastError) {
      console.error(`[API /api/extract] All providers failed after ${elapsedMs}ms:`, lastError.error);
      return NextResponse.json(
        {
          error: lastError.error,
          statusCode: lastError.statusCode,
          details: lastError.details,
          elapsedMs,
        },
        { status: lastError.statusCode }
      );
    }

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
    clearTimeout(overallTimeoutId);
    console.timeEnd("extract");
    const elapsedMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(`[API /api/extract] Unhandled exception after ${elapsedMs}ms:`, errorMessage);

    const isTimeout =
      overallAbortController.signal.aborted ||
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
