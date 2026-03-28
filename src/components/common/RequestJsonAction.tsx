import type { ReactNode } from "react";

interface RequestJsonActionProps {
  disabled: boolean;
  onClick: () => void;
  children?: ReactNode;
}

export function RequestJsonAction({ disabled, onClick, children }: RequestJsonActionProps) {
  return (
    <button type="button" className="operations-json-download" disabled={disabled} onClick={onClick}>
      {children ?? "Download JSON"}
    </button>
  );
}
