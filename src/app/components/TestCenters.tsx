import { TestCenter, TestBench } from "../data";

interface Props {
  centers: TestCenter[];
  benches: TestBench[];
  onOpenCenter: (id: string) => void;
}

const STATUS_DOT: Record<string, string> = {
  Up: "ok", Down: "bad", Degraded: "warn", Maintenance: "low",
};

export function TestCenters({ centers, benches, onOpenCenter }: Props) {
  return (
    <div className="to-screen">
      <div className="to-page-head">
        <div>
          <div className="to-kicker">Infrastructure</div>
          <h1>Test Centers</h1>
          <div style={{ color: "var(--ink-2)", fontSize: 13, marginTop: 5 }}>
            {centers.length} locations · {benches.length} benches total
          </div>
        </div>
        <div className="to-head-actions">
          <button className="to-btn ghost sm">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>
            </svg>
            Filter
          </button>
        </div>
      </div>

      <div className="to-grid to-g12">
        {centers.map(center => {
          const centerBenches = benches.filter(b => center.benchIds.includes(b.id));
          const upCount = centerBenches.filter(b => b.status === "Up").length;
          const downCount = centerBenches.filter(b => b.status === "Down").length;
          const degradedCount = centerBenches.filter(b => b.status === "Degraded").length;
          const maintCount = centerBenches.filter(b => b.status === "Maintenance").length;
          const availability = centerBenches.length > 0
            ? Math.round((upCount / centerBenches.length) * 100)
            : 0;

          return (
            <div key={center.id} className="to-s4">
              <button
                className="to-panel"
                style={{
                  width: "100%", textAlign: "left", cursor: "pointer",
                  transition: "box-shadow .15s, transform .15s",
                  display: "block", padding: 0,
                }}
                onClick={() => onOpenCenter(center.id)}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 2px var(--brand)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "";
                  (e.currentTarget as HTMLElement).style.transform = "";
                }}
              >
                <div style={{ padding: "18px 20px 14px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: "var(--brand-dim)", color: "var(--brand)",
                      display: "grid", placeItems: "center", flexShrink: 0,
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                      </svg>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)", lineHeight: 1.3 }}>{center.name}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
                        {center.city}, {center.country}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 1 }}>{center.address}</div>
                    </div>
                    <div style={{
                      marginLeft: "auto", flexShrink: 0,
                      fontSize: 22, fontWeight: 700, color: availability >= 90 ? "var(--ok)" : availability >= 70 ? "var(--warn)" : "var(--bad)",
                    }}>
                      {availability}%
                      <div style={{ fontSize: 10, fontWeight: 400, color: "var(--ink-4)", textAlign: "right" }}>avail.</div>
                    </div>
                  </div>

                  <div style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14,
                  }}>
                    <div style={{ background: "var(--bg)", borderRadius: 8, padding: "8px 10px" }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)", lineHeight: 1 }}>{centerBenches.length}</div>
                      <div style={{ fontSize: 10, color: "var(--ink-4)", marginTop: 2 }}>Test Benches</div>
                    </div>
                    <div style={{ background: "var(--bg)", borderRadius: 8, padding: "8px 10px" }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)", lineHeight: 1 }}>{center.assetTags.length}</div>
                      <div style={{ fontSize: 10, color: "var(--ink-4)", marginTop: 2 }}>Assets</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {upCount > 0 && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--ok)" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ok)", display: "inline-block" }} />
                        {upCount} Up
                      </span>
                    )}
                    {downCount > 0 && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--bad)" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--bad)", display: "inline-block" }} />
                        {downCount} Down
                      </span>
                    )}
                    {degradedCount > 0 && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--warn)" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--warn)", display: "inline-block" }} />
                        {degradedCount} Degraded
                      </span>
                    )}
                    {maintCount > 0 && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--ink-3)" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ink-3)", display: "inline-block" }} />
                        {maintCount} Maint.
                      </span>
                    )}
                    {centerBenches.length === 0 && (
                      <span style={{ fontSize: 11, color: "var(--ink-4)" }}>No benches assigned</span>
                    )}
                  </div>
                </div>

                <div style={{
                  borderTop: "1px solid var(--line)",
                  padding: "10px 20px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{center.id}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--brand)", fontWeight: 500 }}>
                    View benches
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </span>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
