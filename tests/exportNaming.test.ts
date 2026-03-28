import { describe, expect, it, vi } from "vitest";

import { buildExportBaseName } from "@/lib/export/naming";

describe("export naming", () => {
  it("builds modem-specific suffixes with delimiter-free MAC and timestamp", () => {
    expect(buildExportBaseName("aa:bb:cc:dd:ee:ff", 1_710_000_000, "advanced-rxmer")).toBe(
      "advanced-rxmer-aabbccddeeff-1600-20240309",
    );
  });

  it("falls back to current time and unknown MAC when values are missing", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-19T15:04:00Z"));

    expect(buildExportBaseName(undefined, undefined, "single-rxmer")).toBe(
      "single-rxmer-unknownmac-1504-20260319",
    );

    vi.useRealTimers();
  });
});
