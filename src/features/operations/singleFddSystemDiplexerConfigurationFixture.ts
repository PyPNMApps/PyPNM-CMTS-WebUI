import type { FddSystemDiplexerConfigurationResponse } from "@/types/api";

export const singleFddSystemDiplexerConfigurationFixture: FddSystemDiplexerConfigurationResponse = {
  mac_address: "aa:bb:cc:dd:ee:ff",
  status: 0,
  message: "Successfully retrieved FDD diplexer configuration",
  system_description: {
    VENDOR: "CommScope",
    MODEL: "DOCSIS4-CM",
    HW_REV: "1",
    SW_REV: "4.0.17",
    BOOTR: "1.2.6",
  },
  results: {
    index: 1,
    entry: {
      docsFddCmFddSystemCfgStateDiplexerDsLowerBandEdgeCfg: 258,
      docsFddCmFddSystemCfgStateDiplexerDsUpperBandEdgeCfg: 1218,
      docsFddCmFddSystemCfgStateDiplexerUsUpperBandEdgeCfg: 204,
    },
  },
};
