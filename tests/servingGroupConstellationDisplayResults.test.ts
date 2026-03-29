import { describe, expect, it } from "vitest";
import { normalizeServingGroupConstellationDisplayResultsPayload } from "../src/pcw/features/serving-group/lib/constellationDisplayResults";

describe("normalizeServingGroupConstellationDisplayResultsPayload", () => {
  it("normalizes SG constellation display results into chart-friendly groups/channels/modems", () => {
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
                    constellation_display_data: {
                      analysis: {
                        channel_id: 33,
                        modulation_order: 4096,
                        num_sample_symbols: 8192,
                        pnm_header: {
                          capture_time: 1774739979,
                        },
                        soft: {
                          complex: [[0.1, 0.2], [0.3, 0.4]],
                        },
                        hard: {
                          complex: [[0.11, 0.21], [0.31, 0.41]],
                        },
                      },
                    },
                  },
                  {
                    mac_address: "11:22:33:44:55:66",
                    status: "failed",
                    message: "modem ip address missing",
                    constellation_display_data: {
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

    const normalized = normalizeServingGroupConstellationDisplayResultsPayload(payload);
    expect(normalized.serviceGroups).toHaveLength(1);
    expect(normalized.serviceGroups[0].channels).toHaveLength(1);
    expect(normalized.serviceGroups[0].channels[0].modems).toHaveLength(1);
    expect(normalized.serviceGroups[0].channels[0].modems[0]?.analysisEntry.channel_id).toBe(33);
    expect(normalized.missingModems).toHaveLength(1);
    expect(normalized.missingModems[0]?.reason).toContain("modem ip address missing");
  });
});
