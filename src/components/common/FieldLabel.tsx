import type { ReactNode } from "react";

interface FieldLabelProps {
  htmlFor: string;
  children: ReactNode;
  hint?: string;
}

export function FieldLabel({ htmlFor, children, hint }: FieldLabelProps) {
  return (
    <label htmlFor={htmlFor} className="field-label">
      <span>{children}</span>
      {hint ? (
        <span className="field-hint" title={hint} aria-label={hint}>
          ?
        </span>
      ) : null}
    </label>
  );
}
