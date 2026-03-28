import { DeviceInfoTable } from "@/components/common/DeviceInfoTable";
import { formatEpochSecondsUtc } from "@/lib/formatters/dateTime";
import { toDeviceInfo } from "@/lib/pypnm/deviceInfo";
import type { SingleHistogramCaptureResponse } from "@/types/api";

import { HistogramBarChart } from "./HistogramBarChart";

export function SingleHistogramCaptureView({ response }: { response: SingleHistogramCaptureResponse }) {
  const firstAnalysis = response.data?.analysis?.[0];
  const hitCounts = firstAnalysis?.hit_counts ?? [];

  if (!firstAnalysis) {
    return <p className="panel-copy">No histogram capture data available yet.</p>;
  }

  const deviceInfo = toDeviceInfo(
    firstAnalysis.device_details?.system_description ?? response.system_description,
    firstAnalysis.mac_address ?? response.mac_address,
  );

  return (
    <div className="operations-visual-stack">
      <div className="status-chip-row">
        <span className="analysis-chip">
          <b>Bins</b> {hitCounts.length}
        </span>
        <span className="analysis-chip">
          <b>Capture Time</b> {formatEpochSecondsUtc(firstAnalysis.pnm_header?.capture_time)}
        </span>
      </div>

      <DeviceInfoTable deviceInfo={deviceInfo} />

      <HistogramBarChart title="Histogram Distribution" values={hitCounts} exportBaseName="single-histogram-distribution" />
    </div>
  );
}
