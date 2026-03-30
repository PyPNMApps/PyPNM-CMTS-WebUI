import { afterEach, describe, expect, it, vi } from "vitest";

import { toPwApiPath } from "@/lib/pwCompat";

describe("toPwApiPath", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("strips cmts prefix in PW profile", () => {
    vi.stubEnv("VITE_PRODUCT_PROFILE", "pypnm-webui");
    expect(toPwApiPath("/cmts/pnm/sg/ds/ofdm/rxmer/startCapture"))
      .toBe("/pnm/sg/ds/ofdm/rxmer/startCapture");
  });

  it("keeps cmts paths in PCW profile", () => {
    vi.stubEnv("VITE_PRODUCT_PROFILE", "pypnm-cmts-webui");
    expect(toPwApiPath("/cmts/pnm/sg/ds/ofdm/rxmer/startCapture"))
      .toBe("/cmts/pnm/sg/ds/ofdm/rxmer/startCapture");
  });

  it("keeps non-prefixed paths native in PW profile", () => {
    vi.stubEnv("VITE_PRODUCT_PROFILE", "pypnm-webui");
    expect(toPwApiPath("/docs/pnm/ds/ofdm/rxMer/getCapture"))
      .toBe("/docs/pnm/ds/ofdm/rxMer/getCapture");
  });

  it("strips /cm shim prefix in PW profile", () => {
    vi.stubEnv("VITE_PRODUCT_PROFILE", "pypnm-webui");
    expect(toPwApiPath("/cm/system/sysDescr")).toBe("/system/sysDescr");
  });

  it("prefixes non-prefixed paths with /cm in PCW profile", () => {
    vi.stubEnv("VITE_PRODUCT_PROFILE", "pypnm-cmts-webui");
    expect(toPwApiPath("/docs/pnm/ds/ofdm/rxMer/getCapture"))
      .toBe("/cm/docs/pnm/ds/ofdm/rxMer/getCapture");
  });
});
