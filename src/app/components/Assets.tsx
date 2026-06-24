import { useState } from "react";
import { Asset, DATA, STATUS_MAP, TEST_CENTERS } from "../data";
import { SyncModal } from "./SyncModal";
import { ScanModal } from "./QRModal";
interface Props {
  assets: Asset[];
  onOpenAsset: (tag: string) => void;
  onCheckout: (tags: string[]) => void;
  onCheckin: (tag: string) => void;
  onRegister: () => void;
  onDelete: (tag: string) => void;
  onClone: (tag: string) => void;
  onEdit?: (tag: string) => void;
  addToast: (t: string, s?: string, type?: string) => void;
}

const TABS = [["registry","Registry"],["models","Models"],["categories","Categories"],["audit","Audit & Calibration"],["licenses","Licenses"],["topology","Topology"]];
const STAT_CARDS = [["all","Total assets","509"],["deployed","Deployed","415"],["ready","Ready to Deploy","94"],["audit","Due for Audit","6"],["archived","Archived","12"]];

const EYE = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="2.6"/></svg>;
const PEN = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 20h4L18 10l-4-4L4 16z"/><path d="M14 6l4 4"/></svg>;
const COPY = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 16V4h12"/></svg>;
const TRASH = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>;
const MOVE  = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><polyline points="15 3 21 3 21 9"/><path d="M21 3L10 14"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>;

const TODAY = new Date("2026-06-22");
const WARN_DATE = new Date("2026-06-22");
WARN_DATE.setMonth(WARN_DATE.getMonth() + 4);

const LICENSES = [
  { id:"L1", software:"CANoe 17",      vendor:"Vector Informatik", total:5, assigned:4, expiry:"2026-12-31", centerId:"TC-MUC" },
  { id:"L2", software:"MATLAB R2024b", vendor:"MathWorks",         total:3, assigned:2, expiry:"2026-09-30", centerId:"TC-STR" },
  { id:"L3", software:"CANdb++ 8",     vendor:"Vector Informatik", total:2, assigned:2, expiry:"2027-03-15", centerId:"TC-WAW" },
];

function expiryColor(d: string) {
  const dt = new Date(d);
  if (dt < TODAY)     return "var(--bad)";
  if (dt < WARN_DATE) return "var(--warn)";
  return "var(--ok)";
}

export function Assets({ assets, onOpenAsset, onCheckout, onCheckin, onRegister, onDelete, onClone, onEdit, addToast }: Props) {
  const [tab, setTab] = useState("registry");
  const [filter, setFilter] = useState("all");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [syncOpen, setSyncOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [reassignTag, setReassignTag] = useState<string | null>(null);
  const [targetCenter, setTargetCenter] = useState("");

  const visible = assets.filter(a => {
    if (filter === "ready") return a.status === "ready";
    if (filter === "deployed") return a.status === "deployed";
    if (filter === "archived") return a.status === "archived";
    if (filter === "audit") return a.audit?.due;
    return true;
  }).filter(a => {
    if (!search) return true;
    return (a.tag + a.name + a.serial + a.model + a.cat).toLowerCase().includes(search.toLowerCase());
  });

  const toggleSel = (tag: string, checked: boolean) => {
    setSel(prev => { const n = new Set(prev); checked ? n.add(tag) : n.delete(tag); return n; });
  };
  const toggleAll = (checked: boolean) => {
    setSel(checked ? new Set(visible.map(a => a.tag)) : new Set());
  };

  return (
    <div className="to-screen">
      <div className="to-page-head">
        <div>
          <div className="to-kicker">Asset Management</div>
          <h1>Assets</h1>
          <div className="lede" style={{color:"var(--ink-2)",fontSize:13,marginTop:5}}>Hardware inventory · register, book and track DUTs and test equipment · QR-tagged</div>
        </div>
        <div className="to-head-actions">
          <button className="to-btn ghost sm" onClick={() => setSyncOpen(true)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            Sync with Snipe-IT
          </button>
          <button className="to-btn ghost sm" onClick={() => setScanOpen(true)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            Scan QR
          </button>
          <button className="to-btn primary sm" onClick={onRegister}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 5v14M5 12h14"/></svg>
            Register equipment
          </button>
        </div>
      </div>


      <div className="to-tabs">
        {TABS.map(([k,l]) => (
          <button key={k} className={`to-tab ${tab===k?"on":""}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === "registry" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 16, marginBottom: 16 }}>
            {STAT_CARDS.map(([f, l, v]) => (
              <div key={f} style={{ cursor: "pointer" }} onClick={() => setFilter(f)}>
                <div className="to-kpi" style={filter === f ? { borderColor: "var(--brand-cta)", background: "var(--brand-dim)" } : {}}>
                  <div className="lab">{l}</div>
                  <div className="val">{v}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="to-filters">
            <div className="to-search-mini">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
              <input placeholder="Search tag, name, serial, model…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {["all","ready","deployed","audit","archived"].map(f => (
              <button key={f} className={`to-fchip ${filter===f?"on":""}`} onClick={() => setFilter(f)}>
                {f==="all"?"All":f==="ready"?"Ready to Deploy":f==="deployed"?"Deployed":f==="audit"?"Due for Audit":"Archived"}
              </button>
            ))}
          </div>
          {sel.size > 0 && (
            <div className="to-bulkbar">
              <b>{sel.size}</b> selected
              <button className="to-btn primary sm" onClick={() => onCheckout([...sel])}>Bulk checkout</button>
              <button className="to-btn ghost sm" onClick={() => setSel(new Set())}>Clear selection</button>
            </div>
          )}
          <div className="to-panel">
            <div style={{overflowX:"auto"}}>
              <table className="to-tbl">
                <thead>
                  <tr>
                    <th style={{width:30}}><input type="checkbox" onChange={e => toggleAll(e.target.checked)} checked={sel.size === visible.length && visible.length > 0} /></th>
                    <th>Asset Tag</th><th>Name</th><th>Serial</th><th>Model</th><th>Category</th><th>Status</th><th>Checked Out To</th><th>Location</th><th>Cost</th><th>Checkin/Checkout</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map(a => {
                    const st = STATUS_MAP[a.status] || {c:"mute",l:a.status};
                    return (
                      <tr key={a.tag}>
                        <td><input type="checkbox" checked={sel.has(a.tag)} onChange={e => toggleSel(a.tag, e.target.checked)} /></td>
                        <td><button className="to-id-link" onClick={() => onOpenAsset(a.tag)}>{a.tag}</button></td>
                        <td><button className="to-linklike" style={{fontWeight:500}} onClick={() => onOpenAsset(a.tag)}>{a.name}</button></td>
                        <td className="to-mono to-muted">{a.serial}</td>
                        <td>{a.model}</td>
                        <td className="to-muted">{a.cat}</td>
                        <td>
                          <span className={`to-chip ${st.c}`}>
                            {a.status !== "archived" && <span className={`to-dot ${st.c === "mute" ? "low" : st.c}`} />}
                            {st.l}
                          </span>
                        </td>
                        <td>{a.assignee ? <span className="to-row" style={{gap:6}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{opacity:.55,flexShrink:0}}><circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6"/></svg>{a.assignee}</span> : <span className="to-muted">—</span>}</td>
                        <td className="to-muted">{a.location}</td>
                        <td className="to-mono">{a.cost}</td>
                        <td>
                          {a.status === "ready" && <button className="to-btn primary sm" onClick={() => onCheckout([a.tag])}>Checkout</button>}
                          {a.status === "deployed" && <button className="to-btn accent sm" onClick={() => onCheckin(a.tag)}>Checkin</button>}
                          {a.status !== "ready" && a.status !== "deployed" && <span className="to-muted to-mono" style={{fontSize:11}}>—</span>}
                        </td>
                        <td>
                          <div className="to-row" style={{gap:5}}>
                            <button className="to-ract" title="View" onClick={() => onOpenAsset(a.tag)}>{EYE}</button>
                            <button className="to-ract" title="Edit" onClick={() => onEdit ? onEdit(a.tag) : onOpenAsset(a.tag)}>{PEN}</button>
                            <button className="to-ract" title="Reassign to Test Center" onClick={() => { setReassignTag(a.tag); setTargetCenter(""); }}>{MOVE}</button>
                            <button className="to-ract" title="Clone" onClick={() => onClone(a.tag)}>{COPY}</button>
                            <button className="to-ract del" title="Delete" onClick={() => onDelete(a.tag)}>{TRASH}</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="to-row to-between" style={{padding:"12px 16px",borderTop:"1px solid var(--line)"}}>
              <span className="to-muted to-mono" style={{fontSize:11}}>Showing {visible.length} of 509 assets</span>
              <span className="to-muted to-mono" style={{fontSize:11}}>page 1 / 17</span>
            </div>
          </div>
        </>
      )}

      {tab === "models" && (
        <div className="to-panel">
          <div className="to-panel-h">
            <span className="to-eyebrow">Asset models</span>
            <button className="to-btn accent sm"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M12 5v14M5 12h14"/></svg> Add model</button>
          </div>
          <div style={{overflowX:"auto"}}>
            <table className="to-tbl">
              <thead><tr><th>Name</th><th>Model No.</th><th>Category</th><th>Assets</th><th>Assigned</th><th>Remaining</th><th style={{width:180}}>% Remaining</th><th>Actions</th></tr></thead>
              <tbody>
                {DATA.models.map(m => {
                  const pct = m.assets ? Math.round(m.remaining/m.assets*100) : 0;
                  const col = pct > 40 ? "var(--ok)" : pct > 15 ? "var(--warn)" : "var(--bad)";
                  return (
                    <tr key={m.name}>
                      <td style={{fontWeight:500}}>{m.name}</td>
                      <td className="to-mono to-muted">{m.no}</td>
                      <td className="to-muted">{m.cat}</td>
                      <td className="to-mono">{m.assets}</td>
                      <td className="to-mono">{m.assigned}</td>
                      <td className="to-mono">{m.remaining}</td>
                      <td><div style={{height:7,borderRadius:5,background:"var(--panel-3)",overflow:"hidden"}}><i style={{display:"block",height:"100%",width:`${pct}%`,background:m.assets?col:"transparent"}} /></div></td>
                      <td><div className="to-row" style={{gap:5}}><button className="to-ract">{PEN}</button><button className="to-ract del">{TRASH}</button></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "categories" && (
        <div className="to-panel">
          <div className="to-panel-h">
            <span className="to-eyebrow">Categories</span>
            <button className="to-btn accent sm"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M12 5v14M5 12h14"/></svg> Add category</button>
          </div>
          <table className="to-tbl">
            <thead><tr><th>Name</th><th>Type</th><th>Assets (QTY)</th><th>Acceptance</th><th>Actions</th></tr></thead>
            <tbody>
              {DATA.categories.map(c => (
                <tr key={c.name}>
                  <td style={{fontWeight:500}}>{c.name}</td>
                  <td className="to-muted">{c.type}</td>
                  <td className="to-mono">{c.qty}</td>
                  <td>{c.accept ? <span className="to-chip ok">Required</span> : <span className="to-muted">—</span>}</td>
                  <td><div className="to-row" style={{gap:5}}><button className="to-ract">{PEN}</button><button className="to-ract del">{TRASH}</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "audit" && (
        <div className="to-panel">
          <div className="to-panel-h">
            <h3>Due for audit &amp; calibration</h3>
            <span className="to-chip warn">{assets.filter(a=>a.audit?.due).length} due ≤30 days</span>
          </div>
          <table className="to-tbl">
            <thead><tr><th>Asset</th><th>Category</th><th>Action</th><th>Next audit</th><th>Status</th></tr></thead>
            <tbody>
              {assets.filter(a=>a.audit?.due).map(a => (
                <tr key={a.tag} className="clickable" onClick={() => onOpenAsset(a.tag)}>
                  <td><span className="to-muted to-mono" style={{fontSize:12.5}}>{a.tag}</span>&nbsp;&nbsp;{a.name}</td>
                  <td className="to-muted">{a.cat}</td>
                  <td>Audit / calibration</td>
                  <td className="to-mono" style={{color:"var(--warn)"}}>{a.audit.date}</td>
                  <td><span className="to-chip warn"><span className="to-dot warn" />Due soon</span></td>
                </tr>
              ))}
              <tr>
                <td><span className="to-muted to-mono" style={{fontSize:12.5}}>00095</span>&nbsp;&nbsp;7208 (CIVIC)</td>
                <td className="to-muted">CIVIC</td>
                <td>Service / predicted failure</td>
                <td className="to-mono" style={{color:"var(--bad)"}}>2026-06-22 · AI</td>
                <td><span className="to-chip bad"><span className="to-dot bad" />At risk</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {tab === "licenses" && (
        <div className="to-panel">
          <div className="to-panel-h">
            <span className="to-eyebrow">Software Licenses</span>
            <button className="to-btn accent sm" onClick={() => addToast("Add license", "Opening license registration…", "info")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M12 5v14M5 12h14"/></svg>
              Add license
            </button>
          </div>
          <div style={{overflowX:"auto"}}>
            <table className="to-tbl">
              <thead>
                <tr>
                  <th>Software</th>
                  <th>Vendor</th>
                  <th style={{textAlign:"center"}}>Total</th>
                  <th style={{textAlign:"center"}}>Assigned</th>
                  <th style={{textAlign:"center"}}>Available</th>
                  <th style={{width:160}}>Utilization</th>
                  <th>Expiry</th>
                  <th>Test Center</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {LICENSES.map(l => {
                  const available = l.total - l.assigned;
                  const pct = Math.round(l.assigned / l.total * 100);
                  const availColor = available === 0 ? "var(--bad)" : available === 1 ? "var(--warn)" : "var(--ok)";
                  const expColor = expiryColor(l.expiry);
                  const ctr = TEST_CENTERS.find(c => c.id === l.centerId);
                  const ctrColors: Record<string, { color: string; bg: string }> = {
                    "TC-MUC": { color:"var(--brand)", bg:"rgba(94,106,210,.1)" },
                    "TC-STR": { color:"var(--warn)",  bg:"rgba(184,134,11,.1)" },
                    "TC-WAW": { color:"var(--ok)",    bg:"rgba(26,150,72,.1)"  },
                  };
                  const cc = ctrColors[l.centerId] ?? { color:"var(--ink-4)", bg:"var(--panel-2)" };
                  return (
                    <tr key={l.id}>
                      <td style={{fontWeight:550}}>{l.software}</td>
                      <td className="to-muted">{l.vendor}</td>
                      <td className="to-mono" style={{textAlign:"center"}}>{l.total}</td>
                      <td className="to-mono" style={{textAlign:"center"}}>{l.assigned}</td>
                      <td style={{textAlign:"center"}}>
                        <span style={{
                          fontWeight:600, fontSize:13,
                          color: availColor,
                        }}>
                          {available}
                        </span>
                      </td>
                      <td>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <div style={{flex:1,height:6,borderRadius:4,background:"var(--panel-3)",overflow:"hidden"}}>
                            <div style={{height:"100%",width:`${pct}%`,background:pct>=100?"var(--bad)":pct>=70?"var(--warn)":"var(--brand)",borderRadius:4}} />
                          </div>
                          <span style={{fontSize:11,color:"var(--ink-4)",minWidth:28}}>{pct}%</span>
                        </div>
                      </td>
                      <td>
                        <span style={{fontFamily:"var(--mono)",fontSize:12.5,color:expColor,fontWeight:expColor!=="var(--ok)"?600:undefined}}>
                          {l.expiry}
                        </span>
                        {expColor === "var(--warn)" && (
                          <span style={{marginLeft:6,fontSize:10,padding:"1px 6px",borderRadius:8,background:"rgba(184,134,11,.1)",color:"var(--warn)",fontWeight:600}}>
                            Expiring soon
                          </span>
                        )}
                        {expColor === "var(--bad)" && (
                          <span style={{marginLeft:6,fontSize:10,padding:"1px 6px",borderRadius:8,background:"rgba(192,57,43,.1)",color:"var(--bad)",fontWeight:600}}>
                            Expired
                          </span>
                        )}
                      </td>
                      <td>
                        {ctr && (
                          <span style={{
                            fontSize:11.5,padding:"2px 10px",borderRadius:12,fontWeight:600,
                            background:cc.bg,color:cc.color,
                          }}>
                            {ctr.city}
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="to-row" style={{gap:5}}>
                          <button className="to-ract" title="Edit" onClick={() => addToast("Edit license", `Editing ${l.software}…`, "info")}>{PEN}</button>
                          <button className="to-ract del" title="Remove" onClick={() => addToast("License removed", l.software, "ok")}>{TRASH}</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{padding:"10px 16px",borderTop:"1px solid var(--line)",display:"flex",gap:16}}>
            {[
              { label:"Total seats", val: LICENSES.reduce((s,l)=>s+l.total,0), color:"var(--ink)" },
              { label:"In use",      val: LICENSES.reduce((s,l)=>s+l.assigned,0), color:"var(--brand)" },
              { label:"Available",   val: LICENSES.reduce((s,l)=>s+(l.total-l.assigned),0), color:"var(--ok)" },
            ].map(k => (
              <span key={k.label} style={{fontSize:12,color:"var(--ink-4)"}}>
                {k.label}: <b style={{color:k.color}}>{k.val}</b>
              </span>
            ))}
          </div>
        </div>
      )}

      {tab === "topology" && (
        <div className="to-panel">
          <div className="to-panel-h"><span className="to-eyebrow">Physical layout · Lab 2 · Rack rows A–C</span></div>
          <div className="to-panel-b">
            <TopoSVG />
            <div className="to-legend" style={{marginTop:14}}>
              <span><i style={{background:"var(--brand)"}} />Test bed</span>
              <span><i style={{background:"var(--accent)"}} />Edge node</span>
              <span><i style={{background:"var(--ok)"}} />active link</span>
              <span><i style={{background:"var(--ink-4)"}} />idle</span>
            </div>
          </div>
        </div>
      )}

      <SyncModal open={syncOpen} onClose={() => setSyncOpen(false)} onSynced={() => addToast("Sync complete","3 assets imported · 2 updated · 2 conflicts flagged")} />
      <ScanModal open={scanOpen} onClose={() => setScanOpen(false)} onScanned={tag => { setScanOpen(false); onOpenAsset(tag); }} />

      {reassignTag && (() => {
        const asset = assets.find(a => a.tag === reassignTag);
        if (!asset) return null;
        const canConfirm = targetCenter.length > 0;
        return (
          <div
            style={{
              position:"fixed", inset:0,
              background:"rgba(0,0,0,.46)", backdropFilter:"blur(4px)",
              display:"flex", alignItems:"center", justifyContent:"center",
              zIndex:900, padding:20,
            }}
            onClick={e => e.target === e.currentTarget && setReassignTag(null)}
          >
            <div style={{
              background:"var(--panel)", borderRadius:14,
              border:"1px solid var(--line)",
              width:440, maxWidth:"100%",
              boxShadow:"0 24px 56px rgba(0,0,0,.32)",
            }}>
              {/* Header */}
              <div style={{
                padding:"18px 22px", borderBottom:"1px solid var(--line)",
                display:"flex", alignItems:"flex-start", justifyContent:"space-between",
              }}>
                <div>
                  <div style={{fontSize:15.5,fontWeight:660,color:"var(--ink)"}}>Reassign Asset</div>
                  <div style={{fontSize:11.5,color:"var(--ink-4)",marginTop:2}}>Move asset to a different Test Center</div>
                </div>
                <button className="to-iconbtn" style={{background:"var(--panel-2)"}} onClick={() => setReassignTag(null)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>

              {/* Body */}
              <div style={{padding:"20px 22px"}}>
                {/* Asset info */}
                <div style={{
                  padding:"12px 14px", borderRadius:8,
                  background:"var(--panel-2)", border:"1px solid var(--line)",
                  marginBottom:20,
                }}>
                  <div style={{fontSize:10,fontWeight:600,color:"var(--ink-4)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:5}}>
                    Selected Asset
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontFamily:"var(--mono)",fontSize:12,padding:"2px 8px",borderRadius:5,background:"var(--panel-3)",color:"var(--brand)",fontWeight:600}}>
                      {asset.tag}
                    </span>
                    <div>
                      <div style={{fontSize:13,fontWeight:550,color:"var(--ink)"}}>{asset.name}</div>
                      <div style={{fontSize:11,color:"var(--ink-4)",marginTop:1}}>
                        Current location: <span style={{color:"var(--ink-2)"}}>{asset.location || "—"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Center select */}
                <label style={{fontSize:11,fontWeight:600,color:"var(--ink-3)",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:8}}>
                  Assign to Test Center
                </label>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {TEST_CENTERS.map(c => {
                    const colors: Record<string, { color: string; bg: string; border: string }> = {
                      "TC-MUC": { color:"var(--brand)", bg:"rgba(94,106,210,.08)",  border:"var(--brand)" },
                      "TC-STR": { color:"var(--warn)",  bg:"rgba(184,134,11,.08)", border:"var(--warn)"  },
                      "TC-WAW": { color:"var(--ok)",    bg:"rgba(26,150,72,.08)",  border:"var(--ok)"    },
                    };
                    const cc = colors[c.id] ?? { color:"var(--ink-3)", bg:"var(--panel-2)", border:"var(--line)" };
                    const selected = targetCenter === c.id;
                    return (
                      <div
                        key={c.id}
                        onClick={() => setTargetCenter(c.id)}
                        style={{
                          display:"flex", alignItems:"center", gap:12,
                          padding:"11px 14px", borderRadius:9, cursor:"pointer",
                          border:`1.5px solid ${selected ? cc.border : "var(--line)"}`,
                          background: selected ? cc.bg : "var(--panel)",
                          transition:"all .1s",
                        }}
                      >
                        <span style={{
                          width:10, height:10, borderRadius:"50%", flexShrink:0,
                          background: selected ? cc.color : "var(--line-2)",
                          transition:"background .1s",
                        }} />
                        <div style={{flex:1}}>
                          <div style={{fontSize:13,fontWeight:selected?600:400,color:selected?cc.color:"var(--ink)"}}>{c.name}</div>
                          <div style={{fontSize:11,color:"var(--ink-4)",marginTop:1}}>{c.city} · {c.country}</div>
                        </div>
                        {selected && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={cc.color} strokeWidth="2.2">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div style={{
                padding:"14px 22px", borderTop:"1px solid var(--line)",
                display:"flex", justifyContent:"flex-end", gap:8,
              }}>
                <button className="to-btn ghost sm" onClick={() => setReassignTag(null)}>Cancel</button>
                <button
                  className="to-btn primary sm"
                  disabled={!canConfirm}
                  style={{opacity:canConfirm?1:.45}}
                  onClick={() => {
                    if (!canConfirm) return;
                    const ctr = TEST_CENTERS.find(c => c.id === targetCenter);
                    addToast("Asset reassigned", `${asset.tag} → ${ctr?.city}`, "ok");
                    setReassignTag(null);
                  }}
                >
                  Confirm reassignment
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function TopoSVG() {
  const W = 800, H = 360;
  const BEDS: [string, number, number][] = [
    ["TB-01",.12,.25],["TB-02",.12,.62],["TB-03",.30,.20],["TB-04",.30,.55],
    ["TB-05",.50,.30],["TB-06",.50,.70],["TB-08",.70,.22],["TB-11",.70,.58],["TB-12",.88,.40],
  ];
  const EDGES: [string, number, number][] = [["EN-04",.30,.55],["EN-06",.50,.70]];
  const cx = W*.5, cy = H*.45;
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} className="to-topo" style={{background:"none",border:"none"}}>
      <circle cx={cx} cy={cy} r={26} fill="var(--bg-2)" stroke="var(--brand)" strokeWidth={1.6}/>
      <text x={cx} y={cy-32} fill="var(--ink-3)" fontSize={10} fontFamily="var(--mono)" textAnchor="middle">CORE SWITCH</text>
      <text x={cx} y={cy+4} fill="var(--brand)" fontSize={9} fontFamily="var(--mono)" textAnchor="middle">10GbE</text>
      {BEDS.map(([,bx,by], i) => (
        <line key={i} x1={cx} y1={cy} x2={W*bx} y2={H*by} stroke={i%4!==3?"var(--ok)":"var(--ink-4)"} strokeWidth={i%4!==3?1.4:1} opacity={i%4!==3?.45:.3}/>
      ))}
      {BEDS.map(([id,bx,by]) => (
        <g key={id}>
          <rect x={W*bx-26} y={H*by-16} width={52} height={32} rx={8} fill="var(--bg-2)" stroke="var(--brand)" strokeWidth={1.2}/>
          <text x={W*bx} y={H*by+4} fill="var(--ink)" fontSize={10} fontFamily="var(--mono)" textAnchor="middle">{id}</text>
        </g>
      ))}
      {EDGES.map(([id,ex,ey]) => (
        <g key={id}>
          <rect x={W*ex+34-22} y={H*ey-30-12} width={44} height={24} rx={7} fill="var(--accent-dim)" stroke="var(--accent)" strokeWidth={1.1}/>
          <text x={W*ex+34} y={H*ey-30+4} fill="var(--accent)" fontSize={9} fontFamily="var(--mono)" textAnchor="middle">{id}</text>
        </g>
      ))}
    </svg>
  );
}
