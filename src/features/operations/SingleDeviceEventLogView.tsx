import { DeviceInfoTable } from "@/components/common/DeviceInfoTable";
import { Panel } from "@/components/common/Panel";
import { toDeviceInfo } from "@/lib/pypnm/deviceInfo";
import type { DeviceEventLogEntry, DeviceEventLogResponse } from "@/types/api";

interface EventLogRow {
  firstMs: number | null;
  lastMs: number | null;
  firstTime: string;
  lastTime: string;
  level: number | string;
  levelClass: string;
  eventId: string;
  counts: number | string;
  eventType: string;
  chanId: string;
  profile: string;
  dsid: string;
  cmtsMac: string;
  fullText: string;
  textPreview: string;
}

interface EventLogStats {
  level6: number;
  level5: number;
  level4: number;
  level3: number;
  levelOther: number;
  earliest: string;
  latest: string;
  timeSpan: string;
  topEventIds: Array<{ id: string; sumCounts: number; occurrences: number }>;
}

function normalizeMac(mac: string | undefined): string {
  if (!mac) {
    return "n/a";
  }

  const cleaned = mac.trim().toLowerCase();
  if (cleaned.includes(":")) {
    return cleaned;
  }

  if (cleaned.length !== 12) {
    return cleaned;
  }

  return cleaned.match(/.{1,2}/g)?.join(":") ?? cleaned;
}

function parseTime(value: string | undefined): { ms: number | null; text: string } {
  if (!value) {
    return { ms: null, text: "n/a" };
  }

  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) {
    return { ms: null, text: value };
  }

  return { ms, text: value };
}

function clipText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}...`;
}

function extractField(pattern: RegExp, text: string): string | null {
  const match = text.match(pattern);
  return match?.[1] ?? null;
}

function toLevelClass(level: number): string {
  if (level === 6) {
    return "lvl6";
  }
  if (level === 5) {
    return "lvl5";
  }
  if (level === 4) {
    return "lvl4";
  }
  if (level === 3) {
    return "lvl3";
  }
  return "lvlX";
}

function uniqueRows(logs: DeviceEventLogEntry[]): DeviceEventLogEntry[] {
  const seen = new Set<string>();
  const rows: DeviceEventLogEntry[] = [];

  for (const entry of logs) {
    const key = [
      String(entry.docsDevEvId ?? ""),
      String(entry.docsDevEvLevel ?? ""),
      String(entry.docsDevEvFirstTime ?? ""),
      String(entry.docsDevEvLastTime ?? ""),
      String(entry.docsDevEvCounts ?? ""),
      String(entry.docsDevEvText ?? ""),
    ].join("|");

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    rows.push(entry);
  }

  return rows;
}

function toRows(logs: DeviceEventLogEntry[]): EventLogRow[] {
  return uniqueRows(logs)
    .map((entry) => {
      const first = parseTime(entry.docsDevEvFirstTime);
      const last = parseTime(entry.docsDevEvLastTime);
      const text = String(entry.docsDevEvText ?? "");
      const levelNumber = Number(entry.docsDevEvLevel);
      const countsNumber = Number(entry.docsDevEvCounts);

      return {
        firstMs: first.ms,
        lastMs: last.ms,
        firstTime: first.text,
        lastTime: last.text,
        level: Number.isFinite(levelNumber) ? levelNumber : "n/a",
        levelClass: toLevelClass(levelNumber),
        eventId: String(entry.docsDevEvId ?? "n/a"),
        counts: Number.isFinite(countsNumber) ? countsNumber : String(entry.docsDevEvCounts ?? "n/a"),
        eventType: extractField(/Event Type Code:\s*([0-9]+)\s*;/i, text) ?? "n/a",
        chanId:
          extractField(/Chan ID:\s*([0-9]+)\s*;/i, text) ??
          extractField(/US Chan ID:\s*([0-9]+)\s*;/i, text) ??
          "n/a",
        profile:
          extractField(/Profile ID:\s*([0-9]+)\s*;/i, text) ??
          extractField(/New Profile:\s*([0-9]+)\s*;/i, text) ??
          "n/a",
        dsid: extractField(/DSID:\s*([0-9A-Za-z/]+)\s*;/i, text) ?? "n/a",
        cmtsMac: normalizeMac(extractField(/CMTS-MAC=([0-9a-fA-F:]{17}|[0-9a-fA-F]{12})\s*;/i, text) ?? undefined),
        fullText: text || "n/a",
        textPreview: clipText(text || "n/a", 120),
      };
    })
    .sort((left, right) => {
      const leftFirst = left.firstMs ?? Number.POSITIVE_INFINITY;
      const rightFirst = right.firstMs ?? Number.POSITIVE_INFINITY;
      if (leftFirst !== rightFirst) {
        return leftFirst - rightFirst;
      }

      const leftLast = left.lastMs ?? Number.POSITIVE_INFINITY;
      const rightLast = right.lastMs ?? Number.POSITIVE_INFINITY;
      if (leftLast !== rightLast) {
        return leftLast - rightLast;
      }

      return left.eventId.localeCompare(right.eventId);
    });
}

function formatIso(ms: number | null): string {
  if (ms === null) {
    return "n/a";
  }

  try {
    return new Date(ms).toISOString();
  } catch {
    return "n/a";
  }
}

function formatTimeSpan(start: number | null, end: number | null): string {
  if (start === null || end === null) {
    return "n/a";
  }

  const totalSeconds = Math.max(0, Math.floor((end - start) / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts: string[] = [];

  if (days) {
    parts.push(`${days}d`);
  }
  if (days || hours) {
    parts.push(`${hours}h`);
  }
  if (days || hours || minutes) {
    parts.push(`${minutes}m`);
  }
  parts.push(`${seconds}s`);

  return parts.join(" ");
}

function toStats(rows: EventLogRow[]): EventLogStats {
  let earliest: number | null = null;
  let latest: number | null = null;
  const levelCounts = { 3: 0, 4: 0, 5: 0, 6: 0, other: 0 };
  const byId = new Map<string, { id: string; sumCounts: number; occurrences: number }>();

  for (const row of rows) {
    if (row.level === 6) {
      levelCounts[6] += 1;
    } else if (row.level === 5) {
      levelCounts[5] += 1;
    } else if (row.level === 4) {
      levelCounts[4] += 1;
    } else if (row.level === 3) {
      levelCounts[3] += 1;
    } else {
      levelCounts.other += 1;
    }

    for (const time of [row.firstMs, row.lastMs]) {
      if (time === null) {
        continue;
      }
      earliest = earliest === null ? time : Math.min(earliest, time);
      latest = latest === null ? time : Math.max(latest, time);
    }

    const count = typeof row.counts === "number" ? row.counts : Number(row.counts);
    const existing = byId.get(row.eventId) ?? { id: row.eventId, sumCounts: 0, occurrences: 0 };
    existing.sumCounts += Number.isFinite(count) ? count : 0;
    existing.occurrences += 1;
    byId.set(row.eventId, existing);
  }

  return {
    level6: levelCounts[6],
    level5: levelCounts[5],
    level4: levelCounts[4],
    level3: levelCounts[3],
    levelOther: levelCounts.other,
    earliest: formatIso(earliest),
    latest: formatIso(latest),
    timeSpan: formatTimeSpan(earliest, latest),
    topEventIds: [...byId.values()]
      .sort((left, right) => right.sumCounts - left.sumCounts || right.occurrences - left.occurrences || left.id.localeCompare(right.id))
      .slice(0, 8),
  };
}

function statusText(status: number | string | undefined): string {
  if (status === 0) {
    return "Success";
  }

  if (status === undefined || status === null) {
    return "n/a";
  }

  return String(status);
}

export function SingleDeviceEventLogView({ response }: { response: DeviceEventLogResponse }) {
  const logs = response.logs ?? [];
  const rows = toRows(logs);
  const stats = toStats(rows);
  const macAddress = response.device?.mac_address ?? response.mac_address;
  const systemDescription = response.device?.system_description ?? response.system_description;
  const deviceInfo = toDeviceInfo(systemDescription, macAddress);

  return (
    <div className="operations-visual-stack">
      <DeviceInfoTable deviceInfo={deviceInfo} />

      <div className="status-chip-row">
        <span className="analysis-chip"><b>MAC</b> {normalizeMac(macAddress)}</span>
        <span className="analysis-chip"><b>Status</b> {statusText(response.status)}</span>
        <span className="analysis-chip"><b>Raw Entries</b> {logs.length}</span>
        <span className="analysis-chip"><b>Unique Entries</b> {rows.length}</span>
        <span className="analysis-chip"><b>Time Span</b> {stats.timeSpan}</span>
      </div>

      {response.message ? <p className="panel-copy">{response.message}</p> : null}

      <Panel title="Event Table">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>First Time</th>
                <th>Last Time</th>
                <th>Level</th>
                <th>Event ID</th>
                <th>Counts</th>
                <th>Event Type</th>
                <th>Chan ID</th>
                <th>Profile</th>
                <th>DSID</th>
                <th>CMTS-MAC</th>
                <th>Text</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row.eventId}-${row.firstTime}-${row.lastTime}-${index}`}>
                  <td>{row.firstTime}</td>
                  <td>{row.lastTime}</td>
                  <td>
                    <span className={`event-level-pill ${row.levelClass}`}>L{row.level}</span>
                  </td>
                  <td className="mono">{row.eventId}</td>
                  <td>{row.counts}</td>
                  <td>{row.eventType}</td>
                  <td>{row.chanId}</td>
                  <td>{row.profile}</td>
                  <td>{row.dsid}</td>
                  <td className="mono">{row.cmtsMac}</td>
                  <td className="event-log-text-cell" title={row.fullText}>{row.textPreview}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="panel-copy">Duplicates are removed using Event ID, level, timestamps, counts, and text.</p>
      </Panel>

      <Panel title="Useful Stats">
        <div className="analysis-summary-grid">
          <div className="analysis-metric-card">
            <div className="analysis-metric-label">Critical (L6)</div>
            <div className="analysis-metric-value">{stats.level6}</div>
            <div className="analysis-metric-help">Unique level 6 events</div>
          </div>
          <div className="analysis-metric-card">
            <div className="analysis-metric-label">Warning (L5)</div>
            <div className="analysis-metric-value">{stats.level5}</div>
            <div className="analysis-metric-help">Unique level 5 events</div>
          </div>
          <div className="analysis-metric-card">
            <div className="analysis-metric-label">Earliest</div>
            <div className="analysis-metric-value event-log-metric-value">{stats.earliest}</div>
            <div className="analysis-metric-help">First observable timestamp</div>
          </div>
          <div className="analysis-metric-card">
            <div className="analysis-metric-label">Latest</div>
            <div className="analysis-metric-value event-log-metric-value">{stats.latest}</div>
            <div className="analysis-metric-help">Last observable timestamp</div>
          </div>
        </div>

        <div className="grid two">
          <div className="analysis-metric-card">
            <div className="analysis-metric-label">Top Event IDs By Total Counts</div>
            <ol className="event-log-list">
              {stats.topEventIds.map((item) => (
                <li key={item.id}>
                  <span className="mono">{item.id}</span> {item.sumCounts} counts ({item.occurrences} unique)
                </li>
              ))}
            </ol>
          </div>
          <div className="analysis-metric-card">
            <div className="analysis-metric-label">Level Distribution (Unique)</div>
            <ul className="event-log-list">
              <li><span className="event-level-pill lvl6">L6</span> {stats.level6}</li>
              <li><span className="event-level-pill lvl5">L5</span> {stats.level5}</li>
              <li><span className="event-level-pill lvl4">L4</span> {stats.level4}</li>
              <li><span className="event-level-pill lvl3">L3</span> {stats.level3}</li>
              <li><span className="event-level-pill lvlX">Other</span> {stats.levelOther}</li>
            </ul>
          </div>
        </div>
      </Panel>
    </div>
  );
}
