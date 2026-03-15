import { T } from "../lib/theme.js";

export const tableStyle = {
  width: "100%", borderCollapse: "separate", borderSpacing: 0,
  fontSize: 12,
};
export const thStyle = {
  textAlign: "left", padding: "8px 12px", color: T.muted, fontSize: 10,
  fontWeight: 700, letterSpacing: 1, borderBottom: `1px solid ${T.border}`,
  whiteSpace: "nowrap", textTransform: "uppercase",
};
export const tdStyle = {
  padding: "10px 12px", borderBottom: `1px solid ${T.border}`, color: T.text,
  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
};

export function StatCard({ label, value, sub, icon: Ic, color = T.accent }) {
  return (
    <div className="glass-surface" style={{ borderRadius: 14, padding: "14px 16px", flex: 1, minWidth: 140, boxShadow: "var(--s-glass)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        {Ic && <Ic size={13} color={color} />}
        <span style={{ color: T.muted, fontSize: 10, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase" }}>{label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: T.text }}>{value}</div>
      {sub && <div style={{ color: T.muted, fontSize: 11, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export function stageBadge(stage) {
  const colors = {
    proposal:  { bg: "rgba(139,92,246,0.15)", fg: T.accent },
    negotiation: { bg: "rgba(245,158,11,0.15)", fg: T.warn },
    "closed won": { bg: "rgba(16,185,129,0.15)", fg: T.success },
    "closed lost": { bg: "rgba(239,68,68,0.15)", fg: T.error },
  };
  const key = (stage || "").toLowerCase();
  const c = Object.entries(colors).find(([k]) => key.includes(k))?.[1] || { bg: T.bgCard, fg: T.muted };
  return (
    <span style={{ background: c.bg, color: c.fg, fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 4, whiteSpace: "nowrap" }}>
      {stage || "—"}
    </span>
  );
}

export function statusBadge(status) {
  const s = (status || "").toLowerCase();
  const color = s.includes("submitted") ? T.success : s.includes("draft") ? T.warn : s.includes("lost") || s.includes("reject") ? T.error : T.muted;
  return <span style={{ color, fontSize: 11, fontWeight: 500 }}>{status || "—"}</span>;
}
