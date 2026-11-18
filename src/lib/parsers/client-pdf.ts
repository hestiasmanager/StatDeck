/**
 * Client-side PDF text extraction using dynamic pdfjs-dist import
 * with an automatic binary string stream fallback.
 */
export async function parsePdfFileClientSide(
  file: File,
  maxPages: number = 10
): Promise<{ text: string; pageCount: number; title: string }> {
  const arrayBuffer = await file.arrayBuffer();

  try {
    const pdfjsLib = await import("pdfjs-dist");
    try {
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      }
    } catch {
      // ignore worker configuration errors
    }

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await Promise.race([
      loadingTask.promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("PDF worker timed out")), 4000)
      ),
    ]);

    const numPages = Math.min(pdf.numPages, maxPages);
    const pageTexts: string[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageStrings = textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");

      if (pageStrings.trim().length > 0) {
        pageTexts.push(`--- Page ${pageNum} ---\n${pageStrings.replace(/\s+/g, " ").trim()}`);
      }
    }

    const aggregatedText = pageTexts.join("\n\n").slice(0, 15000);
    if (aggregatedText.trim().length > 30) {
      return {
        text: aggregatedText,
        pageCount: pdf.numPages,
        title: file.name.replace(/\.[^/.]+$/, ""),
      };
    }
  } catch (pdfErr) {
    console.warn("pdfjs-dist parser encountered an issue, falling back to raw stream decoding:", pdfErr);
  }

  // Fallback: extract ASCII/UTF-8 streams from PDF buffer directly
  const uint8 = new Uint8Array(arrayBuffer);
  const textDecoder = new TextDecoder("utf-8", { fatal: false });
  const rawString = textDecoder.decode(uint8);
  const matches = rawString.match(/\(([^()]{3,})\)/g) || [];
  const extractedText = matches
    .map((m) => m.slice(1, -1).replace(/\\[rntbf]/g, " ").trim())
    .filter((s) => s.length > 3 && /[a-zA-Z0-9]/.test(s))
    .join(" ");

  return {
    text: extractedText.slice(0, 15000) || `PDF Document: ${file.name}`,
    pageCount: 1,
    title: file.name.replace(/\.[^/.]+$/, ""),
  };
}
