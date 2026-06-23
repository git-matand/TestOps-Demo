import { useState } from "react";
import { TestCenter, TestBench, Asset, ASSETS_INITIAL, BENCHES_INITIAL, TEST_CENTERS as ALL_CENTERS } from "../data";
import { MapView } from "./MapView";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Props {
  centers: TestCenter[];
  benches: TestBench[];
  onOpenCenter: (id: string) => void;
}

type DetailTab = "overview" | "benches" | "assets" | "teams";

interface NewCenterDraft {
  name: string; city: string; country: string; address: string;
  benchIds: string[]; assetTags: string[]; personIds: string[];
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
          border: "1px solid var(--line-2)",
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

// ─── New Center Modal — 5-step wizard ─────────────────────────────────────────
const MODAL_ENGINEERS = [
  { id:"E1", initials:"AK", name:"Andriy Kovalenko",  role:"Test Manager",    avail:"Available" as const, city:"Munich",    country:"Germany" },
  { id:"E2", initials:"SM", name:"Stefan Marek",       role:"Senior Engineer", avail:"Busy"      as const, city:"Munich",    country:"Germany" },
  { id:"E3", initials:"LW", name:"Lidia Wójcik",       role:"Tester",          avail:"Available" as const, city:"Stuttgart", country:"Germany" },
  { id:"E4", initials:"KN", name:"Kamil Nowak",        role:"DevOps Engineer", avail:"Available" as const, city:"Warsaw",    country:"Poland"  },
  { id:"E5", initials:"PB", name:"Piotr Bakun",        role:"Engineer",        avail:"On Leave"  as const, city:"Warsaw",    country:"Poland"  },
  { id:"E6", initials:"WP", name:"Wojciech Pikulski",  role:"RF Engineer",     avail:"Busy"      as const, city:"Warsaw",    country:"Poland"  },
  { id:"E7", initials:"MK", name:"Martin Klein",       role:"Tester",          avail:"Available" as const, city:"Stuttgart", country:"Germany" },
  { id:"E8", initials:"RB", name:"Rolf Bauer",         role:"Senior Engineer", avail:"Available" as const, city:"Stuttgart", country:"Germany" },
  { id:"E9", initials:"TG", name:"Tobias Gryboś",      role:"Engineer",        avail:"Busy"      as const, city:"Munich",    country:"Germany" },
];
const EXISTING_TEAMS = [
  { id:"TM-1", name:"Munich HiL Team",           city:"Munich",    country:"Germany", memberIds:["E1","E2","E9"] },
  { id:"TM-2", name:"Stuttgart Integration Team", city:"Stuttgart", country:"Germany", memberIds:["E3","E7","E8"] },
  { id:"TM-3", name:"Warsaw Automation Team",     city:"Warsaw",    country:"Poland",  memberIds:["E4","E5","E6"] },
];
const AVAIL_C = { Available:"var(--ok)", Busy:"var(--warn)", "On Leave":"var(--ink-4)" } as const;
const AVAIL_ORDER: Record<string, number> = { Available:0, Busy:1, "On Leave":2 };
const WIZARD_STEPS = ["Location", "Benches", "Assets", "Team", "Summary"] as const;

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div style={{ position:"relative", marginBottom:8 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
        style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)", color:"var(--ink-3)", pointerEvents:"none" }}>
        <circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>
      </svg>
      <input
        value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width:"100%", height:32, borderRadius:6, border:"1px solid var(--line-2)", background:"var(--panel-2)", color:"var(--ink)", fontSize:13, padding:"0 10px 0 30px", boxSizing:"border-box" }}
      />
    </div>
  );
}

function LocBadge({ color, text }: { color: string; text: string }) {
  return (
    <span style={{
      fontSize:10, padding:"1px 6px", borderRadius:4, flexShrink:0, whiteSpace:"nowrap",
      background:`color-mix(in srgb, ${color} 12%, transparent)`,
      color, fontWeight:500,
    }}>{text}</span>
  );
}

function NewCenterModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (d: NewCenterDraft) => void;
}) {
  const [step, setStep]             = useState(1);
  const [name, setName]             = useState("");
  const [city, setCity]             = useState("");
  const [country, setCountry]       = useState("Germany");
  const [address, setAddress]       = useState("");
  const [selBenches, setSelB]       = useState<string[]>([]);
  const [selAssets,  setSelA]       = useState<string[]>([]);
  const [selPeople,  setSelP]       = useState<string[]>([]);
  const [selTeams,   setSelT]       = useState<string[]>([]);
  const [searchB,    setSearchB]    = useState("");
  const [searchA,    setSearchA]    = useState("");
  const [searchP,    setSearchP]    = useState("");
  const [catFilter,  setCatFilter]  = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");
  const [teamTab,    setTeamTab]    = useState<"teams"|"people">("teams");

  const valid1 = name.trim() && city.trim();

  type LocStatus = "same" | "reassign" | "relocate" | "none";
  const locStatus = (ec?: string, ey?: string): LocStatus => {
    if (!ec || !ey) return "none";
    if (ec === city && ey === country) return "same";
    if (ey === country) return "reassign";
    return "relocate";
  };
  const locOrder: Record<LocStatus, number> = { same:0, reassign:1, none:2, relocate:3 };

  const badgeFor = (ec?: string, ey?: string): { text: string; color: string } | null => {
    const s = locStatus(ec, ey);
    if (s === "none") return null;
    if (s === "same") return { text: ec!, color: "var(--ink-3)" };
    if (s === "reassign") return { text: `${ec} · Reassignment needed`, color: "var(--warn)" };
    return { text: `${ec}, ${ey} · Relocation needed`, color: "var(--bad)" };
  };

  const toggleB = (id: string) => setSelB(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleA = (t: string)  => setSelA(p => p.includes(t)  ? p.filter(x => x !== t)  : [...p, t]);
  const toggleP = (id: string) => setSelP(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleT = (teamId: string) => {
    const tm = EXISTING_TEAMS.find(t => t.id === teamId);
    if (!tm) return;
    if (selTeams.includes(teamId)) {
      setSelT(p => p.filter(x => x !== teamId));
      setSelP(p => p.filter(id => !tm.memberIds.includes(id)));
    } else {
      setSelT(p => [...p, teamId]);
      setSelP(p => [...new Set([...p, ...tm.memberIds])]);
    }
  };

  const benchCtr = (id: string)  => ALL_CENTERS.find(c => c.benchIds.includes(id));
  const assetCtr = (tag: string) => ALL_CENTERS.find(c => c.assetTags.includes(tag));

  const benchList = [...BENCHES_INITIAL]
    .filter(b => { const q = searchB.toLowerCase(); return b.id.toLowerCase().includes(q) || b.name.toLowerCase().includes(q); })
    .sort((a, b) => {
      const ca = benchCtr(a.id); const cb = benchCtr(b.id);
      return locOrder[locStatus(ca?.city, ca?.country)] - locOrder[locStatus(cb?.city, cb?.country)];
    });

  const assetCats = ["All", ...Array.from(new Set(ASSETS_INITIAL.filter((a: Asset) => a.status !== "archived").map((a: Asset) => a.cat)))];
  const assetList = [...ASSETS_INITIAL]
    .filter((a: Asset) => a.status !== "archived")
    .filter((a: Asset) => {
      const q = searchA.toLowerCase();
      return (catFilter === "All" || a.cat === catFilter) &&
        (a.tag.includes(searchA) || (a.model ?? "").toLowerCase().includes(q) || (a.cat ?? "").toLowerCase().includes(q));
    })
    .sort((a: Asset, b: Asset) => {
      const ca = assetCtr(a.tag); const cb = assetCtr(b.tag);
      return locOrder[locStatus(ca?.city, ca?.country)] - locOrder[locStatus(cb?.city, cb?.country)];
    });

  const roles = ["All", ...Array.from(new Set(MODAL_ENGINEERS.map(e => e.role)))];
  const peopleList = [...MODAL_ENGINEERS]
    .filter(e => {
      const q = searchP.toLowerCase();
      return (roleFilter === "All" || e.role === roleFilter) &&
        (e.name.toLowerCase().includes(q) || e.role.toLowerCase().includes(q));
    })
    .sort((a, b) => AVAIL_ORDER[a.avail] - AVAIL_ORDER[b.avail]);

  const teamsForCity = [...EXISTING_TEAMS].sort((a, b) => {
    const sa = a.city === city ? 0 : a.country === country ? 1 : 2;
    const sb = b.city === city ? 0 : b.country === country ? 1 : 2;
    return sa - sb;
  });

  function handleCreate() {
    if (!valid1) return;
    onCreate({ name, city, country, address, benchIds: selBenches, assetTags: selAssets, personIds: selPeople });
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.4)", display:"grid", placeItems:"center", zIndex:1000 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background:"var(--panel)", borderRadius:14, width:540, maxWidth:"95vw",
        maxHeight:"88vh", display:"flex", flexDirection:"column",
        boxShadow:"0 24px 64px rgba(0,0,0,.28)", border:"1px solid var(--line-2)",
      }}>
        {/* Header + stepper */}
        <div style={{ padding:"18px 22px 14px", borderBottom:"1px solid var(--line)" }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:14 }}>
            <div>
              <h3 style={{ margin:0, fontSize:16, fontWeight:660, color:"var(--ink)" }}>New Test Center</h3>
              <div style={{ fontSize:12, color:"var(--ink-3)", marginTop:2 }}>Step {step} of 5 — {WIZARD_STEPS[step - 1]}</div>
            </div>
            <button onClick={onClose} style={{ width:28, height:28, borderRadius:6, border:"1px solid var(--line-2)", background:"var(--panel-2)", display:"grid", placeItems:"center", color:"var(--ink-3)", cursor:"pointer", flexShrink:0 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div style={{ display:"flex", gap:6 }}>
            {WIZARD_STEPS.map((label, i) => (
              <div key={i} style={{ flex:1 }}>
                <div style={{ height:3, borderRadius:2, marginBottom:4, background: i + 1 <= step ? "var(--brand)" : "var(--panel-3)" }} />
                <div style={{ fontSize:10, color: i + 1 === step ? "var(--brand)" : "var(--ink-4)", fontWeight: i + 1 === step ? 600 : 400 }}>
                  {label}
                  {i === 1 && selBenches.length > 0 && <span style={{ marginLeft:4, fontWeight:600, color:"var(--ink)" }}>{selBenches.length}</span>}
                  {i === 2 && selAssets.length  > 0 && <span style={{ marginLeft:4, fontWeight:600, color:"var(--ink)" }}>{selAssets.length}</span>}
                  {i === 3 && selPeople.length  > 0 && <span style={{ marginLeft:4, fontWeight:600, color:"var(--ink)" }}>{selPeople.length}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:"auto", padding:"16px 22px" }}>

          {/* ── Step 1: Location ── */}
          {step === 1 && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div className="to-field">
                <label>Center name <span style={{ color:"var(--bad)" }}>*</span></label>
                <input placeholder="e.g. Frankfurt Integration Lab" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div className="to-field">
                  <label>Country</label>
                  <select value={country} onChange={e => setCountry(e.target.value)}>
                    {["Germany","Poland","Austria","Czech Republic","Hungary","Romania","USA","China","Japan"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="to-field">
                  <label>City <span style={{ color:"var(--bad)" }}>*</span></label>
                  <input placeholder="Frankfurt" value={city} onChange={e => setCity(e.target.value)} />
                </div>
              </div>
              <div className="to-field">
                <label>Street address</label>
                <input placeholder="e.g. Hanauer Landstraße 126-128" value={address} onChange={e => setAddress(e.target.value)} />
              </div>
            </div>
          )}

          {/* ── Step 2: Benches ── */}
          {step === 2 && (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <div style={{ fontSize:13, color:"var(--ink-2)", marginBottom:4 }}>
                Select test benches to assign to this center.
                {selBenches.length > 0 && <b style={{ color:"var(--ink)", marginLeft:5 }}>{selBenches.length} selected</b>}
              </div>
              <SearchInput value={searchB} onChange={setSearchB} placeholder="Search benches…" />
              {benchList.map(b => {
                const bc = benchCtr(b.id);
                const badge = badgeFor(bc?.city, bc?.country);
                const isChecked = selBenches.includes(b.id);
                return (
                  <label key={b.id} style={{
                    display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:8,
                    border:`1px solid ${isChecked ? "var(--brand)" : "var(--line-2)"}`,
                    background: isChecked ? "var(--brand-dim)" : "var(--panel-2)",
                    cursor:"pointer", transition:"all .1s",
                  }}>
                    <input type="checkbox" checked={isChecked} onChange={() => toggleB(b.id)}
                      style={{ accentColor:"var(--brand)", width:15, height:15, flexShrink:0 }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:550, color:"var(--ink)" }}>{b.name}</div>
                      <div style={{ fontSize:11, color:"var(--ink-3)" }}>{b.id} · {b.location}</div>
                    </div>
                    {badge && <LocBadge {...badge} />}
                    <span style={{ fontSize:11, fontWeight:500, color:SC[b.status] || "var(--ink-3)", whiteSpace:"nowrap" }}>{b.status}</span>
                  </label>
                );
              })}
              {benchList.length === 0 && <div style={{ fontSize:13, color:"var(--ink-4)", textAlign:"center", padding:"20px 0" }}>No benches match.</div>}
            </div>
          )}

          {/* ── Step 3: Assets ── */}
          {step === 3 && (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <div style={{ fontSize:13, color:"var(--ink-2)", marginBottom:4 }}>
                Assign assets to this center.
                {selAssets.length > 0 && <b style={{ color:"var(--ink)", marginLeft:5 }}>{selAssets.length} selected</b>}
              </div>
              <div style={{ display:"flex", gap:8, marginBottom:0 }}>
                <div style={{ flex:1 }}><SearchInput value={searchA} onChange={setSearchA} placeholder="Search assets…" /></div>
                <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                  style={{ height:32, borderRadius:6, border:"1px solid var(--line-2)", background:"var(--panel-2)", color:"var(--ink)", fontSize:12, padding:"0 8px", flexShrink:0 }}>
                  {assetCats.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              {assetList.map((a: Asset) => {
                const ac = assetCtr(a.tag);
                const badge = badgeFor(ac?.city, ac?.country);
                const isChecked = selAssets.includes(a.tag);
                return (
                  <label key={a.tag} style={{
                    display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:8,
                    border:`1px solid ${isChecked ? "var(--brand)" : "var(--line-2)"}`,
                    background: isChecked ? "var(--brand-dim)" : "var(--panel-2)",
                    cursor:"pointer", transition:"all .1s",
                  }}>
                    <input type="checkbox" checked={isChecked} onChange={() => toggleA(a.tag)}
                      style={{ accentColor:"var(--brand)", width:15, height:15, flexShrink:0 }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:550, color:"var(--ink)" }}>{a.model}</div>
                      <div style={{ fontSize:11, color:"var(--ink-3)" }}>#{a.tag} · {a.cat}</div>
                    </div>
                    {badge && <LocBadge {...badge} />}
                    <span style={{ fontSize:11, fontWeight:500, color:"var(--ink-3)", whiteSpace:"nowrap", textTransform:"capitalize" }}>{a.status}</span>
                  </label>
                );
              })}
              {assetList.length === 0 && <div style={{ fontSize:13, color:"var(--ink-4)", textAlign:"center", padding:"20px 0" }}>No assets match.</div>}
            </div>
          )}

          {/* ── Step 4: Team ── */}
          {step === 4 && (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <span style={{ fontSize:13, color:"var(--ink-2)" }}>Assign team members to this center.</span>
                {selPeople.length > 0 && (
                  <span style={{ fontSize:12, fontWeight:600, color:"var(--brand)", background:"var(--brand-dim)", padding:"2px 9px", borderRadius:5 }}>
                    {selPeople.length} selected
                  </span>
                )}
              </div>
              {/* Sub-tabs */}
              <div style={{ display:"flex", borderBottom:"1px solid var(--line)", marginBottom:4 }}>
                {(["teams","people"] as const).map(t => (
                  <button key={t} onClick={() => setTeamTab(t)} style={{
                    padding:"6px 14px", fontSize:12.5, fontWeight:teamTab === t ? 600 : 400,
                    color:teamTab === t ? "var(--brand)" : "var(--ink-3)",
                    background:"none", border:"none", borderBottom:`2px solid ${teamTab === t ? "var(--brand)" : "transparent"}`,
                    cursor:"pointer", marginBottom:-1,
                  }}>{t === "teams" ? "Existing teams" : "Individual people"}</button>
                ))}
              </div>

              {teamTab === "teams" && (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {teamsForCity.map(team => {
                    const isSelected = selTeams.includes(team.id);
                    const tb = badgeFor(team.city, team.country);
                    const members = team.memberIds.map(id => MODAL_ENGINEERS.find(e => e.id === id)).filter((x): x is typeof MODAL_ENGINEERS[number] => !!x);
                    return (
                      <label key={team.id} style={{
                        display:"flex", flexDirection:"column", padding:"11px 13px", borderRadius:8, gap:8,
                        border:`1px solid ${isSelected ? "var(--brand)" : "var(--line-2)"}`,
                        background: isSelected ? "var(--brand-dim)" : "var(--panel-2)",
                        cursor:"pointer", transition:"all .1s",
                      }}>
                        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                          <input type="checkbox" checked={isSelected} onChange={() => toggleT(team.id)}
                            style={{ accentColor:"var(--brand)", width:15, height:15, flexShrink:0 }} />
                          <div style={{ flex:1, minWidth:0 }}>
                            <span style={{ fontSize:13, fontWeight:600, color:"var(--ink)" }}>{team.name}</span>
                            <span style={{ fontSize:11, color:"var(--ink-3)", marginLeft:6 }}>{members.length} members</span>
                          </div>
                          {tb && tb.color !== "var(--ink-3)" && <LocBadge {...tb} />}
                        </div>
                        <div style={{ display:"flex", gap:5, paddingLeft:24 }}>
                          {members.map(m => (
                            <div key={m.id} title={`${m.name} · ${m.role}`} style={{
                              width:28, height:28, borderRadius:7, display:"grid", placeItems:"center",
                              background: isSelected ? "var(--brand)" : "var(--panel-3)",
                              color: isSelected ? "white" : "var(--ink-2)",
                              fontSize:9.5, fontWeight:700,
                            }}>{m.initials}</div>
                          ))}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              {teamTab === "people" && (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  <div style={{ display:"flex", gap:8 }}>
                    <div style={{ flex:1 }}><SearchInput value={searchP} onChange={setSearchP} placeholder="Search engineers…" /></div>
                    <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                      style={{ height:32, borderRadius:6, border:"1px solid var(--line-2)", background:"var(--panel-2)", color:"var(--ink)", fontSize:12, padding:"0 8px", flexShrink:0 }}>
                      {roles.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  {peopleList.map(eng => {
                    const isOnLeave = eng.avail === "On Leave";
                    const isSelected = selPeople.includes(eng.id);
                    const pb = badgeFor(eng.city, eng.country);
                    return (
                      <label key={eng.id} style={{
                        display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:8,
                        border:`1px solid ${isSelected ? "var(--brand)" : "var(--line-2)"}`,
                        background: isSelected ? "var(--brand-dim)" : "var(--panel-2)",
                        cursor: isOnLeave ? "default" : "pointer", opacity: isOnLeave ? 0.55 : 1, transition:"all .1s",
                      }}>
                        <input type="checkbox" checked={isSelected} disabled={isOnLeave}
                          onChange={() => !isOnLeave && toggleP(eng.id)}
                          style={{ accentColor:"var(--brand)", width:15, height:15, flexShrink:0 }} />
                        <div style={{ width:32, height:32, borderRadius:8, display:"grid", placeItems:"center", flexShrink:0,
                          background: isSelected ? "var(--brand)" : "var(--panel-3)",
                          color: isSelected ? "white" : "var(--ink-2)", fontSize:11, fontWeight:700 }}>
                          {eng.initials}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:550, color:"var(--ink)" }}>{eng.name}</div>
                          <div style={{ fontSize:11, color:"var(--ink-3)" }}>{eng.role}</div>
                        </div>
                        {pb && pb.color !== "var(--ink-3)" && <LocBadge {...pb} />}
                        <span style={{ fontSize:10, fontWeight:500, padding:"2px 7px", borderRadius:4, whiteSpace:"nowrap",
                          color: AVAIL_C[eng.avail], background:`color-mix(in srgb, ${AVAIL_C[eng.avail]} 12%, transparent)` }}>
                          {eng.avail}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Step 5: Summary ── */}
          {step === 5 && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ fontSize:13, color:"var(--ink-2)" }}>Review your selections before creating the center.</div>

              <div style={{ background:"var(--panel-2)", borderRadius:10, padding:"12px 14px", border:"1px solid var(--line-2)" }}>
                <div style={{ fontSize:10.5, fontWeight:600, color:"var(--ink-4)", textTransform:"uppercase", letterSpacing:".06em", marginBottom:8 }}>Location</div>
                <div style={{ fontSize:14, fontWeight:650, color:"var(--ink)" }}>{name || "—"}</div>
                <div style={{ fontSize:12, color:"var(--ink-3)", marginTop:2 }}>{city && country ? `${city}, ${country}` : "—"}</div>
                {address && <div style={{ fontSize:11.5, color:"var(--ink-4)", marginTop:2 }}>{address}</div>}
              </div>

              <div style={{ background:"var(--panel-2)", borderRadius:10, padding:"12px 14px", border:"1px solid var(--line-2)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:selBenches.length ? 8 : 0 }}>
                  <div style={{ fontSize:10.5, fontWeight:600, color:"var(--ink-4)", textTransform:"uppercase", letterSpacing:".06em" }}>Benches</div>
                  <span style={{ fontSize:11, color:"var(--ink-3)" }}>{selBenches.length} selected</span>
                </div>
                {selBenches.length === 0
                  ? <div style={{ fontSize:12, color:"var(--ink-4)", marginTop:4 }}>None selected</div>
                  : selBenches.map(id => {
                    const b = BENCHES_INITIAL.find(x => x.id === id);
                    if (!b) return null;
                    return (
                      <div key={id} style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 0", borderBottom:"1px solid var(--line)" }}>
                        <span style={{ width:6, height:6, borderRadius:"50%", background:SC[b.status] || "var(--ink-4)", display:"inline-block", flexShrink:0 }} />
                        <span style={{ fontSize:12.5, color:"var(--ink)", flex:1 }}>{b.name}</span>
                        <span style={{ fontSize:11, color:"var(--ink-4)" }}>{b.id}</span>
                      </div>
                    );
                  })
                }
              </div>

              <div style={{ background:"var(--panel-2)", borderRadius:10, padding:"12px 14px", border:"1px solid var(--line-2)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:selAssets.length ? 8 : 0 }}>
                  <div style={{ fontSize:10.5, fontWeight:600, color:"var(--ink-4)", textTransform:"uppercase", letterSpacing:".06em" }}>Assets</div>
                  <span style={{ fontSize:11, color:"var(--ink-3)" }}>{selAssets.length} selected</span>
                </div>
                {selAssets.length === 0
                  ? <div style={{ fontSize:12, color:"var(--ink-4)", marginTop:4 }}>None selected</div>
                  : selAssets.map(tag => {
                    const a = ASSETS_INITIAL.find((x: Asset) => x.tag === tag);
                    if (!a) return null;
                    return (
                      <div key={tag} style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 0", borderBottom:"1px solid var(--line)" }}>
                        <span style={{ fontSize:12.5, color:"var(--ink)", flex:1 }}>{a.model}</span>
                        <span style={{ fontSize:11, color:"var(--ink-4)" }}>#{tag}</span>
                        <span style={{ fontSize:10, color:"var(--ink-4)" }}>{a.cat}</span>
                      </div>
                    );
                  })
                }
              </div>

              <div style={{ background:"var(--panel-2)", borderRadius:10, padding:"12px 14px", border:"1px solid var(--line-2)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:selPeople.length ? 8 : 0 }}>
                  <div style={{ fontSize:10.5, fontWeight:600, color:"var(--ink-4)", textTransform:"uppercase", letterSpacing:".06em" }}>Team</div>
                  <span style={{ fontSize:11, color:"var(--ink-3)" }}>{selPeople.length} members</span>
                </div>
                {selPeople.length === 0
                  ? <div style={{ fontSize:12, color:"var(--ink-4)", marginTop:4 }}>None selected</div>
                  : selPeople.map(id => {
                    const e = MODAL_ENGINEERS.find(x => x.id === id);
                    if (!e) return null;
                    return (
                      <div key={id} style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 0", borderBottom:"1px solid var(--line)" }}>
                        <div style={{ width:24, height:24, borderRadius:6, display:"grid", placeItems:"center", background:"var(--brand-dim)", color:"var(--brand)", fontSize:9, fontWeight:700, flexShrink:0 }}>{e.initials}</div>
                        <span style={{ fontSize:12.5, color:"var(--ink)", flex:1 }}>{e.name}</span>
                        <span style={{ fontSize:11, color:"var(--ink-4)" }}>{e.role}</span>
                        <span style={{ fontSize:10, fontWeight:500, padding:"1px 6px", borderRadius:4, flexShrink:0,
                          color: AVAIL_C[e.avail], background:`color-mix(in srgb, ${AVAIL_C[e.avail]} 12%, transparent)` }}>{e.avail}</span>
                      </div>
                    );
                  })
                }
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display:"flex", justifyContent:"space-between", gap:8, padding:"12px 22px 18px", borderTop:"1px solid var(--line)" }}>
          <button className="to-btn ghost sm" onClick={step > 1 ? () => setStep(s => s - 1) : onClose}>
            {step > 1 ? "← Back" : "Cancel"}
          </button>
          <div style={{ display:"flex", gap:8 }}>
            {step > 1 && step < 5 && (
              <button className="to-btn ghost sm" onClick={() => setStep(5)} style={{ color:"var(--ink-3)" }}>
                Skip to summary
              </button>
            )}
            {step < 5 ? (
              <button className="to-btn primary sm" disabled={step === 1 && !valid1} onClick={() => setStep(s => s + 1)}>
                {step < 4 ? `Next: ${WIZARD_STEPS[step]} →` : "Review summary →"}
              </button>
            ) : (
              <button className="to-btn primary sm" disabled={!valid1} onClick={handleCreate}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                Create center
              </button>
            )}
          </div>
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
        background: "var(--panel)", borderRadius: 12, border: "1px solid var(--line-2)",
        padding: "20px 24px", marginBottom: 20,
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
                <td style={{ padding: "10px 14px", fontSize: 13, color: "var(--ink-2)" }}>{a.cat}</td>
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

// ─── View toggle ──────────────────────────────────────────────────────────────
function ViewToggle({ view, onChange }: { view: "grid" | "map"; onChange: (v: "grid" | "map") => void }) {
  const btn = (v: "grid" | "map", icon: string, label: string) => (
    <button
      onClick={() => onChange(v)}
      style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "5px 11px", borderRadius: 6, border: "none",
        background: view === v ? "var(--panel)" : "transparent",
        boxShadow: view === v ? "0 1px 4px rgba(0,0,0,.1)" : "none",
        color: view === v ? "var(--ink)" : "var(--ink-3)",
        fontSize: 12.5, fontWeight: 500, cursor: "pointer",
        transition: "background .12s, color .12s",
      }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" dangerouslySetInnerHTML={{ __html: icon }} />
      {label}
    </button>
  );
  return (
    <div style={{
      display: "flex", background: "var(--panel-2)", borderRadius: 8,
      border: "1px solid var(--line-2)", padding: 2, gap: 1,
    }}>
      {btn("grid", '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>', "Grid")}
      {btn("map", '<circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 1 8 8c0 5.25-8 14-8 14S4 15.25 4 10a8 8 0 0 1 8-8z"/>', "Map")}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function TestCenters({ centers, benches, onOpenCenter }: Props) {
  const [selected, setSelected]  = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newCenters, setNewCenters] = useState<TestCenter[]>([]);
  const [view, setView]            = useState<"grid" | "map">("grid");

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
          <ViewToggle view={view} onChange={setView} />
          <button className="to-btn primary sm" onClick={() => setModalOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            New Center
          </button>
        </div>
      </div>

      {/* Map view */}
      {view === "map" && (
        <MapView
          centers={allCenters}
          benches={benches}
          onSelect={id => setSelected(id)}
        />
      )}

      {/* Cards grid */}
      {view === "grid" && (
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
      )}

      {/* New Center Modal */}
      {modalOpen && (
        <NewCenterModal
          onClose={() => setModalOpen(false)}
          onCreate={draft => {
            const newId = `TC-${draft.city.slice(0,3).toUpperCase()}`;
            setNewCenters(prev => [...prev, {
              id: newId, name: draft.name, address: draft.address,
              city: draft.city, country: draft.country,
              lat: 0, lng: 0, benchIds: draft.benchIds, assetTags: draft.assetTags,
            }]);
            setModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
