import { useState } from "react";

interface Props {
  tag: string;
  name: string;
  open: boolean;
  onClose: () => void;
}

function generateQR(tag: string): boolean[][] {
  const N = 21;
  let s = tag.split("").reduce((a, c) => (Math.imul(a, 31) + c.charCodeAt(0)) >>> 0, 5381);
  const rand = () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 0x100000000; };
  return Array.from({ length: N }, (_, r) =>
    Array.from({ length: N }, (_, c) => {
      // Finder patterns — top-left, top-right, bottom-left
      const inFinder = (row: number, col: number) =>
        (row === 0 || row === 6 || col === 0 || col === 6) || (row >= 2 && row <= 4 && col >= 2 && col <= 4);
      if (r < 7 && c < 7) return inFinder(r, c);
      if (r < 7 && c >= N - 7) return inFinder(r, c - (N - 7));
      if (r >= N - 7 && c < 7) return inFinder(r - (N - 7), c);
      // Separator quiet zones
      if (r === 7 || c === 7 || r === N - 8 || c === N - 8) return false;
      // Timing patterns
      if (r === 6 || c === 6) return (r + c) % 2 === 0;
      return rand() > 0.42;
    })
  );
}

export function QRModal({ tag, name, open, onClose }: Props) {
  const [printed, setPrinted] = useState(false);
  if (!open) return null;

  const grid = generateQR(tag);
  const N = 21;
  const cell = 9;
  const pad = 14;
  const size = N * cell + pad * 2;

  return (
    <div className="to-modal-scrim open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="to-modal" style={{ width: "min(380px,100%)" }}>
        <div className="to-modal-h">
          <div>
            <h3>QR Tag — #{tag}</h3>
            <div className="sub">{name} · scan to open asset in TestOps</div>
          </div>
          <button className="to-modal-x" onClick={onClose}>✕</button>
        </div>
        <div className="to-modal-b" style={{ alignItems: "center", textAlign: "center" }}>
          <div style={{ background: "#fff", padding: pad, borderRadius: 10, display: "inline-block", boxShadow: "0 4px 24px rgba(0,0,0,.4)" }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              {grid.flatMap((row, r) =>
                row.map((filled, c) =>
                  filled ? (
                    <rect key={`${r}-${c}`} x={pad + c * cell} y={pad + r * cell} width={cell - 0.5} height={cell - 0.5} fill="#08090A" rx={0.5} />
                  ) : null
                )
              )}
            </svg>
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 14, fontWeight: 600, marginTop: 14, letterSpacing: ".08em", color: "var(--ink)" }}>{tag}</div>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 3 }}>{name}</div>
          <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 2, fontFamily: "var(--mono)" }}>testops.spyrosoft.local/assets/{tag}</div>
        </div>
        <div className="to-modal-f">
          <button className="to-btn ghost sm" onClick={onClose}>Close</button>
          <button className="to-btn accent sm" onClick={() => setPrinted(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" rx="1" />
            </svg>
            {printed ? "Sent to printer ✓" : "Print label"}
          </button>
          <button className="to-btn primary sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3v12M8 11l4 4 4-4M5 21h14" /></svg>
            Download PNG
          </button>
        </div>
      </div>
    </div>
  );
}

export function ScanModal({ open, onClose, onScanned }: { open: boolean; onClose: () => void; onScanned: (tag: string) => void }) {
  const [scanning, setScanning] = useState(false);
  const [found, setFound] = useState<string | null>(null);
  if (!open) return null;

  const simulateScan = () => {
    setScanning(true);
    setTimeout(() => {
      const tag = "00197";
      setFound(tag);
      setScanning(false);
    }, 2200);
  };

  return (
    <div className="to-modal-scrim open" onClick={e => { if (e.target === e.currentTarget) { setFound(null); setScanning(false); onClose(); } }}>
      <div className="to-modal" style={{ width: "min(400px,100%)" }}>
        <div className="to-modal-h">
          <div><h3>Scan QR Tag</h3><div className="sub">Point camera at any asset QR label</div></div>
          <button className="to-modal-x" onClick={() => { setFound(null); setScanning(false); onClose(); }}>✕</button>
        </div>
        <div className="to-modal-b" style={{ alignItems: "center", textAlign: "center" }}>
          {/* Camera viewfinder mock */}
          <div style={{ position: "relative", width: 280, height: 220, background: "#000", borderRadius: 10, overflow: "hidden", margin: "0 auto" }}>
            {/* Corner guides */}
            {[["0,0","tl"],["calc(100% - 28px),0","tr"],["0,calc(100% - 28px)","bl"],["calc(100% - 28px),calc(100% - 28px)","br"]].map(([pos, corner]) => (
              <div key={corner} style={{
                position: "absolute", left: pos.split(",")[0], top: pos.split(",")[1],
                width: 28, height: 28, borderColor: "var(--ok)", borderStyle: "solid", borderWidth: 0,
                borderTopWidth: corner.startsWith("t") ? 3 : 0, borderBottomWidth: corner.startsWith("b") ? 3 : 0,
                borderLeftWidth: corner.endsWith("l") ? 3 : 0, borderRightWidth: corner.endsWith("r") ? 3 : 0,
                borderRadius: corner === "tl" ? "8px 0 0 0" : corner === "tr" ? "0 8px 0 0" : corner === "bl" ? "0 0 0 8px" : "0 0 8px 0",
              }} />
            ))}
            {/* Scan line animation */}
            {scanning && (
              <div style={{
                position: "absolute", left: 20, right: 20, height: 2,
                background: "var(--ok)", boxShadow: "0 0 8px var(--ok)",
                animation: "scanLine 1.4s ease-in-out infinite",
                top: "20%",
              }} />
            )}
            {found ? (
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "rgba(104,204,140,.15)" }}>
                <div>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--ok)" strokeWidth="2.4"><path d="M5 13l4 4L19 7" /></svg>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 18, fontWeight: 700, color: "var(--ok)", marginTop: 8 }}>{found}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4 }}>CIVIC · 7413</div>
                </div>
              </div>
            ) : (
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
                <div style={{ color: "var(--ink-4)", fontSize: 12, fontFamily: "var(--mono)" }}>
                  {scanning ? "scanning…" : "camera ready"}
                </div>
              </div>
            )}
          </div>
          <style>{`@keyframes scanLine { 0%,100%{top:15%} 50%{top:75%} }`}</style>
          {!found && !scanning && (
            <button className="to-btn primary sm" style={{ marginTop: 14 }} onClick={simulateScan}>
              Start scanning
            </button>
          )}
          {found && (
            <div style={{ marginTop: 14, display: "flex", gap: 8, justifyContent: "center" }}>
              <button className="to-btn ghost sm" onClick={() => { setFound(null); simulateScan(); }}>Scan another</button>
              <button className="to-btn primary sm" onClick={() => { onScanned(found); setFound(null); onClose(); }}>Open asset →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
