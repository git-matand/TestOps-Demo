import { DATA } from "../data";

interface Props {
  onBedClick: (id: string) => void;
  onGoReports: () => void;
  onGoAI: () => void;
  addToast: (t: string, s?: string, type?: string) => void;
}

export function Dashboard({ onBedClick, onGoReports, onGoAI, addToast }: Props) {
  return (
    <div className="to-screen">
      <div className="to-page-head">
        <div>
          <div className="to-kicker">Live Dashboard</div>
          <h1>Operations Overview</h1>
          <div className="lede" style={{color:"var(--ink-2)",fontSize:13,marginTop:5}}>Real-time overview · auto-refresh 30s · last sync 09:47:12</div>
        </div>
        <div className="to-head-actions">
          <span className="to-live-pill"><span className="to-dot live" />LIVE</span>
          <button className="to-btn primary sm" onClick={onGoReports}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3v12M8 11l4 4 4-4M5 21h14"/></svg>
            Export
          </button>
        </div>
      </div>


      {/* KPIs */}
      <div className="to-grid to-g12" style={{marginBottom:16}}>
        {DATA.kpis.map(k => (
          <div key={k.lab} className="to-s3">
            <div className="to-kpi">
              <div className="lab">{k.lab}</div>
              <div className="val">{k.val}<small>{k.unit}</small></div>
              <div className={`to-delta ${k.dir}`}>{k.dir==="up"?"↑":k.dir==="down"?"↓":""} {k.delta}</div>
              {'sub' in k && k.sub && (
                <div style={{fontSize:10.5,color:"var(--ink-4)",marginTop:5,lineHeight:1.3}}>{k.sub}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Heatmap + Campaigns */}
      <div className="to-grid to-g12" style={{marginBottom:16}}>
        <div className="to-s7">
          <div className="to-panel">
            <div className="to-panel-h"><span className="to-eyebrow">Test bed heatmap — utilization</span></div>
            <div className="to-panel-b">
              <div className="to-heat">
                {DATA.beds.map(b => (
                  <button key={b.id} className={`to-bed s-${b.status}`} onClick={() => onBedClick(b.id)}>
                    <div className="load">{'label' in b && b.label ? b.label : b.load + "%"}</div>
                    <div className="bid">{b.id}</div>
                  </button>
                ))}
              </div>
              <div className="to-legend" style={{marginTop:14}}>
                <span><i style={{background:"var(--ok)"}} />High (&gt;80%)</span>
                <span><i style={{background:"var(--mid)"}} />Mid (40–80%)</span>
                <span><i style={{background:"var(--low)"}} />Low (&lt;40%)</span>
                <span><i style={{background:"var(--warn)"}} />Maint.</span>
                <span><i style={{background:"var(--bad)"}} />Error</span>
              </div>
            </div>
          </div>
        </div>
        <div className="to-s5">
          <div className="to-panel">
            <div className="to-panel-h">
              <span className="to-eyebrow">Active campaigns</span>
              <button className="to-btn ghost sm" onClick={() => addToast("Campaigns","Opening campaigns…","info")}>View all</button>
            </div>
            <div className="to-panel-b" style={{paddingTop:4,paddingBottom:4}}>
              {DATA.activeCampaigns.map(c => (
                <div key={c.nm} className="to-acrow">
                  <span className={`to-dot ${c.dot}`} />
                  <span className="nm">{c.nm}</span>
                  <span className="beds">{c.beds}</span>
                  <span className="pct">{c.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Phase bars + Alerts + AI */}
      <div className="to-grid to-g12">
        <div className="to-s4">
          <div className="to-panel">
            <div className="to-panel-h">
              <span className="to-eyebrow">Load per phase</span>
              <span className="to-chip mid">Integration peak</span>
            </div>
            <div className="to-panel-b">
              {DATA.phases.map(p => (
                <div key={p.nm} className="to-barrow">
                  <div className="nm">{p.nm}</div>
                  <div className="track"><i style={{width:`${p.pct}%`,background:p.c}} /></div>
                  <div className="pct" style={{color:p.c}}>{p.pct}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="to-s4">
          <div className="to-panel">
            <div className="to-panel-h">
              <span className="to-eyebrow">Alerts &amp; events</span>
              <span className="to-chip bad">1 critical</span>
            </div>
            <div className="to-panel-b" style={{paddingTop:6,paddingBottom:6}}>
              {DATA.events.map((e, i) => (
                <div key={i} className="to-alert">
                  <span className="ad" style={{background:`var(--${e.dot})`}} />
                  <div style={{minWidth:0}}><div className="ttl">{e.ttl}</div></div>
                  <div className="when">{e.when}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="to-s4">
          <div className="to-panel">
            <div className="to-panel-h">
              <span className="to-eyebrow">AI insights</span>
              <span className="to-chip brand">Powered by AI</span>
            </div>
            <div className="to-panel-b">
              {DATA.aiInsights.map((a, i) => (
                <div key={i} className="to-ai-row">
                  <span className="l">{a.l}</span>
                  <span className="r" style={{color:a.c}}>{a.r}</span>
                </div>
              ))}
              <div className="to-ai-tip"><span>💡</span><span>Reallocate load to TB-07 to reduce overload on TB-05.</span></div>
              <button className="to-btn ghost sm" onClick={onGoAI} style={{width:"100%",justifyContent:"center",marginTop:10}}>Open AI Insights →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
