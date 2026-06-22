import { useState, useMemo } from "react";
import { DATA, BENCHES_INITIAL, ASSETS_INITIAL, TEST_CENTERS } from "../data";
import type { Role } from "../App";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Props {
  onBedClick: (id: string) => void;
  onGoReports: () => void;
  onGoAI: () => void;
  addToast: (t: string, s?: string, type?: string) => void;
  role?: Role;
}

type Sev = "critical" | "warning";
type IssueKind = "bench" | "dut" | "asset" | "campaign";

interface Issue {
  sev: Sev;
  kind: IssueKind;
  id: string;
  title: string;
  detail: string;
  benchId?: string;
  centerName?: string;
}

// ─── Per-center stubs for KPIs that can't be derived from bench IDs ──────────
const CTR_EXTRA: Record<string, { campaigns: number; dutsOnline: number; dutsTotal: number }> = {
  "TC-MUC": { campaigns: 4, dutsOnline: 16, dutsTotal: 18 },
  "TC-STR": { campaigns: 2, dutsOnline: 11, dutsTotal: 14 },
  "TC-WAW": { campaigns: 2, dutsOnline: 14, dutsTotal: 16 },
};

const TODAY = new Date("2026-06-22");

// ─── KPI computation ─────────────────────────────────────────────────────────
function computeKpis(sel: string[]) {
  if (sel.includes("all")) {
    return { avail: "97.4", util: "73", campaigns: "8", campUnit: "/12", campDelta: "4 queued",
             dutsOnline: 41, dutsTotal: 48, utilDelta: "+5% vs last month" };
  }

  const ctrs = TEST_CENTERS.filter(c => sel.includes(c.id));
  const benchIds = ctrs.flatMap(c => c.benchIds);
  const benches = BENCHES_INITIAL.filter(b => benchIds.includes(b.id));

  const upCt   = benches.filter(b => b.status === "Up").length;
  const avail  = benches.length ? Math.round(upCt / benches.length * 100) : 0;

  const live   = benches.filter(b => b.telemetry.collectorUp);
  const util   = live.length
    ? Math.round(live.reduce((s, b) => s + b.telemetry.cpuPct, 0) / live.length)
    : 0;

  const extras = sel.map(id => CTR_EXTRA[id]).filter(Boolean);
  const campaigns  = extras.reduce((s, e) => s + e.campaigns,  0);
  const dutsOnline = extras.reduce((s, e) => s + e.dutsOnline, 0);
  const dutsTotal  = extras.reduce((s, e) => s + e.dutsTotal,  0);

  const availLabel = avail >= 80 ? "Operational" : avail >= 50 ? "Degraded" : "Issues";

  return { avail: String(avail), util: String(util), campaigns: String(campaigns),
           campUnit: "", campDelta: availLabel,
           dutsOnline, dutsTotal, utilDelta: "avg CPU utilization" };
}

// ─── Issue computation ────────────────────────────────────────────────────────
function findCenterCity(benchId: string): string | undefined {
  const c = TEST_CENTERS.find(c => c.benchIds.includes(benchId));
  if (c) return c.city;
  // Heatmap bench IDs (TB-01..TB-19) mapped by range
  const n = parseInt(benchId.replace("TB-", ""), 10);
  if (!isNaN(n)) {
    if (n <= 6)  return "Munich";
    if (n <= 12) return "Stuttgart";
    if (n <= 19) return "Warsaw";
  }
  return undefined;
}

function computeIssues(sel: string[]): Issue[] {
  const isAll = sel.includes("all");

  const scopeIds = isAll
    ? BENCHES_INITIAL.map(b => b.id)
    : TEST_CENTERS.filter(c => sel.includes(c.id)).flatMap(c => c.benchIds);
  const benches = BENCHES_INITIAL.filter(b => scopeIds.includes(b.id));

  const scopeTags = isAll
    ? null
    : new Set(TEST_CENTERS.filter(c => sel.includes(c.id)).flatMap(c => c.assetTags));

  const out: Issue[] = [];

  // Down benches
  benches.filter(b => b.status === "Down").forEach(b => out.push({
    sev: "critical", kind: "bench", id: b.id,
    title: `${b.id} is offline`,
    detail: `${b.name} · last seen ${b.telemetry.lastSeen ?? "unknown"}`,
    benchId: b.id, centerName: findCenterCity(b.id),
  }));

  // Disk > 90 %
  benches.filter(b => b.telemetry.collectorUp).forEach(b => {
    const hit = b.dfTable.find(d => d.usePct > 90);
    if (hit) out.push({
      sev: "critical", kind: "bench", id: b.id + "-disk",
      title: `Disk critical on ${b.id}`,
      detail: `${hit.mount} at ${hit.usePct}% — ${hit.used} / ${hit.size}`,
      benchId: b.id, centerName: findCenterCity(b.id),
    });
  });

  // Hot DUTs
  DATA.duts.filter(d => d.temp > 80).forEach(d => out.push({
    sev: "critical", kind: "dut", id: d.id,
    title: `Thermal alert: ${d.id}`,
    detail: `${d.name} · ${d.temp}°C on ${d.bed}`,
    benchId: d.bed, centerName: findCenterCity(d.bed),
  }));

  // Degraded DUTs (not already hot)
  DATA.duts.filter(d => d.status === "bad" && d.temp <= 80).forEach(d => out.push({
    sev: "warning", kind: "dut", id: d.id,
    title: `${d.id} degraded`,
    detail: `${d.name} · ${d.statusLabel} on ${d.bed}`,
    benchId: d.bed, centerName: findCenterCity(d.bed),
  }));

  // Calibration overdue
  DATA.duts
    .filter(d => d.cal && d.cal !== "—" && new Date(d.cal) < TODAY)
    .forEach(d => out.push({
      sev: "warning", kind: "dut", id: d.id + "-cal",
      title: `${d.id} calibration overdue`,
      detail: `${d.name} · due ${d.cal}`,
      benchId: d.bed, centerName: findCenterCity(d.bed),
    }));

  // Assets investigating (scoped by center)
  const assets = scopeTags
    ? ASSETS_INITIAL.filter(a => scopeTags.has(a.tag))
    : ASSETS_INITIAL;
  assets.filter(a => a.status === "investigating").forEach(a => out.push({
    sev: "warning", kind: "asset", id: a.tag,
    title: `Asset #${a.tag} under investigation`,
    detail: `${a.model} · ${a.location}`,
  }));

  // Campaigns at risk
  DATA.campaigns.planned.filter(c => c.risk).forEach(c => out.push({
    sev: "warning", kind: "campaign", id: c.id,
    title: `${c.id} blocked`,
    detail: `${c.title} · ${c.due}`,
  }));

  return out.sort((a, b) => a.sev === b.sev ? 0 : a.sev === "critical" ? -1 : 1);
}

// ─── Center pill ──────────────────────────────────────────────────────────────
function CenterPill({
  name, count, avail, active, onClick,
}: { name: string; count?: number; avail?: number; active: boolean; onClick: () => void }) {
  const dot = avail === undefined ? null : avail >= 80 ? "ok" : avail >= 50 ? "warn" : "bad";
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 7,
        padding: "5px 14px", borderRadius: 20,
        border: active ? "1.5px solid var(--brand)" : "1.5px solid var(--line-2)",
        background: active ? "var(--brand-dim)" : "var(--panel-2)",
        color: active ? "var(--brand)" : "var(--ink-2)",
        fontSize: 12.5, fontWeight: active ? 600 : 400,
        cursor: "pointer", transition: "all .12s",
        whiteSpace: "nowrap",
      }}
    >
      {dot && (
        <span style={{
          width: 7, height: 7, borderRadius: "50%",
          background: `var(--${dot})`, display: "inline-block", flexShrink: 0,
        }} />
      )}
      {name}
      {count !== undefined && (
        <span style={{
          fontSize: 10, padding: "0 5px", borderRadius: 8, minWidth: 18,
          textAlign: "center", lineHeight: "18px", display: "inline-block",
          background: active ? "var(--brand-dim)" : "var(--panel-3)",
          color: active ? "var(--brand)" : "var(--ink-2)",
        }}>
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Issue card ───────────────────────────────────────────────────────────────
const SEV = {
  critical: { border: "#C0392B", bg: "rgba(192,57,43,.055)" },
  warning:  { border: "#B8860B", bg: "rgba(184,134,11,.055)" },
} as const;

const KIND_PATH: Record<IssueKind, string> = {
  bench:    '<rect x="2" y="3" width="20" height="5" rx="1.5"/><rect x="2" y="10" width="20" height="5" rx="1.5"/><rect x="2" y="17" width="20" height="4" rx="1.5"/>',
  dut:      '<path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/>',
  asset:    '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>',
  campaign: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/>',
};

function IssueCard({ issue, onAct, onView }: { issue: Issue; onAct: () => void; onView?: () => void }) {
  const s = SEV[issue.sev];
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: "10px 12px", borderRadius: 8,
      background: s.bg,
      border: `1px solid ${s.border}30`,
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke={s.border} strokeWidth="1.8"
        style={{ flexShrink: 0, marginTop: 2 }}
        dangerouslySetInnerHTML={{ __html: KIND_PATH[issue.kind] }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 2 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", lineHeight: 1.3 }}>
            {issue.title}
          </span>
          {issue.centerName && (
            <span style={{
              fontSize: 10, padding: "1px 6px", borderRadius: 4, flexShrink: 0,
              background: "var(--panel-3)", color: "var(--ink-3)", fontWeight: 500,
            }}>
              {issue.centerName}
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{issue.detail}</div>
      </div>
      <button
        onClick={onView ?? onAct}
        style={{
          flexShrink: 0, fontSize: 11, color: s.border, fontWeight: 600,
          background: "none", border: "none", cursor: "pointer", padding: "0 2px",
          whiteSpace: "nowrap",
        }}
      >
        View →
      </button>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function Dashboard({ onBedClick, onGoReports, addToast, role = "engineer" }: Props) {
  const [sel, setSel] = useState<string[]>(["all"]);

  function toggle(id: string) {
    if (id === "all") { setSel(["all"]); return; }
    setSel(prev => {
      const without = prev.filter(x => x !== "all");
      if (without.includes(id)) {
        const next = without.filter(x => x !== id);
        return next.length ? next : ["all"];
      }
      return [...without, id];
    });
  }

  const kpis   = useMemo(() => computeKpis(sel),    [sel]);
  const issues = useMemo(() => computeIssues(sel),  [sel]);

  // Heatmap: null = show global DATA.beds, else per-center BENCHES_INITIAL slice
  const filteredBenches = useMemo(() => {
    if (sel.includes("all")) return null;
    const ids = TEST_CENTERS.filter(c => sel.includes(c.id)).flatMap(c => c.benchIds);
    return BENCHES_INITIAL.filter(b => ids.includes(b.id));
  }, [sel]);

  const campaignSlice = sel.includes("all")
    ? DATA.activeCampaigns
    : DATA.activeCampaigns.slice(0, Number(kpis.campaigns));

  // Compute per-center availability for pills
  const ctrAvail = useMemo(() => {
    const m: Record<string, number> = {};
    TEST_CENTERS.forEach(c => {
      const bs = BENCHES_INITIAL.filter(b => c.benchIds.includes(b.id));
      m[c.id] = bs.length ? Math.round(bs.filter(b => b.status === "Up").length / bs.length * 100) : 0;
    });
    return m;
  }, []);

  const critCt = issues.filter(i => i.sev === "critical").length;
  const warnCt = issues.filter(i => i.sev === "warning").length;

  return (
    <div className="to-screen">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="to-page-head">
        <div>
          <div className="to-kicker">Live Dashboard</div>
          <h1>Operations Overview</h1>
          <div style={{ color: "var(--ink-2)", fontSize: 13, marginTop: 5 }}>
            Real-time overview · auto-refresh 30s · last sync 09:47:12
          </div>
        </div>
        <div className="to-head-actions">
          <span className="to-live-pill"><span className="to-dot live" />LIVE</span>
          <button className="to-btn primary sm" onClick={onGoReports}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 3v12M8 11l4 4 4-4M5 21h14"/>
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* ── Center selector ───────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, color: "var(--ink-4)", fontWeight: 500, textTransform: "uppercase", letterSpacing: ".07em", marginRight: 2 }}>
          Center
        </span>
        <CenterPill name="All Centers" active={sel.includes("all")} onClick={() => toggle("all")} />
        {TEST_CENTERS.map(c => (
          <CenterPill
            key={c.id}
            name={c.city}
            count={c.benchIds.length}
            avail={ctrAvail[c.id]}
            active={sel.includes(c.id)}
            onClick={() => toggle(c.id)}
          />
        ))}
      </div>

      {/* ── Needs Attention ──────────────────────────────────────────────── */}
      {issues.length > 0 && (
        <div className="to-panel" style={{ marginBottom: 20 }}>
          <div className="to-panel-h">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bad)" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span className="to-eyebrow" style={{ color: "var(--bad)" }}>Needs Attention</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {critCt > 0 && <span className="to-chip bad" style={{ fontSize: 10 }}>{critCt} critical</span>}
              {warnCt > 0 && <span className="to-chip warn" style={{ fontSize: 10 }}>{warnCt} warning{warnCt > 1 ? "s" : ""}</span>}
            </div>
          </div>
          <div className="to-panel-b">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 7 }}>
              {issues.map(iss => (
                <IssueCard
                  key={`${iss.kind}-${iss.id}`}
                  issue={iss}
                  onView={iss.benchId ? () => onBedClick(iss.benchId!) : undefined}
                  onAct={() => addToast(iss.id, iss.detail, iss.sev === "critical" ? "error" : "warn")}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No issues state */}
      {issues.length === 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "12px 16px", borderRadius: 10, marginBottom: 20,
          background: "rgba(26,150,72,.06)", border: "1px solid rgba(26,150,72,.2)",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ok)" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <span style={{ fontSize: 13, color: "var(--ok)", fontWeight: 500 }}>
            All systems operational — no issues in selected scope
          </span>
        </div>
      )}

      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      <div className="to-grid to-g12" style={{ marginBottom: 16 }}>
        {[
          {
            lab: "Bench Availability",
            val: kpis.avail, unit: "%",
            delta: sel.includes("all") ? "+1.2% vs last month" : kpis.campDelta,
            dir: Number(kpis.avail) >= 80 ? "up" : "down",
            sub: "test benches Up right now",
          },
          {
            lab: "Bed Utilization",
            val: kpis.util, unit: "%",
            delta: kpis.utilDelta,
            dir: "flat" as const,
            sub: "test beds in active campaigns",
          },
          {
            lab: "Active Campaigns",
            val: kpis.campaigns, unit: kpis.campUnit,
            delta: kpis.campDelta === kpis.campDelta && sel.includes("all") ? "4 queued" : "running",
            dir: "flat" as const,
            sub: "running · scheduled",
          },
          {
            lab: "DUTs Online",
            val: String(kpis.dutsOnline), unit: `/${kpis.dutsTotal}`,
            delta: sel.includes("all") ? "7 offline / maint." : `${kpis.dutsTotal - kpis.dutsOnline} offline`,
            dir: kpis.dutsOnline / kpis.dutsTotal > 0.85 ? "flat" as const : "down" as const,
            sub: "devices connected & reachable",
          },
        ].map(k => (
          <div key={k.lab} className="to-s3">
            <div className="to-kpi">
              <div className="lab">{k.lab}</div>
              <div className="val">{k.val}<small>{k.unit}</small></div>
              <div className={`to-delta ${k.dir}`}>
                {k.dir === "up" ? "↑" : k.dir === "down" ? "↓" : ""} {k.delta}
              </div>
              <div style={{ fontSize: 10.5, color: "var(--ink-4)", marginTop: 5, lineHeight: 1.3 }}>{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Heatmap + Campaigns ─────────────── hidden for manager role ───── */}
      {role !== "manager" && <div className="to-grid to-g12" style={{ marginBottom: 16 }}>
        <div className="to-s7">
          <div className="to-panel">
            <div className="to-panel-h">
              <span className="to-eyebrow">
                {filteredBenches ? "Bench status — selected centers" : "Test bed heatmap — utilization"}
              </span>
              {filteredBenches && (
                <span style={{ fontSize: 10.5, color: "var(--ink-4)" }}>
                  {filteredBenches.filter(b => b.status === "Up").length} Up · {filteredBenches.filter(b => b.status !== "Up").length} not Up
                </span>
              )}
            </div>
            <div className="to-panel-b">
              <div className="to-heat">
                {filteredBenches ? filteredBenches.map(b => {
                  const s = b.status === "Down" ? "error"
                    : b.status === "Maintenance" ? "maint"
                    : b.status === "Degraded" ? "mid"
                    : b.telemetry.collectorUp
                      ? b.telemetry.cpuPct > 80 ? "high" : b.telemetry.cpuPct > 40 ? "mid" : "low"
                      : "mid";
                  const lbl = b.status === "Down" ? "DOWN"
                    : b.status === "Maintenance" ? "MAINT"
                    : b.telemetry.collectorUp ? `${b.telemetry.cpuPct}%` : "?";
                  return (
                    <button key={b.id} className={`to-bed s-${s}`} onClick={() => onBedClick(b.id)}>
                      <div className="load">{lbl}</div>
                      <div className="bid">{b.id}</div>
                    </button>
                  );
                }) : DATA.beds.map(b => (
                  <button key={b.id} className={`to-bed s-${b.status}`} onClick={() => onBedClick(b.id)}>
                    <div className="load">{'label' in b && b.label ? b.label : b.load + "%"}</div>
                    <div className="bid">{b.id}</div>
                  </button>
                ))}
              </div>
              <div className="to-legend" style={{ marginTop: 14 }}>
                <span><i style={{ background: "var(--ok)" }} />High (&gt;80%)</span>
                <span><i style={{ background: "var(--mid)" }} />Mid (40–80%)</span>
                <span><i style={{ background: "var(--low)" }} />Low (&lt;40%)</span>
                <span><i style={{ background: "var(--warn)" }} />Maint.</span>
                <span><i style={{ background: "var(--bad)" }} />Error</span>
              </div>
            </div>
          </div>
        </div>
        <div className="to-s5">
          <div className="to-panel">
            <div className="to-panel-h">
              <span className="to-eyebrow">Active campaigns</span>
              <button className="to-btn ghost sm" onClick={() => addToast("Campaigns", "Opening campaigns…", "info")}>View all</button>
            </div>
            <div className="to-panel-b" style={{ paddingTop: 4, paddingBottom: 4 }}>
              {campaignSlice.length > 0 ? campaignSlice.map(c => (
                <div key={c.nm} className="to-acrow">
                  <span className={`to-dot ${c.dot}`} />
                  <span className="nm">{c.nm}</span>
                  <span className="beds">{c.beds}</span>
                  <span className="pct">{c.pct}%</span>
                </div>
              )) : (
                <div style={{ fontSize: 12.5, color: "var(--ink-4)", padding: "16px 0", textAlign: "center" }}>
                  No campaigns in this scope
                </div>
              )}
            </div>
          </div>
        </div>
      </div>}

      {/* ── Alerts & Events (full width) ─────────────────────────────────── */}
      <div className="to-panel">
        <div className="to-panel-h">
          <span className="to-eyebrow">Alerts &amp; events</span>
          <span className="to-chip bad">1 critical</span>
        </div>
        <div className="to-panel-b" style={{ paddingTop: 6, paddingBottom: 6 }}>
          {DATA.events.map((e, i) => (
            <div key={i} className="to-alert">
              <span className="ad" style={{ background: `var(--${e.dot})` }} />
              <div style={{ minWidth: 0 }}><div className="ttl">{e.ttl}</div></div>
              <div className="when">{e.when}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
