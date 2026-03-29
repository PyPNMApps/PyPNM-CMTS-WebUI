import { PageHeader } from "@/components/common/PageHeader";
import { Panel } from "@/components/common/Panel";

export function ResultsPage() {
  return (
    <>
      <PageHeader title="Results" subtitle="Result summaries, structured fields, and raw payload view." />
      <Panel title="Result Viewer Placeholder">
        <p>Wire endpoint-specific response models here for cards, tables, and JSON fallback views.</p>
      </Panel>
    </>
  );
}
