import { describe, expect, it } from "vitest";
import { normalizeServingGroupOfdmaPreEqResultsPayload } from "../src/pcw/features/serving-group/lib/ofdmaPreEqResults";

describe("normalizeServingGroupOfdmaPreEqResultsPayload", () => {
  it("normalizes SG OFDMA PreEq results into chart-friendly groups/channels/modems", () => {
    const payload = {
      status: "ok",
      message: "results ready",
      results: {
        serving_groups: [
          {
            service_group_id: 1,
            channels: [
              {
                channel_id: 7,
                cable_modems: [
                  {
                    mac_address: "aa:bb:cc:dd:ee:ff",
                    system_description: {
                      MODEL: "CPE-1",
                      SW_REV: "1.2.3",
                      VENDOR: "Acme",
                    },
                    pre_equalization_data: {
                      analysis: {
                        channel_id: 7,
                        subcarrier_spacing: 25000,
                        pnm_header: {
                          file_type_version: 6,
                          capture_time: 1774739979,
                        },
                        carrier_values: {
                          frequency: [39900000, 39925000],
                          magnitudes: [-1.7, -1.6],
                          channel_estimate_magnitude_db: [-1.5, -1.4],
                          group_delay: {
                            magnitude: [0.1, 0.2],
                          },
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

    const normalized = normalizeServingGroupOfdmaPreEqResultsPayload(payload);

    expect(normalized.serviceGroups).toHaveLength(1);
    expect(normalized.serviceGroups[0].channels).toHaveLength(1);
    expect(normalized.serviceGroups[0].channels[0].modems).toHaveLength(1);
    expect(normalized.serviceGroups[0].channels[0].combinedCoefficientSeries).toHaveLength(1);
    expect(normalized.serviceGroups[0].channels[0].modems[0].coefficientSeries.points).toHaveLength(2);
    expect(normalized.serviceGroups[0].channels[0].modems[0].groupDelaySeries?.points).toHaveLength(2);
  });
});
