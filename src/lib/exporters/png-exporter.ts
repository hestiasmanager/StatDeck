import { toPng } from "html-to-image";

/**
 * 100% Client-Side High-DPI DOM/Canvas PNG Rasterizer.
 * Captures full rich DOM canvases, inline SVG charts, and typography into crisp 2x/3x Retina PNGs.
 */
export async function exportElementToPng(
  element: HTMLElement | SVGSVGElement,
  filename: string = "statdeck-graphic.png",
  pixelRatio: number = 2
): Promise<void> {
  const target = (element instanceof SVGSVGElement ? element.parentElement || element : element) as HTMLElement;

  let dataUrl: string;
  try {
    dataUrl = await toPng(target, {
      pixelRatio,
      cacheBust: true,
      style: {
        transform: "none",
        transformOrigin: "top left",
        margin: "0",
      },
    });
  } catch (err) {
    console.warn("PNG capture retrying with skipFonts fallback:", err);
    dataUrl = await toPng(target, {
      pixelRatio,
      skipFonts: true,
      style: {
        transform: "none",
        transformOrigin: "top left",
        margin: "0",
      },
    });
  }

  const safeFilename = filename.toLowerCase().endsWith(".png") ? filename : `${filename}.png`;
  const downloadLink = document.createElement("a");
  downloadLink.href = dataUrl;
  downloadLink.download = safeFilename;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

/**
 * Backward compatibility alias for legacy call sites.
 */
export async function exportSvgToPng(
  svgOrElement: HTMLElement | SVGSVGElement,
  filename: string = "statdeck-graphic.png",
  scale: number = 2
): Promise<void> {
  return exportElementToPng(svgOrElement, filename, scale);
}
