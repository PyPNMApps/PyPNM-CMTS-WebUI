import type { ReactNode } from "react";

interface PanelProps {
  title?: ReactNode;
  children: ReactNode;
}

export function Panel({ title, children }: PanelProps) {
  return (
    <section className="panel">
      {title ? (
        typeof title === "string" ? <h2>{title}</h2> : <div className="panel-title-row">{title}</div>
      ) : null}
      {children}
    </section>
  );
}
