import { useState } from "react";
import { DATA } from "../data";
import { CampaignSimulator } from "./AIInsights";
import { useRole } from "../roleContext";

interface Props {
  addToast: (t: string, s?: string, type?: string) => void;
}

const COLS = [
  {key:"planned" as const, label:"Planned", dot:"low"},
  {key:"progress" as const, label:"In Progress", dot:"mid"},
  {key:"completed" as const, label:"Completed", dot:"ok"},
  {key:"report" as const, label:"Report", dot:"brand"},
];

const DAYS = ["Mon 16","Tue 17","Wed 18","Thu 19","Fri 20","Sat 21","Sun 22"];
const RESOURCES: [string, number[]][] = [
  ["TB-01",[1,1,1,0,0,0,1]],["TB-05",[1,1,1,1,1,0,0]],["TB-09",[2,2,0,0,0,0,0]],
  ["DUT-22 (HiL)",[1,1,0,1,1,0,0]],["K. Nowak",[0,1,1,1,0,0,0]],["S. Marek",[1,1,1,0,0,1,0]],
];

export function Campaigns({ addToast }: Props) {
  const { can } = useRole();
  const mayEdit = can("campaign.edit"); // Manager + Test Engineer
  const [simOpen, setSimOpen] = useState(false);

  return (
    <>
    <div className="to-screen">
      <div className="to-page-head">
        <div>
          <div className="to-kicker">Campaign Management</div>
          <h1>Campaigns</h1>
          <div className="lede" style={{color:"var(--ink-2)",fontSize:13,marginTop:5}}>Plan, schedule and resource test campaigns · linked to Jira · Jenkins · TestRail · GitLab CI</div>
        </div>
        <div className="to-head-actions">
          <div className="to-row" style={{gap:6,marginRight:6}}>
            {["Jira","Jenkins","TestRail"].map((s,i) => (
              <span key={s} className="to-ibadge"><span className="sd" style={{background:i===2?"var(--warn)":"var(--ok)"}} />{s}</span>
            ))}
          </div>
          <button className="to-btn ghost sm" onClick={() => setSimOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
            Simulate
          </button>
          <button className="to-btn primary sm" onClick={() => mayEdit && addToast("New campaign","Opening campaign builder…","info")} disabled={!mayEdit}
            title={mayEdit ? undefined : "Requires Manager or Test Engineer role"} style={{ opacity: mayEdit ? 1 : 0.45, cursor: mayEdit ? "pointer" : "not-allowed" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 5v14M5 12h14"/></svg>
            New campaign
          </button>
        </div>
      </div>


      <div className="to-kanban">
        {COLS.map(col => (
          <div key={col.key} className="to-kcol">
            <div className="to-kcol-h">
              <span className={`to-dot ${col.dot}`} />
              <span className="nm">{col.label}</span>
              <span className="ct">{DATA.campaigns[col.key].length}</span>
            </div>
            <div className="to-kcol-b">
              {DATA.campaigns[col.key].map(c => (
                <div key={c.id} className="to-kcard" onClick={() => addToast("Campaign " + c.id, "Opening campaign detail…","info")}>
                  <div className="to-row to-between">
                    <span className="kid">{c.id}</span>
                    {c.risk && <span className="to-chip bad" style={{fontSize:9,padding:"1px 7px"}}><span className="to-dot bad" />delayed</span>}
                  </div>
                  <div className="ktitle">{c.title}</div>
                  {c.prog > 0 && c.prog < 100 && (
                    <div className="prog"><i style={{width:`${c.prog}%`}} /></div>
                  )}
                  <div className="kfoot">
                    <div className="to-avatars"><span className="a">{c.owner}</span></div>
                    <span>· {c.beds} bed{c.beds>1?"s":""} · {c.duts} DUTs</span>
                    <span style={{marginLeft:"auto"}} className="to-chip mute">{c.integ}</span>
                  </div>
                  <div className="kfoot" style={{marginTop:6}}>{c.due}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="to-panel" style={{marginTop:18}}>
        <div className="to-panel-h">
          <span className="to-eyebrow">Next 7 days · resource availability</span>
          <div className="to-legend">
            <span><i style={{background:"var(--brand)"}} />booked</span>
            <span><i style={{background:"var(--panel-3)"}} />free</span>
            <span><i style={{background:"var(--warn)"}} />maintenance</span>
          </div>
        </div>
        <div className="to-panel-b" style={{overflowX:"auto"}}>
          <div style={{minWidth:640}}>
            <div style={{display:"grid",gridTemplateColumns:"130px repeat(7,1fr)",gap:4,marginBottom:8}}>
              <div />
              {DAYS.map(d => <div key={d} style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--ink-3)",textAlign:"center"}}>{d}</div>)}
            </div>
            {RESOURCES.map(([nm, days]) => (
              <div key={nm} style={{display:"grid",gridTemplateColumns:"130px repeat(7,1fr)",gap:4,marginBottom:4,alignItems:"center"}}>
                <div style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--ink-2)"}}>{nm}</div>
                {days.map((s, i) => (
                  <div key={i} style={{height:26,borderRadius:6,background:s===1?"var(--brand-dim)":s===2?"var(--warn-dim)":"var(--panel-2)",border:`1px solid ${s===1?"rgba(74,71,201,.3)":s===2?"rgba(236,154,30,.3)":"var(--line)"}`}} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Campaign Simulator modal */}
    {simOpen && (
      <div
        style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", backdropFilter:"blur(4px)", zIndex:1100, overflowY:"auto", padding:"24px 20px" }}
        onClick={e => e.target === e.currentTarget && setSimOpen(false)}
      >
        <div style={{ maxWidth:980, margin:"0 auto", background:"var(--panel)", borderRadius:14, border:"1px solid var(--line-2)", boxShadow:"0 24px 64px rgba(0,0,0,.35)" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 24px 0" }}>
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:"var(--ink-4)", textTransform:"uppercase", letterSpacing:".07em", marginBottom:4 }}>Campaign Planning</div>
              <div style={{ fontSize:18, fontWeight:660, color:"var(--ink)" }}>Campaign Simulator</div>
            </div>
            <button onClick={() => setSimOpen(false)}
              style={{ width:32, height:32, borderRadius:8, border:"1px solid var(--line-2)", background:"var(--panel-2)", display:"grid", placeItems:"center", cursor:"pointer", color:"var(--ink-3)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div style={{ padding:"16px 24px 24px" }}>
            <CampaignSimulator />
          </div>
        </div>
      </div>
    )}
    </>
  );
}
