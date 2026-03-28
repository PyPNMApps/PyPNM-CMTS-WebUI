import type { InterfaceStatsResponse } from "@/types/api";

export const singleInterfaceStatsFixture: InterfaceStatsResponse = {
  mac_address: "aa:bb:cc:dd:ee:ff",
  status: 0,
  message: "Interface statistics retrieved successfully",
  system_description: {
    VENDOR: "CommScope",
    MODEL: "CM8200A",
    HW_REV: "3",
    SW_REV: "9.1.103",
    BOOTR: "2.4.18",
  },
  results: {
    bridge: {
      ifIndexes: {
        "1": { ifName: "eth0", ifDescription: "Ethernet LAN" },
        "2": { ifName: "rfMac2", ifDescription: "DOCSIS MAC Layer" },
        "193": { ifName: "ofdm193", ifDescription: "OFDM Downstream 193" },
        "5": { ifName: "us5", ifDescription: "SCQAM Upstream 5" },
      },
    },
    ethernetCsmacd: [
      {
        ifEntry: {
          ifIndex: 1,
          ifDescr: "Ethernet LAN",
          ifType: 6,
          ifSpeed: 1000000000,
          ifAdminStatus: 1,
          ifOperStatus: 1,
          ifInOctets: 15234881,
          ifOutOctets: 18422317,
        },
        ifXEntry: {
          ifName: "eth0",
          ifHighSpeed: 1000,
          ifHCInOctets: 15234881,
          ifHCOutOctets: 18422317,
        },
      },
    ],
    docsCableMaclayer: [
      {
        ifEntry: {
          ifIndex: 2,
          ifDescr: "DOCSIS MAC Layer",
          ifType: 127,
          ifSpeed: 1000000000,
          ifAdminStatus: 1,
          ifOperStatus: 1,
          ifInOctets: 612384881,
          ifOutOctets: 584223317,
        },
        ifXEntry: {
          ifName: "rfMac2",
          ifHighSpeed: 1000,
          ifHCInOctets: 612384881,
          ifHCOutOctets: 584223317,
        },
      },
    ],
    docsOfdmDownstream: [
      {
        ifEntry: {
          ifIndex: 193,
          ifDescr: "OFDM Downstream 193",
          ifType: 277,
          ifSpeed: 190000000,
          ifAdminStatus: 1,
          ifOperStatus: 1,
          ifInOctets: 4822384881,
          ifOutOctets: 0,
        },
        ifXEntry: {
          ifName: "ofdm193",
          ifHighSpeed: 190,
          ifHCInOctets: 4822384881,
          ifHCOutOctets: 0,
        },
      },
    ],
    docsCableUpstream: [
      {
        ifEntry: {
          ifIndex: 5,
          ifDescr: "SCQAM Upstream 5",
          ifType: 129,
          ifSpeed: 51200000,
          ifAdminStatus: 1,
          ifOperStatus: 2,
          ifInOctets: 0,
          ifOutOctets: 18223317,
        },
        ifXEntry: {
          ifName: "us5",
          ifHighSpeed: 51,
          ifHCInOctets: 0,
          ifHCOutOctets: 18223317,
        },
      },
    ],
  },
};
