import type { SingleRxMerSystemDescription } from "@/types/api";

export const GENERIC_SYSTEM_DESCRIPTION: SingleRxMerSystemDescription = {
  HW_REV: "1.0",
  VENDOR: "LANCity",
  BOOTR: "NONE",
  SW_REV: "1.0.0",
  MODEL: "LCPET-3",
};

export function cloneGenericSystemDescription(): SingleRxMerSystemDescription {
  return { ...GENERIC_SYSTEM_DESCRIPTION };
}
