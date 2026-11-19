import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { DeckSchema, ExtractionDeckSchema, normalizeExtractionDeck, type DeckAST, type OutputFormat } from "@/lib/schemas/deck-schema";
import { STATDECK_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { redis } from "@/lib/cache/redis";
import { computeContentHash } from "@/lib/cache/content-hash";
import { extractHeuristicDeckAST } from "@/lib/ai/heuristic-extractor";

export interface ExtractASTOptions {
  clientOpenRouterKey?: string;
  clientOpenRouterModel?: string;
  clientGeminiKey?: string;
  clientOpenAiKey?: string;
  deepAnalysis?: boolean;
  abortSignal?: AbortSignal;
}

export interface ExtractASTResult {
  ast: DeckAST;
  cached: boolean;
  modelUsed: string;
}

function isValidKey(key?: string): boolean {
  if (!key) return false;
  const k = key.trim();
  if (k.length < 15) return false;
  const lower = k.toLowerCase();
  if (lower.includes("redacted") || lower.includes("dummy") || lower.includes("test") || lower.includes("example")) {
    return false;
  }
  return true;
}

/**
 * Single-call structured LLM extraction supporting:
 * 1. Direct Gemini Flash API (@ai-sdk/google) as primary production default
 * 2. User-provided OpenRouter key (if explicit "sk-or-..." key is entered)
 * 3. Direct OpenAI API (gpt-4o-mini via @ai-sdk/openai)
 * 4. Deterministic tabular spreadsheet parser for uploaded CSV/Excel files.
 *
 * Never silently returns fake mock charts when LLM calls fail.
 */
export async function extractDeckAST(
  rawContent: string,
  format: OutputFormat = "carousel",
  templateId: string = "clean-bento",
  options?: ExtractASTOptions
): Promise<ExtractASTResult> {
  const hash = computeContentHash(rawContent, format);
  const cacheKey = `statdeck:cache:v1:${hash}`;

  // 1. Check Redis Cache
  const cachedData = await redis.get<DeckAST>(cacheKey);
  if (cachedData) {
    return {
      ast: cachedData,
      cached: true,
      modelUsed: "redis-cache",
    };
  }

  const promptText = `TARGET OUTPUT FORMAT: ${format}
TARGET TEMPLATE ID: ${templateId}

SOURCE DATA CONTENT:
${rawContent.slice(0, 10000)}`;

  // Determine client and server credentials
  const clientOpenRouterKey = isValidKey(options?.clientOpenRouterKey) ? options!.clientOpenRouterKey!.trim() : undefined;
  const clientGeminiKey = isValidKey(options?.clientGeminiKey) ? options!.clientGeminiKey!.trim() : undefined;
  const clientOpenAiKey = isValidKey(options?.clientOpenAiKey) ? options!.clientOpenAiKey!.trim() : undefined;

  const serverGeminiKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim();

  const serverOpenRouterKey = process.env.OPENROUTER_API_KEY?.trim();
  const serverOpenAiKey = process.env.OPENAI_API_KEY?.trim();

  const activeGeminiKey = clientGeminiKey || serverGeminiKey;
  const activeOpenRouterKey = clientOpenRouterKey || (clientGeminiKey ? undefined : serverOpenRouterKey);
  const activeOpenAiKey = clientOpenAiKey || serverOpenAiKey;

  let lastError: Error | null = null;

  // 2. OpenRouter Execution (Prioritized if user explicitly passed a valid "sk-or-..." client key)
  if (clientOpenRouterKey && clientOpenRouterKey.startsWith("sk-or-")) {
    try {
      const openrouter = createOpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: clientOpenRouterKey,
        headers: {
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "X-Title": "StatDeck Visual Data Architect",
        },
      });

      const selectedModel =
        options?.clientOpenRouterModel ||
        process.env.OPENROUTER_MODEL ||
        "google/gemini-2.5-flash";

      const { object } = await generateObject({
        model: openrouter(selectedModel),
        schema: ExtractionDeckSchema,
        system: STATDECK_SYSTEM_PROMPT,
        prompt: promptText,
        maxTokens: 3500,
        temperature: 0.2,
        maxRetries: 0,
        abortSignal: options?.abortSignal,
      });

      const validatedAst = normalizeExtractionDeck(object, format, templateId);

      await redis.set(cacheKey, validatedAst, { ex: 604800 });
      return { ast: validatedAst, cached: false, modelUsed: `openrouter/${selectedModel}` };
    } catch (openRouterErr) {
      console.warn("Client OpenRouter execution failed, attempting fallback:", openRouterErr);
      lastError = openRouterErr instanceof Error ? openRouterErr : new Error(String(openRouterErr));
    }
  }

  // 3. Direct Google Gemini Execution (Primary: gemini-3.5-flash-lite for instant ~1-2s response)
  if (activeGeminiKey) {
    const selectedModel = options?.deepAnalysis ? "gemini-4-hydrogen" : "gemini-3.5-flash-lite";
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${activeGeminiKey}`;

    try {
      const geminiRes = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: STATDECK_SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: promptText }] }],
          generationConfig: { temperature: 0, responseMimeType: "application/json" },
        }),
        signal: options?.abortSignal,
      });

      if (!geminiRes.ok) {
        const errData = await geminiRes.json().catch(() => null);
        const errMsg = errData?.error?.message || `Google Gemini responded with HTTP ${geminiRes.status}`;
        throw new Error(errMsg);
      }

      const data = await geminiRes.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error("Gemini returned no text candidates");

      const parsedJson = JSON.parse(rawText);
      const validatedAst = normalizeExtractionDeck(parsedJson, format, templateId);
      const zodCheck = DeckSchema.safeParse(validatedAst);
      if (!zodCheck.success) {
        const issueStr = zodCheck.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; ");
        throw new Error(`Schema validation error: ${issueStr}`);
      }

      await redis.set(cacheKey, zodCheck.data, { ex: 604800 }).catch(() => null);
      return { ast: zodCheck.data, cached: false, modelUsed: `google/${selectedModel}` };
    } catch (geminiErr) {
      console.warn("Direct Google Gemini fetch failed:", geminiErr);
      lastError = geminiErr instanceof Error ? geminiErr : new Error(String(geminiErr));
    }
  }

  // 4. Direct OpenAI Execution (gpt-4o-mini)
  if (activeOpenAiKey) {
    try {
      const openai = createOpenAI({ apiKey: activeOpenAiKey });
      const { object } = await generateObject({
        model: openai("gpt-4o-mini"),
        schema: ExtractionDeckSchema,
        system: STATDECK_SYSTEM_PROMPT,
        prompt: promptText,
        maxTokens: 3500,
        temperature: 0.2,
        maxRetries: 0,
        abortSignal: options?.abortSignal,
      });

      const validatedAst = normalizeExtractionDeck(object, format, templateId);

      await redis.set(cacheKey, validatedAst, { ex: 604800 });
      return { ast: validatedAst, cached: false, modelUsed: "openai/gpt-4o-mini" };
    } catch (openAiErr) {
      console.warn("Direct OpenAI error:", openAiErr);
      lastError = openAiErr instanceof Error ? openAiErr : new Error(String(openAiErr));
    }
  }

  // 5. Server OpenRouter Execution (Fallback if server configured)
  if (activeOpenRouterKey && !clientOpenRouterKey) {
    try {
      const openrouter = createOpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: activeOpenRouterKey,
        headers: {
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "X-Title": "StatDeck Visual Data Architect",
        },
      });

      const selectedModel = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";

      const { object } = await generateObject({
        model: openrouter(selectedModel),
        schema: ExtractionDeckSchema,
        system: STATDECK_SYSTEM_PROMPT,
        prompt: promptText,
        maxTokens: 3500,
        temperature: 0.2,
        maxRetries: 0,
        abortSignal: options?.abortSignal,
      });

      const validatedAst = normalizeExtractionDeck(object, format, templateId);
      await redis.set(cacheKey, validatedAst, { ex: 604800 });
      return { ast: validatedAst, cached: false, modelUsed: `openrouter/${selectedModel}` };
    } catch (serverOrErr) {
      console.warn("Server OpenRouter execution error:", serverOrErr);
      lastError = serverOrErr instanceof Error ? serverOrErr : new Error(String(serverOrErr));
    }
  }

  // If an AI provider was configured but failed, NEVER fake a chart with hardcoded mock data!
  if (lastError) {
    throw new Error(`AI extraction failed: ${lastError.message}`);
  }

  // If no AI key is configured:
  // Allow deterministic mathematical parsing for uploaded CSV/Excel tables (which compute real numbers from actual user rows)
  const isTable = rawContent.split("\n").some((l) => l.trim().startsWith("|") && l.trim().endsWith("|"));
  if (isTable) {
    const tableAst = extractHeuristicDeckAST(rawContent, format, templateId);
    return {
      ast: tableAst,
      cached: false,
      modelUsed: "client-table-parser",
    };
  }

  // For unstructured text/notes/URLs without an AI key: throw clear prompt error
  throw new Error(
    "AI service unavailable. Please configure GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY in your environment."
  );
}
