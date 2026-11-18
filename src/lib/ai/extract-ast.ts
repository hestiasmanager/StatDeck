import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { DeckSchema, type DeckAST, type OutputFormat } from "@/lib/schemas/deck-schema";
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
 * 2. Direct Gemini Flash API
 * 3. Direct OpenAI API
 * 4. Intelligent deterministic local heuristic parser ($0.00 cost)
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

  // 2. OpenRouter Execution (Preferred Unified Gateway)
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
        schema: DeckSchema,
        system: STATDECK_SYSTEM_PROMPT,
        prompt: promptText,
        maxTokens: 900,
        temperature: 0.2,
      });

      const validatedAst: DeckAST = {
        ...object,
        format,
        templateId,
      };

      await redis.set(cacheKey, validatedAst, { ex: 604800 });
      return { ast: validatedAst, cached: false, modelUsed: `openrouter/${selectedModel}` };
    } catch (openRouterErr) {
      console.warn("OpenRouter execution failed, trying direct providers if available:", openRouterErr);
    }
  }

  // 3. Direct Gemini Flash Execution
  if (geminiApiKey) {
    try {
      const google = createGoogleGenerativeAI({ apiKey: geminiApiKey });
      const { object } = await generateObject({
        model: google("gemini-2.5-flash-lite"),
        schema: DeckSchema,
        system: STATDECK_SYSTEM_PROMPT,
        prompt: promptText,
        maxTokens: 850,
        temperature: 0.2,
      });

      const validatedAst: DeckAST = {
        ...object,
        format,
        templateId,
      };

      await redis.set(cacheKey, validatedAst, { ex: 604800 });
      return { ast: validatedAst, cached: false, modelUsed: "gemini-flash-lite" };
    } catch (primaryErr) {
      console.warn("Direct Gemini Flash failed, trying OpenAI:", primaryErr);
    }
  }

  // 4. Direct OpenAI Execution
  if (openAiApiKey) {
    try {
      const openai = createOpenAI({ apiKey: openAiApiKey });
      const { object } = await generateObject({
        model: openai("gpt-4o-mini"),
        schema: DeckSchema,
        system: STATDECK_SYSTEM_PROMPT,
        prompt: promptText,
        maxTokens: 850,
        temperature: 0.2,
      });

      const validatedAst: DeckAST = {
        ...object,
        format,
        templateId,
      };

      await redis.set(cacheKey, validatedAst, { ex: 604800 });
      return { ast: validatedAst, cached: false, modelUsed: "gpt-4o-mini" };
    } catch (fallbackErr) {
      console.warn("Direct OpenAI failed:", fallbackErr);
    }
  }

  // 5. Intelligent Deterministic Heuristic Extraction ($0.00 zero-token fallback)
  console.log("No external LLM key active. Running intelligent heuristic extraction engine.");
  const heuristicAst = extractHeuristicDeckAST(rawContent, format, templateId);

  return {
    ast: heuristicAst,
    cached: false,
    modelUsed: "heuristic-extractor",
  };
}
