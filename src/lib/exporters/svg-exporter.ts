import { toSvg } from "html-to-image";

/**
 * 100% Client-side Clean Vector SVG Serializer.
 * Captures full DOM canvas elements and inline SVGs into clean standalone .svg files.
 */
export async function exportElementToSvg(
  element: HTMLElement | SVGSVGElement,
  filename: string = "statdeck-graphic.svg"
): Promise<void> {
  const target = (element instanceof SVGSVGElement ? element.parentElement || element : element) as HTMLElement;

  let dataUrl: string;
  try {
    dataUrl = await toSvg(target, {
      style: {
        transform: "none",
        transformOrigin: "top left",
        margin: "0",
      },
    });
  } catch (err) {
    console.warn("SVG capture retrying with skipFonts fallback:", err);
    dataUrl = await toSvg(target, {
      skipFonts: true,
      style: {
        transform: "none",
        transformOrigin: "top left",
        margin: "0",
      },
    });
  }

  const safeFilename = filename.toLowerCase().endsWith(".svg") ? filename : `${filename}.svg`;
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
export function exportSvgToFile(
  svgOrElement: HTMLElement | SVGSVGElement,
  filename: string = "statdeck-graphic.svg"
): void {
  exportElementToSvg(svgOrElement, filename).catch((err) => {
    console.error("SVG export failed:", err);
  });
}
