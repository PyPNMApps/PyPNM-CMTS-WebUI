import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";

import { PageHeader } from "@/components/common/PageHeader";
import { Panel } from "@/components/common/Panel";
import { loadFileHexdumpRecord, removeFileHexdumpRecord } from "@/lib/fileHexdump";

export function FileHexdumpPage() {
  const { hexdumpKey = "" } = useParams();
  const record = loadFileHexdumpRecord(hexdumpKey);

  useEffect(() => {
    if (hexdumpKey && record) {
      removeFileHexdumpRecord(hexdumpKey);
    }
  }, [hexdumpKey, record]);

  if (!hexdumpKey) {
    return <Navigate to="/files" replace />;
  }

  if (!record) {
    return (
      <>
        <PageHeader title="File Hexdump" subtitle="" />
        <Panel title="Hexdump Session Missing">
          <p className="panel-copy">The requested hexdump session was not found in browser storage.</p>
        </Panel>
      </>
    );
  }

  return (
    <>
      <PageHeader title="File Hexdump" subtitle="" />
      <Panel title="Hexdump Context">
        <div className="files-inspector-meta">
          <span className="analysis-chip"><b>Transaction</b> {record.transactionId}</span>
          <span className="analysis-chip"><b>Bytes / Line</b> {record.bytesPerLine}</span>
        </div>
      </Panel>
      <Panel title="Hexdump">
        <pre className="files-hexdump-viewer">{record.lines.join("\n")}</pre>
      </Panel>
    </>
  );
}
