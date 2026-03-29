import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";

import { PageHeader } from "@/components/common/PageHeader";
import { Panel } from "@/components/common/Panel";
import { SingleChannelEstCoeffCaptureView } from "@/pw/features/operations/SingleChannelEstCoeffCaptureView";
import { SingleConstellationDisplayCaptureView } from "@/pw/features/operations/SingleConstellationDisplayCaptureView";
import { SingleFecSummaryCaptureView } from "@/pw/features/operations/SingleFecSummaryCaptureView";
import { SingleHistogramCaptureView } from "@/pw/features/operations/SingleHistogramCaptureView";
import { SingleModulationProfileCaptureView } from "@/pw/features/operations/SingleModulationProfileCaptureView";
import { SingleRxMerCaptureView } from "@/pw/features/operations/SingleRxMerCaptureView";
import { isSupportedPnmFileType, loadFileAnalysisRecord, removeFileAnalysisRecord, toVisualResponse } from "@/lib/fileAnalysis";
import type {
  SingleChannelEstCoeffCaptureResponse,
  SingleConstellationDisplayCaptureResponse,
  SingleFecSummaryCaptureResponse,
  SingleHistogramCaptureResponse,
  SingleModulationProfileCaptureResponse,
  SingleRxMerCaptureResponse,
} from "@/types/api";
import { PnmFileType } from "@/types/pnmFileType";

export function FileAnalysisPage() {
  const { analysisKey = "" } = useParams();
  const record = loadFileAnalysisRecord(analysisKey);

  useEffect(() => {
    if (analysisKey && record) {
      removeFileAnalysisRecord(analysisKey);
    }
  }, [analysisKey, record]);

  if (!analysisKey) {
    return <Navigate to="/files" replace />;
  }

  if (!record) {
    return (
      <>
        <PageHeader title="File Analysis" subtitle="" />
        <Panel title="Analysis Session Missing">
          <p className="panel-copy">The requested file-analysis session was not found in browser storage.</p>
        </Panel>
      </>
    );
  }

  if (!isSupportedPnmFileType(record.pnmFileType)) {
    return (
      <>
        <PageHeader title="File Analysis" subtitle="" />
        <Panel title="Unsupported File Type">
          <div className="files-inspector-meta">
            <span className="analysis-chip"><b>Transaction</b> {record.transactionId}</span>
            <span className="analysis-chip"><b>PNM File Type</b> {record.pnmFileType}</span>
            <span className="analysis-chip"><b>Status</b> {record.status}</span>
          </div>
          <pre className="files-hexdump-viewer">{JSON.stringify(record.analysis, null, 2)}</pre>
        </Panel>
      </>
    );
  }

  return (
    <>
      <PageHeader title="File Analysis" subtitle="" />
      <Panel title="Analysis Context">
        <div className="files-inspector-meta">
          <span className="analysis-chip"><b>Transaction</b> {record.transactionId}</span>
          <span className="analysis-chip"><b>PNM File Type</b> {record.pnmFileType}</span>
          <span className="analysis-chip"><b>Status</b> {record.status}</span>
        </div>
      </Panel>

      <Panel>
        {record.pnmFileType === PnmFileType.RECEIVE_MODULATION_ERROR_RATIO ? (
          <SingleRxMerCaptureView
            response={toVisualResponse(record.pnmFileType, record) as SingleRxMerCaptureResponse}
          />
        ) : record.pnmFileType === PnmFileType.OFDM_CHANNEL_ESTIMATE_COEFFICIENT ? (
          <SingleChannelEstCoeffCaptureView
            response={toVisualResponse(record.pnmFileType, record) as SingleChannelEstCoeffCaptureResponse}
          />
        ) : record.pnmFileType === PnmFileType.OFDM_MODULATION_PROFILE ? (
          <SingleModulationProfileCaptureView
            response={toVisualResponse(record.pnmFileType, record) as SingleModulationProfileCaptureResponse}
          />
        ) : record.pnmFileType === PnmFileType.DOWNSTREAM_CONSTELLATION_DISPLAY ? (
          <SingleConstellationDisplayCaptureView
            response={toVisualResponse(record.pnmFileType, record) as SingleConstellationDisplayCaptureResponse}
          />
        ) : record.pnmFileType === PnmFileType.DOWNSTREAM_HISTOGRAM ? (
          <SingleHistogramCaptureView
            response={toVisualResponse(record.pnmFileType, record) as SingleHistogramCaptureResponse}
          />
        ) : (
          <SingleFecSummaryCaptureView
            response={toVisualResponse(record.pnmFileType, record) as SingleFecSummaryCaptureResponse}
          />
        )}
      </Panel>
    </>
  );
}
