import type { FddDiplexerBandEdgeCapabilityResponse } from "@/types/api";

export const singleFddDiplexerBandEdgeCapabilityFixture: FddDiplexerBandEdgeCapabilityResponse = {
  mac_address: "aa:bb:cc:dd:ee:ff",
  status: 0,
  message: "Successfully retrieved FDD diplexer band edge capabilities",
  system_description: {
    VENDOR: "CommScope",
    MODEL: "DOCSIS4-CM",
    HW_REV: "1",
    SW_REV: "4.0.17",
    BOOTR: "1.2.6",
  },
  results: [
    {
      index: 1,
      entry: {
        docsFddDiplexerUsUpperBandEdgeCapability: 204,
        docsFddDiplexerDsLowerBandEdgeCapability: 258,
        docsFddDiplexerDsUpperBandEdgeCapability: 1218,
      },
    },
    {
      index: 2,
      entry: {
        docsFddDiplexerUsUpperBandEdgeCapability: 396,
        docsFddDiplexerDsLowerBandEdgeCapability: 492,
        docsFddDiplexerDsUpperBandEdgeCapability: 1794,
      },
    },
    {
      index: 3,
      entry: {
        docsFddDiplexerUsUpperBandEdgeCapability: 0,
        docsFddDiplexerDsLowerBandEdgeCapability: 684,
        docsFddDiplexerDsUpperBandEdgeCapability: 0,
      },
    },
  ],
};
