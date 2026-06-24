import { useState } from "react";
import { TestBench, Asset, BENCHES_INITIAL } from "../data";
import type { Role } from "../App";
import { upTimelineSVG, makeSeries } from "../utils";
import { FirmwareFlashSheet, DeviceActionModal } from "./FirmwareFlashSheet";
import { TsChart, MetricTile, useTelemetryData, type TimeRange } from "./TelemetryCharts";

interface Props {
  bench: TestBench;
  assets: Asset[];
  onBack: () => void;
  onOpenAsset: (tag: string) => void;
  onEdit: () => void;
  addToast: (t: string, s?: string, type?: string) => void;
  role?: Role;
}

type Tab = "overview" | "composition" | "telemetry" | "diagnostics";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "composition", label: "Composition" },
  { id: "telemetry", label: "Telemetry" },
  { id: "diagnostics", label: "Build & Diagnostics" },
];

const TIME_RANGES: TimeRange[] = ["Last 6 h", "Last 24 h", "Last 7 d"];

function pingColor(v: number): string {
  if (v === 0) return "var(--ink-3)";
  return v < 60 ? "var(--ok)" : "var(--bad)";
}

function pingLabel(v: number): string {
  if (v === 0) return "—";
  if (v < 60) return `${v.toFixed(1)}s`;
  if (v < 3600) return `${Math.round(v / 60)}m ago`;
  return `${Math.round(v / 3600)}h ago`;
}

function gaugeColor(pct: number): string {
  return pct > 90 ? "var(--bad)" : pct > 70 ? "var(--warn)" : "var(--ok)";
}

function makeUptimeSegments(bench: TestBench): { up: boolean; frac: number }[] {
  if (bench.status === "Down" && !bench.recentDown) {
    return [{ up: true, frac: 0.5 }, { up: false, frac: 0.5 }];
  }
  if (bench.status === "Down" && bench.recentDown) {
    return [{ up: true, frac: 0.92 }, { up: false, frac: 0.08 }];
  }
  if (bench.status === "Degraded") {
    return [
      { up: true, frac: 0.3 }, { up: false, frac: 0.05 },
      { up: true, frac: 0.45 }, { up: false, frac: 0.03 },
      { up: true, frac: 0.17 },
    ];
  }
  if (bench.status === "Maintenance") {
    return [{ up: true, frac: 0.7 }, { up: false, frac: 0.3 }];
  }
  return [{ up: true, frac: 0.96 }, { up: false, frac: 0.02 }, { up: true, frac: 0.02 }];
}

export function BenchDetail({ bench, assets, onBack, onOpenAsset, onEdit, addToast, role = "engineer" }: Props) {
  const [tab, setTab] = useState<Tab>("overview");

  const visibleTabs = role === "manager"
    ? TABS.filter(t => t.id !== "telemetry" && t.id !== "diagnostics")
    : TABS;
  const effectiveTab = visibleTabs.some(t => t.id === tab) ? tab : "overview";
  const [timeRange, setTimeRange] = useState<TimeRange>("Last 6 h");
  const [flashOpen, setFlashOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"reset"|"stop"|null>(null);
  const [compareBenchId, setCompareBenchId] = useState<string>("");

  const richosHosts = bench.hosts.filter(h => h.platform === "RichOS");
  const windowsHosts = bench.hosts.filter(h => h.platform === "Windows");

  const statusColor = bench.status === "Up" ? "var(--ok)" : bench.status === "Down" ? "var(--bad)" : bench.status === "Degraded" ? "var(--warn)" : "var(--low)";

  const uptimeSegments = makeUptimeSegments(bench);

  const compareBench = compareBenchId ? BENCHES_INITIAL.find(b => b.id === compareBenchId) : null;

  // Memoised time-series data — regenerates when range or bench changes
  const tsData = useTelemetryData(timeRange, bench, compareBench);

  // Spark data for the Overview MetricTiles (last 20 points from 6h series)
  const ovData = useTelemetryData("Last 6 h", bench);
  const step = Math.max(1, Math.floor(ovData.length / 20));
  const sparkCpu  = ovData.filter((_, i) => i % step === 0).map(d => d.cpu);
  const sparkMem  = ovData.filter((_, i) => i % step === 0).map(d => d.mem);
  const sparkDisk = ovData.filter((_, i) => i % step === 0).map(d => d.disk);
  const sparkTemp = ovData.filter((_, i) => i % step === 0).map(d => d.temp);

  return (
    <div className="to-screen" style={{ padding: 0 }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "22px 22px 0" }}>
        <button
          onClick={onBack}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            height: 30, padding: "0 10px", borderRadius: 6,
            border: "1px solid var(--line-2)", background: "var(--panel-2)",
            color: "var(--ink-2)", fontSize: 12.5, cursor: "pointer",
            transition: "background .1s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "var(--panel-3)")}
          onMouseLeave={e => (e.currentTarget.style.background = "var(--panel-2)")}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Test Benches
        </button>
        <span style={{ color: "var(--ink-4)" }}>/</span>
        <span style={{ fontSize: 13, color: "var(--ink-2)" }}>{bench.name}</span>
      </div>
      {/* Sticky detail header */}
      <div className="to-bench-detail-header">
        <div className="to-row to-between" style={{ flexWrap: "wrap", gap: 12, alignItems: "flex-start" }}>
          <div>
            <div className="to-row" style={{ gap: 10, alignItems: "baseline" }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{bench.name}</h1>
              <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-3)" }}>{bench.id}</span>
            </div>
            <div className="to-row" style={{ gap: 8, marginTop: 10, marginBottom: 14, flexWrap: "wrap" }}>
              {bench.hosts.map(h => (
                <span key={h.hostId} className="to-chip mute" style={{ fontFamily: "var(--mono)", fontSize: 11 }}>
                  {h.hostId} · {h.platform}
                </span>
              ))}
              <span style={{ fontWeight: 600, fontSize: 13, color: statusColor }}>
                {bench.status === "Up" ? "↑" : bench.status === "Down" ? "↓" : bench.status === "Degraded" ? "⚠" : "⚙"} {bench.status}
              </span>
              <span className="to-muted" style={{ fontSize: 12 }}>since {bench.lastChange}</span>
              <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: pingColor(bench.lastPingValue) }}>
                ping {pingLabel(bench.lastPingValue)}
              </span>
              {bench.coredumps.length > 0 && (
                <span className="to-chip bad" style={{ fontSize: 11 }}>
                  {bench.coredumps.length} coredump{bench.coredumps.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
          <div className="to-row" style={{ gap: 8, flexWrap: "wrap" }}>
            <button className="to-btn ghost sm" onClick={onEdit}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M4 20h4L18 10l-4-4L4 16z" /><path d="M14 6l4 4" />
              </svg>
              Edit
            </button>
            {windowsHosts.length > 0 && (
              <button className="to-btn ghost sm" onClick={() => addToast("RDP", `Opening RDP to ${windowsHosts[0].hostId}…`, "info")}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <rect x="2" y="4" width="20" height="14" rx="2" /><path d="M8 20h8M12 18v2" />
                </svg>
                RDP Server
              </button>
            )}
            {richosHosts.length > 0 && (
              <button className="to-btn ghost sm" onClick={() => setFlashOpen(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 3v12M8 11l4 4 4-4M5 21h14"/></svg>
                Flash firmware
              </button>
            )}
            <button className="to-btn ghost sm" onClick={() => addToast("Grafana", "Opening in Grafana…", "info")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Grafana
            </button>
            <button className="to-btn ghost sm" onClick={() => addToast("Refreshing", `Pinging ${bench.id}…`, "info")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8M3 12a9 9 0 0 0 15 6.7L21 16" /><path d="M21 8v-5M21 16v5" />
              </svg>
              Refresh
            </button>
            <select
              value={timeRange}
              onChange={e => setTimeRange(e.target.value)}
              style={{ background: "var(--panel-3)", border: "1px solid var(--line-2)", borderRadius: 6, color: "var(--ink)", fontSize: 12, padding: "4px 28px 4px 8px", appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}
            >
              {TIME_RANGES.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div className="to-tabs" style={{ marginBottom: 0, padding: "0 22px" }}>
          {visibleTabs.map(t => (
            <button key={t.id} className={`to-tab ${effectiveTab === t.id ? "on" : ""}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ padding: "22px 22px 40px" }}>
        {/* Offline banners */}
        {bench.status === "Down" && (
          <div className="to-alert bad" style={{ marginBottom: 18 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" />
            </svg>
            <div>
              <b>Bench is Down</b>
              {bench.recentDown
                ? " — went offline less than 1 hour ago. Collector has lost contact. Check power and network connectivity."
                : " — collector offline. Last contact was " + (bench.telemetry.lastSeen || "unknown") + ". Disk may be full (check diagnostics tab)."}
            </div>
          </div>
        )}
        {!bench.telemetry.collectorUp && bench.status !== "Down" && (
          <div className="to-alert bad" style={{ marginBottom: 18 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" />
            </svg>
            Collector offline — telemetry unavailable. Last seen: {bench.telemetry.lastSeen || "unknown"}
          </div>
        )}

        {/* OVERVIEW */}
        {effectiveTab === "overview" && (
          <div className="to-grid to-g12" style={{ gap: 18 }}>
            <div className="to-s8">
              <div className="to-panel" style={{ marginBottom: 18 }}>
                <div className="to-panel-h"><span className="to-eyebrow">Purpose</span></div>
                <div className="to-panel-b" style={{ fontSize: 13.5, lineHeight: 1.7, color: "var(--ink-2)" }}>
                  {bench.description}
                </div>
              </div>

              {/* Health summary */}
              <div className="to-panel">
                <div className="to-panel-h">
                  <span className="to-eyebrow">Quick health</span>
                  <span style={{ fontSize: 11, color: "var(--ink-3)" }}>Last 6 h sparklines</span>
                </div>
                <div className="to-panel-b">
                  {bench.telemetry.collectorUp ? (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                        <MetricTile
                          label="CPU"
                          value={bench.telemetry.cpuPct}
                          unit="%"
                          color={gaugeColor(bench.telemetry.cpuPct)}
                          sparkData={sparkCpu}
                          max={100}
                        />
                        <MetricTile
                          label="Memory"
                          value={bench.telemetry.memUsedGb}
                          unit=" GB"
                          subtext={`of ${bench.telemetry.memTotalGb} GB`}
                          color={gaugeColor(bench.telemetry.memPct)}
                          sparkData={sparkMem}
                          max={bench.telemetry.memTotalGb}
                        />
                        <MetricTile
                          label="Disk"
                          value={bench.telemetry.diskPct}
                          unit="%"
                          color={gaugeColor(bench.telemetry.diskPct)}
                          sparkData={sparkDisk}
                          max={100}
                        />
                        <MetricTile
                          label="Temperature"
                          value={Math.round(sparkTemp[sparkTemp.length - 1] ?? bench.telemetry.cpuPct * 0.7 + 10)}
                          unit="°C"
                          subtext="CPU sensor"
                          color={gaugeColor(sparkTemp[sparkTemp.length - 1] > 75 ? 90 : sparkTemp[sparkTemp.length - 1] > 60 ? 75 : 50)}
                          sparkData={sparkTemp}
                          max={100}
                        />
                      </div>

                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span className="to-eyebrow">Uptime (30d)</span>
                          <span style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--ink-3)" }}>
                            last ping {pingLabel(bench.lastPingValue)}
                          </span>
                        </div>
                        <div dangerouslySetInnerHTML={{ __html: upTimelineSVG(uptimeSegments, 600, 20) }} />
                        <div style={{ display: "flex", gap: 14, marginTop: 7 }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, color: "var(--ink-3)" }}>
                            <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--ok)", opacity: .7 }} /> Up
                          </span>
                          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, color: "var(--ink-3)" }}>
                            <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--bad)", opacity: .8 }} /> Down
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="to-chart-empty">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ opacity: 0.4 }}>
                        <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" />
                      </svg>
                      Collector offline — telemetry unavailable
                      {bench.telemetry.lastSeen && <div style={{ fontSize: 11 }}>Last seen: {bench.telemetry.lastSeen}</div>}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="to-s4">
              {/* Remote control */}
              <div className="to-panel" style={{ marginBottom: 18 }}>
                <div className="to-panel-h">
                  <span className="to-eyebrow">Remote control</span>
                  <span className={`to-chip ${bench.telemetry.collectorUp ? "ok" : "bad"}`}>
                    <span className={`to-dot ${bench.telemetry.collectorUp ? "ok" : "bad"}`} />
                    {bench.telemetry.collectorUp ? "Reachable" : "Offline"}
                  </span>
                </div>
                <div style={{ padding: "10px 12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { label: "Reset device", sub: "power cycle", icon: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>', action: "reset" as const, cls: "bad" },
                    { label: "Stop test", sub: "halt queue", icon: '<rect x="6" y="6" width="12" height="12" rx="2"/>', action: "stop" as const, cls: "warn" },
                    { label: "Start test", sub: "resume queue", icon: '<path d="M7 5v14l11-7z"/>', action: null, cls: "ok" },
                    { label: "Flash firmware", sub: bench.build?.distroVersion || "—", icon: '<path d="M12 3v12M8 11l4 4 4-4M5 21h14"/>', action: null, cls: "brand" },
                  ].map(({ label, sub, icon, action, cls }) => (
                    <button key={label} disabled={!bench.telemetry.collectorUp && action !== null}
                      onClick={() => {
                        if (action === "reset" || action === "stop") setConfirmAction(action);
                        else if (label === "Flash firmware") setFlashOpen(true);
                        else addToast("Test started", "Queue resumed");
                      }}
                      style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4, padding: "10px 10px", border: "1px solid var(--line)", borderRadius: 8, background: "var(--panel-2)", cursor: bench.telemetry.collectorUp || !action ? "pointer" : "not-allowed", opacity: !bench.telemetry.collectorUp && action !== null ? .4 : 1, transition: ".1s", textAlign: "left" }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: `var(--${cls}-dim)`, display: "grid", placeItems: "center" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: `var(--${cls})` }} dangerouslySetInnerHTML={{ __html: icon }} />
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{label}</div>
                      <div style={{ fontSize: 10, color: "var(--ink-3)", fontFamily: "var(--mono)" }}>{sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="to-panel" style={{ marginBottom: 18 }}>
                <div className="to-panel-h"><span className="to-eyebrow">Details</span></div>
                <div style={{ padding: "0 16px 16px" }}>
                  <div className="to-spec"><span className="k">Owner</span><span className="v">{bench.owner}</span></div>
                  <div className="to-spec"><span className="k">Created</span><span className="v mono">{bench.createdAt}</span></div>
                  <div className="to-spec"><span className="k">Location</span><span className="v">{bench.location}</span></div>
                  <div className="to-spec"><span className="k">Assets</span><span className="v mono">{bench.composition.length}</span></div>
                  {richosHosts.map(h => (
                    <div key={h.hostId} className="to-spec">
                      <span className="k">RichOS host</span>
                      <span className="v mono">{h.hostId}</span>
                    </div>
                  ))}
                  {windowsHosts.map(h => (
                    <div key={h.hostId} className="to-spec">
                      <span className="k">Windows host</span>
                      <span className="v mono">{h.hostId}</span>
                    </div>
                  ))}
                </div>
              </div>

              {bench.build && (
                <div className="to-panel">
                  <div className="to-panel-h"><span className="to-eyebrow">Build</span></div>
                  <div style={{ padding: "0 16px 16px" }}>
                    <div className="to-spec"><span className="k">Distro</span><span className="v mono">{bench.build.distro} {bench.build.distroVersion}</span></div>
                    <div className="to-spec"><span className="k">Track</span><span className="v"><span className={`to-chip ${bench.build.buildTrack === "release" ? "ok" : "warn"}`}>{bench.build.buildTrack}</span></span></div>
                    <div className="to-spec"><span className="k">Build #</span><span className="v mono">{bench.build.buildNumber}</span></div>
                    <div className="to-spec"><span className="k">Commit</span><span className="v mono" style={{ fontSize: 11 }}>{bench.build.gitCommit}</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* COMPOSITION */}
        {effectiveTab === "composition" && (
          <div>
            {bench.composition.length === 0 ? (
              <div className="to-chart-empty" style={{ height: 160 }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ opacity: 0.4 }}>
                  <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M12 8v8M8 12h8" />
                </svg>
                No assets composed into this bench
              </div>
            ) : (
              <>
                <div className="to-panel" style={{ marginBottom: 18 }}>
                  <div className="to-panel-h"><span className="to-eyebrow">Asset composition</span></div>
                  <div style={{ overflowX: "auto" }}>
                    <table className="to-tbl">
                      <thead>
                        <tr>
                          <th>Tag</th>
                          <th>Name / Model</th>
                          <th>Role</th>
                          <th>Position</th>
                          <th>Primary DUT</th>
                          <th>State</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bench.composition.map(ba => {
                          const assetData = assets.find(a => a.tag === ba.assetTag);
                          return (
                            <tr key={ba.assetTag}>
                              <td>
                                <span className="to-mono" style={{ fontSize: 12 }}>{ba.assetTag}</span>
                              </td>
                              <td>
                                <div style={{ fontWeight: 500 }}>{assetData?.name !== "—" ? assetData?.name : assetData?.model || "—"}</div>
                                <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{assetData?.model || "—"}</div>
                              </td>
                              <td>{ba.role}</td>
                              <td className="to-mono to-muted" style={{ fontSize: 12 }}>{ba.where}</td>
                              <td>
                                {ba.isPrimaryDUT ? (
                                  <span style={{ color: "var(--warn)" }} title="Primary DUT">★ Primary</span>
                                ) : (
                                  <span className="to-muted">—</span>
                                )}
                              </td>
                              <td>
                                <span className={`to-chip ${ba.state === "active" ? "ok" : ba.state === "fault" ? "bad" : "mute"}`}>
                                  <span className={`to-dot ${ba.state === "active" ? "ok" : ba.state === "fault" ? "bad" : "low"}`} />
                                  {ba.state}
                                </span>
                              </td>
                              <td>
                                <button className="to-btn ghost sm" onClick={() => onOpenAsset(ba.assetTag)}>Open</button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Wiring diagram */}
                <div className="to-panel">
                  <div className="to-panel-h"><span className="to-eyebrow">Wiring diagram</span></div>
                  <div className="to-panel-b">
                    <WiringDiagram bench={bench} assets={assets} />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TELEMETRY */}
        {effectiveTab === "telemetry" && (
          <div>
            {/* Toolbar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {TIME_RANGES.map(r => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    style={{
                      height: 28, padding: "0 11px", borderRadius: 6, fontSize: 12, fontWeight: 500,
                      border: "1px solid var(--line-2)",
                      background: timeRange === r ? "var(--brand-dim)" : "var(--panel-2)",
                      color: timeRange === r ? "var(--brand)" : "var(--ink-3)",
                      cursor: "pointer", transition: ".1s",
                    }}
                  >{r}</button>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>Compare with:</span>
                <select
                  value={compareBenchId}
                  onChange={e => setCompareBenchId(e.target.value)}
                  style={{ height: 28, borderRadius: 6, border: "1px solid var(--line-2)", background: "var(--panel-2)", color: compareBenchId ? "var(--ink)" : "var(--ink-3)", fontFamily: "var(--mono)", fontSize: 11, padding: "0 28px 0 8px", appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}
                >
                  <option value="">— none —</option>
                  {BENCHES_INITIAL.filter(b => b.id !== bench.id && b.telemetry.collectorUp).map(b => (
                    <option key={b.id} value={b.id}>{b.id} · {b.name}</option>
                  ))}
                </select>
                {compareBenchId && (
                  <button className="to-btn ghost sm" onClick={() => setCompareBenchId("")}>✕</button>
                )}
              </div>
            </div>

            {compareBenchId && compareBench && (
              <div style={{ display: "flex", gap: 14, padding: "8px 12px", background: "rgba(252,120,64,.08)", border: "1px solid rgba(252,120,64,.22)", borderRadius: 8, marginBottom: 16, fontSize: 12 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--brand)" }}>
                  <span style={{ width: 10, height: 2, borderRadius: 1, background: "var(--brand)", display: "inline-block" }} />
                  {bench.id} · {bench.name}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--accent)" }}>
                  <span style={{ width: 10, height: 2, borderRadius: 1, background: "var(--accent)", display: "inline-block", borderTop: "2px dashed var(--accent)" }} />
                  {compareBench.id} · {compareBench.name} (dashed)
                </span>
              </div>
            )}

            {!bench.telemetry.collectorUp ? (
              <div className="to-chart-empty" style={{ height: 240 }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" style={{ opacity: 0.35 }}>
                  <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" />
                </svg>
                <div style={{ fontWeight: 600 }}>Collector offline</div>
                <div style={{ fontSize: 12 }}>Telemetry data unavailable{bench.telemetry.lastSeen ? ` · Last seen ${bench.telemetry.lastSeen}` : ""}</div>
              </div>
            ) : (
              <>
                {/* KPI summary row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 18 }}>
                  {[
                    { label: "CPU now", val: `${bench.telemetry.cpuPct}%`, color: gaugeColor(bench.telemetry.cpuPct) },
                    { label: "Memory now", val: `${bench.telemetry.memUsedGb} / ${bench.telemetry.memTotalGb} GB`, color: gaugeColor(bench.telemetry.memPct) },
                    { label: "Disk now", val: `${bench.telemetry.diskPct}%`, color: gaugeColor(bench.telemetry.diskPct) },
                    { label: "Last ping", val: pingLabel(bench.lastPingValue), color: pingColor(bench.lastPingValue) },
                  ].map(({ label, val, color }) => (
                    <div key={label} style={{ background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: 8, padding: "10px 14px" }}>
                      <div style={{ fontSize: 10.5, color: "var(--ink-3)", fontWeight: 550, letterSpacing: ".05em", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 16, fontWeight: 700, color }}>{val}</div>
                    </div>
                  ))}
                </div>

                {/* Charts 2x2 */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                  <TsChart
                    data={tsData}
                    dataKey="cpu"
                    cmpKey={compareBenchId ? "cmpCpu" : undefined}
                    label="CPU Usage"
                    cmpLabel={compareBench?.id}
                    unit="%"
                    color="var(--brand)"
                    cmpColor="var(--accent)"
                    domain={[0, 100]}
                    currentVal={`${bench.telemetry.cpuPct}`}
                    cmpCurrentVal={compareBench ? `${compareBench.telemetry.cpuPct}` : undefined}
                  />
                  <TsChart
                    data={tsData}
                    dataKey="mem"
                    cmpKey={compareBenchId ? "cmpMem" : undefined}
                    label="Memory Usage"
                    cmpLabel={compareBench?.id}
                    unit=" GB"
                    color="var(--mid)"
                    cmpColor="var(--accent)"
                    domain={[0, Math.max(bench.telemetry.memTotalGb, compareBench?.telemetry.memTotalGb ?? 0)]}
                    currentVal={`${bench.telemetry.memUsedGb}`}
                    cmpCurrentVal={compareBench ? `${compareBench.telemetry.memUsedGb}` : undefined}
                  />
                  <TsChart
                    data={tsData}
                    dataKey="disk"
                    cmpKey={compareBenchId ? "cmpDisk" : undefined}
                    label="Disk Usage"
                    cmpLabel={compareBench?.id}
                    unit="%"
                    color="var(--warn)"
                    cmpColor="var(--accent)"
                    domain={[0, 100]}
                    threshold={bench.telemetry.diskPct > 70 ? { value: 90, label: "90% critical" } : undefined}
                    currentVal={`${bench.telemetry.diskPct}`}
                    cmpCurrentVal={compareBench ? `${compareBench.telemetry.diskPct}` : undefined}
                  />
                  <TsChart
                    data={tsData}
                    dataKey="temp"
                    label="CPU Temperature"
                    unit="°C"
                    color="var(--bad)"
                    domain={[20, 100]}
                    threshold={{ value: 85, label: "85°C limit" }}
                    currentVal={`${Math.round(sparkTemp[sparkTemp.length - 1] ?? 40)}`}
                  />
                </div>

                {/* Network full-width */}
                <div style={{ marginBottom: 16 }}>
                  <TsChart
                    data={tsData}
                    dataKey="net"
                    label="Network Throughput"
                    unit=" Mbps"
                    color="var(--ok)"
                    domain={[0, 150]}
                    height={110}
                    currentVal="~48"
                  />
                </div>

                {/* Uptime timeline */}
                <div className="to-panel">
                  <div className="to-panel-h">
                    <span className="to-eyebrow">Uptime timeline (30d)</span>
                    <span style={{ fontSize: 11, color: "var(--ink-3)" }}>
                      {uptimeSegments.filter(s => s.up).reduce((a, s) => a + s.frac, 0) >= 0.95
                        ? "≥95% uptime" : "< 95% uptime — review incidents"}
                    </span>
                  </div>
                  <div className="to-panel-b">
                    <div dangerouslySetInnerHTML={{ __html: upTimelineSVG(uptimeSegments, 900, 24) }} />
                    <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--ink-3)" }}>
                        <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--ok)", opacity: .7 }} /> Up
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--ink-3)" }}>
                        <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--bad)", opacity: .8 }} /> Down / Incident
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* DIAGNOSTICS */}
        {effectiveTab === "diagnostics" && (
          <div className="to-grid to-g12" style={{ gap: 18 }}>
            <div className="to-s7">
              {/* Build info */}
              <div className="to-panel" style={{ marginBottom: 18 }}>
                <div className="to-panel-h"><span className="to-eyebrow">Build info</span></div>
                {richosHosts.length === 0 ? (
                  <div className="to-panel-b" style={{ color: "var(--ink-3)", fontSize: 13 }}>
                    Build info available for RichOS benches only.
                  </div>
                ) : bench.build ? (
                  <div style={{ padding: "0 16px 8px" }}>
                    {[
                      ["Distro", bench.build.distro],
                      ["Version", bench.build.distroVersion],
                      ["Build track", bench.build.buildTrack],
                      ["Image", bench.build.imageBasename],
                      ["Machine", bench.build.machine],
                      ["Build #", bench.build.buildNumber],
                      ["Build URL", bench.build.buildUrl],
                      ["Git commit", bench.build.gitCommit],
                    ].map(([k, v]) => (
                      <div key={k} className="to-spec">
                        <span className="k">{k}</span>
                        <span className="v mono" style={{ fontSize: 11.5, wordBreak: "break-all", color: k === "Build track" ? (v === "release" ? "var(--ok)" : "var(--warn)") : undefined }}>
                          {v}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="to-panel-b" style={{ color: "var(--ink-3)", fontSize: 13 }}>
                    No build information available.
                  </div>
                )}
              </div>

              {/* df table */}
              <div className="to-panel" style={{ marginBottom: 18 }}>
                <div className="to-panel-h"><span className="to-eyebrow">Disk usage (df -h)</span></div>
                {bench.dfTable.length === 0 ? (
                  <div className="to-panel-b" style={{ color: "var(--ink-3)", fontSize: 13 }}>No data available</div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="to-tbl">
                      <thead>
                        <tr>
                          <th>Filesystem</th>
                          <th>Size</th>
                          <th>Used</th>
                          <th>Avail</th>
                          <th>Use%</th>
                          <th>Mounted on</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bench.dfTable.map((row, i) => {
                          const cls = row.usePct >= 90 ? "to-df-danger" : row.usePct >= 70 ? "to-df-warn" : "";
                          return (
                            <tr key={i}>
                              <td className="to-mono" style={{ fontSize: 11 }}>{row.fs}</td>
                              <td className={`to-mono ${cls}`} style={{ fontSize: 12 }}>{row.size}</td>
                              <td className={`to-mono ${cls}`} style={{ fontSize: 12 }}>{row.used}</td>
                              <td className={`to-mono ${cls}`} style={{ fontSize: 12 }}>{row.avail}</td>
                              <td className={`to-mono ${cls}`} style={{ fontSize: 12, fontWeight: row.usePct >= 70 ? 600 : 400 }}>{row.usePct}%</td>
                              <td className="to-mono to-muted" style={{ fontSize: 11 }}>{row.mount}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="to-s5">
              {/* Coredumps */}
              <div className="to-panel">
                <div className="to-panel-h">
                  <span className="to-eyebrow">Coredumps</span>
                  {bench.coredumps.length > 0 && (
                    <span className="to-chip bad" style={{ fontSize: 11 }}>{bench.coredumps.length}</span>
                  )}
                </div>
                {bench.coredumps.length === 0 ? (
                  <div className="to-panel-b" style={{ color: "var(--ink-3)", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ color: "var(--ok)" }}>
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    No coredumps found
                  </div>
                ) : (
                  <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                    {bench.coredumps.map((cd, i) => (
                      <div key={i} style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "10px 12px", background: "var(--bad-dim)" }}>
                        <div style={{ fontFamily: "var(--mono)", fontSize: 11, wordBreak: "break-all", marginBottom: 4, color: "var(--bad)" }}>
                          {cd.name}
                        </div>
                        <div className="to-row to-between" style={{ marginBottom: 8 }}>
                          <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{cd.timestamp}</span>
                          <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-2)" }}>{cd.size}</span>
                        </div>
                        <div className="to-row" style={{ gap: 6 }}>
                          <button className="to-btn ghost sm" onClick={() => addToast("Inspect", `Analyzing ${cd.name}…`, "info")}>Inspect</button>
                          <button className="to-btn ghost sm" onClick={() => addToast("Download", `Downloading ${cd.name}…`, "info")}>Download</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Firmware flash sheet */}
      <FirmwareFlashSheet bench={bench} open={flashOpen} onClose={() => setFlashOpen(false)} addToast={addToast} />

      {/* Device action confirmation */}
      <DeviceActionModal
        action={confirmAction || "reset"}
        hostId={bench.hosts[0]?.hostId || bench.id}
        open={confirmAction !== null}
        onConfirm={() => addToast(confirmAction === "reset" ? "Reset command sent" : "Test stopped", confirmAction === "reset" ? `${bench.hosts[0]?.hostId} power-cycling · ~40s to rejoin` : "Queue halted")}
        onClose={() => setConfirmAction(null)}
      />
    </div>
  );
}

function connectorType(where: string): string {
  const w = where.toLowerCase();
  if (w.includes("usb-a"))  return "USB-A";
  if (w.includes("usb-b"))  return "USB-B";
  if (w.includes("usb-c"))  return "USB-C";
  if (w.includes("pcie"))   return "PCIe";
  if (w.includes("aux"))    return "AUX";
  if (w.includes("hdmi"))   return "HDMI";
  if (w.includes("eth"))    return "Ethernet";
  if (w.includes("slot"))   return "Slot";
  if (w.includes("display")) return "Display";
  return "Cable";
}

function WiringDiagram({ bench, assets }: { bench: TestBench; assets: Asset[] }) {
  const [active, setActive] = useState<string | null>(null);

  if (bench.composition.length === 0) return null;

  const hostId  = bench.hosts[0]?.hostId  || bench.id;
  const platform = bench.hosts[0]?.platform || "RichOS";

  return (
    <div>
      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        {([["var(--ok)", "Active"], ["var(--bad)", "Fault"], ["var(--ink-4)", "Idle"]] as const).map(([color, label]) => (
          <span key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--ink-3)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
            {label}
          </span>
        ))}
        <span style={{ fontSize: 11, color: "var(--ink-4)", marginLeft: "auto" }}>Click an asset to expand</span>
      </div>

      {/* Diagram: host node + rows */}
      <div style={{ display: "flex", alignItems: "flex-start" }}>

        {/* Host node */}
        <div style={{
          flexShrink: 0, width: 120,
          background: "var(--brand-dim)", border: "1.5px solid rgba(130,139,245,.3)",
          borderRadius: 10, padding: "14px 10px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
          alignSelf: "stretch", justifyContent: "center",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.6">
            <rect x="2" y="3" width="20" height="15" rx="2"/><path d="M8 21h8M12 18v3"/>
          </svg>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700, color: "var(--brand)", textAlign: "center", lineHeight: 1.3 }}>{hostId}</div>
          <div style={{ fontSize: 10, color: "var(--brand-3)", opacity: .8 }}>{platform}</div>
          <div style={{ fontSize: 9.5, fontFamily: "var(--mono)", color: bench.telemetry.collectorUp ? "var(--ok)" : "var(--bad)", display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: bench.telemetry.collectorUp ? "var(--ok)" : "var(--bad)" }} />
            {bench.richosState}
          </div>
        </div>

        {/* Asset rows */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          {bench.composition.map((ba) => {
            const assetData   = assets.find(a => a.tag === ba.assetTag);
            const stateColor  = ba.state === "active" ? "var(--ok)" : ba.state === "fault" ? "var(--bad)" : "var(--ink-4)";
            const connType    = connectorType(ba.where);
            const displayName = assetData ? (assetData.name !== "—" ? assetData.name : assetData.model) : ba.assetTag;
            const isOpen      = active === ba.assetTag;

            return (
              <div key={ba.assetTag}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  {/* Connector line */}
                  <div style={{ flexShrink: 0, width: 90, position: "relative", height: 44 }}>
                    <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, background: ba.state === "active" ? "var(--ok)" : ba.state === "fault" ? "var(--bad)" : "var(--line-2)", transform: "translateY(-50%)", opacity: .5 }} />
                    <div style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", width: 0, height: 0, borderTop: "4px solid transparent", borderBottom: "4px solid transparent", borderLeft: `5px solid ${ba.state === "active" ? "var(--ok)" : "var(--line-2)"}` }} />
                    <div style={{ position: "absolute", left: 5, top: 6, fontSize: 8.5, fontFamily: "var(--mono)", color: "var(--ink-4)", background: "var(--panel)", padding: "0 2px", lineHeight: 1 }}>
                      {connType}
                    </div>
                  </div>

                  {/* Card */}
                  <div
                    onClick={() => setActive(isOpen ? null : ba.assetTag)}
                    style={{
                      flex: 1, minWidth: 0,
                      background: isOpen ? "var(--panel-3)" : "var(--panel-2)",
                      border: "1px solid var(--line-2)",
                      borderRadius: isOpen ? "8px 8px 0 0" : 8,
                      padding: "8px 12px",
                      cursor: "pointer",
                      transition: "background .1s",
                      userSelect: "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: stateColor, flexShrink: 0 }} />
                      <span style={{ fontWeight: 600, fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</span>
                      {ba.isPrimaryDUT && (
                        <span style={{ flexShrink: 0, fontSize: 9, fontWeight: 600, color: "var(--warn)", background: "var(--warn-dim)", border: "1px solid rgba(242,201,76,.2)", borderRadius: 4, padding: "1px 5px" }}>★ PRIMARY</span>
                      )}
                      <span style={{ marginLeft: "auto", flexShrink: 0, fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-4)" }}>#{ba.assetTag}</span>
                      <span style={{ flexShrink: 0, fontSize: 10, color: "var(--ink-4)", marginLeft: 4 }}>{isOpen ? "▲" : "▼"}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ba.role} · <span style={{ fontFamily: "var(--mono)" }}>{ba.where}</span>
                    </div>
                  </div>
                </div>

                {/* Expanded detail — inline below the card, same left offset as card */}
                {isOpen && assetData && (
                  <div style={{ marginLeft: 90 }}>
                    <div style={{
                      background: "var(--panel-3)",
                      border: `1px solid ${stateColor}`,
                      borderTop: "none",
                      borderRadius: "0 0 8px 8px",
                      padding: "10px 14px",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "6px 20px",
                    }}>
                      {([
                        ["Model",    assetData.model],
                        ["Category", assetData.cat],
                        ["Serial",   assetData.serial],
                        ["State",    ba.state],
                        ["Location", assetData.location],
                        ["Connect",  ba.where],
                      ] as [string, string][]).map(([k, v]) => (
                        <div key={k} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                          <span style={{ fontSize: 9.5, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: ".05em" }}>{k}</span>
                          <span style={{ fontSize: 11.5, fontFamily: "var(--mono)", color: k === "State" ? stateColor : "var(--ink-2)", fontWeight: k === "State" ? 600 : 400 }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
