interface FoldablePanelTitleProps {
  id: string;
  label: string;
  isCollapsed: boolean;
  onToggle: () => void;
}

export function FoldablePanelTitle({ id, label, isCollapsed, onToggle }: FoldablePanelTitleProps) {
  return (
    <>
      <button
        type="button"
        className="panel-title-heading-button"
        aria-expanded={!isCollapsed}
        aria-controls={id}
        onClick={onToggle}
      >
        <span className="panel-title-heading">{label}</span>
      </button>
      <button
        type="button"
        className="panel-title-state-button"
        aria-expanded={!isCollapsed}
        aria-controls={id}
        onClick={onToggle}
      >
        <span className="panel-title-state">{isCollapsed ? "Show" : "Hide"}</span>
      </button>
    </>
  );
}
