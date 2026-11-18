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
 * Server-side article extraction: strips nav, headers, ads, footer,
 * extracts core text and tables, and caps at ~12,000 characters to prevent token bloat.
 */
export async function extractCleanArticleFromUrl(url: string): Promise<CleanArticleResult> {
  // Validate URL
  const parsedUrl = new URL(url);
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("Invalid URL protocol. Only HTTP and HTTPS are supported.");
  }

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 (StatDeck Content Extractor)",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    signal: AbortSignal.timeout(12000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch page: HTTP ${response.status} ${response.statusText}`);
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
