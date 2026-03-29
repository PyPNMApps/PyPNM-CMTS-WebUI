import type { ChartSeries } from "@/features/analysis/types";
import { formatEpochSecondsUtc } from "@/lib/formatters/dateTime";
import { formatFrequencyRangeMhz } from "@/lib/formatters/frequency";

const palette = ["#ff6c37", "#4caf50", "#2196f3", "#ffa500", "#9c27b0", "#f44336", "#00bcd4", "#8bc34a"] as const;
const UNKNOWN_FREQUENCY_RANGE_LABEL = "Frequency range unavailable";

export interface ServingGroupModulationProfileModemVisual {
  key: string;
  macAddress: string;
  vendor: string;
  model: string;
  softwareVersion: string;
  modelLabel: string;
  captureTimeEpoch?: number;
  captureTimeLabel: string;
  profileSeries: ChartSeries[];
}

export interface ServingGroupModulationProfileChannelVisual {
  key: string;
  channelId: string;
  rangeLabel: string;
  hasUsefulMetadata: boolean;
  sortFrequencyMhz: number | null;
  combinedSeries: ChartSeries[];
  modems: ServingGroupModulationProfileModemVisual[];
}

export interface ServingGroupModulationProfileGroupVisual {
  key: string;
  serviceGroupId: string;
  channels: ServingGroupModulationProfileChannelVisual[];
}

export interface ServingGroupModulationProfileVisualPayload {
  serviceGroups: ServingGroupModulationProfileGroupVisual[];
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

function asAnalysisRecord(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value) && value.length > 0) {
    return asRecord(value[0]);
  }
  return asRecord(value);
}

function formatModelLabel(systemDescription: Record<string, unknown> | null): string {
  const model = String(systemDescription?.MODEL ?? "").trim();
  const sw = String(systemDescription?.SW_REV ?? "").trim();
  if (model && sw) return `${model} · ${sw}`;
  if (model) return model;
  if (sw) return sw;
  return "Unknown Model";
}

function readSystemDescriptionFields(systemDescription: Record<string, unknown> | null): {
  vendor: string;
  model: string;
  softwareVersion: string;
} {
  return {
    vendor: String(systemDescription?.VENDOR ?? "").trim() || "n/a",
    model: String(systemDescription?.MODEL ?? "").trim() || "n/a",
    softwareVersion: String(systemDescription?.SW_REV ?? "").trim() || "n/a",
  };
}

function formatProfileLabel(profileId: number, modulation: string[] | undefined): string {
  const modulationLabel = modulation?.[0] ? String(modulation[0]).replace("qam_", "QAM-") : "Unknown";
  return `Profile ${profileId} (${modulationLabel})`;
}

function sortChannelsByFrequency(
  left: ServingGroupModulationProfileChannelVisual,
  right: ServingGroupModulationProfileChannelVisual,
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

export function normalizeServingGroupModulationProfileResultsPayload(input: unknown): ServingGroupModulationProfileVisualPayload {
  const root = asRecord(input);
  const results = asRecord(root?.results);
  const groups = asArray(results?.serving_groups);
  const missingModems: ServingGroupModulationProfileVisualPayload["missingModems"] = [];

  const serviceGroups: ServingGroupModulationProfileGroupVisual[] = groups.map((groupValue, sgIndex) => {
    const group = asRecord(groupValue);
    const serviceGroupId = String(group?.service_group_id ?? `sg-${sgIndex + 1}`);
    const channels = asArray(group?.channels).map((channelValue, channelIndex) => {
      const channel = asRecord(channelValue);
      const channelId = String(channel?.channel_id ?? `ch-${channelIndex + 1}`);
      const cableModems = asArray(channel?.cable_modems);

      const modems = cableModems.map((modemValue, modemIndex) => {
        const modem = asRecord(modemValue);
        const macAddress = String(modem?.mac_address ?? "").trim() || `modem-${modemIndex + 1}`;
        const systemDescription = asRecord(modem?.system_description);
        const modulationData = asRecord(modem?.modulation_profile_data);
        const analysis = asAnalysisRecord(modulationData?.analysis) ?? {};
        const pnmHeader = asRecord(analysis.pnm_header);
        const captureTime = typeof pnmHeader?.capture_time === "number" ? pnmHeader.capture_time : undefined;
        const profiles = asArray(analysis.profiles);

        const profileSeries = profiles.map((profileValue, profileIndex) => {
          const profile = asRecord(profileValue);
          const profileId = typeof profile?.profile_id === "number" ? profile.profile_id : profileIndex;
          const carrierValues = asRecord(profile?.carrier_values);
          const frequency = asNumberArray(carrierValues?.frequency);
          const minMer = asNumberArray(carrierValues?.shannon_min_mer);
          const modulation = asArray(carrierValues?.modulation).map((entry) => String(entry));

          return {
            label: formatProfileLabel(profileId, modulation),
            color: palette[profileId % palette.length],
            points: minMer.map((y, index) => ({
              x: (frequency[index] ?? 0) / 1_000_000,
              y,
            })),
          } satisfies ChartSeries;
        }).filter((series) => series.points.length > 0);

        if (profileSeries.length === 0) {
          const analysisError = String(modulationData?.analysis_error ?? "").trim();
          const modemMessage = String(modem?.message ?? "").trim();
          const modemStatus = String(modem?.status ?? "").trim();
          missingModems.push({
            key: `${serviceGroupId}-${channelId}-${macAddress}`,
            serviceGroupId,
            channelId,
            macAddress,
            reason: analysisError || modemMessage || modemStatus || "No modulation-profile points available",
          });
        }

        return {
          key: `${serviceGroupId}-${channelId}-${macAddress}`,
          macAddress,
          ...readSystemDescriptionFields(systemDescription),
          modelLabel: formatModelLabel(systemDescription),
          captureTimeEpoch: captureTime,
          captureTimeLabel: captureTime ? formatEpochSecondsUtc(captureTime) : "n/a",
          profileSeries,
        };
      }).filter((modem) => modem.profileSeries.length > 0);

      const combinedSeries = modems.flatMap((modem) =>
        modem.profileSeries.map((series) => ({
          ...series,
          label: `${modem.macAddress} · ${series.label}`,
        })),
      );
      const allFrequencyPoints = combinedSeries.flatMap((series) => series.points.map((point) => point.x));
      const sortFrequencyMhz = allFrequencyPoints.length > 0 ? Math.min(...allFrequencyPoints) : null;
      const rangeLabel = formatFrequencyRangeMhz(allFrequencyPoints.map((point) => point * 1_000_000));
      const hasUsefulMetadata = !channelId.startsWith("ch-") || rangeLabel !== UNKNOWN_FREQUENCY_RANGE_LABEL;

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
        hasUsefulMetadata,
        sortFrequencyMhz,
        combinedSeries,
        modems,
      };
    });

    return {
      key: `${serviceGroupId}-${sgIndex}`,
      serviceGroupId,
      channels: channels
        .filter((channelItem) => channelItem.hasUsefulMetadata && channelItem.combinedSeries.length > 0 && channelItem.modems.length > 0)
        .sort(sortChannelsByFrequency),
    };
  }).filter((group) => group.channels.length > 0);

  return { serviceGroups, missingModems };
}
