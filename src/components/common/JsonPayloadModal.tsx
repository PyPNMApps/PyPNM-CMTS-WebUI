interface JsonPayloadModalProps {
  id: string;
  title: string;
  payload: unknown;
  isOpen: boolean;
  onClose: () => void;
}

export function JsonPayloadModal({ id, title, payload, isOpen, onClose }: JsonPayloadModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="selection-insights-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${id}-title`}
      onClick={onClose}
    >
      <div className="selection-insights-modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="selection-insights-modal-header">
          <h3 id={`${id}-title`} className="selection-insights-modal-title">{title}</h3>
          <button type="button" className="operations-json-download" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="field">
          <textarea
            id={id}
            className="mono"
            value={`${JSON.stringify(payload ?? {}, null, 2)}\n`}
            readOnly
            rows={24}
          />
        </div>
      </div>
    </div>
  );
}
