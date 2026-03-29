import type { ChartSeries } from "@/pw/features/analysis/types";
import { formatEpochSecondsUtc } from "@/lib/formatters/dateTime";

const palette = ["#ff6c37", "#4caf50", "#2196f3", "#ffa500", "#9c27b0", "#f44336", "#00bcd4", "#8bc34a"] as const;

export interface ServingGroupHistogramModemVisual {
  key: string;
  serviceGroupId: string;
  macAddress: string;
  vendor: string;
  model: string;
  softwareVersion: string;
  channelId: string;
  captureTimeEpoch?: number;
  captureTimeLabel: string;
  hitCounts: number[];
  series: ChartSeries[];
}

export interface ServingGroupHistogramVisualPayload {
  modems: ServingGroupHistogramModemVisual[];
  combinedSeries: ChartSeries[];
  missingModems: Array<{
    key: string;
    serviceGroupId: string;
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

export function normalizeServingGroupHistogramResultsPayload(input: unknown): ServingGroupHistogramVisualPayload {
  const root = asRecord(input);
  const results = asRecord(root?.results);
  const servingGroups = asArray(results?.serving_groups);
  const missingModems: ServingGroupHistogramVisualPayload["missingModems"] = [];
  const modems: ServingGroupHistogramModemVisual[] = [];

  for (let sgIndex = 0; sgIndex < servingGroups.length; sgIndex += 1) {
    const group = asRecord(servingGroups[sgIndex]);
    const serviceGroupId = String(group?.service_group_id ?? `sg-${sgIndex + 1}`);
    const cableModems = asArray(group?.cable_modems);

    for (let modemIndex = 0; modemIndex < cableModems.length; modemIndex += 1) {
      const modem = asRecord(cableModems[modemIndex]);
      const macAddress = String(modem?.mac_address ?? "").trim().toLowerCase() || `modem-${modemIndex + 1}`;
      const histogramData = asRecord(modem?.histogram_data);
      const analysis = asRecord(histogramData?.analysis);
      const pnmHeader = asRecord(analysis?.pnm_header);
      const systemDescription = asRecord(modem?.system_description) ?? asRecord(asRecord(analysis?.device_details)?.system_description);

      const hitCounts = asNumberArray(analysis?.hit_counts);
      if (hitCounts.length === 0) {
        const reason = String(histogramData?.analysis_error ?? modem?.message ?? modem?.status ?? "No histogram hit counts available").trim()
          || "No histogram hit counts available";
        missingModems.push({
          key: `${serviceGroupId}-${macAddress}`,
          serviceGroupId,
          macAddress,
          reason,
        });
        continue;
      }

      const captureTimeEpoch = typeof pnmHeader?.capture_time === "number" ? pnmHeader.capture_time : undefined;
      const channelIdRaw = analysis?.channel_id;
      const channelId = typeof channelIdRaw === "number" || typeof channelIdRaw === "string"
        ? String(channelIdRaw)
        : "n/a";
      const series: ChartSeries[] = [{
        label: `${macAddress} · SG ${serviceGroupId}`,
        color: palette[(modems.length) % palette.length],
        points: hitCounts.map((count, index) => ({ x: index, y: count })),
      }];

      modems.push({
        key: `${serviceGroupId}-${macAddress}-${modemIndex}`,
        serviceGroupId,
        macAddress,
        ...readSystemDescriptionFields(systemDescription),
        channelId,
        captureTimeEpoch,
        captureTimeLabel: captureTimeEpoch ? formatEpochSecondsUtc(captureTimeEpoch) : "n/a",
        hitCounts,
        series,
      });
    }
  }

  modems.sort((left, right) => {
    const bySg = left.serviceGroupId.localeCompare(right.serviceGroupId, undefined, { numeric: true });
    if (bySg !== 0) {
      return bySg;
    }
    return left.macAddress.localeCompare(right.macAddress);
  });

  return {
    modems,
    combinedSeries: modems.map((modem) => modem.series[0]).filter(Boolean),
    missingModems,
  };
}

