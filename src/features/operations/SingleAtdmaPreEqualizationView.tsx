import { DeviceInfoTable } from "@/components/common/DeviceInfoTable";
import { Panel } from "@/components/common/Panel";
import { LineAnalysisChart } from "@/features/analysis/components/LineAnalysisChart";
import { toDeviceInfo } from "@/lib/pypnm/deviceInfo";
import type { AtdmaPreEqRecord, AtdmaPreEqTap, AtdmaPreEqualizationResponse } from "@/types/api";

interface PostTapRow {
  tapLabel: string;
  deltaDelayUs: string;
  echoMeters: string;
  echoFeet: string;
}

function asNumber(value: number | string | undefined | null): number | null {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function fmt(value: number | null, digits = 2, suffix = ""): string {
  return value === null ? "n/a" : `${value.toFixed(digits)}${suffix}`;
}

function severity(record: AtdmaPreEqRecord): "ok" | "warning" | "violation" {
  const mainTapRatio = asNumber(record.metrics?.main_tap_ratio);
  const nonMain = asNumber(record.metrics?.non_main_tap_energy_ratio);
  if (mainTapRatio !== null && nonMain !== null) {
    if (mainTapRatio >= 35 && nonMain <= -35) return "ok";
    if (mainTapRatio >= 28 && nonMain <= -28) return "warning";
    return "violation";
  }
  return "warning";
}

function mainTapIndex(record: AtdmaPreEqRecord): number | null {
  const main = asNumber(record.main_tap_location);
  const taps = asNumber(record.num_taps);
  if (main === null || taps === null) return null;
  if (main >= 1 && main <= taps) return main - 1;
  if (main >= 0 && main < taps) return main;
  return null;
}

function strongestPostTapIndex(record: AtdmaPreEqRecord, mainIdx: number | null): number | null {
  const taps = record.taps ?? [];
  if (mainIdx === null) return null;
  let bestIndex: number | null = null;
  let bestDb = -Infinity;
  for (let i = mainIdx + 1; i < taps.length; i += 1) {
    const db = asNumber(taps[i]?.magnitude_power_dB);
    if (db !== null && db > bestDb) {
      bestDb = db;
      bestIndex = i;
    }
  }
  return bestIndex;
}

function buildPostTapRows(record: AtdmaPreEqRecord, mainIdx: number | null): PostTapRow[] {
  const taps = record.taps ?? [];
  if (mainIdx === null || !taps[mainIdx]) return [];
  const mainDelay = asNumber(taps[mainIdx]?.delay_us);
  return taps.slice(mainIdx + 1, mainIdx + 17).map((tap, offset) => {
    const tapDelay = asNumber(tap.delay_us);
    const deltaDelay = mainDelay !== null && tapDelay !== null ? tapDelay - mainDelay : null;
    const meters = asNumber(tap.cable_length_m);
    const feet = asNumber(tap.cable_length_ft);
    return {
      tapLabel: `T${offset + 1}`,
      deltaDelayUs: fmt(deltaDelay, 5, " μs"),
      echoMeters: fmt(meters, 2, " m"),
      echoFeet: fmt(feet, 2, " ft"),
    };
  });
}

function TapBars({ taps, mainIdx, postPeakIdx }: { taps: AtdmaPreEqTap[]; mainIdx: number | null; postPeakIdx: number | null }) {
  const values = taps.map((tap) => asNumber(tap.magnitude_power_dB)).filter((value): value is number => value !== null);
  const minDb = values.length ? Math.min(...values) : -40;
  const maxDb = values.length ? Math.max(...values) : 0;
  const span = Math.max(1, maxDb - minDb);

  const shouldScroll = taps.length > 16;
  const minColumnWidth = shouldScroll ? 32 : 28;

  return (
    <div
      className={shouldScroll ? "atdma-preeq-bars scroll" : "atdma-preeq-bars"}
      style={{ gridTemplateColumns: `repeat(${taps.length}, minmax(${minColumnWidth}px, 1fr))` }}
    >
      {taps.map((tap, index) => {
        const db = asNumber(tap.magnitude_power_dB);
        const pct = db === null ? 6 : Math.max(6, Math.min(100, ((db - minDb) / span) * 100));
        const tone = index === mainIdx ? "main" : index === postPeakIdx ? "postpeak" : "default";
        return (
          <div key={`tap-${index}`} className="atdma-preeq-bar-column">
            <div className="atdma-preeq-bar-slot">
              <div className={`atdma-preeq-bar ${tone}`} style={{ height: `${pct.toFixed(2)}%` }} />
            </div>
            <div className="mono atdma-preeq-bar-label">T{index + 1}</div>
          </div>
        );
      })}
    </div>
  );
}

export function SingleAtdmaPreEqualizationView({ response }: { response: AtdmaPreEqualizationResponse }) {
  const deviceInfo = toDeviceInfo(
    response.device?.system_description ?? response.system_description,
    response.device?.mac_address ?? response.mac_address,
  );
  const entries = Object.entries(response.results ?? {}).sort((left, right) => Number(left[0]) - Number(right[0]));

  return (
    <div className="operations-visual-stack">
      <DeviceInfoTable deviceInfo={deviceInfo} />

      <div className="status-chip-row">
        <span className="analysis-chip"><b>MAC</b> {deviceInfo.macAddress}</span>
        <span className="analysis-chip"><b>Status</b> {String(response.status ?? "n/a")}</span>
        <span className="analysis-chip"><b>Channels</b> {entries.length}</span>
      </div>

      {response.message ? <p className="panel-copy">{response.message}</p> : null}

      {entries.map(([usKey, record]) => {
        const mainIdx = mainTapIndex(record);
        const postPeakIdx = strongestPostTapIndex(record, mainIdx);
        const taps = record.taps ?? [];
        const postTapRows = buildPostTapRows(record, mainIdx);
        const state = severity(record);
        const fr = record.metrics?.frequency_response;
        const gd = record.group_delay;

        return (
          <Panel key={`us-${usKey}`} title={`US Index ${usKey}`}>
            <div className="status-chip-row">
              <span className={`analysis-chip ${state === "ok" ? "ok" : ""}`}><b>Severity</b> {state.toUpperCase()}</span>
              <span className="analysis-chip"><b>Main Tap</b> {mainIdx === null ? "n/a" : `T${mainIdx + 1}`}</span>
              <span className="analysis-chip"><b>Taps</b> {record.num_taps ?? taps.length}</span>
              <span className="analysis-chip"><b>MainTapRatio</b> {fmt(asNumber(record.metrics?.main_tap_ratio), 2, " dB")}</span>
              <span className="analysis-chip"><b>NonMainEnergy</b> {fmt(asNumber(record.metrics?.non_main_tap_energy_ratio), 2, " dB")}</span>
            </div>

            <div className="grid two">
              <Panel title="Tap Magnitude Power">
                <TapBars taps={taps} mainIdx={mainIdx} postPeakIdx={postPeakIdx} />
              </Panel>
              <Panel title="Channel Metrics">
                <div className="settings-definition-list">
                  <div className="settings-definition-row"><div className="settings-definition-key">Header Hex</div><div className="mono">{record.header_hex ?? "n/a"}</div></div>
                  <div className="settings-definition-row"><div className="settings-definition-key">Pre/Post Symmetry</div><div className="mono">{fmt(asNumber(record.metrics?.pre_post_energy_symmetry_ratio), 2, " dB")}</div></div>
                  <div className="settings-definition-row"><div className="settings-definition-key">Pre Main Total</div><div className="mono">{fmt(asNumber(record.metrics?.pre_main_tap_total_energy_ratio), 2, " dB")}</div></div>
                  <div className="settings-definition-row"><div className="settings-definition-key">Post Main Total</div><div className="mono">{fmt(asNumber(record.metrics?.post_main_tap_total_energy_ratio), 2, " dB")}</div></div>
                  <div className="settings-definition-row"><div className="settings-definition-key">Velocity Factor</div><div className="mono">{fmt(asNumber(record.velocity_factor), 2)}</div></div>
                </div>
              </Panel>
            </div>

            <div className="grid two">
              <Panel title="Frequency Response">
                <LineAnalysisChart
                  title="Frequency Response"
                  subtitle={`US ${usKey} · normalized magnitude power`}
                  yLabel="dB"
                  series={[
                    {
                      label: `US ${usKey}`,
                      color: "#6ab0ff",
                      points: (fr?.frequency_bins ?? [])
                        .map((x, index) => ({ x, y: fr?.magnitude_power_db_normalized?.[index] }))
                        .filter((point): point is { x: number; y: number } => typeof point.y === "number"),
                    },
                  ]}
                  showLegend={false}
                  exportBaseName={`single-atdma-pre-eq-frequency-response-us-${usKey}`}
                />
              </Panel>
              <Panel title="Group Delay">
                <LineAnalysisChart
                  title="Group Delay"
                  subtitle={`US ${usKey} · per-bin delay`}
                  yLabel="μs"
                  series={[
                    {
                      label: `US ${usKey}`,
                      color: "#58d0a7",
                      points: (gd?.delay_us ?? []).map((y, index) => ({ x: index, y })),
                    },
                  ]}
                  showLegend={false}
                  exportBaseName={`single-atdma-pre-eq-group-delay-us-${usKey}`}
                />
              </Panel>
            </div>

            <Panel title="Post-Main Tap Table">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Tap</th>
                      <th>ΔDelay vs MAIN</th>
                      <th>Echo (m)</th>
                      <th>Echo (ft)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {postTapRows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="mono">No post-main taps available.</td>
                      </tr>
                    ) : (
                      postTapRows.map((row) => (
                        <tr key={`${usKey}-${row.tapLabel}`}>
                          <td className="mono">{row.tapLabel}</td>
                          <td className="mono">{row.deltaDelayUs}</td>
                          <td className="mono">{row.echoMeters}</td>
                          <td className="mono">{row.echoFeet}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>
          </Panel>
        );
      })}
    </div>
  );
}
