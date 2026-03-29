import { useInstanceConfig } from "@/app/useInstanceConfig";
import { PageHeader } from "@/components/common/PageHeader";
import { Panel } from "@/components/common/Panel";
import { env } from "@/lib/env";

function toAgentDocsUrl(baseUrl: string): string {
  return new URL("/docs", `${baseUrl.replace(/\/+$/, "")}/`).toString();
}

export function SettingsPage() {
  const { config, instances, selectedInstance } = useInstanceConfig();

  return (
    <>
      <PageHeader title="Settings" subtitle="Runtime targets, request defaults, and client fallback configuration." />

      <Panel title="Runtime Overview">
        <div className="settings-chip-grid">
          <span className="analysis-chip"><b>Profile</b> {env.productProfileLabel}</span>
          <span className="analysis-chip"><b>Selected</b> {selectedInstance?.label ?? "n/a"}</span>
          <span className="analysis-chip"><b>Instances</b> {instances.length}</span>
          <span className="analysis-chip"><b>Health Path</b> {config?.defaults.healthPath ?? "n/a"}</span>
          <span className="analysis-chip"><b>Timeout</b> {env.requestTimeoutMs} ms</span>
        </div>
      </Panel>

      <div className="grid two settings-grid">
        <Panel title="Selected Instance">
          <div className="settings-definition-list">
            <div className="settings-definition-row">
              <span className="settings-definition-key">Label</span>
              <span>{selectedInstance?.label ?? "n/a"}</span>
            </div>
            <div className="settings-definition-row">
              <span className="settings-definition-key">Base URL</span>
              <span className="mono">
                {selectedInstance?.baseUrl ? (
                  <a className="settings-link" href={toAgentDocsUrl(selectedInstance.baseUrl)} target="_blank" rel="noreferrer">
                    {selectedInstance.baseUrl}
                  </a>
                ) : "n/a"}
              </span>
            </div>
            <div className="settings-definition-row">
              <span className="settings-definition-key">Polling</span>
              <span>{selectedInstance ? `${selectedInstance.polling.intervalMs} ms` : "n/a"}</span>
            </div>
            <div className="settings-definition-row">
              <span className="settings-definition-key">Capabilities</span>
              <span>{selectedInstance?.capabilities.length ? selectedInstance.capabilities.join(", ") : "n/a"}</span>
            </div>
            <div className="settings-definition-row">
              <span className="settings-definition-key">Tags</span>
              <span>{selectedInstance?.tags.length ? selectedInstance.tags.join(", ") : "n/a"}</span>
            </div>
          </div>
        </Panel>

        <Panel title="Request Defaults">
          <div className="settings-definition-list">
            <div className="settings-definition-row">
              <span className="settings-definition-key">Cable Modem MAC</span>
              <span className="mono">{selectedInstance?.requestDefaults.cableModemMacAddress ?? "n/a"}</span>
            </div>
            <div className="settings-definition-row">
              <span className="settings-definition-key">Cable Modem IP</span>
              <span className="mono">{selectedInstance?.requestDefaults.cableModemIpAddress ?? "n/a"}</span>
            </div>
            <div className="settings-definition-row">
              <span className="settings-definition-key">TFTP IPv4</span>
              <span className="mono">{selectedInstance?.requestDefaults.tftpIpv4 ?? "n/a"}</span>
            </div>
            <div className="settings-definition-row">
              <span className="settings-definition-key">TFTP IPv6</span>
              <span className="mono">{selectedInstance?.requestDefaults.tftpIpv6 ?? "n/a"}</span>
            </div>
            <div className="settings-definition-row">
              <span className="settings-definition-key">Channel IDs</span>
              <span className="mono">{selectedInstance?.requestDefaults.channelIds ?? "n/a"}</span>
            </div>
            <div className="settings-definition-row">
              <span className="settings-definition-key">SNMP RW</span>
              <span className="mono">{selectedInstance?.requestDefaults.snmpRwCommunity ?? "n/a"}</span>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Client Fallback">
        <div className="settings-definition-list">
          <div className="settings-definition-row">
            <span className="settings-definition-key">Env Base URL</span>
            <span className="mono">{env.apiBaseUrl}</span>
          </div>
          <div className="settings-definition-row">
            <span className="settings-definition-key">Configured Health Path</span>
            <span className="mono">{config?.defaults.healthPath ?? "n/a"}</span>
          </div>
        </div>
      </Panel>

      <Panel title="Configured Instances">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Instance</th>
                <th>Base URL</th>
                <th>Polling</th>
                <th>Capabilities</th>
                <th>Tags</th>
              </tr>
            </thead>
            <tbody>
              {instances.map((instance) => (
                <tr key={instance.id} className={instance.id === selectedInstance?.id ? "is-selected" : undefined}>
                  <td>{instance.label}</td>
                  <td className="mono">{instance.baseUrl}</td>
                  <td>{instance.polling.intervalMs} ms</td>
                  <td>{instance.capabilities.length ? instance.capabilities.join(", ") : "n/a"}</td>
                  <td>{instance.tags.length ? instance.tags.join(", ") : "n/a"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
