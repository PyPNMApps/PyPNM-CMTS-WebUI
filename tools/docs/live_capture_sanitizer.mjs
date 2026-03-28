export const DEFAULT_GENERIC_SYSTEM_DESCRIPTION = Object.freeze({
  HW_REV: "1.0",
  VENDOR: "LANCity",
  BOOTR: "NONE",
  SW_REV: "1.0.0",
  MODEL: "LCPET-3",
});

const MAC_PATTERN = /^[0-9a-f]{2}(:[0-9a-f]{2}){5}$/i;
const OUI_PATTERN = /^[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}$/i;

export function normalizeMacOuiMask(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!OUI_PATTERN.test(normalized)) {
    throw new Error(`Invalid OUI mask "${value}". Expected format "00:00:00".`);
  }
  return normalized;
}

function maskMacAddress(raw, ouiMask) {
  if (typeof raw !== "string") {
    return raw;
  }
  const normalized = raw.trim().toLowerCase();
  if (!MAC_PATTERN.test(normalized)) {
    return raw;
  }
  const parts = normalized.split(":");
  const suffix = parts.slice(3).join(":");
  return `${ouiMask}:${suffix}`;
}

function sanitizeSystemDescription(value, template) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }
  return {
    ...value,
    ...template,
    is_empty: false,
  };
}

function sanitizeSysDescrValue(value, template) {
  if (typeof value === "string") {
    return "Generic DOCSIS Cable Modem";
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return {
      hw_rev: template.HW_REV,
      vendor: template.VENDOR,
      boot_rev: template.BOOTR,
      sw_rev: template.SW_REV,
      model: template.MODEL,
      _is_empty: false,
    };
  }
  return value;
}

export function sanitizeCapturePayload(
  value,
  {
    macOuiMask = "00:00:00",
    systemDescriptionTemplate = DEFAULT_GENERIC_SYSTEM_DESCRIPTION,
  } = {},
) {
  const normalizedOuiMask = normalizeMacOuiMask(macOuiMask);

  function walk(node, parentKey = "") {
    if (Array.isArray(node)) {
      return node.map((entry) => walk(entry, parentKey));
    }

    if (node && typeof node === "object") {
      const next = {};
      for (const [key, entry] of Object.entries(node)) {
        if (key === "mac_address" || key === "macAddress") {
          next[key] = maskMacAddress(entry, normalizedOuiMask);
          continue;
        }
        if (key === "system_description") {
          next[key] = sanitizeSystemDescription(entry, systemDescriptionTemplate);
          continue;
        }
        if (/^sysdescr$/i.test(key)) {
          next[key] = sanitizeSysDescrValue(entry, systemDescriptionTemplate);
          continue;
        }
        next[key] = walk(entry, key);
      }
      return next;
    }

    if ((parentKey === "mac_address" || parentKey === "macAddress") && typeof node === "string") {
      return maskMacAddress(node, normalizedOuiMask);
    }
    return node;
  }

  return walk(value);
}
