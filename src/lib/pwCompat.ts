import {
  PRODUCT_PROFILE_PW,
  resolveProductProfileWithFallback,
} from "@/app/productProfile";

export interface PwPcwContract {
  pwApiPrefix: string;
}

export const PW_PCW_CONTRACT: PwPcwContract = {
  pwApiPrefix: "/cm",
};

export function toPwApiPath(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const profile = resolveProductProfileWithFallback();

  // In PW profile, use native API paths (no /cm prefix).
  // Keep compatibility for prefixed paths by stripping known CMTS/PW shims.
  if (profile === PRODUCT_PROFILE_PW) {
    if (normalizedPath.startsWith("/cmts/")) {
      return `/${normalizedPath.slice("/cmts/".length)}`;
    }
    if (normalizedPath.startsWith("/cm/")) {
      return `/${normalizedPath.slice("/cm/".length)}`;
    }
    return normalizedPath;
  }

  // In PCW profile, PW endpoints route through /cm.
  if (normalizedPath.startsWith("/cm/") || normalizedPath.startsWith("/cmts/")) {
    return normalizedPath;
  }
  return `${PW_PCW_CONTRACT.pwApiPrefix}${normalizedPath}`;
}
