import { tempChartSVG } from "../utils";

interface Props {
  addToast: (t: string, s?: string, type?: string) => void;
}

const TEMPS = [58, 60, 63, 66, 70, 74, 79, 83, 87, 89];

export function Edge({ addToast }: Props) {
  return (
    <div className="to-screen">
      <div className="to-page-head">
        <div>
          <div className="to-kicker">Edge Data Collection</div>
          <h1>Edge &amp; Telemetry</h1>
          <div className="lede" style={{color:"var(--ink-2)",fontSize:13,marginTop:5}}>NUC collectors co-located with DUTs · live metrics where the device has no data interface</div>
        </div>
        <div className="to-head-actions">
          <div className="to-search-mini" style={{maxWidth:240}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
            <input defaultValue="EN-04 · TB-04 node" readOnly />
          </div>
        </div>
      </div>

      <div className="to-panel" style={{borderColor:"var(--bad)",background:"var(--bad-dim)",marginBottom:16}}>
        <div className="to-panel-b" style={{display:"flex",gap:12,alignItems:"center"}}>
          <span className="to-dot bad" style={{width:10,height:10}} />
          <div>
            <div style={{fontWeight:600,fontSize:13.5}}>Anomaly — CPU temperature 89°C, threshold (85°C) exceeded</div>
            <div style={{fontFamily:"var(--mono)",fontSize:10.5,color:"var(--ink-2)",marginTop:2}}>Detected 09:38:04 · sustained 6m · 2 unexpected restarts in last 14 days</div>
          </div>
          <button className="to-btn danger sm" style={{marginLeft:"auto"}} onClick={() => addToast("Reset command sent","TB-04 node power-cycling · ~40s to rejoin")}>Reset node</button>
        </div>
      </div>

      <div className="to-grid to-g12">
        <div className="to-s8">
          <div className="to-grid" style={{gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:16}}>
            <div className="to-mt"><div className="lab">CPU temp</div><div className="v" style={{color:"var(--bad)"}}>89<small>°C</small></div></div>
            <div className="to-mt"><div className="lab">CPU load</div><div className="v">97<small>%</small></div></div>
            <div className="to-mt"><div className="lab">Uptime</div><div className="v">0<small>d 02h</small></div></div>
            <div className="to-mt"><div className="lab">Firmware</div><div className="v" style={{fontSize:18}}>v3.1.0</div></div>
          </div>
          <div className="to-panel">
            <div className="to-panel-h">
              <span className="to-eyebrow">CPU temperature · last 10 min · 1s</span>
              <div className="to-row">
                <span className="to-chip mute" style={{cursor:"pointer"}} onClick={() => addToast("Comparison added","Overlaying EN-06 baseline","info")}>compare EN-06</span>
                <span className="to-chip bad">threshold 85°C</span>
              </div>
            </div>
            <div className="to-panel-b" dangerouslySetInnerHTML={{__html: tempChartSVG(TEMPS)}} />
          </div>
        </div>
        <div className="to-s4">
          <div className="to-panel">
            <div className="to-panel-h">
              <h3>Remote control</h3>
              <span className="to-chip ok"><span className="to-dot ok" />Reachable</span>
            </div>
            <div className="to-panel-b">
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <button className="to-rbtn" onClick={() => addToast("Test started","Queue resumed")}>
                  <span className="ri"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5v14l11-7z"/></svg></span>
                  <span>Start test<small>resume queue</small></span>
                </button>
                <button className="to-rbtn warn" onClick={() => addToast("Test stopped","Current run halted")}>
                  <span className="ri"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg></span>
                  <span>Stop test<small>halt current</small></span>
                </button>
                <button className="to-rbtn bad" onClick={() => addToast("Reset command sent","TB-04 node power-cycling · ~40s to rejoin")}>
                  <span className="ri"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg></span>
                  <span>Reset device<small>power cycle</small></span>
                </button>
                <button className="to-rbtn" onClick={() => addToast("Firmware flashing","v3.1.0 → v3.1.2 · do not power off","info")}>
                  <span className="ri"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3v12M8 11l4 4 4-4M5 21h14"/></svg></span>
                  <span>Flash firmware<small>v3.1.0 → v3.1.2</small></span>
                </button>
              </div>
              <div className="to-spec" style={{marginTop:14}}><span className="k">co-located DUT</span><span className="v mono">DUT-04 (ECU)</span></div>
              <div className="to-spec"><span className="k">test bed</span><span className="v mono">TB-04</span></div>
              <div className="to-spec" style={{borderBottom:0}}><span className="k">collector since</span><span className="v mono">2026-05-04</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
