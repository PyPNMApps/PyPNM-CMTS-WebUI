import { describe, expect, it } from "vitest";

import { FEC_SUMMARY_TYPE_OPTIONS } from "@/pw/features/operations/FecSummaryCaptureRequestForm";

describe("FecSummaryCaptureRequestForm", () => {
  it("uses backend-compatible enum values for the FEC summary type options", () => {
    expect(FEC_SUMMARY_TYPE_OPTIONS).toEqual([
      { value: 3, label: "24 Hours" },
      { value: 2, label: "10 Min" },
    ]);
  });
});
