import { summarize } from "@/lib/stats";
import { normalizeSpectrumSelection, type SpectrumSelectionRange } from "@/lib/spectrumPower";
import type { ChartSeries } from "@/pw/features/analysis/types";

export interface RxMerDistributionBin {
  startMer: number;
  endMer: number;
  count: number;
}

export interface RxMerSelectionInsights {
  pointCount: number;
  avgMerDb: number;
  minMerDb: number;
  maxMerDb: number;
  estimatedBitloadBitsPerSymbol: number;
  safeQamLabel: string;
  distributionBins: RxMerDistributionBin[];
}

export function collectSelectedRxMerValues(
  frequencyHz: number[] | undefined,
  magnitudeDb: number[] | undefined,
  selection: SpectrumSelectionRange | null,
): number[] {
  const normalized = normalizeSpectrumSelection(selection);
  if (!normalized) {
    return [];
  }

  const frequency = frequencyHz ?? [];
  const magnitude = magnitudeDb ?? [];
  const selectedValues: number[] = [];

  for (let index = 0; index < magnitude.length; index += 1) {
    const frequencyMhz = (frequency[index] ?? 0) / 1_000_000;
    if (frequencyMhz >= normalized.startX && frequencyMhz <= normalized.endX) {
      const value = magnitude[index];
      if (typeof value === "number" && Number.isFinite(value)) {
        selectedValues.push(value);
      }
    }
  }

  return selectedValues;
}

export function collectSelectedRxMerValuesFromSeries(
  series: ChartSeries[],
  selection: SpectrumSelectionRange | null,
): number[] {
  const normalized = normalizeSpectrumSelection(selection);
  if (!normalized) {
    return [];
  }

  const selectedValues: number[] = [];
  series.forEach((entry) => {
    entry.points.forEach((point) => {
      if (point.x >= normalized.startX && point.x <= normalized.endX && Number.isFinite(point.y)) {
        selectedValues.push(point.y);
      }
    });
  });

  return selectedValues;
}

const ERROR_FREE_QAM_THRESHOLDS: Array<{ qam: string; minMerDb: number }> = [
  { qam: "QAM-4096", minMerDb: 45 },
  { qam: "QAM-2048", minMerDb: 42 },
  { qam: "QAM-1024", minMerDb: 39 },
  { qam: "QAM-512", minMerDb: 36 },
  { qam: "QAM-256", minMerDb: 33 },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function estimateBitloadFromMerDb(merDb: number): number {
  if (!Number.isFinite(merDb)) {
    return 0;
  }
  const snrLinear = 10 ** (merDb / 10);
  const shannonBitsPerSymbol = Math.log2(1 + snrLinear);
  return clamp(shannonBitsPerSymbol, 0, 12);
}

export function inferErrorFreeQamFromMerDb(minMerDb: number): string {
  if (!Number.isFinite(minMerDb)) {
    return "None";
  }
  const match = ERROR_FREE_QAM_THRESHOLDS.find((entry) => minMerDb >= entry.minMerDb);
  return match?.qam ?? "Below QAM-256";
}

export function inferSupportedQamFromMerDb(avgMerDb: number): string {
  const bitload = estimateBitloadFromMerDb(avgMerDb);
  if (!Number.isFinite(bitload) || bitload < 2) {
    return "Below QAM-4";
  }
  const bits = Math.max(2, Math.floor(bitload));
  return `QAM-${2 ** bits}`;
}

export function buildRxMerDistributionBins(values: number[], binCount = 12): RxMerDistributionBin[] {
  const numericValues = values.filter((value) => Number.isFinite(value));
  if (!numericValues.length) {
    return [];
  }

  const stats = summarize(numericValues);
  const minMer = stats.min;
  const maxMer = stats.max;
  const safeBinCount = Math.max(1, Math.floor(binCount));
  const span = maxMer - minMer;
  const width = span > 0 ? span / safeBinCount : 1;

  const bins = Array.from({ length: safeBinCount }, (_, index) => ({
    startMer: minMer + index * width,
    endMer: minMer + (index + 1) * width,
    count: 0,
  }));

  numericValues.forEach((value) => {
    const rawIndex = span > 0 ? Math.floor((value - minMer) / width) : 0;
    const index = clamp(rawIndex, 0, safeBinCount - 1);
    bins[index].count += 1;
  });

  return bins;
}

export function buildRxMerSelectionInsights(values: number[]): RxMerSelectionInsights | null {
  const numericValues = values.filter((value) => Number.isFinite(value));
  if (!numericValues.length) {
    return null;
  }

  const stats = summarize(numericValues);
  const avgMerDb = stats.avg;
  const minMerDb = stats.min;

  return {
    pointCount: numericValues.length,
    avgMerDb,
    minMerDb,
    maxMerDb: stats.max,
    estimatedBitloadBitsPerSymbol: estimateBitloadFromMerDb(avgMerDb),
    safeQamLabel: inferErrorFreeQamFromMerDb(minMerDb),
    distributionBins: buildRxMerDistributionBins(numericValues),
  };
}
