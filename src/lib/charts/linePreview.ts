export interface LinePreviewPoint {
  x: number;
  y: number;
}

export interface LinePreviewBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export function computeLinePreviewBounds(
  points: LinePreviewPoint[],
  options?: {
    xPadRatio?: number;
    yPadRatio?: number;
    minXPad?: number;
    minYPad?: number;
  },
): LinePreviewBounds | null {
  if (points.length === 0) {
    return null;
  }

  const xValues = points.map((point) => point.x);
  const yValues = points.map((point) => point.y);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);

  const xPadRatio = options?.xPadRatio ?? 0.05;
  const yPadRatio = options?.yPadRatio ?? 0.1;
  const minXPad = options?.minXPad ?? 0.1;
  const minYPad = options?.minYPad ?? 0.25;

  const xPad = Math.max((maxX - minX) * xPadRatio, minXPad);
  const yPad = Math.max((maxY - minY) * yPadRatio, minYPad);

  return {
    minX: minX - xPad,
    maxX: maxX + xPad,
    minY: minY - yPad,
    maxY: maxY + yPad,
  };
}

export function buildLinePreviewPath(
  points: LinePreviewPoint[],
  bounds: LinePreviewBounds | null,
  width: number,
  height: number,
  pad: number,
): string {
  if (!bounds || points.length === 0) {
    return "";
  }

  const innerWidth = width - pad * 2;
  const innerHeight = height - pad * 2;

  return points
    .map((point, index) => {
      const x = pad + ((point.x - bounds.minX) / (bounds.maxX - bounds.minX || 1)) * innerWidth;
      const y = pad + innerHeight - ((point.y - bounds.minY) / (bounds.maxY - bounds.minY || 1)) * innerHeight;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}
