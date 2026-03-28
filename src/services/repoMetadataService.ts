const GITHUB_TAGS_URL = "https://api.github.com/repos/PyPNMApps/PyPNM-CMTS-WebUI/tags?per_page=1";
const APP_VERSION_URL = "/app-version.json";
export const REPO_URL = "https://github.com/PyPNMApps/PyPNM-CMTS-WebUI";

interface GitHubTag {
  name?: string;
}

interface RuntimeVersionPayload {
  version?: string;
}

export function parseLatestGitHubTag(payload: unknown): string | null {
  if (!Array.isArray(payload) || payload.length === 0) {
    return null;
  }

  const first = payload[0] as GitHubTag | undefined;
  return typeof first?.name === "string" && first.name.length > 0 ? first.name : null;
}

export function parseRuntimeVersion(payload: unknown): string | null {
  const candidate = payload as RuntimeVersionPayload | null;
  return typeof candidate?.version === "string" && candidate.version.length > 0 ? candidate.version : null;
}

export async function fetchCurrentLocalVersion(): Promise<string | null> {
  const response = await fetch(APP_VERSION_URL, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Local version lookup failed with status ${response.status}`);
  }

  return parseRuntimeVersion((await response.json()) as unknown);
}

export async function fetchLatestGitHubTag(): Promise<string | null> {
  const response = await fetch(GITHUB_TAGS_URL, {
    headers: {
      Accept: "application/vnd.github+json",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub tag lookup failed with status ${response.status}`);
  }

  return parseLatestGitHubTag((await response.json()) as unknown);
}
