import { describe, expect, it } from "vitest";

import { normalizeGroupDelayUs } from "@/features/advanced/AdvancedChannelEstGroupDelayView";

describe("normalizeGroupDelayUs", () => {
  it("converts second-scale group delay values into microseconds", () => {
    expect(normalizeGroupDelayUs([0.000001, 0.000002, 0.000003])).toEqual([1, 2, 3]);
  });

  it("keeps existing microsecond-scale values unchanged", () => {
    expect(normalizeGroupDelayUs([1, 2, 3])).toEqual([1, 2, 3]);
  });
});
