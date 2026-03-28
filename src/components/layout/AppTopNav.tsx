import { useTheme } from "@/app/useTheme";
import { NavLink } from "react-router-dom";

import { InstanceSelector } from "@/components/layout/InstanceSelector";

const links = [
  ["/advanced/rxmer", "RxMER"],
] as const;

function PyPnmWebUiIcon() {
  return <img src="/images/PyPNM-WebUI-favicon.ico" alt="" aria-hidden="true" className="top-nav-brand-icon" />;
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="theme-toggle-icon">
      <circle cx="12" cy="12" r="4.25" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1M18.7 18.7l-2.1-2.1M7.4 7.4 5.3 5.3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="theme-toggle-icon">
      <path d="M18.2 14.6A7.7 7.7 0 0 1 9.4 5.8a7.8 7.8 0 1 0 8.8 8.8Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AppTopNav() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="top-nav">
      <NavLink to="/advanced/rxmer" end className="top-nav-brand" aria-label="PyPNM CMTS WebUI home">
        <PyPnmWebUiIcon />
        <h1>PyPNM CMTS WebUI</h1>
      </NavLink>
      <nav className="top-nav-links">
        {links.map(([to, label]) => (
          <NavLink key={to} to={to} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="top-nav-instance">
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>
        <InstanceSelector />
      </div>
    </header>
  );
}
