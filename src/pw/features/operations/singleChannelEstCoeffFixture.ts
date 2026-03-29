import { cloneGenericSystemDescription } from "@/lib/pypnm/genericSystemDescription";
import type { SingleChannelEstCoeffCaptureResponse } from "@/types/api";

export const singleChannelEstCoeffFixture: SingleChannelEstCoeffCaptureResponse = {
  system_description: cloneGenericSystemDescription(),
  mac_address: "aa:bb:cc:dd:ee:ff",
  status: 0,
  message: null,
  data: {
    analysis: [
      {
        mac_address: "aa:bb:cc:dd:ee:ff",
        channel_id: 194,
        pnm_header: { capture_time: 1772952501 },
        device_details: {
          system_description: cloneGenericSystemDescription(),
        },
        carrier_values: {
          carrier_count: 8,
          frequency: [1027000000, 1027050000, 1027100000, 1027150000, 1027200000, 1027250000, 1027300000, 1027350000],
          magnitudes: [-0.4, -0.8, -0.2, 0.1, -0.6, -1.0, -0.5, -0.1],
          group_delay: {
            magnitude: [9.8, 10.4, 9.9, 10.2, 11.1, 10.6, 10.0, 9.7],
          },
        },
        signal_statistics: {
          mean: -0.4375,
          median: -0.45,
          std: 0.3496,
          variance: 0.1222,
          power: 3.2,
          peak_to_peak: 1.1,
          mean_abs_deviation: 0.2875,
          skewness: -0.4123,
          kurtosis: 2.1044,
          crest_factor: 1.9231,
        },
        echo: {
          report: {
            cable_type: "QR540",
            velocity_factor: 0.87,
            prop_speed_mps: 260825508,
            echoes: [
              { time_s: 0.000000105, amplitude: 0.081, distance_m: 13.69, distance_ft: 44.92 },
              { time_s: 0.000000221, amplitude: 0.034, distance_m: 28.80, distance_ft: 94.49 },
            ],
          },
        },
      },
      {
        mac_address: "aa:bb:cc:dd:ee:ff",
        channel_id: 196,
        pnm_header: { capture_time: 1772952501 },
        device_details: {
          system_description: cloneGenericSystemDescription(),
        },
        carrier_values: {
          carrier_count: 8,
          frequency: [1039000000, 1039050000, 1039100000, 1039150000, 1039200000, 1039250000, 1039300000, 1039350000],
          magnitudes: [0.2, -0.1, -0.4, -0.2, 0.1, 0.0, -0.3, -0.1],
          group_delay: {
            magnitude: [8.9, 9.1, 9.2, 8.8, 9.0, 9.1, 8.9, 8.7],
          },
        },
        signal_statistics: {
          mean: -0.1,
          median: -0.1,
          std: 0.195,
          variance: 0.038,
          power: 2.8,
          peak_to_peak: 0.6,
          mean_abs_deviation: 0.1625,
          skewness: 0.082,
          kurtosis: 1.804,
          crest_factor: 1.331,
        },
        echo: {
          report: {
            cable_type: "QR540",
            velocity_factor: 0.87,
            prop_speed_mps: 260825508,
            echoes: [],
          },
        },
      },
    ],
    primative: [
      {
        channel_id: 194,
        subcarrier_spacing: 25000,
        occupied_channel_bandwidth: 192000000,
        values: [
          [-3.0, -3.2], [-3.1, -3.0], [-1.2, -1.1], [-1.0, -1.2], [1.2, 1.0], [1.0, 1.1], [3.1, 3.0], [3.0, 3.2],
        ],
      },
      {
        channel_id: 196,
        subcarrier_spacing: 25000,
        occupied_channel_bandwidth: 192000000,
        values: [
          [-3.2, -3.1], [-3.0, -3.0], [-1.1, -0.9], [-1.0, -1.1], [1.1, 1.0], [1.0, 1.2], [3.0, 3.1], [3.1, 3.2],
        ],
      },
    ],
    measurement_stats: [
      {
        index: 1,
        channel_id: 194,
        entry: {
          docsPnmCmOfdmChEstCoefFileName: "cm_194_194.bin",
          docsPnmCmOfdmChEstCoefMeasStatus: "sample_ready",
          docsPnmCmOfdmChEstCoefAmpRipplePkToPk: 1.1,
          docsPnmCmOfdmChEstCoefAmpRippleRms: 0.35,
          docsPnmCmOfdmChEstCoefAmpSlope: -0.02,
          docsPnmCmOfdmChEstCoefAmpMean: -0.44,
          docsPnmCmOfdmChEstCoefGrpDelayRipplePkToPk: 1.4,
          docsPnmCmOfdmChEstCoefGrpDelayRippleRms: 0.42,
          docsPnmCmOfdmChEstCoefGrpDelaySlope: 0.03,
          docsPnmCmOfdmChEstCoefGrpDelayMean: 10.21,
        },
      },
      {
        index: 2,
        channel_id: 196,
        entry: {
          docsPnmCmOfdmChEstCoefFileName: "cm_196_196.bin",
          docsPnmCmOfdmChEstCoefMeasStatus: "sample_ready",
          docsPnmCmOfdmChEstCoefAmpRipplePkToPk: 0.6,
          docsPnmCmOfdmChEstCoefAmpRippleRms: 0.2,
          docsPnmCmOfdmChEstCoefAmpSlope: -0.01,
          docsPnmCmOfdmChEstCoefAmpMean: -0.1,
          docsPnmCmOfdmChEstCoefGrpDelayRipplePkToPk: 0.5,
          docsPnmCmOfdmChEstCoefGrpDelayRippleRms: 0.18,
          docsPnmCmOfdmChEstCoefGrpDelaySlope: 0.01,
          docsPnmCmOfdmChEstCoefGrpDelayMean: 8.96,
        },
      },
    ],
  },
};
