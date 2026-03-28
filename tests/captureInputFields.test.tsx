// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  CaptureCommunityField,
  CaptureIpAddressField,
  CaptureMacAddressField,
} from "@/components/common/CaptureInputFields";
import { captureInputAutocomplete } from "@/features/operations/captureInputAutocomplete";

describe("CaptureInputFields", () => {
  it("renders shared capture fields with autocomplete and masked community", () => {
    render(
      <>
        <CaptureMacAddressField id="testMac" />
        <CaptureIpAddressField id="testIp" />
        <CaptureCommunityField id="testCommunity" />
      </>,
    );

    const macInput = document.getElementById("testMac");
    const ipInput = document.getElementById("testIp");
    const communityInput = document.getElementById("testCommunity");

    expect(screen.getByText("MAC Address")).toBeTruthy();
    expect(screen.getByText("IP Address")).toBeTruthy();
    expect(screen.getByText("SNMP RW Community")).toBeTruthy();
    expect(macInput?.getAttribute("autocomplete")).toBe(captureInputAutocomplete.macAddress);
    expect(ipInput?.getAttribute("autocomplete")).toBe(captureInputAutocomplete.ipAddress);
    expect(communityInput?.getAttribute("autocomplete")).toBe(captureInputAutocomplete.community);
    expect(communityInput?.getAttribute("type")).toBe("password");
  });
});
