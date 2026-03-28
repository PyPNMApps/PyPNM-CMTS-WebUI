export function formatEpochSecondsUtc(raw: number | string | undefined | null): string {
  if (raw === undefined || raw === null || raw === "") {
    return "n/a";
  }

  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
    const milliseconds = raw > 1e12 ? raw : raw * 1000;
    const date = new Date(milliseconds);
    return Number.isNaN(date.getTime()) ? "n/a" : date.toISOString().slice(0, 19).replace("T", " ") + " UTC";
  }

  const numeric = Number(raw);
  if (!Number.isNaN(numeric) && Number.isFinite(numeric)) {
    return formatEpochSecondsUtc(numeric);
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? String(raw) : date.toISOString().slice(0, 19).replace("T", " ") + " UTC";
}
