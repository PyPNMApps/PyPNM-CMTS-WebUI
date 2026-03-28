import type { DeviceEventLogResponse } from "@/types/api";

export const singleDeviceEventLogFixture: DeviceEventLogResponse = {
  mac_address: "aa:bb:cc:dd:ee:ff",
  status: 0,
  message: null,
  system_description: {
    MODEL: "DOCSIS 3.1 CM",
    VENDOR: "PyPNM Labs",
    SW_REV: "7.4.1",
    HW_REV: "A2",
    BOOTR: "1.0.3",
  },
  logs: [
    {
      docsDevEvFirstTime: "2026-03-14T00:12:30Z",
      docsDevEvLastTime: "2026-03-14T00:12:30Z",
      docsDevEvCounts: 1,
      docsDevEvLevel: 5,
      docsDevEvId: 16,
      docsDevEvText: "TLV-11 - unrecognized OID; CMTS-MAC=001122334455; Chan ID: 193; Event Type Code: 16;",
    },
    {
      docsDevEvFirstTime: "2026-03-14T01:02:00Z",
      docsDevEvLastTime: "2026-03-14T01:10:00Z",
      docsDevEvCounts: 4,
      docsDevEvLevel: 6,
      docsDevEvId: 24,
      docsDevEvText: "MDD message timeout; DSID: 193/1; Profile ID: 0; CMTS-MAC=665544332211; Event Type Code: 24;",
    },
    {
      docsDevEvFirstTime: "2026-03-14T01:02:00Z",
      docsDevEvLastTime: "2026-03-14T01:10:00Z",
      docsDevEvCounts: 4,
      docsDevEvLevel: 6,
      docsDevEvId: 24,
      docsDevEvText: "MDD message timeout; DSID: 193/1; Profile ID: 0; CMTS-MAC=665544332211; Event Type Code: 24;",
    },
    {
      docsDevEvFirstTime: "2026-03-14T02:40:20Z",
      docsDevEvLastTime: "2026-03-14T02:41:50Z",
      docsDevEvCounts: 2,
      docsDevEvLevel: 4,
      docsDevEvId: 7,
      docsDevEvText: "Dynamic Profile update complete; New Profile: 2; US Chan ID: 5; Event Type Code: 7;",
    },
  ],
};
