import { PageHeader } from "@/components/common/PageHeader";
import { Panel } from "@/components/common/Panel";

export function HomePage() {
  return (
    <>
      <PageHeader
        title="Overview"
        subtitle="Frontend-only PyPNM client for endpoint workflows, status checks, and result visualization."
      />
      <div className="grid two">
        <Panel title="MVP Scope">
          <ul>
            <li>API connectivity and health status</li>
            <li>Endpoint discovery and request execution</li>
            <li>Structured result cards, tables, and raw JSON</li>
          </ul>
        </Panel>
        <Panel title="Current Baseline">
          <ul>
            <li>Typed API client with shared config</li>
            <li>Route shell and feature placeholders</li>
            <li>React Query for server-state handling</li>
          </ul>
        </Panel>
      </div>
    </>
  );
}
