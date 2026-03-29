import { cloneGenericSystemDescription } from "@/lib/pypnm/genericSystemDescription";
import type { SingleHistogramCaptureResponse } from "@/types/api";

export const singleHistogramFixture: SingleHistogramCaptureResponse = {
  system_description: cloneGenericSystemDescription(),
  mac_address: "aa:bb:cc:dd:ee:ff",
  status: 0,
  message: null,
  data: {
    analysis: [
      {
        mac_address: "aa:bb:cc:dd:ee:ff",
        pnm_header: {
          capture_time: "1772952501",
        },
        device_details: {
          system_description: cloneGenericSystemDescription(),
        },
        hit_counts: [0, 3, 6, 11, 19, 26, 31, 28, 24, 18, 13, 7, 4, 2, 1, 0],
      },
    ],
  },
};
