import { useState, useEffect } from "react";
import { DATA, NL_QUERIES, DUT, TEST_CENTERS, BENCHES_INITIAL } from "../data";
import { gaugeSVG, areaForecastSVG } from "../utils";

interface AIAnswer { q: string; summary: string; rows?: DUT[] }

// ─── Campaign Simulator ───────────────────────────────────────────────────────

function benchesForCenter(centerId: string) {
  const ctr = TEST_CENTERS.find(c => c.id === centerId);
  if (!ctr) return [];
  return BENCHES_INITIAL.filter(b => ctr.benchIds.includes(b.id));
}

// How many DUTs one bench handles in parallel per campaign type
const DUT_PER_BENCH: Record<string, number> = {
  "Smoke":       6,
  "Regression":  3,
  "Endurance":   2,
  "Integration": 2,
  "System":      3,
};

const BENCH_COST_PER_WEEK  = 3_200;  // €/bench/week
const TEAM_COST_PER_WEEK   = 2_400;  // €/FTE/week
const DUT_DEPR_PER_WEEK    = 56;     // €/DUT/week depreciation
const OVERHEAD_RATE        = 0.12;

const PRIORITY_START_DAYS: Record<string, number> = { high: 1, medium: 5, low: 12 };

interface SimParams {
  centerId: string;
  campaignType: string;
  dutCount: number;
  durationWeeks: number;
  teamSize: number;
  priority: "high" | "medium" | "low";
  selectedBenchIds: string[];
}

interface SimResult {
  benchesNeeded: number;
  availableBenches: number;
  actualWeeks: number;
  benchHoursTotal: number;
  benchCost: number;
  teamCost: number;
  dutCost: number;
  overhead: number;
  totalCost: number;
  recommendedTeam: number;
  centerLoadPct: number;
  phases: { name: string; weeks: number; color: string }[];
  risks: { level: "low"|"med"|"high"; text: string }[];
  recommendations: string[];
  startDate: string;
  endDate: string;
  feasible: boolean;
  totalBenches: number;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}
function fmtDate(d: Date): string {
  return d.toLocaleDateString("en", { month:"short", day:"numeric", year:"numeric" });
}

function runSimulation(p: SimParams): SimResult {
  const allCenter = benchesForCenter(p.centerId);
  const benches = p.selectedBenchIds.length > 0
    ? BENCHES_INITIAL.filter(b => p.selectedBenchIds.includes(b.id))
    : allCenter;
  const available = benches.filter(b => b.status === "Up" || b.status === "Degraded");
  const availCt = Math.max(1, available.length);
  // Estimate load from status distribution (no raw % in data model)
  const statusLoad: Record<string, number> = { Up: 62, Degraded: 85, Down: 0, Maintenance: 0 };
  const avgLoad = benches.length > 0
    ? Math.round(benches.reduce((s, b) => s + (statusLoad[b.status] ?? 50), 0) / benches.length)
    : 50;

  const dpp = DUT_PER_BENCH[p.campaignType] ?? 3;
  const benchesNeeded = Math.ceil(p.dutCount / dpp);
  const feasible = availCt >= benchesNeeded;

  // If not enough benches, timeline extends proportionally
  const adjustmentFactor = feasible ? 1 : benchesNeeded / availCt;
  const actualWeeks = Math.ceil(p.durationWeeks * adjustmentFactor * 10) / 10;

  const benchHoursTotal = benchesNeeded * actualWeeks * 7 * 16; // 16h/day operational
  const benchCost  = Math.round(benchesNeeded * actualWeeks * BENCH_COST_PER_WEEK);
  const teamCost   = Math.round(p.teamSize * actualWeeks * TEAM_COST_PER_WEEK);
  const dutCost    = Math.round(p.dutCount * actualWeeks * DUT_DEPR_PER_WEEK);
  const subtotal   = benchCost + teamCost + dutCost;
  const overhead   = Math.round(subtotal * OVERHEAD_RATE);
  const totalCost  = subtotal + overhead;

  const recTeam = 1 + Math.ceil(benchesNeeded * 0.8) + Math.ceil(p.dutCount / 8);

  // Phases (proportion of actual weeks, rounded to 1dp)
  const phases = [
    { name:"Planning & kickoff",  weeks: Math.round(actualWeeks * 0.10 * 10)/10, color:"var(--ink-3)"  },
    { name:"Env setup & smoke",   weeks: Math.round(actualWeeks * 0.15 * 10)/10, color:"var(--warn)"   },
    { name:"Test execution",      weeks: Math.round(actualWeeks * 0.55 * 10)/10, color:"var(--brand)"  },
    { name:"Analysis & report",   weeks: Math.round(actualWeeks * 0.20 * 10)/10, color:"var(--ok)"     },
  ];

  // Risks
  const risks: SimResult["risks"] = [];
  if (avgLoad > 72) risks.push({ level:"high", text:`${TEST_CENTERS.find(c=>c.id===p.centerId)?.city} center is at ${avgLoad}% avg load — bench contention likely` });
  else if (avgLoad > 55) risks.push({ level:"med", text:`Center load at ${avgLoad}% — monitor for capacity spikes during execution` });
  else risks.push({ level:"low", text:`Center has spare capacity (avg ${avgLoad}% load)` });

  if (!feasible) risks.push({ level:"high", text:`Need ${benchesNeeded} benches but only ${availCt} available — timeline extends to ${actualWeeks}w` });
  else if (availCt < benchesNeeded * 1.5) risks.push({ level:"med", text:`Limited bench redundancy — any Down event could delay the campaign` });
  else risks.push({ level:"low", text:`Bench availability adequate (${availCt} Up vs ${benchesNeeded} needed)` });

  if (p.teamSize < recTeam) risks.push({ level:"high", text:`Team of ${p.teamSize} is below recommended ${recTeam} — quality or schedule at risk` });
  else if (p.teamSize < recTeam + 1) risks.push({ level:"med", text:`Team size is at minimum; no buffer for absence or parallel tasks` });
  else risks.push({ level:"low", text:`Team size adequate for campaign scope` });

  // Recommendations
  const recs: string[] = [];
  if (!feasible) recs.push(`Request ${benchesNeeded - availCt} additional bench${benchesNeeded - availCt > 1 ? "es" : ""} or reduce DUT count to ${availCt * dpp}`);
  if (p.teamSize < recTeam) recs.push(`Add ${recTeam - p.teamSize} engineer${recTeam - p.teamSize > 1 ? "s" : ""} — recommended headcount is ${recTeam} for this scope`);
  if (avgLoad > 70) recs.push(`Consider shifting campaign to ${p.centerId === "TC-STR" ? "Warsaw" : "Stuttgart"} which has lower bench load`);
  if (p.campaignType === "Endurance" && actualWeeks > 4) recs.push("Endurance campaigns >4w benefit from automated nightly alerting — enable on bench monitors");
  if (recs.length < 3) recs.push(`Run a smoke test in week 1 before committing the full ${p.dutCount}-DUT suite`);
  if (recs.length < 3) recs.push("Pre-book benches 48h before start to avoid last-minute conflicts with parallel campaigns");

  const today = new Date("2026-06-26");
  const start = addDays(today, PRIORITY_START_DAYS[p.priority]);
  const end   = addDays(start, Math.round(actualWeeks * 7));

  return {
    benchesNeeded, availableBenches: availCt, actualWeeks,
    benchHoursTotal: Math.round(benchHoursTotal),
    benchCost, teamCost, dutCost, overhead, totalCost,
    recommendedTeam: recTeam, centerLoadPct: avgLoad,
    phases, risks, recommendations: recs,
    startDate: fmtDate(start), endDate: fmtDate(end),
    feasible,
    totalBenches: benches.length,
  };
}

const RISK_COLORS = { low:"var(--ok)", med:"var(--warn)", high:"var(--bad)" };
const RISK_LABELS = { low:"Low", med:"Medium", high:"High" };

const BENCH_STATUS_COLOR: Record<string, string> = {
  Up: "var(--ok)", Degraded: "var(--warn)", Down: "var(--bad)", Maintenance: "var(--ink-3)",
};

export function CampaignSimulator() {
  const defaultCenterId = "TC-MUC";
  const defaultBenches = benchesForCenter(defaultCenterId).filter(b => b.status === "Up").map(b => b.id);

  const [params, setParams] = useState<SimParams>({
    centerId: defaultCenterId,
    campaignType: "Regression",
    dutCount: 6,
    durationWeeks: 3,
    teamSize: 3,
    priority: "medium",
    selectedBenchIds: defaultBenches,
  });
  const [result, setResult] = useState<SimResult | null>(null);
  const [running, setRunning] = useState(false);

  // When center changes, auto-select all "Up" benches of the new center
  useEffect(() => {
    const upIds = benchesForCenter(params.centerId)
      .filter(b => b.status === "Up")
      .map(b => b.id);
    setParams(p => ({ ...p, selectedBenchIds: upIds }));
    setResult(null);
  }, [params.centerId]);

  const centerBenches = benchesForCenter(params.centerId);

  function toggleBench(id: string) {
    setParams(p => ({
      ...p,
      selectedBenchIds: p.selectedBenchIds.includes(id)
        ? p.selectedBenchIds.filter(x => x !== id)
        : [...p.selectedBenchIds, id],
    }));
  }

  function handleRun() {
    setRunning(true);
    setTimeout(() => { setResult(runSimulation(params)); setRunning(false); }, 620);
  }

  const fmtEur = (n: number) => `€${n.toLocaleString("en")}`;

  const totalPhaseDays = result ? result.actualWeeks * 7 : 1;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* ─── Parameter Form ─── */}
      <div className="to-panel">
        <div className="to-panel-h">
          <span className="to-eyebrow">Simulation parameters</span>
          <span className="to-chip brand" style={{ fontSize:10.5 }}>
            <span className="to-dot brand" />AI Engine v2.1
          </span>
        </div>
        <div className="to-panel-b">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginBottom:20 }}>

            {/* Center */}
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:6 }}>
                Test Center
              </label>
              <select
                value={params.centerId}
                onChange={e => setParams(p => ({ ...p, centerId: e.target.value }))}
                style={{ width:"100%", height:36, borderRadius:8, border:"1px solid var(--line-2)", background:"var(--panel-2)", color:"var(--ink)", fontSize:13, padding:"0 10px" }}
              >
                {TEST_CENTERS.map(c => <option key={c.id} value={c.id}>{c.city} — {c.name}</option>)}
              </select>
            </div>

            {/* Campaign Type */}
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:6 }}>
                Campaign Type
              </label>
              <select
                value={params.campaignType}
                onChange={e => setParams(p => ({ ...p, campaignType: e.target.value }))}
                style={{ width:"100%", height:36, borderRadius:8, border:"1px solid var(--line-2)", background:"var(--panel-2)", color:"var(--ink)", fontSize:13, padding:"0 10px" }}
              >
                {Object.keys(DUT_PER_BENCH).map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:6 }}>
                Priority
              </label>
              <div style={{ display:"flex", gap:6 }}>
                {(["high","medium","low"] as const).map(p => (
                  <button key={p} onClick={() => setParams(pr => ({ ...pr, priority: p }))}
                    style={{
                      flex:1, height:36, borderRadius:8, cursor:"pointer",
                      border:`1.5px solid ${params.priority === p ? (p==="high"?"var(--bad)":p==="medium"?"var(--warn)":"var(--ok)") : "var(--line-2)"}`,
                      background: params.priority === p ? (p==="high"?"rgba(220,53,69,.1)":p==="medium"?"rgba(184,134,11,.1)":"rgba(26,150,72,.1)") : "var(--panel-2)",
                      color: params.priority === p ? (p==="high"?"var(--bad)":p==="medium"?"var(--warn)":"var(--ok)") : "var(--ink-3)",
                      fontWeight: params.priority === p ? 600 : 400, fontSize:12, textTransform:"capitalize",
                    }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bench picker */}
          <div style={{ marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
              <label style={{ fontSize:11, fontWeight:600, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:".06em" }}>
                Test Benches — select for simulation
              </label>
              <div style={{ display:"flex", gap:6 }}>
                <button style={{ fontSize:11, color:"var(--brand)", background:"none", border:"none", cursor:"pointer", padding:0 }}
                  onClick={() => setParams(p => ({ ...p, selectedBenchIds: centerBenches.filter(b => b.status === "Up").map(b => b.id) }))}>
                  Select Up only
                </button>
                <span style={{ color:"var(--line-2)" }}>·</span>
                <button style={{ fontSize:11, color:"var(--brand)", background:"none", border:"none", cursor:"pointer", padding:0 }}
                  onClick={() => setParams(p => ({ ...p, selectedBenchIds: centerBenches.map(b => b.id) }))}>
                  All
                </button>
                <span style={{ color:"var(--line-2)" }}>·</span>
                <button style={{ fontSize:11, color:"var(--ink-4)", background:"none", border:"none", cursor:"pointer", padding:0 }}
                  onClick={() => setParams(p => ({ ...p, selectedBenchIds: [] }))}>
                  Clear
                </button>
              </div>
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
              {centerBenches.map(b => {
                const sel = params.selectedBenchIds.includes(b.id);
                const sc = BENCH_STATUS_COLOR[b.status] ?? "var(--ink-4)";
                const avail = b.status === "Up" || b.status === "Degraded";
                return (
                  <label key={b.id} title={`${b.name} · ${b.status}`} style={{
                    display:"flex", alignItems:"center", gap:6,
                    padding:"5px 10px", borderRadius:7, cursor:"pointer",
                    border:`1.5px solid ${sel ? sc : "var(--line-2)"}`,
                    background: sel ? (sc + "18") : "var(--panel-2)",
                    opacity: avail ? 1 : 0.55,
                  }}>
                    <input type="checkbox" checked={sel} onChange={() => toggleBench(b.id)}
                      style={{ accentColor: sc, width:12, height:12, margin:0 }} />
                    <span style={{ width:7, height:7, borderRadius:"50%", background:sc, flexShrink:0 }} />
                    <span style={{ fontSize:11.5, fontFamily:"var(--mono)", fontWeight:600, color:"var(--ink-2)" }}>{b.id}</span>
                    <span style={{ fontSize:10.5, color:"var(--ink-4)", maxWidth:90, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{b.name}</span>
                  </label>
                );
              })}
            </div>
            {params.selectedBenchIds.length === 0 && (
              <div style={{ fontSize:12, color:"var(--warn)", marginTop:6 }}>⚠ No benches selected — simulation will use center defaults</div>
            )}
            <div style={{ fontSize:11, color:"var(--ink-4)", marginTop:6 }}>
              {params.selectedBenchIds.length} of {centerBenches.length} benches selected ·{" "}
              {centerBenches.filter(b => params.selectedBenchIds.includes(b.id) && (b.status === "Up" || b.status === "Degraded")).length} available for scheduling
            </div>
          </div>

          {/* Sliders row */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:20 }}>
            {([
              { key:"dutCount",       label:"DUT count",       min:1,  max:20, unit:"DUTs"  },
              { key:"durationWeeks",  label:"Target duration", min:1,  max:12, unit:"weeks" },
              { key:"teamSize",       label:"Team size",       min:1,  max:12, unit:"FTEs"  },
            ] as { key: keyof SimParams; label: string; min: number; max: number; unit: string }[]).map(({ key, label, min, max, unit }) => (
              <div key={key}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <label style={{ fontSize:11, fontWeight:600, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:".06em" }}>{label}</label>
                  <span style={{ fontSize:13, fontWeight:700, color:"var(--brand)", fontFamily:"var(--mono)" }}>
                    {params[key]} {unit}
                  </span>
                </div>
                <input type="range" min={min} max={max} value={params[key] as number}
                  onChange={e => setParams(p => ({ ...p, [key]: Number(e.target.value) }))}
                  style={{ width:"100%", accentColor:"var(--brand)" }}
                />
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"var(--ink-4)", marginTop:2 }}>
                  <span>{min}</span><span>{max}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display:"flex", justifyContent:"flex-end", marginTop:20 }}>
            <button className="to-btn primary" onClick={handleRun} disabled={running}
              style={{ minWidth:160, opacity: running ? .7 : 1, gap:8 }}>
              {running ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation:"spin 1s linear infinite" }}><path d="M21 12a9 9 0 11-18 0"/></svg>
                  Simulating…
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  Run simulation
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Results ─── */}
      {result && !running && (
        <>
          {/* Feasibility banner */}
          {!result.feasible && (
            <div style={{ padding:"12px 16px", borderRadius:10, border:"1px solid var(--bad)", background:"rgba(220,53,69,.07)", display:"flex", alignItems:"center", gap:10 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--bad)" strokeWidth="2"><path d="M12 9v4M12 17h.01"/><circle cx="12" cy="12" r="9"/></svg>
              <div style={{ fontSize:13, color:"var(--bad)", fontWeight:550 }}>
                Capacity constraint — only {result.availableBenches} bench{result.availableBenches !== 1?"es":""} available, need {result.benchesNeeded}. Timeline extended to <strong>{result.actualWeeks}w</strong>.
              </div>
            </div>
          )}

          {/* KPI cards */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12 }}>
            {[
              { label:"Timeline", value: result.actualWeeks + "w", sub: result.startDate + " → " + result.endDate, color:"var(--brand)" },
              { label:"Total Cost", value: fmtEur(result.totalCost), sub: "incl. " + Math.round(OVERHEAD_RATE*100) + "% overhead", color:"var(--ink)" },
              { label:"Bench Hours", value: result.benchHoursTotal.toLocaleString(), sub: result.benchesNeeded + " bench" + (result.benchesNeeded!==1?"es":"") + " × " + Math.round(result.actualWeeks*7) + "d", color:"var(--ok)" },
              { label:"Rec. Team", value: result.recommendedTeam + " FTE", sub: "You set: " + params.teamSize + " FTE", color: params.teamSize < result.recommendedTeam ? "var(--bad)" : "var(--ok)" },
              { label:"Center Load", value: result.centerLoadPct + "%", sub: result.availableBenches + "/" + result.totalBenches + " benches avail.", color: result.centerLoadPct > 70 ? "var(--bad)" : result.centerLoadPct > 50 ? "var(--warn)" : "var(--ok)" },
            ].map(k => (
              <div key={k.label} className="to-kpi" style={{ padding:"14px 16px" }}>
                <div className="lab">{k.label}</div>
                <div className="val" style={{ color:k.color, fontSize:18 }}>{k.value}</div>
                <div style={{ fontSize:10.5, color:"var(--ink-4)", marginTop:3 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:14 }}>

            {/* Timeline phases + cost breakdown */}
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

              {/* Gantt-style phases */}
              <div className="to-panel">
                <div className="to-panel-h"><span className="to-eyebrow">Campaign timeline · {result.actualWeeks}w total</span></div>
                <div className="to-panel-b">
                  {/* Bar */}
                  <div style={{ height:28, borderRadius:8, overflow:"hidden", display:"flex", marginBottom:16 }}>
                    {result.phases.map(ph => (
                      <div key={ph.name}
                        style={{ flex: ph.weeks / result.actualWeeks, background:ph.color, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
                        <span style={{ fontSize:9.5, fontWeight:600, color:"#fff", whiteSpace:"nowrap", textOverflow:"ellipsis", overflow:"hidden", padding:"0 4px" }}>
                          {ph.weeks}w
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* Phase legend */}
                  <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                    {result.phases.map(ph => (
                      <div key={ph.name} style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ width:10, height:10, borderRadius:3, background:ph.color, flexShrink:0 }} />
                          <span style={{ fontSize:12.5, color:"var(--ink-2)" }}>{ph.name}</span>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ width:80, height:4, borderRadius:2, background:"var(--panel-3)", overflow:"hidden" }}>
                            <div style={{ width:`${(ph.weeks/result.actualWeeks)*100}%`, height:"100%", background:ph.color, borderRadius:2 }} />
                          </div>
                          <span style={{ fontSize:11.5, fontFamily:"var(--mono)", color:"var(--ink-3)", minWidth:28, textAlign:"right" }}>{ph.weeks}w</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cost breakdown */}
              <div className="to-panel">
                <div className="to-panel-h"><span className="to-eyebrow">Cost breakdown</span><span style={{ fontFamily:"var(--mono)", fontSize:12, color:"var(--brand)", fontWeight:600 }}>{fmtEur(result.totalCost)}</span></div>
                <div className="to-panel-b">
                  {[
                    { label:"Bench ops ("+result.benchesNeeded+" bench"+(result.benchesNeeded!==1?"es":"")+" × "+result.actualWeeks+"w)", value:result.benchCost, color:"var(--brand)" },
                    { label:"Team ("+params.teamSize+" FTE × "+result.actualWeeks+"w)", value:result.teamCost, color:"var(--ok)" },
                    { label:"DUT depreciation ("+params.dutCount+" DUTs)", value:result.dutCost, color:"var(--warn)" },
                    { label:"Overhead ("+Math.round(OVERHEAD_RATE*100)+"%)", value:result.overhead, color:"var(--ink-3)" },
                  ].map(row => {
                    const pct = Math.round((row.value / result.totalCost) * 100);
                    return (
                      <div key={row.label} style={{ marginBottom:10 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                          <span style={{ fontSize:12, color:"var(--ink-2)" }}>{row.label}</span>
                          <span style={{ fontSize:12, fontFamily:"var(--mono)", fontWeight:600, color:"var(--ink)" }}>{fmtEur(row.value)}</span>
                        </div>
                        <div style={{ height:5, borderRadius:3, background:"var(--panel-3)", overflow:"hidden" }}>
                          <div style={{ width:`${pct}%`, height:"100%", background:row.color, borderRadius:3 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Risks + recommendations */}
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div className="to-panel">
                <div className="to-panel-h"><span className="to-eyebrow">Risk assessment</span></div>
                <div className="to-panel-b" style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {result.risks.map((r, i) => (
                    <div key={i} style={{ display:"flex", gap:10, padding:"10px 12px", borderRadius:8, background:"var(--panel-2)", border:"1px solid var(--line-2)" }}>
                      <span style={{ width:8, height:8, borderRadius:"50%", background:RISK_COLORS[r.level], marginTop:3, flexShrink:0 }} />
                      <div>
                        <div style={{ fontSize:10.5, fontWeight:700, color:RISK_COLORS[r.level], textTransform:"uppercase", letterSpacing:".05em", marginBottom:2 }}>{RISK_LABELS[r.level]} risk</div>
                        <div style={{ fontSize:12.5, color:"var(--ink-2)", lineHeight:1.45 }}>{r.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="to-panel">
                <div className="to-panel-h"><span className="to-eyebrow">AI Recommendations</span></div>
                <div className="to-panel-b" style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {result.recommendations.map((rec, i) => (
                    <div key={i} style={{ display:"flex", gap:10, padding:"10px 12px", borderRadius:8, background:"var(--brand-dim)", border:"1px solid var(--brand)" }}>
                      <span style={{ fontSize:11, fontWeight:700, color:"var(--brand)", flexShrink:0, marginTop:1 }}>#{i+1}</span>
                      <div style={{ fontSize:12.5, color:"var(--ink)", lineHeight:1.45 }}>{rec}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resource summary */}
              <div className="to-panel">
                <div className="to-panel-h"><span className="to-eyebrow">Resource summary</span></div>
                <table className="to-tbl">
                  <thead><tr><th>Resource</th><th>Requested</th><th>Available</th><th></th></tr></thead>
                  <tbody>
                    <tr>
                      <td style={{ fontSize:12.5 }}>Test Benches</td>
                      <td style={{ fontFamily:"var(--mono)", fontSize:12 }}>{result.benchesNeeded}</td>
                      <td style={{ fontFamily:"var(--mono)", fontSize:12 }}>{result.availableBenches}</td>
                      <td><span style={{ fontSize:10.5, fontWeight:600, color: result.availableBenches >= result.benchesNeeded ? "var(--ok)" : "var(--bad)" }}>
                        {result.availableBenches >= result.benchesNeeded ? "✓ OK" : "✗ Short"}
                      </span></td>
                    </tr>
                    <tr>
                      <td style={{ fontSize:12.5 }}>Team FTEs</td>
                      <td style={{ fontFamily:"var(--mono)", fontSize:12 }}>{params.teamSize}</td>
                      <td style={{ fontFamily:"var(--mono)", fontSize:12 }}>{result.recommendedTeam} rec.</td>
                      <td><span style={{ fontSize:10.5, fontWeight:600, color: params.teamSize >= result.recommendedTeam ? "var(--ok)" : "var(--warn)" }}>
                        {params.teamSize >= result.recommendedTeam ? "✓ OK" : "⚠ Low"}
                      </span></td>
                    </tr>
                    <tr>
                      <td style={{ fontSize:12.5 }}>DUTs</td>
                      <td style={{ fontFamily:"var(--mono)", fontSize:12 }}>{params.dutCount}</td>
                      <td style={{ fontFamily:"var(--mono)", fontSize:12 }}>—</td>
                      <td><span style={{ fontSize:10.5, fontWeight:600, color:"var(--ok)" }}>✓ OK</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface Props {
  answer: AIAnswer | null;
  onQuery: (q: string) => void;
  onOpenDUT: (id: string) => void;
}

const SUGGESTIONS = [
  "Show DUTs with uptime < 90% this quarter",
  "Which campaigns are at risk this week",
  "Where should I cut cost",
  "Forecast utilization for next month",
];

const REC_ICONS: Record<string, string> = {
  invest: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 17l6-6 4 4 8-8"/><path d="M21 7v6h-6"/></svg>',
  cut: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 7l6 6 4-4 8 8"/><path d="M21 17v-6h-6"/></svg>',
  risk: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 9v4M12 17h.01"/><circle cx="12" cy="12" r="9"/></svg>',
};

export function AIInsights({ answer, onQuery, onOpenDUT }: Props) {
  return (
    <div className="to-screen">
      <div className="to-page-head">
        <div>
          <div className="to-kicker">Powered by AI</div>
          <h1>AI Insights</h1>
          <div className="lede" style={{color:"var(--ink-2)",fontSize:13,marginTop:5}}>KPI trend analysis · 30-day forecasting · failure prediction · natural-language queries</div>
        </div>
        <span className="to-chip brand"><span className="to-dot brand" />Model updated 06:00</span>
      </div>

      {answer ? (
        <div className="to-nl-answer">
          <div className="to-nl-q">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
            {answer.q}
          </div>
          <div className="to-nl-summary" dangerouslySetInnerHTML={{__html: answer.summary}} />
          {answer.rows && answer.rows.length > 0 && (
            <div className="to-panel" style={{marginTop:12}}>
              <table className="to-tbl">
                <thead><tr><th>ID</th><th>Equipment</th><th>Uptime</th><th>Status</th></tr></thead>
                <tbody>
                  {answer.rows.map(d => (
                    <tr key={d.id} className="clickable" onClick={() => onOpenDUT(d.id)}>
                      <td className="id">{d.id}</td>
                      <td>{d.name}</td>
                      <td className="mono" style={{color:"var(--bad)"}}>{d.uptime}%</td>
                      <td><span className={`to-chip ${d.status}`}><span className={`to-dot ${d.status}`} />{d.statusLabel}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="to-panel" style={{marginBottom:18,padding:"14px 16px"}}>
          <div className="to-eyebrow" style={{marginBottom:10}}>Ask in plain English</div>
          <div className="to-row to-wrap" style={{gap:8}}>
            {SUGGESTIONS.map(q => (
              <button key={q} className="to-fchip" onClick={() => onQuery(q)}>{q}</button>
            ))}
          </div>
        </div>
      )}

      <div className="to-grid to-g12" style={{marginBottom:16}}>
        <div className="to-s8">
          <div className="to-panel">
            <div className="to-panel-h">
              <span className="to-eyebrow">Utilization · 8 weeks actual + 4 weeks forecast</span>
              <div className="to-legend">
                <span><i style={{background:"var(--brand)"}} />actual</span>
                <span><i style={{background:"var(--accent)"}} />forecast</span>
              </div>
            </div>
            <div className="to-panel-b">
              <div dangerouslySetInnerHTML={{__html: areaForecastSVG(DATA.forecast.hist, DATA.forecast.fc)}} />
              <div style={{display:"flex",gap:28,marginTop:14,borderTop:"1px solid var(--line)",paddingTop:14}}>
                <div><div className="to-eyebrow">Now</div><div style={{fontFamily:"var(--disp)",fontSize:22,fontWeight:800}}>73%</div></div>
                <div><div className="to-eyebrow">Forecast (30d)</div><div style={{fontFamily:"var(--disp)",fontSize:22,fontWeight:800,color:"var(--accent)"}}>78%</div></div>
                <div><div className="to-eyebrow">Confidence</div><div style={{fontFamily:"var(--disp)",fontSize:22,fontWeight:800}}>±2pt</div></div>
                <div style={{marginLeft:"auto",alignSelf:"center",maxWidth:230,fontSize:12,color:"var(--ink-2)"}}>Forecast assumes current campaign load and no hardware changes.</div>
              </div>
            </div>
          </div>
        </div>
        <div className="to-s4">
          <div className="to-panel" style={{height:"100%"}}>
            <div className="to-panel-h"><h3>Proposed metric — FTE</h3><span className="to-chip mute">not in v0.1 deck</span></div>
            <div className="to-panel-b" style={{textAlign:"center"}}>
              <div style={{position:"relative",display:"inline-block"}}>
                <div dangerouslySetInnerHTML={{__html: gaugeSVG(DATA.fte.value)}} />
                <div style={{position:"absolute",left:0,right:0,top:50,textAlign:"center"}}>
                  <div style={{fontFamily:"var(--disp)",fontWeight:800,fontSize:30}}>{DATA.fte.value}<small style={{fontSize:15,color:"var(--ink-3)"}}>%</small></div>
                </div>
              </div>
              <div style={{fontSize:12,color:"var(--ink-2)",lineHeight:1.5,textAlign:"left",borderTop:"1px solid var(--line)",paddingTop:12,marginTop:6}}><b>Farm Throughput Effectiveness</b> = Availability × Utilization × Pass-rate — an OEE-class single number for "how much real throughput we extract from the hardware."</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{padding:"6px 2px 14px"}}><h3 style={{fontSize:16,fontFamily:"var(--disp)",margin:0}}>Recommendations</h3></div>
      <div className="to-grid" style={{gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:16}}>
        {DATA.recs.map(r => (
          <div key={r.kind} className={`to-rec ${r.kind}`}>
            <div className="ric" dangerouslySetInnerHTML={{__html: REC_ICONS[r.kind]}} />
            <div>
              <span className={`to-chip ${r.kind==="invest"?"ok":r.kind==="cut"?"warn":"bad"}`}>
                {r.kind==="invest"?"Invest":r.kind==="cut"?"Cut cost":"Failure prediction"}
              </span>
              <div className="rt" style={{marginTop:8}}>{r.title}</div>
              <div className="rd">{r.desc}</div>
              <div className="to-row" style={{gap:18,marginTop:4}}>
                {r.impact.map(([k,v]) => <div key={k} className="rimpact">{k} <b>{v}</b></div>)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="to-panel">
        <div className="to-panel-h"><span className="to-eyebrow">Anomaly detection</span><span className="to-chip bad">2 active</span></div>
        <div className="to-panel-b" style={{paddingTop:6,paddingBottom:6}}>
          <div className="to-alert"><span className="ad" style={{background:"var(--bad)"}} /><div><div className="ttl">TB-04 node temperature deviates 3.4σ from norm</div><div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--ink-3)",marginTop:2}}>vs 30-day baseline for this node class</div></div></div>
          <div className="to-alert"><span className="ad" style={{background:"var(--warn)"}} /><div><div className="ttl">ECU Boot Stress pass-rate dropped to 91.2%</div><div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--ink-3)",marginTop:2}}>historical norm 98.6% · failures clustered in boot step</div></div></div>
          <div className="to-alert" style={{borderBottom:0}}><span className="ad" style={{background:"var(--brand)"}} /><div><div className="ttl">Defect dedup — 14 reports → 3 root causes</div><div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--ink-3)",marginTop:2}}>saved ~5h triage this week</div></div></div>
        </div>
      </div>
    </div>
  );
}

export function runNLQuery(q: string, duts: DUT[]): AIAnswer {
  const key = q.toLowerCase().trim();
  const match = Object.entries(NL_QUERIES).find(([k]) => k === key || key.includes(k.split(" ")[0]));
  if (match) {
    const [, data] = match;
    return { q, summary: data.summary, rows: data.filterDuts ? duts.filter(d => d.uptime < 90) : undefined };
  }
  if (key.includes("uptime")) return runNLQuery("show DUTs with uptime < 90% this quarter", duts);
  if (key.includes("risk") || key.includes("campaign")) return runNLQuery("which campaigns are at risk this week", duts);
  if (key.includes("cost") || key.includes("cut")) return runNLQuery("where should i cut cost", duts);
  if (key.includes("forecast") || key.includes("utilization")) return runNLQuery("forecast utilization for next month", duts);
  return { q, summary: 'No exact match. Try: "Show DUTs with uptime &lt; 90% this quarter", "Which campaigns are at risk this week", "Where should I cut cost", or "Forecast utilization for next month".' };
}
