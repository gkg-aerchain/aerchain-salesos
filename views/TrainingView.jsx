import { useState, useEffect, useCallback, useRef } from "react";
import { BookOpen, ChevronLeft, ChevronRight, Check, Award, Layers, Zap, HelpCircle, FlipHorizontal } from "lucide-react";
import { T } from "../lib/theme.js";
import { Card, Spinner } from "../components/Common.jsx";

// ═══════════════════════════════════════════════════════════════
// AERCHAIN L&D TRAINING MODULE — Live from Knowledge Base
// Fetches content from gkg-aerchain/procuretech-knowledge-hub
// ═══════════════════════════════════════════════════════════════

const KB_REPO = "gkg-aerchain/procuretech-knowledge-hub";
const KB_BRANCH = "main";
const KB_API = `https://api.github.com/repos/${KB_REPO}/contents`;

const ROLES = {
  sales: { label: "Sales & Pre-Sales", icon: "📊", color: "var(--primary)" },
  consulting: { label: "Solution Consulting", icon: "🧩", color: "var(--green)" },
  engineering: { label: "Engineering & Product", icon: "⚙️", color: "var(--amber)" },
};

// ── Curriculum: maps modules to KB files ──
const CURRICULUM = [
  {
    id: "m01", title: "What Is Procurement?", subtitle: "The Complete Foundation", time: 35, icon: "🏗️",
    weight: { sales: 5, consulting: 5, engineering: 3 },
    files: ["01-procurement-foundations/what-is-procurement.md"],
    quiz: [
      { q: "What % of a manufacturer's revenue goes to external procurement?", opts: ["10–20%", "30–40%", "50–70%", "80–90%"], a: 2 },
      { q: "How many Ariba displacement wins does Aerchain have?", opts: ["3", "5", "8", "12"], a: 2 },
      { q: "What is 'maverick spend'?", opts: ["Spend on innovation", "Off-contract purchases", "Emergency procurement", "Above-budget spend"], a: 1 },
      { q: "Which Era is Aerchain?", opts: ["Era 1 — Purchasing", "Era 2 — Strategic", "Era 3 — AI-Native", "Era 4 — Quantum"], a: 2 },
      { q: "Unilever MBS requestors?", opts: ["500", "2,000", "7,000", "15,000"], a: 2 },
    ],
    cards: [
      { t: "Addressable Spend", d: "Spend procurement can influence. HMEL: ₹3,000Cr." },
      { t: "Maverick Spend", d: "Off-contract purchases. 30–50% is maverick (industry avg)." },
      { t: "Tail Spend", d: "Low-value, high-volume: 20% of spend, 80% of transactions." },
      { t: "SUM", d: "Spend Under Management. World-class: 80%+." },
      { t: "Three-Way Match", d: "PO + GRN + invoice. Aerchain: 80–90% touchless." },
      { t: "TCO", d: "Total Cost of Ownership. Scenario Builder: 60+ constraints." },
    ],
  },
  {
    id: "m02", title: "Procurement Lifecycle", subtitle: "9 Stages & S2P vs P2P", time: 25, icon: "🔄",
    weight: { sales: 4, consulting: 5, engineering: 3 },
    files: ["01-procurement-foundations/procurement-lifecycle.md", "01-procurement-foundations/s2p-vs-p2p.md"],
    quiz: [
      { q: "Aerchain is strongest at which stages?", opts: ["1–3", "2–5", "6–9", "All"], a: 1 },
      { q: "S2P stands for?", opts: ["Spend-to-Profit", "Source-to-Pay", "Supply-to-Purchase", "Savings-to-Perf"], a: 1 },
    ],
    cards: [
      { t: "RFx", d: "Umbrella for RFI/RFP/RFQ. Knowing which to use = maturity marker." },
      { t: "S2P", d: "Source-to-Pay: full upstream-to-downstream lifecycle." },
      { t: "P2P", d: "Procure-to-Pay: transactional subset (req → PO → receipt → invoice → pay)." },
    ],
  },
  {
    id: "m03", title: "Spend Analysis Deep Dive", subtitle: "The Foundation Everything Depends On", time: 30, icon: "📈",
    weight: { sales: 5, consulting: 5, engineering: 4 },
    files: ["01-procurement-foundations/spend-analysis-deep-dive.md"],
    quiz: [
      { q: "Arvind: unique suppliers in 453,897 entries?", opts: ["4,243", "10,500", "45,000", "100,000"], a: 0 },
      { q: "AFG classification accuracy requirement?", opts: ["80%", "90%", "95%", "99%"], a: 2 },
      { q: "Knowledge Hub intelligence types?", opts: ["3", "4", "6", "10"], a: 2 },
    ],
    cards: [
      { t: "Spend Cube", d: "Multi-dimensional: supplier × category × BU × time." },
      { t: "Knowledge Hub", d: "Institutional brain: 6 intelligence types, confidence scoring, continuous learning." },
    ],
  },
  {
    id: "m04", title: "Strategic Sourcing", subtitle: "Where Aerchain's Core Value Lives", time: 25, icon: "🎯",
    weight: { sales: 5, consulting: 5, engineering: 3 },
    files: ["01-procurement-foundations/strategic-sourcing.md"],
    quiz: [
      { q: "Scenario Builder constraints?", opts: ["10+", "30+", "60+", "100+"], a: 2 },
      { q: "Cherry Picking =", opts: ["Preferred vendors", "Lowest per line item", "Random", "Newest vendor"], a: 1 },
    ],
    cards: [
      { t: "Kraljic Matrix", d: "2×2: profit impact × supply risk → 4 quadrants." },
      { t: "Reverse Auction", d: "Single buyer, sellers compete downward. Most common." },
    ],
  },
  {
    id: "m05", title: "CLM, SRM & P2P", subtitle: "Contracts, Suppliers, Transactional Backbone", time: 25, icon: "📋",
    weight: { sales: 4, consulting: 5, engineering: 3 },
    files: ["01-procurement-foundations/clm.md", "01-procurement-foundations/srm.md"],
    quiz: [
      { q: "IACCM: % of contracts underperform?", opts: ["10–15%", "20–25%", "30–35%", "50–60%"], a: 2 },
      { q: "Aerchain touchless invoice rate?", opts: ["50–60%", "70–80%", "80–90%", "95–100%"], a: 2 },
    ],
    cards: [
      { t: "Contract Leakage", d: "Value erosion from unenforced terms. 5–15% lost." },
      { t: "PSL", d: "Preferred Supplier List. On-PSL = good. Off-PSL = maverick." },
    ],
  },
  {
    id: "m06", title: "ProcureTech Landscape", subtitle: "Competitors, Waves & Positioning", time: 20, icon: "🗺️",
    weight: { sales: 5, consulting: 4, engineering: 3 },
    files: ["02-procuretech-landscape/index.md"],
    quiz: [
      { q: "Aerchain's Wave?", opts: ["Wave 1", "Wave 2", "Wave 3", "Wave 4"], a: 2 },
      { q: "Pactum's specialty?", opts: ["Spend analysis", "Autonomous negotiation", "P2P", "CLM"], a: 1 },
    ],
    cards: [
      { t: "Composable Architecture", d: "API-first modules adopted incrementally. No suite lock-in." },
      { t: "Watson Middleware", d: "Aerchain proprietary integration layer. NOT IBM Watson." },
    ],
  },
  {
    id: "m07", title: "Aerchain Product Deep Dive", subtitle: "Spend OS, AI Agents, Autonomous Negotiations", time: 40, icon: "🚀",
    weight: { sales: 5, consulting: 5, engineering: 5 },
    files: ["03-aerchain-product/index.md"],
    quiz: [
      { q: "Total funding?", opts: ["$3M", "$10M", "$13M", "$16M"], a: 3 },
      { q: "Active accounts?", opts: ["20", "30", "40", "50"], a: 2 },
      { q: "AI copilot name?", opts: ["Aera AI", "Copilot", "Aiera", "AerBot"], a: 2 },
      { q: "AI agents in platform?", opts: ["50+", "100+", "200+", "300+"], a: 3 },
      { q: "Autonomous Negotiation guardrails?", opts: ["5", "7", "8", "10"], a: 1 },
      { q: "Which agent = negotiation?", opts: ["Agent 01", "Agent 02", "Agent 03", "Agent 04"], a: 3 },
    ],
    cards: [
      { t: "Aiera", d: "AI copilot. Never 'Aera AI' (copyright). 'Copilot' = role, not name." },
      { t: "Intelligent Pathways", d: "9 auto-routed channels. Always capitalized, always plural." },
      { t: "Negotiation DNA", d: "Codified negotiation strategy per spend tier." },
      { t: "Progressive Pressure", d: "4-stage: Discovery → Benchmark → Targeted Push → Deal & Final." },
    ],
  },
  {
    id: "m08", title: "Customer Proof & ROI", subtitle: "40 Accounts, Real Numbers", time: 25, icon: "💰",
    weight: { sales: 5, consulting: 4, engineering: 2 },
    files: ["05-customer-success/index.md"],
    quiz: [
      { q: "3-year ROI on $500M?", opts: ["5x", "8x", "12.5x", "20x"], a: 2 },
      { q: "Deployment timeline?", opts: ["8 weeks", "16 weeks", "6 months", "12 months"], a: 1 },
      { q: "Unilever cycle time ↓?", opts: ["25%", "35%", "50%", "75%"], a: 2 },
    ],
    cards: [
      { t: "8–10X ROI", d: "Typical customer ROI in 18 months." },
      { t: "$45.2M / 3yr", d: "Sales Deck model on $500M spend. Payback: 8 months." },
      { t: "16 Weeks", d: "Go-live vs. 12–18 months for legacy suites." },
    ],
  },
  {
    id: "m09", title: "Competitive Positioning", subtitle: "Zycus Battlecard & Strategy", time: 25, icon: "⚔️",
    weight: { sales: 5, consulting: 4, engineering: 2 },
    files: ["04-sales-gtm/competitor-zycus.md"],
    quiz: [
      { q: "Zycus product count?", opts: ["5+", "8+", "11+", "15+"], a: 2 },
      { q: "Key positioning vs legacy?", opts: ["Cheaper", "Augment, not replace", "More features", "Better support"], a: 1 },
    ],
    cards: [
      { t: "Augment, Not Replace", d: "AI layer on top of existing ERP/S2P. Reduces political barrier." },
      { t: "ZSN", d: "Zycus free supplier network vs. Ariba's $1,495/yr + fees." },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// GitHub fetcher
// ═══════════════════════════════════════════════════════════════
async function fetchKBFile(path, token) {
  const res = await fetch(`${KB_API}/${path}?ref=${KB_BRANCH}`, {
    headers: { Authorization: `token ${token}`, Accept: "application/vnd.github.v3+json" },
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  const data = await res.json();
  return atob(data.content.replace(/\n/g, ""));
}

// ═══════════════════════════════════════════════════════════════
// Markdown → sections parser
// ═══════════════════════════════════════════════════════════════
function mdToSections(md) {
  const stripped = md.replace(/^---[\s\S]*?---\s*/, "");
  const parts = stripped.split(/^## /m).filter(Boolean);
  const sections = [];
  for (const p of parts) {
    const lines = p.split("\n");
    const title = lines[0].replace(/^#+\s*/, "").trim();
    const body = lines.slice(1).join("\n").trim();
    if (title && body) sections.push({ title, body });
  }
  if (!sections.length) {
    const title = (stripped.match(/^# (.+)/m) || ["", "Content"])[1].trim();
    const body = stripped.replace(/^# .+\n/, "").trim();
    if (body) sections.push({ title, body });
  }
  return sections;
}

function renderMd(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/^#### (.+)$/gm, `<div style="font-size:13px;font-weight:700;color:${T.text};margin:16px 0 6px">$1</div>`)
    .replace(/^### (.+)$/gm, `<div style="font-size:14px;font-weight:700;color:${T.text};margin:20px 0 8px">$1</div>`)
    .replace(/\*\*([^*]+)\*\*/g, `<strong style="color:${T.text};font-weight:700">$1</strong>`)
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/^\|(.+)\|$/gm, (m) => {
      const cells = m.split("|").filter(Boolean).map(c => c.trim());
      if (cells.every(c => /^[-:]+$/.test(c))) return "<!--sep-->";
      return "<tr>" + cells.map(c => `<td style="padding:6px 10px;border-bottom:1px solid ${T.border};font-size:12px">${c}</td>`).join("") + "</tr>";
    })
    .replace(/^&gt; (.+)$/gm, `<div style="border-left:3px solid ${T.accent};padding:6px 12px;margin:10px 0;color:${T.muted};font-style:italic;font-size:12px">$1</div>`)
    .replace(/^- (.+)$/gm, '<div style="padding-left:14px;margin:3px 0;font-size:13px">• $1</div>')
    .replace(/^(\d+)\. (.+)$/gm, `<div style="padding-left:14px;margin:3px 0;font-size:13px"><strong style="color:${T.accent}">$1.</strong> $2</div>`)
    .replace(/^---$/gm, `<hr style="border:none;border-top:1px solid ${T.border};margin:16px 0">`)
    .replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, "$2")
    .replace(/\n\n/g, '<div style="margin:10px 0"></div>')
    .replace(/\n/g, "<br>")
    .replace(/((?:<tr>.*?<\/tr>\s*(?:<!--sep-->\s*)?)+)/g, '<div style="overflow-x:auto;margin:10px 0"><table style="width:100%;border-collapse:collapse">$1</table></div>')
    .replace(/<!--sep-->/g, "");
}

// ═══════════════════════════════════════════════════════════════
// Storage keys
// ═══════════════════════════════════════════════════════════════
const SK_STATE = "aerchain-training-state";
const SK_TOKEN = "aerchain-training-kb-token";
const defaultState = () => ({ role: null, name: "", modules: {}, quizScores: {} });

// ═══════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════
function Badge({ children, color }) {
  return <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 600, background: `${color || T.accent}22`, color: color || T.accent }}>{children}</span>;
}

function ProgressBar({ value, max }) {
  return (
    <div style={{ background: T.bgCard, borderRadius: 6, height: 6, overflow: "hidden" }}>
      <div style={{ width: `${max > 0 ? (value / max) * 100 : 0}%`, height: "100%", borderRadius: 6, background: `var(--gp)`, transition: "width .5s" }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN VIEW
// ═══════════════════════════════════════════════════════════════
export default function TrainingView() {
  const [tState, setTState] = useState(null);
  const [kbToken, setKbToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState("dashboard"); // setup | welcome | dashboard | module
  const [activeModId, setActiveModId] = useState(null);

  // Load persisted state
  useEffect(() => {
    (async () => {
      try {
        // Try reading token from Vite env first (SalesOS may have it)
        let tok = import.meta.env?.VITE_GITHUB_PAT || "";
        if (!tok) {
          try { tok = localStorage.getItem(SK_TOKEN) || ""; } catch {}
        }
        let st;
        try { st = JSON.parse(localStorage.getItem(SK_STATE)); } catch {}
        setKbToken(tok);
        setTState(st || defaultState());
      } catch { setTState(defaultState()); }
      setLoading(false);
    })();
  }, []);

  const save = useCallback((s) => { setTState(s); try { localStorage.setItem(SK_STATE, JSON.stringify(s)); } catch {} }, []);
  const saveToken = useCallback((t) => { setKbToken(t); try { localStorage.setItem(SK_TOKEN, t); } catch {} }, []);

  if (loading || !tState) return <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div>;

  // Determine screen
  const effectiveScreen = !kbToken ? "setup" : !tState.role ? "welcome" : screen;

  // ── Setup: KB token ──
  if (effectiveScreen === "setup") return <SetupScreen onSave={saveToken} />;

  // ── Welcome: name + role ──
  if (effectiveScreen === "welcome") return <WelcomeScreen onStart={(name, role) => { save({ ...defaultState(), name, role }); setScreen("dashboard"); }} />;

  // ── Module view ──
  if (effectiveScreen === "module" && activeModId) {
    const mod = CURRICULUM.find(m => m.id === activeModId);
    if (mod) return <ModuleScreen mod={mod} token={kbToken} tState={tState} save={save} onBack={() => { setScreen("dashboard"); setActiveModId(null); }} />;
  }

  // ── Dashboard ──
  return <DashboardScreen tState={tState} onSelect={(id) => { setActiveModId(id); setScreen("module"); }} onReset={() => { save(defaultState()); saveToken(""); setScreen("setup"); }} />;
}

// ── SETUP ──
function SetupScreen({ onSave }) {
  const [tok, setTok] = useState("");
  const [testing, setTesting] = useState(false);
  const [err, setErr] = useState(null);
  const test = async () => {
    setTesting(true); setErr(null);
    try { await fetchKBFile("README.md", tok.trim()); onSave(tok.trim()); } catch { setErr("Connection failed. Check your PAT."); }
    setTesting(false);
  };
  return (
    <div style={{ padding: 24, maxWidth: 420, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <BookOpen size={28} color={T.accent} style={{ marginBottom: 8 }} />
        <div style={{ color: T.text, fontWeight: 700, fontSize: 16 }}>Connect Knowledge Base</div>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>Enter a GitHub PAT with access to the ProcureTech Knowledge Hub repo.</div>
      </div>
      <input value={tok} onChange={e => setTok(e.target.value)} placeholder="ghp_xxxxxxxxxxxx" type="password"
        style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bgCard, color: T.text, fontSize: 13, fontFamily: "monospace", outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
      <div style={{ color: T.mutedSoft, fontSize: 11, marginBottom: 16 }}>Stored locally. Used only to read the private repo.</div>
      {err && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px 12px", color: T.error, fontSize: 12, marginBottom: 12 }}>{err}</div>}
      <button onClick={test} disabled={!tok.trim() || testing} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "none", background: (!tok.trim() || testing) ? T.bgCard : `var(--gp)`, color: (!tok.trim() || testing) ? T.mutedSoft : "#fff", fontSize: 13, fontWeight: 600, cursor: (!tok.trim() || testing) ? "default" : "pointer" }}>
        {testing ? "Testing…" : "Connect →"}
      </button>
    </div>
  );
}

// ── WELCOME ──
function WelcomeScreen({ onStart }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState(null);
  return (
    <div style={{ padding: 24, maxWidth: 420, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <BookOpen size={28} color={T.accent} style={{ marginBottom: 8 }} />
        <div style={{ color: T.text, fontWeight: 700, fontSize: 16 }}>Training & Onboarding</div>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 4 }}>Live content from the ProcureTech Knowledge Hub.</div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: T.muted, letterSpacing: 1, marginBottom: 6 }}>NAME</div>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bgCard, color: T.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
      </div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: T.muted, letterSpacing: 1, marginBottom: 8 }}>ROLE</div>
        {Object.entries(ROLES).map(([k, v]) => (
          <button key={k} onClick={() => setRole(k)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: role === k ? `2px solid ${v.color}` : `1px solid ${T.border}`, background: role === k ? T.accentBg : "transparent", cursor: "pointer", width: "100%", marginBottom: 6, fontFamily: "inherit" }}>
            <span style={{ fontSize: 18 }}>{v.icon}</span>
            <span style={{ color: T.text, fontWeight: 600, fontSize: 13 }}>{v.label}</span>
          </button>
        ))}
      </div>
      <button onClick={() => name.trim() && role && onStart(name.trim(), role)} disabled={!name.trim() || !role}
        style={{ width: "100%", padding: "10px", borderRadius: 8, border: "none", background: (!name.trim() || !role) ? T.bgCard : `var(--gp)`, color: (!name.trim() || !role) ? T.mutedSoft : "#fff", fontSize: 13, fontWeight: 600, cursor: (!name.trim() || !role) ? "default" : "pointer" }}>
        Begin Training →
      </button>
    </div>
  );
}

// ── DASHBOARD ──
function DashboardScreen({ tState, onSelect, onReset }) {
  const role = tState.role;
  const R = ROLES[role];
  const sorted = [...CURRICULUM].sort((a, b) => (b.weight[role] || 0) - (a.weight[role] || 0));
  const completed = CURRICULUM.filter(m => tState.modules[m.id]?.done).length;
  const scores = Object.values(tState.quizScores);
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const timeLeft = CURRICULUM.filter(m => !tState.modules[m.id]?.done).reduce((a, m) => a + m.time, 0);

  return (
    <div style={{ padding: "16px 12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ color: T.text, fontWeight: 700, fontSize: 15 }}>Welcome, {tState.name}</div>
          <Badge color={R?.color}>{R?.icon} {R?.label}</Badge>
        </div>
        <button onClick={onReset} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 10px", color: T.mutedSoft, fontSize: 10, cursor: "pointer" }}>Reset</button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
        {[
          { l: "Done", v: `${completed}/${CURRICULUM.length}` },
          { l: "Quiz Avg", v: `${avg}%` },
          { l: "Left", v: `${timeLeft}m` },
        ].map((s, i) => (
          <Card key={i} style={{ padding: "10px 12px", textAlign: "center" }}>
            <div style={{ color: T.mutedSoft, fontSize: 9, fontWeight: 600, letterSpacing: 0.5 }}>{s.l}</div>
            <div style={{ color: T.text, fontSize: 18, fontWeight: 800, marginTop: 2 }}>{s.v}</div>
          </Card>
        ))}
      </div>
      <ProgressBar value={completed} max={CURRICULUM.length} />

      {/* Module list */}
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
        {sorted.map(m => {
          const done = tState.modules[m.id]?.done;
          const sc = tState.quizScores[m.id];
          const rel = m.weight[role] || 3;
          return (
            <button key={m.id} onClick={() => onSelect(m.id)} className="glass-surface" style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 12, border: done ? `1px solid ${T.borderAcc}` : `1px solid ${T.border}`, background: done ? T.accentBg : "transparent", cursor: "pointer", width: "100%", fontFamily: "inherit", textAlign: "left" }}>
              <span style={{ fontSize: 20, width: 30, textAlign: "center" }}>{done ? "✅" : m.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: T.text, fontWeight: 600, fontSize: 13 }}>{m.title}</div>
                <div style={{ color: T.muted, fontSize: 11, marginTop: 1 }}>{m.subtitle}</div>
                <div style={{ marginTop: 4, display: "flex", gap: 4, flexWrap: "wrap" }}>
                  <Badge color={T.mutedSoft}>{m.time}m</Badge>
                  {rel >= 5 && <Badge color={R?.color}>Key</Badge>}
                  {sc != null && <Badge color={sc >= 80 ? T.success : T.warn}>{sc}%</Badge>}
                  <Badge color={T.mutedSoft}>{m.files.length} file{m.files.length > 1 ? "s" : ""}</Badge>
                </div>
              </div>
              <ChevronRight size={14} color={T.mutedSoft} />
            </button>
          );
        })}
      </div>

      {/* Certificate */}
      {completed === CURRICULUM.length && (
        <Card style={{ marginTop: 16, textAlign: "center", padding: 20, border: `1px solid ${T.borderAcc}`, background: T.accentBg }}>
          <Award size={28} color={T.accent} style={{ marginBottom: 6 }} />
          <div style={{ color: T.text, fontWeight: 700, fontSize: 14 }}>Training Complete!</div>
          <div style={{ color: T.muted, fontSize: 12, marginTop: 4 }}>{tState.name} — Aerchain Certified ({R?.label})</div>
          <div style={{ color: T.accent, fontSize: 11, marginTop: 2 }}>Average: {avg}%</div>
        </Card>
      )}
    </div>
  );
}

// ── MODULE SCREEN — Lesson / Quiz / Flashcards ──
function ModuleScreen({ mod, token, tState, save, onBack }) {
  const [sections, setSections] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [fetchErr, setFetchErr] = useState(null);
  const [secIdx, setSecIdx] = useState(0);
  const [mode, setMode] = useState("lesson"); // lesson | quiz | cards
  const [qIdx, setQIdx] = useState(0);
  const [qAns, setQAns] = useState({});
  const [qDone, setQDone] = useState(false);
  const [fcIdx, setFcIdx] = useState(0);
  const [fcFlip, setFcFlip] = useState(false);

  useEffect(() => {
    let cancel = false;
    setFetching(true); setFetchErr(null); setSections(null); setSecIdx(0); setMode("lesson"); setQIdx(0); setQAns({}); setQDone(false);
    (async () => {
      try {
        const all = [];
        for (const f of mod.files) {
          const md = await fetchKBFile(f, token);
          all.push(...mdToSections(md));
        }
        if (!cancel) setSections(all);
      } catch (e) { if (!cancel) setFetchErr(e.message); }
      if (!cancel) setFetching(false);
    })();
    return () => { cancel = true; };
  }, [mod.id]);

  useEffect(() => { window.scrollTo?.(0, 0); }, [secIdx, mode, qIdx, fcIdx]);

  const header = (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: T.accent, display: "flex" }}><ChevronLeft size={16} /></button>
      <span style={{ fontSize: 20 }}>{mod.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ color: T.text, fontWeight: 700, fontSize: 14 }}>{mod.title}</div>
        <div style={{ color: T.muted, fontSize: 11 }}>{mod.subtitle}</div>
      </div>
    </div>
  );

  if (fetching) return <div style={{ padding: "16px 12px" }}>{header}<div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /><span style={{ color: T.muted, fontSize: 12, marginLeft: 8 }}>Loading from knowledge base...</span></div></div>;
  if (fetchErr) return <div style={{ padding: "16px 12px" }}>{header}<Card><div style={{ color: T.error, fontSize: 13 }}>Failed: {fetchErr}</div></Card></div>;

  // ── QUIZ ──
  if (mode === "quiz") {
    const qs = mod.quiz;
    if (qDone) {
      const correct = qs.filter((q, i) => qAns[i] === q.a).length;
      const score = Math.round(correct / qs.length * 100);
      return (
        <div style={{ padding: "16px 12px" }}>
          {header}
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>{score >= 80 ? "🎉" : score >= 60 ? "👍" : "📚"}</div>
            <div style={{ color: T.text, fontWeight: 800, fontSize: 22 }}>Quiz: {score}%</div>
            <div style={{ color: T.muted, fontSize: 12, marginTop: 4 }}>{correct}/{qs.length} correct</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
            {qs.map((q, i) => {
              const ok = qAns[i] === q.a;
              return (
                <Card key={i} style={{ padding: "10px 12px", border: `1px solid ${ok ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}` }}>
                  <div style={{ color: T.muted, fontSize: 12 }}>{q.q}</div>
                  <div style={{ fontSize: 11, marginTop: 4, color: ok ? T.success : T.error }}>
                    {ok ? "✓ Correct" : `✗ ${q.opts[qAns[i]]} → ${q.opts[q.a]}`}
                  </div>
                </Card>
              );
            })}
          </div>
          <button onClick={onBack} style={{ marginTop: 16, width: "100%", padding: 10, borderRadius: 8, border: "none", background: `var(--gp)`, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Back to Dashboard</button>
        </div>
      );
    }
    const q = qs[qIdx];
    return (
      <div style={{ padding: "16px 12px" }}>
        {header}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ color: T.muted, fontSize: 11, fontWeight: 600 }}>Question {qIdx + 1} / {qs.length}</div>
          <Badge>{Math.round((qIdx + 1) / qs.length * 100)}%</Badge>
        </div>
        <ProgressBar value={qIdx + 1} max={qs.length} />
        <Card style={{ marginTop: 12, padding: "16px 14px" }}>
          <div style={{ color: T.text, fontSize: 14, fontWeight: 600, lineHeight: 1.5, marginBottom: 12 }}>{q.q}</div>
          {q.opts.map((o, oi) => (
            <button key={oi} onClick={() => setQAns({ ...qAns, [qIdx]: oi })} className="glass-surface"
              style={{ display: "block", width: "100%", padding: "10px 12px", borderRadius: 8, border: qAns[qIdx] === oi ? `2px solid ${T.accent}` : `1px solid ${T.border}`, background: qAns[qIdx] === oi ? T.accentBg : "transparent", color: T.text, fontSize: 13, fontFamily: "inherit", cursor: "pointer", marginBottom: 6, textAlign: "left" }}>
              <span style={{ fontWeight: 700, color: T.accent, marginRight: 8 }}>{String.fromCharCode(65 + oi)}.</span>{o}
            </button>
          ))}
        </Card>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          {qIdx > 0 && <button onClick={() => setQIdx(qIdx - 1)} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>← Back</button>}
          {qIdx < qs.length - 1 && <button onClick={() => qAns[qIdx] != null && setQIdx(qIdx + 1)} disabled={qAns[qIdx] == null} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: qAns[qIdx] != null ? `var(--gp)` : T.bgCard, color: qAns[qIdx] != null ? "#fff" : T.mutedSoft, fontSize: 12, fontWeight: 600, cursor: qAns[qIdx] != null ? "pointer" : "default" }}>Next →</button>}
          {qIdx === qs.length - 1 && <button onClick={() => {
            const correct = qs.filter((q, i) => qAns[i] === q.a).length;
            const score = Math.round(correct / qs.length * 100);
            save({ ...tState, quizScores: { ...tState.quizScores, [mod.id]: score }, modules: { ...tState.modules, [mod.id]: { done: true } } });
            setQDone(true);
          }} disabled={Object.keys(qAns).length < qs.length} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: Object.keys(qAns).length >= qs.length ? T.success : T.bgCard, color: Object.keys(qAns).length >= qs.length ? "#fff" : T.mutedSoft, fontSize: 12, fontWeight: 600, cursor: Object.keys(qAns).length >= qs.length ? "pointer" : "default" }}>Submit ✓</button>}
        </div>
      </div>
    );
  }

  // ── FLASHCARDS ──
  if (mode === "cards") {
    const fc = mod.cards || [];
    if (!fc.length) return <div style={{ padding: "16px 12px" }}>{header}<Card><div style={{ color: T.muted, fontSize: 12 }}>No flashcards for this module.</div></Card></div>;
    const c = fc[fcIdx];
    return (
      <div style={{ padding: "16px 12px" }}>
        {header}
        <div style={{ textAlign: "center" }}>
          <div style={{ color: T.muted, fontSize: 11, marginBottom: 12 }}>Flashcard {fcIdx + 1} / {fc.length}</div>
          <div onClick={() => setFcFlip(!fcFlip)} className="glass-surface"
            style={{ borderRadius: 16, padding: "36px 24px", border: `1px solid ${fcFlip ? T.borderAcc : T.border}`, background: fcFlip ? T.accentBg : "transparent", cursor: "pointer", minHeight: 140, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .3s" }}>
            <div>
              <div style={{ fontSize: 10, color: T.accent, fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>{fcFlip ? "DEFINITION" : "TERM"}</div>
              <div style={{ color: T.text, fontSize: fcFlip ? 13 : 18, fontWeight: fcFlip ? 400 : 800, lineHeight: 1.5 }}>{fcFlip ? c.d : c.t}</div>
              {!fcFlip && <div style={{ color: T.mutedSoft, fontSize: 11, marginTop: 10 }}>Tap to reveal</div>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "center" }}>
            <button disabled={fcIdx === 0} onClick={() => { setFcIdx(fcIdx - 1); setFcFlip(false); }} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: fcIdx === 0 ? T.mutedSoft : T.muted, fontSize: 12, cursor: fcIdx === 0 ? "default" : "pointer", fontFamily: "inherit", opacity: fcIdx === 0 ? 0.4 : 1 }}>← Prev</button>
            <button disabled={fcIdx === fc.length - 1} onClick={() => { setFcIdx(fcIdx + 1); setFcFlip(false); }} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: fcIdx === fc.length - 1 ? T.bgCard : `var(--gp)`, color: fcIdx === fc.length - 1 ? T.mutedSoft : "#fff", fontSize: 12, fontWeight: 600, cursor: fcIdx === fc.length - 1 ? "default" : "pointer", fontFamily: "inherit", opacity: fcIdx === fc.length - 1 ? 0.4 : 1 }}>Next →</button>
          </div>
          <button onClick={() => setMode("lesson")} style={{ marginTop: 14, background: "none", border: "none", color: T.accent, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>← Back to lesson</button>
        </div>
      </div>
    );
  }

  // ── LESSON ──
  const sec = sections[secIdx];
  const atEnd = secIdx >= sections.length - 1;
  return (
    <div style={{ padding: "16px 12px" }}>
      {header}
      <ProgressBar value={secIdx + 1} max={sections.length} />
      <div style={{ color: T.mutedSoft, fontSize: 11, margin: "6px 0 8px" }}>Section {secIdx + 1} / {sections.length}</div>
      {/* Section nav pills */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
        {sections.map((_, i) => (
          <button key={i} onClick={() => setSecIdx(i)} style={{ width: 24, height: 24, borderRadius: 6, border: i === secIdx ? `1px solid ${T.accent}` : `1px solid ${T.border}`, background: i === secIdx ? T.accentBg : "transparent", color: i === secIdx ? T.accent : T.mutedSoft, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</button>
        ))}
      </div>
      {/* Content */}
      <Card style={{ padding: "16px 14px" }}>
        <div style={{ color: T.text, fontWeight: 700, fontSize: 15, marginBottom: 10 }}>{sec?.title}</div>
        <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: renderMd(sec?.body || "") }} />
      </Card>
      {/* Nav */}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        {secIdx > 0 && <button onClick={() => setSecIdx(secIdx - 1)} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>← Prev</button>}
        {!atEnd && <button onClick={() => setSecIdx(secIdx + 1)} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: `var(--gp)`, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Next Section →</button>}
        {atEnd && (
          <>
            <button onClick={() => { setQIdx(0); setQAns({}); setQDone(false); setMode("quiz"); }} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: `var(--gp)`, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <HelpCircle size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />Quiz
            </button>
            {mod.cards?.length > 0 && (
              <button onClick={() => { setFcIdx(0); setFcFlip(false); setMode("cards"); }} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.borderAcc}`, background: "transparent", color: T.accent, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                <Layers size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />Cards
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
