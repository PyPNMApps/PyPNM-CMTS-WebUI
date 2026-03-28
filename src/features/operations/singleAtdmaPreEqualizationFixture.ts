import type { AtdmaPreEqualizationResponse } from "@/types/api";

export const singleAtdmaPreEqualizationFixture: AtdmaPreEqualizationResponse = {
  mac_address: "aa:bb:cc:dd:ee:ff",
  status: 0,
  message: "Successfully retrieved upstream pre-equalization coefficients",
  system_description: {
    VENDOR: "CommScope",
    MODEL: "CM8200A",
    HW_REV: "3",
    SW_REV: "9.1.103",
    BOOTR: "2.4.18",
  },
  results: {
    "3": {
      main_tap_location: 8,
      taps_per_symbol: 8,
      num_taps: 16,
      header_hex: "08 08 10 00",
      velocity_factor: 0.87,
      taps: Array.from({ length: 16 }, (_, index) => {
        const isMain = index === 7;
        const postPeak = index === 10;
        const magnitudeDb = isMain ? 0 : postPeak ? -10.5 : -18 - Math.abs(index - 7) * 1.4;
        return {
          real: isMain ? 1024 : 120 - index * 8,
          imag: isMain ? 0 : 40 - index * 3,
          magnitude: isMain ? 1024 : 80 - index,
          magnitude_power_dB: magnitudeDb,
          real_hex: "03FF",
          imag_hex: "0000",
          delay_us: (index - 7) * 0.125,
          tap_offset: index - 7,
          is_main_tap: isMain,
          delay_samples: (index - 7) / 8,
          cable_length_m: Math.abs(index - 7) * 12.4,
          cable_length_ft: Math.abs(index - 7) * 40.7,
        };
      }),
      metrics: {
        main_tap_ratio: 31.2,
        non_main_tap_energy_ratio: -31.8,
        pre_post_energy_symmetry_ratio: -1.7,
        pre_main_tap_total_energy_ratio: -36.5,
        post_main_tap_total_energy_ratio: -30.4,
        frequency_response: {
          fft_size: 64,
          frequency_bins: Array.from({ length: 64 }, (_, i) => -3.2 + i * 0.1),
          magnitude_power_db_normalized: Array.from({ length: 64 }, (_, i) => Math.sin(i / 7) * 0.7 + Math.cos(i / 11) * 0.25),
        },
      },
      group_delay: {
        fft_size: 64,
        delay_us: Array.from({ length: 64 }, (_, i) => 0.04 * Math.sin(i / 8) + 0.005 * i),
      },
      tap_delay_summary: {
        main_echo_post_tap_index: 10,
      },
    },
  },
};
