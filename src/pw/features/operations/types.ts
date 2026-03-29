export type OperationWorkflowType = "single-request" | "start-status-results" | "analysis-from-operation";

export type OperationVisualType = "json" | "echo-analysis";

export interface OperationNode {
  id: string;
  label: string;
  categoryPath: string[];
  method: "GET" | "POST";
  endpointPath: string;
  workflowType: OperationWorkflowType;
  visualType: OperationVisualType;
  dependsOn?: string[];
  description: string;
}

export interface OperationFolderGroup {
  id: string;
  label: string;
  operations: OperationNode[];
}
