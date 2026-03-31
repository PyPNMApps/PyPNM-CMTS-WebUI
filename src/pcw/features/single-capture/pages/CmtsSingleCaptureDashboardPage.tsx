import { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useInstanceConfig } from "@/app/useInstanceConfig";
import { CableModemDetailsModal } from "@/components/common/CableModemDetailsModal";
import { operationsMenuNavigationItems } from "@/pw/features/operations/operationsNavigation";
import {
  getServingGroupCableModems,
  type ServingGroupCableModemRow,
} from "@/pcw/services/servingGroupCableModemsService";
import { saveSelectedModemContext } from "@/pw/features/single-capture/lib/selectedModemContext";

type SortKey = "sgId" | "registrationStatus" | "vendor" | "model";
type SortDirection = "asc" | "desc";
type FilterMode = "all" | "operational";
type RowAction = "single-capture" | "advanced" | "operation" | "spectrum-analyzer";

function toRegistrationStatusTone(statusText: string, statusCode: number | null): "operational" | "non_operational" {
  if (statusCode === 8 || statusText.trim().toLowerCase() === "operational") {
    return "operational";
  }
  return "non_operational";
}

function isOperational(row: ServingGroupCableModemRow): boolean {
  return toRegistrationStatusTone(row.registrationStatusText, row.registrationStatusCode) === "operational";
}

function sortRows(rows: ServingGroupCableModemRow[], key: SortKey, direction: SortDirection): ServingGroupCableModemRow[] {
  return [...rows].sort((left, right) => {
    let value = 0;
    if (key === "sgId") {
      value = left.sgId - right.sgId;
    } else if (key === "registrationStatus") {
      value = left.registrationStatusText.localeCompare(right.registrationStatusText);
    } else if (key === "vendor") {
      value = left.vendor.localeCompare(right.vendor);
    } else if (key === "model") {
      value = left.model.localeCompare(right.model);
    }
    if (value !== 0) {
      return direction === "asc" ? value : -value;
    }
    return left.macAddress.localeCompare(right.macAddress);
  });
}

const singleCaptureRoutes = [
  { to: "/single-capture/dashboard", label: "Dashboard" },
] as const;


export function CmtsSingleCaptureDashboardPage() {
  const { selectedInstance } = useInstanceConfig();
  const navigate = useNavigate();

  const [rows, setRows] = useState<ServingGroupCableModemRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [sortKey, setSortKey] = useState<SortKey>("sgId");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [searchText, setSearchText] = useState("");
  const [lastRefreshEpochMs, setLastRefreshEpochMs] = useState<number | null>(null);
  const [lastRefreshMode, setLastRefreshMode] = useState<"light" | "heavy">("light");
  const [heavyPollingEnabled, setHeavyPollingEnabled] = useState(false);
  const [detailsRow, setDetailsRow] = useState<ServingGroupCableModemRow | null>(null);
  const [rowActionByKey, setRowActionByKey] = useState<Record<string, RowAction>>({});
  const [operationPickerRow, setOperationPickerRow] = useState<ServingGroupCableModemRow | null>(null);
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(true);

  const operationMenuGroups = useMemo(() => {
    const levelOneEntries = [...new Set(operationsMenuNavigationItems.map((item) => item.menuPath[0]))];
    return levelOneEntries.map((levelOne) => {
      const levelOneItems = operationsMenuNavigationItems.filter((item) => item.menuPath[0] === levelOne);
      const levelTwoEntries = [...new Set(levelOneItems.map((item) => item.menuPath[1]))];
      return {
        levelOne,
        levelTwoGroups: levelTwoEntries.map((levelTwo) => ({
          levelTwo,
          items: levelOneItems.filter((item) => item.menuPath[1] === levelTwo),
        })),
      };
    });
  }, []);

  const refreshCableModems = useCallback(async (mode: "light" | "heavy") => {
    if (!selectedInstance?.baseUrl) {
      setRows([]);
      setErrorMessage("No instance selected.");
      return;
    }
    setIsLoading(true);
    setErrorMessage("");
    try {
      const nextRows = await getServingGroupCableModems(selectedInstance.baseUrl, [], mode);
      setRows(nextRows);
      setLastRefreshEpochMs(Date.now());
      setLastRefreshMode(mode);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load cable modems.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedInstance?.baseUrl]);

  useEffect(() => {
    void refreshCableModems("light");
  }, [refreshCableModems]);

  useEffect(() => {
    if (!heavyPollingEnabled || !selectedInstance?.baseUrl) {
      return;
    }
    const intervalId = window.setInterval(() => {
      void refreshCableModems("heavy");
    }, 5000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [heavyPollingEnabled, refreshCableModems, selectedInstance?.baseUrl]);

  const visibleRows = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();
    const filteredByMode = filterMode === "all" ? rows : rows.filter((row) => isOperational(row));
    const filteredBySearch = normalizedSearch
      ? filteredByMode.filter((row) =>
        row.macAddress.includes(normalizedSearch)
        || row.ipAddress.toLowerCase().includes(normalizedSearch))
      : filteredByMode;
    return sortRows(filteredBySearch, sortKey, sortDirection);
  }, [rows, filterMode, searchText, sortKey, sortDirection]);

  function toggleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(nextKey);
    setSortDirection("asc");
  }

  function sortIndicator(key: SortKey): string {
    if (sortKey !== key) {
      return "";
    }
    return sortDirection === "asc" ? " ▲" : " ▼";
  }

  function persistSelectedModemContext(row: ServingGroupCableModemRow) {
    saveSelectedModemContext({
      sgId: row.sgId,
      macAddress: row.macAddress,
      ipAddress: row.ipAddress,
      snmpCommunity: selectedInstance?.requestDefaults?.snmpRwCommunity ?? "private",
      channelIds: row.channelIds,
      selectedAtEpochMs: Date.now(),
    });
  }

  function openSingleCaptureOperation(row: ServingGroupCableModemRow) {
    persistSelectedModemContext(row);
    navigate("/single-capture/rxmer");
  }

  function openAdvancedOperation(row: ServingGroupCableModemRow) {
    persistSelectedModemContext(row);
    navigate("/advanced/rxmer");
  }

  function openOperationsRoute(row: ServingGroupCableModemRow) {
    setOperationPickerRow(row);
  }

  function openOperationFromPicker(routePath: string) {
    if (!operationPickerRow) {
      return;
    }
    persistSelectedModemContext(operationPickerRow);
    setOperationPickerRow(null);
    navigate(routePath);
  }

  function openSpectrumAnalyzerRoute(row: ServingGroupCableModemRow) {
    persistSelectedModemContext(row);
    navigate("/single-capture/spectrum-analyzer/friendly");
  }

  function openSelectedRowAction(row: ServingGroupCableModemRow) {
    const selectedAction = rowActionByKey[row.key] ?? "single-capture";
    if (selectedAction === "advanced") {
      openAdvancedOperation(row);
      return;
    }
    if (selectedAction === "operation") {
      openOperationsRoute(row);
      return;
    }
    if (selectedAction === "spectrum-analyzer") {
      openSpectrumAnalyzerRoute(row);
      return;
    }
    openSingleCaptureOperation(row);
  }

  return (
    <>
      <nav className="advanced-subnav">
        {singleCaptureRoutes.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <article className="chart-frame capture-request-group">
        <details className="capture-request-dropdown single-capture-toolbar-dropdown" open={!isControlsCollapsed}>
          <summary
            className="capture-request-dropdown-summary"
            onClick={(event) => {
              event.preventDefault();
              setIsControlsCollapsed((current) => !current);
            }}
          >
            <span>Dashboard Controls</span>
            <span className="capture-request-group-meta">{isControlsCollapsed ? "Show" : "Hide"}</span>
          </summary>
          <div className="capture-request-top-grid">
            <div className="field capture-request-compact-input">
              <label htmlFor="single-capture-cm-search">Search MAC/IP</label>
              <input
                id="single-capture-cm-search"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Filter by MAC or IP"
              />
            </div>
            <div className="status-chip-row single-capture-toolbar-meta">
              <span className="analysis-chip"><b>Total</b> {rows.length}</span>
              <span className="analysis-chip"><b>Visible</b> {visibleRows.length}</span>
              <span className="analysis-chip"><b>Operational</b> {rows.filter((row) => isOperational(row)).length}</span>
              <span className="analysis-chip">
                <b>Poll Mode</b> {lastRefreshMode} · <b>Last Refresh</b> {lastRefreshEpochMs ? new Date(lastRefreshEpochMs).toLocaleTimeString() : "n/a"}
              </span>
            </div>
            <div className="status-chip-row single-capture-toolbar-controls">
              <button
                type="button"
                className={filterMode === "all" ? "analysis-chip-button active" : "analysis-chip-button"}
                onClick={() => setFilterMode("all")}
              >
                All
              </button>
              <button
                type="button"
                className={filterMode === "operational" ? "analysis-chip-button active" : "analysis-chip-button"}
                onClick={() => setFilterMode("operational")}
              >
                Operational Only
              </button>
              <div className="single-capture-poll-group" role="group" aria-label="Polling controls">
                <button
                  type="button"
                  className="single-capture-poll-button"
                  disabled={isLoading}
                  onClick={() => {
                    void refreshCableModems("light");
                  }}
                >
                  Light Poll
                </button>
                <button
                  type="button"
                  className={heavyPollingEnabled ? "single-capture-poll-button active" : "single-capture-poll-button"}
                  disabled={isLoading}
                  onClick={() => {
                    setHeavyPollingEnabled((current) => !current);
                    void refreshCableModems("heavy");
                  }}
                >
                  {heavyPollingEnabled ? "Heavy Polling On" : "Heavy Poll"}
                </button>
              </div>
            </div>
          </div>
        </details>
        {isLoading ? <p className="panel-copy">Loading cable modems...</p> : null}
        {errorMessage ? <p className="advanced-error-text">{errorMessage}</p> : null}
      </article>

      <article className="chart-frame">
        <div className="table-wrap capture-request-table-wrap single-capture-dashboard-table-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  <button type="button" className="analysis-chip-button" onClick={() => toggleSort("sgId")}>
                    SG{sortIndicator("sgId")}
                  </button>
                </th>
                <th>MAC Address</th>
                <th>IP Address</th>
                <th>
                  <button type="button" className="analysis-chip-button" onClick={() => toggleSort("registrationStatus")}>
                    Registration Status{sortIndicator("registrationStatus")}
                  </button>
                </th>
                <th>
                  <button type="button" className="analysis-chip-button" onClick={() => toggleSort("vendor")}>
                    Vendor{sortIndicator("vendor")}
                  </button>
                </th>
                <th>
                  <button type="button" className="analysis-chip-button" onClick={() => toggleSort("model")}>
                    Model{sortIndicator("model")}
                  </button>
                </th>
                <th>Version</th>
                <th className="single-capture-action-header">Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.key}>
                  <td>{row.sgId}</td>
                  <td className="mono">{row.macAddress}</td>
                  <td className="mono">{row.ipAddress}</td>
                  <td className="single-capture-status-cell">
                    <span className={isOperational(row) ? "analysis-chip status-operational" : "analysis-chip status-non-operational"}>
                      {row.registrationStatusText.toUpperCase()}
                    </span>
                  </td>
                  <td>{row.vendor}</td>
                  <td>{row.model}</td>
                  <td>{row.softwareVersion}</td>
                  <td className="single-capture-action-cell">
                    <div className="single-capture-row-actions">
                      <button type="button" className="operations-json-download" onClick={() => setDetailsRow(row)}>
                        Details
                      </button>
                      <select
                        className="single-capture-row-action-select"
                        value={rowActionByKey[row.key] ?? "single-capture"}
                        onChange={(event) => {
                          const nextAction = event.target.value as RowAction;
                          setRowActionByKey((current) => ({
                            ...current,
                            [row.key]: nextAction,
                          }));
                        }}
                      >
                        <option value="single-capture">SingleCapture</option>
                        <option value="advanced">Advanced</option>
                        <option value="operation">Operation</option>
                        <option value="spectrum-analyzer">Spectrum Analyzer</option>
                      </select>
                      <button type="button" className="operations-json-download" onClick={() => openSelectedRowAction(row)}>
                        Go
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!visibleRows.length && !isLoading ? (
                <tr>
                  <td colSpan={8}>
                    <p className="panel-copy">No cable modems match the current filters.</p>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>
      <CableModemDetailsModal details={detailsRow} onClose={() => setDetailsRow(null)} />
      {operationPickerRow ? (
        <div
          className="selection-insights-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="single-capture-operation-picker-title"
          onClick={() => setOperationPickerRow(null)}
        >
          <div className="selection-insights-modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="selection-insights-modal-header">
              <h3 id="single-capture-operation-picker-title" className="selection-insights-modal-title">Pick Operation</h3>
              <button type="button" className="selection-insights-modal-close" onClick={() => setOperationPickerRow(null)}>
                Close
              </button>
            </div>
            <p className="panel-copy">
              {operationPickerRow.macAddress} · {operationPickerRow.ipAddress}
            </p>
            <div className="operations-menu-columns">
              {operationMenuGroups.map((group) => (
                <section key={group.levelOne} className="operations-menu-column">
                  <div className="operations-menu-heading">{group.levelOne}</div>
                  {group.levelTwoGroups.map((subgroup) => (
                    <div key={`${group.levelOne}-${subgroup.levelTwo}`} className="operations-menu-group">
                      <div className="operations-menu-subheading">{subgroup.levelTwo}</div>
                      <div className="operations-menu-links">
                        {subgroup.items.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className="operations-menu-link operation-picker-link-button"
                            onClick={() => openOperationFromPicker(item.routePath)}
                          >
                            <span>{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </section>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
