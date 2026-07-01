import { useState, useMemo } from "react";
import { useRole } from "../roleContext";
import { CampaignSimulator } from "./AIInsights";
import {
  RICH_CAMPAIGNS, getPortfolioKPIs, getCampaignById,
  RichCampaign, RiskLevel,
} from "../lib/campaignData";

interface Props { addToast: (t: string, s?: string, type?: string) => void; }

// ─── Risk / status helpers ────────────────────────────────────────────────────
const RISK_COLOR: Record<RiskLevel, string> = {
  none: "var(--ok)", low: "var(--ok)", medium: "var(--warn)", high: "var(--bad)", critical: "var(--bad)",
};
const STATUS_DOT: Record<string, string> = {
  active: "brand", planned: "low", completed: "ok", report: "mid", blocked: "bad",
};
const STATUS_LABEL: Record<string, string> = {
  active: "Active", planned: "Planned", completed: "Completed", report: "Report ready", blocked: "Blocked",
};

function RiskBadge({ level, label }: { level: RiskLevel; label?: string }) {
  if (level === "none") return null;
  const c = level === "critical" || level === "high" ? "bad" : "warn";
  return (
    <span className={`to-chip ${c}`} style={{ fontSize: 10, padding: "1px 7px" }}>
      <span className={`to-dot ${c}`} />
      {label ?? level}
    </span>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Spark({ data, color = "var(--brand)", w = 56, h = 22 }: { data: number[]; color?: string; w?: number; h?: number }) {
  if (!data.length) return null;
  const mn = Math.min(...data), mx = Math.max(...data);
  const range = mx - mn || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - mn) / range) * (h - 2) - 1;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block", flexShrink: 0 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Mini donut progress ──────────────────────────────────────────────────────
function MiniDonut({ pct, color }: { pct: number; color: string }) {
  const r = 10, circ = 2 * Math.PI * r;
  return (
    <svg width="26" height="26" viewBox="0 0 26 26">
      <circle cx="13" cy="13" r={r} fill="none" stroke="var(--panel-3)" strokeWidth="3" />
      <circle cx="13" cy="13" r={r} fill="none" stroke={color} strokeWidth="3"
        strokeDasharray={`${(pct / 100) * circ} ${circ}`}
        strokeDashoffset={circ / 4} strokeLinecap="round" />
      <text x="13" y="17" textAnchor="middle" fontSize="7" fontWeight="700" fill={color}>{pct}</text>
    </svg>
  );
}

// ─── Health Score gauge ───────────────────────────────────────────────────────
function HealthGauge({ score, color, label, size = 88 }: { score: number; color: string; label: string; size?: number }) {
  const r = size / 2 - 8, circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--panel-3)" strokeWidth="6" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${fill} ${circ}`} strokeDashoffset={circ / 4}
          strokeLinecap="round" style={{ transition: "stroke-dasharray .6s" }} />
        <text x={size / 2} y={size / 2 - 2} textAnchor="middle" fontSize="20" fontWeight="730" fill={color}>{score}</text>
        <text x={size / 2} y={size / 2 + 13} textAnchor="middle" fontSize="9" fill="var(--ink-3)">/100</text>
      </svg>
      <span style={{ fontSize: 11, fontWeight: 600, color, whiteSpace: "nowrap" }}>{label}</span>
    </div>
  );
}

// ─── Timeline bar ─────────────────────────────────────────────────────────────
function TimelineBar({ start, end, forecast, delta }: { start: string; end: string; forecast: string; delta: number }) {
  const s = new Date(start).getTime(), e = new Date(end).getTime();
  const f = new Date(forecast).getTime(), now = new Date("2026-07-01").getTime();
  const total = Math.max(e, f) - s;
  const nowPct     = Math.round(((now - s) / total) * 100);
  const endPct     = Math.round(((e - s) / total) * 100);
  const forecastPct = Math.round(((f - s) / total) * 100);
  const late = delta > 0;

  const fmt = (d: string) => {
    const dt = new Date(d);
    return dt.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
        Campaign Timeline
      </div>
      <div style={{ position: "relative", height: 8, background: "var(--panel-3)", borderRadius: 4, overflow: "visible" }}>
        {/* progress fill */}
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${Math.min(nowPct, 100)}%`, background: "var(--brand)", borderRadius: 4 }} />
        {/* deadline marker */}
        <div style={{ position: "absolute", left: `${Math.min(endPct, 100)}%`, top: -3, width: 2, height: 14, background: "var(--ink-3)", borderRadius: 1 }} />
        {/* forecast marker */}
        <div style={{ position: "absolute", left: `${Math.min(forecastPct, 100)}%`, top: -3, width: 2, height: 14, background: late ? "var(--bad)" : "var(--ok)", borderRadius: 1 }} />
        {/* today dot */}
        <div style={{ position: "absolute", left: `${Math.min(nowPct, 100)}%`, top: -4, width: 16, height: 16, background: "var(--brand)", border: "2px solid var(--panel)", borderRadius: "50%", transform: "translateX(-50%)" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 10, color: "var(--ink-3)" }}>
        <span>{fmt(start)}</span>
        <span style={{ display: "flex", gap: 12 }}>
          <span>Today: <b style={{ color: "var(--brand)" }}>Jul 1</b></span>
          <span>Forecast: <b style={{ color: late ? "var(--bad)" : "var(--ok)" }}>{fmt(forecast)}{late ? ` (+${delta}d late)` : ` (${Math.abs(delta)}d early)`}</b></span>
          <span>Deadline: <b>{fmt(end)}</b></span>
        </span>
        <span>{fmt(end)}</span>
      </div>
    </div>
  );
}

// ─── Bench status row ─────────────────────────────────────────────────────────
function BenchRow({ b }: { b: RichCampaign["environment"]["benches"][0] }) {
  const dot = b.status === "working" ? "ok" : b.status === "focus-needed" ? "warn" : "bad";
  const label = b.status === "working" ? "Working" : b.status === "focus-needed" ? "Focus needed" : "Not working";
  return (
    <div style={{ display: "grid", gridTemplateColumns: "60px 90px 1fr 1fr 1fr 1fr 52px", gap: 6, alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--line)" }}>
      <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600 }}>{b.id}</span>
      <span><span className={`to-dot ${dot}`} /><span style={{ fontSize: 11, color: "var(--ink-2)" }}>{label}</span></span>
      <span style={{ fontSize: 11, color: "var(--ink-2)" }}>{b.uptimePct > 0 ? `${b.uptimePct}%` : "—"}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <div style={{ flex: 1, height: 4, background: "var(--panel-3)", borderRadius: 2 }}>
          <div style={{ height: "100%", width: `${b.cpuPct}%`, background: b.cpuPct > 80 ? "var(--bad)" : "var(--brand)", borderRadius: 2 }} />
        </div>
        <span style={{ fontSize: 10, color: "var(--ink-3)", width: 28 }}>{b.cpuPct || "—"}%</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <div style={{ flex: 1, height: 4, background: "var(--panel-3)", borderRadius: 2 }}>
          <div style={{ height: "100%", width: `${b.ramPct}%`, background: b.ramPct > 85 ? "var(--warn)" : "var(--brand-dim2)", borderRadius: 2 }} />
        </div>
        <span style={{ fontSize: 10, color: "var(--ink-3)", width: 28 }}>{b.ramPct || "—"}%</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <div style={{ flex: 1, height: 4, background: "var(--panel-3)", borderRadius: 2 }}>
          <div style={{ height: "100%", width: `${b.diskPct}%`, background: b.diskPct > 85 ? "var(--bad)" : "var(--ok-dim)", borderRadius: 2 }} />
        </div>
        <span style={{ fontSize: 10, color: b.diskPct > 85 ? "var(--bad)" : "var(--ink-3)", width: 28 }}>{b.diskPct || "—"}%</span>
      </div>
      <span style={{ fontSize: 10, color: b.coredumps > 0 ? "var(--bad)" : "var(--ink-4)", textAlign: "right" }}>{b.coredumps > 0 ? `⚠ ${b.coredumps}` : "0"}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CAMPAIGN DETAIL
// ─────────────────────────────────────────────────────────────────────────────
function CampaignDetail({ id, onBack, addToast }: { id: string; onBack: () => void; addToast: Props["addToast"] }) {
  const { role, can } = useRole();
  const c = getCampaignById(id);
  const [tab, setTab] = useState<"overview" | "execution" | "resources" | "integrations" | "simulate">("overview");

  if (!c) return <div style={{ padding: 40, color: "var(--ink-3)" }}>Campaign not found.</div>;

  const { ai, execution: ex, environment: env, integrations: integ } = c;
  const isManager = role === "manager";
  const isHW      = role === "hw-engineer";
  const isEng     = role === "engineer";

  // ── KPI strips per role ──
  const managerKPIs = [
    { label: "Health Score",       val: `${ai.healthScore}`,     unit: "/100", color: ai.healthColor,    sub: ai.healthLabel },
    { label: "Forecast",           val: ai.forecastDeltaDays === 0 ? "On time" : ai.forecastDeltaDays > 0 ? `+${ai.forecastDeltaDays}d late` : `${Math.abs(ai.forecastDeltaDays)}d early`,
                                   color: ai.forecastDeltaDays > 3 ? "var(--bad)" : ai.forecastDeltaDays > 0 ? "var(--warn)" : "var(--ok)",
                                   sub: `due ${c.endDate}` },
    { label: "Automation Rate",    val: `${ex.automationRate}`, unit: "%",    color: ex.automationRate >= 70 ? "var(--ok)" : "var(--warn)", sub: "of tests automated" },
    { label: "Team",               val: `${c.teamSize}`,         unit: " FTE", color: "var(--ink)",       sub: c.team.split("(")[0].trim() },
    { label: "Test Center",        val: c.centerLabel,           color: "var(--ink)",       sub: c.centerId, num: false },
    { label: "Open Bugs",          val: `${ex.bugsOpen}`,        color: ex.bugsBySeverity.blocker > 0 ? "var(--bad)" : "var(--warn)", sub: `${ex.bugsBySeverity.blocker} blockers` },
  ];
  const engineerKPIs = [
    { label: "Tests Run",          val: ex.executed.toLocaleString(), color: "var(--ink)",       sub: `of ${ex.totalTests.toLocaleString()} total` },
    { label: "Pass Rate",          val: `${ex.passRate.toFixed(1)}`,  unit: "%", color: ex.passRate >= 80 ? "var(--ok)" : ex.passRate >= 60 ? "var(--warn)" : "var(--bad)", sub: "this campaign" },
    { label: "Failed",             val: ex.fail.toLocaleString(),     color: ex.fail > 0 ? "var(--bad)" : "var(--ok)",   sub: "test failures" },
    { label: "Skipped",            val: ex.skip.toLocaleString(),     color: "var(--warn)",      sub: "not executed" },
    { label: "Open Bugs",          val: `${ex.bugsOpen}`,             color: ex.bugsBySeverity.blocker > 0 ? "var(--bad)" : "var(--warn)", sub: `${ex.bugsBySeverity.blocker} blockers` },
    { label: "Automation Rate",    val: `${ex.automationRate}`,       unit: "%", color: ex.automationRate >= 70 ? "var(--ok)" : "var(--warn)", sub: "of tests automated" },
  ];
  const hwKPIs = [
    { label: "Benches Assigned",   val: `${env.benchCount}`,          color: "var(--ink)",       sub: "total in campaign" },
    { label: "Working",            val: `${env.benchWorking}`,         color: "var(--ok)",        sub: `${env.benchFocusNeeded} focus needed` },
    { label: "Not Working",        val: `${env.benchNotWorking}`,      color: env.benchNotWorking > 0 ? "var(--bad)" : "var(--ok)", sub: "offline/unavailable" },
    { label: "Bench Uptime",       val: `${env.benchUptimePct}`,       unit: "%", color: env.benchUptimePct < 50 ? "var(--bad)" : env.benchUptimePct < 80 ? "var(--warn)" : "var(--ok)", sub: "average across benches" },
    { label: "Disk Critical",      val: `${env.diskCriticalCount}`,    color: env.diskCriticalCount > 0 ? "var(--bad)" : "var(--ok)", sub: "benches >85% disk" },
    { label: "Coredumps",          val: `${env.coredumpCount}`,        color: env.coredumpCount > 5 ? "var(--bad)" : env.coredumpCount > 0 ? "var(--warn)" : "var(--ok)", sub: "total this cycle" },
  ];

  const kpis = isEng ? engineerKPIs : isHW ? hwKPIs : managerKPIs;

  const TABS = [
    { key: "overview",      label: "Overview" },
    { key: "execution",     label: "Execution" },
    { key: "resources",     label: "Resources" },
    { key: "integrations",  label: "Integrations" },
    { key: "simulate",      label: "Simulate" },
  ] as const;

  return (
    <div className="to-screen">
      {/* Back + Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
        <button className="to-btn ghost sm" onClick={onBack} style={{ marginTop: 4, flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Campaigns
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span className="to-kicker">{c.id} · {c.domainLabel}</span>
            <span className={`to-dot ${STATUS_DOT[c.status]}`} />
            <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{STATUS_LABEL[c.status]}</span>
            {c.ai.riskLevel !== "none" && <RiskBadge level={c.ai.riskLevel} />}
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 730 }}>{c.title}</h1>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>
            {c.startDate} → {c.endDate} · {c.centerLabel} · {c.team}
          </div>
        </div>
        {can("campaign.edit") && (
          <button className="to-btn ghost sm" onClick={() => addToast("Edit campaign", "Opening campaign editor…", "info")}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="to-tabs" style={{ marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t.key} className={`to-tab${tab === t.key ? " active" : ""}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: OVERVIEW ──────────────────────────────────────────────────────── */}
      {tab === "overview" && (
        <div>
          {/* Top row: health gauge + KPI cards */}
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 20, marginBottom: 20 }}>
            <div className="to-panel" style={{ padding: "20px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, minWidth: 130 }}>
              <HealthGauge score={ai.healthScore} color={ai.healthColor} label={ai.healthLabel} size={96} />
              <div style={{ fontSize: 10, color: "var(--ink-4)", textAlign: "center", maxWidth: 110 }}>
                Campaign Health Score
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {kpis.map(k => (
                <div key={k.label} className="to-kpi">
                  <div className="lab">{k.label}</div>
                  <div className="val" style={{ color: k.color, ...("num" in k && k.num === false ? { fontSize: 15 } : {}) }}>
                    {k.val}{"unit" in k && k.unit && <span style={{ fontSize: 13, fontWeight: 400, color: "var(--ink-3)", marginLeft: 3 }}>{k.unit}</span>}
                  </div>
                  <div className="to-delta flat">{k.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress bar */}
          <div className="to-panel" style={{ padding: "14px 18px", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-2)" }}>Campaign Progress</span>
              <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--brand)", fontWeight: 700 }}>{c.prog}%</span>
            </div>
            <div style={{ height: 8, background: "var(--panel-3)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${c.prog}%`, background: "var(--brand)", borderRadius: 4, transition: "width .6s" }} />
            </div>
            <TimelineBar start={c.startDate} end={c.endDate} forecast={ai.forecastedCompletionDate} delta={ai.forecastDeltaDays} />
          </div>

          {/* AI Advisory panel */}
          <div className="to-panel" style={{ padding: "16px 18px", borderLeft: `3px solid ${ai.healthColor}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ai.healthColor} strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>AI Advisory</span>
              <span className={`to-chip ${ai.riskLevel === "none" || ai.riskLevel === "low" ? "ok" : ai.riskLevel === "medium" ? "warn" : "bad"}`} style={{ fontSize: 10 }}>
                {ai.healthLabel}
              </span>
            </div>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>
              {ai.riskReason || "Campaign is proceeding normally. No immediate action required."}
            </p>
            {ai.recommendations.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: ".06em" }}>Recommended Actions</div>
                {ai.recommendations.map((r, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "var(--panel-2)", borderRadius: 8, border: "1px solid var(--line)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: "var(--ink)", fontWeight: 500 }}>{r.text}</div>
                      <div style={{ fontSize: 10, color: "var(--ok)", marginTop: 1 }}>↗ {r.impact}</div>
                    </div>
                    <button className="to-btn ghost sm" style={{ fontSize: 11 }} onClick={() => addToast(r.action, r.text, "info")}>{r.action}</button>
                  </div>
                ))}
              </div>
            )}

            {/* Lessons learned (completed campaigns) */}
            {ai.lessonsLearned && ai.lessonsLearned.length > 0 && (
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Lessons Learned</div>
                {ai.lessonsLearned.map((l, i) => (
                  <div key={i} style={{ fontSize: 12, color: "var(--ink-2)", padding: "4px 0", borderBottom: i < ai.lessonsLearned!.length - 1 ? "1px dashed var(--line)" : undefined }}>
                    {l}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: EXECUTION ─────────────────────────────────────────────────────── */}
      {tab === "execution" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Test execution summary table */}
          <div className="to-panel" style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Test Execution Summary</span>
              <span style={{ fontSize: 10, color: "var(--ink-4)" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ok)", display: "inline-block", marginRight: 4 }} />
                Source: Test Management · synced 1h ago
              </span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "var(--panel-2)" }}>
                  {["Automation Status","PASS","FAIL","SKIP","OTHER","Executed","Total"].map(h => (
                    <th key={h} style={{ padding: "7px 10px", textAlign: h === "Automation Status" ? "left" : "right", fontWeight: 600, color: "var(--ink-3)", fontSize: 11, borderBottom: "1px solid var(--line)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Automated",   Math.round(ex.pass * 0.7),  Math.round(ex.fail * 0.65), Math.round(ex.skip * 0.4),  0],
                  ["Automatable", Math.round(ex.pass * 0.1),  Math.round(ex.fail * 0.15), Math.round(ex.skip * 0.2),  ex.other],
                  ["Manual",      Math.round(ex.pass * 0.2),  Math.round(ex.fail * 0.2),  Math.round(ex.skip * 0.4),  0],
                ].map(([label, p, f, s, o]) => {
                  const tot = Number(p) + Number(f) + Number(s) + Number(o);
                  return (
                    <tr key={String(label)} style={{ borderBottom: "1px solid var(--line)" }}>
                      <td style={{ padding: "7px 10px", color: "var(--ink-2)" }}>{label}</td>
                      <td style={{ padding: "7px 10px", textAlign: "right", color: "var(--ok)", fontWeight: 600 }}>{Number(p).toLocaleString()}</td>
                      <td style={{ padding: "7px 10px", textAlign: "right", color: Number(f) > 0 ? "var(--bad)" : "var(--ink-3)", fontWeight: 600 }}>{Number(f).toLocaleString()}</td>
                      <td style={{ padding: "7px 10px", textAlign: "right", color: "var(--warn)" }}>{Number(s).toLocaleString()}</td>
                      <td style={{ padding: "7px 10px", textAlign: "right", color: "var(--ink-3)" }}>{Number(o).toLocaleString()}</td>
                      <td style={{ padding: "7px 10px", textAlign: "right", fontWeight: 600 }}>{tot.toLocaleString()}</td>
                      <td style={{ padding: "7px 10px", textAlign: "right", color: "var(--ink-3)" }}>—</td>
                    </tr>
                  );
                })}
                <tr style={{ background: "var(--panel-2)", fontWeight: 700 }}>
                  <td style={{ padding: "7px 10px" }}>Total</td>
                  <td style={{ padding: "7px 10px", textAlign: "right", color: "var(--ok)" }}>{ex.pass.toLocaleString()}</td>
                  <td style={{ padding: "7px 10px", textAlign: "right", color: ex.fail > 0 ? "var(--bad)" : "var(--ok)" }}>{ex.fail.toLocaleString()}</td>
                  <td style={{ padding: "7px 10px", textAlign: "right", color: "var(--warn)" }}>{ex.skip.toLocaleString()}</td>
                  <td style={{ padding: "7px 10px", textAlign: "right" }}>{ex.other.toLocaleString()}</td>
                  <td style={{ padding: "7px 10px", textAlign: "right" }}>{ex.executed.toLocaleString()}</td>
                  <td style={{ padding: "7px 10px", textAlign: "right" }}>{ex.totalTests.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Trend charts row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="to-panel" style={{ padding: "16px 18px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Pass Rate Trend (7d)</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 60 }}>
                {ex.passRateTrend.map((v, i) => {
                  const h = Math.round((v / 100) * 52);
                  const isLast = i === ex.passRateTrend.length - 1;
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                      <span style={{ fontSize: 9, color: "var(--ink-4)" }}>{v.toFixed(0)}%</span>
                      <div style={{ width: "100%", height: h, background: isLast ? "var(--brand)" : "var(--panel-3)", borderRadius: "2px 2px 0 0", border: isLast ? "none" : "1px solid var(--line)" }} />
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 9, color: "var(--ink-4)" }}>
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Today</span>
              </div>
            </div>
            <div className="to-panel" style={{ padding: "16px 18px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Automation Coverage (7d)</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 60 }}>
                {ex.automationTrend.map((v, i) => {
                  const h = Math.max(2, Math.round((v / 100) * 52));
                  const isLast = i === ex.automationTrend.length - 1;
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                      <span style={{ fontSize: 9, color: "var(--ink-4)" }}>{v}%</span>
                      <div style={{ width: "100%", height: h, background: isLast ? "var(--ok)" : "var(--panel-3)", borderRadius: "2px 2px 0 0", border: isLast ? "none" : "1px solid var(--line)" }} />
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 9, color: "var(--ink-4)" }}>
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Today</span>
              </div>
            </div>
          </div>

          {/* Bug table */}
          <div className="to-panel" style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Bug Distribution</span>
              <span style={{ fontSize: 10, color: "var(--ink-4)" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ok)", display: "inline-block", marginRight: 4 }} />
                Source: Jira · synced 2m ago
              </span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "var(--panel-2)" }}>
                  {["Severity","Count","Open","TO DO","IN PROGRESS","CLOSED"].map(h => (
                    <th key={h} style={{ padding: "7px 10px", textAlign: "left", fontWeight: 600, color: "var(--ink-3)", fontSize: 11, borderBottom: "1px solid var(--line)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { sev: "1 - Blocker",  count: ex.bugsBySeverity.blocker,  color: "var(--bad)" },
                  { sev: "2 - Critical", count: ex.bugsBySeverity.critical, color: "var(--bad)" },
                  { sev: "3 - Major",    count: ex.bugsBySeverity.major,    color: "var(--warn)" },
                  { sev: "4 - Normal",   count: ex.bugsBySeverity.normal,   color: "var(--ink-3)" },
                ].map(row => (
                  <tr key={row.sev} style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "7px 10px", fontWeight: 600, color: row.color }}>{row.sev}</td>
                    <td style={{ padding: "7px 10px" }}>{row.count}</td>
                    <td style={{ padding: "7px 10px", color: row.count > 0 ? row.color : "var(--ink-4)" }}>{row.count}</td>
                    <td style={{ padding: "7px 10px" }}>{Math.round(row.count * 0.6)}</td>
                    <td style={{ padding: "7px 10px" }}>{Math.round(row.count * 0.3)}</td>
                    <td style={{ padding: "7px 10px", color: "var(--ok)" }}>0</td>
                  </tr>
                ))}
                <tr style={{ background: "var(--panel-2)", fontWeight: 700, borderTop: "1px solid var(--line-2)" }}>
                  <td style={{ padding: "7px 10px" }}>Total</td>
                  <td style={{ padding: "7px 10px" }}>{ex.bugsTotal}</td>
                  <td style={{ padding: "7px 10px", color: ex.bugsOpen > 0 ? "var(--bad)" : "var(--ok)" }}>{ex.bugsOpen}</td>
                  <td style={{ padding: "7px 10px" }}>{Math.round(ex.bugsOpen * 0.6)}</td>
                  <td style={{ padding: "7px 10px" }}>{Math.round(ex.bugsOpen * 0.3)}</td>
                  <td style={{ padding: "7px 10px", color: "var(--ok)" }}>0</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: RESOURCES ─────────────────────────────────────────────────────── */}
      {tab === "resources" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Resource health KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[
              { label: "Bench Uptime",    val: `${env.benchUptimePct}%`, color: env.benchUptimePct < 50 ? "var(--bad)" : env.benchUptimePct < 80 ? "var(--warn)" : "var(--ok)", sub: "avg across benches" },
              { label: "Worker Uptime",   val: `${env.workerUptimePct}%`, color: env.workerUptimePct < 80 ? "var(--bad)" : "var(--ok)", sub: `${env.workerCount} PC workers` },
              { label: "Disk Critical",   val: `${env.diskCriticalCount}`, color: env.diskCriticalCount > 0 ? "var(--bad)" : "var(--ok)", sub: "benches >85% disk" },
              { label: "Coredumps",       val: `${env.coredumpCount}`,    color: env.coredumpCount > 5 ? "var(--bad)" : env.coredumpCount > 0 ? "var(--warn)" : "var(--ok)", sub: "this reporting cycle" },
            ].map(k => (
              <div key={k.label} className="to-kpi">
                <div className="lab">{k.label}</div>
                <div className="val" style={{ color: k.color }}>{k.val}</div>
                <div className="to-delta flat">{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Bench grid */}
          <div className="to-panel" style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Test Bench Status</span>
              <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--ink-3)" }}>
                <span><span className="to-dot ok" />Working ({env.benchWorking})</span>
                <span><span className="to-dot warn" />Focus needed ({env.benchFocusNeeded})</span>
                <span><span className="to-dot bad" />Not working ({env.benchNotWorking})</span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "60px 90px 1fr 1fr 1fr 1fr 52px", gap: 6, padding: "4px 0 6px", borderBottom: "2px solid var(--line-2)", marginBottom: 4 }}>
              {["Bench ID","Status","Uptime","CPU","RAM","Disk","Cores"].map(h => (
                <span key={h} style={{ fontSize: 10, fontWeight: 600, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: ".05em" }}>{h}</span>
              ))}
            </div>
            {env.benches.map(b => <BenchRow key={b.id} b={b} />)}
          </div>

          {/* Team allocation */}
          <div className="to-panel" style={{ padding: "16px 18px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Team Allocation</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Domain Team</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{c.team.split("(")[0].trim()}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Assigned FTE</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{c.teamSize} engineers</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Campaign Owner</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{c.ownerName}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: INTEGRATIONS ──────────────────────────────────────────────────── */}
      {tab === "integrations" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Jira */}
          <div className="to-panel" style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--brand-dim)", display: "grid", placeItems: "center" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--brand)"><path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215l2.13-.001v2.069c0 2.87 2.361 5.23 5.232 5.203h.007v-7.93a5.147 5.147 0 0 0-.001-.068 5.218 5.218 0 0 0-1.029-3.188z"/><path d="M17.016 5.86H5.445a5.218 5.218 0 0 0 5.232 5.215l2.128-.001v2.071c0 2.87 2.36 5.23 5.232 5.203h.007V11.07a5.218 5.218 0 0 0-1.028-3.189 5.218 5.218 0 0 0-4.204-2.021z"/><path d="M22.461.206H10.89a5.218 5.218 0 0 0 5.232 5.215l2.129-.001v2.07c0 2.87 2.36 5.231 5.232 5.203h.007V5.42a5.218 5.218 0 0 0-1.029-3.191A5.218 5.218 0 0 0 22.461.206z"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Jira</div>
                <div style={{ fontSize: 11, color: "var(--ok)" }}>● Connected</div>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <span className="to-ibadge"><span className="sd" style={{ background: "var(--ok)" }} />Project: {integ.jiraProject}</span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12 }}>
              <div style={{ padding: "8px 10px", background: "var(--panel-2)", borderRadius: 6 }}>
                <div style={{ color: "var(--ink-4)", fontSize: 10, marginBottom: 2 }}>Open Issues</div>
                <div style={{ fontWeight: 700, color: ex.bugsOpen > 0 ? "var(--bad)" : "var(--ok)" }}>{ex.bugsOpen} total</div>
                <div style={{ fontSize: 10, color: "var(--ink-3)" }}>{ex.bugsBySeverity.blocker} Blockers · {ex.bugsBySeverity.critical} Critical</div>
              </div>
              <div style={{ padding: "8px 10px", background: "var(--panel-2)", borderRadius: 6 }}>
                <div style={{ color: "var(--ink-4)", fontSize: 10, marginBottom: 2 }}>Sprint</div>
                <div style={{ fontWeight: 700 }}>{integ.jiraSprint}</div>
                <div style={{ fontSize: 10, color: "var(--ink-3)" }}>Ends {integ.jiraSprintEnd}</div>
              </div>
            </div>
            <button className="to-btn ghost sm" style={{ marginTop: 12, width: "100%", justifyContent: "center" }} onClick={() => addToast("Jira", "Opening Jira project…", "info")}>
              Open in Jira →
            </button>
          </div>

          {/* Grafana */}
          <div className="to-panel" style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ff8c00" + "28", display: "grid", placeItems: "center" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff8c00" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Grafana</div>
                <div style={{ fontSize: 11, color: "var(--ok)" }}>● Connected</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12 }}>
              <div style={{ padding: "8px 10px", background: "var(--panel-2)", borderRadius: 6 }}>
                <div style={{ color: "var(--ink-4)", fontSize: 10, marginBottom: 2 }}>Bench Uptime (avg)</div>
                <div style={{ fontWeight: 700, color: env.benchUptimePct < 50 ? "var(--bad)" : "var(--ok)" }}>{env.benchUptimePct}%</div>
                <div style={{ fontSize: 10, color: "var(--ink-3)" }}>{env.benchNotWorking} benches offline</div>
              </div>
              <div style={{ padding: "8px 10px", background: "var(--panel-2)", borderRadius: 6 }}>
                <div style={{ color: "var(--ink-4)", fontSize: 10, marginBottom: 2 }}>Worker Uptime</div>
                <div style={{ fontWeight: 700, color: env.workerUptimePct < 80 ? "var(--bad)" : "var(--ok)" }}>{env.workerUptimePct}%</div>
                <div style={{ fontSize: 10, color: "var(--ink-3)" }}>Last sync: 5m ago</div>
              </div>
            </div>
            <button className="to-btn ghost sm" style={{ marginTop: 12, width: "100%", justifyContent: "center" }} onClick={() => addToast("Grafana", "Opening dashboard…", "info")}>
              Open Dashboard →
            </button>
          </div>

          {/* CI Pipeline */}
          <div className="to-panel" style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--panel-3)", display: "grid", placeItems: "center" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink-2)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>CI Pipeline</div>
                <div style={{ fontSize: 11, color: integ.lastBuildStatus === "passed" ? "var(--ok)" : integ.lastBuildStatus === "running" ? "var(--warn)" : "var(--bad)" }}>
                  ● {integ.lastBuildStatus === "running" ? "Running" : integ.lastBuildStatus === "passed" ? "Connected" : "Connected"}
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12 }}>
              <div style={{ padding: "8px 10px", background: "var(--panel-2)", borderRadius: 6 }}>
                <div style={{ color: "var(--ink-4)", fontSize: 10, marginBottom: 2 }}>Last Build</div>
                <div style={{ fontWeight: 700, color: integ.lastBuildStatus === "passed" ? "var(--ok)" : "var(--bad)" }}>
                  #{integ.lastBuildNum} {integ.lastBuildStatus === "passed" ? "✓ PASSED" : integ.lastBuildStatus === "running" ? "⟳ RUNNING" : "✗ FAILED"}
                </div>
                <div style={{ fontSize: 10, color: "var(--ink-3)" }}>{integ.lastBuildAge}</div>
              </div>
              <div style={{ padding: "8px 10px", background: "var(--panel-2)", borderRadius: 6 }}>
                <div style={{ color: "var(--ink-4)", fontSize: 10, marginBottom: 2 }}>Success Rate (7d)</div>
                <div style={{ fontWeight: 700, color: (integ.buildSuccessRate ?? 0) >= 80 ? "var(--ok)" : "var(--bad)" }}>{integ.buildSuccessRate}%</div>
              </div>
            </div>
            <button className="to-btn ghost sm" style={{ marginTop: 12, width: "100%", justifyContent: "center" }} onClick={() => addToast("Pipeline", "Opening CI pipeline…", "info")}>
              View Pipeline →
            </button>
          </div>

          {/* Test Management */}
          <div className="to-panel" style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--ok-dim, rgba(26,150,72,.12))", display: "grid", placeItems: "center" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ok)" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Test Management</div>
                <div style={{ fontSize: 11, color: "var(--ok)" }}>● Connected</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12 }}>
              <div style={{ padding: "8px 10px", background: "var(--panel-2)", borderRadius: 6 }}>
                <div style={{ color: "var(--ink-4)", fontSize: 10, marginBottom: 2 }}>Test Plan</div>
                <div style={{ fontWeight: 700 }}>{integ.testPlanId}</div>
                <div style={{ fontSize: 10, color: "var(--ink-3)" }}>{ex.totalTests.toLocaleString()} test cases</div>
              </div>
              <div style={{ padding: "8px 10px", background: "var(--panel-2)", borderRadius: 6 }}>
                <div style={{ color: "var(--ink-4)", fontSize: 10, marginBottom: 2 }}>Last Sync</div>
                <div style={{ fontWeight: 700 }}>1h ago</div>
                <div style={{ fontSize: 10, color: "var(--ink-3)" }}>{ex.executed.toLocaleString()} runs synced</div>
              </div>
            </div>
            <button className="to-btn ghost sm" style={{ marginTop: 12, width: "100%", justifyContent: "center" }} onClick={() => addToast("Test plan", "Opening test plan…", "info")}>
              View Test Plan →
            </button>
          </div>
        </div>
      )}

      {/* ── TAB: SIMULATE ──────────────────────────────────────────────────────── */}
      {tab === "simulate" && (
        <div>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 16 }}>
            Adjust campaign variables to forecast outcomes. Results are based on current execution velocity and resource availability.
          </div>
          <CampaignSimulator />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CAMPAIGN LIST
// ─────────────────────────────────────────────────────────────────────────────
type SortKey = "health" | "passRate" | "endDate" | "bugs" | "domain";

export function Campaigns({ addToast }: Props) {
  const { role, can } = useRole();
  const mayEdit = can("campaign.edit");

  const [detail, setDetail] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "planned" | "completed" | "blocked" | "at-risk">("all");
  const [sort, setSort]     = useState<SortKey>("health");
  const [asc, setAsc]       = useState(false);

  const kpis = getPortfolioKPIs();

  const filtered = useMemo(() => {
    let list = [...RICH_CAMPAIGNS];
    if (filter === "active")    list = list.filter(c => c.status === "active");
    if (filter === "planned")   list = list.filter(c => c.status === "planned");
    if (filter === "completed") list = list.filter(c => c.status === "completed" || c.status === "report");
    if (filter === "blocked")   list = list.filter(c => c.status === "blocked");
    if (filter === "at-risk")   list = list.filter(c => c.ai.riskLevel === "medium" || c.ai.riskLevel === "high" || c.ai.riskLevel === "critical");
    list.sort((a, b) => {
      let v = 0;
      if (sort === "health")    v = a.ai.healthScore - b.ai.healthScore;
      if (sort === "passRate")  v = a.execution.passRate - b.execution.passRate;
      if (sort === "endDate")   v = a.endDate.localeCompare(b.endDate);
      if (sort === "bugs")      v = a.execution.bugsOpen - b.execution.bugsOpen;
      if (sort === "domain")    v = a.domainLabel.localeCompare(b.domainLabel);
      return asc ? v : -v;
    });
    return list;
  }, [filter, sort, asc]);

  const toggleSort = (key: SortKey) => {
    if (sort === key) setAsc(p => !p);
    else { setSort(key); setAsc(false); }
  };

  // ── Role-adapted portfolio KPIs ──
  const portfolioKPIs = role === "engineer"
    ? [
        { label: "My Campaigns",   val: String(kpis.active),        color: "var(--ink)",  sub: "active" },
        { label: "Avg Pass Rate",  val: `${kpis.avgPassRate}%`,     color: kpis.avgPassRate >= 80 ? "var(--ok)" : "var(--warn)", sub: "across active campaigns" },
        { label: "Total Open Bugs",val: String(kpis.totalBugs),     color: kpis.totalBugs > 20 ? "var(--bad)" : "var(--warn)", sub: "all domains" },
        { label: "Automation Rate",val: `${kpis.avgAutomationRate}%`, color: "var(--ink-2)", sub: "avg across campaigns" },
      ]
    : role === "hw-engineer"
    ? [
        { label: "Active Campaigns",  val: String(kpis.active),    color: "var(--ink)",   sub: "running now" },
        { label: "Blocked",           val: String(kpis.blocked),   color: kpis.blocked > 0 ? "var(--bad)" : "var(--ok)", sub: "env issues" },
        { label: "At Risk",           val: String(kpis.atRisk),    color: kpis.atRisk > 0 ? "var(--warn)" : "var(--ok)", sub: "needs attention" },
        { label: "Total Open Bugs",   val: String(kpis.totalBugs), color: kpis.totalBugs > 20 ? "var(--bad)" : "var(--warn)", sub: "across all campaigns" },
      ]
    : [
        { label: "Total Campaigns",  val: String(kpis.total),              color: "var(--ink)",   sub: `${kpis.active} active` },
        { label: "On Track",         val: String(kpis.onTrack),             color: "var(--ok)",    sub: "within forecast" },
        { label: "At Risk",          val: String(kpis.atRisk + kpis.blocked), color: (kpis.atRisk + kpis.blocked) > 0 ? "var(--bad)" : "var(--ok)", sub: `${kpis.blocked} blocked` },
        { label: "Automation Rate",  val: `${kpis.avgAutomationRate}%`,    color: kpis.avgAutomationRate >= 70 ? "var(--ok)" : "var(--warn)", sub: "avg across active" },
      ];

  if (detail) {
    return <CampaignDetail id={detail} onBack={() => setDetail(null)} addToast={addToast} />;
  }

  const SortBtn = ({ k, children }: { k: SortKey; children: React.ReactNode }) => (
    <button onClick={() => toggleSort(k)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, color: sort === k ? "var(--brand)" : "var(--ink-4)", display: "flex", alignItems: "center", gap: 3, padding: "0 4px", textTransform: "uppercase", letterSpacing: ".05em" }}>
      {children}{sort === k && <span style={{ fontSize: 9 }}>{asc ? "↑" : "↓"}</span>}
    </button>
  );

  return (
    <div className="to-screen">
      {/* Page header */}
      <div className="to-page-head">
        <div>
          <div className="to-kicker">Campaign Management</div>
          <h1>Test Campaigns</h1>
          <div className="lede" style={{ color: "var(--ink-2)", fontSize: 13, marginTop: 5 }}>
            Integrated view · Jira · Grafana · CI Pipeline · Test Management
          </div>
        </div>
        <div className="to-head-actions">
          <div className="to-row" style={{ gap: 6, marginRight: 6 }}>
            {[["Jira","ok"],["Grafana","ok"],["CI Pipeline","ok"]].map(([s, c]) => (
              <span key={s} className="to-ibadge"><span className="sd" style={{ background: `var(--${c})` }} />{s}</span>
            ))}
          </div>
          {mayEdit && (
            <button className="to-btn primary sm" onClick={() => addToast("New campaign", "Opening campaign builder…", "info")}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 5v14M5 12h14"/></svg>
              New Campaign
            </button>
          )}
        </div>
      </div>

      {/* Portfolio KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {portfolioKPIs.map(k => (
          <div key={k.label} className="to-kpi">
            <div className="lab">{k.label}</div>
            <div className="val" style={{ color: k.color }}>{k.val}</div>
            <div className="to-delta flat">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 11, color: "var(--ink-4)", marginRight: 4 }}>Filter:</span>
        {(["all","active","at-risk","blocked","completed"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid", fontSize: 11, fontWeight: 600, cursor: "pointer",
              borderColor: filter === f ? "var(--brand)" : "var(--line)",
              background: filter === f ? "var(--brand-dim)" : "transparent",
              color: filter === f ? "var(--brand)" : "var(--ink-3)" }}>
            {f === "all" ? `All (${kpis.total})` : f === "active" ? `Active (${kpis.active})` : f === "at-risk" ? `At Risk (${kpis.atRisk + kpis.blocked})` : f === "blocked" ? `Blocked (${kpis.blocked})` : "Completed"}
          </button>
        ))}
      </div>

      {/* Campaign table */}
      <div className="to-panel" style={{ overflow: "hidden" }}>
        {/* Table header */}
        <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 110px 90px 90px 90px 80px 80px", gap: 8, padding: "10px 16px", borderBottom: "2px solid var(--line-2)", alignItems: "center" }}>
          <div />
          <SortBtn k="domain">Campaign / Domain</SortBtn>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: ".05em" }}>Progress</div>
          <SortBtn k="passRate">Pass Rate</SortBtn>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: ".05em" }}>Automation</div>
          <SortBtn k="bugs">Open Bugs</SortBtn>
          <SortBtn k="endDate">Deadline</SortBtn>
          <SortBtn k="health">Health</SortBtn>
        </div>

        {filtered.map((c, i) => {
          const late = c.ai.forecastDeltaDays > 0;
          return (
            <div key={c.id}
              onClick={() => setDetail(c.id)}
              style={{ display: "grid", gridTemplateColumns: "28px 1fr 110px 90px 90px 80px 80px 80px", gap: 8, padding: "12px 16px", alignItems: "center", cursor: "pointer", borderBottom: i < filtered.length - 1 ? "1px solid var(--line)" : "none", transition: "background .12s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--panel-2)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>

              {/* Status dot */}
              <div style={{ display: "flex", justifyContent: "center" }}>
                <span className={`to-dot ${STATUS_DOT[c.status]}`} style={{ width: 8, height: 8 }} />
              </div>

              {/* Name + domain */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-4)" }}>{c.id}</span>
                  {c.ai.riskLevel !== "none" && <RiskBadge level={c.ai.riskLevel} />}
                </div>
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)", marginTop: 1 }}>{c.domainLabel}</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{c.title.replace(c.domainLabel + " — ", "")}</div>
              </div>

              {/* Progress bar */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 3 }}>{c.prog}%</div>
                <div style={{ height: 4, background: "var(--panel-3)", borderRadius: 2 }}>
                  <div style={{ height: "100%", width: `${c.prog}%`, background: c.prog >= 80 ? "var(--ok)" : "var(--brand)", borderRadius: 2 }} />
                </div>
              </div>

              {/* Pass rate + sparkline */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: c.execution.passRate >= 80 ? "var(--ok)" : c.execution.passRate >= 60 ? "var(--warn)" : "var(--bad)" }}>
                  {c.execution.executed > 0 ? `${c.execution.passRate.toFixed(0)}%` : "—"}
                </span>
                <Spark data={c.execution.passRateTrend} color={c.execution.passRate >= 70 ? "var(--ok)" : "var(--bad)"} />
              </div>

              {/* Automation */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <MiniDonut pct={c.execution.automationRate} color={c.execution.automationRate >= 70 ? "var(--ok)" : "var(--warn)"} />
              </div>

              {/* Open bugs */}
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: c.execution.bugsBySeverity.blocker > 0 ? "var(--bad)" : c.execution.bugsOpen > 0 ? "var(--warn)" : "var(--ok)" }}>
                  {c.execution.bugsOpen}
                </span>
                {c.execution.bugsBySeverity.blocker > 0 && (
                  <span style={{ fontSize: 10, color: "var(--bad)", marginLeft: 4 }}>{c.execution.bugsBySeverity.blocker}B</span>
                )}
              </div>

              {/* Deadline */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: late ? "var(--bad)" : "var(--ink)" }}>
                  {c.endDate.slice(5).replace("-", "/")}
                </div>
                {late && <div style={{ fontSize: 9, color: "var(--bad)" }}>+{c.ai.forecastDeltaDays}d late</div>}
              </div>

              {/* Health score */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--panel-2)", border: `2px solid ${c.ai.healthColor}`, display: "grid", placeItems: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: c.ai.healthColor }}>{c.ai.healthScore}</span>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ padding: "48px 0", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
            No campaigns match this filter.
          </div>
        )}
      </div>
    </div>
  );
}
