import { ROLE_LABELS } from "../permissions";
import type { Role } from "../App";

export function AccessDenied({ section, currentRole, requires }: {
  section: string;
  currentRole: Role;
  requires: string;
}) {
  return (
    <div className="to-screen">
      <div style={{
        maxWidth: 460, margin: "60px auto", textAlign: "center",
        background: "var(--panel)", border: "1px solid var(--line-2)",
        borderRadius: 14, padding: "40px 32px",
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14, margin: "0 auto 18px",
          background: "var(--panel-3)", display: "grid", placeItems: "center",
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="1.7">
            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <div style={{ fontSize: 17, fontWeight: 660, color: "var(--ink)", marginBottom: 8 }}>
          {section} is restricted
        </div>
        <div style={{ fontSize: 13.5, color: "var(--ink-3)", lineHeight: 1.55, marginBottom: 20 }}>
          You're viewing as <b style={{ color: "var(--ink-2)" }}>{ROLE_LABELS[currentRole]}</b>.
          This section requires <b style={{ color: "var(--ink-2)" }}>{requires}</b> access.
        </div>
        <div style={{
          fontSize: 12, color: "var(--ink-4)", padding: "10px 14px",
          background: "var(--panel-2)", borderRadius: 8, display: "inline-block",
        }}>
          Switch role in the sidebar (demo) to explore this view.
        </div>
      </div>
    </div>
  );
}
