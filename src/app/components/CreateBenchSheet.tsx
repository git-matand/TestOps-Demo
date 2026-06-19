import { useState } from "react";
import { Asset, TestBench, DATA } from "../data";
import { BenchAsset } from "../data";

interface CreateBenchSheetProps {
  open: boolean;
  assets: Asset[];
  onClose: () => void;
  onCreate: (bench: TestBench) => void;
  addToast: (t: string, s?: string, type?: string) => void;
}

interface ComposedAsset {
  tag: string;
  role: string;
  where: string;
  isPrimary: boolean;
}

const STEPS = [
  { label: "Identity" },
  { label: "Compose assets" },
  { label: "Review & create" },
];

function generateId(): string {
  const num = Math.floor(Math.random() * 900) + 100;
  return `TB-${num}`;
}

export function CreateBenchSheet({ open, assets, onClose, onCreate, addToast }: CreateBenchSheetProps) {
  const [step, setStep] = useState(0);

  // Step 1: Identity
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [owner, setOwner] = useState(DATA.assignees.people[0]);
  const [location, setLocation] = useState(DATA.locations[0]);
  const [richosHost, setRichosHost] = useState("");
  const [winHost, setWinHost] = useState("");

  // Step 2: Composition
  const [composed, setComposed] = useState<ComposedAsset[]>([]);
  const [assetSearch, setAssetSearch] = useState("");

  // Errors
  const [nameError, setNameError] = useState("");
  const [compositionError, setCompositionError] = useState("");

  const [creating, setCreating] = useState(false);

  const availableAssets = assets.filter(a =>
    a.status === "ready" || a.status === "deployed"
  ).filter(a => {
    if (!assetSearch) return true;
    return (a.tag + a.name + a.model + a.cat).toLowerCase().includes(assetSearch.toLowerCase());
  });

  const isComposed = (tag: string) => composed.some(c => c.tag === tag);

  const toggleAsset = (tag: string) => {
    if (isComposed(tag)) {
      setComposed(prev => prev.filter(c => c.tag !== tag));
    } else {
      setComposed(prev => [...prev, { tag, role: "", where: "", isPrimary: prev.length === 0 }]);
    }
  };

  const updateComposed = (tag: string, field: keyof ComposedAsset, value: string | boolean) => {
    setComposed(prev => prev.map(c => c.tag === tag ? { ...c, [field]: value } : c));
  };

  const setPrimary = (tag: string) => {
    setComposed(prev => prev.map(c => ({ ...c, isPrimary: c.tag === tag })));
  };

  const validateStep = (s: number): boolean => {
    if (s === 0) {
      if (!name.trim()) {
        setNameError("Bench name is required");
        return false;
      }
      setNameError("");
      return true;
    }
    if (s === 1) {
      if (composed.length === 0) {
        setCompositionError("Add at least one asset to the composition");
        return false;
      }
      setCompositionError("");
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => setStep(prev => prev - 1);

  const handleCreate = async () => {
    setCreating(true);
    await new Promise(r => setTimeout(r, 500));

    const hosts: TestBench["hosts"] = [];
    if (richosHost.trim()) hosts.push({ hostId: richosHost.trim(), platform: "RichOS" });
    if (winHost.trim()) {
      hosts.push({ hostId: winHost.trim(), platform: "Windows", rdpLink: `rdp://${winHost.trim()}.lab.local` });
    }
    if (hosts.length === 0) {
      // Provide a placeholder host
      hosts.push({ hostId: `x${Math.floor(Math.random() * 900) + 100}`, platform: "RichOS" });
    }

    const composition: BenchAsset[] = composed.map(c => ({
      assetTag: c.tag,
      role: c.role || "Support",
      where: c.where || location,
      isPrimaryDUT: c.isPrimary,
      state: "active" as const,
    }));

    const bench: TestBench = {
      id: generateId(),
      name: name.trim(),
      description: desc.trim() || "No description provided.",
      owner,
      createdAt: new Date().toISOString().slice(0, 10),
      location,
      hosts,
      status: "Up",
      richosState: "running",
      lastChange: new Date().toLocaleString(),
      lastPingValue: 5,
      recentDown: false,
      build: undefined,
      composition,
      telemetry: {
        cpuPct: 0, memPct: 0, diskPct: 0,
        memUsedGb: 0, memTotalGb: 14, memAvailGb: 14,
        collectorUp: false, lastSeen: "just created",
      },
      dfTable: [
        { fs: "/dev/root", size: "14G", used: "0G", avail: "14G", usePct: 0, mount: "/" },
      ],
      coredumps: [],
    };

    setCreating(false);
    onCreate(bench);
    // Reset state
    setStep(0);
    setName(""); setDesc(""); setOwner(DATA.assignees.people[0]);
    setLocation(DATA.locations[0]); setRichosHost(""); setWinHost("");
    setComposed([]); setAssetSearch("");
    setNameError(""); setCompositionError("");
  };

  if (!open) return null;

  return (
    <>
      {/* Scrim */}
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 49 }}
        onClick={onClose}
      />

      <div className={`to-drawer-wide ${open ? "open" : ""}`}>
        {/* Header */}
        <div className="to-drawer-h" style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>New test bench</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 3 }}>
              Configure a new test bench in 3 steps
            </div>
          </div>
          <button className="to-drawer-x" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        {/* Step indicator */}
        <div style={{ padding: "16px 20px 0" }}>
          <div className="to-steps">
            {STEPS.map((s, i) => {
              const cls = i < step ? "done" : i === step ? "active" : "pending";
              return (
                <div key={i} className={`to-step ${i === step ? "active" : ""}`}>
                  <div className={`to-step-dot ${cls}`}>
                    {i < step
                      ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7" /></svg>
                      : i + 1}
                  </div>
                  <div className="to-step-label">{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="to-drawer-b" style={{ overflowY: "auto", flex: 1, padding: "4px 20px 20px" }}>

          {/* STEP 1: Identity */}
          {step === 0 && (
            <div>
              <div className="to-form-section">
                <div className="to-form-section-title">Bench identity</div>
                <div className="to-field">
                  <label>Name <span style={{ color: "var(--bad)" }}>*</span></label>
                  <input value={name} onChange={e => { setName(e.target.value); setNameError(""); }} placeholder="e.g. CAN-Stack Regression" />
                  {nameError && <div style={{ fontSize: 11, color: "var(--bad)", marginTop: 4 }}>⚠ {nameError}</div>}
                </div>
                <div className="to-field">
                  <label>Description / Purpose</label>
                  <textarea rows={3} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Describe this bench's purpose and test scenarios…" />
                </div>
                <div className="to-field-row">
                  <div className="to-field">
                    <label>Owner</label>
                    <select value={owner} onChange={e => setOwner(e.target.value)}>
                      {DATA.assignees.people.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="to-field">
                    <label>Location</label>
                    <select value={location} onChange={e => setLocation(e.target.value)}>
                      {DATA.locations.map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="to-form-section">
                <div className="to-form-section-title">Hosts</div>
                <div className="to-field">
                  <label>RichOS host</label>
                  <input value={richosHost} onChange={e => setRichosHost(e.target.value)} placeholder="e.g. x178" />
                </div>
                <div className="to-field">
                  <label>Windows worker (optional)</label>
                  <input value={winHost} onChange={e => setWinHost(e.target.value)} placeholder="e.g. x231" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Compose assets */}
          {step === 1 && (
            <div>
              <div className="to-form-section">
                <div className="to-form-section-title">Select assets</div>
                {compositionError && (
                  <div style={{ fontSize: 12, color: "var(--warn)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>⚠</span> {compositionError}
                  </div>
                )}
                <div className="to-search-mini" style={{ marginBottom: 12 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" />
                  </svg>
                  <input
                    placeholder="Search assets…"
                    value={assetSearch}
                    onChange={e => setAssetSearch(e.target.value)}
                  />
                </div>

                <div style={{ maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                  {availableAssets.map(a => {
                    const sel = isComposed(a.tag);
                    const isDeployed = a.status === "deployed";
                    return (
                      <div
                        key={a.tag}
                        style={{
                          display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                          border: `1px solid ${sel ? "var(--brand-cta)" : "var(--line)"}`,
                          borderRadius: 8, background: sel ? "var(--brand-dim)" : "var(--panel-2)",
                          cursor: "pointer",
                        }}
                        onClick={() => toggleAsset(a.tag)}
                      >
                        <input type="checkbox" checked={sel} onChange={() => toggleAsset(a.tag)} onClick={e => e.stopPropagation()} />
                        <span style={{ fontFamily: "var(--mono)", fontSize: 12, minWidth: 50 }}>{a.tag}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 500 }}>{a.name !== "—" ? a.name : a.model}</div>
                          <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{a.model} · {a.cat}</div>
                        </div>
                        {isDeployed && (
                          <span className="to-conflict-badge">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M10.3 3.3l-8.3 14.4h16.6z" /><path d="M12 9v5M12 16h.01" />
                            </svg>
                            Already deployed
                          </span>
                        )}
                        <span className={`to-chip ${a.status === "ready" ? "ok" : "warn"}`} style={{ fontSize: 10 }}>
                          {a.status}
                        </span>
                      </div>
                    );
                  })}
                  {availableAssets.length === 0 && (
                    <div className="to-chart-empty" style={{ height: 80 }}>No available assets match your search</div>
                  )}
                </div>
              </div>

              {/* Composition summary */}
              {composed.length > 0 && (
                <div className="to-form-section">
                  <div className="to-form-section-title">Composition ({composed.length})</div>
                  {composed.map(c => {
                    const assetData = assets.find(a => a.tag === c.tag);
                    return (
                      <div key={c.tag} className={`to-compose-row ${c.isPrimary ? "primary" : ""}`}>
                        <div>
                          {c.isPrimary ? (
                            <span style={{ color: "var(--warn)", fontSize: 14 }} title="Primary DUT">★</span>
                          ) : (
                            <button
                              style={{ width: 20, height: 20, borderRadius: "50%", border: "1px solid var(--line-2)", background: "none", color: "var(--ink-3)", fontSize: 12, cursor: "pointer" }}
                              title="Set as Primary DUT"
                              onClick={() => setPrimary(c.tag)}
                            >☆</button>
                          )}
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 500 }}>{assetData?.name !== "—" ? assetData?.name : assetData?.model || c.tag}</div>
                          <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{c.tag}</div>
                        </div>
                        <input
                          placeholder="Role…"
                          value={c.role}
                          onChange={e => updateComposed(c.tag, "role", e.target.value)}
                          style={{ background: "var(--panel-3)", border: "1px solid var(--line-2)", borderRadius: 6, color: "var(--ink)", fontSize: 12, padding: "4px 8px" }}
                        />
                        <input
                          placeholder="Position / slot…"
                          value={c.where}
                          onChange={e => updateComposed(c.tag, "where", e.target.value)}
                          style={{ background: "var(--panel-3)", border: "1px solid var(--line-2)", borderRadius: 6, color: "var(--ink)", fontSize: 12, padding: "4px 8px" }}
                        />
                        <button
                          style={{ color: "var(--ink-3)", fontSize: 16, cursor: "pointer", background: "none", border: "none" }}
                          onClick={() => setComposed(prev => prev.filter(x => x.tag !== c.tag))}
                        >✕</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Review & create */}
          {step === 2 && (
            <div>
              <div className="to-form-section">
                <div className="to-form-section-title">Review</div>
                <div className="to-panel" style={{ padding: "16px", marginBottom: 0 }}>
                  <div className="to-spec"><span className="k">Name</span><span className="v" style={{ fontWeight: 600 }}>{name}</span></div>
                  {desc && <div className="to-spec" style={{ alignItems: "flex-start" }}><span className="k">Description</span><span className="v" style={{ fontSize: 12, color: "var(--ink-2)", lineHeight: 1.5 }}>{desc}</span></div>}
                  <div className="to-spec"><span className="k">Owner</span><span className="v">{owner}</span></div>
                  <div className="to-spec"><span className="k">Location</span><span className="v">{location}</span></div>
                  {richosHost && <div className="to-spec"><span className="k">RichOS host</span><span className="v mono">{richosHost}</span></div>}
                  {winHost && <div className="to-spec"><span className="k">Windows host</span><span className="v mono">{winHost}</span></div>}
                  <div className="to-spec"><span className="k">Assets</span><span className="v">{composed.length} asset{composed.length !== 1 ? "s" : ""}</span></div>
                </div>
              </div>

              {composed.length > 0 && (
                <div className="to-form-section">
                  <div className="to-form-section-title">Asset composition</div>
                  {composed.map(c => {
                    const assetData = assets.find(a => a.tag === c.tag);
                    return (
                      <div key={c.tag} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
                        {c.isPrimary && <span style={{ color: "var(--warn)" }}>★</span>}
                        <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-3)" }}>{c.tag}</span>
                        <span style={{ fontWeight: 500, fontSize: 13 }}>{assetData?.name !== "—" ? assetData?.name : assetData?.model}</span>
                        {c.role && <span className="to-chip mute" style={{ fontSize: 11 }}>{c.role}</span>}
                        {c.where && <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{c.where}</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="to-modal-f" style={{ borderTop: "1px solid var(--line)", padding: "14px 20px" }}>
          {step > 0 ? (
            <button className="to-btn ghost sm" onClick={handleBack}>← Back</button>
          ) : (
            <button className="to-btn ghost sm" onClick={onClose}>Cancel</button>
          )}
          {step < 2 ? (
            <button className="to-btn primary sm" onClick={handleNext}>
              Next →
            </button>
          ) : (
            <button
              className="to-btn primary sm"
              onClick={handleCreate}
              disabled={creating}
              style={{ opacity: creating ? 0.6 : 1 }}
            >
              {creating ? "Creating…" : "Create test bench"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
