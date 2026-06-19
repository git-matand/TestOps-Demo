import { DATA } from "../data";

export function Admin() {
  return (
    <div className="to-screen">
      <div className="to-page-head">
        <div>
          <div className="to-kicker">Users &amp; Permissions</div>
          <h1>Users &amp; Audit</h1>
          <div className="lede" style={{color:"var(--ink-2)",fontSize:13,marginTop:5}}>Role-based access · full audit trail of who changed what and when</div>
        </div>
        <button className="to-btn primary sm">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 5v14M5 12h14"/></svg>
          Invite user
        </button>
      </div>

      <div className="to-grid to-g12">
        <div className="to-s5">
          <div className="to-panel">
            <div className="to-panel-h">
              <h3>Roles</h3>
              <span style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--ink-3)"}}>16 members</span>
            </div>
            <div className="to-panel-b" style={{display:"flex",flexDirection:"column",gap:10}}>
              {DATA.roles.map(r => (
                <div key={r.name} style={{border:"1px solid var(--line)",borderRadius:10,padding:"13px 14px"}}>
                  <div className="to-row to-between">
                    <div style={{fontWeight:600,fontSize:13.5}}>{r.name}</div>
                    <span className="to-chip mute">{r.who} {r.who===1?"member":"members"}</span>
                  </div>
                  <div style={{fontSize:12.5,color:"var(--ink-2)",marginTop:5}}>{r.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="to-s7">
          <div className="to-panel">
            <div className="to-panel-h">
              <h3>Audit log</h3>
              <div className="to-search-mini" style={{maxWidth:200}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
                <input placeholder="Filter events…" />
              </div>
            </div>
            <table className="to-tbl">
              <thead><tr><th>When</th><th>User</th><th>Action</th></tr></thead>
              <tbody>
                {DATA.auditLog.map((a, i) => (
                  <tr key={i}>
                    <td style={{fontFamily:"var(--mono)",fontSize:12,color:"var(--ink-3)",whiteSpace:"nowrap"}}>{a.when}</td>
                    <td>
                      <div style={{fontWeight:500}}>{a.who}</div>
                      <div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--ink-3)"}}>{a.role}</div>
                    </td>
                    <td>{a.act}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
