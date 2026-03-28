export function isValidMacAddress(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/[^0-9a-fA-F:._\-\s]/.test(trimmed)) return false;
  const hexOnly = trimmed.replace(/[^0-9a-fA-F]/g, "");
  return hexOnly.length === 12;
}

export function isValidIpv4Address(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  const parts = trimmed.split(".");
  if (parts.length !== 4) return false;

  return parts.every((part) => {
    if (!/^\d+$/.test(part)) return false;
    if (part.length > 1 && part.startsWith("0")) return false;
    const valueNumber = Number(part);
    return valueNumber >= 0 && valueNumber <= 255;
  });
}

export function isValidIpv6Address(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/[^0-9a-fA-F:.]/.test(trimmed)) return false;

  const parts = trimmed.split("::");
  if (parts.length > 2) return false;

  const isValidHextet = (segment: string) => /^[0-9a-fA-F]{1,4}$/.test(segment);
  const countSegments = (segmentGroup: string) =>
    segmentGroup === "" ? 0 : segmentGroup.split(":").filter((segment) => segment.length > 0).length;
  const validateGroup = (segmentGroup: string) =>
    segmentGroup === "" || segmentGroup.split(":").every((segment) => isValidHextet(segment));

  if (parts.length === 1) {
    const segments = trimmed.split(":");
    return segments.length === 8 && segments.every((segment) => isValidHextet(segment));
  }

  const [left, right] = parts;
  if (!validateGroup(left) || !validateGroup(right)) return false;

  const totalSegments = countSegments(left) + countSegments(right);
  return totalSegments < 8;
}

export function isValidIpAddress(value: string): boolean {
  return isValidIpv4Address(value) || isValidIpv6Address(value);
}

export const networkFieldValidation = {
  macAddress: {
    required: "MAC address is required.",
    validate: (value: string) => isValidMacAddress(value) || "Enter a valid MAC address.",
  },
  ipAddress: {
    required: "IP address is required.",
    validate: (value: string) => isValidIpAddress(value) || "Enter a valid IPv4 or IPv6 address.",
  },
  optionalIpv4: {
    validate: (value: string) => !value.trim() || isValidIpv4Address(value) || "Enter a valid IPv4 address.",
  },
  optionalIpv6: {
    validate: (value: string) => !value.trim() || isValidIpv6Address(value) || "Enter a valid IPv6 address.",
  },
} as const;
