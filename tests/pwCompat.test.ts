import { afterEach, describe, expect, it, vi } from "vitest";

import { toPwApiPath } from "@/lib/pwCompat";

describe("toPwApiPath", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rewrites cmts paths to cm paths in PW profile", () => {
    vi.stubEnv("VITE_PRODUCT_PROFILE", "pypnm-webui");
    expect(toPwApiPath("/cmts/pnm/sg/ds/ofdm/rxmer/startCapture"))
      .toBe("/cm/pnm/sg/ds/ofdm/rxmer/startCapture");
  });

  it("keeps cmts paths in PCW profile", () => {
    vi.stubEnv("VITE_PRODUCT_PROFILE", "pypnm-cmts-webui");
    expect(toPwApiPath("/cmts/pnm/sg/ds/ofdm/rxmer/startCapture"))
      .toBe("/cmts/pnm/sg/ds/ofdm/rxmer/startCapture");
  });

  it("prefixes non-prefixed paths with /cm", () => {
    vi.stubEnv("VITE_PRODUCT_PROFILE", "pypnm-webui");
    expect(toPwApiPath("/docs/pnm/ds/ofdm/rxMer/getCapture"))
      .toBe("/cm/docs/pnm/ds/ofdm/rxMer/getCapture");
  });
});
