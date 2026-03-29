import { useEffect } from "react";

import type { PypnmInstance } from "@/types/config";

export interface CaptureConnectivityInputs {
  macAddress: string;
  ipAddress: string;
  community: string;
}

export type CaptureConnectivityStatus = "unknown" | "checking" | "online" | "offline";

export function normalizeCaptureConnectivityInputs(inputs: CaptureConnectivityInputs): CaptureConnectivityInputs {
  return {
    macAddress: inputs.macAddress.trim(),
    ipAddress: inputs.ipAddress.trim(),
    community: inputs.community.trim(),
  };
}

export function buildCaptureConnectivityInputsFromInstance(
  instance: Pick<PypnmInstance, "requestDefaults"> | null | undefined,
): CaptureConnectivityInputs | null {
  if (!instance) {
    return null;
  }

  const inputs = normalizeCaptureConnectivityInputs({
    macAddress: instance.requestDefaults.cableModemMacAddress,
    ipAddress: instance.requestDefaults.cableModemIpAddress,
    community: instance.requestDefaults.snmpRwCommunity,
  });

  return hasCompleteCaptureConnectivityInputs(inputs) ? inputs : null;
}

export function hasCompleteCaptureConnectivityInputs(inputs: CaptureConnectivityInputs | null): inputs is CaptureConnectivityInputs {
  return Boolean(inputs?.macAddress && inputs.ipAddress && inputs.community);
}

export function isCaptureConnectivityOnline(status: CaptureConnectivityStatus): boolean {
  return status === "online";
}

export function useReportCaptureConnectivityInputs(
  inputs: CaptureConnectivityInputs,
  onChange?: (inputs: CaptureConnectivityInputs) => void,
) {
  const { macAddress, ipAddress, community } = inputs;

  useEffect(() => {
    if (!onChange) {
      return;
    }
    onChange(
      normalizeCaptureConnectivityInputs({
        macAddress,
        ipAddress,
        community,
      }),
    );
  }, [community, ipAddress, macAddress, onChange]);
}
