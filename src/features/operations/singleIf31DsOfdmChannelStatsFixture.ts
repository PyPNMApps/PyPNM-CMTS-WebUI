import { cloneGenericSystemDescription } from "@/lib/pypnm/genericSystemDescription";
import type { If31DsOfdmChannelStatsResponse } from "@/types/api";

export const singleIf31DsOfdmChannelStatsFixture: If31DsOfdmChannelStatsResponse = {
  system_description: cloneGenericSystemDescription(),
  status: 0,
  message: "Successfully retrieved downstream OFDM channel statistics",
  device: {
    mac_address: "aa:bb:cc:dd:ee:ff",
    system_description: cloneGenericSystemDescription(),
  },
  results: [
    {
      index: 48,
      channel_id: 194,
      entry: {
        docsIf31CmDsOfdmChanChannelId: 194,
        docsIf31CmDsOfdmChanChanIndicator: "backupPrimary",
        docsIf31CmDsOfdmChanSubcarrierZeroFreq: 1019600000,
        docsIf31CmDsOfdmChanFirstActiveSubcarrierNum: 296,
        docsIf31CmDsOfdmChanLastActiveSubcarrierNum: 7895,
        docsIf31CmDsOfdmChanNumActiveSubcarriers: 7528,
        docsIf31CmDsOfdmChanSubcarrierSpacing: 25000,
        docsIf31CmDsOfdmChanCyclicPrefix: 256,
        docsIf31CmDsOfdmChanRollOffPeriod: 128,
        docsIf31CmDsOfdmChanPlcFreq: 1150000000,
        docsIf31CmDsOfdmChanNumPilots: 56,
        docsIf31CmDsOfdmChanTimeInterleaverDepth: 16,
        docsIf31CmDsOfdmChanPlcTotalCodewords: 32837417,
        docsIf31CmDsOfdmChanPlcUnreliableCodewords: 0,
        docsIf31CmDsOfdmChanNcpTotalFields: 210146720,
        docsIf31CmDsOfdmChanNcpFieldCrcFailures: 0,
      },
    },
    {
      index: 49,
      channel_id: 193,
      entry: {
        docsIf31CmDsOfdmChanChannelId: 193,
        docsIf31CmDsOfdmChanChanIndicator: "backupPrimary",
        docsIf31CmDsOfdmChanSubcarrierZeroFreq: 827600000,
        docsIf31CmDsOfdmChanFirstActiveSubcarrierNum: 296,
        docsIf31CmDsOfdmChanLastActiveSubcarrierNum: 7895,
        docsIf31CmDsOfdmChanNumActiveSubcarriers: 7528,
        docsIf31CmDsOfdmChanSubcarrierSpacing: 25000,
        docsIf31CmDsOfdmChanCyclicPrefix: 256,
        docsIf31CmDsOfdmChanRollOffPeriod: 128,
        docsIf31CmDsOfdmChanPlcFreq: 930000000,
        docsIf31CmDsOfdmChanNumPilots: 56,
        docsIf31CmDsOfdmChanTimeInterleaverDepth: 16,
        docsIf31CmDsOfdmChanPlcTotalCodewords: 32838607,
        docsIf31CmDsOfdmChanPlcUnreliableCodewords: 0,
        docsIf31CmDsOfdmChanNcpTotalFields: 210153952,
        docsIf31CmDsOfdmChanNcpFieldCrcFailures: 0,
      },
    },
  ],
};
