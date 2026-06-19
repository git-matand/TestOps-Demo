import { DATA, NL_QUERIES, DUT } from "../data";
import { gaugeSVG, areaForecastSVG } from "../utils";

interface AIAnswer { q: string; summary: string; rows?: DUT[] }

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
          <div className="lede" style={{color:"var(--ink-2)",fontSize:13,marginTop:5}}>KPI trend analysis · 30-day forecasting · recommendations · failure prediction · natural-language queries</div>
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
