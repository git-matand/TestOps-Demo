import { useState } from "react";
import { TestBench } from "../data";
import { AIBanner } from "./AIBanner";

interface Props {
  benches: TestBench[];
  onOpenBench: (id: string) => void;
  onCreateBench: () => void;
  onQuery: (q: string) => void;
  addToast: (t: string, s?: string, type?: string) => void;
}

const STATUS_COLOR: Record<string, string> = {
  Up: "var(--ok)", Down: "var(--bad)", Degraded: "var(--warn)", Maintenance: "var(--low)",
};

function resolvedColor(b: TestBench) {
  return b.status === "Down" && b.recentDown ? "var(--accent)" : STATUS_COLOR[b.status] || "var(--ink-3)";
}
function resolvedStatus(b: TestBench) {
  return b.status === "Down" && b.recentDown ? "Down (recent)" : b.status;
}
function pingLabel(v: number) {
  if (!v) return "—";
  if (v < 60) return `${v.toFixed(0)}s`;
  if (v < 3600) return `${Math.round(v / 60)}m ago`;
  return `${Math.round(v / 3600)}h ago`;
}

function BenchTile({ b, onClick }: { b: TestBench; onClick: () => void }) {
  const col = resolvedColor(b);
  const host = b.hosts[0]?.hostId || b.id;
  const cpuCol = b.telemetry.cpuPct > 90 ? "var(--bad)" : b.telemetry.cpuPct > 70 ? "var(--warn)" : "var(--ok)";
  const memCol = b.telemetry.memPct > 90 ? "var(--bad)" : b.telemetry.memPct > 70 ? "var(--warn)" : "var(--mid)";
  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--panel-2)", border: "1px solid var(--line)",
        borderTop: `3px solid ${col}`, borderRadius: 8,
        padding: "11px 12px", cursor: "pointer", transition: "background .12s",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = "var(--panel-3)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "var(--panel-2)"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{host}</div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 500, color: col }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: col, display: "inline-block" }} />
          {resolvedStatus(b)}
        </span>
      </div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 9.5, color: "var(--ink-3)", marginBottom: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {b.name}
        {b.hosts.length > 1 && <span style={{ marginLeft: 6, opacity: .6 }}>+{b.hosts.length - 1}</span>}
      </div>
      {b.telemetry.collectorUp ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--ink-3)", width: 26 }}>CPU</span>
            <div style={{ flex: 1, height: 4, borderRadius: 3, background: "var(--panel-3)", overflow: "hidden" }}>
              <div style={{ width: `${b.telemetry.cpuPct}%`, height: "100%", background: cpuCol, borderRadius: 3 }} />
            </div>
            <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--ink-2)", width: 26, textAlign: "right" }}>{b.telemetry.cpuPct}%</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--ink-3)", width: 26 }}>MEM</span>
            <div style={{ flex: 1, height: 4, borderRadius: 3, background: "var(--panel-3)", overflow: "hidden" }}>
              <div style={{ width: `${b.telemetry.memPct}%`, height: "100%", background: memCol, borderRadius: 3 }} />
            </div>
            <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--ink-2)", width: 26, textAlign: "right" }}>{b.telemetry.memPct}%</span>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 9.5, color: "var(--ink-4)", fontFamily: "var(--mono)" }}>collector offline</div>
      )}
    </div>
  );
}

const STATUS_FILTERS = ["All", "Up", "Down", "Degraded", "Maintenance"] as const;

export function TestBenches({ benches, onOpenBench, onCreateBench, onQuery, addToast }: Props) {
  const [view, setView] = useState<"heatmap" | "table">("heatmap");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  const upCount = benches.filter(b => b.status === "Up").length;
  const downCount = benches.filter(b => b.status === "Down").length;
  const degradedCount = benches.filter(b => b.status === "Degraded").length;
  const maintCount = benches.filter(b => b.status === "Maintenance").length;

  const filtered = benches.filter(b => {
    if (statusFilter !== "All" && b.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!(b.id + b.name + b.owner + b.location + b.hosts.map(h => h.hostId).join(" ")).toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="to-screen">
      <div className="to-page-head">
        <div>
          <div className="to-kicker">Infrastructure</div>
          <h1>Test Benches</h1>
          <div className="lede" style={{ color: "var(--ink-2)", fontSize: 13, marginTop: 5 }}>
            Physical and virtual test bench management · monitor status, composition and telemetry
          </div>
        </div>
        <div className="to-head-actions">
          <button className="to-btn primary sm" onClick={onCreateBench}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 5v14M5 12h14" /></svg>
            New test bench
          </button>
        </div>
      </div>

      <AIBanner
        summary={`${benches.length} benches total · ${benches.filter(b=>b.status==="Up").length} Up · ${benches.filter(b=>b.status==="Down").length} Down · ${benches.filter(b=>b.status==="Degraded").length} Degraded · ${benches.filter(b=>b.status==="Maintenance").length} Maintenance. ${benches.filter(b=>b.coredumps.length>0).length} benches with coredumps detected.`}
        prediction={{ text: "TB-146 disk at 99% with 2 coredumps — risk of unrecoverable state before next campaign run. TB-022 went down 9 min ago with LIN coredump.", level: "bad" }}
        chips={["Which benches need attention?", "Show high CPU benches", "Predict next failure", "Which campaigns are at risk?"]}
        onQuery={onQuery}
      />

      {/* KPI cards */}
      <div className="to-grid to-g12" style={{ marginBottom: 20 }}>
        {[
          { label: "Up", count: upCount, color: "var(--ok)", filter: "Up" as const, delta: "online" },
          { label: "Down", count: downCount, color: "var(--bad)", filter: "Down" as const, delta: "offline" },
          { label: "Degraded", count: degradedCount, color: "var(--warn)", filter: "Degraded" as const, delta: "threshold exceeded" },
          { label: "Maintenance", count: maintCount, color: "var(--low)", filter: "Maintenance" as const, delta: "suppressed" },
        ].map(({ label, count, color, filter, delta }) => (
          <div key={label} className="to-s3" style={{ cursor: "pointer" }} onClick={() => setStatusFilter(statusFilter === filter ? "All" : filter)}>
            <div className="to-kpi" style={statusFilter === filter ? { borderColor: "var(--brand-cta)", background: "var(--brand-dim)" } : {}}>
              <div className="lab">{label}</div>
              <div className="val" style={{ color }}>{count}</div>
              <div className="to-delta flat">{delta}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + view toggle */}
      <div className="to-row to-between" style={{ marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div className="to-row" style={{ gap: 8, flexWrap: "wrap" }}>
          <div className="to-search-mini">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
            <input placeholder="Search bench, host, owner…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {STATUS_FILTERS.map(f => (
            <button key={f} className={`to-fchip ${statusFilter === f ? "on" : ""}`} onClick={() => setStatusFilter(f)}>{f}</button>
          ))}
        </div>
        <div className="to-toggle">
          <button className={`to-toggle-btn ${view === "heatmap" ? "on" : ""}`} onClick={() => setView("heatmap")}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ verticalAlign: "middle", marginRight: 4 }}>
              <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            Heatmap
          </button>
          <button className={`to-toggle-btn ${view === "table" ? "on" : ""}`} onClick={() => setView("table")}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ verticalAlign: "middle", marginRight: 4 }}>
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
            Table
          </button>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="to-chart-empty" style={{ height: 200 }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ opacity: 0.4 }}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
          <div>No benches match your filter</div>
          <button className="to-btn ghost sm" onClick={() => { setStatusFilter("All"); setSearch(""); }}>Clear filter</button>
        </div>
      )}

      {view === "heatmap" && filtered.length > 0 && (
        <div className="to-bench-heatmap">
          {filtered.map(b => <BenchTile key={b.id} b={b} onClick={() => onOpenBench(b.id)} />)}
        </div>
      )}

      {view === "table" && filtered.length > 0 && (
        <div className="to-panel">
          <div style={{ overflowX: "auto" }}>
            <table className="to-tbl">
              <thead>
                <tr>
                  <th>Bench</th><th>Host(s)</th><th>Status</th><th>Owner</th>
                  <th>Assets</th><th>Last Ping</th><th>Location</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => {
                  const col = resolvedColor(b);
                  const icon = b.status === "Up" ? "↑" : b.status === "Down" ? "↓" : b.status === "Degraded" ? "⚠" : "⚙";
                  return (
                    <tr key={b.id}>
                      <td>
                        <button className="to-linklike" style={{ fontWeight: 600, fontFamily: "var(--mono)", fontSize: 12 }} onClick={() => onOpenBench(b.id)}>{b.id}</button>
                        <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 2 }}>{b.name}</div>
                      </td>
                      <td className="to-mono" style={{ fontSize: 12 }}>
                        {b.hosts.map(h => (
                          <span key={h.hostId} style={{ display: "block" }}>
                            {h.hostId}
                            <span className="to-chip mute" style={{ marginLeft: 6, fontSize: 10, padding: "1px 5px" }}>{h.platform}</span>
                          </span>
                        ))}
                      </td>
                      <td><span style={{ color: col, fontWeight: 500, fontSize: 12 }}>{icon} {resolvedStatus(b)}</span></td>
                      <td className="to-muted">{b.owner}</td>
                      <td className="to-mono">{b.composition.length}</td>
                      <td className="to-mono" style={{ fontSize: 12, color: b.lastPingValue > 60 ? "var(--bad)" : b.lastPingValue > 0 ? "var(--ok)" : "var(--ink-3)" }}>{pingLabel(b.lastPingValue)}</td>
                      <td className="to-muted" style={{ fontSize: 12 }}>{b.location}</td>
                      <td>
                        <div className="to-row" style={{ gap: 5 }}>
                          <button className="to-btn ghost sm" onClick={() => onOpenBench(b.id)}>Open</button>
                          <button className="to-btn ghost sm" onClick={() => addToast("Edit bench", `Opening ${b.id}…`, "info")}>Edit</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="to-row to-between" style={{ padding: "12px 16px", borderTop: "1px solid var(--line)" }}>
            <span className="to-muted to-mono" style={{ fontSize: 11 }}>Showing {filtered.length} of {benches.length} benches</span>
          </div>
        </div>
      )}
    </div>
  );
}
