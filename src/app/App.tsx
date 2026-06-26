import { useState, useEffect } from "react";
import { Asset, ASSETS_INITIAL, DATA, TestBench, BENCHES_INITIAL, TEST_CENTERS, BRAND_CONFIG } from "./data";

export type Role = "manager" | "hw-engineer" | "engineer";
import { Dashboard } from "./components/Dashboard";
import { Assets } from "./components/Assets";
import { Edge } from "./components/Edge";
import { Campaigns } from "./components/Campaigns";
import { AIInsights, runNLQuery } from "./components/AIInsights";
import { Reports } from "./components/Reports";
import { Members, Logs } from "./components/Admin";
import { Roadmap } from "./components/Roadmap";
import { DUTDrawer, AssetDrawer } from "./components/Drawers";
import { TestBenches } from "./components/TestBenches";
import { TestCenters } from "./components/TestCenters";
import { BenchDetail } from "./components/BenchDetail";
import { AIChat } from "./components/AIChat";
import { AssetForm } from "./components/AssetForm";
import { CreateBenchSheet } from "./components/CreateBenchSheet";
import { Teams } from "./components/Teams";
import { ResourceSharing } from "./components/ResourceSharing";

type Screen = "ops" | "assets" | "edge" | "campaigns" | "ai" | "reports" | "members" | "logs" | "roadmap" | "benches" | "centers" | "teams" | "sharing";

interface ToastItem { id: number; title: string; subtitle?: string; type?: string }
interface DrawerState { open: boolean; type: "dut" | "asset" | null; id: string | null }
interface ModalState { open: boolean; type: "checkout" | "checkin" | null; tags: string[] }
interface AIAnswer { q: string; summary: string; rows?: typeof DATA.duts }

const TITLES: Record<Screen, string> = {
  ops:"Live Dashboard", assets:"Assets", edge:"Edge & Telemetry", campaigns:"Campaigns",
  ai:"AI Insights", reports:"Reports", members:"Members", logs:"Audit Logs", roadmap:"Future modules",
  benches:"Test Benches", centers:"Test Centers", teams:"Teams", sharing:"Resource Sharing",
};

const NAV: { screen: Screen; label: string; icon: string; group: string; soon?: boolean; badge?: string }[] = [
  {group:"Operate", screen:"ops", label:"Live Dashboard", icon:'<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>'},
  {group:"", screen:"centers", label:"Test Centers", icon:'<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'},
  {group:"", screen:"sharing", label:"Resource Sharing", icon:'<path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>'},
  {group:"", screen:"benches", label:"Test Benches", icon:'<rect x="2" y="3" width="20" height="5" rx="1.5"/><rect x="2" y="10" width="20" height="5" rx="1.5"/><rect x="2" y="17" width="20" height="4" rx="1.5"/><circle cx="18" cy="5.5" r="1.2" fill="currentColor"/><circle cx="18" cy="12.5" r="1.2" fill="currentColor"/>'},
  {group:"", screen:"assets", label:"Assets", icon:'<rect x="3" y="4" width="18" height="5" rx="1.5"/><rect x="3" y="10" width="18" height="5" rx="1.5"/><rect x="3" y="16" width="18" height="4" rx="1.5"/><circle cx="7" cy="6.5" r="1" fill="currentColor"/><circle cx="7" cy="12.5" r="1" fill="currentColor"/>'},
  {group:"", screen:"campaigns", label:"Campaigns", icon:'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>'},
  {group:"Intelligence", screen:"ai", label:"AI Insights", icon:'<path d="M9 3a3 3 0 0 0-3 3 3 3 0 0 0-1 5.8V18a3 3 0 0 0 4 2.8M9 3a2.5 2.5 0 0 1 3 2.4v13.2A2.5 2.5 0 0 1 9 21M15 3a3 3 0 0 1 3 3 3 3 0 0 1 1 5.8V18a3 3 0 0 1-4 2.8M15 3a2.5 2.5 0 0 0-3 2.4"/>'},
  {group:"", screen:"reports", label:"Reports", icon:'<path d="M5 3h9l5 5v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5M8 13h8M8 17h5"/>'},
  {group:"Users", screen:"teams",   label:"Teams",      icon:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'},
  {group:"",      screen:"members", label:"Members",    icon:'<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="18" cy="9" r="2.2"/><path d="M21.5 20c0-2.4-1.6-4.3-3.5-4.3"/>'},
  {group:"",      screen:"logs",    label:"Logs",       icon:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/>'},
];

export default function App() {
  const [screen, setScreen] = useState<Screen>("ops");
  const [assets, setAssets] = useState<Asset[]>(ASSETS_INITIAL);
  const [benches, setBenches] = useState<TestBench[]>(BENCHES_INITIAL);
  const [selectedBench, setSelectedBench] = useState<string | null>(null);
  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(null);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<AIAnswer | null>(null);
  const [drawer, setDrawer] = useState<DrawerState>({open:false, type:null, id:null});
  const [modal, setModal] = useState<ModalState>({open:false, type:null, tags:[]});
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [railOpen, setRailOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<Role>("manager");
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    (localStorage.getItem("to-theme") as "light" | "dark") || "light"
  );

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("to-theme", next);
  };

  // AssetForm state
  const [assetFormState, setAssetFormState] = useState<{open: boolean; mode: "create" | "edit"; assetTag?: string}>({open:false, mode:"create"});

  // CreateBenchSheet state
  const [createBenchOpen, setCreateBenchOpen] = useState(false);

  // modal form state
  const [coAssignee, setCoAssignee] = useState(DATA.assignees.teams[0]);
  const [coLocation, setCoLocation] = useState(DATA.locations[0]);
  const [coCampaign, setCoCampaign] = useState("");
  const [ciCond, setCiCond] = useState("OK — Ready to Deploy");

  const addToast = (title: string, subtitle?: string, type?: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, {id, title, subtitle, type}]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200);
  };

  const go = (s: Screen) => {
    if (s !== "ai") setAiAnswer(null);
    if (s !== "benches") setSelectedBench(null);
    setSelectedCenterId(null);
    setScreen(s);
    setRailOpen(false);
    window.scrollTo(0,0);
  };

  const openCenter = (centerId: string) => {
    setSelectedCenterId(centerId);
    setSelectedBench(null);
    setScreen("benches");
    setRailOpen(false);
    window.scrollTo(0,0);
  };

  const openDUTDrawer = (id: string) => setDrawer({open:true, type:"dut", id});
  const openAssetDrawer = (tag: string) => setDrawer({open:true, type:"asset", id:tag});
  const closeDrawer = () => setDrawer({open:false, type:null, id:null});

  const openCheckoutModal = (tags: string[]) => {
    setCoAssignee(DATA.assignees.teams[0]);
    setCoLocation(DATA.locations[0]);
    setCoCampaign("");
    setModal({open:true, type:"checkout", tags});
  };
  const openCheckinModal = (tag: string) => {
    setCiCond("OK — Ready to Deploy");
    setModal({open:true, type:"checkin", tags:[tag]});
  };
  const closeModal = () => setModal(prev => ({...prev, open:false}));

  const doCheckout = () => {
    setAssets(prev => prev.map(a =>
      modal.tags.includes(a.tag) ? {...a, status:"deployed" as const, assignee:coAssignee, location:coLocation} : a
    ));
    closeModal();
    addToast(`${modal.tags.length} asset${modal.tags.length>1?"s":""} checked out`, `Assigned to ${coAssignee}`);
  };

  const doCheckin = () => {
    const tag = modal.tags[0];
    setAssets(prev => prev.map(a => a.tag === tag ? {
      ...a, assignee: null,
      status: (ciCond.includes("calibration") || ciCond.includes("Fault") ? "investigating" : "ready") as Asset["status"],
      audit: ciCond.includes("calibration") ? {due:true, date:"2026-07-01"} : a.audit,
    } : a));
    closeModal();
    addToast("Checked in", `#${tag} returned to inventory`);
  };

  const deleteAsset = (tag: string) => {
    setAssets(prev => prev.filter(a => a.tag !== tag));
    addToast("Deleted", `#${tag} removed from inventory`);
  };

  const cloneAsset = (tag: string) => addToast("Cloned", `#${tag} duplicated as draft`);

  const handleQuery = (q: string) => {
    const answer = runNLQuery(q, DATA.duts);
    setAiAnswer(answer);
    go("ai");
  };

  const handleQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) { handleQuery(query.trim()); setQuery(""); }
  };

  const handleAssetSave = (newAsset: Asset) => {
    if (assetFormState.mode === "create") {
      setAssets(prev => [newAsset, ...prev]);
    } else {
      setAssets(prev => prev.map(a => a.tag === newAsset.tag ? newAsset : a));
    }
    setAssetFormState({open:false, mode:"create"});
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { closeDrawer(); closeModal(); setAssetFormState(s => ({...s, open:false})); setCreateBenchOpen(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  let lastGroup = "";

  return (
    <div className="testops" data-theme={theme} style={{"--brand": BRAND_CONFIG.primaryColor} as React.CSSProperties}>
      <div className="to-app">
        {/* Rail */}
        <aside className={`to-rail ${railOpen ? "show" : ""}`}>
          <div className="to-brand">
            <span>
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                <rect x="1" y="1" width="28" height="28" rx="8" fill="var(--panel-2)" stroke="var(--line-2)"/>
                <path d="M4 16 L9 16 L11.5 9 L15 22 L18 13 L20 16 L26 16" stroke="var(--brand)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <circle cx="18" cy="13" r="1.6" fill="var(--brand)"/>
              </svg>
            </span>
            <div>
              <div className="wm">Test<b>Ops</b></div>
              <div className="sub">Platform</div>
            </div>
          </div>
          <div className="to-tagline">{BRAND_CONFIG.tagline}</div>

          <nav>
            {NAV.map(item => {
              const showGroup = item.group && item.group !== lastGroup;
              if (showGroup) lastGroup = item.group;
              return (
                <span key={item.screen}>
                  {showGroup && <div className="to-nav-group-label">{item.group}</div>}
                  <button
                    className={`to-nav-item ${screen === item.screen ? "active" : ""} ${item.soon ? "soon" : ""}`}
                    onClick={() => go(item.screen)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" dangerouslySetInnerHTML={{__html: item.icon}} />
                    {item.label}
                    {item.badge && <span className="badge">{item.badge}</span>}
                  </button>
                </span>
              );
            })}
          </nav>

          <div className="to-rail-foot">
            {/* Role switcher for demo */}
            <div style={{ padding: "10px 12px 12px", borderBottom: "1px solid var(--line)" }}>
              <div style={{
                fontSize: 9.5, fontWeight: 700, color: "var(--ink-4)",
                textTransform: "uppercase", letterSpacing: ".08em",
                marginBottom: 7, display: "flex", alignItems: "center", gap: 5,
              }}>
                <span style={{
                  padding: "1px 5px", borderRadius: 3,
                  background: "rgba(94,106,210,.12)", color: "var(--brand)",
                  fontSize: 8.5, fontWeight: 700, letterSpacing: ".06em",
                }}>DEMO</span>
                View Role
              </div>
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                background: "var(--panel-2)", borderRadius: 7, padding: 2, gap: 2,
              }}>
                {(["manager", "hw-engineer", "engineer"] as const).map(r => {
                  const labels: Record<Role, string> = { "manager": "Manager", "hw-engineer": "HW Eng", "engineer": "Engineer" };
                  const active = currentRole === r;
                  return (
                    <button
                      key={r}
                      onClick={() => setCurrentRole(r)}
                      style={{
                        padding: "5px 2px", borderRadius: 5, border: "none",
                        fontSize: 10.5, fontWeight: active ? 600 : 400,
                        background: active ? "var(--panel)" : "transparent",
                        color: active ? "var(--brand)" : "var(--ink-4)",
                        cursor: "pointer", transition: "all .12s",
                        boxShadow: active ? "0 1px 3px rgba(0,0,0,.1)" : "none",
                      }}
                    >
                      {labels[r]}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="to-who">
              <div className="to-avatar">AK</div>
              <div><div className="nm">A. Kovalenko</div><div className="rl">Test Manager</div></div>
              <button
                onClick={toggleTheme}
                title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                style={{
                  marginLeft: "auto", width: 28, height: 28, borderRadius: 6,
                  border: "1px solid var(--line-2)", background: "var(--panel-2)",
                  display: "grid", placeItems: "center",
                  color: "var(--ink-3)", cursor: "pointer", flexShrink: 0,
                  transition: "background .1s, color .1s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--panel-3)"; e.currentTarget.style.color = "var(--ink)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "var(--panel-2)"; e.currentTarget.style.color = "var(--ink-3)"; }}
              >
                {theme === "light" ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="5"/>
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                  </svg>
                )}
              </button>
            </div>
            <div className="to-spyro">{BRAND_CONFIG.companyName}</div>
          </div>
        </aside>

        {/* Main */}
        <div className="to-main">
          <header className="to-topbar">
            <button style={{width:32,height:32,borderRadius:6,border:"1px solid var(--line)",background:"var(--panel-2)",display:"grid",placeItems:"center",color:"var(--ink-2)"}} onClick={() => setRailOpen(r => !r)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
            <div className="to-crumbs">
              {screen === "benches" && selectedBench ? (
                <>
                  {selectedCenterId ? (
                    <>
                      <button className="to-linklike" style={{fontSize:13}} onClick={() => { setSelectedCenterId(null); setSelectedBench(null); setScreen("centers"); }}>Test Centers</button>
                      <span style={{color:"var(--ink-3)",margin:"0 6px"}}>/</span>
                      <button className="to-linklike" style={{fontSize:13}} onClick={() => setSelectedBench(null)}>
                        {TEST_CENTERS.find(c => c.id === selectedCenterId)?.name || selectedCenterId}
                      </button>
                      <span style={{color:"var(--ink-3)",margin:"0 6px"}}>/</span>
                    </>
                  ) : (
                    <>
                      <button className="to-linklike" style={{fontSize:13}} onClick={() => setSelectedBench(null)}>Test Benches</button>
                      <span style={{color:"var(--ink-3)",margin:"0 6px"}}>/</span>
                    </>
                  )}
                  <b>{benches.find(b => b.id === selectedBench)?.name || selectedBench}</b>
                </>
              ) : (
                <b>{TITLES[screen]}</b>
              )}
            </div>
            <form className="to-query" onSubmit={handleQuerySubmit}>
              <svg className="qicon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder='Ask the platform — e.g. "Show DUTs with uptime < 90% this quarter"' />
              <span className="kbd">⏎</span>
            </form>
            <div className="to-top-actions">
              <div className="to-status-pill"><span className="to-dot live" />HW-LAB-PL-01 · 10/12 beds</div>
              <button className="to-iconbtn" title="alerts" onClick={() => go("ops")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>
                <span className="nd" />
              </button>
            </div>
          </header>

          <main className="to-content">
            {screen === "ops" && <Dashboard onBedClick={id => { setSelectedBench(id); setScreen("benches"); }} onGoReports={() => go("reports")} onGoAI={() => go("ai")} addToast={addToast} role={currentRole} />}
            {screen === "assets" && <Assets assets={assets} onOpenAsset={openAssetDrawer} onCheckout={openCheckoutModal} onCheckin={openCheckinModal} onRegister={() => setAssetFormState({open:true, mode:"create"})} onDelete={deleteAsset} onClone={cloneAsset} onEdit={tag => setAssetFormState({open:true, mode:"edit", assetTag:tag})} addToast={addToast} />}
            {screen === "edge" && <Edge addToast={addToast} />}
            {screen === "campaigns" && <Campaigns addToast={addToast} />}
            {screen === "ai" && <AIInsights answer={aiAnswer} onQuery={handleQuery} onOpenDUT={openDUTDrawer} />}
            {screen === "reports" && <Reports addToast={addToast} />}
            {screen === "teams"   && <Teams addToast={addToast} />}
            {screen === "members" && <Members />}
            {screen === "logs"    && <Logs />}
            {screen === "roadmap" && <Roadmap />}
            {screen === "sharing" && <ResourceSharing addToast={addToast} />}
            {screen === "centers" && (
              <TestCenters
                centers={TEST_CENTERS}
                benches={benches}
                onOpenCenter={openCenter}
              />
            )}
            {screen === "benches" && selectedBench === null && (() => {
              const centerFilter = selectedCenterId ? TEST_CENTERS.find(c => c.id === selectedCenterId) : null;
              const visibleBenches = centerFilter
                ? benches.filter(b => centerFilter.benchIds.includes(b.id))
                : benches;
              return (
                <TestBenches
                  benches={visibleBenches}
                  onOpenBench={id => setSelectedBench(id)}
                  onCreateBench={() => setCreateBenchOpen(true)}
                  addToast={addToast}
                />
              );
            })()}
            {screen === "benches" && selectedBench !== null && (() => {
              const bench = benches.find(b => b.id === selectedBench);
              if (!bench) return <div className="to-screen"><div style={{color:"var(--bad)"}}>Bench not found</div></div>;
              return (
                <BenchDetail
                  bench={bench}
                  assets={assets}
                  onBack={() => setSelectedBench(null)}
                  onOpenAsset={openAssetDrawer}
                  onEdit={() => addToast("Edit bench", "Opening edit form…", "info")}
                  addToast={addToast}
                  role={currentRole}
                />
              );
            })()}
          </main>
        </div>
      </div>

      {/* Drawer */}
      <div className={`to-scrim ${drawer.open ? "open" : ""}`} onClick={closeDrawer} />
      <aside className={`to-drawer ${drawer.open ? "open" : ""}`}>
        {drawer.open && drawer.type === "dut" && drawer.id && (
          <DUTDrawer id={drawer.id} onClose={closeDrawer} onGoEdge={() => { closeDrawer(); go("benches"); }} addToast={addToast} />
        )}
        {drawer.open && drawer.type === "asset" && drawer.id && (
          <AssetDrawer
            tag={drawer.id}
            assets={assets}
            onClose={closeDrawer}
            onCheckout={openCheckoutModal}
            onCheckin={openCheckinModal}
            onEdit={tag => { closeDrawer(); setAssetFormState({open:true, mode:"edit", assetTag:tag}); }}
            addToast={addToast}
          />
        )}
      </aside>

      {/* Modal — checkout / checkin only (register moved to AssetForm) */}
      <div className={`to-modal-scrim ${modal.open ? "open" : ""}`} onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
        <div className="to-modal">
          {modal.type === "checkout" && (
            <>
              <div className="to-modal-h">
                <div>
                  <h3>Check out {modal.tags.length > 1 ? `${modal.tags.length} assets` : `#${modal.tags[0]}`}</h3>
                  <div className="sub">Assign hardware to a tester, team or campaign</div>
                </div>
                <button className="to-modal-x" onClick={closeModal}>✕</button>
              </div>
              <div className="to-modal-b">
                <div className="to-field">
                  <label>Check out to</label>
                  <select value={coAssignee} onChange={e => setCoAssignee(e.target.value)}>
                    <optgroup label="Teams">{DATA.assignees.teams.map(t => <option key={t}>{t}</option>)}</optgroup>
                    <optgroup label="People">{DATA.assignees.people.map(p => <option key={p}>{p}</option>)}</optgroup>
                  </select>
                </div>
                <div className="to-field-row">
                  <div className="to-field">
                    <label>Location</label>
                    <select value={coLocation} onChange={e => setCoLocation(e.target.value)}>
                      {DATA.locations.map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="to-field"><label>Expected checkin</label><input type="date" defaultValue="2026-06-30" /></div>
                </div>
                <div className="to-field">
                  <label>Campaign (optional)</label>
                  <select value={coCampaign} onChange={e => setCoCampaign(e.target.value)}>
                    <option value="">— none —</option>
                    {DATA.campaigns.progress.map(c => <option key={c.id}>{c.id} · {c.title}</option>)}
                  </select>
                </div>
                <div className="to-field"><label>Notes</label><textarea rows={2} placeholder="Optional" /></div>
              </div>
              <div className="to-modal-f">
                <button className="to-btn ghost sm" onClick={closeModal}>Cancel</button>
                <button className="to-btn primary sm" onClick={doCheckout}>Confirm checkout</button>
              </div>
            </>
          )}
          {modal.type === "checkin" && (
            <>
              <div className="to-modal-h">
                <div>
                  <h3>Check in #{modal.tags[0]}</h3>
                  <div className="sub">Return asset to inventory</div>
                </div>
                <button className="to-modal-x" onClick={closeModal}>✕</button>
              </div>
              <div className="to-modal-b">
                <div style={{fontSize:13,color:"var(--ink-2)",lineHeight:1.5}}>
                  Currently checked out to <b style={{color:"var(--ink)"}}>{assets.find(a=>a.tag===modal.tags[0])?.assignee||"—"}</b>. Checking it in makes it available for booking again.
                </div>
                <div className="to-field">
                  <label>Condition on return</label>
                  <select value={ciCond} onChange={e => setCiCond(e.target.value)}>
                    <option>OK — Ready to Deploy</option>
                    <option>Needs calibration / audit</option>
                    <option>Fault — Investigating</option>
                  </select>
                </div>
              </div>
              <div className="to-modal-f">
                <button className="to-btn ghost sm" onClick={closeModal}>Cancel</button>
                <button className="to-btn accent sm" onClick={doCheckin}>Confirm checkin</button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Asset Form overlay */}
      <AssetForm
        open={assetFormState.open}
        mode={assetFormState.mode}
        asset={assetFormState.assetTag ? assets.find(a => a.tag === assetFormState.assetTag) : undefined}
        assets={assets}
        onClose={() => setAssetFormState({open:false, mode:"create"})}
        onSave={handleAssetSave}
        addToast={addToast}
      />

      {/* Create Bench Sheet overlay */}
      <CreateBenchSheet
        open={createBenchOpen}
        assets={assets}
        onClose={() => setCreateBenchOpen(false)}
        onCreate={bench => {
          setBenches(prev => [bench, ...prev]);
          setCreateBenchOpen(false);
          addToast("Test bench created", bench.name + " is ready");
        }}
        addToast={addToast}
      />

      {/* AI floating button */}
      <button
        onClick={() => setAiChatOpen(true)}
        title="AI Assistant"
        style={{
          position: "fixed", bottom: 28, right: 28,
          width: 52, height: 52, borderRadius: "50%",
          background: "var(--brand)",
          color: "#fff",
          border: "none", cursor: "pointer",
          boxShadow: "0 4px 20px rgba(94,106,210,.5)",
          display: "grid", placeItems: "center",
          zIndex: 700,
          transition: "transform .15s, box-shadow .15s",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = "scale(1.08)";
          e.currentTarget.style.boxShadow = "0 6px 28px rgba(94,106,210,.65)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = "";
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(94,106,210,.5)";
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6z"/>
          <path d="M19 3l.9 2.7L22 7l-2.1.7L19 10l-.9-2.3L16 7l2.1-.7z" opacity=".6"/>
          <path d="M5 17l.7 2.1L8 20l-1.7.5L5 22l-.7-1.9L2 19l1.7-.5z" opacity=".5"/>
        </svg>
      </button>

      {/* AI Chat panel */}
      <AIChat open={aiChatOpen} onClose={() => setAiChatOpen(false)} />

      {/* Toasts */}
      <div className="to-toasts">
        {toasts.map(t => (
          <div key={t.id} className={`to-toast ${t.type || ""}`}>
            <div className="ti">
              {t.type === "info"
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 16v-5M12 8h.01"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 13l4 4L19 7"/></svg>}
            </div>
            <div>
              <div className="tx">{t.title}</div>
              {t.subtitle && <div className="ts">{t.subtitle}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
