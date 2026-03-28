import type { OperationFolderGroup, OperationNode } from "@/features/operations/types";

interface OperationSeriesDefinition {
  idPrefix: string;
  endpointBase: string;
  categoryPath: [string, string, string, string];
  descriptionPrefix: string;
}

function buildStartStatusResultsSeries(definition: OperationSeriesDefinition): OperationNode[] {
  return [
    {
      id: `${definition.idPrefix}-start-capture`,
      label: "Start Capture",
      categoryPath: [...definition.categoryPath],
      method: "POST",
      endpointPath: `${definition.endpointBase}/startCapture`,
      workflowType: "start-status-results",
      visualType: "json",
      description: `Start ${definition.descriptionPrefix} capture operation.`,
    },
    {
      id: `${definition.idPrefix}-status`,
      label: "Status",
      categoryPath: [...definition.categoryPath],
      method: "POST",
      endpointPath: `${definition.endpointBase}/status`,
      workflowType: "start-status-results",
      visualType: "json",
      dependsOn: [`${definition.idPrefix}-start-capture`],
      description: `Get status for ${definition.descriptionPrefix} capture operation.`,
    },
    {
      id: `${definition.idPrefix}-results`,
      label: "Results",
      categoryPath: [...definition.categoryPath],
      method: "POST",
      endpointPath: `${definition.endpointBase}/results`,
      workflowType: "start-status-results",
      visualType: "json",
      dependsOn: [`${definition.idPrefix}-start-capture`],
      description: `Get results for ${definition.descriptionPrefix} capture operation.`,
    },
    {
      id: `${definition.idPrefix}-cancel`,
      label: "Cancel",
      categoryPath: [...definition.categoryPath],
      method: "POST",
      endpointPath: `${definition.endpointBase}/cancel`,
      workflowType: "start-status-results",
      visualType: "json",
      dependsOn: [`${definition.idPrefix}-start-capture`],
      description: `Cancel ${definition.descriptionPrefix} capture operation.`,
    },
  ];
}

const rxMerSeriesDefinition: OperationSeriesDefinition = {
  idPrefix: "cmts-sg-ds-ofdm-rxmer",
  endpointBase: "/cmts/pnm/sg/ds/ofdm/rxmer",
  categoryPath: ["CMTS", "PNM", "Serving Group", "Downstream OFDM RxMER"],
  descriptionPrefix: "serving-group downstream OFDM RxMER",
};

export const operationRegistry: OperationNode[] = buildStartStatusResultsSeries(rxMerSeriesDefinition);

export function getOperationById(operationId: string): OperationNode | undefined {
  return operationRegistry.find((operation) => operation.id === operationId);
}

export const operationFolderGroups: OperationFolderGroup[] = [
  {
    id: "cmts-sg-rxmer-workflow",
    label: "CMTS / PNM / Serving Group / Downstream OFDM RxMER",
    operations: operationRegistry,
  },
];

const cmtsStartCaptureRequestExample = {
  cmts: {
    serving_group: {
      id: [],
    },
    cable_modem: {
      mac_address: [],
      pnm_parameters: {
        tftp: {
          ipv4: "string",
          ipv6: "string",
        },
        capture: {
          channel_ids: [0],
        },
      },
      snmp: {
        snmpV2C: {
          community: "string",
        },
      },
    },
  },
  execution: {
    max_workers: 16,
    retry_count: 3,
    retry_delay_seconds: 5,
    per_modem_timeout_seconds: 30,
    overall_timeout_seconds: 120,
  },
};

const cmtsOperationLookupRequestExample = {
  operation: {
    pnm_capture_operation_id: "{{pnm_capture_operation_id}}",
  },
};

const cmtsResultsRequestExample = {
  operation: {
    pnm_capture_operation_id: "{{pnm_capture_operation_id}}",
  },
  selection: {
    serving_group_ids: [],
    channel_ids: [],
    mac_addresses: [],
  },
  analysis: {
    type: "BASIC",
  },
  output: {
    type: "json",
  },
};

export function buildOperationRequestExample(operation: OperationNode): string {
  if (operation.id.endsWith("-start-capture")) {
    return JSON.stringify(cmtsStartCaptureRequestExample, null, 2);
  }
  if (operation.id.endsWith("-status") || operation.id.endsWith("-cancel")) {
    return JSON.stringify(cmtsOperationLookupRequestExample, null, 2);
  }
  return JSON.stringify(cmtsResultsRequestExample, null, 2);
}
