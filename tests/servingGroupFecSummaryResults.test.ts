import { describe, expect, it } from "vitest";
import { normalizeServingGroupFecSummaryResultsPayload } from "../src/pcw/features/serving-group/lib/fecSummaryResults";

describe("normalizeServingGroupFecSummaryResultsPayload", () => {
  it("normalizes SG FEC Summary results into chart-friendly groups/channels/modems", () => {
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
                    fec_summary_data: {
                      analysis: {
                        pnm_header: {
                          capture_time: 1774739979,
                        },
                        profiles: [
                          {
                            profile: 255,
                            codewords: {
                              timestamps: [1774739979, 1774740039],
                              total: [1000, 1200],
                              corrected: [10, 12],
                              uncorrected: [1, 2],
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
                    fec_summary_data: {
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

    const normalized = normalizeServingGroupFecSummaryResultsPayload(payload);
    expect(normalized.serviceGroups).toHaveLength(1);
    expect(normalized.serviceGroups[0].channels).toHaveLength(1);
    expect(normalized.serviceGroups[0].channels[0].modems).toHaveLength(1);
    expect(normalized.serviceGroups[0].channels[0].modems[0].profiles).toHaveLength(1);
    expect(normalized.missingModems).toHaveLength(1);
    expect(normalized.missingModems[0]?.reason).toContain("modem ip address missing");
  });
});
