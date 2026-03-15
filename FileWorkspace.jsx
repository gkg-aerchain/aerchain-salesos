// ═══════════════════════════════════════════════════════════
// FILE WORKSPACE — Universal file list + detail view
// Used by all modules (Pricing Calculator, Proposal Generator, Design Extractor)
// Provides: card grid, expandable detail canvas, file management
// ═══════════════════════════════════════════════════════════

import { useState, useCallback } from "react";
import {
  FileText, DollarSign, Palette, Plus, Copy, Trash2, Download,
  ChevronDown, ChevronRight, X, Clock, Tag, User, Edit3,
  Eye, Code, CheckCircle, AlertCircle, Loader2, TrendingUp,
  Activity, Users, Brain
} from "lucide-react";

// ── Theme tokens (same as App.jsx) ────────────────────────
import { T } from "./lib/theme.js";
import { fmt$ } from "./lib/utils.js";

function timeAgo(date) {
  if (!date) return "Never";
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── STATUS BADGE ──────────────────────────────────────────
function StatusBadge({ status }) {
  const s = (status || "").toLowerCase();
  const config = s.includes("final") || s.includes("submitted")
    ? { bg: "rgba(16,185,129,0.15)", fg: T.success, label: status }
    : s.includes("draft")
    ? { bg: "rgba(245,158,11,0.15)", fg: T.warn, label: status }
    : s.includes("reject") || s.includes("lost")
    ? { bg: "rgba(239,68,68,0.15)", fg: T.error, label: status }
    : { bg: T.badgeBg, fg: T.muted, label: status || "—" };
  return (
    <span style={{ background: config.bg, color: config.fg, fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 4, textTransform: "capitalize" }}>
      {config.label}
    </span>
  );
}

// ── MODULE-SPECIFIC CARD METRICS ──────────────────────────
function getCardMetrics(moduleKey, file) {
  switch (moduleKey) {
    case "pricing-calculator":
      return [
        { label: "Per $1B", value: fmt$(file.data?.standardModel?.per1BSpend), icon: DollarSign },
        { label: "Deals", value: file.data?.recentDeals?.length || 0, icon: Users },
        { label: "Escalation", value: file.data?.standardModel?.yoyEscalation || "—", icon: TrendingUp },
      ];
    case "proposal-generator":
      return [
        { label: "Value", value: fmt$(file.value || file.data?.value), icon: DollarSign },
        { label: "Stage", value: file.stage || "—", icon: Activity },
        { label: "Contact", value: file.contact || "—", icon: User },
      ];
    case "design-extractor":
      return [
        { label: "Theme", value: file.tokens?.meta?.theme || "—", icon: Eye },
        { label: "Colors", value: Object.keys(file.tokens?.colors || {}).length, icon: Palette },
        { label: "Source", value: file.source || "—", icon: Code },
      ];
    default:
      return [];
  }
}

// ── MODULE ICON ───────────────────────────────────────────
function getModuleIcon(moduleKey) {
  switch (moduleKey) {
    case "pricing-calculator": return DollarSign;
    case "proposal-generator": return FileText;
    case "design-extractor":   return Palette;
    default: return FileText;
  }
}

// ══════════════════════════════════════════════════════════
// FILE CARD (collapsed view in the grid)
// ══════════════════════════════════════════════════════════

function FileCard({ file, moduleKey, isSelected, onClick }) {
  const metrics = getCardMetrics(moduleKey, file);
  const Icon = getModuleIcon(moduleKey);

  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: 14,
        padding: "16px 18px",
        cursor: "pointer",
        background: isSelected ? T.bgActive : T.bgCard,
        border: `1px solid ${isSelected ? T.borderAcc : T.border}`,
        boxShadow: isSelected ? "var(--s-glow)" : "var(--s-glass)",
        transition: "all 0.2s",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = T.borderAcc; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = T.border; }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: T.accentBg, display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <Icon size={16} color={T.accent} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {file.name}
          </div>
          <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {file.description}
          </div>
        </div>
        <StatusBadge status={file.status} />
      </div>

      {/* Metrics row */}
      <div style={{ display: "flex", gap: 12 }}>
        {metrics.map((m, i) => {
          const MIcon = m.icon;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, flex: 1, minWidth: 0 }}>
              <MIcon size={10} color={T.mutedSoft} />
              <span style={{ fontSize: 10, color: T.mutedSoft, whiteSpace: "nowrap" }}>{m.label}:</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {m.value}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer: tags + date */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        {(file.tags || []).slice(0, 3).map((tag, i) => (
          <span key={i} style={{ fontSize: 9, fontWeight: 500, padding: "2px 6px", borderRadius: 3, background: T.badgeBg, color: T.muted }}>
            {tag}
          </span>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 10, color: T.mutedSoft, display: "flex", alignItems: "center", gap: 3 }}>
          <Clock size={9} /> {timeAgo(file.updatedAt)}
        </span>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// FILE DETAIL PANEL (expanded working canvas)
// ══════════════════════════════════════════════════════════

function PricingDetail({ file }) {
  const model = file.data?.standardModel || {};
  const deals = file.data?.recentDeals || [];
  const analysis = file.data?.analysis || "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* KPI row */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {[
          { label: "Per $1B Spend", value: fmt$(model.per1BSpend), icon: DollarSign, color: T.accent },
          { label: "YoY Escalation", value: model.yoyEscalation || "—", icon: TrendingUp, color: T.warn },
          { label: "Break-Even", value: model.breakEven || "—", icon: Activity, color: T.success },
        ].map((kpi, i) => {
          const KIcon = kpi.icon;
          return (
            <div key={i} className="glass-surface" style={{ borderRadius: 10, padding: "12px 14px", flex: 1, minWidth: 120, boxShadow: "var(--s-glass)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                <KIcon size={11} color={kpi.color} />
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: T.muted }}>{kpi.label}</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{kpi.value}</div>
            </div>
          );
        })}
      </div>

      {/* Deals table */}
      {deals.length > 0 && (
        <div className="glass-surface" style={{ borderRadius: 12, padding: "12px 14px", boxShadow: "var(--s-glass)" }}>
          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <Users size={12} color={T.accent} /> Recent Deals ({deals.length})
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 11 }}>
              <thead>
                <tr>
                  {["Client", "Y1 Amount", "Spend", "Modules"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "6px 10px", color: T.muted, fontSize: 9, fontWeight: 700, letterSpacing: 0.8, borderBottom: `1px solid ${T.border}`, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deals.map((d, i) => (
                  <tr key={i} className="table-row">
                    <td style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}`, fontWeight: 600, color: T.text }}>{d.client}</td>
                    <td style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}`, color: T.success }}>{fmt$(d.y1Amount)}</td>
                    <td style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}`, color: T.muted }}>{d.spendUnderMgmt}</td>
                    <td style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}`, color: T.muted, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.modules}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Analysis */}
      {analysis && (
        <div className="glass-surface" style={{ borderRadius: 12, padding: "12px 14px", boxShadow: "var(--s-glass)" }}>
          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <Brain size={12} color={T.accent} /> Claude Analysis
          </div>
          <div style={{ fontSize: 11, lineHeight: 1.7, color: T.text, whiteSpace: "pre-wrap" }}>{analysis}</div>
        </div>
      )}
    </div>
  );
}

function ProposalDetail({ file }) {
  const d = file.data || {};
  const sections = d.sections || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Header info */}
      <div className="glass-surface" style={{ borderRadius: 12, padding: "14px 16px", boxShadow: "var(--s-glass)" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>{d.proposalTitle || file.name}</div>
        {d.summary && <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>{d.summary}</div>}
        <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
          {[
            { label: "Client", value: d.client || file.client || "—" },
            { label: "Value", value: fmt$(d.value || file.value) },
            { label: "Stage", value: file.stage || "—" },
            { label: "Contact", value: file.contact || "—" },
          ].map((item, i) => (
            <div key={i}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: T.muted, marginBottom: 2 }}>{item.label}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sections */}
      {sections.map((s, i) => (
        <div key={i} className="glass-surface" style={{ borderRadius: 12, padding: "14px 16px", boxShadow: "var(--s-glass)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 6 }}>{s.heading}</div>
          <div style={{ fontSize: 11, lineHeight: 1.7, color: T.muted, whiteSpace: "pre-wrap" }}>{s.content}</div>
        </div>
      ))}
    </div>
  );
}

function DesignSystemDetail({ file, onLoadReference }) {
  const tokens = file.tokens || {};
  const meta = tokens.meta || {};
  const colors = tokens.colors || {};
  const typography = tokens.typography || {};
  const radius = tokens.radius || {};
  const shadows = tokens.shadows || {};
  const principles = tokens.designPrinciples || [];
  const [activeTab, setActiveTab] = useState("preview");

  const tabs = [
    { id: "preview", label: "Preview", icon: Eye },
    { id: "colors",  label: "Colors",  icon: Palette },
    { id: "type",    label: "Typography", icon: FileText },
    { id: "tokens",  label: "Raw JSON", icon: Code },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Meta info */}
      <div className="glass-surface" style={{ borderRadius: 12, padding: "14px 16px", boxShadow: "var(--s-glass)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, flex: 1 }}>{meta.name || file.name}</div>
          {onLoadReference && file.tokens && (
            <button onClick={() => onLoadReference(file)} style={{
              background: "none", border: `1.5px solid ${T.borderAcc}`,
              color: T.accent, borderRadius: 100,
              padding: "5px 14px", fontSize: 11, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
            }}>
              <Eye size={11} /> Load as Reference
            </button>
          )}
        </div>
        <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.5, marginBottom: 8 }}>{meta.description}</div>
        <div style={{ display: "flex", gap: 16 }}>
          {[
            { label: "Theme", value: meta.theme || "—" },
            { label: "Inspiration", value: meta.inspiration || "—" },
            { label: "Colors", value: Object.keys(colors).length },
            { label: "Source", value: file.source || "—" },
          ].map((item, i) => (
            <div key={i}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: T.muted, marginBottom: 2 }}>{item.label}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.text }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab strip */}
      <div style={{ display: "flex", gap: 2, borderBottom: `1px solid ${T.border}` }}>
        {tabs.map(t => {
          const TabIcon = t.icon;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              background: "none", border: "none", cursor: "pointer", padding: "8px 12px",
              fontSize: 11, fontWeight: activeTab === t.id ? 600 : 400,
              color: activeTab === t.id ? T.text : T.muted,
              borderBottom: activeTab === t.id ? `2px solid ${T.accent}` : "2px solid transparent",
              display: "flex", alignItems: "center", gap: 5, marginBottom: -1
            }}>
              <TabIcon size={11} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Preview tab — color swatches + typography */}
      {activeTab === "preview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Color swatches grid */}
          <div className="glass-surface" style={{ borderRadius: 12, padding: "14px 16px", boxShadow: "var(--s-glass)" }}>
            <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 10 }}>Color Palette</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {Object.entries(colors).map(([key, c]) => (
                <div key={key} style={{ textAlign: "center", width: 64 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 8, background: c.hex,
                    border: `1px solid ${T.border}`, margin: "0 auto 4px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
                  }} />
                  <div style={{ fontSize: 8, fontWeight: 600, color: T.text }}>{c.name}</div>
                  <div style={{ fontSize: 7, color: T.muted, fontFamily: "monospace" }}>{c.hex}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Design principles */}
          {principles.length > 0 && (
            <div className="glass-surface" style={{ borderRadius: 12, padding: "14px 16px", boxShadow: "var(--s-glass)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8 }}>Design Principles</div>
              {principles.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4, fontSize: 11, color: T.muted }}>
                  <span style={{ color: T.accent, fontWeight: 700 }}>{i + 1}.</span> {p}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Colors tab — detailed */}
      {activeTab === "colors" && (
        <div className="glass-surface" style={{ borderRadius: 12, padding: "14px 16px", boxShadow: "var(--s-glass)" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 11 }}>
            <thead>
              <tr>
                {["Swatch", "Name", "Hex", "Token", "Usage"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "6px 8px", fontSize: 9, fontWeight: 700, letterSpacing: 0.8, color: T.muted, borderBottom: `1px solid ${T.border}`, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(colors).map(([key, c]) => (
                <tr key={key} className="table-row">
                  <td style={{ padding: "6px 8px", borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: c.hex, border: `1px solid ${T.border}` }} />
                  </td>
                  <td style={{ padding: "6px 8px", borderBottom: `1px solid ${T.border}`, fontWeight: 600, color: T.text }}>{c.name}</td>
                  <td style={{ padding: "6px 8px", borderBottom: `1px solid ${T.border}`, fontFamily: "monospace", fontSize: 10, color: T.muted }}>{c.hex}</td>
                  <td style={{ padding: "6px 8px", borderBottom: `1px solid ${T.border}`, fontFamily: "monospace", fontSize: 10, color: T.accent }}>{key}</td>
                  <td style={{ padding: "6px 8px", borderBottom: `1px solid ${T.border}`, color: T.muted, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.usage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Typography tab */}
      {activeTab === "type" && (
        <div className="glass-surface" style={{ borderRadius: 12, padding: "14px 16px", boxShadow: "var(--s-glass)" }}>
          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 10 }}>
            Font Family: <span style={{ fontFamily: "monospace", color: T.accent }}>{typography.fontFamily}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(typography.scale || []).map((s, i) => (
              <div key={i} style={{ padding: "10px 12px", background: T.badgeBg, borderRadius: 8 }}>
                <div style={{ fontSize: s.size, fontWeight: s.weight, lineHeight: s.lineHeight, color: T.text, marginBottom: 4 }}>
                  {s.name}
                </div>
                <div style={{ fontSize: 10, color: T.muted }}>
                  {s.size} / {s.weight} / {s.lineHeight} — {s.usage}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw JSON tab */}
      {activeTab === "tokens" && (
        <div className="glass-surface" style={{ borderRadius: 12, padding: "14px 16px", boxShadow: "var(--s-glass)" }}>
          <pre style={{ fontSize: 10, lineHeight: 1.5, color: T.text, whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0, fontFamily: "'JetBrains Mono', 'Fira Code', monospace", maxHeight: 500, overflowY: "auto" }}>
            {JSON.stringify(tokens, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// Module-specific detail renderer
function FileDetailContent({ moduleKey, file, onLoadReference }) {
  switch (moduleKey) {
    case "pricing-calculator": return <PricingDetail file={file} />;
    case "proposal-generator": return <ProposalDetail file={file} />;
    case "design-extractor":   return <DesignSystemDetail file={file} onLoadReference={onLoadReference} />;
    default: return (
      <div className="glass-surface" style={{ borderRadius: 12, padding: 14, boxShadow: "var(--s-glass)" }}>
        <pre style={{ fontSize: 10, color: T.text, whiteSpace: "pre-wrap", margin: 0 }}>{JSON.stringify(file, null, 2)}</pre>
      </div>
    );
  }
}

// ══════════════════════════════════════════════════════════
// FILE WORKSPACE — Main export
// ══════════════════════════════════════════════════════════

export default function FileWorkspace({ moduleKey, files, onCreateNew, onDuplicate, onDelete, onExport, onLoadReference }) {
  const [selectedId, setSelectedId] = useState(null);

  const selectedFile = files.find(f => f.id === selectedId);

  const handleSelect = useCallback((id) => {
    setSelectedId(prev => prev === id ? null : id);
  }, []);

  const handleExport = useCallback((file) => {
    const blob = new Blob([JSON.stringify(file, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${file.name.replace(/[^a-zA-Z0-9-_ ]/g, "").replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleDuplicate = useCallback((file) => {
    if (onDuplicate) onDuplicate(file);
  }, [onDuplicate]);

  const Icon = getModuleIcon(moduleKey);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>

      {/* ── Toolbar ─────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Icon size={14} color={T.accent} />
          <span style={{ fontSize: 12, fontWeight: 600 }}>{files.length} file{files.length !== 1 ? "s" : ""}</span>
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={onCreateNew} style={{
          display: "flex", alignItems: "center", gap: 5,
          background: "var(--gp)", border: "none", borderRadius: 7,
          padding: "6px 14px", color: "#fff", fontSize: 11, fontWeight: 600,
          cursor: "pointer", boxShadow: "var(--s-glow)"
        }}>
          <Plus size={12} /> New
        </button>
      </div>

      {/* ── Card Grid ───────────────────────────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
        gap: 12,
        overflowY: "auto",
        flex: selectedFile ? "none" : 1,
        maxHeight: selectedFile ? 220 : undefined,
      }}>
        {files.map(file => (
          <FileCard
            key={file.id}
            file={file}
            moduleKey={moduleKey}
            isSelected={selectedId === file.id}
            onClick={() => handleSelect(file.id)}
          />
        ))}
      </div>

      {/* ── Expanded Detail Panel ───────────────────────── */}
      {selectedFile && (
        <div style={{
          flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 0,
          animation: "fadeIn 0.2s ease-out",
        }}>
          {/* Detail header bar */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 14px", borderRadius: "12px 12px 0 0",
            background: T.bgCard, borderBottom: `1px solid ${T.border}`,
            position: "sticky", top: 0, zIndex: 2,
          }} className="glass-surface">
            <Icon size={14} color={T.accent} />
            <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{selectedFile.name}</span>

            {/* File actions */}
            <StatusBadge status={selectedFile.status} />

            <div style={{ display: "flex", gap: 2 }}>
              <button onClick={() => handleDuplicate(selectedFile)} title="Duplicate" style={{
                background: "none", border: "none", cursor: "pointer", padding: 5, borderRadius: 5, color: T.muted, display: "flex"
              }}>
                <Copy size={13} />
              </button>
              <button onClick={() => handleExport(selectedFile)} title="Export JSON" style={{
                background: "none", border: "none", cursor: "pointer", padding: 5, borderRadius: 5, color: T.muted, display: "flex"
              }}>
                <Download size={13} />
              </button>
              <button onClick={() => onDelete && onDelete(selectedFile.id)} title="Delete" style={{
                background: "none", border: "none", cursor: "pointer", padding: 5, borderRadius: 5, color: T.error, display: "flex"
              }}>
                <Trash2 size={13} />
              </button>
              <button onClick={() => setSelectedId(null)} title="Close" style={{
                background: "none", border: "none", cursor: "pointer", padding: 5, borderRadius: 5, color: T.muted, display: "flex"
              }}>
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Detail metadata bar */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12, padding: "8px 14px",
            background: T.badgeBg, fontSize: 10, color: T.muted, flexWrap: "wrap",
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Clock size={9} /> Created {formatDate(selectedFile.createdAt)}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Edit3 size={9} /> Updated {formatDate(selectedFile.updatedAt)}
            </span>
            {selectedFile.client && (
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <User size={9} /> {selectedFile.client}
              </span>
            )}
            {(selectedFile.tags || []).map((tag, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 3, background: T.accentBg, padding: "1px 6px", borderRadius: 3, color: T.accent }}>
                <Tag size={8} /> {tag}
              </span>
            ))}
          </div>

          {/* Detail content */}
          <div style={{ padding: "14px 0", flex: 1 }}>
            <FileDetailContent moduleKey={moduleKey} file={selectedFile} onLoadReference={onLoadReference} />
          </div>
        </div>
      )}
    </div>
  );
}
