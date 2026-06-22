// @ts-ignore – react-simple-maps has no bundled types
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { useState } from "react";
import { TestCenter, TestBench } from "../data";

// ─── Constants ────────────────────────────────────────────────────────────────
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const META: Record<string, { utilization: number; campaigns: number }> = {
  "TC-MUC": { utilization: 78, campaigns: 4 },
  "TC-STR": { utilization: 45, campaigns: 2 },
  "TC-WAW": { utilization: 52, campaigns: 2 },
};

// Hardcoded status colors (CSS variables don't resolve in SVG fill= attributes)
const STATUS = {
  ok:   { fill: "#1A9648", glow: "rgba(26,150,72,.18)",  label: "Operational" },
  warn: { fill: "#B8860B", glow: "rgba(184,134,11,.18)", label: "Degraded"    },
  bad:  { fill: "#C0392B", glow: "rgba(192,57,43,.18)",  label: "Issues"      },
} as const;
type StatusKey = keyof typeof STATUS;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calcAvail(center: TestCenter, benches: TestBench[]) {
  const cb = benches.filter(b => center.benchIds.includes(b.id));
  if (!cb.length) return 0;
  return Math.round((cb.filter(b => b.status === "Up").length / cb.length) * 100);
}

function pinStatus(pct: number): StatusKey {
  if (pct >= 80) return "ok";
  if (pct >= 50) return "warn";
  return "bad";
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────
function Tooltip({
  center, benches, x, y,
}: { center: TestCenter; benches: TestBench[]; x: number; y: number }) {
  const pct    = calcAvail(center, benches);
  const key    = pinStatus(pct);
  const st     = STATUS[key];
  const meta   = META[center.id] ?? { utilization: 60, campaigns: 1 };
  const cb     = benches.filter(b => center.benchIds.includes(b.id));
  const upCt   = cb.filter(b => b.status === "Up").length;

  // Clamp so tooltip doesn't escape the viewport
  const ttW = 220;
  const left = Math.min(x + 16, window.innerWidth - ttW - 8);
  const top  = y - 20;

  return (
    <div style={{
      position: "fixed",
      left, top,
      transform: "translateY(-100%)",
      width: ttW,
      background: "var(--panel)",
      border: "1px solid var(--line-2)",
      borderLeft: `3px solid ${st.fill}`,
      borderRadius: 10,
      padding: "12px 14px",
      boxShadow: "0 8px 32px rgba(0,0,0,.22)",
      pointerEvents: "none",
      zIndex: 9999,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
        <span style={{
          width: 7, height: 7, borderRadius: "50%",
          background: st.fill, display: "inline-block",
          flexShrink: 0, marginTop: 4,
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 660, color: "var(--ink)", lineHeight: 1.25 }}>{center.name}</div>
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 1 }}>{center.city}, {center.country}</div>
        </div>
        <span style={{
          flexShrink: 0, fontSize: 10, fontWeight: 600, padding: "2px 6px",
          borderRadius: 4, background: `${st.fill}22`, color: st.fill,
        }}>
          {st.label}
        </span>
      </div>

      {/* KPI mini-grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5, marginBottom: 8 }}>
        {[
          { label: "Availability", value: pct + "%",               color: st.fill          },
          { label: "Utilization",  value: meta.utilization + "%",  color: "var(--ink)"     },
          { label: "Campaigns",    value: String(meta.campaigns),  color: "var(--ink)"     },
        ].map(m => (
          <div key={m.label} style={{
            background: "var(--bg)", borderRadius: 6, padding: "6px 5px", textAlign: "center",
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: m.color, lineHeight: 1 }}>{m.value}</div>
            <div style={{ fontSize: 8.5, color: "var(--ink-4)", marginTop: 3, letterSpacing: ".02em" }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Bench strip */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        padding: "6px 8px", background: "var(--bg)", borderRadius: 6,
        fontSize: 11.5, color: "var(--ink-2)",
      }}>
        <span><b style={{ color: "#1A9648" }}>{upCt}</b> Up · <b style={{ color: "var(--ink-3)" }}>{cb.length - upCt}</b> not Up</span>
        <span style={{ color: "var(--ink-4)" }}>{cb.length} benches</span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface Props {
  centers: TestCenter[];
  benches: TestBench[];
  onSelect: (id: string) => void;
}

export function MapView({ centers, benches, onSelect }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const hovered = hoveredId ? centers.find(c => c.id === hoveredId) ?? null : null;

  return (
    <>
      {/* Pulse keyframes */}
      <style>{`
        @keyframes rsm-pulse {
          0%, 100% { opacity: .14; transform: scale(1);   }
          50%       { opacity: .28; transform: scale(1.6); }
        }
        .rsm-pulse {
          animation: rsm-pulse 2.4s ease-in-out infinite;
          transform-origin: center;
          transform-box: fill-box;
          pointer-events: none;
        }
        @keyframes rsm-halo {
          0%, 100% { opacity: .18; }
          50%       { opacity: .32; }
        }
        .rsm-halo {
          animation: rsm-halo 1.2s ease-in-out infinite;
          pointer-events: none;
        }
      `}</style>

      <div
        style={{
          background: "var(--panel)", borderRadius: 12,
          border: "1px solid var(--line)", overflow: "hidden",
          position: "relative",
        }}
        onMouseMove={e => setPos({ x: e.clientX, y: e.clientY })}
      >
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ center: [14, 52.5], scale: 720 }}
          width={900}
          height={520}
          style={{ width: "100%", height: "auto", display: "block" }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }: { geographies: { rsmKey: string; [k: string]: unknown }[] }) =>
              geographies.map(geo => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  style={{
                    default: {
                      fill: "var(--bg-2)",
                      stroke: "var(--line-2)",
                      strokeWidth: 0.45,
                      outline: "none",
                    },
                    hover: { fill: "var(--panel-3)", outline: "none" },
                    pressed: { fill: "var(--panel-3)", outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {centers.map(center => {
            const pct    = calcAvail(center, benches);
            const key    = pinStatus(pct);
            const st     = STATUS[key];
            const isHov  = hoveredId === center.id;
            const isPulse = pct < 80;

            return (
              <Marker
                key={center.id}
                coordinates={[center.lng, center.lat]}
                onMouseEnter={() => setHoveredId(center.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onSelect(center.id)}
              >
                {/* Pulse ring for non-operational */}
                {isPulse && (
                  <circle r={22} fill={st.fill} className="rsm-pulse" />
                )}

                {/* Hover halo */}
                {isHov && (
                  <circle r={20} fill={st.fill} className="rsm-halo" />
                )}

                {/* Shadow drop */}
                <circle r={12} fill="rgba(0,0,0,.12)" cx={1} cy={2} style={{ pointerEvents: "none" }} />

                {/* Main pin */}
                <circle
                  r={11}
                  style={{
                    fill: st.fill,
                    stroke: "var(--panel)",
                    strokeWidth: "2.5px",
                    cursor: "pointer",
                    filter: isHov ? `drop-shadow(0 0 6px ${st.glow})` : undefined,
                    transition: "r .15s",
                  }}
                />

                {/* Pin icon — small dot inside */}
                <circle r={3.5} style={{ fill: "rgba(255,255,255,.75)", pointerEvents: "none" }} />

                {/* City label */}
                <text
                  textAnchor="middle"
                  dy={-19}
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    fill: "var(--ink)",
                    paintOrder: "stroke",
                    stroke: "var(--panel)",
                    strokeWidth: "4px",
                    strokeLinejoin: "round",
                    pointerEvents: "none",
                    userSelect: "none",
                  }}
                >
                  {center.city}
                </text>

                {/* Availability label below city name */}
                <text
                  textAnchor="middle"
                  dy={-8}
                  style={{
                    fontSize: 9.5,
                    fontWeight: 600,
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    fill: st.fill,
                    paintOrder: "stroke",
                    stroke: "var(--panel)",
                    strokeWidth: "3px",
                    strokeLinejoin: "round",
                    pointerEvents: "none",
                    userSelect: "none",
                  }}
                >
                  {pct}%
                </text>
              </Marker>
            );
          })}
        </ComposableMap>

        {/* Legend */}
        <div style={{
          position: "absolute", bottom: 14, left: 14,
          background: "var(--panel)",
          border: "1px solid var(--line-2)",
          borderRadius: 8, padding: "7px 12px",
          display: "flex", gap: 14, alignItems: "center",
          boxShadow: "0 2px 10px rgba(0,0,0,.1)",
        }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: ".06em" }}>
            Status
          </span>
          {(Object.keys(STATUS) as StatusKey[]).map(key => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{
                width: 8, height: 8, borderRadius: "50%",
                background: STATUS[key].fill, display: "inline-block",
              }} />
              <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{STATUS[key].label}</span>
            </div>
          ))}
        </div>

        {/* Click hint */}
        <div style={{
          position: "absolute", bottom: 14, right: 14,
          fontSize: 10.5, color: "var(--ink-4)",
          display: "flex", alignItems: "center", gap: 4,
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M15 3h6v6M14 10l7-7M9 21H3v-6M10 14l-7 7"/>
          </svg>
          Click pin to open center
        </div>
      </div>

      {/* Floating tooltip (outside container to avoid overflow: hidden clip) */}
      {hovered && (
        <Tooltip center={hovered} benches={benches} x={pos.x} y={pos.y} />
      )}
    </>
  );
}
