import { downloadBlob, withExtension } from "@/lib/export/download";

function createSvgBlobUrl(svg: SVGSVGElement): string {
  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(svg);
  const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  return URL.createObjectURL(blob);
}

export async function downloadSvgAsPng(baseName: string, svg: SVGSVGElement): Promise<void> {
  const viewBox = svg.viewBox.baseVal;
  const width = Math.max(Math.ceil(viewBox.width || svg.clientWidth || 1100), 1);
  const height = Math.max(Math.ceil(viewBox.height || svg.clientHeight || 320), 1);
  const url = createSvgBlobUrl(svg);

  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Failed to load SVG for PNG export."));
      image.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas rendering is not available.");
    }

    context.fillStyle = "#101b2b";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((value) => {
        if (value) {
          resolve(value);
          return;
        }
        reject(new Error("Failed to create PNG export."));
      }, "image/png");
    });

    downloadBlob(withExtension(baseName, "png"), blob);
  } finally {
    URL.revokeObjectURL(url);
  }
}
