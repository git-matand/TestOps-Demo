import { useState } from "react";
import { TestCenter, TestBench, ASSETS_INITIAL } from "../data";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Props {
  centers: TestCenter[];
  benches: TestBench[];
  onOpenCenter: (id: string) => void;
}

type DetailTab = "overview" | "benches" | "assets" | "teams";

interface NewCenterDraft {
  name: string; city: string; country: string; address: string;
}

// ─── Static mock enrichments ──────────────────────────────────────────────────
const META: Record<string, { utilization: number; campaigns: number; manager: string; since: string }> = {
  "TC-MUC": { utilization: 78, campaigns: 4, manager: "A. Kovalenko", since: "Mar 2024" },
  "TC-STR": { utilization: 45, campaigns: 2, manager: "L. Wójcik",    since: "Sep 2024" },
  "TC-WAW": { utilization: 52, campaigns: 2, manager: "K. Nowak",     since: "Jan 2025" },
};

const TEAMS: Record<string, { initials: string; name: string; role: string; online: boolean }[]> = {
  "TC-MUC": [
    { initials: "AK", name: "A. Kovalenko", role: "Test Manager", online: true  },
    { initials: "LW", name: "L. Wójcik",    role: "Tester",       online: true  },
    { initials: "SM", name: "S. Marek",      role: "Tester",       online: false },
    { initials: "KN", name: "K. Nowak",      role: "Tester",       online: true  },
    { initials: "PB", name: "P. Bakun",      role: "Read-only",    online: false },
    { initials: "WP", name: "W. Pikulski",   role: "Tester",       online: true  },
    { initials: "TG", name: "T. Gryboś",     role: "Read-only",    online: false },
    { initials: "MN", name: "M. Nowacki",    role: "Tester",       online: false },
  ],
  "TC-STR": [
    { initials: "LW", name: "L. Wójcik",  role: "Test Manager", online: true  },
    { initials: "SM", name: "S. Marek",   role: "Tester",       online: true  },
    { initials: "MK", name: "M. Klein",   role: "Tester",       online: false },
    { initials: "RB", name: "R. Bauer",   role: "Tester",       online: true  },
    { initials: "HJ", name: "H. Jäger",   role: "Read-only",    online: false },
  ],
  "TC-WAW": [
    { initials: "KN", name: "K. Nowak",      role: "Test Manager", online: true  },
    { initials: "PB", name: "P. Bakun",      role: "Tester",       online: true  },
    { initials: "WP", name: "W. Pikulski",   role: "Tester",       online: true  },
    { initials: "AS", name: "A. Szymański",  role: "Tester",       online: false },
    { initials: "JK", name: "J. Kowalczyk",  role: "Read-only",    online: false },
    { initials: "EW", name: "E. Wiśniewska", role: "Read-only",    online: false },
  ],
};

const EVENTS: Record<string, { dot: string; text: string; time: string }[]> = {
  "TC-MUC": [
    { dot: "ok",    text: "CAN-Stack regression milestone — 78% complete",         time: "1h ago"  },
    { dot: "brand", text: "Firmware v3.2.1 deployed to TB-178, TB-205, TB-047",    time: "3h ago"  },
    { dot: "warn",  text: "TB-093 taken offline for scheduled maintenance window",  time: "2d ago"  },
  ],
  "TC-STR": [
    { dot: "bad",   text: "TB-146 disk at 99% — 2 coredumps, intervention needed", time: "4h ago"  },
    { dot: "bad",   text: "TB-156 went unreachable — last seen 47 min ago",         time: "47m ago" },
    { dot: "ok",    text: "TB-199 UDS diagnostics campaign completed successfully", time: "1d ago"  },
  ],
  "TC-WAW": [
    { dot: "bad",   text: "TB-022 LIN coredump detected — bench down 9 min ago",   time: "9m ago"  },
    { dot: "warn",  text: "TB-084 CPU 74% · memory 82% — degraded state",          time: "2h ago"  },
    { dot: "ok",    text: "TB-067 Vector Interface upgraded to v3.2.1",             time: "6h ago"  },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const SC: Record<string, string> = {
  Up: "var(--ok)", Down: "var(--bad)", Degraded: "var(--warn)", Maintenance: "var(--low)",
};

function avail(center: TestCenter, benches: TestBench[]) {
  const cb = benches.filter(b => center.benchIds.includes(b.id));
  if (!cb.length) return 0;
  return Math.round((cb.filter(b => b.status === "Up").length / cb.length) * 100);
}

function statusLabel(pct: number) {
  if (pct >= 80) return { label: "Operational", color: "var(--ok)",   dot: "ok"   };
  if (pct >= 50) return { label: "Degraded",    color: "var(--warn)", dot: "warn" };
  return           { label: "Issues",       color: "var(--bad)",  dot: "bad"  };
}

// ─── Shared mini-components ───────────────────────────────────────────────────
function Dot({ c }: { c: string }) {
  return <span style={{ width: 7, height: 7, borderRadius: "50%", background: `var(--${c})`, display: "inline-block", flexShrink: 0 }} />;
}

function Avatar({ initials, size = 32, online }: { initials: string; size?: number; online?: boolean }) {
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: size * .35,
        background: "var(--brand-dim)", color: "var(--brand)",
        display: "grid", placeItems: "center",
        fontSize: size * .36, fontWeight: 600,
      }}>
        {initials}
      </div>
      {online !== undefined && (
        <span style={{
          position: "absolute", bottom: -1, right: -1,
          width: 8, height: 8, borderRadius: "50%",
          background: online ? "var(--ok)" : "var(--ink-4)",
          border: "2px solid var(--panel)",
        }} />
      )}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function CenterCard({
  center, benches, onClick,
}: { center: TestCenter; benches: TestBench[]; onClick: () => void }) {
  const cb      = benches.filter(b => center.benchIds.includes(b.id));
  const pct     = avail(center, benches);
  const st      = statusLabel(pct);
  const meta    = META[center.id] ?? { utilization: 60, campaigns: 1, manager: "—", since: "—" };
  const up      = cb.filter(b => b.status === "Up").length;
  const down    = cb.filter(b => b.status === "Down").length;
  const deg     = cb.filter(b => b.status === "Degraded").length;
  const maint   = cb.filter(b => b.status === "Maintenance").length;

  return (
    <div className="to-s4">
      <div
        onClick={onClick}
        style={{
          background: "var(--panel)", borderRadius: 12,
          border: "1px solid var(--line)",
          borderLeft: `3px solid ${st.color}`,
          cursor: "pointer", overflow: "hidden",
          transition: "box-shadow .15s, transform .15s",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,.12)";
          (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.boxShadow = "";
          (e.currentTarget as HTMLElement).style.transform = "";
        }}
      >
        {/* Header */}
        <div style={{ padding: "16px 18px 12px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 9,
              background: "var(--brand-dim)", color: "var(--brand)",
              display: "grid", placeItems: "center", flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 650, fontSize: 14.5, color: "var(--ink)", lineHeight: 1.25, marginBottom: 2 }}>{center.name}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{center.city}, {center.country}</div>
            </div>
            <span style={{
              flexShrink: 0, display: "flex", alignItems: "center", gap: 4,
              fontSize: 10.5, fontWeight: 600, letterSpacing: ".04em",
              color: st.color, background: `color-mix(in srgb, ${st.color} 12%, transparent)`,
              border: `1px solid color-mix(in srgb, ${st.color} 28%, transparent)`,
              borderRadius: 5, padding: "2px 7px",
            }}>
              <Dot c={st.dot} />{st.label}
            </span>
          </div>

          {/* Metrics row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 14 }}>
            {[
              { label: "Availability", value: pct + "%", color: st.color },
              { label: "Utilization",  value: meta.utilization + "%", color: meta.utilization >= 70 ? "var(--warn)" : "var(--ink)" },
              { label: "Campaigns",    value: String(meta.campaigns), color: "var(--ink)" },
            ].map(m => (
              <div key={m.label} style={{
                background: "var(--bg)", borderRadius: 7, padding: "8px 10px", textAlign: "center",
              }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: m.color, lineHeight: 1.1 }}>{m.value}</div>
                <div style={{ fontSize: 9.5, color: "var(--ink-4)", marginTop: 3, letterSpacing: ".02em" }}>{m.label}</div>
              </div>
            ))}
          </div>

          {/* Bench status strip */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {[["ok", up, "Up"], ["bad", down, "Down"], ["warn", deg, "Degraded"], ["low", maint, "Maint."]].map(([c, n, l]) =>
              Number(n) > 0 ? (
                <span key={String(l)} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: `var(--${c})` }}>
                  <Dot c={String(c)} />{n} {l}
                </span>
              ) : null
            )}
            {cb.length === 0 && <span style={{ fontSize: 11, color: "var(--ink-4)" }}>No benches assigned</span>}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          borderTop: "1px solid var(--line)", padding: "9px 18px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "var(--bg)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar initials={meta.manager.split(" ").map(p => p[0]).join("").slice(0,2)} size={22} />
            <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{meta.manager}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "var(--brand)", fontWeight: 500 }}>
            View details
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── New Center Modal ─────────────────────────────────────────────────────────
function NewCenterModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (d: NewCenterDraft) => void;
}) {
  const [form, setForm] = useState<NewCenterDraft>({ name: "", city: "", country: "Germany", address: "" });
  const valid = form.name.trim() && form.city.trim();

  const set = (k: keyof NewCenterDraft, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.35)", display: "grid", placeItems: "center", zIndex: 1000 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: "var(--panel)", borderRadius: 14, width: 480, maxWidth: "95vw",
        boxShadow: "0 24px 64px rgba(0,0,0,.28)",
        border: "1px solid var(--line-2)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px 14px", borderBottom: "1px solid var(--line)" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 660, color: "var(--ink)" }}>New Test Center</h3>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>Add a new physical test lab location</div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid var(--line-2)", background: "var(--panel-2)", display: "grid", placeItems: "center", color: "var(--ink-3)", cursor: "pointer" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="to-field">
            <label>Center name <span style={{ color: "var(--bad)" }}>*</span></label>
            <input placeholder="e.g. Frankfurt Integration Lab" value={form.name} onChange={e => set("name", e.target.value)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="to-field">
              <label>City <span style={{ color: "var(--bad)" }}>*</span></label>
              <input placeholder="Frankfurt" value={form.city} onChange={e => set("city", e.target.value)} />
            </div>
            <div className="to-field">
              <label>Country</label>
              <select value={form.country} onChange={e => set("country", e.target.value)}>
                {["Germany", "Poland", "Austria", "Czech Republic", "Hungary", "Romania", "USA", "China", "Japan"].map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="to-field">
            <label>Street address</label>
            <input placeholder="e.g. Hanauer Landstraße 126-128" value={form.address} onChange={e => set("address", e.target.value)} />
          </div>
          <div style={{ background: "var(--bg)", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "var(--ink-3)", display: "flex", gap: 8, alignItems: "flex-start" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ flexShrink: 0, marginTop: 1, color: "var(--brand)" }}>
              <circle cx="12" cy="12" r="9"/><path d="M12 16v-5M12 8h.01"/>
            </svg>
            Benches and assets can be assigned to the center after creation.
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 22px 18px", borderTop: "1px solid var(--line)" }}>
          <button className="to-btn ghost sm" onClick={onClose}>Cancel</button>
          <button className="to-btn primary sm" disabled={!valid} onClick={() => { if (valid) onCreate(form); }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            Create center
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail View ──────────────────────────────────────────────────────────────
function DetailView({ center, benches, onBack }: {
  center: TestCenter;
  benches: TestBench[];
  onBack: () => void;
}) {
  const [tab, setTab] = useState<DetailTab>("overview");
  const pct    = avail(center, benches);
  const st     = statusLabel(pct);
  const meta   = META[center.id] ?? { utilization: 60, campaigns: 1, manager: "—", since: "—" };
  const cb     = benches.filter(b => center.benchIds.includes(b.id));
  const assets = ASSETS_INITIAL.filter(a => center.assetTags.includes(a.tag));
  const team   = TEAMS[center.id] ?? [];
  const events = EVENTS[center.id] ?? [];

  const TABS: [DetailTab, string, number | null][] = [
    ["overview", "Overview",   null],
    ["benches",  "Benches",    cb.length],
    ["assets",   "Assets",     assets.length],
    ["teams",    "Teams",      team.length],
  ];

  return (
    <div className="to-screen">
      {/* Back + breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <button
          onClick={onBack}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            height: 30, padding: "0 10px", borderRadius: 6,
            border: "1px solid var(--line-2)", background: "var(--panel-2)",
            color: "var(--ink-2)", fontSize: 12.5, cursor: "pointer",
            transition: "background .1s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "var(--panel-3)")}
          onMouseLeave={e => (e.currentTarget.style.background = "var(--panel-2)")}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Test Centers
        </button>
        <span style={{ color: "var(--ink-4)" }}>/</span>
        <span style={{ fontSize: 13, color: "var(--ink-2)" }}>{center.name}</span>
      </div>

      {/* Hero header */}
      <div style={{
        background: "var(--panel)", borderRadius: 12, border: "1px solid var(--line)",
        borderLeft: `3px solid ${st.color}`, padding: "20px 24px", marginBottom: 20,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: "var(--brand-dim)", color: "var(--brand)",
            display: "grid", placeItems: "center", flexShrink: 0,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>{center.name}</h1>
              <span style={{
                display: "flex", alignItems: "center", gap: 4,
                fontSize: 11, fontWeight: 600, letterSpacing: ".05em",
                color: st.color,
                background: `color-mix(in srgb, ${st.color} 12%, transparent)`,
                border: `1px solid color-mix(in srgb, ${st.color} 28%, transparent)`,
                borderRadius: 5, padding: "2px 7px",
              }}>
                <Dot c={st.dot} />{st.label}
              </span>
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-3)" }}>
              {center.address} · {center.city}, {center.country}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button className="to-btn ghost sm">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 20h4L18 10l-4-4L4 16z"/><path d="M14 6l4 4"/></svg>
              Edit
            </button>
            <button className="to-btn ghost sm">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
            </button>
          </div>
        </div>

        {/* Info strip */}
        <div style={{
          display: "flex", gap: 0, marginTop: 16, flexWrap: "wrap",
          borderTop: "1px solid var(--line)", paddingTop: 14,
        }}>
          {[
            { icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", label: "Manager", value: meta.manager },
            { icon: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01", label: "Benches", value: `${cb.length} total` },
            { icon: "M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16", label: "Assets", value: `${assets.length} registered` },
            { icon: "M12 8v4l3 3M3.05 11a9 9 0 1 0 .5-2.69", label: "Online since", value: meta.since },
            { icon: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2z", label: "Coordinates", value: `${center.lat}°N ${center.lng}°E` },
          ].map((item, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "4px 20px 4px 0", marginRight: 20,
              borderRight: i < 4 ? "1px solid var(--line)" : "none",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="1.7">
                <path d={item.icon}/>
              </svg>
              <div>
                <div style={{ fontSize: 10, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: ".06em" }}>{item.label}</div>
                <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-2)" }}>{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="to-tabs" style={{ marginBottom: 16 }}>
        {TABS.map(([key, label, count]) => (
          <button key={key} className={`to-tab ${tab === key ? "on" : ""}`} onClick={() => setTab(key)}>
            {label}
            {count !== null && (
              <span style={{
                marginLeft: 5, fontSize: 10, padding: "1px 5px", borderRadius: 4,
                background: tab === key ? "var(--brand-dim)" : "var(--panel-3)",
                color: tab === key ? "var(--brand)" : "var(--ink-3)",
                fontWeight: 600,
              }}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview"  && <OverviewTab  center={center} benches={cb} meta={meta} pct={pct} st={st} events={events} assetCount={assets.length} teamCount={team.length} />}
      {tab === "benches"   && <BenchesTab   benches={cb} />}
      {tab === "assets"    && <AssetsTab    assets={assets} />}
      {tab === "teams"     && <TeamsTab     team={team} />}
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ center, benches, meta, pct, st, events, assetCount, teamCount }: {
  center: TestCenter; benches: TestBench[];
  meta: typeof META[string]; pct: number;
  st: { label: string; color: string; dot: string };
  events: typeof EVENTS[string];
  assetCount: number; teamCount: number;
}) {
  const up = benches.filter(b => b.status === "Up").length;
  const kpis = [
    { label: "Bench Availability", value: pct + "%", color: st.color, sub: `${up} of ${benches.length} benches Up` },
    { label: "Bed Utilization",    value: meta.utilization + "%", color: meta.utilization >= 70 ? "var(--warn)" : "var(--ok)", sub: "active test beds" },
    { label: "Active Campaigns",   value: String(meta.campaigns), color: "var(--ink)", sub: "running right now" },
    { label: "Assets",             value: String(assetCount), color: "var(--ink)", sub: `${teamCount} team members` },
  ];

  return (
    <>
      {/* KPI row */}
      <div className="to-grid to-g12" style={{ marginBottom: 16 }}>
        {kpis.map(k => (
          <div key={k.label} className="to-s3">
            <div className="to-kpi">
              <div className="lab">{k.label}</div>
              <div className="val" style={{ color: k.color }}>{k.value}</div>
              <div style={{ fontSize: 10.5, color: "var(--ink-4)", marginTop: 4 }}>{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="to-grid to-g12">
        {/* Bench status breakdown */}
        <div className="to-s8">
          <div className="to-panel">
            <div className="to-panel-h"><span className="to-eyebrow">Bench fleet status</span></div>
            <div className="to-panel-b">
              {benches.length === 0 && (
                <div style={{ fontSize: 13, color: "var(--ink-4)", padding: "12px 0" }}>No benches assigned to this center.</div>
              )}
              {benches.map(b => (
                <div key={b.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 0", borderBottom: "1px solid var(--line)",
                }}>
                  <Dot c={b.status === "Up" ? "ok" : b.status === "Down" ? "bad" : b.status === "Degraded" ? "warn" : "low"} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{b.name}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-4)" }}>{b.id} · {b.location}</div>
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 500, color: SC[b.status] || "var(--ink-3)" }}>{b.status}</span>
                  <div style={{ fontSize: 11, color: "var(--ink-4)", minWidth: 60, textAlign: "right" }}>
                    CPU {b.telemetry.cpuPct}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity feed */}
        <div className="to-s4">
          <div className="to-panel">
            <div className="to-panel-h"><span className="to-eyebrow">Recent activity</span></div>
            <div className="to-panel-b">
              {events.map((e, i) => (
                <div key={i} style={{ display: "flex", gap: 10, paddingBottom: 12, marginBottom: i < events.length - 1 ? 12 : 0, borderBottom: i < events.length - 1 ? "1px solid var(--line)" : "none" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, paddingTop: 2 }}>
                    <Dot c={e.dot} />
                    {i < events.length - 1 && <div style={{ width: 1, flex: 1, background: "var(--line-2)", minHeight: 20 }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.45 }}>{e.text}</div>
                    <div style={{ fontSize: 10.5, color: "var(--ink-4)", marginTop: 3 }}>{e.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Location card */}
          <div className="to-panel" style={{ marginTop: 12 }}>
            <div className="to-panel-b" style={{ paddingTop: 14 }}>
              <div style={{
                background: "var(--bg)", borderRadius: 8, height: 88,
                display: "grid", placeItems: "center",
                border: "1px solid var(--line)", marginBottom: 10,
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="1.4">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", marginBottom: 2 }}>{center.address}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{center.city}, {center.country}</div>
              <div style={{ fontSize: 10.5, color: "var(--ink-4)", marginTop: 4 }}>
                {center.lat}°N · {center.lng}°E
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Benches Tab ──────────────────────────────────────────────────────────────
function BenchesTab({ benches }: { benches: TestBench[] }) {
  return (
    <div className="to-panel">
      <div className="to-panel-h">
        <span className="to-eyebrow">Test Benches</span>
        <span style={{ fontSize: 11, color: "var(--ink-4)" }}>{benches.length} total</span>
      </div>
      <div className="to-panel-b" style={{ padding: 0 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--line)" }}>
              {["Status", "Bench", "Host platform", "CPU", "Disk", "Last change", "Coredumps"].map(h => (
                <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "var(--ink-4)", letterSpacing: ".04em", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {benches.map(b => (
              <tr key={b.id} style={{ borderBottom: "1px solid var(--line)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--bg)")}
                onMouseLeave={e => (e.currentTarget.style.background = "")}
              >
                <td style={{ padding: "10px 14px" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 500, color: SC[b.status] }}>
                    <Dot c={b.status === "Up" ? "ok" : b.status === "Down" ? "bad" : b.status === "Degraded" ? "warn" : "low"} />
                    {b.status}
                  </span>
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <div style={{ fontWeight: 550, color: "var(--ink)" }}>{b.name}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-4)" }}>{b.id}</div>
                </td>
                <td style={{ padding: "10px 14px", color: "var(--ink-2)" }}>
                  {b.hosts.map(h => h.platform).join(", ")}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 52, height: 4, borderRadius: 2, background: "var(--line-2)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${b.telemetry.cpuPct}%`, background: b.telemetry.cpuPct > 80 ? "var(--bad)" : b.telemetry.cpuPct > 60 ? "var(--warn)" : "var(--ok)", borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{b.telemetry.cpuPct}%</span>
                  </div>
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 52, height: 4, borderRadius: 2, background: "var(--line-2)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${b.telemetry.diskPct}%`, background: b.telemetry.diskPct > 85 ? "var(--bad)" : b.telemetry.diskPct > 70 ? "var(--warn)" : "var(--ok)", borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{b.telemetry.diskPct}%</span>
                  </div>
                </td>
                <td style={{ padding: "10px 14px", fontSize: 11.5, color: "var(--ink-3)" }}>{b.lastChange.replace("2026-06-", "Jun ")}</td>
                <td style={{ padding: "10px 14px" }}>
                  {b.coredumps.length > 0
                    ? <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--bad)" }}>{b.coredumps.length} dump{b.coredumps.length > 1 ? "s" : ""}</span>
                    : <span style={{ fontSize: 11.5, color: "var(--ink-4)" }}>—</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {benches.length === 0 && (
          <div style={{ padding: "24px 14px", fontSize: 13, color: "var(--ink-4)", textAlign: "center" }}>
            No benches assigned to this center.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Assets Tab ───────────────────────────────────────────────────────────────
function AssetsTab({ assets }: { assets: ReturnType<typeof ASSETS_INITIAL.filter> }) {
  const STATUS_C: Record<string, string> = {
    deployed: "var(--brand)", ready: "var(--ok)", investigating: "var(--bad)", archived: "var(--ink-4)",
  };
  return (
    <div className="to-panel">
      <div className="to-panel-h">
        <span className="to-eyebrow">Assets</span>
        <span style={{ fontSize: 11, color: "var(--ink-4)" }}>{assets.length} registered</span>
      </div>
      <div className="to-panel-b" style={{ padding: 0 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--line)" }}>
              {["Tag", "Name", "Model", "Category", "Status", "Location"].map(h => (
                <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "var(--ink-4)", letterSpacing: ".04em", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assets.map(a => (
              <tr key={a.tag} style={{ borderBottom: "1px solid var(--line)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--bg)")}
                onMouseLeave={e => (e.currentTarget.style.background = "")}
              >
                <td style={{ padding: "10px 14px" }}>
                  <span style={{ fontFamily: "var(--mono, monospace)", fontSize: 12, color: "var(--ink-3)" }}>#{a.tag}</span>
                </td>
                <td style={{ padding: "10px 14px", fontWeight: 550, color: "var(--ink)" }}>{a.name || "—"}</td>
                <td style={{ padding: "10px 14px", color: "var(--ink-2)" }}>{a.model}</td>
                <td style={{ padding: "10px 14px" }}>
                  <span className="to-chip" style={{ fontSize: 10.5 }}>{a.cat}</span>
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: STATUS_C[a.status] || "var(--ink-3)", textTransform: "capitalize" }}>{a.status}</span>
                </td>
                <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--ink-3)" }}>{a.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {assets.length === 0 && (
          <div style={{ padding: "24px 14px", fontSize: 13, color: "var(--ink-4)", textAlign: "center" }}>
            No assets assigned to this center.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Teams Tab ────────────────────────────────────────────────────────────────
function TeamsTab({ team }: { team: typeof TEAMS[string] }) {
  const online  = team.filter(m => m.online).length;
  const ROLE_C: Record<string, string> = {
    "Test Manager": "var(--brand)", "Tester": "var(--ok)", "Read-only": "var(--ink-3)",
  };

  return (
    <div className="to-grid to-g12">
      <div className="to-s8">
        <div className="to-panel">
          <div className="to-panel-h">
            <span className="to-eyebrow">Team members</span>
            <span style={{ fontSize: 11, color: "var(--ink-4)" }}>{online} online · {team.length} total</span>
          </div>
          <div className="to-panel-b" style={{ padding: 0 }}>
            {team.map((m, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                borderBottom: i < team.length - 1 ? "1px solid var(--line)" : "none",
              }}>
                <Avatar initials={m.initials} size={36} online={m.online} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 550, color: "var(--ink)" }}>{m.name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 1 }}>
                    <span style={{ color: ROLE_C[m.role] || "var(--ink-3)", fontWeight: 500 }}>{m.role}</span>
                  </div>
                </div>
                <span style={{
                  fontSize: 10.5, padding: "2px 8px", borderRadius: 4, fontWeight: 500,
                  background: m.online ? "var(--ok-dim)" : "var(--panel-3)",
                  color: m.online ? "var(--ok)" : "var(--ink-4)",
                }}>
                  {m.online ? "Online" : "Offline"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="to-s4">
        <div className="to-panel">
          <div className="to-panel-h"><span className="to-eyebrow">Roles</span></div>
          <div className="to-panel-b">
            {(["Test Manager", "Tester", "Read-only"] as const).map(role => {
              const count = team.filter(m => m.role === role).length;
              return (
                <div key={role} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: ROLE_C[role], display: "inline-block" }} />
                    <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{role}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{count}</span>
                </div>
              );
            })}
            <button className="to-btn ghost sm" style={{ width: "100%", justifyContent: "center", marginTop: 12 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
              Invite member
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function TestCenters({ centers, benches, onOpenCenter }: Props) {
  const [selected, setSelected]  = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newCenters, setNewCenters] = useState<TestCenter[]>([]);

  const allCenters = [...centers, ...newCenters];

  if (selected) {
    const center = allCenters.find(c => c.id === selected);
    if (center) {
      return (
        <DetailView
          center={center}
          benches={benches}
          onBack={() => setSelected(null)}
        />
      );
    }
  }

  const totalBenches = new Set(allCenters.flatMap(c => c.benchIds)).size;

  return (
    <div className="to-screen">
      {/* Page header */}
      <div className="to-page-head">
        <div>
          <div className="to-kicker">Infrastructure</div>
          <h1>Test Centers</h1>
          <div style={{ color: "var(--ink-2)", fontSize: 13, marginTop: 5 }}>
            {allCenters.length} locations · {totalBenches} benches assigned
          </div>
        </div>
        <div className="to-head-actions">
          <button className="to-btn primary sm" onClick={() => setModalOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            New Center
          </button>
        </div>
      </div>

      {/* Cards grid */}
      <div className="to-grid to-g12">
        {allCenters.map(c => (
          <CenterCard
            key={c.id}
            center={c}
            benches={benches}
            onClick={() => setSelected(c.id)}
          />
        ))}
      </div>

      {/* New Center Modal */}
      {modalOpen && (
        <NewCenterModal
          onClose={() => setModalOpen(false)}
          onCreate={draft => {
            const newId = `TC-${draft.city.slice(0,3).toUpperCase()}`;
            setNewCenters(prev => [...prev, {
              id: newId, name: draft.name, address: draft.address,
              city: draft.city, country: draft.country,
              lat: 0, lng: 0, benchIds: [], assetTags: [],
            }]);
            setModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
