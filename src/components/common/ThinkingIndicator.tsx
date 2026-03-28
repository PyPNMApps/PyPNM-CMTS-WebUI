interface ThinkingIndicatorProps {
  label: string;
  compact?: boolean;
}

export function ThinkingIndicator({ label, compact = false }: ThinkingIndicatorProps) {
  return (
    <div className={compact ? "thinking-indicator compact" : "thinking-indicator"} role="status" aria-live="polite">
      <span className="thinking-indicator-icon" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
