import { Component, type ErrorInfo, type ReactNode } from "react";

import { logError } from "@/lib/logger";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logError("React render error", {
      error: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="page-shell">
          <div className="panel">
            <h2 className="operations-selected-title">Application Error</h2>
            <p className="advanced-error-text">A runtime error was captured. Check <code>logs/console.log</code> while running `pypnm-webui serve`.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
