import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "@/layouts/AppLayout";

const AboutPage = lazy(() =>
  import("@/pages/AboutPage").then((module) => ({ default: module.AboutPage })),
);
const CmtsSgRxMerWorkflowPage = lazy(() =>
  import("@/pages/CmtsSgRxMerWorkflowPage").then((module) => ({ default: module.CmtsSgRxMerWorkflowPage })),
);
const AnalysisViewerPage = lazy(() =>
  import("@/pages/AnalysisViewerPage").then((module) => ({ default: module.AnalysisViewerPage })),
);
const EndpointExplorerPage = lazy(() =>
  import("@/pages/EndpointExplorerPage").then((module) => ({ default: module.EndpointExplorerPage })),
);
const FileListPage = lazy(() =>
  import("@/pages/FileListPage").then((module) => ({ default: module.FileListPage })),
);
const FileAnalysisPage = lazy(() =>
  import("@/pages/FileAnalysisPage").then((module) => ({ default: module.FileAnalysisPage })),
);
const FileHexdumpPage = lazy(() =>
  import("@/pages/FileHexdumpPage").then((module) => ({ default: module.FileHexdumpPage })),
);
const HealthPage = lazy(() =>
  import("@/pages/HealthPage").then((module) => ({ default: module.HealthPage })),
);
const MeasurementRequestPage = lazy(() =>
  import("@/pages/MeasurementRequestPage").then((module) => ({ default: module.MeasurementRequestPage })),
);
const ResultsPage = lazy(() =>
  import("@/pages/ResultsPage").then((module) => ({ default: module.ResultsPage })),
);
const SettingsPage = lazy(() =>
  import("@/pages/SettingsPage").then((module) => ({ default: module.SettingsPage })),
);

function RouteLoadingFallback() {
  return <p className="panel-copy">Loading page...</p>;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/serving-group/rxmer" replace />} />
          <Route path="/health" element={<HealthPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/serving-group" element={<Navigate to="/serving-group/rxmer" replace />} />
          <Route path="/serving-group/rxmer" element={<CmtsSgRxMerWorkflowPage />} />
          <Route path="/advanced" element={<Navigate to="/serving-group/rxmer" replace />} />
          <Route path="/advanced/rxmer" element={<Navigate to="/serving-group/rxmer" replace />} />
          <Route path="/advanced/channel-estimation" element={<Navigate to="/serving-group/rxmer" replace />} />
          <Route path="/advanced/ofdma-pre-eq" element={<Navigate to="/serving-group/rxmer" replace />} />
          <Route path="/single-capture" element={<Navigate to="/single-capture/rxmer" replace />} />
          <Route path="/single-capture/:operationId" element={<EndpointExplorerPage />} />
          <Route path="/spectrum-analyzer" element={<Navigate to="/spectrum-analyzer/friendly" replace />} />
          <Route path="/spectrum-analyzer/:operationId" element={<EndpointExplorerPage />} />
          <Route path="/endpoints" element={<Navigate to="/operations" replace />} />
          <Route path="/operations" element={<Navigate to="/operations/cmts-sg-ds-ofdm-rxmer" replace />} />
          <Route path="/operations/cmts-sg-ds-ofdm-rxmer" element={<CmtsSgRxMerWorkflowPage />} />
          <Route path="/operations/:operationId" element={<EndpointExplorerPage />} />
          <Route path="/operations/spectrum-analyzer" element={<Navigate to="/spectrum-analyzer/friendly" replace />} />
          <Route path="/operations/spectrum-analyzer-full-band" element={<Navigate to="/spectrum-analyzer/full-band" replace />} />
          <Route path="/operations/spectrum-analyzer-ofdm" element={<Navigate to="/spectrum-analyzer/ofdm" replace />} />
          <Route path="/operations/spectrum-analyzer-scqam" element={<Navigate to="/spectrum-analyzer/scqam" replace />} />
          <Route path="/measurements" element={<MeasurementRequestPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/files" element={<FileListPage />} />
          <Route path="/files/analyze/:analysisKey" element={<FileAnalysisPage />} />
          <Route path="/files/hexdump/:hexdumpKey" element={<FileHexdumpPage />} />
          <Route path="/analysis" element={<AnalysisViewerPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
