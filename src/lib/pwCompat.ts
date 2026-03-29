export interface PwPcwContract {
  pwApiPrefix: string;
}

export const PW_PCW_CONTRACT: PwPcwContract = {
  pwApiPrefix: "/cm",
};

export function toPwApiPath(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (normalizedPath.startsWith("/cm/")) {
    return normalizedPath;
  }
  if (normalizedPath.startsWith("/cmts/")) {
    return normalizedPath;
  }
  return `${PW_PCW_CONTRACT.pwApiPrefix}${normalizedPath}`;
}
