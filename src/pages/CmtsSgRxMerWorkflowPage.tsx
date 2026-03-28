import { OperationSeriesWorkflowPage } from "@/features/operations/components/OperationSeriesWorkflowPage";

const rxMerWorkflowSteps = [
  {
    key: "start",
    title: "1. Start Capture",
    operationId: "cmts-sg-ds-ofdm-rxmer-start-capture",
    captureOperationIdFromResponse: true,
  },
  {
    key: "status",
    title: "2. Status",
    operationId: "cmts-sg-ds-ofdm-rxmer-status",
    requiresOperationId: true,
  },
  {
    key: "results",
    title: "3. Results",
    operationId: "cmts-sg-ds-ofdm-rxmer-results",
    requiresOperationId: true,
  },
  {
    key: "cancel",
    title: "4. Cancel",
    operationId: "cmts-sg-ds-ofdm-rxmer-cancel",
    requiresOperationId: true,
  },
] as const;

export function CmtsSgRxMerWorkflowPage() {
  return (
    <OperationSeriesWorkflowPage
      title="CMTS SG Downstream OFDM RxMER"
      subtitle="Run Start -> Status -> Results -> Cancel. Rules: serving_group.id=[] means all, mac_address=[] means all, channel_ids=[0] means all."
      workflowId="cmts-sg-rxmer"
      steps={[...rxMerWorkflowSteps]}
    />
  );
}
