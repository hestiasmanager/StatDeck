import { NextRequest, NextResponse } from "next/server";
import { extractCleanArticleFromUrl } from "@/lib/parsers/url-readability";
import { checkRateLimit } from "@/lib/cache/rate-limit";
import { z } from "zod";

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

    return NextResponse.json({
      success: true,
      title: article.title,
      siteName: article.siteName,
      cleanedContent: aggregatedContent,
    });
  } catch (err) {
    console.error("URL extraction error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch and parse URL content" },
      { status: 500 }
    );
  }
}
