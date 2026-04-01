import { Fragment, useMemo, useState, type ReactNode } from "react";

import { buildLinePreviewPath, computeLinePreviewBounds, type LinePreviewPoint } from "@/lib/charts/linePreview";

interface SpectrumChannelPreviewRow {
  key: string;
  previewLabel: string;
  previewPoints: LinePreviewPoint[];
  previewColor?: string;
  cells: ReactNode[];
  detail: ReactNode;
}

interface SpectrumChannelPreviewTableProps {
  columns: string[];
  rows: SpectrumChannelPreviewRow[];
}

function SpectrumLinePreview({
  points,
  width,
  height,
  color,
  label,
}: {
  points: LinePreviewPoint[];
  width: number;
  height: number;
  color: string;
  label: string;
}) {
  const bounds = useMemo(
    () => computeLinePreviewBounds(points),
    [points],
  );
  const pad = 4;
  const linePath = useMemo(
    () => buildLinePreviewPath(points, bounds, width, height, pad),
    [points, bounds, width, height],
  );

  return (
    <svg
      className="constellation-preview-svg"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={label}
    >
      <rect x={pad} y={pad} width={width - pad * 2} height={height - pad * 2} fill="rgba(255,255,255,0.04)" stroke="rgba(121,169,255,0.55)" />
      {linePath ? (
        <path d={linePath} fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <text x="50%" y="52%" textAnchor="middle" className="constellation-preview-empty-label">No Data</text>
      )}
    </svg>
  );
}

export function SpectrumChannelPreviewTable({
  columns,
  rows,
}: SpectrumChannelPreviewTableProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
            <th className="constellation-preview-column">Preview</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isExpanded = expandedKey === row.key;
            return (
              <Fragment key={row.key}>
                <tr>
                  {row.cells.map((cell, index) => (
                    <td key={`${row.key}-cell-${index}`}>{cell}</td>
                  ))}
                  <td className="constellation-preview-column">
                    <button
                      type="button"
                      className="constellation-preview-button"
                      onClick={() => setExpandedKey((current) => (current === row.key ? null : row.key))}
                      aria-expanded={isExpanded}
                      aria-label={`Toggle detail for ${row.previewLabel}`}
                    >
                      <span className="constellation-preview-thumb">
                        <SpectrumLinePreview
                          points={row.previewPoints}
                          width={68}
                          height={40}
                          color={row.previewColor ?? "#79a9ff"}
                          label={`${row.previewLabel} preview`}
                        />
                        <span className="constellation-preview-hover">
                          <SpectrumLinePreview
                            points={row.previewPoints}
                            width={300}
                            height={200}
                            color={row.previewColor ?? "#79a9ff"}
                            label={`${row.previewLabel} expanded preview`}
                          />
                        </span>
                      </span>
                    </button>
                  </td>
                </tr>
                {isExpanded ? (
                  <tr className="constellation-expanded-row">
                    <td colSpan={columns.length + 1}>
                      <div className="constellation-expanded-panel">
                        {row.detail}
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
