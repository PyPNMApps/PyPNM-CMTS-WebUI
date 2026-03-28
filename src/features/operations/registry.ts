import type { OperationFolderGroup, OperationNode } from "@/features/operations/types";

export const operationRegistry: OperationNode[] = [
  {
    id: "multi-rxmer-start",
    label: "Start",
    categoryPath: ["PNM", "MultiCapture", "Downstream", "RxMER"],
    method: "POST",
    endpointPath: "/advance/multi/ds/rxMer/start",
    workflowType: "start-status-results",
    visualType: "json",
    description: "Create a multi-capture RxMER job and return an operation id.",
  },
  {
    id: "multi-rxmer-status",
    label: "Status",
    categoryPath: ["PNM", "MultiCapture", "Downstream", "RxMER"],
    method: "GET",
    endpointPath: "/advance/multi/ds/rxMer/status/{operation_id}",
    workflowType: "start-status-results",
    visualType: "json",
    dependsOn: ["multi-rxmer-start"],
    description: "Poll the capture job state until the job reaches completion.",
  },
  {
    id: "multi-rxmer-results",
    label: "Results",
    categoryPath: ["PNM", "MultiCapture", "Downstream", "RxMER"],
    method: "GET",
    endpointPath: "/advance/multi/ds/rxMer/results/{operation_id}",
    workflowType: "start-status-results",
    visualType: "json",
    dependsOn: ["multi-rxmer-start"],
    description: "Fetch the completed multi-capture RxMER payload for a given operation id.",
  },
  {
    id: "multi-rxmer-analysis-min-avg-max",
    label: "Min / Avg / Max",
    categoryPath: ["PNM", "MultiCapture", "Downstream", "RxMER", "Analysis"],
    method: "POST",
    endpointPath: "/advance/multi/ds/rxMer/analysis",
    workflowType: "analysis-from-operation",
    visualType: "json",
    dependsOn: ["multi-rxmer-results"],
    description: "Run a min/avg/max analysis against a completed multi-capture RxMER operation.",
  },
  {
    id: "multi-rxmer-analysis-heatmap",
    label: "Heat Map",
    categoryPath: ["PNM", "MultiCapture", "Downstream", "RxMER", "Analysis"],
    method: "POST",
    endpointPath: "/advance/multi/ds/rxMer/analysis",
    workflowType: "analysis-from-operation",
    visualType: "json",
    dependsOn: ["multi-rxmer-results"],
    description: "Render time/frequency density for a completed RxMER capture set.",
  },
  {
    id: "multi-rxmer-analysis-echo-1",
    label: "Echo Detection 1",
    categoryPath: ["PNM", "MultiCapture", "Downstream", "RxMER", "Analysis"],
    method: "POST",
    endpointPath: "/advance/multi/ds/rxMer/analysis",
    workflowType: "analysis-from-operation",
    visualType: "echo-analysis",
    dependsOn: ["multi-rxmer-results"],
    description: "Run the ECHO_REFLECTION_1 analysis and render the engineering visual.",
  },
  {
    id: "multi-rxmer-analysis-profile-performance-1",
    label: "Profile Performance 1",
    categoryPath: ["PNM", "MultiCapture", "Downstream", "RxMER", "Analysis"],
    method: "POST",
    endpointPath: "/advance/multi/ds/rxMer/analysis",
    workflowType: "analysis-from-operation",
    visualType: "json",
    dependsOn: ["multi-rxmer-results"],
    description: "Run profile-performance scoring for a completed RxMER operation.",
  },
];

export const operationFolderGroups: OperationFolderGroup[] = [
  {
    id: "multi-rxmer-workflow",
    label: "PNM / MultiCapture / Downstream / RxMER",
    operations: operationRegistry.filter((operation) => operation.categoryPath.slice(0, 4).join("/") === "PNM/MultiCapture/Downstream/RxMER"),
  },
];

export function buildOperationRequestExample(operation: OperationNode): string {
  switch (operation.id) {
    case "multi-rxmer-start":
      return JSON.stringify(
        {
          cable_modem: {
            mac_address: "{{cm_mac_address}}",
            ip_address: "{{cm_ip_address}}",
            pnm_parameters: {
              tftp: { ipv4: "{{tftp_server_ipv4}}", ipv6: "{{tftp_server_ipv6}}" },
              capture: { channel_ids: ["{{channel_ids}}"] },
            },
            snmp: { snmpV2C: { community: "{{cm_snmp_community_rw}}" } },
          },
          capture: {
            parameters: {
              measurement_duration: "{{measurement_duration}}",
              sample_interval: 1,
            },
          },
          measure: { mode: 1 },
        },
        null,
        2,
      );
    case "multi-rxmer-status":
      return JSON.stringify({ operation_id: "{{rxmer_multi_operation_id}}" }, null, 2);
    case "multi-rxmer-results":
      return JSON.stringify({ operation_id: "{{rxmer_multi_operation_id}}" }, null, 2);
    default:
      return JSON.stringify(
        {
          analysis: {
            type: "ECHO_REFLECTION_1",
            output: { type: "json" },
            plot: { ui: { theme: "dark" } },
          },
          operation_id: "{{rxmer_multi_operation_id}}",
        },
        null,
        2,
      );
  }
}
