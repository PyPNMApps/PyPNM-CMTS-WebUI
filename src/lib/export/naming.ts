import { sanitizeExportBaseName } from "@/lib/export/download";

function padTwoDigits(value: number): string {
  return String(value).padStart(2, "0");
}

function normalizeMacAddress(macAddress: string | undefined | null): string {
  const normalized = String(macAddress ?? "")
    .replace(/[^a-fA-F0-9]/g, "")
    .toUpperCase();
  return normalized || "UNKNOWNMAC";
}

function toExportDate(epochSeconds: number | undefined): Date {
  if (typeof epochSeconds === "number" && Number.isFinite(epochSeconds) && epochSeconds > 0) {
    return new Date(epochSeconds * 1000);
  }
  return new Date();
}

export function buildExportBaseName(
  macAddress: string | undefined | null,
  epochSeconds: number | undefined,
  suffix: string,
): string {
  const timestamp = toExportDate(epochSeconds);
  const hhmm = `${padTwoDigits(timestamp.getUTCHours())}${padTwoDigits(timestamp.getUTCMinutes())}`;
  const yyyymmdd = `${timestamp.getUTCFullYear()}${padTwoDigits(timestamp.getUTCMonth() + 1)}${padTwoDigits(timestamp.getUTCDate())}`;
  return sanitizeExportBaseName(`${suffix}-${normalizeMacAddress(macAddress)}-${hhmm}-${yyyymmdd}`);
}
