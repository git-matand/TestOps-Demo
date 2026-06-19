import { useState, useEffect } from "react";
import { TestBench } from "../data";

interface Props {
  bench: TestBench;
  open: boolean;
  onClose: () => void;
  addToast: (t: string, s?: string, type?: string) => void;
}

const VERSIONS = [
  { id: "v3.1.0", label: "v3.1.0", note: "current" },
  { id: "v3.1.2", label: "v3.1.2", note: "stable" },
  { id: "v3.2.0", label: "v3.2.0", note: "stable" },
  { id: "v3.2.1", label: "v3.2.1", note: "latest" },
  { id: "v3.2.1-rc2", label: "v3.2.1-rc2", note: "release candidate" },
];

const LOG_LINES = [
  "Connecting to collector…",
  "Collector reachable · starting pre-flash sequence",
  "Stopping active test processes…",
  "Disk check: 7.7G available · OK",
  "Downloading firmware image v{VER}…",
  "Verifying image checksum · sha256:a3f8c12…",
  "Checksum verified · OK",
  "Unmounting /dev/root partitions…",
  "Writing firmware block 1/3…",
  "Writing firmware block 2/3…",
  "Writing firmware block 3/3…",
  "Write complete · verifying…",
  "Verification passed",
  "Rebooting DUT…",
  "Waiting for DUT to come online…",
  "DUT online · confirming version…",
  "Version confirmed: {VER} ✓",
];

export function FirmwareFlashSheet({ bench, open, onClose, addToast }: Props) {
  const [step, setStep] = useState(0);
  const [targetVer, setTargetVer] = useState("v3.2.1");
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const currentVer = bench.build?.distroVersion || "v3.1.0";

  useEffect(() => {
    if (!open) { setStep(0); setProgress(0); setLogs([]); }
  }, [open]);

  const startFlash = () => {
    setStep(2);
    setProgress(0);
    setLogs([]);
    let idx = 0;
    const interval = setInterval(() => {
      const line = LOG_LINES[idx]?.replace(/\{VER\}/g, targetVer) || "";
      setLogs(l => [...l, line]);
      idx++;
      setProgress(Math.round((idx / LOG_LINES.length) * 100));
      if (idx >= LOG_LINES.length) {
        clearInterval(interval);
        setTimeout(() => {
          setStep(3);
          addToast("Firmware updated", `${bench.hosts[0]?.hostId} → ${targetVer}`);
        }, 400);
      }
    }, 520);
  };

  const checks = [
    { label: "Collector reachable", ok: bench.telemetry.collectorUp, msg: bench.telemetry.collectorUp ? "Online" : "Offline — cannot flash" },
    { label: "Disk space", ok: bench.telemetry.diskPct < 90, msg: bench.telemetry.diskPct < 90 ? `${100 - bench.telemetry.diskPct}% free — sufficient` : "Disk full — clear space first" },
    { label: "Active test running", ok: true, msg: "No active test — safe to proceed" },
    { label: "Image checksum", ok: true, msg: `sha256:a3f8c12… · ${targetVer} verified` },
  ];
  const checksPass = checks.every(c => c.ok);

  if (!open) return null;

  return (
    <>
      <div className="to-scrim open" onClick={() => step < 2 && onClose()} />
      <aside className="to-drawer-wide open">
        <div className="to-drawer-h">
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "var(--brand-dim)", display: "grid", placeItems: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.8"><path d="M12 3v12M8 11l4 4 4-4M5 21h14" /></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--brand)" }}>{bench.hosts[0]?.hostId} · {bench.id}</div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Flash firmware</div>
          </div>
          <button className="to-drawer-x" onClick={onClose} disabled={step === 2}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>

        {/* Step indicator */}
        <div style={{ padding: "16px 20px 0" }}>
          <div className="to-steps">
            {["Select version", "Pre-checks", "Flashing", "Complete"].map((l, i) => (
              <div key={l} className={`to-step ${step === i ? "active" : ""}`}>
                <div className={`to-step-dot ${step > i ? "done" : step === i ? "active" : "pending"}`}>
                  {step > i ? "✓" : i + 1}
                </div>
                <div className="to-step-label">{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="to-drawer-b">
          {/* Step 0: Select version */}
          {step === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div className="to-form-section-title">Current firmware</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: 8, marginTop: 8 }}>
                  <span className="to-chip mute" style={{ fontFamily: "var(--mono)" }}>{currentVer}</span>
                  <span style={{ fontSize: 12, color: "var(--ink-3)" }}>installed on {bench.hosts[0]?.hostId} · build #{bench.build?.buildNumber || "—"}</span>
                </div>
              </div>
              <div>
                <div className="to-form-section-title">Target version</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                  {VERSIONS.filter(v => v.id !== currentVer).map(v => (
                    <label key={v.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: targetVer === v.id ? "var(--brand-dim)" : "var(--panel-2)", border: `1px solid ${targetVer === v.id ? "var(--brand-cta)" : "var(--line)"}`, borderRadius: 8, cursor: "pointer", transition: ".1s" }}>
                      <input type="radio" name="ver" value={v.id} checked={targetVer === v.id} onChange={() => setTargetVer(v.id)} style={{ accentColor: "var(--brand-cta)" }} />
                      <span style={{ fontFamily: "var(--mono)", fontWeight: 600, fontSize: 13 }}>{v.label}</span>
                      <span className={`to-chip ${v.note === "latest" ? "ok" : v.note === "stable" ? "mid" : "mute"}`} style={{ fontSize: 10 }}>{v.note}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ padding: "10px 14px", background: "var(--warn-dim)", border: "1px solid rgba(242,201,76,.3)", borderRadius: 8, fontSize: 12, color: "var(--warn)", lineHeight: 1.5 }}>
                ⚠ Flashing will stop any active test and reboot the DUT. Estimated downtime: 4–6 minutes.
              </div>
              <button className="to-btn primary" onClick={() => setStep(1)}>
                Continue to pre-checks →
              </button>
            </div>
          )}

          {/* Step 1: Pre-checks */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="to-form-section-title">Pre-flash checks · flashing {currentVer} → {targetVer}</div>
              {checks.map(c => (
                <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", background: "var(--panel-2)", border: `1px solid ${c.ok ? "var(--line)" : "rgba(235,87,87,.4)"}`, borderRadius: 8 }}>
                  <span style={{ color: c.ok ? "var(--ok)" : "var(--bad)", fontSize: 18, lineHeight: 1 }}>{c.ok ? "✓" : "✗"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{c.label}</div>
                    <div style={{ fontSize: 11, color: c.ok ? "var(--ink-3)" : "var(--bad)", marginTop: 2 }}>{c.msg}</div>
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button className="to-btn ghost sm" onClick={() => setStep(0)}>← Back</button>
                <button className="to-btn primary sm" onClick={startFlash} disabled={!checksPass} style={{ opacity: checksPass ? 1 : .5 }}>
                  {checksPass ? "Start flashing →" : "Fix errors above first"}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Flashing */}
          {step === 2 && (
            <div>
              <div className="to-form-section-title" style={{ marginBottom: 10 }}>
                Flashing {targetVer} · do not power off the device
              </div>
              <div style={{ height: 6, borderRadius: 4, background: "var(--panel-3)", overflow: "hidden", marginBottom: 12 }}>
                <div style={{ width: `${progress}%`, height: "100%", background: "var(--brand-cta)", borderRadius: 4, transition: "width .5s" }} />
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-3)", marginBottom: 12 }}>{progress}% complete</div>
              <div style={{ background: "#050506", border: "1px solid var(--line)", borderRadius: 8, padding: "12px 14px", fontFamily: "var(--mono)", fontSize: 11, color: "var(--ok)", maxHeight: 320, overflowY: "auto", lineHeight: 1.9 }}>
                {logs.map((l, i) => <div key={i}>› {l}</div>)}
                {step === 2 && <span style={{ opacity: .6 }}>_</span>}
              </div>
            </div>
          )}

          {/* Step 3: Done */}
          {step === 3 && (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--ok-dim)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--ok)" strokeWidth="2.4"><path d="M5 13l4 4L19 7" /></svg>
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Flash complete</div>
              <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.6 }}>
                {bench.hosts[0]?.hostId} is now running
                <span style={{ fontFamily: "var(--mono)", color: "var(--ok)", marginLeft: 6 }}>{targetVer}</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 8, fontFamily: "var(--mono)" }}>
                Flashed at {new Date().toLocaleTimeString()} · uptime reset
              </div>
              <button className="to-btn primary sm" style={{ marginTop: 24 }} onClick={() => { setStep(0); onClose(); }}>Done</button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

/* Confirmation modal for destructive device actions */
export function DeviceActionModal({ action, hostId, open, onConfirm, onClose }: {
  action: "reset" | "stop";
  hostId: string;
  open: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;
  const isReset = action === "reset";
  return (
    <div className="to-modal-scrim open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="to-modal" style={{ width: "min(420px,100%)" }}>
        <div className="to-modal-h">
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--bad-dim)", display: "grid", placeItems: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--bad)" strokeWidth="2"><path d="M12 9v4M12 17h.01" /><circle cx="12" cy="12" r="9" /></svg>
          </div>
          <div style={{ flex: 1 }}>
            <h3>{isReset ? "Reset device?" : "Stop test?"}</h3>
            <div className="sub">{hostId}</div>
          </div>
          <button className="to-modal-x" onClick={onClose}>✕</button>
        </div>
        <div className="to-modal-b">
          <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.6 }}>
            {isReset
              ? `This will power-cycle the DUT on ${hostId}. Any active test run will be interrupted and approximately 40 seconds of downtime is expected while the device rejoins.`
              : `This will halt the currently running test on ${hostId}. Progress will be lost and the queue will be paused.`}
          </div>
        </div>
        <div className="to-modal-f">
          <button className="to-btn ghost sm" onClick={onClose}>Cancel</button>
          <button className="to-btn danger sm" onClick={() => { onConfirm(); onClose(); }}>
            {isReset ? "Yes, reset device" : "Yes, stop test"}
          </button>
        </div>
      </div>
    </div>
  );
}
