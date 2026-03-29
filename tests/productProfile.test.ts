import { describe, expect, it } from "vitest";

import {
  PRODUCT_PROFILE_PCW,
  PRODUCT_PROFILE_PW,
  parseProductProfile,
  productProfileLabel,
} from "@/app/productProfile";

describe("productProfile", () => {
  it("parses supported profile values", () => {
    expect(parseProductProfile("pypnm-webui")).toBe(PRODUCT_PROFILE_PW);
    expect(parseProductProfile("pypnm-cmts-webui")).toBe(PRODUCT_PROFILE_PCW);
  });

  it("rejects unsupported profile values", () => {
    expect(parseProductProfile("")).toBeNull();
    expect(parseProductProfile("invalid")).toBeNull();
    expect(parseProductProfile(undefined)).toBeNull();
  });

  it("returns display labels", () => {
    expect(productProfileLabel(PRODUCT_PROFILE_PW)).toBe("PyPNM-WebUI");
    expect(productProfileLabel(PRODUCT_PROFILE_PCW)).toBe("PyPNM-CMTS-WebUI");
  });
});
