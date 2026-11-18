/**
 * 100% Client-Side High-DPI Canvas PNG Rasterizer.
 * Renders SVG or DOM element onto offscreen Canvas with 2x/3x DPR scale.
 */
export async function exportSvgToPng(
  svgElement: SVGSVGElement,
  filename: string = "statdeck-graphic.png",
  scale: number = 2
): Promise<void> {
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const blobUrl = URL.createObjectURL(svgBlob);

  const bbox = svgElement.getBoundingClientRect();
  const width = (bbox.width || 800) * scale;
  const height = (bbox.height || 1200) * scale;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Unable to obtain 2D canvas context.");
  }

  const img = new Image();

  return new Promise<void>((resolve, reject) => {
    img.onload = () => {
      try {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        const pngUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = filename;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(blobUrl);
        resolve();
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(blobUrl);
      reject(err);
    };
    img.src = blobUrl;
  });
}
