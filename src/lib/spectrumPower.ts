import type { ChartPoint, ChartSeries } from "@/features/analysis/types";

export interface SpectrumSelectionRange {
  startX: number;
  endX: number;
}

export interface SpectrumIntegratedPower {
  label: string;
  startMHz: number;
  endMHz: number;
  spanMHz: number;
  pointCount: number;
  totalPowerDbmv: number | null;
}

function toLinearPower(dbValue: number): number {
  return 10 ** (dbValue / 10);
}

function toDbPower(linearPower: number): number | null {
  if (!Number.isFinite(linearPower) || linearPower <= 0) {
    return null;
  }
  return 10 * Math.log10(linearPower);
}

function sortPoints(points: ChartPoint[]): ChartPoint[] {
  return [...points].sort((left, right) => left.x - right.x);
}

export function normalizeSpectrumSelection(range: SpectrumSelectionRange | null): SpectrumSelectionRange | null {
  if (!range) return null;
  const startX = Math.min(range.startX, range.endX);
  const endX = Math.max(range.startX, range.endX);
  if (!Number.isFinite(startX) || !Number.isFinite(endX) || startX === endX) {
    return null;
  }
  return { startX, endX };
}

export function integrateSpectrumSeriesPower(
  series: ChartSeries,
  selection: SpectrumSelectionRange | null,
  segmentPowerDbmv: number | null,
): SpectrumIntegratedPower | null {
  const normalized = normalizeSpectrumSelection(selection);
  if (!normalized) {
    return null;
  }

  const allPoints = sortPoints(series.points);
  const points = allPoints.filter(
    (point) => point.x >= normalized.startX && point.x <= normalized.endX,
  );

  if (!points.length) {
    return {
      label: series.label,
      startMHz: normalized.startX,
      endMHz: normalized.endX,
      spanMHz: normalized.endX - normalized.startX,
      pointCount: 0,
      totalPowerDbmv: null,
    };
  }

  const totalWeight = allPoints.reduce((sum, point) => sum + toLinearPower(point.y), 0);
  const selectedWeight = points.reduce((sum, point) => sum + toLinearPower(point.y), 0);
  const segmentLinearPower = typeof segmentPowerDbmv === "number" ? toLinearPower(segmentPowerDbmv) : null;
  const selectedLinearPower = segmentLinearPower && totalWeight > 0
    ? segmentLinearPower * (selectedWeight / totalWeight)
    : null;

  return {
    label: series.label,
    startMHz: normalized.startX,
    endMHz: normalized.endX,
    spanMHz: normalized.endX - normalized.startX,
    pointCount: points.length,
    totalPowerDbmv: selectedLinearPower !== null ? toDbPower(selectedLinearPower) : null,
  };
}

export function integrateVisibleSpectrumPower(
  series: ChartSeries[],
  selection: SpectrumSelectionRange | null,
  segmentPowerDbmv: number | Record<string, number | null> | null,
): SpectrumIntegratedPower[] {
  return series
    .map((entry) => integrateSpectrumSeriesPower(
      entry,
      selection,
      typeof segmentPowerDbmv === "number"
        ? segmentPowerDbmv
        : segmentPowerDbmv?.[entry.label] ?? null,
    ))
    .filter((entry): entry is SpectrumIntegratedPower => entry !== null);
}
