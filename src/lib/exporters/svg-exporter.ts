/**
 * 100% Client-side Clean Vector SVG Serializer.
 * Serializes SVG DOM elements into clean standalone .svg files.
 */
export function exportSvgToFile(svgElement: SVGSVGElement, filename: string = "statdeck-graphic.svg"): void {
  const serializer = new XMLSerializer();
  let source = serializer.serializeToString(svgElement);

  // Add xml namespace if missing
  if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
    source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  // Add xml declaration
  source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

  const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = filename;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}
