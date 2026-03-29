import { describe, expect, it } from "vitest";

import {
  buildCaptureConnectivityInputsFromInstance,
  hasCompleteCaptureConnectivityInputs,
  isCaptureConnectivityOnline,
  normalizeCaptureConnectivityInputs,
} from "@/pw/features/operations/captureConnectivity";

describe("captureConnectivity", () => {
  it("normalizes capture connectivity inputs", () => {
    expect(
      normalizeCaptureConnectivityInputs({
        macAddress: " aa:bb:cc:dd:ee:ff ",
        ipAddress: " 192.168.100.10 ",
        community: " private ",
      }),
    ).toEqual({
      macAddress: "aa:bb:cc:dd:ee:ff",
      ipAddress: "192.168.100.10",
      community: "private",
    });
  });

  it("detects when capture connectivity inputs are complete", () => {
    expect(
      hasCompleteCaptureConnectivityInputs({
        macAddress: "aa:bb:cc:dd:ee:ff",
        ipAddress: "192.168.100.10",
        community: "private",
      }),
    ).toBe(true);
    expect(
      hasCompleteCaptureConnectivityInputs({
        macAddress: "aa:bb:cc:dd:ee:ff",
        ipAddress: "",
        community: "private",
      }),
    ).toBe(false);
  });

  it("only allows execution when the modem is online", () => {
    expect(isCaptureConnectivityOnline("online")).toBe(true);
    expect(isCaptureConnectivityOnline("unknown")).toBe(false);
    expect(isCaptureConnectivityOnline("checking")).toBe(false);
    expect(isCaptureConnectivityOnline("offline")).toBe(false);
  });

  it("seeds connectivity inputs from selected-instance defaults when complete", () => {
    expect(
      buildCaptureConnectivityInputsFromInstance({
        requestDefaults: {
          cableModemMacAddress: " FC:77:7B:0B:1B:E0 ",
          cableModemIpAddress: " 172.19.32.53 ",
          tftpIpv4: "",
          tftpIpv6: "",
          channelIds: "0",
          snmpRwCommunity: " private ",
        },
      }),
    ).toEqual({
      macAddress: "FC:77:7B:0B:1B:E0",
      ipAddress: "172.19.32.53",
      community: "private",
    });
  });
});
