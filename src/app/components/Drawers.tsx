import { useState } from "react";
import { Asset, DUT, DATA, STATUS_MAP } from "../data";
import { QRModal } from "./QRModal";

const CLOSE_ICON = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 6l12 12M18 6 6 18"/></svg>;
const FILE_ICON = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="1.7"><path d="M6 2h8l4 4v16H6z"/><path d="M14 2v4h4"/></svg>;
const DOWN_ICON = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3v12M8 11l4 4 4-4M5 21h14"/></svg>;
const DOCS = ["Datasheet — rev C.pdf","Calibration certificate 2026.pdf","Wiring schematic.pdf"];

interface DUTDrawerProps {
  id: string;
  onClose: () => void;
  onGoEdge: () => void;
  addToast: (t: string, s?: string, type?: string) => void;
}

export function DUTDrawer({ id, onClose, onGoEdge, addToast }: DUTDrawerProps) {
  const d = DATA.duts.find(x => x.id === id) || DATA.duts[0];
  return (
    <>
      <div className="to-drawer-h">
        <div style={{width:46,height:46,borderRadius:12,background:"var(--brand-dim)",display:"grid",placeItems:"center"}}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.6"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="15" y="15" width="3" height="3"/><rect x="19" y="15" width="2" height="3"/><rect x="15" y="19" width="6" height="2"/></svg>
        </div>
        <div style={{flex:1}}>
          <div style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--brand)"}}>{d.id}</div>
          <div style={{fontFamily:"var(--disp)",fontSize:18,fontWeight:700}}>{d.name}</div>
          <div className="to-row" style={{gap:8,marginTop:6}}>
            <span className={`to-chip ${d.status}`}><span className={`to-dot ${d.status}`} />{d.statusLabel}</span>
            <span className="to-chip mute">{d.type}</span>
          </div>
        </div>
        <button className="to-drawer-x" onClick={onClose}>{CLOSE_ICON}</button>
      </div>
      <div className="to-drawer-b">
        <div className="to-row" style={{gap:9,marginBottom:18}}>
          <button className="to-btn primary sm" onClick={() => { onClose(); onGoEdge(); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="3" width="20" height="5" rx="1.5"/><rect x="2" y="10" width="20" height="5" rx="1.5"/><rect x="2" y="17" width="20" height="4" rx="1.5"/></svg>
            View bench
          </button>
          <button className="to-btn ghost sm" onClick={() => addToast("Booking opened","Select a campaign and date range")}>Book to campaign</button>
          <button className="to-btn ghost sm" onClick={() => addToast("QR tag","Printable tag generated","info")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            QR tag
          </button>
        </div>
        <span className="to-eyebrow">Specifications</span>
        <div style={{marginTop:10}}>
          <div className="to-spec"><span className="k">test bed</span><span className="v mono">{d.bed}</span></div>
          <div className="to-spec"><span className="k">uptime (90d)</span><span className="v mono" style={{color:d.uptime<90?"var(--bad)":"var(--ink)"}}>{d.uptime}%</span></div>
          <div className="to-spec"><span className="k">firmware</span><span className="v mono">{d.fw}</span></div>
          <div className="to-spec"><span className="k">temperature</span><span className="v mono" style={{color:d.temp>70?"var(--bad)":d.temp>55?"var(--warn)":"var(--ink)"}}>{d.temp}°C</span></div>
          <div className="to-spec"><span className="k">owner</span><span className="v">{d.owner}</span></div>
          <div className="to-spec"><span className="k">next calibration</span><span className="v mono">{d.cal}</span></div>
        </div>
        <span className="to-eyebrow" style={{display:"block",marginTop:22}}>Device history</span>
        <div className="to-tl" style={{marginTop:14}}>
          <div className="to-tl-item warn"><div className="t">Calibration scheduled</div><div className="d">2026-06-18</div></div>
          <div className="to-tl-item"><div className="t">Booked to CMP-201 · CAN-Stack Regression</div><div className="d">A. Kovalenko · 2026-06-09 09:42</div></div>
          <div className="to-tl-item bad"><div className="t">Firmware rollback after failed self-test</div><div className="d">2026-05-22</div></div>
          <div className="to-tl-item ok"><div className="t">Repair completed — connector reseated</div><div className="d">vendor RMA · 2026-04-30</div></div>
          <div className="to-tl-item ok"><div className="t">Registered &amp; QR-tagged</div><div className="d">PO-8842 · 2025-11-12</div></div>
        </div>
        <span className="to-eyebrow" style={{display:"block",marginTop:22}}>Documentation</span>
        <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:8}}>
          {DOCS.map(f => (
            <div key={f} className="to-row" style={{gap:10,padding:"10px 12px",border:"1px solid var(--line)",borderRadius:9}}>
              {FILE_ICON}<span style={{fontSize:12.5}}>{f}</span>
              <span style={{marginLeft:"auto",color:"var(--ink-3)"}}>{DOWN_ICON}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

interface AssetDrawerProps {
  tag: string;
  assets: Asset[];
  onClose: () => void;
  onCheckout: (tags: string[]) => void;
  onCheckin: (tag: string) => void;
  onEdit?: (tag: string) => void;
  addToast: (t: string, s?: string, type?: string) => void;
}

export function AssetDrawer({ tag, assets, onClose, onCheckout, onCheckin, onEdit, addToast }: AssetDrawerProps) {
  const [qrOpen, setQrOpen] = useState(false);
  const a = assets.find(x => x.tag === tag);
  if (!a) return null;
  const st = STATUS_MAP[a.status] || {c:"mute",l:a.status};

  // EOL / warranty helpers
  const daysUntil = (dateStr?: string) => {
    if (!dateStr || dateStr === "—") return null;
    const diff = (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return Math.round(diff);
  };
  const warrantyDays = daysUntil(a.warrantyExpiry);
  const eolDays = daysUntil(a.eolDate);
  const warrantyAlert = warrantyDays !== null && warrantyDays < 90;
  const eolAlert = eolDays !== null && eolDays < 365;
  return (
    <>
      <div className="to-drawer-h">
        <div style={{width:46,height:46,borderRadius:12,background:"var(--brand-dim)",display:"grid",placeItems:"center"}}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="15" y="15" width="3" height="3"/><rect x="19" y="15" width="2" height="3"/><rect x="15" y="19" width="6" height="2"/></svg>
        </div>
        <div style={{flex:1}}>
          <div style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--brand)"}}>#{ a.tag}</div>
          <div style={{fontFamily:"var(--disp)",fontSize:18,fontWeight:700}}>{a.name !== "—" ? a.name : a.model}</div>
          <div className="to-row" style={{gap:8,marginTop:6}}>
            <span className={`to-chip ${st.c}`}>{a.status !== "archived" && <span className={`to-dot ${st.c === "mute" ? "low" : st.c}`} />}{st.l}</span>
            <span className="to-chip mute">{a.cat}</span>
          </div>
        </div>
        <button className="to-drawer-x" onClick={onClose}>{CLOSE_ICON}</button>
      </div>
      <div className="to-drawer-b">
        <div className="to-row" style={{gap:9,marginBottom:18}}>
          {a.status === "ready" && <button className="to-btn primary sm" onClick={() => { onClose(); onCheckout([a.tag]); }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 12h14M13 6l6 6-6 6"/></svg> Checkout</button>}
          {a.status === "deployed" && <button className="to-btn accent sm" onClick={() => { onClose(); onCheckin(a.tag); }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M19 12H5M11 18l-6-6 6-6"/></svg> Checkin</button>}
          <button className="to-btn ghost sm" onClick={() => { onEdit ? (onClose(), onEdit(tag)) : addToast("Edit","Opening edit form…","info"); }}>Edit</button>
          <button className="to-btn ghost sm" onClick={() => setQrOpen(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            QR tag
          </button>
        </div>

        {/* EOL / Warranty alerts */}
        {(warrantyAlert || eolAlert) && (
          <div style={{marginBottom:14,display:"flex",flexDirection:"column",gap:6}}>
            {warrantyAlert && (
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:warrantyDays! < 30 ? "var(--bad-dim)" : "var(--warn-dim)",border:`1px solid ${warrantyDays! < 30 ? "rgba(235,87,87,.3)" : "rgba(242,201,76,.3)"}`,borderRadius:8}}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={warrantyDays! < 30 ? "var(--bad)" : "var(--warn)"} strokeWidth="2"><path d="M12 9v4M12 17h.01"/><circle cx="12" cy="12" r="9"/></svg>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:500,color:warrantyDays! < 30 ? "var(--bad)" : "var(--warn)"}}>Warranty expires {warrantyDays! < 0 ? "EXPIRED" : `in ${warrantyDays} days`}</div>
                  <div style={{fontSize:11,color:"var(--ink-3)",marginTop:1}}>{a.warrantyExpiry}</div>
                </div>
              </div>
            )}
            {eolAlert && (
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:"var(--warn-dim)",border:"1px solid rgba(242,201,76,.3)",borderRadius:8}}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--warn)" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:500,color:"var(--warn)"}}>End of life in {eolDays} days</div>
                  <div style={{fontSize:11,color:"var(--ink-3)",marginTop:1}}>Manufacturer support ends {a.eolDate}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {a.assignee && (
          <div className="to-ai-row" style={{marginBottom:16}}>
            <span className="l">Checked out to</span>
            <span className="r" style={{color:"var(--brand)"}}>{a.assignee}</span>
          </div>
        )}
        <span className="to-eyebrow">Specifications</span>
        <div style={{marginTop:10}}>
          <div className="to-spec"><span className="k">serial</span><span className="v mono">{a.serial}</span></div>
          <div className="to-spec"><span className="k">model</span><span className="v">{a.model}</span></div>
          <div className="to-spec"><span className="k">category</span><span className="v">{a.cat}</span></div>
          <div className="to-spec"><span className="k">default location</span><span className="v">{a.location}</span></div>
          <div className="to-spec"><span className="k">purchase cost</span><span className="v mono">{a.cost}</span></div>
          <div className="to-spec"><span className="k">current value</span><span className="v mono">{a.value}</span></div>
          <div className="to-spec"><span className="k">next audit</span><span className="v mono" style={{color:a.audit?.due?"var(--warn)":"var(--ink)"}}>{a.audit?.date || "—"}</span></div>
        </div>
        <span className="to-eyebrow" style={{display:"block",marginTop:22}}>Custom fields</span>
        <div style={{marginTop:10}}>
          {Object.entries({T: a.cf.tnum, STAR: a.cf.star, Sample: a.cf.sample, "SW version": a.cf.sw, Variant: a.cf.variant, Market: a.cf.market}).map(([k,v]) => (
            <div key={k} className="to-spec"><span className="k">{k}</span><span className="v mono">{v}</span></div>
          ))}
        </div>
        <span className="to-eyebrow" style={{display:"block",marginTop:22}}>Activity history</span>
        <div className="to-tl" style={{marginTop:14}}>
          {a.audit?.due && <div className="to-tl-item warn"><div className="t">Audit due</div><div className="d">{a.audit.date}</div></div>}
          {a.assignee ? <div className="to-tl-item"><div className="t">Checked out to {a.assignee}</div><div className="d">A. Kovalenko · 2026-06-15 09:42</div></div>
            : <div className="to-tl-item ok"><div className="t">Checked in — Ready to Deploy</div><div className="d">P. Bakun · 2026-06-04 10:18</div></div>}
          <div className="to-tl-item"><div className="t">Field update — SW version</div><div className="d">P. Bakun · 2026-06-04 11:38</div></div>
          <div className="to-tl-item ok"><div className="t">Registered &amp; QR-tagged</div><div className="d">import · 2025-11-12</div></div>
        </div>
        <span className="to-eyebrow" style={{display:"block",marginTop:22}}>Lifecycle</span>
        <div style={{marginTop:10}}>
          {a.purchaseDate && <div className="to-spec"><span className="k">purchase date</span><span className="v mono">{a.purchaseDate}</span></div>}
          {a.warrantyExpiry && <div className="to-spec"><span className="k">warranty expiry</span><span className="v mono" style={{color:warrantyAlert?(warrantyDays! < 30 ? "var(--bad)" : "var(--warn)"):"var(--ink)"}}>{a.warrantyExpiry}</span></div>}
          {a.eolDate && <div className="to-spec"><span className="k">end of life</span><span className="v mono" style={{color:eolAlert ? "var(--warn)" : "var(--ink)"}}>{a.eolDate}</span></div>}
          {!a.purchaseDate && !a.warrantyExpiry && !a.eolDate && <div style={{fontSize:12,color:"var(--ink-4)",padding:"4px 0"}}>No lifecycle data recorded</div>}
        </div>
        <span className="to-eyebrow" style={{display:"block",marginTop:22}}>Documentation</span>
        <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:8}}>
          {["Datasheet.pdf","Calibration certificate.pdf","Wiring schematic.pdf"].map(f => (
            <div key={f} className="to-row" style={{gap:10,padding:"10px 12px",border:"1px solid var(--line)",borderRadius:9}}>
              {FILE_ICON}<span style={{fontSize:12.5}}>{f}</span>
              <span style={{marginLeft:"auto",color:"var(--ink-3)"}}>{DOWN_ICON}</span>
            </div>
          ))}
        </div>
      </div>
      <QRModal tag={a.tag} name={a.name !== "—" ? a.name : a.model} open={qrOpen} onClose={() => setQrOpen(false)} />
    </>
  );
}
