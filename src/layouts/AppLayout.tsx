import { Outlet } from "react-router-dom";

import { AppTopNav } from "@/components/layout/AppTopNav";

export function AppLayout() {
  return (
    <div className="app-shell">
      <AppTopNav />
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
