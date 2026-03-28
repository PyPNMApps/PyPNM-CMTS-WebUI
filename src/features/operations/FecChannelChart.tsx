import { useMemo, useRef, useState } from "react";

import { ExportActions } from "@/components/common/ExportActions";
import { downloadCsv } from "@/lib/export/csv";
import { downloadSvgAsPng } from "@/lib/export/png";
import { formatEpochSecondsUtc } from "@/lib/formatters/dateTime";
import type { SingleFecSummaryProfileEntry } from "@/types/api";

interface FecChannelChartProps {
  title: string;
  profiles: SingleFecSummaryProfileEntry[];
  exportBaseName?: string;
}

const totalPalette = ["#79a9ff", "#4f7cff", "#9bbcff", "#3f68d8"] as const;
const correctedPalette = ["#f1c75b", "#d9a93f", "#ffd36d", "#c89a2f"] as const;
const uncorrectedPalette = ["#ff7a6b", "#e85f4f", "#ff998c", "#cc4c40"] as const;

function formatSi(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}G`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}k`;
  }
  return String(Math.round(value));
}

export function FecChannelChart({ title, profiles, exportBaseName }: FecChannelChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const defaultProfileKey = useMemo(() => {
    const profileZero = profiles.find((profile) => String(profile.profile) === "0");
    return String((profileZero ?? profiles[0])?.profile ?? "");
  }, [profiles]);
  const [visibleProfileKeys, setVisibleProfileKeys] = useState<string[]>(defaultProfileKey ? [defaultProfileKey] : []);
  const [visibleMetricKeys, setVisibleMetricKeys] = useState<string[]>(["total", "corrected", "uncorrected"]);
  const visibleProfiles = profiles.filter((profile) => visibleProfileKeys.includes(String(profile.profile)));
  const timestamps = visibleProfiles[0]?.codewords.timestamps ?? profiles[0]?.codewords.timestamps ?? [];
  const width = 980;
  const height = 320;
  const left = 52;
  const top = 16;
  const usableWidth = width - 76;
  const usableHeight = height - 56;
  const xCount = Math.max(timestamps.length - 1, 1);
  const totalMax = Math.max(...visibleProfiles.flatMap((profile) => profile.codewords.total_codewords), 1);
  const errorMax = Math.max(
    ...visibleProfiles.flatMap((profile) => [...profile.codewords.corrected, ...profile.codewords.uncorrected]),
    1,
  );
  const tickCount = Math.min(6, timestamps.length);
  const tickIndexes = new Set(
    Array.from({ length: tickCount }, (_, index) => Math.round((index * Math.max(timestamps.length - 1, 0)) / Math.max(tickCount - 1, 1))),
  );

  function buildPath(values: number[], maxValue: number) {
    return values
      .map((value, index) => {
        const x = left + (usableWidth * index) / xCount;
        const y = top + usableHeight - (value / maxValue) * usableHeight;
        return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  }

  return (
    <div className="chart-frame">
      <div className="chart-header">
        <div className="chart-title">{title}</div>
        {exportBaseName ? (
          <ExportActions
            onPng={() => {
              if (!svgRef.current) return;
              return downloadSvgAsPng(exportBaseName, svgRef.current);
            }}
            onCsv={() => downloadCsv(
              exportBaseName,
              profiles.flatMap((profile) =>
                profile.codewords.timestamps.map((timestamp, index) => ({
                  profile: profile.profile,
                  timestamp_utc: formatEpochSecondsUtc(timestamp),
                  total_codewords: profile.codewords.total_codewords[index] ?? "n/a",
                  corrected: profile.codewords.corrected[index] ?? "n/a",
                  uncorrected: profile.codewords.uncorrected[index] ?? "n/a",
                })),
              ),
            )}
          />
        ) : null}
      </div>
      <div className="status-chip-row fec-toggle-row">
        {profiles.map((profile, index) => {
          const profileKey = String(profile.profile);
          const isActive = visibleProfileKeys.includes(profileKey);
          return (
            <button
              key={`toggle-${profileKey}`}
              type="button"
              className={isActive ? "analysis-chip fec-toggle-chip active" : "analysis-chip fec-toggle-chip"}
              onClick={() => {
                setVisibleProfileKeys((current) => {
                  if (current.includes(profileKey)) {
                    return current.length === 1 ? current : current.filter((entry) => entry !== profileKey);
                  }
                  return [...current, profileKey];
                });
              }}
            >
              <span className="analysis-swatch" style={{ backgroundColor: totalPalette[index % totalPalette.length] }} />
              Profile {profile.profile}
            </button>
          );
        })}
      </div>
      <svg ref={svgRef} className="chart-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={title}>
        {Array.from({ length: 5 }, (_, index) => {
          const value = (totalMax / 4) * index;
          const y = top + usableHeight - (value / totalMax) * usableHeight;
          return (
            <g key={`total-y-${value}`}>
              <line x1={left} y1={y} x2={width - 24} y2={y} stroke="rgba(255,255,255,0.08)" />
              <text x="8" y={y + 4} fill="#9eb0c9" fontSize="11">
                {formatSi(value)}
              </text>
            </g>
          );
        })}
        <line x1={left} y1={height - 38} x2={width - 24} y2={height - 38} stroke="rgba(255,255,255,0.20)" />
        <line x1={left} y1={top} x2={left} y2={height - 38} stroke="rgba(255,255,255,0.20)" />
        {visibleProfiles.map((profile, index) => (
          <g key={`profile-${profile.profile}`}>
            {visibleMetricKeys.includes("total") ? (
              <path d={buildPath(profile.codewords.total_codewords, totalMax)} fill="none" stroke={totalPalette[index % totalPalette.length]} strokeWidth="1.2" />
            ) : null}
            {visibleMetricKeys.includes("corrected") ? (
              <path d={buildPath(profile.codewords.corrected, errorMax)} fill="none" stroke={correctedPalette[index % correctedPalette.length]} strokeWidth="1.2" strokeDasharray="4 3" />
            ) : null}
            {visibleMetricKeys.includes("uncorrected") ? (
              <path d={buildPath(profile.codewords.uncorrected, errorMax)} fill="none" stroke={uncorrectedPalette[index % uncorrectedPalette.length]} strokeWidth="1.2" strokeDasharray="2 3" />
            ) : null}
          </g>
        ))}
        {timestamps.map((timestamp, index) => {
          if (!tickIndexes.has(index)) {
            return null;
          }
          const x = left + (usableWidth * index) / xCount;
          const label = formatEpochSecondsUtc(timestamp).replace(" UTC", "").slice(11);
          return (
            <text
              key={`x-${timestamp}-${index}`}
              x={x}
              y={height - 10}
              fill="#9eb0c9"
              fontSize="10"
              textAnchor="end"
              transform={`rotate(-35 ${x} ${height - 10})`}
            >
              {label}
            </text>
          );
        })}
      </svg>
      <div className="status-chip-row fec-series-toggle-row">
        <button
          type="button"
          className={visibleMetricKeys.includes("total") ? "analysis-chip fec-toggle-chip active" : "analysis-chip fec-toggle-chip"}
          aria-pressed={visibleMetricKeys.includes("total")}
          onClick={() => {
            setVisibleMetricKeys((current) => {
              if (current.includes("total")) {
                return current.length === 1 ? current : current.filter((entry) => entry !== "total");
              }
              return [...current, "total"];
            });
          }}
        >
          <span className="analysis-swatch" style={{ backgroundColor: totalPalette[0] }} />
          Solid: Total Codewords
        </button>
        <button
          type="button"
          className={visibleMetricKeys.includes("corrected") ? "analysis-chip fec-toggle-chip active" : "analysis-chip fec-toggle-chip"}
          aria-pressed={visibleMetricKeys.includes("corrected")}
          onClick={() => {
            setVisibleMetricKeys((current) => {
              if (current.includes("corrected")) {
                return current.length === 1 ? current : current.filter((entry) => entry !== "corrected");
              }
              return [...current, "corrected"];
            });
          }}
        >
          <span className="analysis-swatch" style={{ backgroundColor: correctedPalette[0] }} />
          Dashed: Corrected
        </button>
        <button
          type="button"
          className={visibleMetricKeys.includes("uncorrected") ? "analysis-chip fec-toggle-chip active" : "analysis-chip fec-toggle-chip"}
          aria-pressed={visibleMetricKeys.includes("uncorrected")}
          onClick={() => {
            setVisibleMetricKeys((current) => {
              if (current.includes("uncorrected")) {
                return current.length === 1 ? current : current.filter((entry) => entry !== "uncorrected");
              }
              return [...current, "uncorrected"];
            });
          }}
        >
          <span className="analysis-swatch" style={{ backgroundColor: uncorrectedPalette[0] }} />
          Dotted: Uncorrected
        </button>
      </div>
    </div>
  );
}
