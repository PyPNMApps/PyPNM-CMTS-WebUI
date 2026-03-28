import { describe, expect, it } from "vitest";

import { average, formatEpochSecondsUtc, formatFrequencyRangeMhz, summarize, toDeviceInfo } from "@/lib/sharedVisualUtils";

describe("shared visual utils", () => {
  it("formats capture time from epoch seconds", () => {
    expect(formatEpochSecondsUtc(1_772_952_501)).toBe("2026-03-08 06:48:21 UTC");
    expect(formatEpochSecondsUtc(undefined)).toBe("n/a");
  });

  it("formats frequency ranges in MHz", () => {
    expect(formatFrequencyRangeMhz([711_000_000, 713_000_000, 715_000_000])).toBe("711 - 715 MHz");
    expect(formatFrequencyRangeMhz(undefined)).toBe("Frequency range unavailable");
  });

  it("summarizes numeric arrays safely", () => {
    expect(average([1, 2, 3])).toBe(2);
    expect(summarize([31, 46.75])).toEqual({ avg: 38.875, min: 31, max: 46.75 });
    expect(summarize([])).toEqual({ avg: 0, min: 0, max: 0 });
  });

  it("maps device metadata into a stable display shape", () => {
    expect(
      toDeviceInfo(
        {
          MODEL: "C1000",
          VENDOR: "TestVendor",
          SW_REV: "1.2.3",
          HW_REV: "A1",
          BOOTR: "0.9.0",
        },
        "aa:bb:cc:dd:ee:ff",
      ),
    ).toEqual({
      macAddress: "aa:bb:cc:dd:ee:ff",
      MODEL: "C1000",
      VENDOR: "TestVendor",
      SW_REV: "1.2.3",
      HW_REV: "A1",
      BOOTR: "0.9.0",
    });
  });
});
