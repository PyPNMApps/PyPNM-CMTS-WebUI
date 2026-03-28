import { useRef } from "react";

import { ExportActions } from "@/components/common/ExportActions";
import { DeviceInfoTable } from "@/components/common/DeviceInfoTable";
import { downloadCsv } from "@/lib/export/csv";
import { downloadSvgAsPng } from "@/lib/export/png";
import { toDeviceInfo } from "@/lib/pypnm/deviceInfo";
import type { FddSystemDiplexerConfigurationResponse } from "@/types/api";

function asNumber(value: number | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function fmtMhz(value: number | null): string {
  return value === null || value <= 0 ? "unconfigured" : `${value.toFixed(0)} MHz`;
}

type ResponsePoint = { x: number; y: number };

function buildButterworthCurves(
  usUpperMhz: number | null,
  dsLowerMhz: number | null,
  dsUpperMhz: number | null,
): {
  upstream: ResponsePoint[];
  downstream: ResponsePoint[];
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
} {
  const xMin = 5;
  const xMax = 1800;
  const yMin = -60;
  const yMax = 5;
  const order = 9;
  const points = 240;
  const upstream: ResponsePoint[] = [];
  const downstream: ResponsePoint[] = [];

  for (let index = 0; index <= points; index += 1) {
    const frequencyMhz = xMin + ((xMax - xMin) * index) / points;

    let upstreamMagnitude = yMin;
    if (usUpperMhz && usUpperMhz > 0) {
      const ratio = frequencyMhz / usUpperMhz;
      upstreamMagnitude = -10 * Math.log10(1 + ratio ** (2 * order));
      upstreamMagnitude = Math.max(upstreamMagnitude, yMin);
    }
    upstream.push({ x: frequencyMhz, y: upstreamMagnitude });

    let downstreamMagnitude = yMin;
    if (dsLowerMhz && dsUpperMhz && dsLowerMhz > 0 && dsUpperMhz > 0 && frequencyMhz >= 1) {
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

function FddDiplexerResponseChart({
  usUpperMhz,
  dsLowerMhz,
  dsUpperMhz,
  exportBaseName,
}: {
  usUpperMhz: number | null;
  dsLowerMhz: number | null;
  dsUpperMhz: number | null;
  exportBaseName?: string;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const width = 1100;
  const height = 340;
  const { upstream, downstream, xMin, xMax, yMin, yMax } = buildButterworthCurves(usUpperMhz, dsLowerMhz, dsUpperMhz);
  const xTicks = [5, 100, 250, 500, 750, 1000, 1250, 1500, 1750];
  const yTicks = [-60, -45, -30, -15, 0, 5];

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
              { metric: "us_upper_mhz", value: usUpperMhz ?? "n/a" },
              { metric: "ds_lower_mhz", value: dsLowerMhz ?? "n/a" },
              { metric: "ds_upper_mhz", value: dsUpperMhz ?? "n/a" },
            ])}
          />
        ) : null}
      </div>
      <svg ref={svgRef} className="chart-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="FDD diplexer frequency response">
        {yTicks.map((value) => {
          const y = 16 + (height - 56) - ((value - yMin) / (yMax - yMin || 1)) * (height - 56);
          return (
            <g key={`fdd-y-${value}`}>
              <line x1="70" y1={y} x2={width - 28} y2={y} stroke="rgba(255,255,255,0.10)" />
              <text x="62" y={y + 4} fill="#9eb0c9" fontSize="11" textAnchor="end">{value}</text>
            </g>
          );
        })}
        {xTicks.map((value) => {
          const x = markerX(value, width, xMin, xMax);
          return (
            <g key={`fdd-x-${value}`}>
              <line x1={x} y1="16" x2={x} y2={height - 40} stroke="rgba(255,255,255,0.07)" />
              <text x={x - 12} y={height - 18} fill="#9eb0c9" fontSize="11">{value}</text>
            </g>
          );
        })}
        {usUpperMhz !== null && usUpperMhz > 0 ? (
          <line x1={markerX(usUpperMhz, width, xMin, xMax)} y1="16" x2={markerX(usUpperMhz, width, xMin, xMax)} y2={height - 40} stroke="#ff6b6b" strokeDasharray="8 6" strokeWidth="1.5" />
        ) : null}
        {dsLowerMhz !== null && dsLowerMhz > 0 ? (
          <line x1={markerX(dsLowerMhz, width, xMin, xMax)} y1="16" x2={markerX(dsLowerMhz, width, xMin, xMax)} y2={height - 40} stroke="#4dabf7" strokeDasharray="8 6" strokeWidth="1.5" />
        ) : null}
        {dsUpperMhz !== null && dsUpperMhz > 0 ? (
          <line x1={markerX(dsUpperMhz, width, xMin, xMax)} y1="16" x2={markerX(dsUpperMhz, width, xMin, xMax)} y2={height - 40} stroke="#4dabf7" strokeDasharray="8 6" strokeWidth="1.5" />
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

export function SingleFddSystemDiplexerConfigurationView({ response }: { response: FddSystemDiplexerConfigurationResponse }) {
  const deviceInfo = toDeviceInfo(
    response.device?.system_description ?? response.system_description,
    response.device?.mac_address ?? response.mac_address,
  );
  const index = response.results?.index ?? "n/a";
  const dsLower = asNumber(response.results?.entry?.docsFddCmFddSystemCfgStateDiplexerDsLowerBandEdgeCfg);
  const dsUpper = asNumber(response.results?.entry?.docsFddCmFddSystemCfgStateDiplexerDsUpperBandEdgeCfg);
  const usUpper = asNumber(response.results?.entry?.docsFddCmFddSystemCfgStateDiplexerUsUpperBandEdgeCfg);
  const configuredEdges = [dsLower, dsUpper, usUpper].filter((value) => value !== null && value > 0).length;

  return (
    <div className="operations-visual-stack">
      <DeviceInfoTable deviceInfo={deviceInfo} />

      <div className="status-chip-row">
        <span className="analysis-chip"><b>MAC</b> {deviceInfo.macAddress}</span>
        <span className="analysis-chip"><b>Status</b> {response.status ?? "n/a"}</span>
        <span className="analysis-chip"><b>Index</b> {index}</span>
        <span className="analysis-chip"><b>Configured Edges</b> {configuredEdges}/3</span>
      </div>

      <div className="chart-frame">
        <div className="chart-header">
          <div>
            <div className="chart-title">Diplexer Frequency Response (9th Order Butterworth)</div>
            <div className="chart-meta">{`MAC: ${deviceInfo.macAddress} | Active FDD System Diplexer`}</div>
          </div>
        </div>
        <FddDiplexerResponseChart
          usUpperMhz={usUpper}
          dsLowerMhz={dsLower}
          dsUpperMhz={dsUpper}
          exportBaseName="single-fdd-system-diplexer-response"
        />
        <div className="diplexer-legend">
          <div className="diplexer-legend-item">
            <span className="diplexer-legend-line upstream" />
            <span>{`Upstream (Low-Pass) | 5 - ${fmtMhz(usUpper)}`}</span>
          </div>
          <div className="diplexer-legend-item">
            <span className="diplexer-legend-line downstream" />
            <span>{`Downstream (High-Pass) | ${fmtMhz(dsLower)} - ${fmtMhz(dsUpper)}`}</span>
          </div>
        </div>
      </div>

      <div className="analysis-summary-grid">
        <div className="analysis-metric-card">
          <div className="analysis-metric-label">US Upper Band Edge</div>
          <div className="analysis-metric-value mono">{fmtMhz(usUpper)}</div>
        </div>
        <div className="analysis-metric-card">
          <div className="analysis-metric-label">DS Lower Band Edge</div>
          <div className="analysis-metric-value mono">{fmtMhz(dsLower)}</div>
        </div>
        <div className="analysis-metric-card">
          <div className="analysis-metric-label">DS Upper Band Edge</div>
          <div className="analysis-metric-value mono">{fmtMhz(dsUpper)}</div>
        </div>
        <div className="analysis-metric-card">
          <div className="analysis-metric-label">Configured Edge Count</div>
          <div className="analysis-metric-value mono">{configuredEdges}/3</div>
        </div>
      </div>
    </div>
  );
}
