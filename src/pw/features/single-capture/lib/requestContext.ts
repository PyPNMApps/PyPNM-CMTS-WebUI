import { useMemo } from "react";

import type { PypnmInstance } from "@/types/config";
import type { CommonRequestFormDefaults } from "@/pw/features/operations/useRequestFormDefaults";
import type { CaptureConnectivityInputs } from "@/pw/features/operations/captureConnectivity";
import {
  buildCaptureConnectivityInputsFromInstance,
  normalizeCaptureConnectivityInputs,
} from "@/pw/features/operations/captureConnectivity";
import { readSelectedModemContext } from "@/pw/features/single-capture/lib/selectedModemContext";

export interface SingleCaptureRequestContext {
  requestDefaultsOverride?: Partial<CommonRequestFormDefaults>;
  preferredConnectivityInputs: CaptureConnectivityInputs | null;
}

export function useSingleCaptureRequestContext(
  isSingleCaptureRoute: boolean,
  _routePath: string,
  selectedInstance: PypnmInstance | null | undefined,
): SingleCaptureRequestContext {
  return useMemo(() => {
    if (!isSingleCaptureRoute) {
      return {
        requestDefaultsOverride: undefined,
        preferredConnectivityInputs: buildCaptureConnectivityInputsFromInstance(selectedInstance),
      };
    }

    const selectedModem = readSelectedModemContext();
    if (!selectedModem) {
      return {
        requestDefaultsOverride: undefined,
        preferredConnectivityInputs: buildCaptureConnectivityInputsFromInstance(selectedInstance),
      };
    }

    const requestDefaultsOverride: Partial<CommonRequestFormDefaults> = {
      macAddress: selectedModem.macAddress,
      ipAddress: selectedModem.ipAddress === "n/a" ? "" : selectedModem.ipAddress,
      community: selectedModem.snmpCommunity,
      channelIds: "",
    };

    const preferredConnectivityInputs = (
      requestDefaultsOverride.macAddress
      && requestDefaultsOverride.ipAddress
      && requestDefaultsOverride.community
    )
      ? normalizeCaptureConnectivityInputs({
        macAddress: requestDefaultsOverride.macAddress,
        ipAddress: requestDefaultsOverride.ipAddress,
        community: requestDefaultsOverride.community,
      })
      : buildCaptureConnectivityInputsFromInstance(selectedInstance);

    return {
      requestDefaultsOverride,
      preferredConnectivityInputs,
    };
  }, [isSingleCaptureRoute, selectedInstance]);
}
