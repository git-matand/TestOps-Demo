import { DATA } from "../data";

interface Props {
  addToast: (t: string, s?: string, type?: string) => void;
}

export function Reports({ addToast }: Props) {
  return (
    <div className="to-screen">
      <div className="to-page-head">
        <div>
          <div className="to-kicker">Reporting &amp; Analytics</div>
          <h1>Reports</h1>
          <div className="lede" style={{color:"var(--ink-2)",fontSize:13,marginTop:5}}>Automated management reporting · cost per campaign / DUT / project · cost-center tracking</div>
        </div>
        <div className="to-head-actions">
          <button className="to-btn primary sm" onClick={() => addToast("New report","Opening report builder…","info")}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 5v14M5 12h14"/></svg>
            New report
          </button>
        </div>
      </div>

      <div className="to-grid to-g12">
        <div className="to-s7">
          <div className="to-panel">
            <div className="to-panel-h">
              <h3>Scheduled &amp; saved reports</h3>
              <span className="to-chip ok"><span className="to-dot ok" />4 active</span>
            </div>
            <table className="to-tbl">
              <thead><tr><th>Report</th><th>Period</th><th>Schedule / owner</th><th>Export</th></tr></thead>
              <tbody>
                {DATA.reports.map(r => (
                  <tr key={r.name}>
                    <td style={{fontWeight:500}}>{r.name}</td>
                    <td className="to-muted">{r.period}</td>
                    <td style={{fontFamily:"var(--mono)",fontSize:12,color:"var(--ink-3)"}}>{r.owner}</td>
                    <td>
                      <div className="to-row" style={{gap:6}}>
                        {r.fmt.map(f => (
                          <button key={f} className="to-chip mute" style={{cursor:"pointer"}} onClick={() => addToast("Export started",`${f} generating…`,"info")}>{f}</button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="to-s5">
          <div className="to-panel">
            <div className="to-panel-h">
              <span className="to-eyebrow">Quarter to date · cost by cost-center</span>
              <span style={{fontFamily:"var(--disp)",fontSize:14,fontWeight:700}}>€155,400</span>
            </div>
            <div className="to-panel-b">
              {DATA.costs.map(c => (
                <div key={c.cc} className="to-barrow" style={{gridTemplateColumns:"160px 1fr 70px"}}>
                  <div className="nm">{c.cc}</div>
                  <div className="track"><i style={{width:`${c.pct*3}%`,background:"var(--brand)"}} /></div>
                  <div className="pct">{c.cost}</div>
                </div>
              ))}
              <div style={{fontSize:12,color:"var(--ink-2)",marginTop:14,lineHeight:1.5}}>Cost is allocated per campaign-hour of booked equipment plus per-DUT overhead, then rolled up to the project cost-center.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="to-grid to-g12" style={{marginTop:16}}>
        {[["Cost / campaign","€6,890"],["Cost / DUT-month","€341"],["Most expensive","ADAS · €48.2k"]].map(([l,v]) => (
          <div key={l} className="to-s4">
            <div className="to-kpi">
              <div className="lab">{l}</div>
              <div className="val" style={{fontSize:26,marginTop:6}}>{v}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
