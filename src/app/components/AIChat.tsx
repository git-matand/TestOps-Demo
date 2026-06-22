import { useState, useRef, useEffect } from "react";

interface Message {
  id: number;
  role: "user" | "ai";
  text: string;
  ts: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

const CHIPS = [
  "What's at risk this week?",
  "Show underutilized benches",
  "Where can I cut cost?",
  "Which campaigns are delayed?",
  "Predict next failure",
  "Summarize TB-04 status",
];

const RESPONSES: [RegExp, string][] = [
  [/at risk|risk this week/i,
    "**1 campaign at risk:** CMP-221 (ADAS Sensor Fusion v1) is queued behind TB-09 maintenance — likely to miss its Jun 22 start unless the bed returns a day early.\n\n**Hardware risk:** TB-04 has a 78% failure probability within 14 days — CPU at 89°C with 2 unexpected restarts. Service before ECU Boot Stress deadline (Jun 19)."],
  [/underutil/i,
    "**TB-07 and TB-12** are consistently below 30% utilization over the past 6 weeks.\n\nReallocating load from the overloaded TB-05 onto TB-07 would:\n- Reduce overload risk on TB-05\n- Free a license seat\n- Clear the recurring queue without adding capacity"],
  [/cost|cut|sav/i,
    "Top cost reduction opportunities:\n\n- **Reclaim TB-07 & TB-12** — saves ~€1.8k/mo, low risk\n- **Reallocate TB-05 overflow** to idle beds before emergency fixes are needed\n- **Audit DUT-31 & DUT-40** — calibration overdue, risk of campaign delay charges"],
  [/uptime|dut.*90|90.*dut/i,
    "**3 DUTs below 90% uptime** this quarter:\n\n- DUT-04 (ECU-A2 Boot Controller) — 84.3%, Error state, TB-04\n- DUT-45 (dSPACE SCALEXIO #2) — 84.9%, Degraded, TB-10\n- DUT-42 (BMS Master Pack) — 88.6%, Online but declining, TB-08"],
  [/fail|predict|forecast/i,
    "**Predicted failures — next 14 days:**\n\n- **TB-04** · 78% probability — CPU 89°C, 2 restarts (same signature as dSPACE fault Q1)\n- **TB-146** · High risk — disk at 99%, 2 coredumps, unreachable\n- **TB-022** · Watch — LIN coredump 9 min ago, went down"],
  [/tb-04|tb04|boot stress/i,
    "**TB-04 (Boot Stress)** is currently **Down**.\n\n- CPU temperature reached 89°C\n- 2 unexpected restarts in 14 days\n- Same failure signature as dSPACE SCALEXIO #2 last quarter\n- Disk at 99% with 2 active coredumps\n\nRecommend immediate service before the ECU Boot Stress deadline (Jun 19)."],
  [/campaign|can.?stack|ota firmware/i,
    "**Active campaigns (8 of 12):**\n\n- CAN-Stack Regression v2.4 — 78% · on track\n- OTA Firmware Update Suite — 45%\n- ECU Boot Stress Test — 91% · nearly done\n- HW-in-loop Validation Q2 — 33%\n- Power Cycle Endurance — 62%\n\n**Queued (4):** Thermal Endurance Q3, ADAS Sensor Fusion v1 (at risk of delay)."],
  [/bench|fleet|tb-/i,
    "**Fleet summary:** 10 Up · 3 Down · 3 Degraded · 2 Maintenance.\n\nNeeds attention:\n- **TB-146** — disk 99%, 2 coredumps, unreachable\n- **TB-022** — LIN coredump, down 9 min ago\n- **TB-004** — CPU 89°C, 78% failure probability\n- **TB-112** — CPU 89%, Degraded state"],
  [/delayed|miss|slip/i,
    "**CMP-221 (ADAS Sensor Fusion v1)** is the only campaign currently at risk of slipping.\n\n- Queued behind TB-09 maintenance\n- Planned start: Jun 22\n- If TB-09 isn't returned by Jun 21, the campaign misses its window\n- Owner: A. Kovalenko · Priority: High"],
];

function getMock(q: string): string {
  for (const [pat, reply] of RESPONSES) {
    if (pat.test(q)) return reply;
  }
  return "Based on current platform data — **97.4%** bench availability, **73%** bed utilization, **8 of 12** campaigns active.\n\nTry asking:\n- \"What's at risk this week?\"\n- \"Predict next failure\"\n- \"Where can I cut cost?\"";
}

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function MsgText({ text }: { text: string }) {
  return (
    <div style={{ fontSize: 13, lineHeight: 1.6 }}>
      {text.split("\n").map((line, i) => {
        const isBullet = line.startsWith("- ");
        const content = isBullet ? line.slice(2) : line;
        const parts = content.split(/\*\*(.*?)\*\*/g);
        const rendered = parts.map((p, j) =>
          j % 2 === 1 ? <b key={j} style={{ fontWeight: 600 }}>{p}</b> : p
        );
        return (
          <div key={i} style={{ display: "flex", gap: isBullet ? 7 : 0, marginBottom: 2 }}>
            {isBullet && <span style={{ color: "var(--brand)", flexShrink: 0, lineHeight: 1.6 }}>·</span>}
            <span>{rendered}</span>
          </div>
        );
      })}
    </div>
  );
}

const SparkleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6z"/>
    <path d="M19 3l.9 2.7L22 7l-2.1.7L19 10l-.9-2.3L16 7l2.1-.7z" opacity=".5"/>
  </svg>
);

export function AIChat({ open, onClose }: Props) {
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, thinking]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 260);
  }, [open]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;
    const userMsg: Message = { id: Date.now(), role: "user", text: trimmed, ts: now() };
    setMsgs(prev => [...prev, userMsg]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      const aiMsg: Message = { id: Date.now() + 1, role: "ai", text: getMock(trimmed), ts: now() };
      setMsgs(prev => [...prev, aiMsg]);
      setThinking(false);
    }, 800 + Math.random() * 500);
  };

  const showChips = !thinking && (msgs.length === 0 || msgs[msgs.length - 1]?.role === "ai");

  return (
    <>
      {/* Scrim */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,.22)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity .25s",
          zIndex: 800,
        }}
      />

      {/* Panel */}
      <aside style={{
        position: "fixed", right: 0, top: 0, height: "100%", width: 380,
        background: "var(--panel)",
        borderLeft: "1px solid var(--line-2)",
        boxShadow: "-8px 0 40px rgba(0,0,0,.16)",
        display: "flex", flexDirection: "column",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform .28s cubic-bezier(.4,0,.2,1)",
        zIndex: 900,
      }}>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "14px 16px",
          borderBottom: "1px solid var(--line)",
          flexShrink: 0,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "var(--brand-dim)", color: "var(--brand)",
            display: "grid", placeItems: "center", flexShrink: 0,
          }}>
            <SparkleIcon />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)", lineHeight: 1.2 }}>AI Assistant</div>
            <div style={{ fontSize: 11, color: "var(--ok)", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--ok)", display: "inline-block" }} />
              Connected to TestOps
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              marginLeft: "auto", width: 28, height: 28, borderRadius: 6,
              border: "1px solid var(--line-2)", background: "var(--panel-2)",
              display: "grid", placeItems: "center", color: "var(--ink-3)",
              cursor: "pointer", flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px", display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Welcome state */}
          {msgs.length === 0 && (
            <div style={{
              margin: "auto 0",
              padding: "32px 16px",
              textAlign: "center",
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: "var(--brand-dim)", color: "var(--brand)",
                display: "grid", placeItems: "center", margin: "0 auto 14px",
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6z"/>
                  <path d="M19 3l.9 2.7L22 7l-2.1.7L19 10l-.9-2.3L16 7l2.1-.7z" opacity=".5"/>
                  <path d="M5 17l.7 2.1L8 20l-1.7.5L5 22l-.7-1.9L2 19l1.7-.5z" opacity=".4"/>
                </svg>
              </div>
              <div style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)", marginBottom: 6 }}>
                Ask about your test farm
              </div>
              <div style={{ fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.55 }}>
                I have live access to campaigns, benches, DUTs, assets, and utilization data. Try one of the suggestions below or ask anything.
              </div>
            </div>
          )}

          {msgs.map(msg => (
            <div key={msg.id} style={{
              display: "flex",
              flexDirection: msg.role === "user" ? "row-reverse" : "row",
              gap: 8, alignItems: "flex-start",
            }}>
              {msg.role === "ai" && (
                <div style={{
                  width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                  background: "var(--brand-dim)", color: "var(--brand)",
                  display: "grid", placeItems: "center", marginTop: 2,
                }}>
                  <SparkleIcon />
                </div>
              )}
              <div style={{
                maxWidth: "84%",
                background: msg.role === "user" ? "var(--brand)" : "var(--panel-2)",
                color: msg.role === "user" ? "#fff" : "var(--ink)",
                borderRadius: msg.role === "user" ? "12px 12px 3px 12px" : "3px 12px 12px 12px",
                padding: "9px 12px",
                border: msg.role === "ai" ? "1px solid var(--line)" : "none",
              }}>
                <MsgText text={msg.text} />
                <div style={{
                  fontSize: 10, marginTop: 5,
                  color: msg.role === "user" ? "rgba(255,255,255,.55)" : "var(--ink-4)",
                  textAlign: "right",
                }}>
                  {msg.ts}
                </div>
              </div>
            </div>
          ))}

          {/* Thinking */}
          {thinking && (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <div style={{
                width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                background: "var(--brand-dim)", color: "var(--brand)",
                display: "grid", placeItems: "center", marginTop: 2,
              }}>
                <SparkleIcon />
              </div>
              <div style={{
                background: "var(--panel-2)", border: "1px solid var(--line)",
                borderRadius: "3px 12px 12px 12px",
                padding: "12px 14px",
                display: "flex", gap: 4, alignItems: "center",
              }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{
                    width: 5, height: 5, borderRadius: "50%",
                    background: "var(--brand)",
                    display: "inline-block",
                    animation: `aichat-bounce .9s ease-in-out ${i * 0.15}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Chips */}
        {showChips && (
          <div style={{ padding: "0 16px 8px", flexShrink: 0 }}>
            <div style={{ fontSize: 10.5, color: "var(--ink-4)", marginBottom: 6, fontWeight: 500, letterSpacing: ".05em", textTransform: "uppercase" }}>
              Suggestions
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {CHIPS.map(c => (
                <button
                  key={c}
                  onClick={() => send(c)}
                  style={{
                    height: 26, padding: "0 10px", borderRadius: 6,
                    border: "1px solid rgba(130,139,245,.22)",
                    background: "var(--brand-dim)",
                    color: "var(--brand)", fontSize: 11.5, fontWeight: 500,
                    cursor: "pointer", whiteSpace: "nowrap",
                    transition: "background .12s, border-color .12s",
                    fontFamily: "var(--ui)",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "rgba(94,106,210,.18)";
                    e.currentTarget.style.borderColor = "rgba(130,139,245,.45)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "var(--brand-dim)";
                    e.currentTarget.style.borderColor = "rgba(130,139,245,.22)";
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div style={{ padding: "10px 16px 16px", borderTop: "1px solid var(--line)", flexShrink: 0 }}>
          <form
            onSubmit={e => { e.preventDefault(); send(input); }}
            style={{ display: "flex", gap: 8, alignItems: "flex-end" }}
          >
            <textarea
              ref={inputRef}
              rows={2}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
              }}
              placeholder="Ask about campaigns, benches, DUTs, costs…"
              style={{
                flex: 1, resize: "none",
                padding: "9px 12px",
                borderRadius: 8,
                border: "1px solid var(--line-2)",
                background: "var(--panel-2)",
                color: "var(--ink)",
                fontSize: 13,
                fontFamily: "var(--ui)",
                lineHeight: 1.5,
                outline: "none",
                transition: "border-color .15s",
              }}
              onFocus={e => e.currentTarget.style.borderColor = "var(--brand)"}
              onBlur={e => e.currentTarget.style.borderColor = "var(--line-2)"}
            />
            <button
              type="submit"
              disabled={!input.trim() || thinking}
              style={{
                width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                background: !input.trim() || thinking ? "var(--panel-3)" : "var(--brand)",
                color: !input.trim() || thinking ? "var(--ink-4)" : "#fff",
                border: "none", cursor: !input.trim() || thinking ? "default" : "pointer",
                display: "grid", placeItems: "center",
                transition: "background .15s, color .15s",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
              </svg>
            </button>
          </form>
          <div style={{ fontSize: 10.5, color: "var(--ink-4)", marginTop: 6, textAlign: "center" }}>
            ⏎ to send · Shift+⏎ for new line
          </div>
        </div>
      </aside>

      <style>{`
        @keyframes aichat-bounce {
          0%, 80%, 100% { transform: scale(1); opacity: .4; }
          40% { transform: scale(1.3); opacity: 1; }
        }
      `}</style>
    </>
  );
}
