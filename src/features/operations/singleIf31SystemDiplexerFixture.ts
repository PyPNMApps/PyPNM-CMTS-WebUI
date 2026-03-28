import type { If31SystemDiplexerResponse } from "@/types/api";

export const singleIf31SystemDiplexerFixture: If31SystemDiplexerResponse = {
  mac_address: "aa:bb:cc:dd:ee:ff",
  status: 0,
  message: "Successfully retrieved DOCSIS 3.1 diplexer configuration",
  system_description: {
    VENDOR: "CommScope",
    MODEL: "DOCSIS31-CM",
    HW_REV: "2",
    SW_REV: "10.2.1",
    BOOTR: "3.0.4",
  },
  results: {
    diplexer: {
      diplexer_capability: 3,
      cfg_band_edge: 204000000,
      ds_lower_capability: 2,
      cfg_ds_lower_band_edge: 258000000,
      ds_upper_capability: 4,
      cfg_ds_upper_band_edge: 1218000000,
    },
  },
};
