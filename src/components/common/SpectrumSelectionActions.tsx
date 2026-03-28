import type { SpectrumSelectionRange } from "@/lib/spectrumPower";
import { selectionToZoomDomain } from "@/lib/spectrumZoom";

export function SpectrumSelectionActions({
  selection,
  hasZoomDomain,
  showIntegratedPower = true,
  integratedPowerLabel = "Integrated Power",
  onIntegratedPowerClick,
  onApplyZoom,
  onResetZoom,
}: {
  selection: SpectrumSelectionRange | null;
  hasZoomDomain: boolean;
  showIntegratedPower?: boolean;
  integratedPowerLabel?: string;
  onIntegratedPowerClick?: () => void;
  onApplyZoom: (domain: [number, number]) => void;
  onResetZoom: () => void;
}) {
  const normalizedSelection = selectionToZoomDomain(selection);

  return (
    <div className="status-chip-row">
      {showIntegratedPower ? (
        <button
          type="button"
          className="analysis-chip-button"
          disabled={!normalizedSelection || !onIntegratedPowerClick}
          onClick={() => {
            if (normalizedSelection && onIntegratedPowerClick) {
              onIntegratedPowerClick();
            }
          }}
        >
          {integratedPowerLabel}
        </button>
      ) : null}
      <button
        type="button"
        className="analysis-chip-button"
        disabled={!normalizedSelection}
        onClick={() => {
          if (normalizedSelection) {
            onApplyZoom(normalizedSelection);
          }
        }}
      >
        Zoom
      </button>
      <button type="button" className="analysis-chip-button" disabled={!hasZoomDomain} onClick={onResetZoom}>
        Reset Zoom
      </button>
    </div>
  );
}
