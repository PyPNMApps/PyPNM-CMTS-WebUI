export function sanitizeIntegerLikeInput(raw: unknown): string {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return String(Math.trunc(raw));
  }

  if (typeof raw !== "string") {
    return "";
  }

  return raw.replaceAll(/[,_\s]/g, "").trim();
}

export function parseIntegerLikeInput(raw: unknown, fallback = 0): number {
  const sanitized = sanitizeIntegerLikeInput(raw);
  if (!sanitized) {
    return fallback;
  }

  const parsed = Number(sanitized);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.trunc(parsed);
}

export function formatIntegerLikeInput(raw: number | undefined, separator: "," | "_" = "_"): string {
  if (typeof raw !== "number" || !Number.isFinite(raw)) {
    return "";
  }

  return Math.trunc(raw).toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}
