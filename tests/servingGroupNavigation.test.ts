import { describe, expect, it } from "vitest";
import { servingGroupNavigationItems } from "../src/pcw/features/serving-group/lib/navigation";

describe("servingGroupNavigationItems", () => {
  it("includes the OFDMA PreEq workflow route", () => {
    expect(servingGroupNavigationItems).toContainEqual({
      to: "/serving-group/ofdma-pre-eq",
      label: "OFDMA PreEq",
    });
  });
});
