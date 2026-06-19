import { DATA } from "../data";

const ICONS = [
  '<path d="M3 12h6l2-4 2 8 2-4h6"/>',
  '<path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 4-6"/>',
  '<path d="M9 11l3 3 8-8"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/>',
];

export function Roadmap() {
  return (
    <div className="to-screen">
      <div className="to-page-head">
        <div>
          <div className="to-kicker">Roadmap</div>
          <h1>Future modules</h1>
          <div className="lede" style={{color:"var(--ink-2)",fontSize:13,marginTop:5}}>Planned extensions to the platform — start with what you need today, add modules as you scale.</div>
        </div>
      </div>
      <div className="to-road">
        {DATA.future.map((f, i) => (
          <div key={f.t} className="to-road-card">
            <span className="ph to-chip" style={{position:"absolute",top:18,right:18,background:i<2?"var(--accent-dim)":"rgba(255,255,255,.06)",color:i<2?"var(--accent)":"var(--ink-2)",border:"1px solid transparent"}}>
              {i<2?"Next":"Later"}
            </span>
            <div className="ic">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" dangerouslySetInnerHTML={{__html: ICONS[i]}} />
            </div>
            <h3>{f.t}</h3>
            <p>{f.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
