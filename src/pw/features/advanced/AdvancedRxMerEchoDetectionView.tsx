import { ExportActions } from "@/components/common/ExportActions";
import { DeviceInfoTable } from "@/components/common/DeviceInfoTable";
import { Panel } from "@/components/common/Panel";
import { SpectrumSelectionActions } from "@/components/common/SpectrumSelectionActions";
import { LineAnalysisChart } from "@/pw/features/analysis/components/LineAnalysisChart";
import { downloadCsv } from "@/lib/export/csv";
import { buildExportBaseName } from "@/lib/export/naming";
import { toDeviceInfo } from "@/lib/pypnm/deviceInfo";
import type { ChartSeries } from "@/pw/features/analysis/types";
import type { SpectrumSelectionRange } from "@/lib/spectrumPower";
import type { AdvancedMultiRxMerAnalysisResponse, AdvancedMultiRxMerEchoChannel } from "@/types/api";
import { useState } from "react";

function buildSeries(channel: AdvancedMultiRxMerEchoChannel): ChartSeries[] {
  const frequency = channel.rxmer?.frequency ?? [];
  const avg = channel.rxmer?.avg ?? [];
  const preprocessed = channel.rxmer?.avg_preprocessed ?? [];
  return [
    {
      label: "RxMER Avg",
      color: "#79a9ff",
      points: frequency.slice(0, avg.length).map((value, index) => ({ x: value / 1_000_000, y: avg[index] ?? 0 })),
    },
    {
      label: "Preprocessed",
      color: "#58d0a7",
      points: frequency.slice(0, preprocessed.length).map((value, index) => ({ x: value / 1_000_000, y: preprocessed[index] ?? 0 })),
    },
  ];
}

export function AdvancedRxMerEchoDetectionView({ response }: { response: AdvancedMultiRxMerAnalysisResponse }) {
  const channels = Object.entries(response.data ?? {}) as Array<[string, AdvancedMultiRxMerEchoChannel]>;
  const macAddress = response.device?.mac_address ?? response.mac_address;
  const deviceInfo = toDeviceInfo(
    response.device?.system_description ?? response.system_description,
    response.device?.mac_address ?? response.mac_address,
  );
  const [selectionByChannel, setSelectionByChannel] = useState<Record<string, SpectrumSelectionRange | null>>({});
  const [zoomByChannel, setZoomByChannel] = useState<Record<string, [number, number] | null>>({});

  return (
    <div className="operations-visual-stack">
      <DeviceInfoTable deviceInfo={deviceInfo} />
      {channels.map(([channelId, channel]) => {
        const report = channel.echo_report as {
          dataset_info?: { subcarriers?: number; captures?: number };
          sample_rate_hz?: number;
          velocity_factor?: number;
          direct_path?: { time_s?: number; amplitude?: number };
          echoes?: Array<{ bin_index?: number; time_s?: number; amplitude?: number; distance_m?: number; distance_ft?: number }>;
        };
        const echoes = report?.echoes ?? [];
        return (
          <Panel key={channelId} title={`Channel ${channelId} · Echo Detection 1`}>
            <div className="status-chip-row">
              <span className="analysis-chip"><b>Captures</b> {report?.dataset_info?.captures ?? 0}</span>
              <span className="analysis-chip"><b>Subcarriers</b> {report?.dataset_info?.subcarriers ?? 0}</span>
              <span className="analysis-chip"><b>Sample Rate</b> {typeof report?.sample_rate_hz === "number" ? `${(report.sample_rate_hz / 1_000_000).toFixed(0)} MHz` : "n/a"}</span>
              <span className="analysis-chip"><b>VF</b> {typeof report?.velocity_factor === "number" ? report.velocity_factor.toFixed(2) : "n/a"}</span>
            </div>
            <LineAnalysisChart
              title={`RxMER Avg vs Preprocessed · Channel ${channelId}`}
              subtitle={echoes.length ? "Echo detected" : "No secondary echoes detected"}
              yLabel="dB"
              series={buildSeries(channel)}
              xDomain={zoomByChannel[channelId] ?? undefined}
              enableRangeSelection
              selection={selectionByChannel[channelId] ?? null}
              onSelectionChange={(nextSelection) => setSelectionByChannel((current) => ({
                ...current,
                [channelId]: nextSelection,
              }))}
              selectionActions={(
                <SpectrumSelectionActions
                  selection={selectionByChannel[channelId] ?? null}
                  hasZoomDomain={(zoomByChannel[channelId] ?? null) !== null}
                  showIntegratedPower={false}
                  onApplyZoom={(domain) => setZoomByChannel((current) => ({
                    ...current,
                    [channelId]: domain,
                  }))}
                  onResetZoom={() => setZoomByChannel((current) => ({
                    ...current,
                    [channelId]: null,
                  }))}
                />
              )}
              exportBaseName={buildExportBaseName(macAddress, undefined, `advanced-rxmer-echo-detection-channel-${channelId}`)}
            />
            <div className="operations-visual-actions">
              <ExportActions
                onCsv={() => downloadCsv(
                  buildExportBaseName(macAddress, undefined, `advanced-rxmer-echo-detection-channel-${channelId}-table`),
                  [
                    {
                      type: "Direct",
                      rank: 0,
                      delay_us: typeof report?.direct_path?.time_s === "number" ? (report.direct_path.time_s * 1_000_000).toFixed(3) : "0.000",
                      distance_m: "0.00",
                      distance_ft: "0.00",
                      amplitude: typeof report?.direct_path?.amplitude === "number" ? report.direct_path.amplitude.toFixed(3) : "n/a",
                    },
                    ...echoes.map((echo, index) => ({
                      type: "Echo",
                      rank: index + 1,
                      delay_us: typeof echo.time_s === "number" ? (echo.time_s * 1_000_000).toFixed(3) : "n/a",
                      distance_m: typeof echo.distance_m === "number" ? echo.distance_m.toFixed(2) : "n/a",
                      distance_ft: typeof echo.distance_ft === "number" ? echo.distance_ft.toFixed(2) : "n/a",
                      amplitude: typeof echo.amplitude === "number" ? echo.amplitude.toFixed(3) : "n/a",
                    })),
                  ],
                )}
              />
            </div>
            <div className="table-scroll">
              <table className="channel-metrics-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Rank</th>
                    <th>Delay (us)</th>
                    <th>Distance (m)</th>
                    <th>Distance (ft)</th>
                    <th>Amplitude</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Direct</td>
                    <td className="mono">0</td>
                    <td className="mono">{typeof report?.direct_path?.time_s === "number" ? (report.direct_path.time_s * 1_000_000).toFixed(3) : "0.000"}</td>
                    <td className="mono">0.00</td>
                    <td className="mono">0.00</td>
                    <td className="mono">{typeof report?.direct_path?.amplitude === "number" ? report.direct_path.amplitude.toFixed(3) : "n/a"}</td>
                  </tr>
                  {echoes.length ? echoes.map((echo, index) => (
                    <tr key={index}>
                      <td>Echo</td>
                      <td className="mono">{index + 1}</td>
                      <td className="mono">{typeof echo.time_s === "number" ? (echo.time_s * 1_000_000).toFixed(3) : "n/a"}</td>
                      <td className="mono">{typeof echo.distance_m === "number" ? echo.distance_m.toFixed(2) : "n/a"}</td>
                      <td className="mono">{typeof echo.distance_ft === "number" ? echo.distance_ft.toFixed(2) : "n/a"}</td>
                      <td className="mono">{typeof echo.amplitude === "number" ? echo.amplitude.toFixed(3) : "n/a"}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td>Echo</td>
                      <td className="mono">-</td>
                      <td className="mono" colSpan={4}>No secondary echoes in report</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        );
      })}
    </div>
  );
}
