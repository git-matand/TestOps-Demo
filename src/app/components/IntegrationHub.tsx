import { useState, useMemo } from "react";
import {
  Integration, SyncEvent, IntegrationStatus, IntegrationType, SyncInterval,
  INTEGRATIONS_INITIAL, SYNC_EVENTS_INITIAL, FieldMapping,
} from "../data";

// ─── Icons ───────────────────────────────────────────────────────────────────
const INT_ICONS: Record<IntegrationType, string> = {
  jira:      `<svg viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="6" fill="#0052CC"/><path d="M16.8 6.4L9 14.2l4 4 7.8-7.8A2.8 2.8 0 0016.8 6.4z" fill="white" opacity=".4"/><path d="M15.2 25.6L23 17.8l-4-4-7.8 7.8a2.8 2.8 0 004 4z" fill="white"/></svg>`,
  grafana:   `<svg viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="6" fill="#F46800"/><circle cx="16" cy="16" r="8" stroke="white" strokeWidth="2"/><path d="M16 10v6l4 2" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>`,
  testRail:  `<svg viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="6" fill="#65C179"/><path d="M8 12h16M8 16h10M8 20h12" stroke="white" strokeWidth="2" strokeLinecap="round"/><circle cx="23" cy="20" r="3" fill="white"/></svg>`,
  jenkins:   `<svg viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="6" fill="#D33833"/><circle cx="16" cy="14" r="6" stroke="white" strokeWidth="2"/><path d="M12 20l-2 6h12l-2-6" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/></svg>`,
  gitlab:    `<svg viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="6" fill="#FC6D26"/><path d="M16 24l-9-6.5 2.5-8 2 5.5h9l2-5.5 2.5 8L16 24z" fill="white"/></svg>`,
  slack:     `<svg viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="6" fill="#4A154B"/><path d="M11 16a2 2 0 100-4 2 2 0 000 4zM11 20v2M16 11a2 2 0 100-4 2 2 0 000 4zM20 11h2M21 16a2 2 0 100 4 2 2 0 000-4zM21 20v2M16 21a2 2 0 100 4 2 2 0 000-4zM12 21h-2" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>`,
};

const STATUS_COLOR: Record<IntegrationStatus, string> = {
  connected: "var(--ok)", disconnected: "var(--ink-4)",
  error: "var(--bad)", syncing: "var(--brand)",
};
const STATUS_LABEL: Record<IntegrationStatus, string> = {
  connected: "Connected", disconnected: "Disconnected",
  error: "Error", syncing: "Syncing…",
};
const DIR_LABEL: Record<string, string> = {
  inbound: "← Inbound", outbound: "Outbound →", bidirectional: "⇄ Bidirectional",
};
const INTERVAL_LABELS: Record<SyncInterval, string> = {
  realtime: "Real-time", hourly: "Every hour", daily: "Daily", manual: "Manual only",
};

function fmtTs(ts: string) {
  return ts.replace("2026-", "").replace(/-/g, "/");
}

// ─── Export Sheet modal ────────────────────────────────────────────────────────
const EXPORT_TARGETS = [
  { id:"jira",      label:"Jira — Create bugs",            desc:"One Jira bug per failed test case with full context",              icon:"INT-001" },
  { id:"grafana",   label:"Grafana — Push metrics",         desc:"Send bench utilization & campaign KPIs to Grafana dashboard",      icon:"INT-002" },
  { id:"testRail",  label:"TestRail — Upload run results",  desc:"Create a TestRail run and upload pass/fail per test case",         icon:"INT-003" },
  { id:"slack",     label:"Slack — Post summary",           desc:"Post a campaign summary card to the configured Slack channel",     icon:"INT-006" },
];

const CAMPAIGNS_MOCK = [
  { id:"CMP-201", title:"CAN-Stack Regression v2.4",     failed:7,  total:184 },
  { id:"CMP-205", title:"OTA Firmware Update Suite",      failed:2,  total:96  },
  { id:"CMP-208", title:"ECU Boot Stress Test",           failed:14, total:320 },
  { id:"CMP-210", title:"HW-in-loop Validation Q2",       failed:0,  total:48  },
];

function ExportSheet({ onClose, integrations, onExported }: { onClose: ()=>void; integrations: Integration[]; onExported: (ev: SyncEvent)=>void }) {
  const [step, setStep] = useState<1|2|3>(1);
  const [selCampaign, setSelCampaign] = useState("");
  const [selTarget, setSelTarget] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const campaign = CAMPAIGNS_MOCK.find(c => c.id === selCampaign);
  const target = EXPORT_TARGETS.find(t => t.id === selTarget);
  const tgtInt = integrations.find(i => i.type === (selTarget as IntegrationType));
  const canExport = tgtInt?.status === "connected";

  function handleExport() {
    setLoading(true);
    setTimeout(() => {
      const ev: SyncEvent = {
        id: `SYN-${Date.now()}`,
        integrationId: tgtInt?.id ?? "",
        integrationType: selTarget as IntegrationType,
        integrationLabel: tgtInt?.label ?? selTarget,
        direction: "outbound",
        operation: target?.label ?? "Export",
        status: "success",
        itemsCount: selTarget === "jira" ? (campaign?.failed ?? 1) : selTarget === "grafana" ? 156 : 1,
        timestamp: "2026-06-26 " + new Date().toTimeString().slice(0,5),
        details: `${selCampaign} → ${target?.label}`,
      };
      onExported(ev);
      setLoading(false);
      setDone(true);
    }, 1400);
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.48)", backdropFilter:"blur(4px)", zIndex:1200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:"var(--panel)", borderRadius:14, width:540, maxWidth:"95vw", border:"1px solid var(--line-2)", boxShadow:"0 24px 64px rgba(0,0,0,.3)", display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"18px 22px 14px", borderBottom:"1px solid var(--line)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div style={{ fontSize:16, fontWeight:660 }}>Export Data</div>
              <div style={{ fontSize:12, color:"var(--ink-3)", marginTop:2 }}>Push TestOps data to an external system</div>
            </div>
            <button onClick={onClose} style={{ width:28, height:28, borderRadius:6, border:"1px solid var(--line-2)", background:"var(--panel-2)", display:"grid", placeItems:"center", cursor:"pointer", color:"var(--ink-3)" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
          {/* Step bar */}
          <div style={{ display:"flex", gap:0, marginTop:14 }}>
            {["Select campaign","Choose destination","Confirm"].map((lbl, i) => {
              const n = i+1 as 1|2|3; const done2 = step > n; const active = step === n;
              return (
                <div key={lbl} style={{ display:"flex", alignItems:"center", flex: i<2 ? 1 : undefined }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, cursor: done2 ? "pointer" : "default" }} onClick={() => done2 && setStep(n)}>
                    <div style={{ width:20, height:20, borderRadius:"50%", display:"grid", placeItems:"center", fontSize:10, fontWeight:700, flexShrink:0, background: done2?"var(--ok)":active?"var(--brand)":"var(--panel-3)", color:(done2||active)?"#fff":"var(--ink-4)" }}>{done2?"✓":n}</div>
                    <span style={{ fontSize:11.5, color:active?"var(--ink)":"var(--ink-4)", fontWeight:active?600:400 }}>{lbl}</span>
                  </div>
                  {i < 2 && <div style={{ flex:1, height:1, background:"var(--line-2)", margin:"0 8px" }}/>}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ padding:"16px 22px", flex:1 }}>
          {done ? (
            <div style={{ textAlign:"center", padding:"24px 0" }}>
              <div style={{ width:52, height:52, borderRadius:"50%", background:"rgba(26,150,72,.12)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--ok)" strokeWidth="2.2"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div style={{ fontSize:16, fontWeight:660, color:"var(--ok)", marginBottom:6 }}>Export successful</div>
              <div style={{ fontSize:13, color:"var(--ink-3)" }}>
                {target?.label} · {campaign?.id}
              </div>
              {selTarget === "jira" && (
                <div style={{ marginTop:10, fontSize:12, color:"var(--brand)", fontFamily:"var(--mono)" }}>
                  TESTOPS-1291 … TESTOPS-{1290 + (campaign?.failed ?? 1)} created
                </div>
              )}
              <button className="to-btn primary sm" style={{ marginTop:20 }} onClick={onClose}>Close</button>
            </div>
          ) : step === 1 ? (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <div style={{ fontSize:11, fontWeight:600, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:".06em", marginBottom:4 }}>Select campaign to export</div>
              {CAMPAIGNS_MOCK.map(c => (
                <label key={c.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderRadius:9, cursor:"pointer", border:`1.5px solid ${selCampaign===c.id?"var(--brand)":"var(--line-2)"}`, background:selCampaign===c.id?"var(--brand-dim)":"var(--panel-2)" }}>
                  <input type="radio" name="campaign" checked={selCampaign===c.id} onChange={() => setSelCampaign(c.id)} style={{ accentColor:"var(--brand)" }} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:550 }}>{c.id} — {c.title}</div>
                    <div style={{ fontSize:11, color:"var(--ink-4)", marginTop:2 }}>{c.total} tests · {c.failed > 0 ? <span style={{ color:"var(--bad)" }}>{c.failed} failed</span> : <span style={{ color:"var(--ok)" }}>all passing</span>}</div>
                  </div>
                </label>
              ))}
            </div>
          ) : step === 2 ? (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <div style={{ fontSize:11, fontWeight:600, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:".06em", marginBottom:4 }}>Choose destination</div>
              {EXPORT_TARGETS.map(t => {
                const int2 = integrations.find(i => i.type === t.id);
                const ok = int2?.status === "connected";
                return (
                  <label key={t.id} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"10px 14px", borderRadius:9, cursor: ok ? "pointer" : "default", border:`1.5px solid ${selTarget===t.id?"var(--brand)":"var(--line-2)"}`, background:selTarget===t.id?"var(--brand-dim)":ok?"var(--panel-2)":"var(--panel-3)", opacity: ok ? 1 : 0.5 }}>
                    <input type="radio" name="target" checked={selTarget===t.id} disabled={!ok} onChange={() => ok && setSelTarget(t.id)} style={{ accentColor:"var(--brand)", marginTop:2 }} />
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:13, fontWeight:550 }}>{t.label}</span>
                        {!ok && <span style={{ fontSize:10, color:"var(--ink-4)", padding:"1px 6px", borderRadius:4, background:"var(--panel-3)", border:"1px solid var(--line-2)" }}>Not connected</span>}
                      </div>
                      <div style={{ fontSize:11.5, color:"var(--ink-3)", marginTop:2 }}>{t.desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ padding:"14px 16px", borderRadius:10, background:"var(--panel-2)", border:"1px solid var(--line-2)" }}>
                <div style={{ fontSize:11, fontWeight:600, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:".06em", marginBottom:10 }}>Export summary</div>
                {[
                  { label:"Campaign", value:`${campaign?.id} — ${campaign?.title}` },
                  { label:"Destination", value:target?.label },
                  { label:"Items to export", value: selTarget==="jira" ? `${campaign?.failed} failed tests → Jira bugs` : selTarget==="grafana" ? "Bench metrics + campaign KPIs" : selTarget==="slack" ? "Campaign summary card" : `${campaign?.total} test results → TestRail run` },
                  { label:"Target project", value: integrations.find(i=>i.type===selTarget as IntegrationType)?.config.project ?? "Default" },
                ].map(r => (
                  <div key={r.label} style={{ display:"flex", gap:12, marginBottom:6 }}>
                    <span style={{ fontSize:12, color:"var(--ink-4)", minWidth:120 }}>{r.label}</span>
                    <span style={{ fontSize:12.5 }}>{r.value}</span>
                  </div>
                ))}
              </div>
              {loading && (
                <div style={{ display:"flex", alignItems:"center", gap:10, fontSize:13, color:"var(--brand)", padding:"8px 0" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation:"spin 1s linear infinite" }}><path d="M21 12a9 9 0 11-18 0"/></svg>
                  Exporting…
                </div>
              )}
            </div>
          )}
        </div>

        {!done && (
          <div style={{ borderTop:"1px solid var(--line)", padding:"12px 22px", display:"flex", justifyContent:"space-between" }}>
            <button className="to-btn ghost sm" onClick={step > 1 ? () => setStep(s => (s-1) as 1|2|3) : onClose}>{step > 1 ? "← Back" : "Cancel"}</button>
            {step < 3
              ? <button className="to-btn primary sm" disabled={step===1 ? !selCampaign : !selTarget} style={{ opacity:(step===1?!selCampaign:!selTarget)?0.45:1 }} onClick={() => setStep(s => (s+1) as 1|2|3)}>Next →</button>
              : <button className="to-btn primary sm" disabled={loading} onClick={handleExport}>Export now</button>
            }
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Source Config Panel ───────────────────────────────────────────────────────
function SourcePanel({ int: i, onUpdate, onSyncNow }: { int: Integration; onUpdate: (id: string, patch: Partial<Integration>)=>void; onSyncNow: (id: string)=>void }) {
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(i.config.url);
  const [interval, setInterval] = useState<SyncInterval>(i.config.syncInterval);
  const [project, setProject] = useState(i.config.project ?? "");
  const [connecting, setConnecting] = useState(false);
  const [testMsg, setTestMsg] = useState<null|{ok:boolean;txt:string}>(null);

  const sc = STATUS_COLOR[i.status];
  const canEdit = i.status !== "syncing";

  function handleConnect() {
    setConnecting(true); setTestMsg(null);
    setTimeout(() => {
      const ok = url.startsWith("http");
      setTestMsg(ok ? { ok:true, txt:"Connection successful — API responded in 84ms" } : { ok:false, txt:"Connection failed — check URL and credentials" });
      if (ok) onUpdate(i.id, { status:"connected", config:{ ...i.config, url, syncInterval:interval, project } });
      setConnecting(false);
    }, 1200);
  }

  function handleDisconnect() {
    onUpdate(i.id, { status:"disconnected" });
    setTestMsg(null);
  }

  function handleSave() {
    onUpdate(i.id, { config:{ ...i.config, url, syncInterval:interval, project } });
    setEditing(false);
  }

  return (
    <div style={{ background:"var(--panel-2)", borderRadius:12, border:"1px solid var(--line-2)", overflow:"hidden" }}>
      {/* Header */}
      <div style={{ padding:"14px 18px", display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:36, height:36, borderRadius:8, overflow:"hidden", flexShrink:0 }} dangerouslySetInnerHTML={{ __html: INT_ICONS[i.type] }} />
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:14, fontWeight:660 }}>{i.label}</span>
            <span style={{ fontSize:10.5, fontWeight:600, padding:"2px 7px", borderRadius:5, background:sc+"20", color:sc }}>
              {i.status === "syncing" && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight:3, verticalAlign:"middle", animation:"spin 1s linear infinite" }}><path d="M21 12a9 9 0 11-18 0"/></svg>}
              {STATUS_LABEL[i.status]}
            </span>
            <span style={{ fontSize:10.5, color:"var(--ink-4)", background:"var(--panel-3)", padding:"2px 6px", borderRadius:4, border:"1px solid var(--line-2)" }}>
              {DIR_LABEL[i.direction]}
            </span>
          </div>
          <div style={{ fontSize:11.5, color:"var(--ink-3)", marginTop:2 }}>{i.description}</div>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {i.status === "connected" || i.status === "error" ? (
            <>
              <button className="to-btn ghost sm" style={{ fontSize:11 }} onClick={() => onSyncNow(i.id)}>Sync now</button>
              <button className="to-btn ghost sm" style={{ fontSize:11, color:"var(--bad)", borderColor:"var(--bad)" }} onClick={handleDisconnect}>Disconnect</button>
            </>
          ) : (
            <button className="to-btn primary sm" style={{ fontSize:11 }} disabled={connecting} onClick={handleConnect}>
              {connecting ? "Testing…" : "Connect"}
            </button>
          )}
          <button onClick={() => setEditing(e => !e)} style={{ width:28, height:28, borderRadius:6, border:"1px solid var(--line-2)", background:editing?"var(--brand-dim)":"var(--panel-2)", display:"grid", placeItems:"center", cursor:"pointer", color:editing?"var(--brand)":"var(--ink-3)" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </div>
      </div>

      {/* Stats row */}
      {(i.config.lastSync || i.config.itemsSynced != null) && (
        <div style={{ display:"flex", gap:0, borderTop:"1px solid var(--line-2)", borderBottom: editing?"1px solid var(--line-2)":undefined }}>
          {[
            { label:"Last sync", value: i.config.lastSync ? fmtTs(i.config.lastSync) : "—" },
            { label:"Items synced", value: i.config.itemsSynced?.toLocaleString() ?? "—" },
            { label:"Errors", value: String(i.config.errorCount ?? 0), color: (i.config.errorCount ?? 0) > 0 ? "var(--bad)" : "var(--ok)" },
            { label:"Interval", value: INTERVAL_LABELS[i.config.syncInterval] },
          ].map((s, idx) => (
            <div key={s.label} style={{ flex:1, padding:"8px 14px", borderRight: idx<3 ? "1px solid var(--line-2)" : undefined }}>
              <div style={{ fontSize:10.5, color:"var(--ink-4)", marginBottom:2 }}>{s.label}</div>
              <div style={{ fontSize:12.5, fontWeight:600, fontFamily:"var(--mono)", color: s.color ?? "var(--ink-2)" }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Test result */}
      {testMsg && (
        <div style={{ padding:"8px 18px", background: testMsg.ok ? "rgba(26,150,72,.07)" : "rgba(220,53,69,.07)", borderTop:"1px solid var(--line-2)", fontSize:12.5, color:testMsg.ok?"var(--ok)":"var(--bad)", display:"flex", alignItems:"center", gap:8 }}>
          {testMsg.ok ? "✓" : "✗"} {testMsg.txt}
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div style={{ padding:"14px 18px", borderTop:"1px solid var(--line-2)", display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:5 }}>Endpoint URL</label>
              <input value={url} onChange={e => setUrl(e.target.value)} style={{ width:"100%", height:34, borderRadius:7, border:"1px solid var(--line-2)", background:"var(--panel-3)", color:"var(--ink)", fontSize:12.5, padding:"0 10px", boxSizing:"border-box" }} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:5 }}>Project / Channel</label>
              <input value={project} onChange={e => setProject(e.target.value)} placeholder="e.g. TESTOPS or #alerts" style={{ width:"100%", height:34, borderRadius:7, border:"1px solid var(--line-2)", background:"var(--panel-3)", color:"var(--ink)", fontSize:12.5, padding:"0 10px", boxSizing:"border-box" }} />
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:5 }}>Sync interval</label>
              <select value={interval} onChange={e => setInterval(e.target.value as SyncInterval)} style={{ width:"100%", height:34, borderRadius:7, border:"1px solid var(--line-2)", background:"var(--panel-3)", color:"var(--ink)", fontSize:12.5, padding:"0 10px" }}>
                {(Object.entries(INTERVAL_LABELS) as [SyncInterval, string][]).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            {i.config.authType === "apiKey" && (
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:5 }}>API Key</label>
                <input type="password" defaultValue="placeholder" placeholder="Paste new key to rotate…" style={{ width:"100%", height:34, borderRadius:7, border:"1px solid var(--line-2)", background:"var(--panel-3)", color:"var(--ink)", fontSize:12.5, padding:"0 10px", boxSizing:"border-box" }} />
              </div>
            )}
          </div>
          {/* Webhook URL */}
          {i.webhookUrl && (
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:5 }}>Inbound Webhook URL</label>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <input readOnly value={i.webhookUrl} style={{ flex:1, height:34, borderRadius:7, border:"1px solid var(--line-2)", background:"var(--panel-3)", color:"var(--ink-3)", fontSize:11.5, padding:"0 10px", fontFamily:"var(--mono)" }} />
                <button className="to-btn ghost sm" style={{ fontSize:11 }} onClick={() => navigator.clipboard?.writeText(i.webhookUrl!)}>Copy</button>
              </div>
              <div style={{ fontSize:10.5, color:"var(--ink-4)", marginTop:4 }}>POST JSON events to this URL to trigger TestOps actions</div>
            </div>
          )}
          {/* Field mappings */}
          {i.mappings.length > 0 && (
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:".06em", marginBottom:8 }}>Field mappings</div>
              <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                {i.mappings.map((m, idx) => (
                  <div key={idx} style={{ display:"flex", alignItems:"center", gap:6, fontSize:11.5, fontFamily:"var(--mono)", padding:"5px 10px", borderRadius:6, background:"var(--panel-3)", border:"1px solid var(--line-2)" }}>
                    <span style={{ color:"var(--brand)", flex:1 }}>{m.source}</span>
                    <span style={{ color:"var(--ink-4)" }}>→</span>
                    <span style={{ color:"var(--ok)", flex:1 }}>{m.target}</span>
                    {m.transform && <span style={{ color:"var(--warn)", fontSize:10.5, padding:"1px 5px", borderRadius:3, background:"rgba(184,134,11,.1)" }}>{m.transform}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end", paddingTop:4 }}>
            <button className="to-btn ghost sm" onClick={() => { setEditing(false); setUrl(i.config.url); setInterval(i.config.syncInterval); setProject(i.config.project ?? ""); }}>Discard</button>
            {(i.status === "disconnected" || i.status === "error") && (
              <button className="to-btn ghost sm" style={{ color:"var(--brand)", borderColor:"var(--brand)" }} disabled={connecting} onClick={handleConnect}>
                {connecting ? "Testing connection…" : "Test & connect"}
              </button>
            )}
            <button className="to-btn primary sm" onClick={handleSave}>Save changes</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export function IntegrationHub({ addToast }: { addToast: (t: string, s?: string, type?: string) => void }) {
  const [tab, setTab]           = useState<"overview"|"sources"|"export"|"log">("overview");
  const [integrations, setIntegrations] = useState<Integration[]>(INTEGRATIONS_INITIAL);
  const [syncEvents, setSyncEvents]     = useState<SyncEvent[]>(SYNC_EVENTS_INITIAL);
  const [exportOpen, setExportOpen]     = useState(false);
  const [logFilter, setLogFilter]       = useState<{ status: string; type: string; dir: string; q: string }>({ status:"all", type:"all", dir:"all", q:"" });

  function updateIntegration(id: string, patch: Partial<Integration>) {
    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
  }

  function syncNow(id: string) {
    const int2 = integrations.find(i => i.id === id);
    if (!int2) return;
    updateIntegration(id, { status:"syncing" });
    setTimeout(() => {
      const ev: SyncEvent = {
        id: `SYN-${Date.now()}`, integrationId: id,
        integrationType: int2.type, integrationLabel: int2.label,
        direction: int2.direction === "inbound" ? "inbound" : "outbound",
        operation: "Manual sync", status:"success",
        itemsCount: Math.floor(Math.random() * 80) + 10,
        timestamp: "2026-06-26 " + new Date().toTimeString().slice(0,5),
        details: "Triggered manually",
      };
      setSyncEvents(prev => [ev, ...prev]);
      updateIntegration(id, { status:"connected", config: { ...int2.config, lastSync: ev.timestamp, itemsSynced: (int2.config.itemsSynced ?? 0) + ev.itemsCount } });
      addToast(`${int2.label} synced`, `${ev.itemsCount} items synced successfully`, "ok");
    }, 2000);
  }

  function handleExported(ev: SyncEvent) {
    setSyncEvents(prev => [ev, ...prev]);
    addToast("Export complete", `${ev.itemsCount} item${ev.itemsCount !== 1 ? "s" : ""} exported to ${ev.integrationLabel}`, "ok");
  }

  const connected = integrations.filter(i => i.status === "connected" || i.status === "syncing").length;
  const errored   = integrations.filter(i => i.status === "error").length;
  const totalSync = syncEvents.reduce((s, e) => s + e.itemsCount, 0);
  const failedSync = syncEvents.filter(e => e.status === "failed").length;

  const filteredLog = useMemo(() => syncEvents.filter(e =>
    (logFilter.status === "all" || e.status === logFilter.status) &&
    (logFilter.type   === "all" || e.integrationType === logFilter.type) &&
    (logFilter.dir    === "all" || e.direction === logFilter.dir) &&
    (!logFilter.q || [e.operation, e.integrationLabel, e.details ?? ""].join(" ").toLowerCase().includes(logFilter.q.toLowerCase()))
  ), [syncEvents, logFilter]);

  const DIR_COLOR: Record<string, string> = { inbound:"var(--brand)", outbound:"var(--ok)" };

  return (
    <div className="to-screen">
      <div className="to-page-head">
        <div>
          <div className="to-kicker">API & Integrations</div>
          <h1>Integration Hub</h1>
          <div style={{ color:"var(--ink-2)", fontSize:13, marginTop:5 }}>
            Bidirectional sync with Jira, Grafana, TestRail, Jenkins, GitLab CI & Slack · per-customer configuration
          </div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {errored > 0 && (
            <span style={{ fontSize:12, fontWeight:600, padding:"4px 10px", borderRadius:8, background:"rgba(220,53,69,.1)", color:"var(--bad)", border:"1px solid var(--bad)" }}>
              {errored} integration error{errored > 1 ? "s" : ""}
            </span>
          )}
          <button className="to-btn primary sm" onClick={() => setExportOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Export data
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:20 }}>
        {[
          { label:"Connected",     val:`${connected}/${integrations.length}`, color:"var(--ok)"    },
          { label:"Errors",        val:errored,              color: errored>0 ? "var(--bad)" : "var(--ink-4)" },
          { label:"Items synced",  val:totalSync.toLocaleString(), color:"var(--brand)"  },
          { label:"Failed syncs",  val:failedSync,           color: failedSync>0 ? "var(--warn)" : "var(--ink-4)" },
        ].map(k => (
          <div key={k.label} className="to-kpi" style={{ padding:"12px 16px" }}>
            <div className="lab">{k.label}</div>
            <div className="val" style={{ color:k.color, fontSize:22 }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="to-tabs" style={{ marginBottom:20 }}>
        <button className={`to-tab ${tab==="overview"?"on":""}`} onClick={() => setTab("overview")}>Overview</button>
        <button className={`to-tab ${tab==="sources"?"on":""}`} onClick={() => setTab("sources")}>Sources & Config</button>
        <button className={`to-tab ${tab==="log"?"on":""}`} onClick={() => setTab("log")}>
          Sync Log {failedSync > 0 && <span style={{ marginLeft:5, fontSize:10, background:"var(--warn)", color:"#fff", borderRadius:8, padding:"1px 5px" }}>{failedSync}</span>}
        </button>
      </div>

      {/* ── Overview ── */}
      {tab === "overview" && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
          {integrations.map(i => {
            const sc = STATUS_COLOR[i.status];
            return (
              <div key={i.id} style={{ background:"var(--panel-2)", borderRadius:12, border:`1px solid ${i.status==="error"?"var(--bad)":i.status==="connected"||i.status==="syncing"?"var(--line-2)":"var(--line-2)"}`, padding:"16px 18px", display:"flex", flexDirection:"column", gap:12 }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                  <div style={{ width:40, height:40, borderRadius:9, overflow:"hidden", flexShrink:0 }} dangerouslySetInnerHTML={{ __html: INT_ICONS[i.type] }} />
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                      <span style={{ fontSize:14, fontWeight:660 }}>{i.label}</span>
                      <span style={{ fontSize:10, fontWeight:600, padding:"2px 7px", borderRadius:5, background:sc+"20", color:sc }}>
                        {i.status==="syncing" && "⟳ "}{STATUS_LABEL[i.status]}
                      </span>
                    </div>
                    <div style={{ fontSize:11, color:"var(--ink-4)", marginTop:3 }}>{DIR_LABEL[i.direction]}</div>
                  </div>
                </div>
                <div style={{ fontSize:12.5, color:"var(--ink-3)", lineHeight:1.5 }}>{i.description}</div>
                <div style={{ display:"flex", gap:0, borderRadius:8, overflow:"hidden", border:"1px solid var(--line-2)", fontSize:11 }}>
                  {i.config.lastSync && (
                    <div style={{ flex:1, padding:"6px 10px", borderRight:"1px solid var(--line-2)" }}>
                      <div style={{ color:"var(--ink-4)", marginBottom:1 }}>Last sync</div>
                      <div style={{ fontFamily:"var(--mono)", fontSize:10.5, fontWeight:600 }}>{fmtTs(i.config.lastSync)}</div>
                    </div>
                  )}
                  {i.config.itemsSynced != null && (
                    <div style={{ flex:1, padding:"6px 10px", borderRight: i.config.errorCount != null ? "1px solid var(--line-2)" : undefined }}>
                      <div style={{ color:"var(--ink-4)", marginBottom:1 }}>Items</div>
                      <div style={{ fontFamily:"var(--mono)", fontSize:10.5, fontWeight:600 }}>{i.config.itemsSynced.toLocaleString()}</div>
                    </div>
                  )}
                  {i.config.errorCount != null && (
                    <div style={{ flex:1, padding:"6px 10px" }}>
                      <div style={{ color:"var(--ink-4)", marginBottom:1 }}>Errors</div>
                      <div style={{ fontFamily:"var(--mono)", fontSize:10.5, fontWeight:600, color:(i.config.errorCount??0)>0?"var(--bad)":"var(--ok)" }}>{i.config.errorCount}</div>
                    </div>
                  )}
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  {(i.status === "connected" || i.status === "syncing" || i.status === "error") ? (
                    <>
                      <button className="to-btn ghost sm" style={{ fontSize:11, flex:1 }} onClick={() => syncNow(i.id)} disabled={i.status==="syncing"}>
                        {i.status==="syncing" ? "Syncing…" : "Sync now"}
                      </button>
                      <button className="to-btn ghost sm" style={{ fontSize:11 }} onClick={() => setTab("sources")}>Configure</button>
                    </>
                  ) : (
                    <button className="to-btn primary sm" style={{ fontSize:11, flex:1 }} onClick={() => setTab("sources")}>Connect</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Sources & Config ── */}
      {tab === "sources" && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {integrations.map(i => (
            <SourcePanel key={i.id} int={i} onUpdate={updateIntegration} onSyncNow={syncNow} />
          ))}
        </div>
      )}

      {/* ── Sync Log ── */}
      {tab === "log" && (
        <div className="to-panel">
          <div className="to-panel-h">
            <span className="to-eyebrow">Sync history & audit trail</span>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              <select value={logFilter.status} onChange={e => setLogFilter(f => ({ ...f, status:e.target.value }))}
                style={{ height:30, borderRadius:6, border:"1px solid var(--line-2)", background:"var(--panel-2)", color:"var(--ink)", fontSize:12, padding:"0 8px" }}>
                <option value="all">All statuses</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
              <select value={logFilter.dir} onChange={e => setLogFilter(f => ({ ...f, dir:e.target.value }))}
                style={{ height:30, borderRadius:6, border:"1px solid var(--line-2)", background:"var(--panel-2)", color:"var(--ink)", fontSize:12, padding:"0 8px" }}>
                <option value="all">All directions</option>
                <option value="inbound">Inbound</option>
                <option value="outbound">Outbound</option>
              </select>
              <select value={logFilter.type} onChange={e => setLogFilter(f => ({ ...f, type:e.target.value }))}
                style={{ height:30, borderRadius:6, border:"1px solid var(--line-2)", background:"var(--panel-2)", color:"var(--ink)", fontSize:12, padding:"0 8px" }}>
                <option value="all">All sources</option>
                {integrations.map(i => <option key={i.id} value={i.type}>{i.label}</option>)}
              </select>
              <div style={{ position:"relative" }}>
                <svg style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:"var(--ink-3)" }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
                <input value={logFilter.q} onChange={e => setLogFilter(f => ({ ...f, q:e.target.value }))} placeholder="Search…"
                  style={{ height:30, paddingLeft:26, paddingRight:8, borderRadius:6, border:"1px solid var(--line-2)", background:"var(--panel-2)", color:"var(--ink)", fontSize:12 }} />
              </div>
            </div>
          </div>
          <div className="to-panel-b">
            {filteredLog.length === 0 ? (
              <div style={{ textAlign:"center", padding:"28px 0", color:"var(--ink-4)", fontSize:13 }}>No events match the filters.</div>
            ) : (
              <table className="to-tbl">
                <thead>
                  <tr><th>Timestamp</th><th>Integration</th><th>Direction</th><th>Operation</th><th>Items</th><th>Status</th><th></th></tr>
                </thead>
                <tbody>
                  {filteredLog.map(e => {
                    const sSc = e.status === "success" ? "var(--ok)" : e.status === "failed" ? "var(--bad)" : "var(--warn)";
                    return (
                      <tr key={e.id} style={{ background: e.status === "failed" ? "rgba(220,53,69,.03)" : undefined }}>
                        <td style={{ fontFamily:"var(--mono)", fontSize:11.5, color:"var(--ink-3)", whiteSpace:"nowrap" }}>{fmtTs(e.timestamp)}</td>
                        <td>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <div style={{ width:20, height:20, borderRadius:5, overflow:"hidden", flexShrink:0 }} dangerouslySetInnerHTML={{ __html: INT_ICONS[e.integrationType] }} />
                            <span style={{ fontSize:12.5, fontWeight:550 }}>{e.integrationLabel}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize:10.5, fontWeight:600, padding:"2px 7px", borderRadius:4, background:DIR_COLOR[e.direction]+"18", color:DIR_COLOR[e.direction] }}>
                            {e.direction === "inbound" ? "← In" : "Out →"}
                          </span>
                        </td>
                        <td style={{ fontSize:12.5, color:"var(--ink-2)" }}>
                          <div>{e.operation}</div>
                          {e.details && <div style={{ fontSize:11, color:"var(--ink-4)", marginTop:2 }}>{e.details}</div>}
                          {e.errorMessage && <div style={{ fontSize:11, color:"var(--bad)", marginTop:2 }}>✗ {e.errorMessage}</div>}
                        </td>
                        <td style={{ fontFamily:"var(--mono)", fontSize:12.5 }}>{e.itemsCount || "—"}</td>
                        <td>
                          <span style={{ fontSize:10.5, fontWeight:600, padding:"2px 7px", borderRadius:4, background:sSc+"20", color:sSc }}>
                            {e.status.charAt(0).toUpperCase() + e.status.slice(1)}
                          </span>
                        </td>
                        <td>
                          {e.status === "failed" && (
                            <button className="to-btn ghost sm" style={{ fontSize:11 }}
                              onClick={() => {
                                const patch: SyncEvent = { ...e, id:`SYN-${Date.now()}`, status:"success", itemsCount: Math.floor(Math.random()*20)+5, timestamp:"2026-06-26 " + new Date().toTimeString().slice(0,5), errorMessage:undefined };
                                setSyncEvents(prev => [patch, ...prev]);
                                addToast("Retry successful", `${e.integrationLabel} — operation completed`, "ok");
                              }}>
                              Retry
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {exportOpen && (
        <ExportSheet onClose={() => setExportOpen(false)} integrations={integrations} onExported={(ev) => { handleExported(ev); setExportOpen(false); }} />
      )}
    </div>
  );
}
