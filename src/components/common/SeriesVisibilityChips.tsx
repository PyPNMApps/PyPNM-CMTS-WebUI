import type { ChartSeries } from "@/features/analysis/types";

export function SeriesVisibilityChips({
  series,
  visibility,
  onToggle,
}: {
  series: ChartSeries[];
  visibility: Record<string, boolean>;
  onToggle: (label: string) => void;
}) {
  if (!series.length) {
    return null;
  }

  return (
    <div className="status-chip-row">
      {series.map((item) => {
        const visible = visibility[item.label] !== false;
        return (
          <button
            key={item.label}
            type="button"
            className={visible ? "analysis-chip interactive active" : "analysis-chip interactive"}
            onClick={() => onToggle(item.label)}
          >
            <span className="analysis-swatch" style={{ backgroundColor: item.color }} />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
