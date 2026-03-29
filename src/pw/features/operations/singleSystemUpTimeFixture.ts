import type { SystemUpTimeResponse } from "@/types/api";

export const singleSystemUpTimeFixture: SystemUpTimeResponse = {
  mac_address: "aa:bb:cc:dd:ee:ff",
  status: 0,
  message: null,
  device: {
    mac_address: "aa:bb:cc:dd:ee:ff",
    system_description: {
      MODEL: "DOCSIS 3.1 CM",
      VENDOR: "PyPNM Labs",
      SW_REV: "7.4.1",
      HW_REV: "A2",
      BOOTR: "1.0.3",
    },
  },
  results: {
    uptime: "12 days, 04:18:52.000000",
  },
};
