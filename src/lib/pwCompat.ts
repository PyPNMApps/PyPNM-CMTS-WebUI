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

  // In PW profile, CMTS-prefixed routes should map to the PW API prefix.
  if (
    resolveProductProfileWithFallback() === PRODUCT_PROFILE_PW
    && normalizedPath.startsWith("/cmts/")
  ) {
    return `${PW_PCW_CONTRACT.pwApiPrefix}/${normalizedPath.slice("/cmts/".length)}`;
  }

  if (normalizedPath.startsWith("/cm/")) {
    return normalizedPath;
  }
  if (normalizedPath.startsWith("/cmts/")) {
    return normalizedPath;
  }
  return `${PW_PCW_CONTRACT.pwApiPrefix}${normalizedPath}`;
}
