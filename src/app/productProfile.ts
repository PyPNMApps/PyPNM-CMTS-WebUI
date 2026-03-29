export const PRODUCT_PROFILE_PW = "pypnm-webui" as const;
export const PRODUCT_PROFILE_PCW = "pypnm-cmts-webui" as const;

export type ProductProfile = typeof PRODUCT_PROFILE_PW | typeof PRODUCT_PROFILE_PCW;

export function parseProductProfile(value: string | undefined | null): ProductProfile | null {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === PRODUCT_PROFILE_PW) {
    return PRODUCT_PROFILE_PW;
  }
  if (normalized === PRODUCT_PROFILE_PCW) {
    return PRODUCT_PROFILE_PCW;
  }
  return null;
}

export function resolveProductProfile(): ProductProfile | null {
  return parseProductProfile(import.meta.env.VITE_PRODUCT_PROFILE);
}

export function resolveProductProfileWithFallback(): ProductProfile {
  return resolveProductProfile() ?? PRODUCT_PROFILE_PCW;
}

export function productProfileLabel(profile: ProductProfile): string {
  return profile === PRODUCT_PROFILE_PW ? "PyPNM-WebUI" : "PyPNM-CMTS-WebUI";
}
