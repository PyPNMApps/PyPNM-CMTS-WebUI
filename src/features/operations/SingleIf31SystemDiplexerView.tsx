import { useRef } from "react";

import { ExportActions } from "@/components/common/ExportActions";
import { DeviceInfoTable } from "@/components/common/DeviceInfoTable";
import { downloadCsv } from "@/lib/export/csv";
import { downloadSvgAsPng } from "@/lib/export/png";
import { toDeviceInfo } from "@/lib/pypnm/deviceInfo";
import type { If31SystemDiplexerResponse } from "@/types/api";

function asNumber(value: number | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function fmtMhz(valueHz: number | null): string {
  return valueHz === null ? "n/a" : `${(valueHz / 1_000_000).toFixed(3)} MHz`;
}

function fmtCap(value: number | null): string {
  return value === null ? "n/a" : String(value);
}

type ResponsePoint = { x: number; y: number };

function buildButterworthCurves(
  bandEdgeHz: number | null,
  dsLowerHz: number | null,
  dsUpperHz: number | null,
): {
  upstream: ResponsePoint[];
  downstream: ResponsePoint[];
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
} {
  const xMin = 5;
  const xMax = 1400;
  const yMin = -60;
  const yMax = 5;
  const order = 9;
  const points = 200;
  const bandEdgeMhz = bandEdgeHz === null ? null : bandEdgeHz / 1_000_000;
  const dsLowerMhz = dsLowerHz === null ? null : dsLowerHz / 1_000_000;
  const dsUpperMhz = dsUpperHz === null ? null : dsUpperHz / 1_000_000;
  const upstream: ResponsePoint[] = [];
  const downstream: ResponsePoint[] = [];

  for (let index = 0; index <= points; index += 1) {
    const frequencyMhz = xMin + ((xMax - xMin) * index) / points;

    let upstreamMagnitude = yMin;
    if (bandEdgeMhz && bandEdgeMhz > 0) {
      const ratio = frequencyMhz / bandEdgeMhz;
      upstreamMagnitude = -10 * Math.log10(1 + ratio ** (2 * order));
      upstreamMagnitude = Math.max(upstreamMagnitude, yMin);
    }
    upstream.push({ x: frequencyMhz, y: upstreamMagnitude });

    let downstreamMagnitude = yMin;
    if (dsLowerMhz && dsUpperMhz && frequencyMhz >= 1) {
      const lowerRatio = dsLowerMhz / frequencyMhz;
      const lowerMagnitude = -10 * Math.log10(1 + lowerRatio ** (2 * order));
      const upperRatio = frequencyMhz / dsUpperMhz;
      const upperMagnitude = -10 * Math.log10(1 + upperRatio ** (2 * order));
      downstreamMagnitude = Math.max(lowerMagnitude + upperMagnitude, yMin);
    }
    downstream.push({ x: frequencyMhz, y: downstreamMagnitude });
  }

  return { upstream, downstream, xMin, xMax, yMin, yMax };
}

function buildPath(points: ResponsePoint[], width: number, height: number, xMin: number, xMax: number, yMin: number, yMax: number) {
  const left = 70;
  const top = 16;
  const usableWidth = width - 98;
  const usableHeight = height - 56;

  return points
    .map((point, index) => {
      const x = left + ((point.x - xMin) / (xMax - xMin || 1)) * usableWidth;
      const y = top + usableHeight - ((point.y - yMin) / (yMax - yMin || 1)) * usableHeight;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function markerX(valueMhz: number, width: number, xMin: number, xMax: number) {
  const left = 70;
  const usableWidth = width - 98;
  return left + ((valueMhz - xMin) / (xMax - xMin || 1)) * usableWidth;
}

function DiplexerResponseChart({
  bandEdgeHz,
  dsLowerHz,
  dsUpperHz,
  exportBaseName,
}: {
  bandEdgeHz: number | null;
  dsLowerHz: number | null;
  dsUpperHz: number | null;
  exportBaseName?: string;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const width = 1100;
  const height = 340;
  const { upstream, downstream, xMin, xMax, yMin, yMax } = buildButterworthCurves(bandEdgeHz, dsLowerHz, dsUpperHz);
  const xTicks = [5, 100, 200, 400, 600, 800, 1000, 1200, 1400];
  const yTicks = [-60, -45, -30, -15, 0, 5];
  const bandEdgeMhz = bandEdgeHz === null ? null : bandEdgeHz / 1_000_000;
  const dsLowerMhz = dsLowerHz === null ? null : dsLowerHz / 1_000_000;
  const dsUpperMhz = dsUpperHz === null ? null : dsUpperHz / 1_000_000;

  return (
    <div className="chart-frame">
      <div className="chart-header">
        {exportBaseName ? (
          <ExportActions
            onPng={() => {
              if (!svgRef.current) return;
              return downloadSvgAsPng(exportBaseName, svgRef.current);
            }}
            onCsv={() => downloadCsv(exportBaseName, [
              { metric: "us_cutoff_hz", value: bandEdgeHz ?? "n/a" },
              { metric: "ds_lower_hz", value: dsLowerHz ?? "n/a" },
              { metric: "ds_upper_hz", value: dsUpperHz ?? "n/a" },
            ])}
          />
        ) : null}
      </div>
      <svg ref={svgRef} className="chart-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="Diplexer frequency response">
        {yTicks.map((value) => {
          const y = 16 + (height - 56) - ((value - yMin) / (yMax - yMin || 1)) * (height - 56);
          return (
            <g key={`dip-y-${value}`}>
              <line x1="70" y1={y} x2={width - 28} y2={y} stroke="rgba(255,255,255,0.10)" />
              <text x="62" y={y + 4} fill="#9eb0c9" fontSize="11" textAnchor="end">{value}</text>
            </g>
          );
        })}
        {xTicks.map((value) => {
          const x = markerX(value, width, xMin, xMax);
          return (
            <g key={`dip-x-${value}`}>
              <line x1={x} y1="16" x2={x} y2={height - 40} stroke="rgba(255,255,255,0.07)" />
              <text x={x - 12} y={height - 18} fill="#9eb0c9" fontSize="11">{value}</text>
            </g>
          );
        })}
        {bandEdgeMhz !== null ? (
          <line
            x1={markerX(bandEdgeMhz, width, xMin, xMax)}
            y1="16"
            x2={markerX(bandEdgeMhz, width, xMin, xMax)}
            y2={height - 40}
            stroke="#ff6b6b"
            strokeDasharray="8 6"
            strokeWidth="1.5"
          />
        ) : null}
        {dsLowerMhz !== null ? (
          <line
            x1={markerX(dsLowerMhz, width, xMin, xMax)}
            y1="16"
            x2={markerX(dsLowerMhz, width, xMin, xMax)}
            y2={height - 40}
            stroke="#4dabf7"
            strokeDasharray="8 6"
            strokeWidth="1.5"
          />
        ) : null}
        {dsUpperMhz !== null ? (
          <line
            x1={markerX(dsUpperMhz, width, xMin, xMax)}
            y1="16"
            x2={markerX(dsUpperMhz, width, xMin, xMax)}
            y2={height - 40}
            stroke="#4dabf7"
            strokeDasharray="8 6"
            strokeWidth="1.5"
          />
        ) : null}
        <path d={buildPath(upstream, width, height, xMin, xMax, yMin, yMax)} fill="none" stroke="#ff6b6b" strokeWidth="2" />
        <path d={buildPath(downstream, width, height, xMin, xMax, yMin, yMax)} fill="none" stroke="#4dabf7" strokeWidth="2" />
        <line x1="70" y1={height - 40} x2={width - 28} y2={height - 40} stroke="rgba(255,255,255,0.20)" />
        <line x1="70" y1="16" x2="70" y2={height - 40} stroke="rgba(255,255,255,0.20)" />
        <text x={width / 2 - 42} y={height - 4} fill="#9eb0c9" fontSize="11">Frequency (MHz)</text>
        <text
          x="20"
          y={height / 2}
          fill="#9eb0c9"
          fontSize="11"
          textAnchor="middle"
          dominantBaseline="middle"
          transform={`rotate(-90 20 ${height / 2})`}
        >
          Magnitude (dB)
        </text>
      </svg>
    </div>
  );
}

export function SingleIf31SystemDiplexerView({ response }: { response: If31SystemDiplexerResponse }) {
  const deviceInfo = toDeviceInfo(
    response.device?.system_description ?? response.system_description,
    response.device?.mac_address ?? response.mac_address,
  );
  const diplexer = response.results?.diplexer;
  const diplexerCapability = asNumber(diplexer?.diplexer_capability);
  const cfgBandEdge = asNumber(diplexer?.cfg_band_edge);
  const dsLowerCapability = asNumber(diplexer?.ds_lower_capability);
  const cfgDsLowerBandEdge = asNumber(diplexer?.cfg_ds_lower_band_edge);
  const dsUpperCapability = asNumber(diplexer?.ds_upper_capability);
  const cfgDsUpperBandEdge = asNumber(diplexer?.cfg_ds_upper_band_edge);

  return (
    <div className="operations-visual-stack">
      <DeviceInfoTable deviceInfo={deviceInfo} />

      <div className="status-chip-row">
        <span className="analysis-chip"><b>MAC</b> {deviceInfo.macAddress}</span>
        <span className="analysis-chip"><b>Diplexer Capability</b> {fmtCap(diplexerCapability)}</span>
        <span className="analysis-chip"><b>Status</b> {response.status ?? "n/a"}</span>
      </div>

      <div className="chart-frame">
        <div className="chart-header">
          <div>
            <div className="chart-title">Diplexer Frequency Response (9th Order Butterworth)</div>
            <div className="chart-meta">{`MAC: ${deviceInfo.macAddress} | Diplexer Capability: ${fmtCap(diplexerCapability)}`}</div>
          </div>
        </div>
        <DiplexerResponseChart
          bandEdgeHz={cfgBandEdge}
          dsLowerHz={cfgDsLowerBandEdge}
          dsUpperHz={cfgDsUpperBandEdge}
          exportBaseName="single-if31-system-diplexer-response"
        />
        <div className="diplexer-legend">
          <div className="diplexer-legend-item">
            <span className="diplexer-legend-line upstream" />
            <span>{`Upstream (Low-Pass) | 5 - ${fmtMhz(cfgBandEdge)}`}</span>
          </div>
          <div className="diplexer-legend-item">
            <span className="diplexer-legend-line downstream" />
            <span>{`Downstream (High-Pass) | ${fmtMhz(cfgDsLowerBandEdge)} - ${fmtMhz(cfgDsUpperBandEdge)}`}</span>
          </div>
        </div>
      </div>

      <div className="analysis-summary-grid">
        <div className="analysis-metric-card">
          <div className="analysis-metric-label">US Cutoff (Band Edge)</div>
          <div className="analysis-metric-value mono">{fmtMhz(cfgBandEdge)}</div>
        </div>
        <div className="analysis-metric-card">
          <div className="analysis-metric-label">DS Lower Band Edge</div>
          <div className="analysis-metric-value mono">{fmtMhz(cfgDsLowerBandEdge)}</div>
        </div>
        <div className="analysis-metric-card">
          <div className="analysis-metric-label">DS Upper Band Edge</div>
          <div className="analysis-metric-value mono">{fmtMhz(cfgDsUpperBandEdge)}</div>
        </div>
        <div className="analysis-metric-card">
          <div className="analysis-metric-label">DS Lower/Upper Cap</div>
          <div className="analysis-metric-value mono">{`${fmtCap(dsLowerCapability)} / ${fmtCap(dsUpperCapability)}`}</div>
        </div>
      </div>
    </div>
  );
}
