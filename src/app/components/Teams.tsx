import { useState, useMemo } from "react";
import { TEST_CENTERS, BENCHES_INITIAL } from "../data";

// ─── Types ────────────────────────────────────────────────────────────────────
type Avail = "Available" | "Busy" | "On Leave";

interface Engineer {
  id: string; initials: string; name: string;
  role: string; specialization: string; availability: Avail;
}
interface Member { engineerId: string; teamRole: string }
interface Team   { id: string; name: string; centerId: string; members: Member[]; description: string; createdAt: string; benchIds: string[] }
interface Draft  { name: string; centerId: string; description: string; members: Record<string, string>; benchIds: string[] }

// ─── Mock data ────────────────────────────────────────────────────────────────
const ENGINEERS: Engineer[] = [
  { id:"E1", initials:"AK", name:"Andriy Kovalenko",  role:"Test Manager",    specialization:"HiL Integration",     availability:"Available" },
  { id:"E2", initials:"SM", name:"Stefan Marek",       role:"Senior Engineer", specialization:"CAN / LIN Protocols", availability:"Busy"      },
  { id:"E3", initials:"LW", name:"Lidia Wójcik",       role:"Tester",          specialization:"Firmware Validation", availability:"Available" },
  { id:"E4", initials:"KN", name:"Kamil Nowak",         role:"DevOps Engineer", specialization:"CI / CD Integration", availability:"Available" },
  { id:"E5", initials:"PB", name:"Piotr Bakun",         role:"Engineer",        specialization:"Power Systems",       availability:"On Leave"  },
  { id:"E6", initials:"WP", name:"Wojciech Pikulski",   role:"RF Engineer",     specialization:"RF & Antenna",        availability:"Busy"      },
];

const INITIAL_TEAMS: Team[] = [
  {
    id:"TM-001", name:"CAN Stack Core", centerId:"TC-MUC",
    members:[{engineerId:"E1",teamRole:"Lead"},{engineerId:"E2",teamRole:"Engineer"},{engineerId:"E3",teamRole:"Tester"}],
    description:"CAN/LIN protocol stack regression and cross-domain integration campaigns.",
    createdAt:"Mar 2024",
    benchIds:["TB-178","TB-205"],
  },
  {
    id:"TM-002", name:"Firmware Validation", centerId:"TC-STR",
    members:[{engineerId:"E4",teamRole:"Lead"},{engineerId:"E2",teamRole:"Reviewer"},{engineerId:"E3",teamRole:"Tester"},{engineerId:"E5",teamRole:"Support"}],
    description:"OTA firmware update validation, boot stress testing and power cycle endurance.",
    createdAt:"Sep 2024",
    benchIds:["TB-146","TB-112","TB-156"],
  },
  {
    id:"TM-003", name:"Platform DevOps", centerId:"TC-WAW",
    members:[{engineerId:"E4",teamRole:"Lead"},{engineerId:"E6",teamRole:"Engineer"}],
    description:"CI/CD pipeline management, Jenkins integration and RF antenna lab operations.",
    createdAt:"Jan 2025",
    benchIds:["TB-084","TB-231"],
  },
];

const TEAM_ROLES = ["Lead", "Senior Engineer", "Engineer", "Tester", "Reviewer", "Support", "DevOps"] as const;

// ─── Center / availability look-ups ──────────────────────────────────────────
const CTR: Record<string, { color: string; bg: string; name: string; border: string }> = {
  "TC-MUC": { color:"var(--brand)", bg:"rgba(94,106,210,.1)",  border:"var(--brand)", name:"Munich"     },
  "TC-STR": { color:"var(--warn)",  bg:"rgba(184,134,11,.1)", border:"var(--warn)",  name:"Stuttgart"  },
  "TC-WAW": { color:"var(--ok)",    bg:"rgba(26,150,72,.1)",  border:"var(--ok)",    name:"Warsaw"     },
  "":       { color:"var(--ink-4)", bg:"var(--panel-2)",       border:"var(--line)",  name:"Unassigned" },
};

const AVAIL: Record<Avail, { dot: string; bg: string; color: string }> = {
  "Available": { dot:"var(--ok)",   bg:"rgba(26,150,72,.1)",   color:"var(--ok)"   },
  "Busy":      { dot:"var(--warn)", bg:"rgba(184,134,11,.1)", color:"var(--warn)" },
  "On Leave":  { dot:"var(--ink-4)",bg:"var(--panel-2)",       color:"var(--ink-4)"},
};

// Deterministic avatar background from initials
const AV_COLORS = ["#5E6AD2","#1A9648","#B8860B","#0891B2","#8B5CF6","#C0392B"];
function avColor(i: string) { return AV_COLORS[i.charCodeAt(0) % AV_COLORS.length]; }

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Av({ initials, size = 28 }: { initials: string; size?: number }) {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", justifyContent:"center",
      width:size, height:size, borderRadius:"50%",
      background:avColor(initials), color:"#fff",
      fontSize:Math.round(size * .38), fontWeight:700, flexShrink:0,
      letterSpacing:".01em",
    }}>
      {initials}
    </span>
  );
}

// ─── Team card ────────────────────────────────────────────────────────────────
function TeamCard({ team, onEdit }: { team: Team; onEdit: () => void }) {
  const c = CTR[team.centerId] ?? CTR[""];
  const members = team.members
    .map(m => ({ ...m, eng: ENGINEERS.find(e => e.id === m.engineerId) }))
    .filter((m): m is typeof m & { eng: Engineer } => !!m.eng);

  return (
    <div style={{
      background:"var(--panel)", borderRadius:12, border:"1px solid var(--line-2)",
      display:"flex", flexDirection:"column", height:"100%",
    }}>
      {/* Header */}
      <div style={{ padding:"16px 18px 12px", borderBottom:"1px solid var(--line)" }}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:6 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:15.5, fontWeight:650, color:"var(--ink)", lineHeight:1.25 }}>{team.name}</div>
            <div style={{ fontSize:13, color:"var(--ink-3)", marginTop:4, lineHeight:1.5 }}>{team.description}</div>
            {team.benchIds && team.benchIds.length > 0 && (
              <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginTop:8 }}>
                {team.benchIds.map(bid => {
                  const bench = BENCHES_INITIAL.find(b => b.id === bid);
                  if (!bench) return null;
                  const stColor = bench.status === "Up" ? "var(--ok)" : bench.status === "Down" ? "var(--bad)" : bench.status === "Degraded" ? "var(--warn)" : "var(--ink-4)";
                  return (
                    <span key={bid} title={bench.name} style={{
                      display:"inline-flex", alignItems:"center", gap:4,
                      fontSize:11, padding:"2px 7px", borderRadius:5,
                      background:"var(--panel-2)", color:"var(--ink-3)",
                      fontFamily:"var(--mono)", border:"1px solid var(--line)",
                    }}>
                      <span style={{ width:5, height:5, borderRadius:"50%", background:stColor, flexShrink:0 }} />
                      {bench.hosts[0]?.hostId}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          <span style={{
            flexShrink:0, padding:"3px 10px", borderRadius:12,
            fontSize:12, fontWeight:600, background:c.bg, color:c.color,
            whiteSpace:"nowrap",
          }}>
            {c.name !== "Unassigned" ? (
              <><span style={{ width:5, height:5, borderRadius:"50%", background:c.color, display:"inline-block", marginRight:5, verticalAlign:"middle" }} />{c.name}</>
            ) : c.name}
          </span>
        </div>
      </div>

      {/* Member list */}
      <div style={{ padding:"12px 18px", flex:1 }}>
        {members.map((m, i) => {
          const av = AVAIL[m.eng.availability];
          return (
            <div key={m.engineerId} style={{
              display:"flex", alignItems:"center", gap:9,
              paddingBottom: i < members.length - 1 ? 10 : 0,
              marginBottom: i < members.length - 1 ? 10 : 0,
              borderBottom: i < members.length - 1 ? "1px solid var(--line)" : "none",
            }}>
              <Av initials={m.eng.initials} size={28} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"var(--ink)" }}>{m.eng.name}</div>
                <div style={{ fontSize:12, fontWeight:500, color:"var(--ink-3)", marginTop:1 }}>{m.eng.specialization}</div>
              </div>
              <span style={{
                fontSize:12, padding:"2px 8px", borderRadius:4,
                background:"var(--panel-2)", color:"var(--ink-3)", fontWeight:500,
              }}>
                {m.teamRole}
              </span>
              <span title={m.eng.availability} style={{
                width:7, height:7, borderRadius:"50%",
                background:av.dot, flexShrink:0,
              }} />
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{
        padding:"10px 18px", borderTop:"1px solid var(--line)",
        display:"flex", alignItems:"center", justifyContent:"space-between",
      }}>
        <span style={{ fontSize:12.5, fontWeight:500, color:"var(--ink-3)" }}>
          {members.length} member{members.length !== 1 ? "s" : ""} · Since {team.createdAt}
        </span>
        <button className="to-btn ghost sm" onClick={onEdit}>Edit team</button>
      </div>
    </div>
  );
}

// ─── Engineer row in builder ──────────────────────────────────────────────────
function EngRow({
  eng, checked, role, onToggle, onRole,
}: {
  eng: Engineer; checked: boolean; role: string;
  onToggle: () => void; onRole: (r: string) => void;
}) {
  const av = AVAIL[eng.availability];
  const isLeave = eng.availability === "On Leave";
  return (
    <div
      style={{
        display:"flex", alignItems:"center", gap:10,
        padding:"9px 0", borderBottom:"1px solid var(--line)",
        opacity: isLeave ? 0.55 : 1,
        cursor: isLeave ? "not-allowed" : "pointer",
        transition:"background .1s",
      }}
      onClick={() => !isLeave && onToggle()}
    >
      <input
        type="checkbox" checked={checked}
        disabled={isLeave}
        onChange={e => { e.stopPropagation(); !isLeave && onToggle(); }}
        onClick={e => e.stopPropagation()}
        style={{ flexShrink:0, accentColor:"var(--brand)", width:14, height:14, cursor:isLeave?"not-allowed":"pointer" }}
      />
      <Av initials={eng.initials} size={30} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:500, color:"var(--ink)" }}>{eng.name}</div>
        <div style={{ fontSize:11, color:"var(--ink-3)", marginTop:1 }}>{eng.role} · {eng.specialization}</div>
      </div>
      <span style={{
        flexShrink:0, fontSize:10.5, padding:"2px 8px", borderRadius:10,
        background:av.bg, color:av.color, fontWeight:500, whiteSpace:"nowrap",
      }}>
        {eng.availability}
      </span>
      {checked && (
        <select
          value={role}
          onChange={e => { e.stopPropagation(); onRole(e.target.value); }}
          onClick={e => e.stopPropagation()}
          style={{
            flexShrink:0, fontSize:11.5, borderRadius:6,
            border:"1px solid var(--line-2)",
            padding:"4px 32px 4px 8px", background:"var(--panel)", color:"var(--ink)",
            cursor:"pointer", outline:"none", appearance:"none",
            backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat:"no-repeat", backgroundPosition:"right 8px center",
          }}
        >
          {TEAM_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      )}
    </div>
  );
}

// ─── Builder modal ────────────────────────────────────────────────────────────
const EMPTY_DRAFT: Draft = { name:"", centerId:"", description:"", members:{}, benchIds:[] };

function Builder({
  initial, onSave, onClose,
}: {
  initial: Draft; onSave: (d: Draft) => void; onClose: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(initial);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() =>
    ENGINEERS.filter(e =>
      !search ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.specialization.toLowerCase().includes(search.toLowerCase()) ||
      e.role.toLowerCase().includes(search.toLowerCase())
    ), [search]);

  function toggleEng(id: string) {
    setDraft(d => {
      const next = { ...d.members };
      if (next[id]) { delete next[id]; } else { next[id] = "Engineer"; }
      return { ...d, members: next };
    });
  }

  function setRole(id: string, role: string) {
    setDraft(d => ({ ...d, members: { ...d.members, [id]: role } }));
  }

  const memberCount = Object.keys(draft.members).length;
  const ctr = CTR[draft.centerId] ?? CTR[""];
  const canSave = draft.name.trim().length > 0 && memberCount > 0;

  const centerBenches = useMemo(() => {
    if (!draft.centerId) return [];
    const center = TEST_CENTERS.find(c => c.id === draft.centerId);
    if (!center) return [];
    return BENCHES_INITIAL.filter(b => center.benchIds.includes(b.id));
  }, [draft.centerId]);

  function toggleBench(id: string) {
    setDraft(d => ({
      ...d,
      benchIds: d.benchIds.includes(id) ? d.benchIds.filter(x => x !== id) : [...d.benchIds, id],
    }));
  }

  return (
    <div style={{
      position:"fixed", inset:0,
      background:"rgba(0,0,0,.48)", backdropFilter:"blur(4px)",
      display:"flex", alignItems:"center", justifyContent:"center",
      zIndex:900, padding:20,
    }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background:"var(--panel)", borderRadius:14,
        border:"1px solid var(--line)",
        width:680, maxWidth:"100%", maxHeight:"calc(100vh - 56px)",
        display:"flex", flexDirection:"column",
        boxShadow:"0 24px 64px rgba(0,0,0,.35)",
      }}>
        {/* Modal header */}
        <div style={{
          padding:"18px 22px", borderBottom:"1px solid var(--line)",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          flexShrink:0,
        }}>
          <div>
            <div style={{ fontSize:16, fontWeight:660, color:"var(--ink)" }}>
              {initial.name ? `Edit team — ${initial.name}` : "Build New Team"}
            </div>
            <div style={{ fontSize:11.5, color:"var(--ink-4)", marginTop:2 }}>
              {memberCount > 0 ? `${memberCount} member${memberCount > 1 ? "s" : ""} selected` : "Select engineers and assign roles"}
            </div>
          </div>
          <button
            className="to-iconbtn"
            onClick={onClose}
            style={{ background:"var(--panel-2)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex:1, overflow:"auto", padding:"20px 22px" }}>

          {/* Team name */}
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:11, fontWeight:600, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:6 }}>
              Team Name
            </label>
            <input
              className="to-input"
              placeholder="e.g. CAN Stack Core"
              value={draft.name}
              onChange={e => setDraft(d => ({ ...d, name:e.target.value }))}
              style={{ width:"100%", boxSizing:"border-box", fontSize:14 }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:11, fontWeight:600, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:6 }}>
              Description <span style={{ opacity:.5, fontWeight:400, textTransform:"none", letterSpacing:0 }}>(optional)</span>
            </label>
            <textarea
              className="to-input"
              placeholder="Short description of what this team does…"
              value={draft.description}
              rows={2}
              onChange={e => setDraft(d => ({ ...d, description:e.target.value }))}
              style={{ width:"100%", boxSizing:"border-box", fontSize:13, resize:"vertical" }}
            />
          </div>

          {/* Center select */}
          <div style={{ marginBottom:22 }}>
            <label style={{ fontSize:11, fontWeight:600, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:6 }}>
              Assign to Test Center
            </label>
            <div style={{ position:"relative" }}>
              {draft.centerId && (
                <span style={{
                  position:"absolute", left:12, top:"50%", transform:"translateY(-50%)",
                  width:8, height:8, borderRadius:"50%", background:ctr.color, pointerEvents:"none",
                }} />
              )}
              <select
                value={draft.centerId}
                onChange={e => setDraft(d => ({ ...d, centerId:e.target.value }))}
                style={{
                  width:"100%", padding:`9px 32px 9px ${draft.centerId ? "28px" : "12px"}`,
                  border:"1px solid var(--line-2)", borderRadius:8,
                  background:"var(--panel)", color:"var(--ink)", fontSize:13,
                  cursor:"pointer", outline:"none", appearance:"none",
                  boxSizing:"border-box", transition:"border-color .12s",
                  backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat:"no-repeat", backgroundPosition:"right 10px center",
                }}
              >
                <option value="">— No center assigned —</option>
                {TEST_CENTERS.map(c => (
                  <option key={c.id} value={c.id}>{c.name} · {c.city}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Bench assignment */}
          <div style={{ marginBottom:22 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
              <label style={{ fontSize:11, fontWeight:600, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:".06em" }}>
                Assign Benches
              </label>
              {draft.benchIds.length > 0 && (
                <span style={{ fontSize:11, color:"var(--ink-4)" }}>{draft.benchIds.length} selected</span>
              )}
            </div>
            {centerBenches.length === 0 ? (
              <div style={{
                padding:"12px 14px", borderRadius:8, background:"var(--panel-2)",
                fontSize:12, color:"var(--ink-4)", textAlign:"center",
                border:"1px solid var(--line)",
              }}>
                {draft.centerId ? "No benches found for this center" : "Select a Test Center first to assign benches"}
              </div>
            ) : (
              <div style={{ border:"1px solid var(--line-2)", borderRadius:8, overflow:"hidden" }}>
                {centerBenches.map((b, i) => {
                  const checked = draft.benchIds.includes(b.id);
                  const stColor = b.status === "Up" ? "var(--ok)" : b.status === "Down" ? "var(--bad)" : b.status === "Degraded" ? "var(--warn)" : "var(--ink-4)";
                  return (
                    <div key={b.id}
                      style={{
                        display:"flex", alignItems:"center", gap:10, padding:"9px 12px",
                        borderBottom: i < centerBenches.length - 1 ? "1px solid var(--line)" : "none",
                        background: checked ? "rgba(94,106,210,.04)" : undefined,
                        cursor:"pointer", transition:"background .1s",
                      }}
                      onClick={() => toggleBench(b.id)}
                    >
                      <input type="checkbox" checked={checked} onChange={() => {}} onClick={e => e.stopPropagation()}
                        style={{ flexShrink:0, accentColor:"var(--brand)", width:14, height:14, cursor:"pointer" }} />
                      <span style={{ fontFamily:"var(--mono)", fontSize:12, color:"var(--ink-2)", minWidth:32 }}>
                        {b.hosts[0]?.hostId}
                      </span>
                      <span style={{ flex:1, fontSize:12.5, color:"var(--ink)", fontWeight:500 }}>{b.name}</span>
                      <span style={{ width:6, height:6, borderRadius:"50%", background:stColor, flexShrink:0 }} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Engineer roster */}
          <div style={{
            borderTop:"1px solid var(--line)", paddingTop:16,
            display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10,
          }}>
            <div style={{ fontSize:12, fontWeight:600, color:"var(--ink-2)", textTransform:"uppercase", letterSpacing:".06em" }}>
              Add Members
            </div>
            <div style={{ fontSize:11, color:"var(--ink-4)" }}>
              {memberCount} selected
            </div>
          </div>

          {/* Search */}
          <div style={{ position:"relative", marginBottom:10 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
              style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"var(--ink-4)", pointerEvents:"none" }}>
              <circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>
            </svg>
            <input
              className="to-input"
              placeholder="Search by name, role or specialization…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width:"100%", boxSizing:"border-box", paddingLeft:32, fontSize:12.5 }}
            />
          </div>

          {/* Engineer list */}
          <div>
            {filtered.length === 0 && (
              <div style={{ padding:"20px 0", textAlign:"center", fontSize:12.5, color:"var(--ink-4)" }}>
                No engineers match your search
              </div>
            )}
            {filtered.map(eng => (
              <EngRow
                key={eng.id}
                eng={eng}
                checked={!!draft.members[eng.id]}
                role={draft.members[eng.id] ?? "Engineer"}
                onToggle={() => toggleEng(eng.id)}
                onRole={r => setRole(eng.id, r)}
              />
            ))}
          </div>

          {/* On Leave notice */}
          {ENGINEERS.some(e => e.availability === "On Leave") && (
            <div style={{
              marginTop:10, padding:"7px 10px", borderRadius:7,
              background:"var(--panel-2)", fontSize:11, color:"var(--ink-4)",
              display:"flex", gap:6, alignItems:"center",
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Engineers marked "On Leave" cannot be added to a team
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding:"14px 22px", borderTop:"1px solid var(--line)",
          display:"flex", alignItems:"center", justifyContent:"flex-end", gap:8,
          flexShrink:0,
        }}>
          <button className="to-btn ghost sm" onClick={onClose}>Cancel</button>
          <button
            className="to-btn primary sm"
            onClick={() => canSave && onSave(draft)}
            disabled={!canSave}
            style={{ opacity: canSave ? 1 : 0.45 }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
            </svg>
            {initial.name ? "Save changes" : "Create team"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Engineer roster panel ────────────────────────────────────────────────────
function RosterCard({ addToast }: { addToast: (t: string, s?: string, type?: string) => void }) {
  return (
    <div className="to-panel">
      <div className="to-panel-h">
        <span className="to-eyebrow">Engineer Roster</span>
        <button
          className="to-btn ghost sm"
          onClick={() => addToast("Add engineer", "Opening engineer registration form…", "info")}
        >
          + Add engineer
        </button>
      </div>
      <div className="to-panel-b" style={{ padding:0 }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead>
            <tr style={{ borderBottom:"1px solid var(--line)" }}>
              {["Engineer", "Role", "Specialization", "Availability", "Teams"].map(h => (
                <th key={h} style={{ padding:"8px 14px", textAlign:"left", fontSize:10.5, fontWeight:600, color:"var(--ink-4)", textTransform:"uppercase", letterSpacing:".05em" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ENGINEERS.map(e => {
              const av = AVAIL[e.availability];
              const teamList = INITIAL_TEAMS.filter(t => t.members.some(m => m.engineerId === e.id));
              return (
                <tr
                  key={e.id}
                  style={{ borderBottom:"1px solid var(--line)" }}
                  onMouseEnter={ev => ev.currentTarget.style.background = "var(--bg)"}
                  onMouseLeave={ev => ev.currentTarget.style.background = ""}
                >
                  <td style={{ padding:"10px 14px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                      <Av initials={e.initials} size={26} />
                      <span style={{ fontWeight:550, color:"var(--ink)" }}>{e.name}</span>
                    </div>
                  </td>
                  <td style={{ padding:"10px 14px", color:"var(--ink-2)", fontSize:12.5 }}>{e.role}</td>
                  <td style={{ padding:"10px 14px", color:"var(--ink-3)", fontSize:12.5 }}>{e.specialization}</td>
                  <td style={{ padding:"10px 14px" }}>
                    <span style={{
                      fontSize:11, padding:"2px 8px", borderRadius:10,
                      background:av.bg, color:av.color, fontWeight:500,
                    }}>
                      <span style={{ width:5, height:5, borderRadius:"50%", background:av.dot, display:"inline-block", marginRight:5, verticalAlign:"middle" }} />
                      {e.availability}
                    </span>
                  </td>
                  <td style={{ padding:"10px 14px" }}>
                    {teamList.length > 0 ? (
                      <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                        {teamList.map(t => {
                          const c = CTR[t.centerId] ?? CTR[""];
                          return (
                            <span key={t.id} style={{
                              fontSize:10.5, padding:"1.5px 7px", borderRadius:4,
                              background:c.bg, color:c.color, fontWeight:500,
                            }}>
                              {t.name}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <span style={{ fontSize:12, color:"var(--ink-4)" }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
interface Props { addToast: (t: string, s?: string, type?: string) => void }

export function Teams({ addToast }: Props) {
  const [teams, setTeams] = useState<Team[]>(INITIAL_TEAMS);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [ctrFilters, setCtrFilters] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const toggleCtr = (id: string) => setCtrFilters(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const editingTeam = editId ? teams.find(t => t.id === editId) : null;

  const initialDraft: Draft = editingTeam
    ? {
        name: editingTeam.name,
        centerId: editingTeam.centerId,
        description: editingTeam.description,
        members: Object.fromEntries(editingTeam.members.map(m => [m.engineerId, m.teamRole])),
        benchIds: editingTeam.benchIds ?? [],
      }
    : EMPTY_DRAFT;

  function openNew()         { setEditId(null); setBuilderOpen(true); }
  function openEdit(id: string) { setEditId(id); setBuilderOpen(true); }
  function closeBuilder()    { setBuilderOpen(false); setEditId(null); }

  function saveTeam(draft: Draft) {
    const members = Object.entries(draft.members).map(([engineerId, teamRole]) => ({ engineerId, teamRole }));
    if (editId) {
      setTeams(prev => prev.map(t => t.id === editId
        ? { ...t, name: draft.name, centerId: draft.centerId, description: draft.description, members, benchIds: draft.benchIds }
        : t));
      addToast("Team updated", `${draft.name} saved`, "ok");
    } else {
      const id = `TM-${String(Date.now()).slice(-4)}`;
      setTeams(prev => [...prev, {
        id, name: draft.name, centerId: draft.centerId,
        description: draft.description, members, createdAt: "Jun 2026",
        benchIds: draft.benchIds,
      }]);
      addToast("Team created", `${draft.name} is ready`, "ok");
    }
    closeBuilder();
  }

  const visibleTeams = ctrFilters.length === 0
    ? teams
    : teams.filter(t => ctrFilters.includes(t.centerId));

  // Summary stats
  const availableCt = ENGINEERS.filter(e => e.availability === "Available").length;
  const centersCt   = new Set(teams.filter(t => t.centerId).map(t => t.centerId)).size;
  const memberSlots = teams.reduce((s, t) => s + t.members.length, 0);

  return (
    <div className="to-screen">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="to-page-head">
        <div>
          <div className="to-kicker">Administration</div>
          <h1>Teams</h1>
          <div style={{ color:"var(--ink-2)", fontSize:13, marginTop:5 }}>
            Manage engineering teams, member roles and Test Center assignments
          </div>
        </div>
        <div className="to-head-actions">
          <button className="to-btn primary sm" onClick={openNew}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            New Team
          </button>
        </div>
      </div>

      {/* ── Summary KPI row ─────────────────────────────────────────────── */}
      <div style={{ display:"flex", gap:12, marginBottom:24 }}>
        {[
          { label:"Engineers",       val:ENGINEERS.length, sub:"registered",                        color:"var(--ink)"   },
          { label:"Available Now",   val:availableCt,      sub:"ready for assignment",              color:"var(--ok)"    },
          { label:"Teams",           val:teams.length,     sub:"active",                            color:"var(--brand)" },
          { label:"Centers Covered", val:centersCt,        sub:`of ${TEST_CENTERS.length} total`,   color:"var(--ink)"   },
          { label:"Member Slots",    val:memberSlots,      sub:"across all teams",                  color:"var(--ink)"   },
        ].map((k, i, arr) => (
          <div key={k.label} style={{
            flex:1, minWidth:0,
            padding: "0 18px",
            borderRight: i < arr.length - 1 ? "1px solid var(--line)" : "none",
          }}>
            <div style={{ fontSize:12, fontWeight:600, color:"var(--ink-4)", textTransform:"uppercase", letterSpacing:".07em", marginBottom:8 }}>{k.label}</div>
            <div style={{ fontWeight:700, fontSize:26, lineHeight:1, color:k.color, fontVariantNumeric:"tabular-nums", letterSpacing:"-.03em" }}>{k.val}</div>
            <div style={{ fontSize:12, fontWeight:500, color:"var(--ink-3)", marginTop:5 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Center filter ────────────────────────────────────────────────── */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
        <span style={{ fontSize:12, color:"var(--ink-4)", fontWeight:500 }}>Center</span>
        <div style={{ position:"relative" }}>
          {filterOpen && (
            <div style={{ position:"fixed", inset:0, zIndex:9 }} onClick={() => setFilterOpen(false)} />
          )}
          <button
            onClick={() => setFilterOpen(o => !o)}
            style={{
              display:"inline-flex", alignItems:"center", gap:8,
              height:32, padding:"0 32px 0 12px", borderRadius:8,
              border:"1px solid var(--line-2)", background:"var(--panel)",
              color:"var(--ink)", fontSize:13, cursor:"pointer",
              backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat:"no-repeat", backgroundPosition:"right 10px center",
            }}
          >
            {ctrFilters.length === 0
              ? "All Centers"
              : ctrFilters.map(id => TEST_CENTERS.find(c => c.id === id)?.city).join(", ")}
            {ctrFilters.length > 0 && (
              <span style={{ background:"var(--brand)", color:"#fff", borderRadius:10, fontSize:10, fontWeight:700, padding:"1px 5px", marginLeft:2 }}>
                {ctrFilters.length}
              </span>
            )}
          </button>
          {filterOpen && (
            <div style={{
              position:"absolute", top:"calc(100% + 4px)", left:0, zIndex:10,
              background:"var(--panel)", border:"1px solid var(--line-2)", borderRadius:8,
              boxShadow:"0 8px 24px rgba(0,0,0,.12)", padding:6, minWidth:180,
            }}>
              <label
                style={{ display:"flex", alignItems:"center", gap:9, padding:"7px 10px", borderRadius:6, cursor:"pointer", transition:"background .1s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--panel-2)")}
                onMouseLeave={e => (e.currentTarget.style.background = "")}
              >
                <input type="checkbox" checked={ctrFilters.length === 0} onChange={() => setCtrFilters([])}
                  style={{ accentColor:"var(--brand)", width:14, height:14, flexShrink:0 }} />
                <span style={{ fontSize:13, fontWeight:500 }}>All Centers</span>
              </label>
              {TEST_CENTERS.map(c => {
                const ctr = CTR[c.id] ?? CTR[""];
                return (
                  <label key={c.id}
                    style={{ display:"flex", alignItems:"center", gap:9, padding:"7px 10px", borderRadius:6, cursor:"pointer", transition:"background .1s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--panel-2)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "")}
                  >
                    <input type="checkbox" checked={ctrFilters.includes(c.id)} onChange={() => toggleCtr(c.id)}
                      style={{ accentColor:"var(--brand)", width:14, height:14, flexShrink:0 }} />
                    <span style={{ width:8, height:8, borderRadius:"50%", background:ctr.color, flexShrink:0 }} />
                    <span style={{ fontSize:13 }}>{c.city}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Team cards grid ─────────────────────────────────────────────── */}
      {visibleTeams.length > 0 ? (
        <div className="to-grid to-g12" style={{ marginBottom:24, alignItems:"stretch" }}>
          {visibleTeams.map(t => (
            <div key={t.id} className="to-s6" style={{ display:"flex" }}>
              <TeamCard team={t} onEdit={() => openEdit(t.id)} />
            </div>
          ))}
        </div>
      ) : (
        <div className="to-chart-empty" style={{ height:200, marginBottom:24 }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ opacity:.35 }}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <div>No teams for selected center</div>
          <button className="to-btn ghost sm" onClick={openNew}>Create first team</button>
        </div>
      )}

      {/* ── Engineer roster ─────────────────────────────────────────────── */}
      <RosterCard addToast={addToast} />

      {/* ── Builder modal ────────────────────────────────────────────────── */}
      {builderOpen && (
        <Builder
          initial={initialDraft}
          onSave={saveTeam}
          onClose={closeBuilder}
        />
      )}
    </div>
  );
}
