import type { SingleConstellationDisplayAnalysisEntry } from "@/types/api";

export interface ServingGroupConstellationDisplayModemVisual {
  key: string;
  macAddress: string;
  vendor: string;
  model: string;
  softwareVersion: string;
  modelLabel: string;
  analysisEntry: SingleConstellationDisplayAnalysisEntry;
}

export interface ServingGroupConstellationDisplayChannelVisual {
  key: string;
  channelId: string;
  modems: ServingGroupConstellationDisplayModemVisual[];
}

export interface ServingGroupConstellationDisplayGroupVisual {
  key: string;
  serviceGroupId: string;
  channels: ServingGroupConstellationDisplayChannelVisual[];
}

export interface ServingGroupConstellationDisplayVisualPayload {
  serviceGroups: ServingGroupConstellationDisplayGroupVisual[];
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

function asPointArray(value: unknown): Array<[number, number]> {
  return asArray(value)
    .filter((point): point is [number, number] => Array.isArray(point) && point.length >= 2)
    .map((point) => [Number(point[0]), Number(point[1])] as [number, number])
    .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
}

function asAnalysisRecord(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value) && value.length > 0) {
    return asRecord(value[0]);
  }
  return asRecord(value);
}

function countConstellationPoints(
  value: SingleConstellationDisplayAnalysisEntry["soft"] | SingleConstellationDisplayAnalysisEntry["hard"],
): number {
  if (Array.isArray(value)) {
    return value.length;
  }
  if (value && Array.isArray(value.complex)) {
    return value.complex.length;
  }
  return 0;
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

function toAnalysisEntry(modemRecord: Record<string, unknown>): SingleConstellationDisplayAnalysisEntry | null {
  const macAddress = String(modemRecord.mac_address ?? "").trim().toLowerCase();
  const systemDescription = asRecord(modemRecord.system_description);
  const data = asRecord(modemRecord.constellation_display_data);
  const analysis = asAnalysisRecord(data?.analysis);
  if (!analysis) {
    return null;
  }

  const soft = analysis.soft;
  const hard = analysis.hard;
  const normalizedSoft = asPointArray(asRecord(soft)?.complex ?? soft);
  const normalizedHard = asPointArray(asRecord(hard)?.complex ?? hard);
  if (normalizedSoft.length === 0 && normalizedHard.length === 0) {
    return null;
  }

  const channelId = typeof analysis.channel_id === "number" ? analysis.channel_id : undefined;
  const modulationOrder = typeof analysis.modulation_order === "number" ? analysis.modulation_order : undefined;
  const numSampleSymbols = typeof analysis.num_sample_symbols === "number" ? analysis.num_sample_symbols : undefined;
  const pnmHeaderRecord = asRecord(analysis.pnm_header);
  const captureTime = typeof pnmHeaderRecord?.capture_time === "number" ? pnmHeaderRecord.capture_time : undefined;
  const normalizedSystemDescription = systemDescription as NonNullable<
    NonNullable<SingleConstellationDisplayAnalysisEntry["device_details"]>["system_description"]
  > | null;

  return {
    channel_id: channelId,
    mac_address: macAddress || undefined,
    modulation_order: modulationOrder,
    num_sample_symbols: numSampleSymbols,
    pnm_header: captureTime !== undefined ? { capture_time: captureTime } : undefined,
    device_details: {
      system_description: normalizedSystemDescription ?? undefined,
    },
    soft: normalizedSoft,
    hard: normalizedHard,
  };
}

function sortChannels(left: ServingGroupConstellationDisplayChannelVisual, right: ServingGroupConstellationDisplayChannelVisual): number {
  const leftNumeric = Number(left.channelId);
  const rightNumeric = Number(right.channelId);
  if (Number.isFinite(leftNumeric) && Number.isFinite(rightNumeric)) {
    return leftNumeric - rightNumeric;
  }
  return left.channelId.localeCompare(right.channelId);
}

export function normalizeServingGroupConstellationDisplayResultsPayload(input: unknown): ServingGroupConstellationDisplayVisualPayload {
  const root = asRecord(input);
  const results = asRecord(root?.results);
  const groups = asArray(results?.serving_groups);
  const missingModems: ServingGroupConstellationDisplayVisualPayload["missingModems"] = [];

  const serviceGroups: ServingGroupConstellationDisplayGroupVisual[] = groups.map((groupValue, groupIndex) => {
    const groupRecord = asRecord(groupValue);
    const serviceGroupId = String(groupRecord?.service_group_id ?? `sg-${groupIndex + 1}`);
    const channels = asArray(groupRecord?.channels).map((channelValue, channelIndex) => {
      const channelRecord = asRecord(channelValue);
      const channelId = String(channelRecord?.channel_id ?? `ch-${channelIndex + 1}`);
      const modems = asArray(channelRecord?.cable_modems).map((modemValue, modemIndex) => {
        const modemRecord = asRecord(modemValue);
        const macAddress = String(modemRecord?.mac_address ?? "").trim().toLowerCase() || `modem-${modemIndex + 1}`;
        const systemDescription = asRecord(modemRecord?.system_description);
        const analysisEntry = toAnalysisEntry(modemRecord ?? {});

        if (!analysisEntry || (countConstellationPoints(analysisEntry.soft) === 0 && countConstellationPoints(analysisEntry.hard) === 0)) {
          const data = asRecord(modemRecord?.constellation_display_data);
          const analysisError = String(data?.analysis_error ?? "").trim();
          const modemMessage = String(modemRecord?.message ?? "").trim();
          const modemStatus = String(modemRecord?.status ?? "").trim();
          missingModems.push({
            key: `${serviceGroupId}-${channelId}-${macAddress}`,
            serviceGroupId,
            channelId,
            macAddress,
            reason: analysisError || modemMessage || modemStatus || "No constellation points available",
          });
          return null;
        }

        return {
          key: `${serviceGroupId}-${channelId}-${macAddress}`,
          macAddress,
          ...readSystemDescriptionFields(systemDescription),
          modelLabel: formatModelLabel(systemDescription),
          analysisEntry,
        };
      }).filter((modem): modem is ServingGroupConstellationDisplayModemVisual => Boolean(modem));

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
