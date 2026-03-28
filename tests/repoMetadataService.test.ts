import { describe, expect, it } from "vitest";

import { parseLatestGitHubTag, parseRuntimeVersion } from "../src/services/repoMetadataService";

describe("parseLatestGitHubTag", () => {
  it("returns the first tag name", () => {
    expect(parseLatestGitHubTag([{ name: "v0.1.9.0" }, { name: "v0.1.8.0" }])).toBe("v0.1.9.0");
  });

  it("returns null for empty or invalid payloads", () => {
    expect(parseLatestGitHubTag([])).toBeNull();
    expect(parseLatestGitHubTag({})).toBeNull();
    expect(parseLatestGitHubTag([{ nope: "x" }])).toBeNull();
  });
});

describe("parseRuntimeVersion", () => {
  it("returns the version string from the runtime payload", () => {
    expect(parseRuntimeVersion({ version: "0.2.15.2" })).toBe("0.2.15.2");
  });

  it("returns null for empty or invalid runtime version payloads", () => {
    expect(parseRuntimeVersion({})).toBeNull();
    expect(parseRuntimeVersion([])).toBeNull();
    expect(parseRuntimeVersion({ version: 1 })).toBeNull();
  });
});
