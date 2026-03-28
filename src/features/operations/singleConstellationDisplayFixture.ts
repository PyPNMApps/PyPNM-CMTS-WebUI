import { cloneGenericSystemDescription } from "@/lib/pypnm/genericSystemDescription";
import type { SingleConstellationDisplayCaptureResponse } from "@/types/api";

export const singleConstellationDisplayFixture: SingleConstellationDisplayCaptureResponse = {
  system_description: cloneGenericSystemDescription(),
  mac_address: "aa:bb:cc:dd:ee:ff",
  status: 0,
  message: null,
  data: {
    analysis: [
      {
        channel_id: 193,
        mac_address: "aa:bb:cc:dd:ee:ff",
        modulation_order: 4096,
        num_sample_symbols: 8192,
        pnm_header: { capture_time: 1772952501 },
        device_details: {
          system_description: cloneGenericSystemDescription(),
        },
        soft: [[-3.1, -3.0], [-3.0, -3.2], [-1.0, -1.1], [1.1, 0.9], [3.0, 3.1], [3.2, 2.9]],
        hard: [[-3, -3], [-1, -1], [1, 1], [3, 3]],
      },
      {
        channel_id: 195,
        mac_address: "aa:bb:cc:dd:ee:ff",
        modulation_order: 1024,
        num_sample_symbols: 8192,
        pnm_header: { capture_time: 1772952501 },
        soft: [[-2.0, -2.1], [-2.1, -2.0], [2.1, 2.0], [2.0, 2.1], [0.8, 0.9], [-0.9, -0.8]],
        hard: [[-2, -2], [2, 2], [1, 1], [-1, -1]],
      },
    ],
  },
};
