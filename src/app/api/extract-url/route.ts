import { NextRequest, NextResponse } from "next/server";
import { extractCleanArticleFromUrl, UrlFetchError } from "@/lib/parsers/url-readability";
import { checkRateLimit } from "@/lib/cache/rate-limit";
import { z } from "zod";

const BLOCKED_ERROR_MESSAGE =
  "This website blocks automated reading. Please copy and paste the article text into the Notes tab instead.";

const RequestSchema = z.object({
  url: z.string().url("A valid URL is required (e.g. https://example.com/article)"),
});

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const rateLimitCheck = await checkRateLimit(`rate:url:${ip}`, 20, 600000);
    if (!rateLimitCheck.success) {
      return NextResponse.json(
        { error: "Too many URL extraction requests. Please wait." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parse = RequestSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json(
        { error: parse.error.issues[0]?.message || "Invalid URL" },
        { status: 400 }
      );
    }

    const article = await extractCleanArticleFromUrl(parse.data.url);

    // Check if extracted text is under 600 characters and matches anti-bot/blocking patterns
    const rawText = (article.textContent || "").trim();
    const combinedText = `${article.title || ""} ${rawText}`.trim();
    const isUnder600Chars = rawText.length < 600 || combinedText.length < 600;

    const lowerText = `${article.title || ""} ${rawText}`.toLowerCase();
    const matchesBlockedKeyword =
      lowerText.includes("access denied") ||
      lowerText.includes("403 forbidden") ||
      lowerText.includes("just a moment...") ||
      lowerText.includes("just a moment") ||
      lowerText.includes("enable javascript and cookies");

    if (isUnder600Chars && matchesBlockedKeyword) {
      return NextResponse.json(
        { error: BLOCKED_ERROR_MESSAGE },
        { status: 422 }
      );
    }

    // Assemble text for LLM synthesis
    const sections: string[] = [];
    if (article.title) sections.push(`Title: ${article.title}`);
    if (article.siteName) sections.push(`Source: ${article.siteName}`);
    if (article.excerpt) sections.push(`Summary: ${article.excerpt}`);
    if (article.textContent) sections.push(`\nArticle Body:\n${article.textContent}`);
    if (article.tables.length > 0) {
      sections.push(`\nExtracted Data Tables:\n${article.tables.join("\n\n")}`);
    }

    const aggregatedContent = sections.join("\n\n");
    // Truncate to maximum 15,000 characters to prevent prompt bloat and LLM timeouts
    const cleanedContent =
      aggregatedContent.length > 15000
        ? aggregatedContent.slice(0, 15000).trim()
        : aggregatedContent;

    return NextResponse.json({
      success: true,
      title: article.title,
      siteName: article.siteName,
      cleanedContent,
    });
  } catch (err: unknown) {
    console.error("URL extraction error:", err);

    // If the fetched response (or Jina fallback) has HTTP status >= 400
    const isHttp4xxOr5xx =
      (err instanceof UrlFetchError && err.status >= 400) ||
      (typeof err === "object" &&
        err !== null &&
        "status" in err &&
        typeof (err as { status: unknown }).status === "number" &&
        (err as { status: number }).status >= 400) ||
      (err instanceof Error && /HTTP\s+([45]\d\d)/i.test(err.message));

    if (isHttp4xxOr5xx) {
      return NextResponse.json(
        { error: BLOCKED_ERROR_MESSAGE },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch and parse URL content" },
      { status: 500 }
    );
  }
}
