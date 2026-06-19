import { useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSynced: () => void;
}

const PREVIEW = [
  { tag: "00531", name: "7852", model: "CIVIC", action: "new" as const, detail: "status: ready · Lab 2 · Rack D" },
  { tag: "00532", name: "9421", model: "Umlaut", action: "new" as const, detail: "status: ready · Lab 1 · HiL Bay" },
  { tag: "00533", name: "FK: 008", model: "Flashing Kit", action: "new" as const, detail: "status: ready · Lab 2 · Rack A" },
  { tag: "00197", name: "7413", model: "CIVIC", action: "update" as const, detail: "location: Lab 2 Rack A → Lab 1 HiL Bay" },
  { tag: "00517", name: "FK: 006", model: "Flashing Kit", action: "update" as const, detail: "current value: €2,600 → €2,400" },
  { tag: "00095", name: "7208", model: "CIVIC", action: "conflict" as const, detail: "status mismatch: TestOps=investigating / Snipe-IT=deployed" },
  { tag: "00466", name: "8984", model: "Video Converter TZ", action: "conflict" as const, detail: "asset missing in Snipe-IT — may have been decommissioned" },
];

const LOG = [
  "Connecting to Snipe-IT API…",
  "Authenticated · fetching asset manifest…",
  "Manifest received · 514 assets in Snipe-IT",
  "Comparing with TestOps registry (509 assets)…",
  "Importing new asset #00531 · 7852 (CIVIC)…",
  "Importing new asset #00532 · 9421 (Umlaut)…",
  "Importing new asset #00533 · FK: 008…",
  "Updating asset #00197 · location change…",
  "Updating asset #00517 · value change…",
  "Flagging conflict #00095 · status mismatch…",
  "Flagging conflict #00466 · missing in source…",
  "Writing 5 changes to local registry…",
  "Sync complete ✓",
];

export function SyncModal({ open, onClose, onSynced }: Props) {
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [logLines, setLogLines] = useState<string[]>([]);

  if (!open) return null;

  const runSync = () => {
    setPhase("running");
    setProgress(0);
    setLogLines([]);
    let idx = 0;
    const tick = setInterval(() => {
      idx++;
      const pct = (idx / LOG.length) * 100;
      setProgress(pct);
      setLogLines(l => [...l, LOG[idx - 1] || ""]);
      if (idx >= LOG.length) {
        clearInterval(tick);
        setTimeout(() => { setPhase("done"); onSynced(); }, 300);
      }
    }, 320);
  };

  const reset = () => { setPhase("idle"); setProgress(0); setLogLines([]); };

  const chipColor = (a: string) => a === "new" ? "ok" : a === "update" ? "mid" : "warn";

  return (
    <div className="to-modal-scrim open" onClick={e => { if (e.target === e.currentTarget && phase !== "running") { reset(); onClose(); } }}>
      <div className="to-modal" style={{ width: "min(580px,100%)" }}>
        <div className="to-modal-h">
          <div>
            <h3>Asset Manager Sync</h3>
            <div className="sub">Sync with Snipe-IT · testops.spyrosoft.local</div>
          </div>
          <button className="to-modal-x" onClick={() => { reset(); onClose(); }} disabled={phase === "running"}>✕</button>
        </div>

        <div className="to-modal-b">
          {/* Connection status */}
          <div style={{ display: "flex", gap: 12, padding: "10px 14px", background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: 8, alignItems: "center" }}>
            <span className="to-dot live" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Snipe-IT connected</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-3)", marginTop: 1 }}>Last sync: Jun 18, 2026 07:55 · 2h ago · 514 assets in source</div>
            </div>
            <span className="to-chip ok">Online</span>
          </div>

          {phase === "idle" && (
            <>
              {/* Summary counts */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[["3", "New assets", "ok"], ["2", "Updates", "mid"], ["2", "Conflicts", "warn"]].map(([n, l, c]) => (
                  <div key={l} style={{ background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: `var(--${c})`, fontVariantNumeric: "tabular-nums" }}>{n}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>{l}</div>
                  </div>
                ))}
              </div>

              {/* Preview table */}
              <div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".05em", fontWeight: 550, marginBottom: 8 }}>Changes preview</div>
                <div style={{ border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden" }}>
                  {PREVIEW.map((r, i) => (
                    <div key={r.tag} style={{ display: "grid", gridTemplateColumns: "72px 1fr auto", gap: 10, padding: "9px 14px", borderBottom: i < PREVIEW.length - 1 ? "1px solid var(--line)" : "none", alignItems: "flex-start", fontSize: 12 }}>
                      <span style={{ fontFamily: "var(--mono)", color: "var(--ink-3)", paddingTop: 1 }}>{r.tag}</span>
                      <div>
                        <span style={{ fontWeight: 500 }}>{r.name}</span>
                        <span style={{ color: "var(--ink-3)", marginLeft: 6 }}>{r.model}</span>
                        <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>{r.detail}</div>
                      </div>
                      <span className={`to-chip ${chipColor(r.action)}`} style={{ fontSize: 10, alignSelf: "flex-start", marginTop: 2 }}>{r.action}</span>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 6 }}>Conflicts will be flagged in the registry — no automatic overwrite.</div>
              </div>
            </>
          )}

          {phase === "running" && (
            <div>
              <div style={{ height: 6, borderRadius: 4, background: "var(--panel-3)", overflow: "hidden", marginBottom: 10 }}>
                <div style={{ width: `${Math.min(progress, 100)}%`, height: "100%", background: "var(--brand-cta)", borderRadius: 4, transition: "width .28s" }} />
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-3)", marginBottom: 10 }}>{Math.round(Math.min(progress, 100))}% complete</div>
              <div style={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 8, padding: "10px 14px", fontFamily: "var(--mono)", fontSize: 11, color: "var(--ok)", maxHeight: 180, overflowY: "auto", lineHeight: 1.8 }}>
                {logLines.map((l, i) => <div key={i}>› {l}</div>)}
                <div style={{ opacity: .5 }}>_</div>
              </div>
            </div>
          )}

          {phase === "done" && (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--ok-dim)", display: "grid", placeItems: "center", margin: "0 auto 14px" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ok)" strokeWidth="2.4"><path d="M5 13l4 4L19 7" /></svg>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Sync complete</div>
              <div style={{ fontSize: 13, color: "var(--ink-2)" }}>3 assets imported · 2 updated · 2 conflicts flagged for review</div>
            </div>
          )}
        </div>

        <div className="to-modal-f">
          {phase === "idle" && (
            <>
              <button className="to-btn ghost sm" onClick={() => { reset(); onClose(); }}>Cancel</button>
              <button className="to-btn primary sm" onClick={runSync}>Run sync now</button>
            </>
          )}
          {phase === "done" && (
            <button className="to-btn primary sm" onClick={() => { reset(); onClose(); }}>Done</button>
          )}
        </div>
      </div>
    </div>
  );
}
