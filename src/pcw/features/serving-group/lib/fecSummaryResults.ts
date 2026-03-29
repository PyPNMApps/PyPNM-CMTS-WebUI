import { formatEpochSecondsUtc } from "@/lib/formatters/dateTime";
import type { SingleFecSummaryProfileEntry } from "@/types/api";

export interface ServingGroupFecSummaryModemVisual {
  key: string;
  macAddress: string;
  modelLabel: string;
  captureTimeEpoch?: number;
  captureTimeLabel: string;
  profiles: SingleFecSummaryProfileEntry[];
}

export interface ServingGroupFecSummaryChannelVisual {
  key: string;
  channelId: string;
  modems: ServingGroupFecSummaryModemVisual[];
}

export interface ServingGroupFecSummaryGroupVisual {
  key: string;
  serviceGroupId: string;
  channels: ServingGroupFecSummaryChannelVisual[];
}

export interface ServingGroupFecSummaryVisualPayload {
  serviceGroups: ServingGroupFecSummaryGroupVisual[];
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
    .map((item) => (typeof item === "number" ? item : Number(item)))
    .filter((item) => Number.isFinite(item));
}

function formatModelLabel(systemDescription: Record<string, unknown> | null): string {
  const model = String(systemDescription?.MODEL ?? "").trim();
  const sw = String(systemDescription?.SW_REV ?? "").trim();
  if (model && sw) return `${model} · ${sw}`;
  if (model) return model;
  if (sw) return sw;
  return "Unknown Model";
}

function normalizeProfiles(value: unknown): SingleFecSummaryProfileEntry[] {
  return asArray(value).map((profileValue) => {
    const profileRecord = asRecord(profileValue);
    const codewords = asRecord(profileRecord?.codewords);
    const timestamps = asNumberArray(codewords?.timestamps);
    const totalCodewords = asNumberArray(codewords?.total ?? codewords?.total_codewords);
    const corrected = asNumberArray(codewords?.corrected);
    const uncorrected = asNumberArray(codewords?.uncorrected);
    const length = Math.min(timestamps.length, totalCodewords.length, corrected.length, uncorrected.length);

    return {
      profile: String(profileRecord?.profile ?? "n/a"),
      codewords: {
        timestamps: timestamps.slice(0, length),
        total_codewords: totalCodewords.slice(0, length),
        corrected: corrected.slice(0, length),
        uncorrected: uncorrected.slice(0, length),
      },
    };
  }).filter((profile) => profile.codewords.timestamps.length > 0);
}

function sortChannels(
  left: ServingGroupFecSummaryChannelVisual,
  right: ServingGroupFecSummaryChannelVisual,
): number {
  const leftNumeric = Number(left.channelId);
  const rightNumeric = Number(right.channelId);
  if (Number.isFinite(leftNumeric) && Number.isFinite(rightNumeric)) {
    return leftNumeric - rightNumeric;
  }
  return left.channelId.localeCompare(right.channelId);
}

export function normalizeServingGroupFecSummaryResultsPayload(input: unknown): ServingGroupFecSummaryVisualPayload {
  const root = asRecord(input);
  const results = asRecord(root?.results);
  const groups = asArray(results?.serving_groups);
  const missingModems: ServingGroupFecSummaryVisualPayload["missingModems"] = [];

  const serviceGroups: ServingGroupFecSummaryGroupVisual[] = groups.map((groupValue, groupIndex) => {
    const groupRecord = asRecord(groupValue);
    const serviceGroupId = String(groupRecord?.service_group_id ?? `sg-${groupIndex + 1}`);
    const channels = asArray(groupRecord?.channels).map((channelValue, channelIndex) => {
      const channelRecord = asRecord(channelValue);
      const channelId = String(channelRecord?.channel_id ?? `ch-${channelIndex + 1}`);

      const modems = asArray(channelRecord?.cable_modems).map((modemValue, modemIndex) => {
        const modemRecord = asRecord(modemValue);
        const macAddress = String(modemRecord?.mac_address ?? "").trim() || `modem-${modemIndex + 1}`;
        const systemDescription = asRecord(modemRecord?.system_description);
        const fecSummaryData = asRecord(modemRecord?.fec_summary_data);
        const analysis = asRecord(fecSummaryData?.analysis);
        const profiles = normalizeProfiles(analysis?.profiles);
        const pnmHeader = asRecord(analysis?.pnm_header);
        const captureTime = typeof pnmHeader?.capture_time === "number" ? pnmHeader.capture_time : undefined;

        if (profiles.length === 0) {
          const analysisError = String(fecSummaryData?.analysis_error ?? "").trim();
          const modemMessage = String(modemRecord?.message ?? "").trim();
          const modemStatus = String(modemRecord?.status ?? "").trim();
          missingModems.push({
            key: `${serviceGroupId}-${channelId}-${macAddress}`,
            serviceGroupId,
            channelId,
            macAddress,
            reason: analysisError || modemMessage || modemStatus || "No FEC summary profile data available",
          });
        }

        return {
          key: `${serviceGroupId}-${channelId}-${macAddress}`,
          macAddress,
          modelLabel: formatModelLabel(systemDescription),
          captureTimeEpoch: captureTime,
          captureTimeLabel: captureTime ? formatEpochSecondsUtc(captureTime) : "n/a",
          profiles,
        };
      }).filter((modem) => modem.profiles.length > 0);

      return {
        key: `${serviceGroupId}-${channelId}`,
        channelId,
        modems,
      };
    });

    return {
      key: `${serviceGroupId}-${groupIndex}`,
      serviceGroupId,
      channels: channels.filter((channel) => channel.modems.length > 0).sort(sortChannels),
    };
  }).filter((group) => group.channels.length > 0);

  return { serviceGroups, missingModems };
}
