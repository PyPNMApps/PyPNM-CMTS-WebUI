import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/common/PageHeader";
import { Panel } from "@/components/common/Panel";
import { ThinkingIndicator } from "@/components/common/ThinkingIndicator";
import { env } from "@/lib/env";
import { REPO_URL, fetchCurrentLocalVersion, fetchLatestGitHubTag } from "@/services/repoMetadataService";

const DOCS_URL = "https://pypnmapps.github.io/PyPNM-CMTS-WebUI/";

function VersionValue({ value }: { value: string }) {
  return <span className="mono">{value}</span>;
}

export function AboutPage() {
  const currentVersionQuery = useQuery({
    queryKey: ["app", "current-local-version"],
    queryFn: fetchCurrentLocalVersion,
    staleTime: 15 * 1000,
    retry: false,
  });
  const latestVersionQuery = useQuery({
    queryKey: ["github", "latest-tag"],
    queryFn: fetchLatestGitHubTag,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <>
      <PageHeader
        title="About"
        subtitle="PyPNM CMTS WebUI is a browser client for CMTS operations, file inspection, and signal-analysis visuals."
      />
      <div className="grid two about-grid">
        <Panel title="Project">
          <p className="panel-copy">
            Use PyPNM CMTS WebUI to connect to one or more agents, run supported operations, inspect stored files,
            and render capture data with purpose-built visuals.
          </p>
          <div className="settings-action-list">
            <a className="button-link" href={REPO_URL} target="_blank" rel="noreferrer">
              Open Repository
            </a>
            <a className="button-link" href={DOCS_URL} target="_blank" rel="noreferrer">
              Open User Docs
            </a>
          </div>
        </Panel>
        <Panel title="Version">
          <div className="settings-definition-list">
            <div className="settings-definition-row">
              <div className="settings-definition-key">License</div>
              <div><VersionValue value={__APP_LICENSE__} /></div>
            </div>
            <div className="settings-definition-row">
              <div className="settings-definition-key">Product Profile</div>
              <div><VersionValue value={env.productProfile} /></div>
            </div>
            <div className="settings-definition-row">
              <div className="settings-definition-key">Current Local Version</div>
              <div>
                <VersionValue value={currentVersionQuery.data ?? __APP_VERSION__} />
              </div>
            </div>
            <div className="settings-definition-row">
              <div className="settings-definition-key">Latest GitHub Repo Version</div>
              <div>
                {latestVersionQuery.isPending ? (
                  <ThinkingIndicator label="Checking GitHub version..." compact />
                ) : latestVersionQuery.isError ? (
                  <span>Unavailable</span>
                ) : (
                  <VersionValue value={latestVersionQuery.data ?? "No tags found"} />
                )}
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </>
  );
}
