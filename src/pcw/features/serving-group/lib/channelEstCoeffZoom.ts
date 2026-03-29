import type { ChartSeries } from "@/pw/features/analysis/types";

export function buildZoomedYDomain(
  series: ChartSeries | undefined,
  xDomain: [number, number] | null,
): [number, number] | undefined {
  if (!series || !xDomain) {
    return undefined;
  }

  const [minX, maxX] = xDomain[0] <= xDomain[1] ? xDomain : [xDomain[1], xDomain[0]];
  const selectedYValues = series.points
    .filter((point) => point.x >= minX && point.x <= maxX)
    .map((point) => point.y)
    .filter((value) => Number.isFinite(value));

  if (!selectedYValues.length) {
    return undefined;
  }

  const selectedMin = Math.min(...selectedYValues);
  const selectedMax = Math.max(...selectedYValues);
  const selectedSpan = selectedMax - selectedMin;
  const padding = (selectedSpan || 1) * 0.15;
  return [selectedMin - padding, selectedMax + padding];
}
