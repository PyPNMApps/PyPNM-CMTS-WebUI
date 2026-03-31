import { useCallback, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useInstanceConfig } from "@/app/useInstanceConfig";
import { FoldablePanelTitle } from "@/components/common/FoldablePanelTitle";
import { JsonPayloadModal } from "@/components/common/JsonPayloadModal";
import { Panel } from "@/components/common/Panel";
import { ThinkingIndicator } from "@/components/common/ThinkingIndicator";
import { OperationStatusDetailsChips } from "@/pcw/components/OperationStatusDetailsChips";
import { OperationStatusPrimaryChips } from "@/pcw/components/OperationStatusPrimaryChips";
import { useAdvancedOperationMachine } from "@/pw/features/advanced/useAdvancedOperationMachine";
import {
  ServingGroupCaptureRequestForm,
  type ServingGroupCaptureRequestPayload,
} from "@/pcw/features/serving-group/components/ServingGroupCaptureRequestForm";
import { ServingGroupHistogramResultsView } from "@/pcw/features/serving-group/components/ServingGroupHistogramResultsView";
import {
  formatOperationEpoch,
  parseServingGroupOperationStartResponse,
  parseServingGroupOperationStatusResponse,
} from "@/pcw/features/serving-group/lib/operationStatus";
import {
  cancelServingGroupHistogramCapture,
  getServingGroupHistogramCaptureStatus,
  getServingGroupHistogramResults,
  startServingGroupHistogramCapture,
} from "@/pcw/services/servingGroupHistogramService";

const servingGroupRoutes = [
  { to: "/serving-group/rxmer", label: "RxMER" },
  { to: "/serving-group/channel-est-coeff", label: "Channel Estimation" },
  { to: "/serving-group/fec-summary", label: "FEC Summary" },
  { to: "/serving-group/constellation-display", label: "Constellation Display" },
  { to: "/serving-group/modulation-profile", label: "Modulation Profile" },
  { to: "/serving-group/histogram", label: "Histogram" },
] as const;

export function CmtsSgHistogramWorkflowPage() {
  const { selectedInstance } = useInstanceConfig();
  const [requestPayload, setRequestPayload] = useState<ServingGroupCaptureRequestPayload | null>(null);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [isResponseJsonModalOpen, setIsResponseJsonModalOpen] = useState(false);
  const [latestStatusResponsePayload, setLatestStatusResponsePayload] = useState<unknown | null>(null);
  const [resultsPayload, setResultsPayload] = useState<unknown | null>(null);
  const [resultsError, setResultsError] = useState<string>("");
  const [isResultsLoading, setIsResultsLoading] = useState(false);
  const [isCaptureResultsCollapsed, setIsCaptureResultsCollapsed] = useState(true);
  const [resultsOperationId, setResultsOperationId] = useState<string | null>(null);
  const [isCaptureRequestCollapsed, setIsCaptureRequestCollapsed] = useState(true);
  const [isCaptureStatusCollapsed, setIsCaptureStatusCollapsed] = useState(false);
  const [operationIdInput, setOperationIdInput] = useState("");

  const machine = useAdvancedOperationMachine<unknown, unknown>({
    parseStart: (response) => parseServingGroupOperationStartResponse(response, "serving-group"),
    parseStatus: parseServingGroupOperationStatusResponse,
    startOperation: async () => {
      if (!selectedInstance?.baseUrl || !requestPayload) {
        throw new Error("Capture request payload is not ready.");
      }
      return startServingGroupHistogramCapture(selectedInstance.baseUrl, requestPayload);
    },
    getStatus: async (operationId: string) => {
      if (!selectedInstance?.baseUrl) {
        throw new Error("No instance selected.");
      }
      const response = await getServingGroupHistogramCaptureStatus(selectedInstance.baseUrl, operationId);
      setLatestStatusResponsePayload(response);
      return response;
    },
    stopOperation: async (operationId: string) => {
      if (!selectedInstance?.baseUrl) {
        throw new Error("No instance selected.");
      }
      const response = await cancelServingGroupHistogramCapture(selectedInstance.baseUrl, operationId);
      setLatestStatusResponsePayload(response);
      return response;
    },
  });

  const canStartCapture = Boolean(requestPayload && selectedInstance?.baseUrl && machine.canStart);
  const canCancelCapture = machine.canStop;
  const normalizedOperationIdInput = operationIdInput.trim();
  const canLoadOperationId = Boolean(selectedInstance?.baseUrl && normalizedOperationIdInput.length > 0);

  const loadResults = useCallback(async (operationId: string) => {
    if (!selectedInstance?.baseUrl) {
      return;
    }
    setIsResultsLoading(true);
    setResultsError("");
    try {
      const response = await getServingGroupHistogramResults(selectedInstance.baseUrl, operationId);
      setResultsPayload(response);
      setResultsOperationId(operationId);
      setIsCaptureResultsCollapsed(false);
    } catch (error) {
      setResultsError(error instanceof Error ? error.message : "Failed to load SG Histogram results.");
    } finally {
      setIsResultsLoading(false);
    }
  }, [selectedInstance?.baseUrl]);

  useEffect(() => {
    const operationId = machine.operationId;
    if (!operationId || machine.lifecycleState !== "completed") {
      return;
    }
    if (resultsOperationId === operationId && resultsPayload) {
      return;
    }
    void loadResults(operationId);
  }, [loadResults, machine.lifecycleState, machine.operationId, resultsOperationId, resultsPayload]);

  useEffect(() => {
    if (!machine.operationId) {
      return;
    }
    setOperationIdInput(machine.operationId);
  }, [machine.operationId]);

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
            <FoldablePanelTitle
              id="cmts-sg-histogram-capture-request-body"
              label="Capture Request"
              isCollapsed={isCaptureRequestCollapsed}
              onToggle={() => setIsCaptureRequestCollapsed((current) => !current)}
            />
            <div className="capture-request-title-center">
              <button
                type="button"
                className="primary"
                disabled={!canStartCapture}
                onClick={() => {
                  setIsCaptureStatusCollapsed(false);
                  setLatestStatusResponsePayload(null);
                  setResultsPayload(null);
                  setResultsError("");
                  setResultsOperationId(null);
                  void machine.start();
                }}
              >
                {machine.lifecycleState === "starting" ? "Starting..." : "Start Capture"}
              </button>
              <button
                type="button"
                className="operations-json-download danger"
                disabled={!canCancelCapture}
                onClick={() => {
                  void machine.stop();
                }}
              >
                {machine.lifecycleState === "stopping" ? "Cancelling..." : "Cancel Capture"}
              </button>
            </div>
            <div className="capture-request-title-actions">
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
        <div id="cmts-sg-histogram-capture-request-body" hidden={isCaptureRequestCollapsed}>
          <ServingGroupCaptureRequestForm
            baseUrl={selectedInstance?.baseUrl}
            idPrefix="cmts-sg-histogram"
            initialSnmpCommunity={selectedInstance?.requestDefaults?.snmpRwCommunity ?? ""}
            initialTftpIpv4={selectedInstance?.requestDefaults?.tftpIpv4 ?? ""}
            initialTftpIpv6={selectedInstance?.requestDefaults?.tftpIpv6 ?? ""}
            captureSettingsMode="histogram"
            onPayloadChange={setRequestPayload}
          />
        </div>
      </Panel>
      <Panel
        title={(
          <div className="capture-status-title-layout">
            <FoldablePanelTitle
              id="cmts-sg-histogram-capture-status-body"
              label="Capture Status"
              isCollapsed={isCaptureStatusCollapsed}
              onToggle={() => setIsCaptureStatusCollapsed((current) => !current)}
            />
            <button
              type="button"
              className="operations-json-download"
              disabled={!latestStatusResponsePayload}
              onClick={() => setIsResponseJsonModalOpen(true)}
            >
              Response JSON
            </button>
          </div>
        )}
      >
        <div id="cmts-sg-histogram-capture-status-body" className="operation-status-stack" hidden={isCaptureStatusCollapsed}>
          <div className="operation-status-id-row">
            <label className="field">
              <span>Operation ID</span>
              <input
                id="cmts-sg-histogram-operation-id-input"
                name="cmtsSgHistogramOperationId"
                type="text"
                value={operationIdInput}
                placeholder="Paste pnm_capture_operation_id"
                onChange={(event) => setOperationIdInput(event.target.value)}
              />
            </label>
            <div className="operation-status-id-actions">
              <button
                type="button"
                className="operations-json-download"
                disabled={!canLoadOperationId}
                onClick={() => {
                  if (!canLoadOperationId) {
                    return;
                  }
                  setLatestStatusResponsePayload(null);
                  setResultsError("");
                  setResultsPayload(null);
                  setResultsOperationId(null);
                  void machine.trackOperation(normalizedOperationIdInput);
                }}
              >
                Load Status
              </button>
              <button
                type="button"
                className="operations-json-download"
                disabled={!canLoadOperationId || isResultsLoading}
                onClick={() => {
                  if (!canLoadOperationId) {
                    return;
                  }
                  void machine.trackOperation(normalizedOperationIdInput);
                  void loadResults(normalizedOperationIdInput);
                }}
              >
                {isResultsLoading ? "Loading Results..." : "Load Results"}
              </button>
            </div>
          </div>
          <OperationStatusPrimaryChips
            lifecycleState={machine.lifecycleState}
            operationId={machine.operationId}
            collected={machine.statusSummary?.collected}
            timeRemainingSeconds={machine.statusSummary?.timeRemaining}
          />
          <OperationStatusDetailsChips
            statusSummary={machine.statusSummary}
            formatEpoch={formatOperationEpoch}
          />
          {machine.lifecycleState === "starting" || machine.lifecycleState === "running" ? (
            <ThinkingIndicator label="Running SG Histogram capture and polling status..." />
          ) : null}
          {machine.statusSummary?.message ? <p className="panel-copy">{machine.statusSummary.message}</p> : null}
          {machine.errorMessage ? <p className="advanced-error-text">{machine.errorMessage}</p> : null}
        </div>
      </Panel>
      <Panel
        title={(
          <div className="capture-results-title-layout">
            <FoldablePanelTitle
              id="cmts-sg-histogram-results-body"
              label="Capture Results"
              isCollapsed={isCaptureResultsCollapsed}
              onToggle={() => setIsCaptureResultsCollapsed((current) => !current)}
            />
            <button
              type="button"
              className="operations-json-download"
              disabled={!machine.operationId || isResultsLoading}
              onClick={() => {
                if (!machine.operationId) {
                  return;
                }
                void loadResults(machine.operationId);
              }}
            >
              {isResultsLoading ? "Loading Results..." : "Get Results"}
            </button>
          </div>
        )}
      >
        <div id="cmts-sg-histogram-results-body" hidden={isCaptureResultsCollapsed}>
          {isResultsLoading ? <ThinkingIndicator label="Loading SG Histogram results..." /> : null}
          {resultsError ? <p className="advanced-error-text">{resultsError}</p> : null}
          {!resultsError && !isResultsLoading && resultsPayload ? (
            <ServingGroupHistogramResultsView payload={resultsPayload} />
          ) : null}
          {!resultsError && !isResultsLoading && !resultsPayload ? (
            <p className="panel-copy">Run capture to completion or click Get Results to load SG Histogram visuals.</p>
          ) : null}
        </div>
      </Panel>
      <JsonPayloadModal
        id="cmts-sg-histogram-request-json-modal"
        isOpen={isJsonModalOpen}
        title="Capture Request JSON"
        payload={requestPayload}
        onClose={() => setIsJsonModalOpen(false)}
      />
      <JsonPayloadModal
        id="cmts-sg-histogram-response-json-modal"
        isOpen={isResponseJsonModalOpen}
        title="Capture Status Response JSON"
        payload={latestStatusResponsePayload}
        onClose={() => setIsResponseJsonModalOpen(false)}
      />
    </>
  );
}
