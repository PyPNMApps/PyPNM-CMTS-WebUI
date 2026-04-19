import { useInstanceConfig } from "@/app/useInstanceConfig";
import { productProfileAgentLabel, resolveProductProfileWithFallback } from "@/app/productProfile";

function toAgentDocsUrl(baseUrl: string): string {
  return new URL("/docs", `${baseUrl.replace(/\/+$/, "")}/`).toString();
}

export function InstanceSelector() {
  const { error, instances, isLoading, selectedInstance, setSelectedInstanceId } = useInstanceConfig();
  const agentLabel = productProfileAgentLabel(resolveProductProfileWithFallback());

  return (
    <div className="instance-selector">
      <label className="instance-selector-label" htmlFor="instance-selector">
        {agentLabel}
      </label>
      <select
        id="instance-selector"
        value={selectedInstance?.id ?? ""}
        onChange={(event) => setSelectedInstanceId(event.target.value)}
        disabled={isLoading || instances.length === 0}
      >
        {instances.map((instance) => (
          <option key={instance.id} value={instance.id}>
            {instance.label}
          </option>
        ))}
      </select>
      {selectedInstance ? (
        <div className="instance-selector-meta mono">
          <a href={toAgentDocsUrl(selectedInstance.baseUrl)} target="_blank" rel="noreferrer">
            {selectedInstance.baseUrl}
          </a>
        </div>
      ) : null}
      {error ? <div className="instance-selector-error">{error}</div> : null}
    </div>
  );
}
