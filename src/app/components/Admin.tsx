import { useState } from "react";
import { DATA } from "../data";

// ─── Mock member list ─────────────────────────────────────────────────────────
const MEMBERS = [
  { name: "A. Kovalenko",  email: "a.kovalenko@spysoft.de",  role: "Test Manager", center: "Munich",    status: "active",   initials: "AK" },
  { name: "L. Wójcik",     email: "l.wojcik@spysoft.de",     role: "Test Manager", center: "Stuttgart", status: "active",   initials: "LW" },
  { name: "K. Nowak",      email: "k.nowak@spysoft.de",      role: "Tester",       center: "Warsaw",    status: "active",   initials: "KN" },
  { name: "S. Marek",      email: "s.marek@spysoft.de",      role: "Tester",       center: "Munich",    status: "active",   initials: "SM" },
  { name: "P. Bauer",      email: "p.bauer@spysoft.de",      role: "Tester",       center: "Stuttgart", status: "active",   initials: "PB" },
  { name: "M. Fischer",    email: "m.fischer@spysoft.de",    role: "Tester",       center: "Munich",    status: "active",   initials: "MF" },
  { name: "R. Kowalski",   email: "r.kowalski@spysoft.de",   role: "Tester",       center: "Warsaw",    status: "inactive", initials: "RK" },
  { name: "T. Schneider",  email: "t.schneider@spysoft.de",  role: "Read-only",    center: "Stuttgart", status: "active",   initials: "TS" },
  { name: "E. Müller",     email: "e.mueller@spysoft.de",    role: "Read-only",    center: "Munich",    status: "active",   initials: "EM" },
  { name: "J. Kowalczyk",  email: "j.kowalczyk@spysoft.de", role: "Read-only",    center: "Warsaw",    status: "active",   initials: "JK" },
  { name: "Admin",         email: "admin@spysoft.de",        role: "Admin",        center: "—",         status: "active",   initials: "AD" },
];

const ROLE_COLORS: Record<string, string> = {
  Admin:        "var(--bad)",
  "Test Manager": "var(--brand)",
  Tester:       "var(--ok)",
  "Read-only":  "var(--ink-3)",
};

// ─── Members screen ───────────────────────────────────────────────────────────
export function Members() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  const roles = ["All", ...DATA.roles.map(r => r.name)];
  const visible = MEMBERS.filter(m =>
    (roleFilter === "All" || m.role === roleFilter) &&
    (m.name.toLowerCase().includes(search.toLowerCase()) ||
     m.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="to-screen">
      <div className="to-page-head">
        <div>
          <div className="to-kicker">Users</div>
          <h1>Members</h1>
          <div style={{ color: "var(--ink-2)", fontSize: 13, marginTop: 5 }}>
            Role-based access · {MEMBERS.length} members across all centers
          </div>
        </div>
        <button className="to-btn primary sm">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Invite member
        </button>
      </div>

      <div className="to-grid to-g12">
        {/* Roles sidebar */}
        <div className="to-s4">
          <div className="to-panel">
            <div className="to-panel-h">
              <h3>Roles</h3>
              <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)" }}>
                {MEMBERS.length} total
              </span>
            </div>
            <div className="to-panel-b" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {DATA.roles.map(r => (
                <button
                  key={r.name}
                  onClick={() => setRoleFilter(roleFilter === r.name ? "All" : r.name)}
                  style={{
                    border: `1px solid ${roleFilter === r.name ? "var(--brand)" : "var(--line)"}`,
                    borderRadius: 10, padding: "12px 14px",
                    background: roleFilter === r.name ? "var(--brand-dim)" : "transparent",
                    cursor: "pointer", textAlign: "left", transition: "all .12s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)" }}>{r.name}</div>
                    <span style={{
                      fontSize: 10, padding: "1px 7px", borderRadius: 8, minWidth: 20, textAlign: "center",
                      background: ROLE_COLORS[r.name] + "22", color: ROLE_COLORS[r.name], fontWeight: 600,
                    }}>
                      {r.who}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>{r.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Members table */}
        <div className="to-s8">
          <div className="to-panel">
            <div className="to-panel-h">
              <h3>{roleFilter === "All" ? "All members" : roleFilter}</h3>
              <div style={{ display: "flex", gap: 8 }}>
                {/* Search */}
                <div className="to-search-mini" style={{ maxWidth: 200 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>
                  </svg>
                  <input
                    placeholder="Search members…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                {/* Role filter */}
                <select
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                  style={{
                    height: 32, borderRadius: 6, border: "1px solid var(--line-2)",
                    background: "var(--panel-2)", color: "var(--ink)", fontSize: 12,
                    padding: "0 28px 0 10px", appearance: "none",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center",
                  }}
                >
                  {roles.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <table className="to-tbl">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Role</th>
                  <th>Center</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visible.map(m => (
                  <tr key={m.email}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: 8, display: "grid", placeItems: "center",
                          background: "var(--brand-dim)", color: "var(--brand)", fontSize: 10.5, fontWeight: 700,
                          flexShrink: 0,
                        }}>
                          {m.initials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 550, fontSize: 13, color: "var(--ink)" }}>{m.name}</div>
                          <div style={{ fontSize: 11, color: "var(--ink-4)", fontFamily: "var(--mono)" }}>{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 5,
                        background: (ROLE_COLORS[m.role] ?? "var(--ink-3)") + "22",
                        color: ROLE_COLORS[m.role] ?? "var(--ink-3)",
                      }}>
                        {m.role}
                      </span>
                    </td>
                    <td style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{m.center}</td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 500,
                        color: m.status === "active" ? "var(--ok)" : "var(--ink-4)",
                      }}>
                        {m.status === "active" ? "● Active" : "○ Inactive"}
                      </span>
                    </td>
                    <td>
                      <button className="to-btn ghost sm" style={{ fontSize: 11 }}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visible.length === 0 && (
              <div style={{ padding: "20px", textAlign: "center", fontSize: 13, color: "var(--ink-4)" }}>
                No members match.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Logs screen ──────────────────────────────────────────────────────────────
const FULL_LOG = [
  { who: "K. Nowak",      role: "Tester",       act: "Booked DUT-22 to CMP-210 (17 Jun)",           when: "Today 09:42",      cat: "booking" },
  { who: "S. Marek",      role: "Tester",       act: "Triggered remote reset on TB-04 node",         when: "Today 09:18",      cat: "control" },
  { who: "System",        role: "Edge",         act: "Firmware v3.1.2 pushed to DUT-14, DUT-15",     when: "Today 07:55",      cat: "system"  },
  { who: "L. Wójcik",     role: "Tester",       act: "Created campaign CMP-201",                     when: "Yesterday 16:30",  cat: "campaign" },
  { who: "A. Kovalenko",  role: "Test Manager", act: "Changed S. Marek role → Tester",              when: "Yesterday 11:02",  cat: "admin"   },
  { who: "P. Bauer",      role: "Tester",       act: "Released DUT-09 from CMP-208",                 when: "Yesterday 10:44",  cat: "booking" },
  { who: "System",        role: "Edge",         act: "TB-04 taken offline for scheduled maintenance", when: "Yesterday 08:00",  cat: "system"  },
  { who: "A. Kovalenko",  role: "Test Manager", act: "Exported campaign report CMP-197",             when: "Jun 23 17:12",     cat: "export"  },
  { who: "K. Nowak",      role: "Tester",       act: "Uploaded calibration certificate DUT-22",      when: "Jun 23 14:35",     cat: "asset"   },
  { who: "L. Wójcik",     role: "Tester",       act: "Assigned TB-09 to CMP-210",                    when: "Jun 22 11:20",     cat: "booking" },
  { who: "A. Kovalenko",  role: "Test Manager", act: "Created Test Center TC-BER",                  when: "Jun 22 09:58",     cat: "admin"   },
  { who: "S. Marek",      role: "Tester",       act: "Flagged DUT-45 for investigation",             when: "Jun 21 16:10",     cat: "asset"   },
];

const CAT_COLORS: Record<string, string> = {
  booking:  "var(--brand)", control: "var(--warn)", system: "var(--ink-3)",
  campaign: "var(--ok)",    admin:   "var(--bad)",  export: "var(--ink-2)",
  asset:    "#9B59B6",
};

export function Logs() {
  const [search, setSearch]     = useState("");
  const [catFilter, setCatFilter] = useState("All");

  const cats = ["All", ...Array.from(new Set(FULL_LOG.map(e => e.cat)))];

  const visible = FULL_LOG.filter(e =>
    (catFilter === "All" || e.cat === catFilter) &&
    (e.who.toLowerCase().includes(search.toLowerCase()) ||
     e.act.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="to-screen">
      <div className="to-page-head">
        <div>
          <div className="to-kicker">Users</div>
          <h1>Audit Logs</h1>
          <div style={{ color: "var(--ink-2)", fontSize: 13, marginTop: 5 }}>
            Full trail of who changed what and when
          </div>
        </div>
        <button className="to-btn ghost sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 3v12M8 11l4 4 4-4M5 21h14"/>
          </svg>
          Export CSV
        </button>
      </div>

      <div className="to-panel">
        <div className="to-panel-h">
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>Events</h3>
            <span style={{ fontSize: 11, color: "var(--ink-4)" }}>{visible.length} entries</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {/* Category chips */}
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {cats.map(c => (
                <button
                  key={c}
                  onClick={() => setCatFilter(c)}
                  style={{
                    fontSize: 10.5, padding: "3px 9px", borderRadius: 12, cursor: "pointer",
                    border: `1px solid ${catFilter === c ? "var(--brand)" : "var(--line-2)"}`,
                    background: catFilter === c ? "var(--brand-dim)" : "var(--panel-2)",
                    color: catFilter === c ? "var(--brand)" : "var(--ink-3)",
                    fontWeight: catFilter === c ? 600 : 400,
                    textTransform: "capitalize",
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="to-search-mini" style={{ maxWidth: 200 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>
              </svg>
              <input
                placeholder="Search events…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
        <table className="to-tbl">
          <thead>
            <tr>
              <th>When</th>
              <th>User</th>
              <th>Category</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((e, i) => (
              <tr key={i}>
                <td style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-3)", whiteSpace: "nowrap" }}>
                  {e.when}
                </td>
                <td>
                  <div style={{ fontWeight: 550, fontSize: 13, color: "var(--ink)" }}>{e.who}</div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-3)" }}>{e.role}</div>
                </td>
                <td>
                  <span style={{
                    fontSize: 10.5, fontWeight: 600, padding: "2px 7px", borderRadius: 5,
                    background: (CAT_COLORS[e.cat] ?? "var(--ink-3)") + "22",
                    color: CAT_COLORS[e.cat] ?? "var(--ink-3)",
                    textTransform: "capitalize",
                  }}>
                    {e.cat}
                  </span>
                </td>
                <td style={{ fontSize: 12.5, color: "var(--ink)" }}>{e.act}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && (
          <div style={{ padding: "20px", textAlign: "center", fontSize: 13, color: "var(--ink-4)" }}>
            No events match.
          </div>
        )}
      </div>
    </div>
  );
}
