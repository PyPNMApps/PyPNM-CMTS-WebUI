import { cloneGenericSystemDescription } from "@/lib/pypnm/genericSystemDescription";
import type { SingleFecSummaryCaptureResponse } from "@/types/api";

export const singleFecSummaryFixture: SingleFecSummaryCaptureResponse = {
  system_description: cloneGenericSystemDescription(),
  mac_address: "aa:bb:cc:dd:ee:ff",
  status: 0,
  message: null,
  data: {
    analysis: [
      {
        channel_id: 193,
        device_details: {
          system_description: cloneGenericSystemDescription(),
        },
        profiles: [
          {
            profile: 0,
            codewords: {
              timestamps: [1772952501, 1772952561, 1772952621, 1772952681, 1772952741, 1772952801],
              total_codewords: [410000, 415000, 421000, 428500, 432000, 438000],
              corrected: [1200, 1160, 1400, 1625, 1710, 1805],
              uncorrected: [8, 9, 12, 11, 14, 13],
            },
          },
          {
            profile: 1,
            codewords: {
              timestamps: [1772952501, 1772952561, 1772952621, 1772952681, 1772952741, 1772952801],
              total_codewords: [380000, 386000, 390500, 395000, 401000, 407500],
              corrected: [620, 700, 760, 805, 910, 950],
              uncorrected: [2, 4, 3, 5, 4, 6],
            },
          },
        ],
      },
      {
        channel_id: 195,
        profiles: [
          {
            profile: 0,
            codewords: {
              timestamps: [1772952501, 1772952561, 1772952621, 1772952681, 1772952741, 1772952801],
              total_codewords: [445000, 448000, 452500, 458000, 463000, 469500],
              corrected: [540, 590, 610, 700, 760, 830],
              uncorrected: [1, 1, 2, 2, 3, 2],
            },
          },
        ],
      },
    ],
  },
};
