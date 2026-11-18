import { jsPDF } from "jspdf";
import { toPng } from "html-to-image";

/**
 * 100% Client-side Multi-Page LinkedIn Carousel PDF Exporter.
 * Captures full slide DOM nodes into a swipeable 1080x1350 PDF document.
 */
export async function exportCarouselToPdf(
  slideElements: HTMLElement[],
  title: string = "StatDeck-Carousel"
): Promise<void> {
  if (!slideElements || slideElements.length === 0) {
    throw new Error("No carousel slides found to export.");
  }

  // Dimensions for LinkedIn 4:5 Carousel
  const width = 1080;
  const height = 1350;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "px",
    format: [width, height],
    compress: true,
  });

  for (let i = 0; i < slideElements.length; i++) {
    const slide = slideElements[i];

    let dataUrl: string;
    try {
      dataUrl = await toPng(slide, {
        pixelRatio: 2,
        cacheBust: true,
        style: {
          transform: "none",
          transformOrigin: "top left",
          margin: "0",
        },
      });
    } catch (err) {
      console.warn(`Slide ${i + 1} capture retrying with skipFonts fallback:`, err);
      dataUrl = await toPng(slide, {
        pixelRatio: 2,
        skipFonts: true,
        style: {
          transform: "none",
          transformOrigin: "top left",
          margin: "0",
        },
      });
    }

    if (i > 0) {
      pdf.addPage([width, height], "portrait");
    }

    pdf.addImage(dataUrl, "PNG", 0, 0, width, height, undefined, "FAST");
  }

  const safeTitle = (title || "statdeck")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 45) || "statdeck";
  pdf.save(`${safeTitle}-linkedin-carousel.pdf`);
}
