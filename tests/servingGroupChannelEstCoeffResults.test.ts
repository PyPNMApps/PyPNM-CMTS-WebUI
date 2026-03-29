import { describe, expect, it } from "vitest";
import { normalizeServingGroupChannelEstCoeffResultsPayload } from "../src/pcw/features/serving-group/lib/channelEstCoeffResults";

describe("normalizeServingGroupChannelEstCoeffResultsPayload", () => {
  it("normalizes SG ChannelEstCoeff results into chart-friendly groups/channels/modems", () => {
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
                      MODEL: "CPE-1",
                      SW_REV: "1.2.3",
                    },
                    channel_est_coeff_data: {
                      analysis: {
                        pnm_header: {
                          capture_time: 1774739979,
                        },
                        subcarrier_spacing: 50000,
                        carrier_values: {
                          frequency: [774000000, 774050000],
                          magnitudes: [0.1, 0.2],
                          group_delay: [1.1, 1.2],
                        },
                      },
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    };

    const normalized = normalizeServingGroupChannelEstCoeffResultsPayload(payload);
    expect(normalized.serviceGroups).toHaveLength(1);
    expect(normalized.serviceGroups[0].channels).toHaveLength(1);
    expect(normalized.serviceGroups[0].channels[0].modems).toHaveLength(1);
    expect(normalized.serviceGroups[0].channels[0].combinedMagnitudeSeries).toHaveLength(1);
    expect(normalized.serviceGroups[0].channels[0].modems[0].groupDelaySeries?.points).toHaveLength(2);
  });
});

