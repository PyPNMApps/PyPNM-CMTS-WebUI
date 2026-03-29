import { useMemo } from "react";

import { useInstanceConfig } from "@/app/useInstanceConfig";

export interface CommonRequestFormDefaults {
  macAddress: string;
  ipAddress: string;
  tftpIpv4: string;
  tftpIpv6: string;
  channelIds: string;
  community: string;
}

export interface DeviceConnectFormDefaults {
  macAddress: string;
  ipAddress: string;
  community: string;
}

export function useCommonRequestFormDefaults(): CommonRequestFormDefaults {
  const { selectedInstance } = useInstanceConfig();

  return useMemo(
    () => ({
      macAddress: selectedInstance?.requestDefaults.cableModemMacAddress ?? "",
      ipAddress: selectedInstance?.requestDefaults.cableModemIpAddress ?? "",
      tftpIpv4: selectedInstance?.requestDefaults.tftpIpv4 ?? "",
      tftpIpv6: selectedInstance?.requestDefaults.tftpIpv6 ?? "",
      channelIds: selectedInstance?.requestDefaults.channelIds ?? "0",
      community: selectedInstance?.requestDefaults.snmpRwCommunity ?? "private",
    }),
    [selectedInstance],
  );
}

export function useDeviceConnectFormDefaults(): DeviceConnectFormDefaults {
  const { selectedInstance } = useInstanceConfig();

  return useMemo(
    () => ({
      macAddress: selectedInstance?.requestDefaults.cableModemMacAddress ?? "",
      ipAddress: selectedInstance?.requestDefaults.cableModemIpAddress ?? "",
      community: selectedInstance?.requestDefaults.snmpRwCommunity ?? "private",
    }),
    [selectedInstance],
  );
}
