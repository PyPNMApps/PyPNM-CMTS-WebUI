import { cloneGenericSystemDescription } from "@/lib/pypnm/genericSystemDescription";
import type { If31DocsisBaseCapabilityResponse } from "@/types/api";

export const singleIf31DocsisBaseCapabilityFixture: If31DocsisBaseCapabilityResponse = {
  mac_address: "aa:bb:cc:dd:ee:ff",
  status: 0,
  message: "DOCSIS Base Capability retrieved successfully.",
  system_description: cloneGenericSystemDescription(),
  results: {
    docsis_version: "DOCSIS_3_1",
    clabs_docsis_version: 6,
  },
};
