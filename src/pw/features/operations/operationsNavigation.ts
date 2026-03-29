import { LONG_RUNNING_OPERATION_TIMEOUT_MS } from "@/lib/constants";
import { toPwApiPath } from "@/lib/pwCompat";

export interface OperationNavigationItem {
  id: string;
  label: string;
  routePath: string;
  endpointPath: string;
  description: string;
  menuPath: [string, string];
  requestTimeoutMs?: number;
  showInOperationsMenu?: boolean;
}

// Edit this file to add top-row operation navigation entries.
const rawOperationNavigationItems: OperationNavigationItem[] = [
  {
    id: "docs-if31-docsis-basecapability",
    label: "Base Capability",
    routePath: "/operations/if31-docsis-base-capability",
    endpointPath: "/docs/if31/docsis/baseCapability",
    description: "DOCSIS 3.1 base capability visual.",
    menuPath: ["DOCSIS 3.1", "DOCSIS"],
    requestTimeoutMs: LONG_RUNNING_OPERATION_TIMEOUT_MS,
  },
  {
    id: "docs-if31-ds-ofdm-chan-stats",
    label: "OFDM Channel Stats",
    routePath: "/operations/ds-ofdm-channel-stats",
    endpointPath: "/docs/if31/ds/ofdm/chan/stats",
    description: "DOCSIS 3.1 downstream OFDM channel statistics visual.",
    menuPath: ["DOCSIS 3.1", "Downstream"],
    requestTimeoutMs: LONG_RUNNING_OPERATION_TIMEOUT_MS,
  },
  {
    id: "docs-if31-ds-ofdm-profile-stats",
    label: "OFDM Profile Stats",
    routePath: "/operations/ds-ofdm-profile-stats",
    endpointPath: "/docs/if31/ds/ofdm/profile/stats",
    description: "DOCSIS 3.1 downstream OFDM profile statistics visual.",
    menuPath: ["DOCSIS 3.1", "Downstream"],
    requestTimeoutMs: LONG_RUNNING_OPERATION_TIMEOUT_MS,
  },
  {
    id: "docs-if31-system-diplexer",
    label: "System Diplexer",
    routePath: "/operations/if31-system-diplexer",
    endpointPath: "/docs/if31/system/diplexer",
    description: "DOCSIS 3.1 system diplexer configuration visual.",
    menuPath: ["DOCSIS 3.1", "System"],
    requestTimeoutMs: LONG_RUNNING_OPERATION_TIMEOUT_MS,
  },
  {
    id: "docs-if31-us-ofdma-channel-stats",
    label: "OFDMA Channel Stats",
    routePath: "/operations/us-ofdma-channel-stats",
    endpointPath: "/docs/if31/us/ofdma/channel/stats",
    description: "DOCSIS 3.1 upstream OFDMA channel statistics visual.",
    menuPath: ["DOCSIS 3.1", "Upstream"],
    requestTimeoutMs: LONG_RUNNING_OPERATION_TIMEOUT_MS,
  },
  {
    id: "docs-fdd-diplexer-bandedgecapability",
    label: "Diplexer Band Edge Capability",
    routePath: "/operations/fdd-diplexer-band-edge-capability",
    endpointPath: "/docs/fdd/diplexer/bandEdgeCapability",
    description: "DOCSIS 4.0 FDD diplexer band edge capability visual.",
    menuPath: ["DOCSIS 4.0", "FDD"],
    requestTimeoutMs: LONG_RUNNING_OPERATION_TIMEOUT_MS,
  },
  {
    id: "docs-fdd-system-diplexer-configuration",
    label: "System Diplexer Configuration",
    routePath: "/operations/fdd-system-diplexer-configuration",
    endpointPath: "/docs/fdd/system/diplexer/configuration",
    description: "DOCSIS 4.0 FDD active system diplexer configuration visual.",
    menuPath: ["DOCSIS 4.0", "FDD"],
    requestTimeoutMs: LONG_RUNNING_OPERATION_TIMEOUT_MS,
  },
  {
    id: "docs-if30-ds-scqam-chan-codeworderrorrate",
    label: "SCQAM Codeword Error Rate",
    routePath: "/operations/ds-scqam-codeword-error-rate",
    endpointPath: "/docs/if30/ds/scqam/chan/codewordErrorRate",
    description: "DOCSIS 3.0 downstream SC-QAM codeword error rate visual.",
    menuPath: ["DOCSIS 3.0", "Downstream"],
    requestTimeoutMs: LONG_RUNNING_OPERATION_TIMEOUT_MS,
  },
  {
    id: "docs-if30-ds-scqam-chan-stats",
    label: "SCQAM Channel Stats",
    routePath: "/operations/ds-scqam-channel-stats",
    endpointPath: "/docs/if30/ds/scqam/chan/stats",
    description: "DOCSIS 3.0 downstream SC-QAM channel statistics visual.",
    menuPath: ["DOCSIS 3.0", "Downstream"],
    requestTimeoutMs: LONG_RUNNING_OPERATION_TIMEOUT_MS,
  },
  {
    id: "docs-if30-us-atdma-chan-preequalization",
    label: "ATDMA PreEqualization",
    routePath: "/operations/atdma-pre-equalization",
    endpointPath: "/docs/if30/us/atdma/chan/preEqualization",
    description: "DOCSIS 3.0 upstream ATDMA pre-equalization visual.",
    menuPath: ["DOCSIS 3.0", "Upstream"],
    requestTimeoutMs: LONG_RUNNING_OPERATION_TIMEOUT_MS,
  },
  {
    id: "docs-if30-us-atdma-chan-stats",
    label: "ATDMA Channel Stats",
    routePath: "/operations/atdma-channel-stats",
    endpointPath: "/docs/if30/us/atdma/chan/stats",
    description: "DOCSIS 3.0 upstream ATDMA channel statistics visual.",
    menuPath: ["DOCSIS 3.0", "Upstream"],
    requestTimeoutMs: LONG_RUNNING_OPERATION_TIMEOUT_MS,
  },
  {
    id: "docs-dev-eventlog",
    label: "Event Log",
    routePath: "/operations/event-log",
    endpointPath: "/docs/dev/eventLog",
    description: "Device event log visual.",
    menuPath: ["Device", "Logs"],
  },
  {
    id: "docs-pnm-interface-stats",
    label: "Interface Stats",
    routePath: "/operations/interface-stats",
    endpointPath: "/docs/pnm/interface/stats",
    description: "DOCSIS interface statistics visual.",
    menuPath: ["Device", "Interface"],
    requestTimeoutMs: LONG_RUNNING_OPERATION_TIMEOUT_MS,
  },
  {
    id: "system-uptime",
    label: "UpTime",
    routePath: "/operations/up-time",
    endpointPath: "/system/upTime",
    description: "Device system uptime visual.",
    menuPath: ["Device", "System"],
  },
  {
    id: "docs-pnm-ds-ofdm-rxmer-getcapture",
    label: "RxMER",
    routePath: "/single-capture/rxmer",
    endpointPath: "/docs/pnm/ds/ofdm/rxMer/getCapture",
    description: "Single downstream OFDM RxMER capture visual.",
    menuPath: ["PNM", "Single Capture"],
    showInOperationsMenu: false,
  },
  {
    id: "docs-pnm-ds-ofdm-channelestcoeff-getcapture",
    label: "Channel Estimation",
    routePath: "/single-capture/channel-est-coeff",
    endpointPath: "/docs/pnm/ds/ofdm/channelEstCoeff/getCapture",
    description: "Single downstream OFDM channel estimation coefficient capture visual.",
    menuPath: ["PNM", "Single Capture"],
    showInOperationsMenu: false,
  },
  {
    id: "docs-pnm-ds-histogram-getcapture",
    label: "Histogram",
    routePath: "/single-capture/histogram",
    endpointPath: "/docs/pnm/ds/histogram/getCapture",
    description: "Single downstream histogram capture visual.",
    menuPath: ["PNM", "Single Capture"],
    showInOperationsMenu: false,
  },
  {
    id: "docs-pnm-ds-spectrumanalyzer-getcapture-friendly",
    label: "Friendly",
    routePath: "/single-capture/spectrum-analyzer/friendly",
    endpointPath: "/docs/pnm/ds/spectrumAnalyzer/getCapture/friendly",
    description: "Friendly downstream spectrum analyzer capture visual.",
    menuPath: ["PNM", "Spectrum Analyzer"],
    showInOperationsMenu: false,
    requestTimeoutMs: LONG_RUNNING_OPERATION_TIMEOUT_MS,
  },
  {
    id: "docs-pnm-ds-spectrumanalyzer-getcapture-fullbandcapture",
    label: "Full Band",
    routePath: "/single-capture/spectrum-analyzer/full-band",
    endpointPath: "/docs/pnm/ds/spectrumAnalyzer/getCapture/fullBandCapture",
    description: "Full-band spectrum analyzer capture visual.",
    menuPath: ["PNM", "Spectrum Analyzer"],
    showInOperationsMenu: false,
    requestTimeoutMs: LONG_RUNNING_OPERATION_TIMEOUT_MS,
  },
  {
    id: "docs-pnm-ds-spectrumanalyzer-getcapture-ofdm",
    label: "OFDM",
    routePath: "/single-capture/spectrum-analyzer/ofdm",
    endpointPath: "/docs/pnm/ds/spectrumAnalyzer/getCapture/ofdm",
    description: "OFDM downstream spectrum analyzer capture visual.",
    menuPath: ["PNM", "Spectrum Analyzer"],
    showInOperationsMenu: false,
    requestTimeoutMs: LONG_RUNNING_OPERATION_TIMEOUT_MS,
  },
  {
    id: "docs-pnm-ds-spectrumanalyzer-getcapture-scqam",
    label: "SCQAM",
    routePath: "/single-capture/spectrum-analyzer/scqam",
    endpointPath: "/docs/pnm/ds/spectrumAnalyzer/getCapture/scqam",
    description: "SCQAM downstream spectrum analyzer capture visual.",
    menuPath: ["PNM", "Spectrum Analyzer"],
    showInOperationsMenu: false,
    requestTimeoutMs: LONG_RUNNING_OPERATION_TIMEOUT_MS,
  },
  {
    id: "docs-pnm-ds-ofdm-fecsummary-getcapture",
    label: "FEC Summary",
    routePath: "/single-capture/fec-summary",
    endpointPath: "/docs/pnm/ds/ofdm/fecSummary/getCapture",
    description: "Single downstream OFDM FEC summary capture visual.",
    menuPath: ["PNM", "Single Capture"],
    showInOperationsMenu: false,
  },
  {
    id: "docs-pnm-ds-ofdm-constellationdisplay-getcapture",
    label: "Constellation Display",
    routePath: "/single-capture/constellation-display",
    endpointPath: "/docs/pnm/ds/ofdm/constellationDisplay/getCapture",
    description: "Single downstream OFDM constellation display visual.",
    menuPath: ["PNM", "Single Capture"],
    showInOperationsMenu: false,
  },
  {
    id: "docs-pnm-ds-ofdm-modulationprofile-getcapture",
    label: "Modulation Profile",
    routePath: "/single-capture/modulation-profile",
    endpointPath: "/docs/pnm/ds/ofdm/modulationProfile/getCapture",
    description: "Single downstream OFDM modulation profile visual.",
    menuPath: ["PNM", "Single Capture"],
    showInOperationsMenu: false,
  },
  {
    id: "docs-pnm-us-ofdma-preequalization-getcapture",
    label: "OFDMA PreEqualization",
    routePath: "/single-capture/us-ofdma-pre-equalization",
    endpointPath: "/docs/pnm/us/ofdma/preEqualization/getCapture",
    description: "Single upstream OFDMA pre-equalization capture visual.",
    menuPath: ["PNM", "Single Capture"],
    showInOperationsMenu: false,
  },
];

export const operationNavigationItems: OperationNavigationItem[] = rawOperationNavigationItems.map((item) => ({
  ...item,
  endpointPath: toPwApiPath(item.endpointPath),
}));

export function getOperationByRoutePath(routePath: string | undefined): OperationNavigationItem | undefined {
  return operationNavigationItems.find((item) => item.routePath === routePath);
}

export const singleCaptureNavigationItems = operationNavigationItems.filter(
  (item) => item.menuPath[0] === "PNM" && item.menuPath[1] === "Single Capture",
);

export const spectrumAnalyzerNavigationItems = operationNavigationItems.filter(
  (item) => item.menuPath[0] === "PNM" && item.menuPath[1] === "Spectrum Analyzer",
);

export const operationsMenuNavigationItems = operationNavigationItems.filter(
  (item) => item.showInOperationsMenu !== false,
);
