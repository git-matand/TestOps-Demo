import { useState, useMemo } from "react";
import {
  ResourceRequest, SharingStatus, SHARING_REQUESTS_INITIAL,
  TEST_CENTERS, ASSETS_INITIAL, BENCHES_INITIAL,
} from "../data";
import { useRole } from "../roleContext";

// ─── Constants ────────────────────────────────────────────────────────────────
const CTR = Object.fromEntries(TEST_CENTERS.map(c => [c.id, c]));
const CTR_COLOR: Record<string, { color: string; bg: string }> = {
  "TC-MUC": { color: "var(--brand)", bg: "rgba(94,106,210,.09)" },
  "TC-STR": { color: "var(--warn)",  bg: "rgba(184,134,11,.09)" },
  "TC-WAW": { color: "var(--ok)",    bg: "rgba(26,150,72,.09)"  },
};
const STATUS_LABEL: Record<SharingStatus, string> = {
  pending: "Pending", approved: "Approved", active: "Active",
  returned: "Returned", rejected: "Rejected", recalled: "Recalled",
};
const STATUS_COLOR: Record<SharingStatus, string> = {
  pending: "var(--warn)", approved: "var(--brand)", active: "var(--ok)",
  returned: "var(--ink-3)", rejected: "var(--bad)", recalled: "var(--bad)",
};

const MOCK_USER   = "A. Kovalenko";
const MOCK_CENTER = "TC-MUC";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function daysLeft(endDate: string): number {
  const now  = new Date("2026-06-26");
  const end  = new Date(endDate);
  return Math.round((end.getTime() - now.getTime()) / 86_400_000);
}
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });
}
function nextId(reqs: ResourceRequest[]): string {
  const nums = reqs.map(r => parseInt(r.id.replace("SR-", ""))).filter(n => !isNaN(n));
  return `SR-${String(Math.max(0, ...nums) + 1).padStart(3, "0")}`;
}

// ─── Request Card ─────────────────────────────────────────────────────────────
function RequestCard({
  req, viewerCenter, onApprove, onReject, onReturn, onRecall,
}: {
  req: ResourceRequest;
  viewerCenter: string;
  onApprove: (id: string) => void;
  onReject:  (id: string, reason: string) => void;
  onReturn:  (id: string) => void;
  onRecall:  (id: string) => void;
}) {
  const { can } = useRole();
  const mayApprove = can("sharing.approve"); // Manager + HW Engineer
  const [rejectMode, setRejectMode] = useState(false);
  const [reason, setReason] = useState("");
  const fromCtr = CTR[req.requesterCenter];
  const toCtr   = CTR[req.targetCenterId];
  const fromCC  = CTR_COLOR[req.requesterCenter] ?? { color:"var(--ink-3)", bg:"var(--panel-2)" };
  const toCC    = CTR_COLOR[req.targetCenterId]  ?? { color:"var(--ink-3)", bg:"var(--panel-2)" };
  const sc      = STATUS_COLOR[req.status];
  const dl      = daysLeft(req.endDate);
  const isIncoming = req.targetCenterId === viewerCenter;
  const isOutgoing = req.requesterCenter === viewerCenter;
  const overdue    = (req.status === "active") && dl < 0;

  return (
    <div style={{
      borderRadius: 10, border: `1px solid ${overdue ? "var(--bad)" : "var(--line-2)"}`,
      background: overdue ? "rgba(220,53,69,.04)" : "var(--panel-2)",
      padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10,
    }}>
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, fontWeight: 700, color: "var(--ink-3)" }}>{req.id}</span>
          <span style={{
            fontSize: 10.5, fontWeight: 600, padding: "2px 7px", borderRadius: 5,
            background: sc + "22", color: sc,
          }}>{STATUS_LABEL[req.status]}</span>
          {overdue && <span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--bad)" }}>● Overdue {Math.abs(dl)}d</span>}
          <span style={{
            fontSize: 10.5, padding: "2px 7px", borderRadius: 5,
            background: req.resourceType === "bench" ? "rgba(94,106,210,.09)" : "rgba(26,150,72,.09)",
            color: req.resourceType === "bench" ? "var(--brand)" : "var(--ok)", fontWeight: 600,
          }}>
            {req.resourceType === "bench" ? "Bench" : "Asset"}
          </span>
        </div>
        <span style={{ fontSize: 11, color: "var(--ink-4)", whiteSpace: "nowrap", flexShrink: 0 }}>{req.createdAt}</span>
      </div>

      {/* Route */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11.5, fontWeight: 600, padding: "3px 9px", borderRadius: 6, background: fromCC.bg, color: fromCC.color }}>
          {req.requesterId} · {fromCtr?.city}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)" strokeWidth="1.8"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        <span style={{ fontSize: 11.5, fontWeight: 600, padding: "3px 9px", borderRadius: 6, background: toCC.bg, color: toCC.color }}>
          {toCtr?.city}
        </span>
        <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
          {fmtDate(req.startDate)} — {fmtDate(req.endDate)}
          {req.status === "active" && <span style={{ color: dl >= 0 ? "var(--ok)" : "var(--bad)", fontWeight: 600 }}> ({dl >= 0 ? `${dl}d left` : `${Math.abs(dl)}d overdue`})</span>}
        </span>
      </div>

      {/* Resources */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {req.resourceIds.map((id, i) => (
          <span key={id} style={{
            fontSize: 11, padding: "2px 8px", borderRadius: 5, fontFamily: "var(--mono)",
            background: "var(--panel-3)", color: "var(--ink-2)", border: "1px solid var(--line-2)",
          }}>
            {id}{req.resourceLabels[i] ? ` · ${req.resourceLabels[i].split(" · ")[1] ?? ""}` : ""}
          </span>
        ))}
      </div>

      {/* Purpose */}
      <div style={{ fontSize: 12.5, color: "var(--ink-2)" }}>
        {req.campaignId && <span style={{ fontWeight: 600, color: "var(--brand)", marginRight: 6 }}>{req.campaignId}</span>}
        {req.purpose}
      </div>

      {/* Notes / reject reason */}
      {(req.notes || req.rejectReason) && (
        <div style={{
          fontSize: 11.5, color: req.rejectReason ? "var(--bad)" : "var(--ink-3)",
          padding: "6px 10px", borderRadius: 6,
          background: req.rejectReason ? "rgba(220,53,69,.07)" : "var(--panel-3)",
          borderLeft: `3px solid ${req.rejectReason ? "var(--bad)" : "var(--line)"}`,
        }}>
          {req.rejectReason ? `Rejected: ${req.rejectReason}` : req.notes}
        </div>
      )}

      {req.approvedBy && !req.rejectReason && (
        <div style={{ fontSize: 11, color: "var(--ok)" }}>
          ✓ Approved by {req.approvedBy}
        </div>
      )}

      {/* Actions */}
      {!rejectMode && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {isIncoming && req.status === "pending" && (mayApprove ? (
            <>
              <button className="to-btn primary sm" onClick={() => onApprove(req.id)}>Approve</button>
              <button className="to-btn ghost sm" style={{ color: "var(--bad)", borderColor: "var(--bad)" }}
                onClick={() => setRejectMode(true)}>Reject…</button>
            </>
          ) : (
            <span style={{ fontSize: 11.5, color: "var(--ink-4)", display: "flex", alignItems: "center", gap: 5 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Approval requires Manager or HW Engineer role
            </span>
          ))}
          {isIncoming && req.status === "active" && (
            <button className="to-btn ghost sm" style={{ color: "var(--warn)", borderColor: "var(--warn)" }}
              onClick={() => onRecall(req.id)}>Recall resource</button>
          )}
          {isOutgoing && (req.status === "approved" || req.status === "active") && (
            <button className="to-btn ghost sm" onClick={() => onReturn(req.id)}>Mark as returned</button>
          )}
        </div>
      )}

      {/* Reject form */}
      {rejectMode && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <textarea
            placeholder="Reason for rejection (required)…"
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={2}
            style={{
              width: "100%", boxSizing: "border-box", resize: "vertical",
              borderRadius: 6, border: "1px solid var(--bad)", background: "var(--panel-2)",
              color: "var(--ink)", fontSize: 12.5, padding: "8px 10px",
            }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="to-btn ghost sm" onClick={() => { setRejectMode(false); setReason(""); }}>Cancel</button>
            <button className="to-btn primary sm" style={{ background: "var(--bad)", borderColor: "var(--bad)" }}
              disabled={!reason.trim()}
              onClick={() => { onReject(req.id, reason.trim()); setRejectMode(false); setReason(""); }}>
              Confirm rejection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Request Sheet ─────────────────────────────────────────────────────────────
function RequestSheet({
  onClose, onSubmit, requesterCenter,
}: {
  onClose: () => void;
  onSubmit: (req: Omit<ResourceRequest, "id" | "createdAt">) => void;
  requesterCenter: string;
}) {
  const [step,        setStep]        = useState<1|2|3>(1);
  const [targetId,    setTargetId]    = useState("");
  const [resType,     setResType]     = useState<"asset"|"bench">("asset");
  const [selIds,      setSelIds]      = useState<Set<string>>(new Set());
  const [searchQ,     setSearchQ]     = useState("");
  const [startDate,   setStartDate]   = useState("2026-07-01");
  const [endDate,     setEndDate]     = useState("2026-07-14");
  const [purpose,     setPurpose]     = useState("");
  const [notes,       setNotes]       = useState("");
  const [campaignId,  setCampaignId]  = useState("");

  const targetCtr = CTR[targetId];

  // Available assets/benches at target center
  const availableAssets = useMemo(() => {
    if (!targetId) return [];
    const ctr = TEST_CENTERS.find(c => c.id === targetId);
    if (!ctr) return [];
    return ASSETS_INITIAL.filter(a => ctr.assetTags.includes(a.tag) && a.status !== "archived");
  }, [targetId]);

  const availableBenches = useMemo(() => {
    if (!targetId) return [];
    const ctr = TEST_CENTERS.find(c => c.id === targetId);
    if (!ctr) return [];
    return BENCHES_INITIAL.filter(b => ctr.benchIds.includes(b.id));
  }, [targetId]);

  const filtered = resType === "asset"
    ? availableAssets.filter(a => !searchQ || (a.tag + a.name + (a.model ?? "")).toLowerCase().includes(searchQ.toLowerCase()))
    : availableBenches.filter(b => !searchQ || (b.id + b.name).toLowerCase().includes(searchQ.toLowerCase()));

  function toggleSel(id: string) {
    setSelIds(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function buildLabels(): string[] {
    return [...selIds].map(id => {
      if (resType === "asset") {
        const a = ASSETS_INITIAL.find(x => x.tag === id);
        return `${id} · ${a?.model ?? a?.name ?? id}`;
      }
      const b = BENCHES_INITIAL.find(x => x.id === id);
      return `${id} · ${b?.name ?? id}`;
    });
  }

  const canStep2 = targetId.length > 0 && selIds.size > 0;
  const canSubmit = canStep2 && purpose.trim().length > 0 && startDate < endDate;

  function handleSubmit() {
    onSubmit({
      requesterId: MOCK_USER,
      requesterCenter: requesterCenter,
      targetCenterId: targetId,
      resourceType: resType,
      resourceIds: [...selIds],
      resourceLabels: buildLabels(),
      campaignId: campaignId || undefined,
      purpose: purpose.trim(),
      startDate, endDate,
      status: "pending",
      notes: notes.trim() || undefined,
    });
  }

  const STEP_LABELS = ["Select resources", "Dates & purpose", "Review"];

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.48)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1100, padding:20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:"var(--panel)", borderRadius:14, width:600, maxWidth:"95vw", maxHeight:"90vh", display:"flex", flexDirection:"column", boxShadow:"0 24px 64px rgba(0,0,0,.3)", border:"1px solid var(--line-2)" }}>

        {/* Header */}
        <div style={{ padding:"18px 22px 12px", borderBottom:"1px solid var(--line)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
            <div>
              <div style={{ fontSize:16, fontWeight:660, color:"var(--ink)" }}>Request Cross-Center Resources</div>
              <div style={{ fontSize:12, color:"var(--ink-3)", marginTop:2 }}>Borrow assets or benches from another test center</div>
            </div>
            <button onClick={onClose} style={{ width:28, height:28, borderRadius:6, border:"1px solid var(--line-2)", background:"var(--panel-2)", display:"grid", placeItems:"center", color:"var(--ink-3)", cursor:"pointer" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
          {/* Steps */}
          <div style={{ display:"flex", gap:0 }}>
            {STEP_LABELS.map((lbl, i) => {
              const n = i + 1 as 1|2|3;
              const done = step > n;
              const active = step === n;
              return (
                <div key={lbl} style={{ display:"flex", alignItems:"center", flex: i < 2 ? 1 : undefined }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, cursor: done ? "pointer" : "default" }}
                    onClick={() => done && setStep(n)}>
                    <div style={{
                      width:22, height:22, borderRadius:"50%", display:"grid", placeItems:"center",
                      fontSize:10.5, fontWeight:700, flexShrink:0,
                      background: done ? "var(--ok)" : active ? "var(--brand)" : "var(--panel-3)",
                      color: (done || active) ? "#fff" : "var(--ink-4)",
                    }}>{done ? "✓" : n}</div>
                    <span style={{ fontSize:12, color: active ? "var(--ink)" : "var(--ink-4)", fontWeight: active ? 600 : 400 }}>{lbl}</span>
                  </div>
                  {i < 2 && <div style={{ flex:1, height:1, background:"var(--line-2)", margin:"0 8px" }} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:"auto", padding:"16px 22px" }}>

          {/* Step 1 — Select resources */}
          {step === 1 && (
            <>
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:11, fontWeight:600, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:8 }}>
                  Source center (where the resources are)
                </label>
                <div style={{ display:"flex", gap:8 }}>
                  {TEST_CENTERS.filter(c => c.id !== requesterCenter).map(c => {
                    const cc = CTR_COLOR[c.id] ?? { color:"var(--ink-3)", bg:"var(--panel-2)" };
                    const active = targetId === c.id;
                    return (
                      <button key={c.id} onClick={() => { setTargetId(c.id); setSelIds(new Set()); }}
                        style={{
                          flex:1, padding:"10px 12px", borderRadius:9, cursor:"pointer",
                          border:`1.5px solid ${active ? cc.color : "var(--line-2)"}`,
                          background: active ? cc.bg : "var(--panel-2)",
                          color: active ? cc.color : "var(--ink-2)", fontWeight: active ? 600 : 400, fontSize:13,
                          textAlign:"center" as const, transition:"all .1s",
                        }}>
                        <div style={{ fontSize:14, fontWeight:660, marginBottom:2 }}>{c.city}</div>
                        <div style={{ fontSize:10.5, opacity:.75 }}>{c.name}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {targetId && (
                <>
                  <div style={{ display:"flex", gap:6, marginBottom:12 }}>
                    {(["asset","bench"] as const).map(t => (
                      <button key={t} onClick={() => { setResType(t); setSelIds(new Set()); }}
                        style={{
                          padding:"5px 14px", borderRadius:7, fontSize:12.5, cursor:"pointer",
                          border:`1.5px solid ${resType === t ? "var(--brand)" : "var(--line-2)"}`,
                          background: resType === t ? "var(--brand-dim)" : "var(--panel-2)",
                          color: resType === t ? "var(--brand)" : "var(--ink-3)", fontWeight: resType === t ? 600 : 400,
                          textTransform:"capitalize" as const,
                        }}>
                        {t === "asset" ? `Assets (${availableAssets.length})` : `Benches (${availableBenches.length})`}
                      </button>
                    ))}
                    <div style={{ flex:1 }} />
                    <div style={{ position:"relative" }}>
                      <svg style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:"var(--ink-3)" }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
                      <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                        placeholder="Search…"
                        style={{ height:30, paddingLeft:26, paddingRight:8, borderRadius:6, border:"1px solid var(--line-2)", background:"var(--panel-2)", color:"var(--ink)", fontSize:12 }} />
                    </div>
                  </div>

                  <div style={{ display:"flex", flexDirection:"column", gap:5, maxHeight:260, overflowY:"auto" }}>
                    {filtered.length === 0 && (
                      <div style={{ textAlign:"center", color:"var(--ink-4)", fontSize:13, padding:"20px 0" }}>No resources match.</div>
                    )}
                    {resType === "asset" && (filtered as typeof availableAssets).map(a => {
                      const checked = selIds.has(a.tag);
                      return (
                        <label key={a.tag} style={{
                          display:"flex", alignItems:"center", gap:10, padding:"8px 11px", borderRadius:8, cursor:"pointer",
                          border:`1px solid ${checked ? "var(--brand)" : "var(--line-2)"}`,
                          background: checked ? "var(--brand-dim)" : "var(--panel-2)", transition:"all .1s",
                        }}>
                          <input type="checkbox" checked={checked} onChange={() => toggleSel(a.tag)}
                            style={{ accentColor:"var(--brand)", width:14, height:14, flexShrink:0 }} />
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:12.5, fontWeight:550 }}>{a.tag} — {a.model ?? a.name}</div>
                            <div style={{ fontSize:11, color:"var(--ink-4)" }}>{a.cat} · {a.location}</div>
                          </div>
                          <span style={{ fontSize:10.5, padding:"2px 7px", borderRadius:4, background:"var(--panel-3)", color:"var(--ink-3)" }}>{a.status}</span>
                        </label>
                      );
                    })}
                    {resType === "bench" && (filtered as typeof availableBenches).map(b => {
                      const checked = selIds.has(b.id);
                      const sc = b.status === "Down" ? "var(--bad)" : b.status === "Maintenance" ? "var(--warn)" : "var(--ok)";
                      return (
                        <label key={b.id} style={{
                          display:"flex", alignItems:"center", gap:10, padding:"8px 11px", borderRadius:8, cursor:"pointer",
                          border:`1px solid ${checked ? "var(--brand)" : "var(--line-2)"}`,
                          background: checked ? "var(--brand-dim)" : "var(--panel-2)", transition:"all .1s",
                        }}>
                          <input type="checkbox" checked={checked} onChange={() => toggleSel(b.id)}
                            style={{ accentColor:"var(--brand)", width:14, height:14, flexShrink:0 }} />
                          <span style={{ width:7, height:7, borderRadius:"50%", background:sc, flexShrink:0 }} />
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:12.5, fontWeight:550 }}>{b.id} — {b.name}</div>
                            <div style={{ fontSize:11, color:"var(--ink-4)" }}>{b.location} · {b.hosts.length} host{b.hosts.length !== 1 ? "s" : ""}</div>
                          </div>
                          <span style={{ fontSize:10.5, color:sc, fontWeight:600 }}>{b.status}</span>
                        </label>
                      );
                    })}
                  </div>

                  {selIds.size > 0 && (
                    <div style={{ marginTop:10, fontSize:12, color:"var(--brand)", fontWeight:600 }}>
                      {selIds.size} {resType}{selIds.size > 1 ? "s" : ""} selected
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Step 2 — Dates & purpose */}
          {step === 2 && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div>
                  <label style={{ fontSize:11, fontWeight:600, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:6 }}>Start date</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                    style={{ width:"100%", height:36, borderRadius:7, border:"1px solid var(--line-2)", background:"var(--panel-2)", color:"var(--ink)", fontSize:13, padding:"0 10px", boxSizing:"border-box" as const }} />
                </div>
                <div>
                  <label style={{ fontSize:11, fontWeight:600, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:6 }}>End date</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                    style={{ width:"100%", height:36, borderRadius:7, border:`1px solid ${endDate <= startDate ? "var(--bad)" : "var(--line-2)"}`, background:"var(--panel-2)", color:"var(--ink)", fontSize:13, padding:"0 10px", boxSizing:"border-box" as const }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize:11, fontWeight:600, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:6 }}>
                  Campaign (optional)
                </label>
                <select value={campaignId} onChange={e => setCampaignId(e.target.value)}
                  style={{ width:"100%", height:36, borderRadius:7, border:"1px solid var(--line-2)", background:"var(--panel-2)", color:"var(--ink)", fontSize:13, padding:"0 10px" }}>
                  <option value="">— No campaign —</option>
                  {[...Object.values({ a: { id:"CMP-201", title:"CAN-Stack Regression v2.4" }, b: { id:"CMP-205", title:"OTA Firmware Update Suite" }, c: { id:"CMP-210", title:"HW-in-loop Validation Q2" }, d: { id:"CMP-221", title:"ADAS Sensor Fusion v1" } })].map(c => (
                    <option key={c.id} value={c.id}>{c.id} · {c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize:11, fontWeight:600, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:6 }}>
                  Purpose <span style={{ color:"var(--bad)" }}>*</span>
                </label>
                <textarea value={purpose} onChange={e => setPurpose(e.target.value)} rows={3}
                  placeholder="Describe why you need these resources and what they'll be used for…"
                  style={{ width:"100%", boxSizing:"border-box" as const, resize:"vertical", borderRadius:7, border:"1px solid var(--line-2)", background:"var(--panel-2)", color:"var(--ink)", fontSize:13, padding:"9px 11px" }} />
              </div>

              <div>
                <label style={{ fontSize:11, fontWeight:600, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:6 }}>
                  Notes for approver (optional)
                </label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                  placeholder="Shipping details, handoff contacts, special instructions…"
                  style={{ width:"100%", boxSizing:"border-box" as const, resize:"vertical", borderRadius:7, border:"1px solid var(--line-2)", background:"var(--panel-2)", color:"var(--ink)", fontSize:13, padding:"9px 11px" }} />
              </div>
            </div>
          )}

          {/* Step 3 — Review */}
          {step === 3 && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ padding:"14px 16px", borderRadius:10, background:"var(--panel-2)", border:"1px solid var(--line-2)" }}>
                <div style={{ fontSize:11, fontWeight:600, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:".06em", marginBottom:10 }}>Summary</div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {[
                    { label:"From", value:`${MOCK_USER} · ${CTR[requesterCenter]?.city}` },
                    { label:"To (source center)", value:`${CTR[targetId]?.city} — ${CTR[targetId]?.name}` },
                    { label:"Resources", value:`${selIds.size} ${resType}${selIds.size > 1 ? "s" : ""}` },
                    { label:"Period", value:`${fmtDate(startDate)} — ${fmtDate(endDate)} (${Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000)}d)` },
                    { label:"Purpose", value:purpose },
                    campaignId ? { label:"Campaign", value:campaignId } : null,
                  ].filter(Boolean).map(row => (
                    <div key={row!.label} style={{ display:"flex", gap:12 }}>
                      <span style={{ fontSize:12, color:"var(--ink-4)", minWidth:120, flexShrink:0 }}>{row!.label}</span>
                      <span style={{ fontSize:12.5, color:"var(--ink)" }}>{row!.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                <div style={{ fontSize:11, fontWeight:600, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:".06em", marginBottom:4 }}>Requested resources</div>
                {[...selIds].map((id, i) => (
                  <div key={id} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 10px", borderRadius:7, background:"var(--panel-2)", border:"1px solid var(--line-2)" }}>
                    <span style={{ fontFamily:"var(--mono)", fontSize:11.5, color:"var(--brand)", fontWeight:600 }}>{id}</span>
                    <span style={{ fontSize:12, color:"var(--ink-3)" }}>{buildLabels()[i]?.split(" · ")[1] ?? ""}</span>
                  </div>
                ))}
              </div>

              <div style={{ padding:"10px 14px", borderRadius:8, background:"rgba(94,106,210,.07)", border:"1px solid var(--brand)", fontSize:12.5, color:"var(--ink-2)" }}>
                <strong style={{ color:"var(--brand)" }}>What happens next: </strong>
                The manager of {CTR[targetId]?.city} will be notified and has 24h to approve or reject. You'll see the status update in the Requests tab.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop:"1px solid var(--line)", padding:"12px 22px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <button className="to-btn ghost sm" onClick={step > 1 ? () => setStep(s => (s - 1) as 1|2|3) : onClose}>
            {step > 1 ? "← Back" : "Cancel"}
          </button>
          <div style={{ display:"flex", gap:8 }}>
            {step < 3 && (
              <button className="to-btn primary sm" disabled={step === 1 ? !canStep2 : !purpose.trim() || endDate <= startDate}
                style={{ opacity: (step === 1 ? !canStep2 : !purpose.trim() || endDate <= startDate) ? .45 : 1 }}
                onClick={() => setStep(s => (s + 1) as 1|2|3)}>
                Next →
              </button>
            )}
            {step === 3 && (
              <button className="to-btn primary sm" disabled={!canSubmit}
                style={{ opacity: canSubmit ? 1 : .45 }}
                onClick={handleSubmit}>
                Submit request
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function ResourceSharing({ addToast }: { addToast: (t: string, s?: string, type?: string) => void }) {
  const [tab,           setTab]           = useState<"requests"|"loans"|"history">("requests");
  const [requests,      setRequests]      = useState<ResourceRequest[]>(SHARING_REQUESTS_INITIAL);
  const [sheetOpen,     setSheetOpen]     = useState(false);
  const [filterStatus,  setFilterStatus]  = useState<SharingStatus | "all">("all");
  const [filterCenter,  setFilterCenter]  = useState("all");
  const [search,        setSearch]        = useState("");
  const [viewerCenter,  setViewerCenter]  = useState(MOCK_CENTER);

  const pending  = requests.filter(r => r.status === "pending");
  const active   = requests.filter(r => r.status === "active");
  const incoming = requests.filter(r => r.targetCenterId === viewerCenter);
  const outgoing = requests.filter(r => r.requesterCenter === viewerCenter);
  const inPending = incoming.filter(r => r.status === "pending");

  function handleApprove(id: string) {
    setRequests(prev => prev.map(r => r.id === id
      ? { ...r, status: "active" as SharingStatus, approvedBy: MOCK_USER }
      : r));
    addToast("Request approved", "Resources marked as active loan", "ok");
  }

  function handleReject(id: string, reason: string) {
    setRequests(prev => prev.map(r => r.id === id
      ? { ...r, status: "rejected" as SharingStatus, rejectReason: reason }
      : r));
    addToast("Request rejected", "Requester has been notified", "warn");
  }

  function handleReturn(id: string) {
    setRequests(prev => prev.map(r => r.id === id
      ? { ...r, status: "returned" as SharingStatus }
      : r));
    addToast("Resources returned", "Loan closed and resources released", "ok");
  }

  function handleRecall(id: string) {
    setRequests(prev => prev.map(r => r.id === id
      ? { ...r, status: "recalled" as SharingStatus }
      : r));
    addToast("Resource recalled", "Borrower notified to return immediately", "warn");
  }

  function handleSubmit(partial: Omit<ResourceRequest, "id" | "createdAt">) {
    const now = new Date("2026-06-26");
    const ts  = `${now.toLocaleDateString("en", { month:"short", day:"numeric", year:"numeric" })} ${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}`;
    const req: ResourceRequest = { ...partial, id: nextId(requests), createdAt: ts };
    setRequests(prev => [req, ...prev]);
    setSheetOpen(false);
    addToast("Request submitted", `${req.id} sent to ${CTR[req.targetCenterId]?.city} for approval`, "ok");
  }

  // History filtering
  const historyItems = requests.filter(r =>
    ["returned", "rejected", "recalled"].includes(r.status) &&
    (filterStatus === "all" || r.status === filterStatus) &&
    (filterCenter === "all" || r.requesterCenter === filterCenter || r.targetCenterId === filterCenter) &&
    (!search || [r.id, r.requesterId, r.purpose, ...r.resourceIds].join(" ").toLowerCase().includes(search.toLowerCase()))
  );

  const CARD_PROPS = { viewerCenter, onApprove: handleApprove, onReject: handleReject, onReturn: handleReturn, onRecall: handleRecall };

  return (
    <div className="to-screen">
      <div className="to-page-head">
        <div>
          <div className="to-kicker">Cross-Center Operations</div>
          <h1>Resource Sharing</h1>
          <div style={{ color:"var(--ink-2)", fontSize:13, marginTop:5 }}>
            Borrow assets and benches across test centers · full approval trail
          </div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {inPending.length > 0 && (
            <span style={{ fontSize:12, fontWeight:600, padding:"4px 10px", borderRadius:8, background:"rgba(184,134,11,.12)", color:"var(--warn)", border:"1px solid var(--warn)" }}>
              {inPending.length} awaiting your approval
            </span>
          )}
          {/* Perspective switch (IMPROVEMENT_PLAN #6) */}
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"3px 4px 3px 10px", borderRadius:8, border:"1px solid var(--line-2)", background:"var(--panel-2)" }}>
            <span style={{ fontSize:11.5, color:"var(--ink-4)" }}>Viewing as</span>
            <select value={viewerCenter} onChange={e => setViewerCenter(e.target.value)}
              style={{ height:28, borderRadius:6, border:"1px solid var(--line-2)", background:"var(--panel)", color:"var(--ink)", fontSize:12.5, fontWeight:600, padding:"0 6px", cursor:"pointer" }}>
              {TEST_CENTERS.map(c => <option key={c.id} value={c.id}>{c.city}</option>)}
            </select>
          </div>
          <button className="to-btn primary sm" onClick={() => setSheetOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            New request
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:20 }}>
        {[
          { label:"Pending approval",  val: pending.length,  color:"var(--warn)"  },
          { label:"Active loans",      val: active.length,   color:"var(--ok)"    },
          { label:"My outgoing",       val: outgoing.filter(r => ["pending","approved","active"].includes(r.status)).length, color:"var(--brand)" },
          { label:"Overdue returns",   val: active.filter(r => daysLeft(r.endDate) < 0).length, color:"var(--bad)" },
        ].map(k => (
          <div key={k.label} className="to-kpi" style={{ padding:"12px 16px" }}>
            <div className="lab">{k.label}</div>
            <div className="val" style={{ color:k.color, fontSize:22 }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="to-tabs" style={{ marginBottom:20 }}>
        <button className={`to-tab ${tab==="requests"?"on":""}`} onClick={() => setTab("requests")}>
          Requests {inPending.length > 0 && <span style={{ marginLeft:5, fontSize:10, background:"var(--warn)", color:"#fff", borderRadius:8, padding:"1px 5px" }}>{inPending.length}</span>}
        </button>
        <button className={`to-tab ${tab==="loans"?"on":""}`} onClick={() => setTab("loans")}>
          Active Loans {active.length > 0 && <span style={{ marginLeft:5, fontSize:10, background:"var(--ok)", color:"#fff", borderRadius:8, padding:"1px 5px" }}>{active.length}</span>}
        </button>
        <button className={`to-tab ${tab==="history"?"on":""}`} onClick={() => setTab("history")}>History</button>
      </div>

      {/* ── Requests tab ── */}
      {tab === "requests" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>

          {/* Incoming */}
          <div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
              <h3 style={{ fontSize:14, fontWeight:660, color:"var(--ink)", margin:0 }}>
                Incoming — to {CTR[viewerCenter]?.city}
              </h3>
              <span style={{ fontSize:11, color:"var(--ink-4)" }}>{incoming.length} total</span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {incoming.length === 0 && (
                <div style={{ textAlign:"center", padding:"30px 16px", color:"var(--ink-4)", fontSize:13, background:"var(--panel-2)", borderRadius:10, border:"1px solid var(--line-2)" }}>
                  No incoming requests
                </div>
              )}
              {incoming.map(r => <RequestCard key={r.id} req={r} {...CARD_PROPS} />)}
            </div>
          </div>

          {/* Outgoing */}
          <div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
              <h3 style={{ fontSize:14, fontWeight:660, color:"var(--ink)", margin:0 }}>
                Outgoing — from {CTR[viewerCenter]?.city}
              </h3>
              <span style={{ fontSize:11, color:"var(--ink-4)" }}>{outgoing.length} total</span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {outgoing.length === 0 && (
                <div style={{ textAlign:"center", padding:"30px 16px", color:"var(--ink-4)", fontSize:13, background:"var(--panel-2)", borderRadius:10, border:"1px solid var(--line-2)" }}>
                  No outgoing requests. <button className="to-btn ghost sm" style={{ marginLeft:8 }} onClick={() => setSheetOpen(true)}>New request</button>
                </div>
              )}
              {outgoing.map(r => <RequestCard key={r.id} req={r} {...CARD_PROPS} />)}
            </div>
          </div>
        </div>
      )}

      {/* ── Active Loans tab ── */}
      {tab === "loans" && (
        <div className="to-panel">
          <div className="to-panel-h">
            <span className="to-eyebrow">All active loans across centers</span>
            <span className="to-chip mute">{active.length} active</span>
          </div>
          <div className="to-panel-b">
            {active.length === 0 ? (
              <div style={{ textAlign:"center", padding:"32px 0", color:"var(--ink-4)", fontSize:13 }}>
                No active loans at this time.
              </div>
            ) : (
              <table className="to-tbl">
                <thead>
                  <tr>
                    <th>Request</th>
                    <th>Resources</th>
                    <th>Route</th>
                    <th>Campaign</th>
                    <th>Period</th>
                    <th>Days left</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {active.map(r => {
                    const dl = daysLeft(r.endDate);
                    const overdue = dl < 0;
                    const fromCC = CTR_COLOR[r.requesterCenter] ?? { color:"var(--ink-3)", bg:"var(--panel-2)" };
                    const toCC   = CTR_COLOR[r.targetCenterId]  ?? { color:"var(--ink-3)", bg:"var(--panel-2)" };
                    return (
                      <tr key={r.id} style={{ background: overdue ? "rgba(220,53,69,.04)" : undefined }}>
                        <td style={{ fontFamily:"var(--mono)", fontSize:11.5, fontWeight:700, color:"var(--ink-3)" }}>{r.id}</td>
                        <td>
                          <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                            {r.resourceIds.map((id, i) => (
                              <span key={id} style={{ fontSize:11, fontFamily:"var(--mono)", padding:"1px 6px", borderRadius:4, background:"var(--panel-3)", color:"var(--ink-2)", width:"fit-content" }}>
                                {id}
                              </span>
                            ))}
                          </div>
                          <div style={{ fontSize:10.5, color:"var(--ink-4)", marginTop:2 }}>
                            {r.resourceType === "bench" ? "Bench" : "Asset"}
                          </div>
                        </td>
                        <td>
                          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                            <span style={{ fontSize:11, fontWeight:600, padding:"2px 7px", borderRadius:5, background:fromCC.bg, color:fromCC.color }}>
                              {CTR[r.requesterCenter]?.city}
                            </span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                            <span style={{ fontSize:11, fontWeight:600, padding:"2px 7px", borderRadius:5, background:toCC.bg, color:toCC.color }}>
                              {CTR[r.targetCenterId]?.city}
                            </span>
                          </div>
                          <div style={{ fontSize:10.5, color:"var(--ink-4)", marginTop:2 }}>{r.requesterId}</div>
                        </td>
                        <td style={{ fontSize:12, color: r.campaignId ? "var(--brand)" : "var(--ink-4)" }}>
                          {r.campaignId ?? "—"}
                        </td>
                        <td style={{ fontSize:11.5, color:"var(--ink-3)", fontFamily:"var(--mono)" }}>
                          {fmtDate(r.startDate)}<br/>{fmtDate(r.endDate)}
                        </td>
                        <td>
                          <span style={{ fontSize:12.5, fontWeight:600, color: overdue ? "var(--bad)" : dl <= 3 ? "var(--warn)" : "var(--ok)" }}>
                            {overdue ? `${Math.abs(dl)}d overdue` : `${dl}d`}
                          </span>
                        </td>
                        <td>
                          <div style={{ display:"flex", gap:5 }}>
                            {r.requesterCenter === viewerCenter && (
                              <button className="to-btn ghost sm" style={{ fontSize:11 }} onClick={() => handleReturn(r.id)}>Return</button>
                            )}
                            {r.targetCenterId === viewerCenter && (
                              <button className="to-btn ghost sm" style={{ fontSize:11, color:"var(--warn)", borderColor:"var(--warn)" }} onClick={() => handleRecall(r.id)}>Recall</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── History tab ── */}
      {tab === "history" && (
        <div className="to-panel">
          <div className="to-panel-h">
            <span className="to-eyebrow">Completed & closed requests</span>
            <div style={{ display:"flex", gap:8 }}>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as SharingStatus | "all")}
                style={{ height:30, borderRadius:6, border:"1px solid var(--line-2)", background:"var(--panel-2)", color:"var(--ink)", fontSize:12, padding:"0 8px" }}>
                <option value="all">All statuses</option>
                {(["returned","rejected","recalled"] as SharingStatus[]).map(s => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </select>
              <select value={filterCenter} onChange={e => setFilterCenter(e.target.value)}
                style={{ height:30, borderRadius:6, border:"1px solid var(--line-2)", background:"var(--panel-2)", color:"var(--ink)", fontSize:12, padding:"0 8px" }}>
                <option value="all">All centers</option>
                {TEST_CENTERS.map(c => <option key={c.id} value={c.id}>{c.city}</option>)}
              </select>
              <div style={{ position:"relative" }}>
                <svg style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:"var(--ink-3)" }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
                  style={{ height:30, paddingLeft:26, paddingRight:8, borderRadius:6, border:"1px solid var(--line-2)", background:"var(--panel-2)", color:"var(--ink)", fontSize:12 }} />
              </div>
            </div>
          </div>
          <div className="to-panel-b">
            {historyItems.length === 0 ? (
              <div style={{ textAlign:"center", padding:"30px 0", color:"var(--ink-4)", fontSize:13 }}>No entries match the filters.</div>
            ) : (
              <table className="to-tbl">
                <thead>
                  <tr><th>ID</th><th>Resources</th><th>Route</th><th>Period</th><th>Purpose</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {historyItems.map(r => {
                    const sc = STATUS_COLOR[r.status];
                    const fromCC = CTR_COLOR[r.requesterCenter] ?? { color:"var(--ink-3)", bg:"var(--panel-2)" };
                    const toCC   = CTR_COLOR[r.targetCenterId]  ?? { color:"var(--ink-3)", bg:"var(--panel-2)" };
                    return (
                      <tr key={r.id}>
                        <td style={{ fontFamily:"var(--mono)", fontSize:11.5, fontWeight:700, color:"var(--ink-3)" }}>{r.id}</td>
                        <td>
                          {r.resourceIds.map(id => (
                            <span key={id} style={{ fontSize:11, fontFamily:"var(--mono)", padding:"1px 6px", borderRadius:4, background:"var(--panel-3)", color:"var(--ink-2)", marginRight:4 }}>{id}</span>
                          ))}
                        </td>
                        <td>
                          <div style={{ display:"flex", alignItems:"center", gap:5, flexWrap:"wrap" as const }}>
                            <span style={{ fontSize:11, fontWeight:600, padding:"2px 7px", borderRadius:5, background:fromCC.bg, color:fromCC.color }}>{CTR[r.requesterCenter]?.city}</span>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                            <span style={{ fontSize:11, fontWeight:600, padding:"2px 7px", borderRadius:5, background:toCC.bg, color:toCC.color }}>{CTR[r.targetCenterId]?.city}</span>
                          </div>
                          <div style={{ fontSize:10.5, color:"var(--ink-4)", marginTop:2 }}>{r.requesterId}</div>
                        </td>
                        <td style={{ fontSize:11.5, color:"var(--ink-3)", fontFamily:"var(--mono)", whiteSpace:"nowrap" as const }}>
                          {fmtDate(r.startDate)}<br/>{fmtDate(r.endDate)}
                        </td>
                        <td style={{ fontSize:12, color:"var(--ink-2)", maxWidth:200 }}>
                          {r.campaignId && <span style={{ color:"var(--brand)", fontWeight:600, marginRight:5 }}>{r.campaignId}</span>}
                          {r.purpose.slice(0, 60)}{r.purpose.length > 60 ? "…" : ""}
                          {r.rejectReason && <div style={{ fontSize:11, color:"var(--bad)", marginTop:2 }}>↳ {r.rejectReason}</div>}
                        </td>
                        <td>
                          <span style={{ fontSize:11, fontWeight:600, padding:"2px 7px", borderRadius:5, background:sc+"22", color:sc }}>
                            {STATUS_LABEL[r.status]}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {sheetOpen && (
        <RequestSheet onClose={() => setSheetOpen(false)} onSubmit={handleSubmit} requesterCenter={viewerCenter} />
      )}
    </div>
  );
}
