import { describe, expect, it } from "vitest";
import { normalizeServingGroupModulationProfileResultsPayload } from "../src/features/serving-group/lib/modulationProfileResults";

describe("normalizeServingGroupModulationProfileResultsPayload", () => {
  it("normalizes SG modulation-profile results into chart-friendly groups/channels/modems", () => {
    const payload = {
      results: {
        serving_groups: [
          {
            service_group_id: 1,
            channels: [
              {
                channel_id: 33,
                cable_modems: [
                  {
                    mac_address: "aa:bb:cc:dd:ee:ff",
                    system_description: {
                      MODEL: "LCPET-3",
                      SW_REV: "1.0.0",
                    },
                    modulation_profile_data: {
                      analysis: {
                        pnm_header: {
                          capture_time: 1774739979,
                        },
                        profiles: [
                          {
                            profile_id: 0,
                            carrier_values: {
                              frequency: [774000000, 774050000],
                              modulation: ["qam_1024"],
                              shannon_min_mer: [38.2, 38.4],
                            },
                          },
                        ],
                      },
                    },
                  },
                  {
                    mac_address: "11:22:33:44:55:66",
                    status: "failed",
                    message: "modem ip address missing",
                    modulation_profile_data: {
                      analysis: null,
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    };

    const normalized = normalizeServingGroupModulationProfileResultsPayload(payload);
    expect(normalized.serviceGroups).toHaveLength(1);
    expect(normalized.serviceGroups[0].channels).toHaveLength(1);
    expect(normalized.serviceGroups[0].channels[0].modems).toHaveLength(1);
    expect(normalized.serviceGroups[0].channels[0].combinedSeries).toHaveLength(1);
    expect(normalized.missingModems).toHaveLength(1);
    expect(normalized.missingModems[0]?.reason).toContain("modem ip address missing");
  });
});
