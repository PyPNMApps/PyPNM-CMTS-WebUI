import type { ChartSeries } from "@/pw/features/analysis/types";
import { formatEpochSecondsUtc } from "@/lib/formatters/dateTime";
import { formatFrequencyRangeMhz } from "@/lib/formatters/frequency";

const palette = ["#79a9ff", "#58d0a7", "#ff7a6b", "#f1c75b", "#89b4fa", "#f9e2af", "#a6e3a1", "#f38ba8"] as const;
const UNKNOWN_FREQUENCY_RANGE_LABEL = "Frequency range unavailable";

export interface ServingGroupChannelEstCoeffModemVisual {
  key: string;
  macAddress: string;
  ipAddress: string;
  vendor: string;
  model: string;
  softwareVersion: string;
  modelLabel: string;
  captureTimeEpoch?: number;
  captureTimeLabel: string;
  magnitudeSeries: ChartSeries;
  groupDelaySeries?: ChartSeries;
}

export interface ServingGroupChannelEstCoeffChannelVisual {
  key: string;
  channelId: string;
  rangeLabel: string;
  spacingKhzLabel: string;
  hasUsefulMetadata: boolean;
  sortFrequencyMhz: number | null;
  combinedMagnitudeSeries: ChartSeries[];
  modems: ServingGroupChannelEstCoeffModemVisual[];
}

export interface ServingGroupChannelEstCoeffGroupVisual {
  key: string;
  serviceGroupId: string;
  channels: ServingGroupChannelEstCoeffChannelVisual[];
}

export interface ServingGroupChannelEstCoeffVisualPayload {
  serviceGroups: ServingGroupChannelEstCoeffGroupVisual[];
  missingModems: Array<{
    key: string;
    serviceGroupId: string;
    channelId: string;
    macAddress: string;
    reason: string;
  }>;
}

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

function normalizeGroupDelay(value: unknown): number[] {
  if (Array.isArray(value)) {
    return asNumberArray(value);
  }
  const candidate = asRecord(value);
  if (!candidate) {
    return [];
  }
  if (Array.isArray(candidate.magnitude)) {
    return asNumberArray(candidate.magnitude);
  }
  if (Array.isArray(candidate.values)) {
    return asNumberArray(candidate.values);
  }
  return [];
}

function formatModelLabel(systemDescription: Record<string, unknown> | null): string {
  const model = String(systemDescription?.MODEL ?? "").trim();
  const sw = String(systemDescription?.SW_REV ?? "").trim();
  if (model && sw) return `${model} · ${sw}`;
  if (model) return model;
  if (sw) return sw;
  return "Unknown Model";
}

function readSystemDescriptionText(systemDescription: Record<string, unknown> | null, key: string): string {
  const value = String(systemDescription?.[key] ?? "").trim();
  return value === "" ? "n/a" : value;
}

function sortChannelsByFrequency(
  left: ServingGroupChannelEstCoeffChannelVisual,
  right: ServingGroupChannelEstCoeffChannelVisual,
): number {
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

export function normalizeServingGroupChannelEstCoeffResultsPayload(input: unknown): ServingGroupChannelEstCoeffVisualPayload {
  const root = asRecord(input);
  const results = asRecord(root?.results);
  const groups = asArray(results?.serving_groups);
  const missingModems: ServingGroupChannelEstCoeffVisualPayload["missingModems"] = [];

  const serviceGroups: ServingGroupChannelEstCoeffGroupVisual[] = groups.map((groupValue, sgIndex) => {
    const group = asRecord(groupValue);
    const serviceGroupId = String(group?.service_group_id ?? `sg-${sgIndex + 1}`);
    const channels = asArray(group?.channels).map((channelValue, channelIndex) => {
      const channel = asRecord(channelValue);
      const channelId = String(channel?.channel_id ?? `ch-${channelIndex + 1}`);
      const cableModems = asArray(channel?.cable_modems);

      const modems: ServingGroupChannelEstCoeffModemVisual[] = cableModems.map((modemValue, modemIndex) => {
        const modem = asRecord(modemValue);
        const macAddress = String(modem?.mac_address ?? "").trim() || `modem-${modemIndex + 1}`;
        const systemDescription = asRecord(modem?.system_description);
        const coeffData = asRecord(modem?.channel_est_coeff_data);
        const analysis = asRecord(coeffData?.analysis) ?? {};
        const pnmHeader = asRecord(analysis.pnm_header);
        const captureTime = typeof pnmHeader?.capture_time === "number" ? pnmHeader.capture_time : undefined;
        const carrierValues = asRecord(analysis.carrier_values);
        const frequency = asNumberArray(carrierValues?.frequency);
        const magnitudes = asNumberArray(carrierValues?.magnitudes);
        const groupDelay = normalizeGroupDelay(carrierValues?.group_delay);

        const magnitudeSeries: ChartSeries = {
          label: macAddress,
          color: palette[modemIndex % palette.length],
          points: magnitudes.map((y, index) => ({
            x: (frequency[index] ?? 0) / 1_000_000,
            y,
          })),
        };

        const groupDelaySeries = groupDelay.length
          ? {
            label: `${macAddress} Group Delay`,
            color: "#f1c75b",
            points: groupDelay.map((y, index) => {
              const frequencyHz = frequency[index];
              return {
                x: Number.isFinite(frequencyHz) ? frequencyHz / 1_000_000 : index,
                y,
              };
            }),
          }
          : undefined;

        if (magnitudeSeries.points.length === 0) {
          const analysisError = String(coeffData?.analysis_error ?? "").trim();
          const modemMessage = String(modem?.message ?? "").trim();
          const modemStatus = String(modem?.status ?? "").trim();
          missingModems.push({
            key: `${serviceGroupId}-${channelId}-${macAddress}`,
            serviceGroupId,
            channelId,
            macAddress,
            reason: analysisError || modemMessage || modemStatus || "No channel-estimation points available",
          });
        }

        return {
          key: `${serviceGroupId}-${channelId}-${macAddress}`,
          macAddress,
          ipAddress: String(modem?.ip_address ?? "").trim() || "n/a",
          vendor: readSystemDescriptionText(systemDescription, "VENDOR"),
          model: readSystemDescriptionText(systemDescription, "MODEL"),
          softwareVersion: readSystemDescriptionText(systemDescription, "SW_REV"),
          modelLabel: formatModelLabel(systemDescription),
          captureTimeEpoch: captureTime,
          captureTimeLabel: captureTime ? formatEpochSecondsUtc(captureTime) : "n/a",
          magnitudeSeries,
          groupDelaySeries,
        };
      });

      const firstAnalysis = asRecord(asRecord(asRecord(cableModems[0])?.channel_est_coeff_data)?.analysis);
      const firstCarrierValues = asRecord(firstAnalysis?.carrier_values);
      const firstFrequency = asNumberArray(firstCarrierValues?.frequency);
      const subcarrierSpacing = typeof firstAnalysis?.subcarrier_spacing === "number" ? firstAnalysis.subcarrier_spacing : null;
      const rangeLabel = formatFrequencyRangeMhz(firstFrequency);
      const spacingKhzLabel = subcarrierSpacing && Number.isFinite(subcarrierSpacing) ? (subcarrierSpacing / 1000).toFixed(2) : "n/a";
      const hasUsefulMetadata = !channelId.startsWith("ch-") || rangeLabel !== UNKNOWN_FREQUENCY_RANGE_LABEL || spacingKhzLabel !== "n/a";
      const sortFrequencyMhz = firstFrequency.length > 0 ? Math.min(...firstFrequency) / 1_000_000 : null;

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
        combinedMagnitudeSeries: modems
          .filter((modem) => modem.magnitudeSeries.points.length > 0)
          .map((modem) => modem.magnitudeSeries),
        modems: modems.filter((modem) => modem.magnitudeSeries.points.length > 0),
      };
    });

    return {
      key: `${serviceGroupId}-${sgIndex}`,
      serviceGroupId,
      channels: channels
        .filter((channelItem) => channelItem.hasUsefulMetadata && channelItem.combinedMagnitudeSeries.length > 0 && channelItem.modems.length > 0)
        .sort(sortChannelsByFrequency),
    };
  }).filter((group) => group.channels.length > 0);

  return { serviceGroups, missingModems };
}
