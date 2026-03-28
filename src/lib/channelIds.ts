export function parseChannelIds(value: string): number[] {
  const parsed = value
    .split(",")
    .map((entry) => Number.parseInt(entry.trim(), 10))
    .filter((entry) => Number.isInteger(entry));

  if (parsed.length === 1 && parsed[0] === 0) {
    return [];
  }

  return parsed;
}
