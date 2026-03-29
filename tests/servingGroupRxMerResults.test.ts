import { describe, expect, it } from "vitest";
import { normalizeServingGroupRxMerResultsPayload } from "../src/features/serving-group/lib/rxmerResults";

describe("normalizeServingGroupRxMerResultsPayload", () => {
  it("normalizes SG results into chart-friendly groups/channels/modems", () => {
    const payload = {
      results: {
        serving_groups: [
          {
            service_group_id: 1,
            channels: [
              {
                channel_id: 193,
                cable_modems: [
                  {
                    mac_address: "aa:bb:cc:dd:ee:ff",
                    system_description: {
                      MODEL: "CPE-1",
                      SW_REV: "1.2.3",
                    },
                    rxmer_data: {
                      analysis: {
                        pnm_header: {
                          capture_time: 1774739979,
                        },
                        subcarrier_spacing: 50000,
                        carrier_values: {
                          frequency: [774000000, 774050000],
                          magnitude: [45.5, 46.2],
                        },
                        regression: {
                          slope: [45.0, 46.0],
                        },
                        modulation_statistics: {
                          supported_modulation_counts: {
                            qam_1024: 12,
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

    const normalized = normalizeServingGroupRxMerResultsPayload(payload);
    expect(normalized.serviceGroups).toHaveLength(1);
    expect(normalized.serviceGroups[0].channels).toHaveLength(1);
    expect(normalized.serviceGroups[0].channels[0].modems).toHaveLength(1);
    expect(normalized.serviceGroups[0].channels[0].combinedSeries).toHaveLength(1);
    expect(normalized.serviceGroups[0].channels[0].modems[0].rxMerSeries).toHaveLength(2);
    expect(normalized.serviceGroups[0].channels[0].modems[0].modulationCounts).toEqual({ qam_1024: 12 });
  });

  it("returns empty list when payload has no serving_groups", () => {
    const normalized = normalizeServingGroupRxMerResultsPayload({});
    expect(normalized.serviceGroups).toEqual([]);
  });

  it("suppresses fallback channels with unavailable metadata and records excluded macs", () => {
    const payload = {
      results: {
        serving_groups: [
          {
            service_group_id: 7,
            channels: [
              {
                cable_modems: [
                  {
                    mac_address: "11:22:33:44:55:66",
                    rxmer_data: {
                      analysis: {
                        carrier_values: {
                          magnitude: [44.1, 44.3],
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

    const normalized = normalizeServingGroupRxMerResultsPayload(payload);
    expect(normalized.serviceGroups).toHaveLength(0);
    expect(normalized.missingModems).toEqual([
      expect.objectContaining({
        serviceGroupId: "7",
        channelId: "ch-1",
        macAddress: "11:22:33:44:55:66",
        reason: "Channel metadata unavailable",
      }),
    ]);
  });

  it("sorts channels by frequency within each service group", () => {
    const payload = {
      results: {
        serving_groups: [
          {
            service_group_id: 10,
            channels: [
              {
                channel_id: 194,
                cable_modems: [
                  {
                    mac_address: "11:11:11:11:11:11",
                    rxmer_data: {
                      analysis: {
                        subcarrier_spacing: 50000,
                        carrier_values: {
                          frequency: [810000000, 810050000],
                          magnitude: [45.1, 45.2],
                        },
                      },
                    },
                  },
                ],
              },
              {
                channel_id: 193,
                cable_modems: [
                  {
                    mac_address: "22:22:22:22:22:22",
                    rxmer_data: {
                      analysis: {
                        subcarrier_spacing: 50000,
                        carrier_values: {
                          frequency: [774000000, 774050000],
                          magnitude: [46.1, 46.2],
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

    const normalized = normalizeServingGroupRxMerResultsPayload(payload);
    expect(normalized.serviceGroups).toHaveLength(1);
    expect(normalized.serviceGroups[0].channels.map((channel) => channel.channelId)).toEqual(["193", "194"]);
  });
});
