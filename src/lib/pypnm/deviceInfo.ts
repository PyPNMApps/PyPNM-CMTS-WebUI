import type { DeviceInfo } from "@/features/analysis/types";
import type { SingleRxMerSystemDescription } from "@/types/api";

export function toDeviceInfo(system: SingleRxMerSystemDescription | undefined, macAddress: string | undefined): DeviceInfo {
  return {
    macAddress: macAddress ?? "n/a",
    MODEL: system?.MODEL ?? "n/a",
    VENDOR: system?.VENDOR ?? "n/a",
    SW_REV: system?.SW_REV ?? "n/a",
    HW_REV: system?.HW_REV ?? "n/a",
    BOOTR: system?.BOOTR ?? "n/a",
  };
}
