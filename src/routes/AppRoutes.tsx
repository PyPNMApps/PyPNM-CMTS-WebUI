import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { PRODUCT_PROFILE_PCW, resolveProductProfile } from "@/app/productProfile";
import { AppLayout } from "@/layouts/AppLayout";

const AboutPage = lazy(() =>
  import("@/pcw/pages/AboutPage").then((module) => ({ default: module.AboutPage })),
);
const CmtsSgRxMerWorkflowPage = lazy(() =>
  import("@/pcw/pages/CmtsSgRxMerWorkflowPage").then((module) => ({ default: module.CmtsSgRxMerWorkflowPage })),
);
const CmtsSgChannelEstCoeffWorkflowPage = lazy(() =>
  import("@/pcw/pages/CmtsSgChannelEstCoeffWorkflowPage").then((module) => ({ default: module.CmtsSgChannelEstCoeffWorkflowPage })),
);
const CmtsSgFecSummaryWorkflowPage = lazy(() =>
  import("@/pcw/pages/CmtsSgFecSummaryWorkflowPage").then((module) => ({ default: module.CmtsSgFecSummaryWorkflowPage })),
);
const CmtsSgConstellationDisplayWorkflowPage = lazy(() =>
  import("@/pcw/pages/CmtsSgConstellationDisplayWorkflowPage").then((module) => ({ default: module.CmtsSgConstellationDisplayWorkflowPage })),
);
const CmtsSgModulationProfileWorkflowPage = lazy(() =>
  import("@/pcw/pages/CmtsSgModulationProfileWorkflowPage").then((module) => ({ default: module.CmtsSgModulationProfileWorkflowPage })),
);
const CmtsSgHistogramWorkflowPage = lazy(() =>
  import("@/pcw/pages/CmtsSgHistogramWorkflowPage").then((module) => ({ default: module.CmtsSgHistogramWorkflowPage })),
);
const CmtsSpectrumFriendlyWorkflowPage = lazy(() =>
  import("@/pcw/features/spectrum-analyzer/pages/CmtsSpectrumFriendlyWorkflowPage").then((module) => ({ default: module.CmtsSpectrumFriendlyWorkflowPage })),
);
const CmtsSingleCaptureDashboardPage = lazy(() =>
  import("@/pcw/features/single-capture/pages/CmtsSingleCaptureDashboardPage").then((module) => ({
    default: module.CmtsSingleCaptureDashboardPage,
  })),
);
const AdvancedPage = lazy(() =>
  import("@/pw/pages/AdvancedPage").then((module) => ({ default: module.AdvancedPage })),
);
const AnalysisViewerPage = lazy(() =>
  import("@/pw/pages/AnalysisViewerPage").then((module) => ({ default: module.AnalysisViewerPage })),
);
const EndpointExplorerPage = lazy(() =>
  import("@/pw/pages/EndpointExplorerPage").then((module) => ({ default: module.EndpointExplorerPage })),
);
const FileListPage = lazy(() =>
  import("@/pcw/pages/FileListPage").then((module) => ({ default: module.FileListPage })),
);
const FileAnalysisPage = lazy(() =>
  import("@/pcw/pages/FileAnalysisPage").then((module) => ({ default: module.FileAnalysisPage })),
);
const FileHexdumpPage = lazy(() =>
  import("@/pcw/pages/FileHexdumpPage").then((module) => ({ default: module.FileHexdumpPage })),
);
const HealthPage = lazy(() =>
  import("@/pcw/pages/HealthPage").then((module) => ({ default: module.HealthPage })),
);
const MeasurementRequestPage = lazy(() =>
  import("@/pcw/pages/MeasurementRequestPage").then((module) => ({ default: module.MeasurementRequestPage })),
);
const ResultsPage = lazy(() =>
  import("@/pcw/pages/ResultsPage").then((module) => ({ default: module.ResultsPage })),
);
const SettingsPage = lazy(() =>
  import("@/pcw/pages/SettingsPage").then((module) => ({ default: module.SettingsPage })),
);

function RouteLoadingFallback() {
  return <p className="panel-copy">Loading page...</p>;
}

function ProfileConfigurationError() {
  return (
    <div className="panel-container">
      <article className="panel">
        <h2>Invalid Runtime Profile</h2>
        <p className="panel-copy">Set VITE_PRODUCT_PROFILE to pypnm-webui or pypnm-cmts-webui and restart the WebUI.</p>
      </article>
    </div>
  );
}

export function AppRoutes() {
  const profile = resolveProductProfile();
  if (!profile) {
    return <ProfileConfigurationError />;
  }

  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        <Route element={<AppLayout />}>
          {profile === PRODUCT_PROFILE_PCW ? (
            <>
              <Route path="/" element={<Navigate to="/serving-group/rxmer" replace />} />
              <Route path="/serving-group" element={<Navigate to="/serving-group/rxmer" replace />} />
              <Route path="/serving-group/rxmer" element={<CmtsSgRxMerWorkflowPage />} />
              <Route path="/serving-group/channel-est-coeff" element={<CmtsSgChannelEstCoeffWorkflowPage />} />
              <Route path="/serving-group/fec-summary" element={<CmtsSgFecSummaryWorkflowPage />} />
              <Route path="/serving-group/constellation-display" element={<CmtsSgConstellationDisplayWorkflowPage />} />
              <Route path="/serving-group/modulation-profile" element={<CmtsSgModulationProfileWorkflowPage />} />
              <Route path="/serving-group/histogram" element={<CmtsSgHistogramWorkflowPage />} />
              <Route path="/single-capture" element={<Navigate to="/single-capture/dashboard" replace />} />
              <Route path="/single-capture/dashboard" element={<CmtsSingleCaptureDashboardPage />} />
              <Route path="/single-capture/spectrum-analyzer" element={<Navigate to="/single-capture/spectrum-analyzer/friendly" replace />} />
              <Route path="/single-capture/spectrum-analyzer/:operationId" element={<EndpointExplorerPage />} />
              <Route path="/single-capture/rxmer" element={<EndpointExplorerPage />} />
              <Route path="/single-capture/:operationId" element={<EndpointExplorerPage />} />
              <Route path="/spectrum-analyzer" element={<Navigate to="/spectrum-analyzer/friendly" replace />} />
              <Route path="/spectrum-analyzer/friendly" element={<CmtsSpectrumFriendlyWorkflowPage />} />
              <Route path="/spectrum-analyzer/:operationId" element={<Navigate to="/spectrum-analyzer/friendly" replace />} />
              <Route path="/operations" element={<Navigate to="/operations/cmts-sg-ds-ofdm-rxmer" replace />} />
              <Route path="/operations/cmts-sg-ds-ofdm-rxmer" element={<CmtsSgRxMerWorkflowPage />} />
              <Route path="/operations/cmts-sg-ds-ofdm-channel-est-coeff" element={<CmtsSgChannelEstCoeffWorkflowPage />} />
              <Route path="/operations/cmts-sg-ds-ofdm-fec-summary" element={<CmtsSgFecSummaryWorkflowPage />} />
              <Route path="/operations/cmts-sg-ds-ofdm-constellation-display" element={<CmtsSgConstellationDisplayWorkflowPage />} />
              <Route path="/operations/cmts-sg-ds-ofdm-modulation-profile" element={<CmtsSgModulationProfileWorkflowPage />} />
              <Route path="/operations/cmts-sg-ds-histogram" element={<CmtsSgHistogramWorkflowPage />} />
              <Route path="/operations/cmts-sg-ds-ofdm-histogram" element={<CmtsSgHistogramWorkflowPage />} />
              <Route path="/operations/cmts-spectrum-friendly" element={<CmtsSpectrumFriendlyWorkflowPage />} />
            </>
          ) : (
            <>
              <Route path="/" element={<Navigate to="/single-capture/rxmer" replace />} />
              <Route path="/single-capture" element={<Navigate to="/single-capture/rxmer" replace />} />
              <Route path="/single-capture/spectrum-analyzer" element={<Navigate to="/single-capture/spectrum-analyzer/friendly" replace />} />
              <Route path="/single-capture/spectrum-analyzer/:operationId" element={<EndpointExplorerPage />} />
              <Route path="/single-capture/:operationId" element={<EndpointExplorerPage />} />
              <Route path="/spectrum-analyzer" element={<Navigate to="/single-capture/spectrum-analyzer/friendly" replace />} />
              <Route path="/spectrum-analyzer/:operationId" element={<Navigate to="/single-capture/spectrum-analyzer/friendly" replace />} />
              <Route path="/operations" element={<EndpointExplorerPage />} />
              <Route path="/operations/:operationId" element={<EndpointExplorerPage />} />
              <Route path="/operations/spectrum-analyzer" element={<Navigate to="/single-capture/spectrum-analyzer/friendly" replace />} />
              <Route path="/operations/spectrum-analyzer-full-band" element={<Navigate to="/single-capture/spectrum-analyzer/full-band" replace />} />
              <Route path="/operations/spectrum-analyzer-ofdm" element={<Navigate to="/single-capture/spectrum-analyzer/ofdm" replace />} />
              <Route path="/operations/spectrum-analyzer-scqam" element={<Navigate to="/single-capture/spectrum-analyzer/scqam" replace />} />
            </>
          )}
          <Route path="/advanced" element={<Navigate to="/advanced/rxmer" replace />} />
          <Route path="/advanced/rxmer" element={<AdvancedPage />} />
          <Route path="/advanced/channel-estimation" element={<AdvancedPage />} />
          <Route path="/advanced/ofdma-pre-eq" element={<AdvancedPage />} />
          <Route path="/endpoints" element={<Navigate to="/operations" replace />} />
          <Route path="/measurements" element={<MeasurementRequestPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/files" element={<FileListPage />} />
          <Route path="/files/analyze/:analysisKey" element={<FileAnalysisPage />} />
          <Route path="/files/hexdump/:hexdumpKey" element={<FileHexdumpPage />} />
          <Route path="/analysis" element={<AnalysisViewerPage />} />
          <Route path="/health" element={<HealthPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
