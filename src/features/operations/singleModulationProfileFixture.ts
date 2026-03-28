import { cloneGenericSystemDescription } from "@/lib/pypnm/genericSystemDescription";
import type { SingleModulationProfileCaptureResponse } from "@/types/api";

export const singleModulationProfileFixture: SingleModulationProfileCaptureResponse = {
  system_description: cloneGenericSystemDescription(),
  mac_address: "aa:bb:cc:dd:ee:ff",
  status: 0,
  message: null,
  data: {
    analysis: [
      {
        channel_id: 193,
        mac_address: "aa:bb:cc:dd:ee:ff",
        pnm_header: { capture_time: 1772952501 },
        device_details: {
          system_description: cloneGenericSystemDescription(),
        },
        profiles: [
          {
            profile_id: 0,
            carrier_values: {
              frequency: [835000000, 860000000, 885000000, 910000000, 935000000, 960000000, 985000000, 1010000000],
              modulation: ["qam_1024"],
              shannon_min_mer: [38.2, 38.4, 38.1, 38.8, 39.0, 39.2, 39.1, 38.9],
            },
          },
          {
            profile_id: 1,
            carrier_values: {
              frequency: [835000000, 860000000, 885000000, 910000000, 935000000, 960000000, 985000000, 1010000000],
              modulation: ["qam_2048"],
              shannon_min_mer: [40.0, 39.8, 40.2, 40.4, 40.1, 40.3, 40.5, 40.2],
            },
          },
        ],
      },
      {
        channel_id: 195,
        mac_address: "aa:bb:cc:dd:ee:ff",
        pnm_header: { capture_time: 1772952501 },
        profiles: [
          {
            profile_id: 0,
            carrier_values: {
              frequency: [1045000000, 1070000000, 1095000000, 1120000000, 1145000000, 1170000000, 1195000000, 1220000000],
              modulation: ["qam_1024"],
              shannon_min_mer: [37.8, 38.0, 38.3, 38.5, 38.4, 38.6, 38.2, 38.1],
            },
          },
          {
            profile_id: 2,
            carrier_values: {
              frequency: [1045000000, 1070000000, 1095000000, 1120000000, 1145000000, 1170000000, 1195000000, 1220000000],
              modulation: ["qam_4096"],
              shannon_min_mer: [41.5, 41.2, 41.7, 41.9, 41.6, 41.8, 41.4, 41.3],
            },
          },
        ],
      },
    ],
  },
};
