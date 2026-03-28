import { useInstanceConfig } from "@/app/useInstanceConfig";
import { Panel } from "@/components/common/Panel";
import { ThinkingIndicator } from "@/components/common/ThinkingIndicator";
import { useAdvancedOperationMachine } from "@/features/advanced/useAdvancedOperationMachine";
import {
  ServingGroupCaptureRequestForm,
  type ServingGroupCaptureRequestPayload,
} from "@/features/serving-group/components/ServingGroupCaptureRequestForm";
import {
  formatOperationEpoch,
  parseServingGroupOperationStartResponse,
  parseServingGroupOperationStatusResponse,
} from "@/features/serving-group/lib/operationStatus";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { getServingGroupRxMerCaptureStatus, startServingGroupRxMerCapture } from "@/services/servingGroupRxMerService";

const servingGroupRoutes = [
  { to: "/serving-group/rxmer", label: "RxMER" },
] as const;

export function CmtsSgRxMerWorkflowPage() {
  const { selectedInstance } = useInstanceConfig();
  const [requestPayload, setRequestPayload] = useState<ServingGroupCaptureRequestPayload | null>(null);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [isCaptureRequestCollapsed, setIsCaptureRequestCollapsed] = useState(true);
  const machine = useAdvancedOperationMachine<unknown, unknown>({
    parseStart: (response) => parseServingGroupOperationStartResponse(response, "serving-group"),
    parseStatus: parseServingGroupOperationStatusResponse,
    startOperation: async () => {
      if (!selectedInstance?.baseUrl || !requestPayload) {
        throw new Error("Capture request payload is not ready.");
      }
      return startServingGroupRxMerCapture(selectedInstance.baseUrl, requestPayload);
    },
    getStatus: async (operationId: string) => {
      if (!selectedInstance?.baseUrl) {
        throw new Error("No instance selected.");
      }
      return getServingGroupRxMerCaptureStatus(selectedInstance.baseUrl, operationId);
    },
    stopOperation: async (operationId: string) => {
      if (!selectedInstance?.baseUrl) {
        throw new Error("No instance selected.");
      }
      return getServingGroupRxMerCaptureStatus(selectedInstance.baseUrl, operationId);
    },
  });
  const canStartCapture = Boolean(
    requestPayload
    && selectedInstance?.baseUrl
    && machine.canStart
  );

  return (
    <>
      <nav className="advanced-subnav">
        {servingGroupRoutes.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <Panel
        title={(
          <div className="capture-request-title-layout">
            <h2 className="panel-title-heading">Capture Request</h2>
            <div className="capture-request-title-center">
              <button
                type="button"
                className="primary"
                disabled={!canStartCapture}
                onClick={() => {
                  void machine.start();
                }}
              >
                {machine.lifecycleState === "starting" ? "Starting..." : "Start Capture"}
              </button>
            </div>
            <div className="capture-request-title-actions">
              <button
                type="button"
                className="operations-json-download"
                onClick={() => setIsCaptureRequestCollapsed((current) => !current)}
                aria-expanded={!isCaptureRequestCollapsed}
                aria-controls="cmts-sg-rxmer-capture-request-body"
              >
                {isCaptureRequestCollapsed ? "Expand" : "Fold"}
              </button>
              <button
                type="button"
                className="operations-json-download"
                disabled={!requestPayload}
                onClick={() => setIsJsonModalOpen(true)}
              >
                Request JSON
              </button>
            </div>
          </div>
        )}
      >
        <div id="cmts-sg-rxmer-capture-request-body" hidden={isCaptureRequestCollapsed}>
          <ServingGroupCaptureRequestForm
            baseUrl={selectedInstance?.baseUrl}
            idPrefix="cmts-sg-rxmer"
            initialSnmpCommunity={selectedInstance?.requestDefaults?.snmpRwCommunity ?? ""}
            initialTftpIpv4={selectedInstance?.requestDefaults?.tftpIpv4 ?? ""}
            initialTftpIpv6={selectedInstance?.requestDefaults?.tftpIpv6 ?? ""}
            onPayloadChange={setRequestPayload}
          />
          <div className="operation-status-stack">
            <div className="status-chip-row operation-status-chip-row">
              <span className="analysis-chip"><b>State</b> {machine.lifecycleState.toUpperCase()}</span>
              <span className="analysis-chip"><b>Polling</b> {machine.isPolling ? "yes" : "no"}</span>
              <span className="analysis-chip"><b>Collected</b> {machine.statusSummary?.collected ?? 0}</span>
              <span className="analysis-chip"><b>Time Remaining</b> {machine.statusSummary?.timeRemaining ?? 0}s</span>
              <span className="analysis-chip"><b>Operation ID</b> {machine.operationId ?? "n/a"}</span>
            </div>
            <details className="capture-request-dropdown operation-status-details">
              <summary className="capture-request-dropdown-summary">
                <span>Operation Details</span>
              </summary>
              <div className="status-chip-row operation-status-chip-row">
                <span className="analysis-chip"><b>Total Modems</b> {machine.statusSummary?.totalModems ?? 0}</span>
                <span className="analysis-chip"><b>Eligible</b> {machine.statusSummary?.eligibleModems ?? 0}</span>
                <span className="analysis-chip"><b>Precheck Passed</b> {machine.statusSummary?.precheckPassed ?? 0}</span>
                <span className="analysis-chip"><b>Capture Started</b> {machine.statusSummary?.captureStarted ?? 0}</span>
                <span className="analysis-chip"><b>Success</b> {machine.statusSummary?.successCount ?? 0}</span>
                <span className="analysis-chip"><b>Failed</b> {machine.statusSummary?.failedCount ?? 0}</span>
                <span className="analysis-chip"><b>Skipped</b> {machine.statusSummary?.skippedCount ?? 0}</span>
              </div>
              <div className="status-chip-row operation-status-chip-row">
                <span className="analysis-chip"><b>Created</b> {formatOperationEpoch(machine.statusSummary?.createdEpoch)}</span>
                <span className="analysis-chip"><b>Started</b> {formatOperationEpoch(machine.statusSummary?.startedEpoch)}</span>
                <span className="analysis-chip"><b>Updated</b> {formatOperationEpoch(machine.statusSummary?.updatedEpoch)}</span>
                <span className="analysis-chip"><b>Finished</b> {formatOperationEpoch(machine.statusSummary?.finishedEpoch)}</span>
              </div>
            </details>
            {machine.lifecycleState === "starting" || machine.lifecycleState === "running" ? (
              <ThinkingIndicator label="Running SG RxMER capture and polling status..." />
            ) : null}
            {machine.statusSummary?.message ? <p className="panel-copy">{machine.statusSummary.message}</p> : null}
            {machine.errorMessage ? <p className="advanced-error-text">{machine.errorMessage}</p> : null}
          </div>
        </div>
      </Panel>
      {isJsonModalOpen ? (
        <div
          className="selection-insights-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cmts-sg-rxmer-request-json-title"
          onClick={() => setIsJsonModalOpen(false)}
        >
          <div className="selection-insights-modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="selection-insights-modal-header">
              <h3 id="cmts-sg-rxmer-request-json-title" className="selection-insights-modal-title">Capture Request JSON</h3>
              <button type="button" className="operations-json-download" onClick={() => setIsJsonModalOpen(false)}>
                Close
              </button>
            </div>
            <div className="field">
              <textarea
                id="cmts-sg-rxmer-request-json-modal"
                className="mono"
                value={`${JSON.stringify(requestPayload ?? {}, null, 2)}\n`}
                readOnly
                rows={24}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
