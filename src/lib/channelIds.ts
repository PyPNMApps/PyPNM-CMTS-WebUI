export interface ChannelIdValidationResult {
  channelIds: number[];
  error: string | null;
}

export function parseChannelIds(rawValue: string): number[] {
  return rawValue
    .split(",")
    .map((entry) => Number.parseInt(entry.trim(), 10))
    .filter((entry) => Number.isInteger(entry));
}

export function validateAndNormalizeChannelIds(rawValue: string): ChannelIdValidationResult {
  const trimmed = rawValue.trim();
  if (trimmed === "") {
    return { channelIds: [], error: null };
  }

  const parts = trimmed
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (parts.length === 0) {
    return { channelIds: [], error: null };
  }

  const parsed: number[] = [];
  for (const part of parts) {
    if (!/^-?\d+$/.test(part)) {
      return { channelIds: [], error: `Invalid channel ID "${part}". Use integers only.` };
    }
    const value = Number.parseInt(part, 10);
    if (!Number.isInteger(value)) {
      return { channelIds: [], error: `Invalid channel ID "${part}". Use integers only.` };
    }
    if (value < 0) {
      return { channelIds: [], error: `Invalid channel ID "${part}". Channel IDs must be positive.` };
    }
    parsed.push(value);
  }

  if (parsed.length === 1 && parsed[0] === 0) {
    return { channelIds: [], error: null };
  }

  if (parsed.includes(0)) {
    return { channelIds: [], error: "Channel ID 0 is only valid by itself to mean all channels." };
  }

  return {
    channelIds: parsed,
    error: null,
  };
}
