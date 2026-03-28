import { useInstanceConfig } from "@/app/useInstanceConfig";
import { PageHeader } from "@/components/common/PageHeader";
import { Panel } from "@/components/common/Panel";
import {
  ServingGroupCaptureRequestForm,
  type ServingGroupCaptureRequestPayload,
} from "@/features/serving-group/components/ServingGroupCaptureRequestForm";
import { useState } from "react";
import { NavLink } from "react-router-dom";

const servingGroupRoutes = [
  { to: "/serving-group/rxmer", label: "RxMER" },
] as const;

export function CmtsSgRxMerWorkflowPage() {
  const { selectedInstance } = useInstanceConfig();
  const [requestPayload, setRequestPayload] = useState<ServingGroupCaptureRequestPayload | null>(null);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);

  return (
    <>
      <nav className="advanced-subnav">
        {servingGroupRoutes.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <PageHeader
        title="CMTS SG Downstream OFDM RxMER"
        subtitle="Capture Request form. SG IDs come from the active serving-group worker process."
      />
      <Panel
        title={(
          <>
            <h2 className="panel-title-heading">Capture Request</h2>
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
          </>
        )}
      >
        <ServingGroupCaptureRequestForm
          baseUrl={selectedInstance?.baseUrl}
          idPrefix="cmts-sg-rxmer"
          onPayloadChange={setRequestPayload}
        />
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
