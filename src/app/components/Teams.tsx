import { useState, useMemo } from "react";
import { TEST_CENTERS } from "../data";

// ─── Types ────────────────────────────────────────────────────────────────────
type Avail = "Available" | "Busy" | "On Leave";

interface Engineer {
  id: string; initials: string; name: string;
  role: string; specialization: string; availability: Avail;
}
interface Member { engineerId: string; teamRole: string }
interface Team   { id: string; name: string; centerId: string; members: Member[]; description: string; createdAt: string }
interface Draft  { name: string; centerId: string; description: string; members: Record<string, string> }

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
  },
  {
    id:"TM-002", name:"Firmware Validation", centerId:"TC-STR",
    members:[{engineerId:"E4",teamRole:"Lead"},{engineerId:"E2",teamRole:"Reviewer"},{engineerId:"E3",teamRole:"Tester"},{engineerId:"E5",teamRole:"Support"}],
    description:"OTA firmware update validation, boot stress testing and power cycle endurance.",
    createdAt:"Sep 2024",
  },
  {
    id:"TM-003", name:"Platform DevOps", centerId:"TC-WAW",
    members:[{engineerId:"E4",teamRole:"Lead"},{engineerId:"E6",teamRole:"Engineer"}],
    description:"CI/CD pipeline management, Jenkins integration and RF antenna lab operations.",
    createdAt:"Jan 2025",
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
      background:"var(--panel)", borderRadius:12, border:"1px solid var(--line)",
      borderLeft:`3px solid ${c.border}`,
      display:"flex", flexDirection:"column",
    }}>
      {/* Header */}
      <div style={{ padding:"16px 18px 12px", borderBottom:"1px solid var(--line)" }}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:6 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:15.5, fontWeight:650, color:"var(--ink)", lineHeight:1.25 }}>{team.name}</div>
            <div style={{ fontSize:11.5, color:"var(--ink-3)", marginTop:3, lineHeight:1.45 }}>{team.description}</div>
          </div>
          <span style={{
            flexShrink:0, padding:"3px 10px", borderRadius:12,
            fontSize:11, fontWeight:600, background:c.bg, color:c.color,
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
                <div style={{ fontSize:12.5, fontWeight:550, color:"var(--ink)" }}>{m.eng.name}</div>
                <div style={{ fontSize:10.5, color:"var(--ink-4)", marginTop:1 }}>{m.eng.specialization}</div>
              </div>
              <span style={{
                fontSize:10.5, padding:"1.5px 7px", borderRadius:4,
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
        <span style={{ fontSize:11, color:"var(--ink-4)" }}>
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
            padding:"4px 24px 4px 8px", background:"var(--panel)", color:"var(--ink)",
            cursor:"pointer", outline:"none", appearance:"auto",
          }}
        >
          {TEAM_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      )}
    </div>
  );
}

// ─── Builder modal ────────────────────────────────────────────────────────────
const EMPTY_DRAFT: Draft = { name:"", centerId:"", description:"", members:{} };

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
                  width:"100%", padding:`9px 12px 9px ${draft.centerId ? "28px" : "12px"}`,
                  border:"1px solid var(--line-2)", borderRadius:8,
                  background:"var(--panel)", color:"var(--ink)", fontSize:13,
                  cursor:"pointer", outline:"none", appearance:"auto",
                  boxSizing:"border-box",
                  transition:"border-color .12s",
                }}
              >
                <option value="">— No center assigned —</option>
                {TEST_CENTERS.map(c => (
                  <option key={c.id} value={c.id}>{c.name} · {c.city}</option>
                ))}
              </select>
            </div>
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
  const [ctrFilter, setCtrFilter] = useState<string>("all");

  const editingTeam = editId ? teams.find(t => t.id === editId) : null;

  const initialDraft: Draft = editingTeam
    ? {
        name: editingTeam.name,
        centerId: editingTeam.centerId,
        description: editingTeam.description,
        members: Object.fromEntries(editingTeam.members.map(m => [m.engineerId, m.teamRole])),
      }
    : EMPTY_DRAFT;

  function openNew()         { setEditId(null); setBuilderOpen(true); }
  function openEdit(id: string) { setEditId(id); setBuilderOpen(true); }
  function closeBuilder()    { setBuilderOpen(false); setEditId(null); }

  function saveTeam(draft: Draft) {
    const members = Object.entries(draft.members).map(([engineerId, teamRole]) => ({ engineerId, teamRole }));
    if (editId) {
      setTeams(prev => prev.map(t => t.id === editId
        ? { ...t, name: draft.name, centerId: draft.centerId, description: draft.description, members }
        : t));
      addToast("Team updated", `${draft.name} saved`, "ok");
    } else {
      const id = `TM-${String(Date.now()).slice(-4)}`;
      setTeams(prev => [...prev, {
        id, name: draft.name, centerId: draft.centerId,
        description: draft.description, members, createdAt: "Jun 2026",
      }]);
      addToast("Team created", `${draft.name} is ready`, "ok");
    }
    closeBuilder();
  }

  const visibleTeams = ctrFilter === "all"
    ? teams
    : teams.filter(t => t.centerId === ctrFilter);

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
      <div style={{ display:"flex", gap:10, marginBottom:20 }}>
        {[
          { label:"Engineers",       val:ENGINEERS.length, sub:"registered",           color:"var(--ink)"   },
          { label:"Available Now",   val:availableCt,      sub:"ready for assignment",  color:"var(--ok)"    },
          { label:"Teams",           val:teams.length,     sub:"active",                color:"var(--brand)" },
          { label:"Centers Covered", val:centersCt,        sub:`of ${TEST_CENTERS.length} total`, color:"var(--ink)" },
          { label:"Member Slots",    val:memberSlots,      sub:"across all teams",      color:"var(--ink)"   },
        ].map(k => (
          <div key={k.label} style={{ flex:1, minWidth:0 }}>
            <div className="to-kpi" style={{ padding:"12px 14px", height:"100%", boxSizing:"border-box" }}>
              <div className="lab">{k.label}</div>
              <div className="val" style={{ color:k.color }}>{k.val}</div>
              <div style={{ fontSize:10, color:"var(--ink-4)", marginTop:3, lineHeight:1.3 }}>{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Center filter ────────────────────────────────────────────────── */}
      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:18 }}>
        <span style={{ fontSize:11, color:"var(--ink-4)", fontWeight:500, textTransform:"uppercase", letterSpacing:".07em" }}>
          Center
        </span>
        {[{ id:"all", label:"All" }, ...TEST_CENTERS.map(c => ({ id:c.id, label:c.city }))].map(f => {
          const active = ctrFilter === f.id;
          const fc = f.id !== "all" ? CTR[f.id] : null;
          return (
            <button
              key={f.id}
              onClick={() => setCtrFilter(f.id)}
              style={{
                display:"inline-flex", alignItems:"center", gap:6,
                padding:"4px 12px", borderRadius:16,
                border: active ? "1.5px solid var(--brand)" : "1.5px solid var(--line-2)",
                background: active ? "var(--brand-dim)" : "var(--panel-2)",
                color: active ? "var(--brand)" : "var(--ink-3)",
                fontSize:12, fontWeight: active ? 600 : 400,
                cursor:"pointer", transition:"all .12s",
              }}
            >
              {fc && (
                <span style={{ width:6, height:6, borderRadius:"50%", background:fc.color, display:"inline-block" }} />
              )}
              {f.label}
            </button>
          );
        })}
      </div>

      {/* ── Team cards grid ─────────────────────────────────────────────── */}
      {visibleTeams.length > 0 ? (
        <div className="to-grid to-g12" style={{ marginBottom:24 }}>
          {visibleTeams.map(t => (
            <div key={t.id} className="to-s6">
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
