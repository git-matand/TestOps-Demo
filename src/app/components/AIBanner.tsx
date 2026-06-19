import { useState } from "react";

interface AIBannerProps {
  summary: string;
  prediction?: { text: string; level: "warn" | "bad" };
  chips: string[];
  onQuery: (q: string) => void;
}

const SparkleIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{flexShrink:0,color:"var(--brand)"}}>
    <path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6z"/>
    <path d="M19 3l.9 2.7L22 7l-2.1.7L19 10l-.9-2.3L16 7l2.1-.7z" opacity=".5"/>
    <path d="M5 17l.7 2.1L8 20l-1.7.5L5 22l-.7-1.9L2 19l1.7-.5z" opacity=".4"/>
  </svg>
);

const WarnIcon = ({ level }: { level: "warn" | "bad" }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0,color:`var(--${level})`}}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <path d="M12 9v4M12 17h.01"/>
  </svg>
);

export function AIBanner({ summary, prediction, chips, onQuery }: AIBannerProps) {
  const [open, setOpen] = useState(true);

  return (
    <div style={{
      marginBottom: 20,
      borderRadius: 10,
      border: "1px solid rgba(130,139,245,.18)",
      borderLeft: "3px solid var(--brand)",
      background: "linear-gradient(135deg, rgba(94,106,210,.07) 0%, rgba(20,21,23,0) 60%), var(--panel-2)",
      boxShadow: "0 1px 3px rgba(0,0,0,.18)",
      overflow: "hidden",
    }}>
      {/* Header row — always visible, click to toggle */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 7,
          width: "100%", padding: "11px 16px",
          background: "none", border: "none", cursor: "pointer",
          textAlign: "left",
        }}
      >
        <SparkleIcon />
        <span style={{
          fontFamily:"var(--ui)", fontSize:10.5, fontWeight:580,
          letterSpacing:".07em", textTransform:"uppercase", color:"var(--brand-2)",
        }}>
          AI Assistant
        </span>

        {/* Collapsed preview */}
        {!open && (
          <span style={{
            fontSize: 12, color: "var(--ink-3)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            flex: 1, marginLeft: 4,
          }}>
            {prediction
              ? <span style={{color: prediction.level === "bad" ? "var(--bad)" : "var(--warn)"}}>⚠ {prediction.text}</span>
              : summary}
          </span>
        )}

        {/* Chevron */}
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="var(--ink-3)" strokeWidth="2"
          style={{ flexShrink: 0, marginLeft: "auto", transition: "transform .2s", transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
        >
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {/* Collapsible body */}
      {open && (
        <div style={{ padding: "0 16px 12px" }}>
          {/* Summary */}
          <div style={{fontSize:13, color:"var(--ink-2)", lineHeight:1.55, marginBottom: prediction ? 8 : 10}}>
            {summary}
          </div>

          {/* Prediction / alert */}
          {prediction && (
            <div style={{
              display:"flex", alignItems:"flex-start", gap:7,
              background: prediction.level === "bad" ? "var(--bad-dim)" : "var(--warn-dim)",
              border: `1px solid ${prediction.level === "bad" ? "rgba(235,87,87,.22)" : "rgba(242,201,76,.2)"}`,
              borderRadius:6, padding:"7px 10px", marginBottom:10,
              fontSize:12.5, color: prediction.level === "bad" ? "var(--bad)" : "var(--warn)",
              lineHeight:1.45,
            }}>
              <WarnIcon level={prediction.level} />
              <span>{prediction.text}</span>
            </div>
          )}

          {/* Chips */}
          <div style={{display:"flex", flexWrap:"wrap", gap:6}}>
            {chips.map(q => (
              <button
                key={q}
                onClick={() => onQuery(q)}
                style={{
                  display:"inline-flex", alignItems:"center", gap:5,
                  height:26, padding:"0 10px",
                  borderRadius:6, border:"1px solid rgba(130,139,245,.22)",
                  background:"rgba(94,106,210,.08)",
                  color:"var(--brand-2)", fontSize:12, fontWeight:500,
                  cursor:"pointer", transition:"background .12s, border-color .12s",
                  fontFamily:"var(--ui)",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "rgba(94,106,210,.16)";
                  e.currentTarget.style.borderColor = "rgba(130,139,245,.4)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "rgba(94,106,210,.08)";
                  e.currentTarget.style.borderColor = "rgba(130,139,245,.22)";
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{opacity:.7}}>
                  <circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>
                </svg>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
