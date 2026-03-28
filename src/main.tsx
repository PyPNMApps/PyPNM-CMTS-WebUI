import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";

import { InstanceConfigProvider } from "@/app/InstanceConfigProvider";
import { ThemeProvider } from "@/app/ThemeProvider";
import { AppErrorBoundary } from "@/components/common/AppErrorBoundary";
import { installGlobalLoggingHandlers } from "@/lib/logger";
import { AppRoutes } from "./routes/AppRoutes";
import { queryClient } from "./services/queryClient";
import "./assets/styles.css";

installGlobalLoggingHandlers();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <InstanceConfigProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </InstanceConfigProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  </React.StrictMode>,
);
