import { jsPDF } from "jspdf";

/**
 * 100% Client-side Multi-Page LinkedIn Carousel PDF Exporter.
 * Converts slide DOM nodes or offscreen canvases into a swipeable 1080x1350 PDF document.
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

    // Create high-res canvas representation using standard browser canvas
    const canvas = document.createElement("canvas");
    const scale = 2; // High-DPI 2x scale
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      // Background fill
      const computedStyle = window.getComputedStyle(slide);
      ctx.fillStyle = computedStyle.backgroundColor || "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Serialize SVG within slide if present
      const svgElement = slide.querySelector("svg");
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();

        await new Promise<void>((resolve) => {
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);
            resolve();
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve();
          };
          img.src = url;
        });
      }
    }

    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    if (i > 0) {
      pdf.addPage([width, height], "portrait");
    }

    pdf.addImage(imgData, "JPEG", 0, 0, width, height, undefined, "FAST");
  }

  const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  pdf.save(`${safeTitle}-linkedin-carousel.pdf`);
}
