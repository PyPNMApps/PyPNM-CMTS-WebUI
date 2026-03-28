import type { SpectrumSelectionRange } from "@/lib/spectrumPower";

export function selectionToZoomDomain(selection: SpectrumSelectionRange | null): [number, number] | null {
  if (!selection) {
    return null;
  }
  const start = Math.min(selection.startX, selection.endX);
  const end = Math.max(selection.startX, selection.endX);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start === end) {
    return null;
  }
  return [start, end];
}

