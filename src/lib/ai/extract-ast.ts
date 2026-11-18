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
}

export interface ExtractASTResult {
  ast: DeckAST;
  cached: boolean;
  modelUsed: string;
}

/**
 * Single-call structured LLM extraction supporting:
 * 1. OpenRouter (Access any model: Gemini 2.5 Flash, GPT-4o-mini, Claude 3.5 Haiku, DeepSeek)
 * 2. Direct Gemini 2.5 Flash API (@ai-sdk/google)
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

  const openRouterKey = options?.clientOpenRouterKey || process.env.OPENROUTER_API_KEY;
  const geminiApiKey = options?.clientGeminiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const openAiApiKey = options?.clientOpenAiKey || process.env.OPENAI_API_KEY;

  let lastError: Error | null = null;

  // 2. OpenRouter Execution (Preferred Unified Gateway if provided)
  if (openRouterKey) {
    try {
      const openrouter = createOpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: openRouterKey,
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
        maxTokens: 900,
        temperature: 0.2,
      });

      const validatedAst = normalizeExtractionDeck(object, format, templateId);

      await redis.set(cacheKey, validatedAst, { ex: 604800 });
      return { ast: validatedAst, cached: false, modelUsed: `openrouter/${selectedModel}` };
    } catch (openRouterErr) {
      console.error("OpenRouter execution error:", openRouterErr);
      lastError = openRouterErr instanceof Error ? openRouterErr : new Error(String(openRouterErr));
    }
  }

  // 3. Direct Google Gemini Execution (Production gemini-2.5-flash)
  if (geminiApiKey) {
    try {
      const google = createGoogleGenerativeAI({ apiKey: geminiApiKey });
      const { object } = await generateObject({
        model: google("gemini-2.5-flash"),
        schema: ExtractionDeckSchema,
        system: STATDECK_SYSTEM_PROMPT,
        prompt: promptText,
        maxTokens: 900,
        temperature: 0.2,
      });

      const validatedAst = normalizeExtractionDeck(object, format, templateId);

      await redis.set(cacheKey, validatedAst, { ex: 604800 });
      return { ast: validatedAst, cached: false, modelUsed: "google/gemini-2.5-flash" };
    } catch (geminiErr) {
      console.error("Direct Google Gemini error:", geminiErr);
      lastError = geminiErr instanceof Error ? geminiErr : new Error(String(geminiErr));
    }
  }

  // 4. Direct OpenAI Execution (Production gpt-4o-mini)
  if (openAiApiKey) {
    try {
      const openai = createOpenAI({ apiKey: openAiApiKey });
      const { object } = await generateObject({
        model: openai("gpt-4o-mini"),
        schema: ExtractionDeckSchema,
        system: STATDECK_SYSTEM_PROMPT,
        prompt: promptText,
        maxTokens: 900,
        temperature: 0.2,
      });

      const validatedAst = normalizeExtractionDeck(object, format, templateId);

      await redis.set(cacheKey, validatedAst, { ex: 604800 });
      return { ast: validatedAst, cached: false, modelUsed: "openai/gpt-4o-mini" };
    } catch (openAiErr) {
      console.error("Direct OpenAI error:", openAiErr);
      lastError = openAiErr instanceof Error ? openAiErr : new Error(String(openAiErr));
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

  // For prose/URL/text content without an AI key, throw a clear error instead of silently returning fake mock data
  throw new Error(
    "No AI API key found. Please add your Google Gemini or OpenAI API key in the top-bar AI Settings modal (🔑) or configure GOOGLE_GENERATIVE_AI_API_KEY."
  );
}
