import { useRef } from "react";

import { ExportActions } from "@/components/common/ExportActions";
import { downloadCsv } from "@/lib/export/csv";
import { downloadSvgAsPng } from "@/lib/export/png";
import type { SingleConstellationDisplayAnalysisEntry } from "@/types/api";

function asPoints(values: SingleConstellationDisplayAnalysisEntry["soft"] | SingleConstellationDisplayAnalysisEntry["hard"]): Array<[number, number]> {
  if (Array.isArray(values)) {
    return values.filter((point): point is [number, number] => Array.isArray(point) && point.length >= 2);
  }
  if (values && Array.isArray(values.complex)) {
    return values.complex.filter((point): point is [number, number] => Array.isArray(point) && point.length >= 2);
  }
  return [];
}

interface ConstellationGridChartProps {
  channels: SingleConstellationDisplayAnalysisEntry[];
  exportBaseName?: string;
}

export function ConstellationGridChart({ channels, exportBaseName }: ConstellationGridChartProps) {
  const svgRefs = useRef<Record<string, SVGSVGElement | null>>({});
  const plots = channels.map((channel) => {
    const soft = asPoints(channel.soft);
    const hard = asPoints(channel.hard);
    const points = [...soft, ...hard];
    if (!points.length) {
      return { channel, soft, hard, bounds: null };
    }

    const xValues = points.map((point) => point[0]);
    const yValues = points.map((point) => point[1]);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);
    const span = Math.max(maxX - minX || 1, maxY - minY || 1);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const half = span / 2 + span * 0.07;

    return {
      channel,
      soft,
      hard,
      bounds: {
        minX: centerX - half,
        maxX: centerX + half,
        minY: centerY - half,
        maxY: centerY + half,
      },
    };
  });

  return (
    <div className="constellation-grid">
      {plots.map(({ channel, soft, hard, bounds }, index) => (
        <div key={channel.channel_id ?? index} className="constellation-tile">
          <div className="constellation-header-row">
            <span className="constellation-header-item">
              <span className="constellation-header-label">Channel</span>
              <span className="constellation-header-value">{channel.channel_id ?? "n/a"}</span>
            </span>
            <span className="constellation-header-item">
              <span className="constellation-header-label">QAM</span>
              <span className="constellation-header-value">{channel.modulation_order ?? "n/a"}</span>
            </span>
            <span className="constellation-header-item">
              <span className="constellation-header-label">Sample Symbols</span>
              <span className="constellation-header-value">{channel.num_sample_symbols ?? "n/a"}</span>
            </span>
          </div>
          {exportBaseName ? (
            <div className="operations-visual-actions">
              <ExportActions
                onPng={() => {
                  const svg = svgRefs.current[String(channel.channel_id ?? index)];
                  if (!svg) return;
                  return downloadSvgAsPng(`${exportBaseName}-channel-${channel.channel_id ?? index}`, svg);
                }}
                onCsv={() => downloadCsv(
                  `${exportBaseName}-channel-${channel.channel_id ?? index}`,
                  [
                    ...soft.map((point, pointIndex) => ({ point_type: "soft", point_index: pointIndex + 1, i: point[0], q: point[1] })),
                    ...hard.map((point, pointIndex) => ({ point_type: "hard", point_index: pointIndex + 1, i: point[0], q: point[1] })),
                  ],
                )}
              />
            </div>
          ) : null}
          <svg
            ref={(node) => {
              svgRefs.current[String(channel.channel_id ?? index)] = node;
            }}
            className="chart-svg chart-svg-square"
            viewBox="0 0 360 360"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label={`Constellation Channel ${channel.channel_id ?? "n/a"}`}
          >
            <rect x="28" y="28" width="304" height="304" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.18)" />
            <line x1="180" y1="28" x2="180" y2="332" stroke="rgba(255,255,255,0.12)" />
            <line x1="28" y1="180" x2="332" y2="180" stroke="rgba(255,255,255,0.12)" />
            {bounds
              ? soft.map((point, pointIndex) => {
                  const x = 28 + ((point[0] - bounds.minX) / (bounds.maxX - bounds.minX || 1)) * 304;
                  const y = 28 + 304 - ((point[1] - bounds.minY) / (bounds.maxY - bounds.minY || 1)) * 304;
                  return <circle key={`soft-${pointIndex}`} cx={x} cy={y} r="1.6" fill="rgba(47,98,255,0.72)" />;
                })
              : null}
            {bounds
              ? hard.map((point, pointIndex) => {
                  const x = 28 + ((point[0] - bounds.minX) / (bounds.maxX - bounds.minX || 1)) * 304;
                  const y = 28 + 304 - ((point[1] - bounds.minY) / (bounds.maxY - bounds.minY || 1)) * 304;
                  return <rect key={`hard-${pointIndex}`} x={x - 1.2} y={y - 1.2} width="2.4" height="2.4" fill="rgba(220,70,70,0.82)" />;
                })
              : null}
          </svg>
          <div className="status-chip-row">
            <span className="analysis-chip"><span className="analysis-swatch" style={{ backgroundColor: "rgba(47,98,255,0.85)" }} />Soft Points: {soft.length}</span>
            <span className="analysis-chip"><span className="analysis-swatch" style={{ backgroundColor: "rgba(220,70,70,0.85)" }} />Hard Points: {hard.length}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
