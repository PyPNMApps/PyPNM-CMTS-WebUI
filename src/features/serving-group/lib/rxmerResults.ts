import type { ChartSeries } from "@/features/analysis/types";
import { formatEpochSecondsUtc } from "@/lib/formatters/dateTime";
import { formatFrequencyRangeMhz } from "@/lib/formatters/frequency";

const palette = ["#79a9ff", "#58d0a7", "#ff7a6b", "#f1c75b", "#89b4fa", "#f9e2af", "#a6e3a1", "#f38ba8"] as const;

export interface ServingGroupRxMerModemVisual {
  key: string;
  macAddress: string;
  modelLabel: string;
  captureTimeEpoch?: number;
  captureTimeLabel: string;
  rxMerSeries: ChartSeries[];
  modulationCounts?: Record<string, number>;
}

export interface ServingGroupRxMerChannelVisual {
  key: string;
  channelId: string;
  rangeLabel: string;
  spacingKhzLabel: string;
  hasUsefulMetadata: boolean;
  sortFrequencyMhz: number | null;
  combinedSeries: ChartSeries[];
  modems: ServingGroupRxMerModemVisual[];
}

export interface ServingGroupRxMerGroupVisual {
  key: string;
  serviceGroupId: string;
  channels: ServingGroupRxMerChannelVisual[];
}

export interface ServingGroupRxMerVisualPayload {
  serviceGroups: ServingGroupRxMerGroupVisual[];
  missingModems: Array<{
    key: string;
    serviceGroupId: string;
    channelId: string;
    macAddress: string;
    reason: string;
  }>;
}

const UNKNOWN_FREQUENCY_RANGE_LABEL = "Frequency range unavailable";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asNumberArray(value: unknown): number[] {
  return asArray(value)
    .map((item) => (typeof item === "number" ? item : Number.NaN))
    .filter((item) => Number.isFinite(item));
}

function sortChannelsByFrequency(left: ServingGroupRxMerChannelVisual, right: ServingGroupRxMerChannelVisual): number {
  if (left.sortFrequencyMhz !== null && right.sortFrequencyMhz !== null) {
    if (left.sortFrequencyMhz !== right.sortFrequencyMhz) {
      return left.sortFrequencyMhz - right.sortFrequencyMhz;
    }
  } else if (left.sortFrequencyMhz !== null) {
    return -1;
  } else if (right.sortFrequencyMhz !== null) {
    return 1;
  }

  const leftNumericId = Number(left.channelId);
  const rightNumericId = Number(right.channelId);
  if (Number.isFinite(leftNumericId) && Number.isFinite(rightNumericId)) {
    return leftNumericId - rightNumericId;
  }
  return left.channelId.localeCompare(right.channelId);
}

function toChartSeriesFromCarrierValues(
  analysisRecord: Record<string, unknown>,
  label: string,
  color: string,
): ChartSeries[] {
  const carrierValues = asRecord(analysisRecord.carrier_values);
  const magnitude = asNumberArray(carrierValues?.magnitude);
  const frequency = asNumberArray(carrierValues?.frequency);
  const rxMerSeries: ChartSeries = {
    label,
    color,
    points: magnitude.map((y, index) => ({
      x: (frequency[index] ?? 0) / 1_000_000,
      y,
    })),
  };

  const regression = asRecord(analysisRecord.regression);
  const slope = asNumberArray(regression?.slope);
  const regressionSeries: ChartSeries = {
    label: `${label} Regression`,
    color: "#ff7a6b",
    points: slope.map((y, index) => ({
      x: (frequency[index] ?? 0) / 1_000_000,
      y,
    })),
  };

  return slope.length > 0 ? [rxMerSeries, regressionSeries] : [rxMerSeries];
}

function formatModelLabel(systemDescription: Record<string, unknown> | null): string {
  const model = String(systemDescription?.MODEL ?? "").trim();
  const sw = String(systemDescription?.SW_REV ?? "").trim();
  if (model && sw) return `${model} · ${sw}`;
  if (model) return model;
  if (sw) return sw;
  return "Unknown Model";
}

export function normalizeServingGroupRxMerResultsPayload(input: unknown): ServingGroupRxMerVisualPayload {
  const root = asRecord(input);
  const results = asRecord(root?.results);
  const groups = asArray(results?.serving_groups);
  const missingModems: ServingGroupRxMerVisualPayload["missingModems"] = [];

  const serviceGroups: ServingGroupRxMerGroupVisual[] = groups.map((groupValue, sgIndex) => {
    const group = asRecord(groupValue);
    const serviceGroupId = String(group?.service_group_id ?? `sg-${sgIndex + 1}`);
    const channels = asArray(group?.channels).map((channelValue, channelIndex) => {
      const channel = asRecord(channelValue);
      const channelId = String(channel?.channel_id ?? `ch-${channelIndex + 1}`);
      const cableModems = asArray(channel?.cable_modems);

      const modems: ServingGroupRxMerModemVisual[] = cableModems.map((modemValue, modemIndex) => {
        const modem = asRecord(modemValue);
        const macAddress = String(modem?.mac_address ?? "").trim() || `modem-${modemIndex + 1}`;
        const systemDescription = asRecord(modem?.system_description);
        const rxMerData = asRecord(modem?.rxmer_data);
        const analysis = asRecord(rxMerData?.analysis) ?? {};
        const pnmHeader = asRecord(analysis.pnm_header);
        const captureTime = typeof pnmHeader?.capture_time === "number" ? pnmHeader.capture_time : undefined;
        const modulationStatistics = asRecord(analysis.modulation_statistics);
        const modulationCountsRaw = asRecord(modulationStatistics?.supported_modulation_counts);
        const modulationCounts = modulationCountsRaw
          ? Object.fromEntries(
            Object.entries(modulationCountsRaw)
              .map(([key, value]) => [key, typeof value === "number" ? value : Number(value)])
              .filter(([, value]) => Number.isFinite(value)),
          )
          : undefined;

        const series = toChartSeriesFromCarrierValues(analysis, macAddress, palette[modemIndex % palette.length]);
        const hasPrimarySeries = series[0]?.points.length > 0;
        if (!hasPrimarySeries) {
          const analysisError = String(rxMerData?.analysis_error ?? "").trim();
          const modemMessage = String(modem?.message ?? "").trim();
          const modemStatus = String(modem?.status ?? "").trim();
          missingModems.push({
            key: `${serviceGroupId}-${channelId}-${macAddress}`,
            serviceGroupId,
            channelId,
            macAddress,
            reason: analysisError || modemMessage || modemStatus || "No RxMER points available",
          });
        }

        return {
          key: `${serviceGroupId}-${channelId}-${macAddress}`,
          macAddress,
          modelLabel: formatModelLabel(systemDescription),
          captureTimeEpoch: captureTime,
          captureTimeLabel: captureTime ? formatEpochSecondsUtc(captureTime) : "n/a",
          rxMerSeries: series,
          modulationCounts: modulationCounts && Object.keys(modulationCounts).length > 0 ? modulationCounts : undefined,
        };
      });

      const firstAnalysis = asRecord(asRecord(asRecord(cableModems[0])?.rxmer_data)?.analysis);
      const carrierValues = asRecord(firstAnalysis?.carrier_values);
      const frequency = asNumberArray(carrierValues?.frequency);
      const subcarrierSpacing = typeof firstAnalysis?.subcarrier_spacing === "number" ? firstAnalysis.subcarrier_spacing : null;

      const combinedSeries: ChartSeries[] = modems
        .map((modem) => modem.rxMerSeries[0])
        .filter((series) => series && series.points.length > 0);
      const sortFrequencyMhz = frequency.length > 0 ? Math.min(...frequency) / 1_000_000 : null;

      const rangeLabel = formatFrequencyRangeMhz(frequency);
      const spacingKhzLabel = subcarrierSpacing && Number.isFinite(subcarrierSpacing) ? (subcarrierSpacing / 1000).toFixed(2) : "n/a";
      const hasUsefulMetadata = !channelId.startsWith("ch-") || rangeLabel !== UNKNOWN_FREQUENCY_RANGE_LABEL || spacingKhzLabel !== "n/a";

      if (!hasUsefulMetadata) {
        for (const modem of modems) {
          missingModems.push({
            key: `${serviceGroupId}-${channelId}-${modem.macAddress}-channel-metadata-missing`,
            serviceGroupId,
            channelId,
            macAddress: modem.macAddress,
            reason: "Channel metadata unavailable",
          });
        }
      }

      return {
        key: `${serviceGroupId}-${channelId}`,
        channelId,
        rangeLabel,
        spacingKhzLabel,
        hasUsefulMetadata,
        sortFrequencyMhz,
        combinedSeries,
        modems: modems.filter((modem) => modem.rxMerSeries[0]?.points.length > 0),
      };
    });

    return {
      key: `${serviceGroupId}-${sgIndex}`,
      serviceGroupId,
      channels: channels
        .filter((channel) => channel.hasUsefulMetadata && channel.combinedSeries.length > 0 && channel.modems.length > 0)
        .sort(sortChannelsByFrequency),
    };
  }).filter((group) => group.channels.length > 0);

  return { serviceGroups, missingModems };
}
