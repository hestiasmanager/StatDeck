import JSZip from "jszip";
import { toBlob } from "html-to-image";

/**
 * Sequentially renders slide DOM nodes into high-DPI PNGs
 * and packages them into a cleanly numbered .zip archive (slide-01.png, slide-02.png, etc.).
 */
export async function exportSlidesToZip(
  slideElements: HTMLElement[],
  title: string = "statdeck-slides",
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  if (!slideElements || slideElements.length === 0) {
    throw new Error("No slides found to export as ZIP.");
  }

  const zip = new JSZip();
  const folderName =
    (title || "statdeck")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "statdeck-slides";

  const imgFolder = zip.folder(folderName) || zip;

  for (let i = 0; i < slideElements.length; i++) {
    onProgress?.(i + 1, slideElements.length);
    const slide = slideElements[i];

    let blob: Blob | null = null;
    try {
      blob = await toBlob(slide, {
        pixelRatio: 2,
        cacheBust: true,
      });
    } catch (err) {
      console.warn(`Slide ${i + 1} capture retrying with skipFonts:`, err);
      blob = await toBlob(slide, {
        pixelRatio: 2,
        skipFonts: true,
      });
    }

    if (blob) {
      const slideNumber = String(i + 1).padStart(2, "0");
      imgFolder.file(`slide-${slideNumber}.png`, blob);
    }
  }

  // Generate zip archive blob
  const zipBlob = await zip.generateAsync({ type: "blob" });
  const downloadUrl = URL.createObjectURL(zipBlob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = `${folderName}-png-slides.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
}
