import { describe, expect, it } from "vitest";
import { normalizeServingGroupHistogramResultsPayload } from "../src/pcw/features/serving-group/lib/histogramResults";

describe("normalizeServingGroupHistogramResultsPayload", () => {
  it("normalizes SG histogram results into flat modem visuals and missing rows", () => {
    const payload = {
      results: {
        serving_groups: [
          {
            service_group_id: 1,
            cable_modems: [
              {
                mac_address: "aa:bb:cc:dd:ee:ff",
                system_description: {
                  VENDOR: "LANCity",
                  MODEL: "LCPET-3",
                  SW_REV: "1.0.0",
                },
                histogram_data: {
                  analysis: {
                    pnm_header: {
                      capture_time: 1772143470,
                    },
                    channel_id: -1,
                    hit_counts: [0, 1, 3, 5],
                  },
                },
              },
              {
                mac_address: "11:22:33:44:55:66",
                message: "modem ip address missing",
                histogram_data: {
                  analysis: null,
                },
              },
            ],
          },
        ],
      },
    };

    const normalized = normalizeServingGroupHistogramResultsPayload(payload);
    expect(normalized.modems).toHaveLength(1);
    expect(normalized.modems[0]?.macAddress).toBe("aa:bb:cc:dd:ee:ff");
    expect(normalized.modems[0]?.hitCounts).toEqual([0, 1, 3, 5]);
    expect(normalized.combinedSeries).toHaveLength(1);
    expect(normalized.missingModems).toHaveLength(1);
    expect(normalized.missingModems[0]?.reason).toContain("modem ip address missing");
  });
});

