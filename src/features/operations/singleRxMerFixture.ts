import { cloneGenericSystemDescription } from "@/lib/pypnm/genericSystemDescription";
import type { SingleRxMerCaptureResponse } from "@/types/api";

export const singleRxMerFixture: SingleRxMerCaptureResponse = {
  system_description: cloneGenericSystemDescription(),
  mac_address: "aa:bb:cc:dd:ee:ff",
  status: 0,
  message: null,
  data: {
    analysis: [
      {
        mac_address: "aa:bb:cc:dd:ee:ff",
        channel_id: 194,
        pnm_header: {
          capture_time: 1772952501,
        },
        subcarrier_spacing: 25000,
        first_active_subcarrier_index: 296,
        subcarrier_zero_frequency: 1019600000,
        carrier_values: {
          carrier_count: 16,
          frequency: [
            1027000000, 1027025000, 1027050000, 1027075000, 1027100000, 1027125000, 1027150000, 1027175000,
            1027200000, 1027225000, 1027250000, 1027275000, 1027300000, 1027325000, 1027350000, 1027375000,
          ],
          magnitude: [45.75, 45.0, 44.5, 45.5, 43.75, 44.0, 44.25, 43.75, 44.25, 44.75, 45.0, 44.75, 42.75, 44.75, 45.25, 44.25],
        },
        modulation_statistics: {
          bits_per_symbol: [11.0, 10.5, 10.0, 10.5, 9.5, 10.0],
          supported_modulation_counts: {
            qam_256: 60,
            qam_512: 120,
            qam_1024: 320,
            qam_2048: 700,
            qam_4096: 6400,
          },
        },
        regression: {
          slope: [45.8, 45.6, 45.4, 45.2, 45.0, 44.8, 44.6, 44.4, 44.2, 44.0, 43.8, 43.6, 43.4, 43.2, 43.0, 42.8],
        },
        device_details: {
          system_description: cloneGenericSystemDescription(),
        },
      },
      {
        mac_address: "aa:bb:cc:dd:ee:ff",
        channel_id: 196,
        subcarrier_spacing: 25000,
        first_active_subcarrier_index: 296,
        subcarrier_zero_frequency: 1031600000,
        carrier_values: {
          carrier_count: 16,
          frequency: [
            1039000000, 1039025000, 1039050000, 1039075000, 1039100000, 1039125000, 1039150000, 1039175000,
            1039200000, 1039225000, 1039250000, 1039275000, 1039300000, 1039325000, 1039350000, 1039375000,
          ],
          magnitude: [46.25, 46.0, 45.75, 46.1, 45.6, 45.2, 45.5, 45.75, 46.0, 46.1, 45.9, 45.4, 45.1, 45.6, 45.95, 46.2],
        },
        modulation_statistics: {
          bits_per_symbol: [11.2, 11.0, 10.8, 10.5, 10.2, 10.0],
          supported_modulation_counts: {
            qam_256: 25,
            qam_512: 75,
            qam_1024: 180,
            qam_2048: 520,
            qam_4096: 6700,
          },
        },
        regression: {
          slope: [46.2, 46.15, 46.1, 46.05, 46.0, 45.95, 45.9, 45.85, 45.8, 45.75, 45.7, 45.65, 45.6, 45.55, 45.5, 45.45],
        },
        device_details: {
          system_description: cloneGenericSystemDescription(),
        },
      },
    ],
  },
};
