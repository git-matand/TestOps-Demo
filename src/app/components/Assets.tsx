import { useState } from "react";
import { Asset, DATA, STATUS_MAP } from "../data";
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

const TABS = [["registry","Registry"],["models","Models"],["categories","Categories"],["audit","Audit & Calibration"],["topology","Topology"]];
const STAT_CARDS = [["all","Total assets","509"],["deployed","Deployed","415"],["ready","Ready to Deploy","94"],["audit","Due for Audit","6"],["archived","Archived","12"]];

const EYE = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="2.6"/></svg>;
const PEN = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 20h4L18 10l-4-4L4 16z"/><path d="M14 6l4 4"/></svg>;
const COPY = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 16V4h12"/></svg>;
const TRASH = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>;

export function Assets({ assets, onOpenAsset, onCheckout, onCheckin, onRegister, onDelete, onClone, onEdit, addToast }: Props) {
  const [tab, setTab] = useState("registry");
  const [filter, setFilter] = useState("all");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [syncOpen, setSyncOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);

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
                        <td>{a.assignee ? <span className="to-row" style={{gap:6}}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{opacity:.6}}><circle cx="12" cy="8" r="3.2"/><path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6"/></svg>{a.assignee}</span> : <span className="to-muted">—</span>}</td>
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
