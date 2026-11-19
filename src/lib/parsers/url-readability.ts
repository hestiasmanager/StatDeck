import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";

export interface CleanArticleResult {
  title: string;
  byline?: string;
  excerpt?: string;
  textContent: string;
  tables: string[];
  siteName?: string;
}

/**
 * Fallback reader using r.jina.ai when Cloudflare, 403 Forbidden,
 * or 401 Unauthorized blocks direct server-side article fetching.
 */
async function fetchJinaFallback(url: string, parsedUrl: URL): Promise<CleanArticleResult> {
  const jinaUrl = `https://r.jina.ai/${encodeURIComponent(url)}`;
  const jinaRes = await fetch(jinaUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 (StatDeck Fallback Reader)",
      Accept: "text/plain,text/markdown,*/*",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!jinaRes.ok) {
    throw new Error(`Failed to fetch URL content (HTTP ${jinaRes.status} via fallback)`);
  }

  const markdownText = await jinaRes.text();
  if (!markdownText || markdownText.trim().length < 20) {
    throw new Error("Unable to extract readable content from URL.");
  }

  // Parse Title from Jina markdown output if present (e.g. "Title: ...")
  let title = parsedUrl.hostname;
  const titleMatch = markdownText.match(/^Title:\s*(.+)$/m);
  if (titleMatch?.[1]) {
    title = titleMatch[1].trim();
  }

  // Parse Source if present
  let siteName = parsedUrl.hostname;
  const sourceMatch = markdownText.match(/^URL Source:\s*(.+)$/m);
  if (sourceMatch?.[1]) {
    try {
      siteName = new URL(sourceMatch[1].trim()).hostname;
    } catch {
      siteName = parsedUrl.hostname;
    }
  }

  // Extract clean text content, capping at 12,000 characters
  const cleanBody = markdownText
    .replace(/^Title:.*$/m, "")
    .replace(/^URL Source:.*$/m, "")
    .replace(/^Published Time:.*$/m, "")
    .replace(/^Markdown Content:\s*/m, "")
    .trim();

  const cappedContent = cleanBody.slice(0, 12000);

  return {
    title,
    siteName,
    textContent: cappedContent,
    tables: [],
  };
}

/**
 * Server-side article extraction: strips nav, headers, ads, footer,
 * extracts core text and tables, and caps at ~12,000 characters to prevent token bloat.
 * Automatically falls back to r.jina.ai on HTTP 403/401/429 blocks.
 */
export async function extractCleanArticleFromUrl(url: string): Promise<CleanArticleResult> {
  const parsedUrl = new URL(url);
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("Invalid URL protocol. Only HTTP and HTTPS are supported.");
  }

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 (StatDeck Content Extractor)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
      },
      signal: AbortSignal.timeout(12000),
    });
  } catch (fetchErr) {
    console.warn("Direct fetch error, falling back to r.jina.ai:", fetchErr);
    return fetchJinaFallback(url, parsedUrl);
  }

  // If Cloudflare or anti-bot blocks with 401, 403, or 429, fall back to r.jina.ai
  if (response.status === 403 || response.status === 401 || response.status === 429) {
    console.warn(`Direct fetch returned HTTP ${response.status}. Automatically falling back to r.jina.ai...`);
    return fetchJinaFallback(url, parsedUrl);
  }

  if (!response.ok) {
    try {
      return await fetchJinaFallback(url, parsedUrl);
    } catch {
      throw new Error(`Failed to fetch page: HTTP ${response.status} ${response.statusText}`);
    }
  }

  const rawHtml = await response.text();
  const { document } = parseHTML(rawHtml);

  // Extract tabular tables first if present
  const extractedTables: string[] = [];
  const tableElements = document.querySelectorAll("table");
  tableElements.forEach((table, index) => {
    if (index < 4) {
      const text = table.textContent?.replace(/\s+/g, " ").trim();
      if (text && text.length > 20) {
        extractedTables.push(text.slice(0, 1500));
      }
    }
  });

  // Run Mozilla Readability
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reader = new Readability(document as any);
  const article = reader.parse();

  const title = article?.title || document.querySelector("title")?.textContent || parsedUrl.hostname;
  const siteName = article?.siteName || parsedUrl.hostname;
  const byline = article?.byline || undefined;
  const excerpt = article?.excerpt || undefined;

  let textContent = article?.textContent || "";
  // Strip excess whitespace and blank lines
  textContent = textContent
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

  // Truncate to maximum 12,000 characters (~2,500 words)
  const cappedContent = textContent.slice(0, 12000);

  return {
    title,
    byline,
    excerpt,
    textContent: cappedContent,
    tables: extractedTables,
    siteName,
  };
}
