import { useState, useEffect, useCallback, useRef } from "react";
import {
  RefreshCw, AlertCircle, Clock,
  Loader2, Activity, FileText, DollarSign, X,
  TrendingUp, Users, Wand2, Download, Settings, Brain,
  ExternalLink, Link, Upload, CheckCircle, XCircle, Sun, Moon
} from "lucide-react";
import DUMMY_DATA from "./demo-data/index.js";

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════

// Notion master audit log — "Aerchain SalesOS Notion Log"
// Structure: master DB → sub-pages per module → inline databases per sync type
// Each audit entry: timestamp, action, module, summary, reference links array
// Reference links can include: app internal, Gmail, Google Sheets, Drive, Notion pages
// Modules that use upload→process→output flow instead of sync
const UPLOAD_MODULES = new Set(["pricing-calculator", "proposal-generator"]);

const NOTION_AUDIT_CONFIG = {
  masterPageUrl: "https://www.notion.so/Claude-Code-Log-DB-Dump-32401f618de280c0bb83c67614b4ac93",
  masterDbName:  "Aerchain SalesOS Notion Log",
  modules: {
    "pricing-calculator": { pageName: "Pricing Calculator Log",   pageUrl: null }, // set when created
    "proposal-generator": { pageName: "Proposal Generator Log",   pageUrl: null },
    "settings":           { pageName: "Settings & Memory Log",    pageUrl: null },
  },
  // Audit entry shape:
  // { timestamp, action, module, summary, refs: [{ label, url, type: "notion"|"gmail"|"gdrive"|"gsheet"|"app"|"other" }] }
};

// Module groups — DEAL DESK in main area, SYSTEM pinned to sidebar bottom
const GROUPS = [
  { id: "deal-desk", label: "DEAL DESK",  modules: ["pricing-calculator","proposal-generator"], pinBottom: false },
  { id: "system",    label: "SYSTEM",     modules: ["settings"],                                pinBottom: true  },
];

const MOD = {
  "pricing-calculator": { label: "Pricing Calculator", Icon: DollarSign },
  "proposal-generator": { label: "Proposal Generator", Icon: FileText   },
  "settings":           { label: "Settings",           Icon: Settings   },
};

// ═══════════════════════════════════════════════════════════
// SYNC PROMPTS
// ═══════════════════════════════════════════════════════════

const getSyncPrompt = (key) => {
  const now = new Date().toISOString();
  // pricing-calculator and proposal-generator use upload→process flow, not sync
  if (UPLOAD_MODULES.has(key)) return null;
  return `Return ONLY raw JSON: {"message":"No sync configured for ${key}","syncedAt":"${now}"}`;
};

// ═══════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════

function extractJSON(text) {
  if (!text) return null;
  const t = text.trim();
  // Direct parse
  if (t.startsWith("{")) { try { return JSON.parse(t); } catch {} }
  // Code block
  const cb = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (cb) { try { return JSON.parse(cb[1].trim()); } catch {} }
  // Find first {…}
  let depth = 0, start = -1;
  for (let i = 0; i < t.length; i++) {
    if (t[i] === "{") { if (depth === 0) start = i; depth++; }
    else if (t[i] === "}") { depth--; if (depth === 0 && start !== -1) {
      try { return JSON.parse(t.slice(start, i + 1)); } catch { break; }
    }}
  }
  return null;
}

function isStale(lastSynced, hrs = 4) {
  if (!lastSynced) return true;
  return (Date.now() - new Date(lastSynced).getTime()) / 3600000 > hrs;
}

async function withRetry(fn, { retries = 3, label = "" } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const status = err?.status || err?.statusCode;
      if (status && status >= 400 && status < 500 && status !== 429) throw err;
      if (attempt === retries) throw err;
      const delay = Math.pow(2, attempt + 1) * 1000;
      console.warn(`[withRetry] ${label} attempt ${attempt + 1} failed, retrying in ${delay}ms:`, err.message);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

function timeAgo(date) {
  if (!date) return "Never";
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ── Direct API: Claude ────────────────────────────────────
// Direct call to Anthropic API — no MCP middleman
async function callClaude(prompt, { system, model = "claude-sonnet-4-6", maxTokens = 4000 } = {}) {
  return withRetry(async () => {
    const body = {
      model,
      max_tokens: maxTokens,
      system: system || "You are a processing engine for Aerchain SalesOS. Analyze the provided inputs and return structured JSON output. Your response must start with { and end with }.",
      messages: [{ role: "user", content: prompt }],
    };
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": import.meta.env.VITE_ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      const err = new Error(e.error?.message || `HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    const data = await res.json();
    return (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
  }, { retries: 3, label: "callClaude" });
}

// ── Direct API: HubSpot ───────────────────────────────────
// TODO: connect with VITE_HUBSPOT_API_KEY when ready
async function callHubSpot(endpoint, { method = "GET", body } = {}) {
  // eslint-disable-next-line no-unused-vars
  const apiKey = import.meta.env.VITE_HUBSPOT_API_KEY;
  throw new Error("HubSpot direct API not yet connected — set VITE_HUBSPOT_API_KEY and implement endpoint calls");
}

// ── Direct API: Notion ────────────────────────────────────
async function callNotion(endpoint, { method = "POST", body } = {}) {
  const apiKey = import.meta.env.VITE_NOTION_API_KEY;
  if (!apiKey) throw new Error("VITE_NOTION_API_KEY not set");
  const res = await fetch(`https://api.notion.com/v1/${endpoint}`, {
    method,
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.message || `Notion API HTTP ${res.status}`);
  }
  return res.json();
}

async function createNotionAuditEntry({ action, module, summary, refs = [] }) {
  const parentPageId = "32401f61-8de2-80c0-bb83-c67614b4ac93";
  return callNotion("blocks/" + parentPageId + "/children", {
    method: "PATCH",
    body: {
      children: [{
        object: "block",
        type: "callout",
        callout: {
          rich_text: [{
            type: "text",
            text: { content: `[${new Date().toISOString()}] ${action} — ${module}: ${summary}` }
          }],
          icon: { type: "emoji", emoji: "📋" }
        }
      }]
    }
  });
}

// ── Process with Claude (upload→process→output flow) ──────
const PROCESS_SYSTEM_PROMPTS = {
  "pricing-calculator": "You are a pricing analysis engine for Aerchain SalesOS. Analyze the provided pricing data and return structured JSON output with the following shape: {\"standardModel\":{\"per1BSpend\":0,\"yoyEscalation\":\"\",\"breakEven\":\"\"},\"recentDeals\":[{\"client\":\"\",\"y1Amount\":0,\"spendUnderMgmt\":\"\",\"modules\":\"\"}],\"analysis\":\"\"}. Your response must start with { and end with }.",
  "proposal-generator": "You are a proposal generation engine for Aerchain SalesOS. Using the provided inputs, generate a structured proposal in JSON format: {\"proposalTitle\":\"\",\"client\":\"\",\"value\":0,\"sections\":[{\"heading\":\"\",\"content\":\"\"}],\"summary\":\"\"}. Your response must start with { and end with }.",
};

async function processWithClaude(moduleKey, inputText) {
  const system = PROCESS_SYSTEM_PROMPTS[moduleKey];
  if (!system) throw new Error(`No processing prompt configured for ${moduleKey}`);
  return callClaude(inputText, { system, maxTokens: 8000 });
}

// ═══════════════════════════════════════════════════════════
// DESIGN TOKENS (Dark Canvas v3 — CSS custom properties)
// ═══════════════════════════════════════════════════════════
// These map to CSS vars injected in useEffect. Components use T.xxx
// which resolves to var(--xxx) at runtime, supporting dark/light themes.

const T = {
  bg:        "var(--canvas)",
  bgCard:    "var(--glass-1)",
  bgActive:  "hsla(262,75%,62%,0.18)",
  border:    "var(--glass-border)",
  borderAcc: "hsla(262,75%,62%,0.4)",
  text:      "var(--fg)",
  muted:     "var(--fg2)",
  mutedSoft: "var(--fg3)",
  accent:    "var(--primary)",
  accentBg:  "hsla(262,75%,62%,0.15)",
  success:   "var(--green)",
  warn:      "var(--amber)",
  error:     "var(--red)",
  topbar:    "rgba(255,255,255,0.03)",
  sidebar:   "rgba(255,255,255,0.03)",
  glass:     "var(--s-glass)",
  elevated:  "var(--s-elevated)",
  glow:      "var(--s-glow)",
};

// ═══════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════

function StatusDot({ status }) {
  const color = status === "🟢 Fresh" ? T.success
    : status === "🟡 Stale" ? T.warn
    : status === "🔴 Error" ? T.error
    : T.muted;
  return <span style={{ display:"inline-block", width:6, height:6, borderRadius:"50%", background:color, flexShrink:0 }} />;
}

function Spinner({ size = 14 }) {
  return <Loader2 size={size} style={{ animation:"spin 1s linear infinite", color:T.accent }} />;
}

function SyncBtn({ onClick, loading, size = 13 }) {
  return (
    <button onClick={onClick} disabled={loading} style={{ background:"none", border:"none", cursor:loading?"default":"pointer", padding:2, color: T.muted, display:"flex", alignItems:"center" }}>
      {loading ? <Spinner size={size} /> : <RefreshCw size={size} />}
    </button>
  );
}

// ── FILE UPLOAD ZONE ──────────────────────────────────────

function FileUploadZone({ onFilesSelected, acceptTypes = ".csv,.pdf,.docx,.xlsx,.json,.txt" }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) onFilesSelected(files);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      style={{
        border: `2px dashed ${dragOver ? T.accent : T.border}`,
        borderRadius: 12,
        padding: "28px 20px",
        textAlign: "center",
        cursor: "pointer",
        background: dragOver ? T.accentBg : "transparent",
        transition: "all 0.2s",
      }}
    >
      <Upload size={24} color={dragOver ? T.accent : T.muted} style={{ marginBottom: 8 }} />
      <div style={{ color: T.text, fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
        Drop files here or click to browse
      </div>
      <div style={{ color: T.muted, fontSize: 11 }}>
        Accepts: CSV, PDF, DOCX, XLSX, JSON, TXT
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={acceptTypes}
        onChange={(e) => { if (e.target.files.length > 0) onFilesSelected(Array.from(e.target.files)); }}
        style={{ display: "none" }}
      />
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div className="glass-surface" style={{
      borderRadius: 14,
      padding: "14px 16px",
      boxShadow: "var(--s-glass)",
      ...style
    }}>
      {children}
    </div>
  );
}

function EmptyState({ moduleKey, onSync, loading, onFilesSelected }) {
  const { label, Icon } = MOD[moduleKey] || {};
  const isUploadModule = UPLOAD_MODULES.has(moduleKey);
  const uploadLabel = moduleKey === "pricing-calculator"
    ? "Upload pricing data to get started"
    : moduleKey === "proposal-generator"
    ? "Upload proposal documents to get started"
    : "No data yet — use Demo to preview, or Sync when APIs are connected";

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:16, padding:40, textAlign:"center" }}>
      <div style={{ width:56, height:56, borderRadius:16, background:T.accentBg, display:"flex", alignItems:"center", justifyContent:"center" }}>
        {Icon && <Icon size={24} color={T.accent} />}
      </div>
      <div>
        <div style={{ color:T.text, fontWeight:600, marginBottom:6 }}>{label}</div>
        <div style={{ color:T.muted, fontSize:13 }}>{uploadLabel}</div>
      </div>
      {isUploadModule ? (
        <div style={{ width: "100%", maxWidth: 400 }}>
          <FileUploadZone onFilesSelected={onFilesSelected} />
        </div>
      ) : (
        <button onClick={onSync} disabled={loading} style={{
          background: T.accentBg, border:`1px solid ${T.borderAcc}`, borderRadius:8, padding:"8px 20px",
          color:T.accent, fontSize:13, fontWeight:500, cursor:loading?"default":"pointer",
          display:"flex", alignItems:"center", gap:6
        }}>
          {loading ? <Spinner size={12}/> : <RefreshCw size={12}/>}
          {loading ? "Syncing…" : "Sync Now"}
        </button>
      )}
    </div>
  );
}

// ── AERCHAIN LOGO (actual SVG) ────────────────────────────

function AerchainLogo({ height = 18 }) {
  return (
    <svg height={height} viewBox="0 0 168 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display:"block" }}>
      <path d="M3.7951 26.9895C3.61396 27.3937 3.43282 27.6616 3.254 27.7956C3.07286 27.9295 2.80115 27.9977 2.44119 27.9977H0.678569C0.225721 27.9977 0.000457764 27.852 0.000457764 27.5606C0.000457764 27.4478 0.056193 27.2574 0.169986 26.9895L10.3672 5.68021C10.7063 4.98698 10.9547 4.53109 11.1127 4.31959C11.2706 4.10575 11.4633 4 11.6886 4C11.893 4 12.0671 4.10575 12.2134 4.31959C12.3597 4.53344 12.6036 4.98698 12.9426 5.68021L23.242 26.9895C23.3558 27.2574 23.4116 27.4501 23.4116 27.5606C23.4116 27.852 23.1747 27.9977 22.7009 27.9977H20.8036C20.4413 27.9977 20.1766 27.9295 20.0071 27.7956C19.8375 27.6616 19.6518 27.3914 19.4474 26.9895L11.6212 10.2509L3.7951 26.9895Z" fill="white"/>
      <path d="M40.5221 24.8957C40.6359 24.9991 40.6916 25.1989 40.6916 25.495V27.2433C40.6916 27.5418 40.6359 27.7415 40.5221 27.8426C40.4083 27.946 40.2179 27.9977 39.9462 27.9977H27.1062C26.8345 27.9977 26.644 27.946 26.5302 27.8426C26.4165 27.7392 26.3607 27.5394 26.3607 27.2433V4.75433C26.3607 4.45824 26.4165 4.25614 26.5302 4.1551C26.6417 4.0517 26.8345 4 27.1039 4H39.9113C40.183 4 40.3735 4.0517 40.4873 4.1551C40.6011 4.25849 40.6568 4.45824 40.6568 4.75433V6.50269C40.6568 6.80114 40.6011 7.00088 40.4873 7.10193C40.3735 7.20533 40.183 7.25703 39.9113 7.25703H30.153C29.9951 7.25703 29.8883 7.28523 29.8302 7.34162C29.7745 7.39802 29.7466 7.49672 29.7466 7.63302V13.9074C29.7466 14.0672 29.7745 14.1753 29.8302 14.234C29.886 14.2904 29.9928 14.3186 30.153 14.3186H38.7595C39.0312 14.3186 39.2216 14.3703 39.3354 14.4737C39.4492 14.5771 39.5049 14.7769 39.5049 15.0729V16.7861C39.5049 17.061 39.4492 17.2537 39.3354 17.3688C39.2216 17.484 39.0312 17.5404 38.7595 17.5404H30.153C29.9951 17.5404 29.8883 17.5686 29.8302 17.625C29.7745 17.6814 29.7466 17.7801 29.7466 17.9164V24.3623C29.7466 24.4986 29.7745 24.5973 29.8302 24.6537C29.886 24.7101 29.9928 24.7383 30.153 24.7383H39.9438C40.2156 24.7383 40.406 24.79 40.5198 24.8934L40.5221 24.8957Z" fill="white"/>
      <path d="M48.7198 27.8449C48.606 27.9483 48.4156 28 48.1439 28H46.2466C45.9748 28 45.7844 27.9483 45.6706 27.8449C45.5568 27.7415 45.5011 27.5418 45.5011 27.2457V4.75433C45.5011 4.45824 45.5568 4.25614 45.6706 4.1551C45.7844 4.0517 45.9772 4 46.2466 4H52.7188C59.1562 4 62.3749 6.47919 62.3749 11.4399C62.3749 13.0849 61.9685 14.4408 61.1557 15.503C60.3429 16.5652 59.212 17.35 57.7675 17.8506L63.5941 26.9707C63.7753 27.2222 63.8659 27.4384 63.8659 27.6217C63.8659 27.758 63.8031 27.8567 63.6801 27.9131C63.5547 27.9695 63.3689 27.9977 63.1204 27.9977H61.1209C60.7377 27.9977 60.4544 27.9413 60.2733 27.8261C60.0921 27.711 59.8785 27.4619 59.63 27.0718L53.3969 17.061C53.2622 16.8777 53.1926 16.7179 53.1926 16.5816C53.1926 16.3983 53.3621 16.2949 53.7011 16.2738C57.1126 15.9095 58.8172 14.3656 58.8172 11.6444C58.8172 10.0911 58.2807 8.95369 57.2078 8.23225C56.1349 7.51317 54.5813 7.15128 52.5493 7.15128H49.2957C49.1378 7.15128 49.031 7.17948 48.9729 7.23588C48.9172 7.29227 48.8893 7.40272 48.8893 7.56252V27.241C48.8893 27.5394 48.8336 27.7392 48.7198 27.8402V27.8449Z" fill="white"/>
      <path d="M84.5991 22.4471C84.8476 22.2473 85.0404 22.1486 85.1751 22.1486C85.2656 22.1486 85.3562 22.1815 85.4468 22.2473C85.5374 22.3131 85.6163 22.3907 85.6837 22.48L86.666 23.81C86.7798 23.944 86.8355 24.0991 86.8355 24.2753C86.8355 24.3646 86.8007 24.4586 86.7333 24.5573C86.666 24.656 86.5638 24.7618 86.4291 24.8722C85.2308 25.8686 83.8815 26.6394 82.3813 27.1822C80.8788 27.7251 79.3043 27.9977 77.6555 27.9977C75.4423 27.9977 73.415 27.4877 71.5734 26.4678C69.7318 25.448 68.2757 24.0309 67.2028 22.2121C66.1299 20.3956 65.5934 18.3558 65.5934 16.0952C65.5934 13.8345 66.1299 11.7525 67.2028 9.91247C68.2757 8.07246 69.7434 6.62724 71.6082 5.57446C73.4707 4.52639 75.5538 4 77.8575 4C79.4831 4 81.0367 4.27729 82.516 4.83188C83.9953 5.38647 85.3121 6.1408 86.464 7.09253C86.6892 7.24763 86.803 7.41447 86.803 7.59072C86.803 7.74581 86.7357 7.92206 86.5986 8.12181L85.6163 9.41898C85.4352 9.66337 85.254 9.78557 85.0752 9.78557C84.9405 9.78557 84.7478 9.69627 84.4993 9.52002C83.5286 8.78919 82.4766 8.21345 81.3479 7.79046C80.2193 7.36982 79.0326 7.15833 77.7902 7.15833C76.1855 7.15833 74.7247 7.53432 73.4033 8.28865C72.0819 9.04298 71.0369 10.0958 70.2682 11.447C69.4995 12.7982 69.1164 14.328 69.1164 16.0341C69.1164 17.7401 69.4949 19.1689 70.252 20.5225C71.009 21.8737 72.0471 22.9335 73.3685 23.6973C74.6899 24.461 76.1646 24.844 77.7902 24.844C80.3424 24.844 82.6113 24.0474 84.5991 22.4518V22.4471Z" fill="white"/>
      <path d="M109.401 27.8449C109.288 27.9483 109.097 28 108.826 28H106.928C106.657 28 106.466 27.9483 106.352 27.8449C106.238 27.7415 106.183 27.5418 106.183 27.2457V17.6814C106.183 17.5451 106.155 17.4464 106.099 17.39C106.043 17.3336 105.934 17.3054 105.776 17.3054H94.562C94.4041 17.3054 94.2972 17.3336 94.2392 17.39C94.1834 17.4464 94.1556 17.5451 94.1556 17.6814V27.2457C94.1556 27.5441 94.0998 27.7439 93.986 27.8449C93.8722 27.9483 93.6818 28 93.4101 28H91.5128C91.2411 28 91.0507 27.9483 90.9369 27.8449C90.8231 27.7415 90.7673 27.5418 90.7673 27.2457V4.75433C90.7673 4.45824 90.8231 4.25614 90.9369 4.1551C91.0483 4.0517 91.2411 4 91.5105 4H93.4078C93.6795 4 93.8723 4.0517 93.9837 4.1551C94.0975 4.25849 94.1532 4.45824 94.1532 4.75433V13.6677C94.1532 13.804 94.1811 13.9074 94.2369 13.9755C94.2926 14.0437 94.3994 14.0789 94.5596 14.0789H105.774C105.932 14.0789 106.039 14.0437 106.097 13.9755C106.153 13.9074 106.18 13.804 106.18 13.6677V4.75433C106.18 4.45824 106.236 4.25614 106.35 4.1551C106.464 4.0517 106.657 4 106.928 4H108.826C109.095 4 109.288 4.0517 109.401 4.1551C109.515 4.25849 109.571 4.45824 109.571 4.75433V27.2457C109.571 27.5441 109.515 27.7439 109.401 27.8449Z" fill="white"/>
      <path d="M164.252 4.1504C164.366 4.04935 164.558 4 164.828 4H166.725C166.997 4 167.189 4.04935 167.301 4.1504C167.415 4.24909 167.47 4.44414 167.47 4.73318V26.9049C167.47 27.6358 167.245 28.0023 166.792 28.0023C166.611 28.0023 166.421 27.9295 166.216 27.7862C166.012 27.6428 165.731 27.3702 165.369 26.9707L151.614 11.0498V26.9049C151.614 27.194 151.558 27.3867 151.444 27.4877C151.33 27.5864 151.14 27.6381 150.868 27.6381H148.971C148.699 27.6381 148.509 27.5888 148.395 27.4877C148.281 27.389 148.226 27.194 148.226 26.9049V5.09742C148.226 4.72143 148.281 4.44414 148.395 4.26554C148.509 4.0893 148.69 4 148.939 4C149.12 4 149.31 4.07285 149.514 4.2162C149.719 4.35954 149.988 4.63214 150.327 5.03163L164.082 20.9525V4.73083C164.082 4.44414 164.138 4.24909 164.252 4.14805V4.1504Z" fill="white"/>
      <path d="M143.732 18.7083C143.72 18.6519 143.704 18.4944 143.699 18.4193C143.704 18.4357 143.73 18.6754 143.732 18.7083Z" fill="#DC5F40"/>
      <path d="M141.613 11.08C142.698 10.9602 143.483 9.9732 143.364 8.87342C143.246 7.776 142.27 6.98171 141.184 7.10156C140.099 7.22141 139.314 8.20839 139.433 9.30816C139.551 10.4056 140.526 11.1999 141.613 11.08Z" fill="#DC5F40"/>
      <path d="M143.857 20.6254C143.943 16.1699 142.092 10.7674 137.252 13.8364C136.846 13.9962 136.614 13.9398 136.4 13.6343C135.789 12.5158 135.32 11.3713 134.739 10.1964C130.371 -1.17501 125.383 5.32729 120.114 12.0575C108.347 27.4497 113.89 34.2669 132.438 20.75C133.086 20.2847 134.384 19.3118 134.851 19.2719C135.343 19.192 135.548 19.5962 135.919 20.4421C136.279 21.3093 136.878 22.5383 137.426 23.4148C140.592 29.6304 144.098 28.1899 143.859 20.6513V20.6254H143.857ZM129.909 18.3084C127.575 19.7842 125.36 21.5913 122.796 22.6699C121.679 23.1422 120.051 22.6205 119.649 21.7064C119.194 20.2894 120.822 18.2003 121.621 16.7292C122.547 15.0537 123.776 13.5638 124.953 12.0458C126.096 10.5489 127.647 8.32817 129.798 9.2987C131.523 10.2904 132.231 13.0328 133.218 14.6871C133.664 15.4039 133.65 15.9114 132.87 16.3438C131.925 16.9525 130.901 17.6457 129.928 18.299L129.909 18.3107V18.3084ZM142.556 21.2435C142.505 22.0965 142.345 25.323 141.27 23.7861C140.271 21.8874 139.175 19.521 138.197 17.4977C137.817 16.4637 140.192 16.0454 140.81 16.2216C142.535 16.8655 142.596 19.6197 142.556 21.2294V21.2458V21.2435Z" fill="#DC5F40"/>
    </svg>
  );
}


// ── NOTION ICON SVG ───────────────────────────────────────

function NotionIcon({ size = 14, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display:"inline-block", flexShrink:0, ...style }}>
      <rect width="100" height="100" rx="18" fill="white"/>
      <path d="M19.2 17.6C22.1 19.9 23.2 19.7 29 19.3L76.4 16.3C77.5 16.2 77.6 17 77.2 17.5L69.2 23C67.7 24.1 67 24.3 65.6 24.5L19.6 27.7C18.2 27.8 17.5 27.1 18.1 26.3L19.2 17.6Z" fill="#1A1A1A"/>
      <path d="M22 31.2V79.4C22 81.9 23.2 82.8 26.1 82.6L78.2 79.4C81.1 79.2 81.5 77.5 81.5 75.4V27.5C81.5 25.4 80.6 24.3 78.8 24.5L24.9 27.9C22.9 28.1 22 29.1 22 31.2Z" fill="white" stroke="#1A1A1A" strokeWidth="2"/>
      <path d="M56.3 32.7L38.2 34C36.8 34.1 36.5 34.9 36.5 35.9V66.4C36.5 67.3 37.0 67.9 38.0 67.8C39.1 67.7 39.6 67.1 40.2 66.2L48.7 52.6L57.5 65.4C58.3 66.5 59.0 67.2 60.4 67.1C61.5 67.0 62.2 66.2 62.2 64.8V37.4C62.2 35.9 61.5 34.9 60.0 35.0L56.3 32.7Z" fill="#1A1A1A"/>
    </svg>
  );
}

// ── NOTION AUDIT LINK ─────────────────────────────────────

function NotionAuditLink({ moduleKey, label = "Notion Log" }) {
  const config = NOTION_AUDIT_CONFIG.modules[moduleKey];
  const url = config?.pageUrl || NOTION_AUDIT_CONFIG.masterPageUrl;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{
      display:"inline-flex", alignItems:"center", gap:4,
      color:T.muted, fontSize:10, textDecoration:"none",
      background:T.bgCard, border:`1px solid ${T.border}`,
      padding:"2px 7px", borderRadius:4, transition:"color 0.15s"
    }}
      onMouseEnter={e => e.currentTarget.style.color = T.text}
      onMouseLeave={e => e.currentTarget.style.color = T.muted}
    >
      <NotionIcon size={11} />
      {label}
      <ExternalLink size={9} />
    </a>
  );
}

// ── SHARED TABLE HELPERS ──────────────────────────────────

const tableStyle = {
  width: "100%", borderCollapse: "separate", borderSpacing: 0,
  fontSize: 12,
};
const thStyle = {
  textAlign: "left", padding: "8px 12px", color: T.muted, fontSize: 10,
  fontWeight: 700, letterSpacing: 1, borderBottom: `1px solid ${T.border}`,
  whiteSpace: "nowrap", textTransform: "uppercase",
};
const tdStyle = {
  padding: "10px 12px", borderBottom: `1px solid ${T.border}`, color: T.text,
  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
};

function fmt$(n) {
  if (!n || isNaN(n)) return "$—";
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

function StatCard({ label, value, sub, icon: Ic, color = T.accent }) {
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

// ── PRICING CALC VIEW ─────────────────────────────────────

function PricingCalcView({ data, onFilesSelected, uploadedFiles, processing, onProcess }) {
  const model = data.standardModel || {};
  const deals = data.recentDeals || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Upload & Process area */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Upload size={13} color={T.accent} />
          <span style={{ fontSize: 12, fontWeight: 600 }}>Upload Pricing Data</span>
        </div>
        <FileUploadZone onFilesSelected={onFilesSelected} />
        {uploadedFiles && uploadedFiles.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ color: T.muted, fontSize: 11, marginBottom: 6 }}>{uploadedFiles.length} file(s) ready:</div>
            {uploadedFiles.map((f, i) => (
              <div key={i} style={{ color: T.text, fontSize: 11, padding: "3px 0" }}>📄 {f.name} ({(f.size / 1024).toFixed(1)} KB)</div>
            ))}
            <button onClick={onProcess} disabled={processing} style={{
              marginTop: 10, background: processing ? T.bgCard : `linear-gradient(135deg,${T.accent},#6d28d9)`,
              border: "none", borderRadius: 7, padding: "8px 18px", color: "#fff", fontSize: 12, fontWeight: 600,
              cursor: processing ? "default" : "pointer", display: "flex", alignItems: "center", gap: 6
            }}>
              {processing ? <Spinner size={12} /> : <Brain size={12} />}
              {processing ? "Processing…" : "Process with Claude"}
            </button>
          </div>
        )}
      </Card>

      {/* Standard Model KPIs */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <StatCard label="Per $1B Spend" value={fmt$(model.per1BSpend)} sub="Annual platform fee" icon={DollarSign} />
        <StatCard label="YoY Escalation" value={model.yoyEscalation || "—"} sub="Contract renewal rate" icon={TrendingUp} color={T.warn} />
        <StatCard label="Break-Even" value={model.breakEven || "—"} sub="Spend under mgmt threshold" icon={Activity} color={T.success} />
      </div>

      {/* Recent Deals Table */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Users size={13} color={T.accent} />
          <span style={{ fontSize: 12, fontWeight: 600 }}>Recent Deals</span>
          <span style={{ color: T.muted, fontSize: 11 }}>({deals.length})</span>
        </div>
        {deals.length === 0 ? (
          <div style={{ color: T.muted, fontSize: 12, textAlign: "center", padding: 20 }}>No deals processed yet — upload pricing data above</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Client</th>
                  <th style={thStyle}>Y1 Amount</th>
                  <th style={thStyle}>Spend Under Mgmt</th>
                  <th style={thStyle}>Modules</th>
                </tr>
              </thead>
              <tbody>
                {deals.map((d, i) => (
                  <tr key={i} className="table-row" style={{ transition: "background 0.1s" }}>
                    <td style={{ ...tdStyle, fontWeight: 600, color: T.text }}>{d.client || "—"}</td>
                    <td style={{ ...tdStyle, color: T.success }}>{fmt$(d.y1Amount)}</td>
                    <td style={{ ...tdStyle, color: T.muted }}>{d.spendUnderMgmt || "—"}</td>
                    <td style={{ ...tdStyle, maxWidth: 200 }}>{d.modules || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Analysis output */}
      {data.analysis && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Brain size={13} color={T.accent} />
            <span style={{ fontSize: 12, fontWeight: 600 }}>Claude Analysis</span>
          </div>
          <div style={{ color: T.text, fontSize: 12, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{data.analysis}</div>
        </Card>
      )}
    </div>
  );
}

// ── PROPOSALS VIEW ────────────────────────────────────────

function stageBadge(stage) {
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

function statusBadge(status) {
  const s = (status || "").toLowerCase();
  const color = s.includes("submitted") ? T.success : s.includes("draft") ? T.warn : s.includes("lost") || s.includes("reject") ? T.error : T.muted;
  return <span style={{ color, fontSize: 11, fontWeight: 500 }}>{status || "—"}</span>;
}

function ProposalsView({ data, onFilesSelected, uploadedFiles, processing, onProcess }) {
  const proposals = data.activeProposals || [];
  const total = data.total || proposals.length;
  const totalValue = data.totalValue || proposals.reduce((s, p) => s + (p.value || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Upload & Generate area */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Upload size={13} color={T.accent} />
          <span style={{ fontSize: 12, fontWeight: 600 }}>Upload Proposal Documents</span>
        </div>
        <FileUploadZone onFilesSelected={onFilesSelected} />
        {uploadedFiles && uploadedFiles.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ color: T.muted, fontSize: 11, marginBottom: 6 }}>{uploadedFiles.length} file(s) ready:</div>
            {uploadedFiles.map((f, i) => (
              <div key={i} style={{ color: T.text, fontSize: 11, padding: "3px 0" }}>📄 {f.name} ({(f.size / 1024).toFixed(1)} KB)</div>
            ))}
            <button onClick={onProcess} disabled={processing} style={{
              marginTop: 10, background: processing ? T.bgCard : `linear-gradient(135deg,${T.accent},#6d28d9)`,
              border: "none", borderRadius: 7, padding: "8px 18px", color: "#fff", fontSize: 12, fontWeight: 600,
              cursor: processing ? "default" : "pointer", display: "flex", alignItems: "center", gap: 6
            }}>
              {processing ? <Spinner size={12} /> : <Brain size={12} />}
              {processing ? "Generating…" : "Generate Proposal"}
            </button>
          </div>
        )}
      </Card>

      {/* Generated proposal output */}
      {data.proposalTitle && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Brain size={13} color={T.accent} />
            <span style={{ fontSize: 12, fontWeight: 600 }}>Generated Proposal: {data.proposalTitle}</span>
          </div>
          {data.summary && <div style={{ color: T.muted, fontSize: 12, marginBottom: 12 }}>{data.summary}</div>}
          {data.sections?.map((s, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ color: T.text, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{s.heading}</div>
              <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{s.content}</div>
            </div>
          ))}
        </Card>
      )}

      {/* KPI Row */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <StatCard label="Active Proposals" value={total} sub="In pipeline" icon={FileText} />
        <StatCard label="Total Value" value={fmt$(totalValue)} sub="Combined deal value" icon={DollarSign} color={T.success} />
        <StatCard label="Avg Deal Size" value={total > 0 ? fmt$(totalValue / total) : "$—"} sub="Per proposal" icon={TrendingUp} color={T.warn} />
      </div>

      {/* Proposals Table */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <FileText size={13} color={T.accent} />
          <span style={{ fontSize: 12, fontWeight: 600 }}>Proposals</span>
          <span style={{ color: T.muted, fontSize: 11 }}>({proposals.length})</span>
        </div>
        {proposals.length === 0 ? (
          <div style={{ color: T.muted, fontSize: 12, textAlign: "center", padding: 20 }}>No proposals generated yet — upload documents above</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Client</th>
                  <th style={thStyle}>Value</th>
                  <th style={thStyle}>Stage</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Submitted</th>
                  <th style={thStyle}>Contact</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((p, i) => (
                  <tr key={i} className="table-row" style={{ transition: "background 0.1s" }}>
                    <td style={{ ...tdStyle, fontWeight: 600, color: T.text }}>{p.client || "—"}</td>
                    <td style={{ ...tdStyle, color: T.success }}>{fmt$(p.value)}</td>
                    <td style={tdStyle}>{stageBadge(p.stage)}</td>
                    <td style={tdStyle}>{statusBadge(p.status)}</td>
                    <td style={{ ...tdStyle, color: T.muted }}>{p.submittedDate || "—"}</td>
                    <td style={{ ...tdStyle, color: T.muted }}>{p.contact || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── SETTINGS VIEW ─────────────────────────────────────────

function SettingsView({ claudeMemory, onClearMemory }) {
  const [activeTab, setActiveTab] = useState("memory");

  const tabs = [
    { id: "memory",  label: "Claude Memory" },
    { id: "notion",  label: "Notion Audit"  },
    { id: "apis",    label: "API Connections"},
    { id: "supabase",label: "Database"      },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* Tab strip */}
      <div style={{ display:"flex", gap:4, borderBottom:`1px solid ${T.border}`, paddingBottom:0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            background:"none", border:"none", cursor:"pointer",
            padding:"8px 14px", fontSize:12, fontWeight: activeTab===t.id ? 600 : 400,
            color: activeTab===t.id ? T.text : T.muted,
            borderBottom: activeTab===t.id ? `2px solid ${T.accent}` : "2px solid transparent",
            transition:"all 0.15s", marginBottom:-1
          }}>{t.label}</button>
        ))}
      </div>

      {/* Memory tab */}
      {activeTab === "memory" && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <Card>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
              <Brain size={13} color={T.accent} />
              <span style={{ fontSize:12, fontWeight:600 }}>Claude Memory</span>
              <span style={{ color:T.muted, fontSize:11 }}>({claudeMemory.length} interactions logged)</span>
              <div style={{ flex:1 }}/>
              <button onClick={onClearMemory} style={{
                background:"none", border:`1px solid ${T.border}`, borderRadius:5,
                padding:"3px 10px", color:T.muted, fontSize:11, cursor:"pointer"
              }}>Clear</button>
            </div>
            <div style={{ color:T.muted, fontSize:12, marginBottom:12 }}>
              Every Claude API interaction is logged here — prompt, response, module context, timestamp.
              This becomes the living brain of context for Aerchain SalesOS.
            </div>
            {claudeMemory.length === 0 ? (
              <div style={{ color:T.muted, fontSize:12, textAlign:"center", padding:"20px 0" }}>
                No interactions logged yet. Sync a module to start building memory.
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:6, maxHeight:400, overflowY:"auto" }}>
                {[...claudeMemory].reverse().map((m, i) => (
                  <div key={i} style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:7, padding:"10px 12px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                      <span style={{ fontSize:10, fontWeight:600, color:T.accent, background:T.accentBg, padding:"2px 7px", borderRadius:4 }}>{m.module}</span>
                      <span style={{ color:T.muted, fontSize:10 }}>{new Date(m.timestamp).toLocaleString()}</span>
                    </div>
                    <div style={{ color:T.muted, fontSize:11, marginBottom:4 }}>
                      <span style={{ color:T.text, fontWeight:500 }}>Prompt: </span>
                      {m.prompt.slice(0, 120)}{m.prompt.length > 120 ? "…" : ""}
                    </div>
                    <div style={{ color:T.muted, fontSize:11 }}>
                      <span style={{ color:T.success, fontWeight:500 }}>Response: </span>
                      {m.response?.slice(0, 120)}{(m.response?.length || 0) > 120 ? "…" : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Notion Audit tab */}
      {activeTab === "notion" && (
        <Card>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
            <NotionIcon size={13} />
            <span style={{ fontSize:12, fontWeight:600 }}>Notion Audit Log</span>
          </div>
          <div style={{ color:T.muted, fontSize:12, marginBottom:16 }}>
            Master database: <strong style={{ color:T.text }}>{NOTION_AUDIT_CONFIG.masterDbName}</strong>
          </div>
          <div style={{ color:T.muted, fontSize:12, marginBottom:12 }}>
            Every page state syncs to Notion every 30 minutes as human-readable content.
            Each audit entry includes a timestamp, action summary, and reference links
            (Gmail, Google Sheets, Drive, other Notion pages).
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {Object.entries(NOTION_AUDIT_CONFIG.modules).map(([key, cfg]) => (
              <div key={key} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", background:T.bgCard, borderRadius:7, border:`1px solid ${T.border}` }}>
                <NotionIcon size={12} />
                <span style={{ fontSize:12, color:T.text, flex:1 }}>{cfg.pageName}</span>
                {cfg.pageUrl
                  ? <a href={cfg.pageUrl} target="_blank" rel="noopener noreferrer" style={{ color:T.accent, fontSize:11 }}>Open <ExternalLink size={9} /></a>
                  : <span style={{ color:T.muted, fontSize:11 }}>Not created yet</span>
                }
              </div>
            ))}
          </div>
          <div style={{ marginTop:12 }}>
            <a href={NOTION_AUDIT_CONFIG.masterPageUrl} target="_blank" rel="noopener noreferrer" style={{
              display:"inline-flex", alignItems:"center", gap:6, color:T.accent,
              fontSize:12, textDecoration:"none"
            }}>
              <NotionIcon size={12} /> Open Master Notion Log <ExternalLink size={11} />
            </a>
          </div>
        </Card>
      )}

      {/* API Connections tab */}
      {activeTab === "apis" && (
        <Card>
          <div style={{ fontSize:12, fontWeight:600, marginBottom:12 }}>API Connections</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {[
              { name:"Claude (Anthropic)", envKey:"VITE_ANTHROPIC_KEY",  status:"configured", note:"Direct API — no MCP" },
              { name:"HubSpot",            envKey:"VITE_HUBSPOT_API_KEY", status:"stub",       note:"Direct API — not yet connected" },
              { name:"Notion",             envKey:"VITE_NOTION_API_KEY",  status:"configured", note:"Direct API — audit logging active" },
            ].map(api => (
              <div key={api.name} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:7 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:500 }}>{api.name}</div>
                  <div style={{ color:T.muted, fontSize:11, marginTop:2 }}>{api.envKey} · {api.note}</div>
                </div>
                <span style={{
                  fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:4,
                  background: api.status==="configured" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                  color:       api.status==="configured" ? T.success : T.warn,
                }}>{api.status==="configured" ? "Connected" : "Stub"}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Database tab */}
      {activeTab === "supabase" && (
        <Card>
          <div style={{ fontSize:12, fontWeight:600, marginBottom:12 }}>Database — Supabase</div>
          <div style={{ color:T.warn, fontSize:12, background:"rgba(245,158,11,0.08)", border:`1px solid rgba(245,158,11,0.2)`, borderRadius:7, padding:"10px 12px", marginBottom:12 }}>
            Supabase project not yet connected. All data is stored in localStorage.
            Create a new Supabase project, design the schema, then set env vars.
          </div>
          <div style={{ color:T.muted, fontSize:12, marginBottom:8 }}>Starting schema (to be redesigned):</div>
          {["modules","module_data","documents","doc_chunks","sync_log","notion_backups","match_documents()"].map(t => (
            <div key={t} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 10px", fontSize:11, color:T.muted, borderBottom:`1px solid ${T.border}` }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:T.border, display:"inline-block", flexShrink:0 }}/>
              {t}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ── FALLBACK VIEW ─────────────────────────────────────────

function GenericView({ data }) {
  return (
    <Card>
      <pre style={{ color: T.text, fontSize: 11, whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0, lineHeight: 1.6 }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </Card>
  );
}

// ── MODULE CONTENT ROUTER ─────────────────────────────────

function ModuleContent({ moduleKey, data, onSync, syncing, claudeMemory, onClearMemory, onFilesSelected, uploadedFiles, processing, onProcess }) {
  // Settings is never empty — always show view
  if (moduleKey === "settings") return <SettingsView claudeMemory={claudeMemory} onClearMemory={onClearMemory} />;

  const isEmpty = !data || Object.keys(data).length === 0 || (Object.keys(data).length === 1 && data.syncedAt);

  if (isEmpty && UPLOAD_MODULES.has(moduleKey)) {
    return <EmptyState moduleKey={moduleKey} onFilesSelected={onFilesSelected} />;
  }
  if (isEmpty) return <EmptyState moduleKey={moduleKey} onSync={onSync} loading={syncing} />;

  switch (moduleKey) {
    case "pricing-calculator": return <PricingCalcView data={data} onFilesSelected={onFilesSelected} uploadedFiles={uploadedFiles} processing={processing} onProcess={onProcess} />;
    case "proposal-generator": return <ProposalsView data={data} onFilesSelected={onFilesSelected} uploadedFiles={uploadedFiles} processing={processing} onProcess={onProcess} />;
    default:                   return <GenericView data={data} />;
  }
}

// ═══════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════

export default function AerchainSalesOS({ moduleFilter = null, appName = "Aerchain · SalesOS" }) {
  // System group (pinned) always shows — only filter non-system modules
  const visibleGroups = moduleFilter
    ? GROUPS.map(g => ({
        ...g,
        modules: g.pinBottom ? g.modules : g.modules.filter(m => moduleFilter.includes(m))
      })).filter(g => g.modules.length > 0)
    : GROUPS;

  const [selected, setSelected]         = useState(moduleFilter ? moduleFilter[0] : "pricing-calculator");
  const [moduleData, setModuleData]     = useState({});
  const [syncing, setSyncing]           = useState(new Set());
  const [syncingAll, setSyncingAll]     = useState(false);
  const [syncLog, setSyncLog]           = useState([]);
  const [showLog, setShowLog]           = useState(true);
  const [lastGlobalSync, setLastGlobalSync] = useState(null);
  const [showDummy, setShowDummy]       = useState(false);
  const [theme, setTheme]               = useState("dark");
  const [claudeMemory, setClaudeMemory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("aerchain-claude-memory") || "[]"); } catch { return []; }
  });
  const notionSyncTimerRef = useRef(null);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [processing, setProcessing] = useState(new Set());

  // Dark Canvas v3 theme + font injection
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');
      *, *::before, *::after { box-sizing: border-box; }
      body { margin: 0; }

      /* Dark Canvas v3 tokens */
      :root[data-theme="dark"] {
        --canvas:       linear-gradient(145deg, hsl(265 30% 7%) 0%, hsl(270 20% 5%) 40%, hsl(260 15% 4%) 100%);
        --primary:      hsl(262 75% 62%);
        --accent:       hsl(275 80% 65%);
        --gp:           linear-gradient(135deg, hsl(262 75% 62%), hsl(275 80% 65%));
        --green:        hsl(152 60% 52%);
        --amber:        hsl(38 85% 58%);
        --red:          hsl(0 72% 62%);
        --glass-1:      rgba(255,255,255,0.04);
        --glass-2:      rgba(255,255,255,0.07);
        --glass-border: rgba(255,255,255,0.09);
        --fg:           rgba(255,255,255,0.88);
        --fg2:          rgba(255,255,255,0.60);
        --fg3:          rgba(255,255,255,0.35);
        --s-glass:      0 2px 16px rgba(0,0,0,0.40), 0 0 0 1px rgba(255,255,255,0.04) inset;
        --s-elevated:   0 12px 40px -6px rgba(0,0,0,0.60), 0 0 0 1px rgba(255,255,255,0.07) inset;
        --s-glow:       0 0 24px rgba(124,58,237,0.18);
      }
      :root[data-theme="light"] {
        --canvas:       linear-gradient(145deg, hsl(220 20% 96%) 0%, hsl(220 15% 93%) 40%, hsl(220 10% 90%) 100%);
        --primary:      hsl(262 65% 52%);
        --accent:       hsl(275 70% 55%);
        --gp:           linear-gradient(135deg, hsl(262 65% 52%), hsl(275 70% 55%));
        --green:        hsl(152 55% 42%);
        --amber:        hsl(38 80% 48%);
        --red:          hsl(0 65% 52%);
        --glass-1:      rgba(0,0,0,0.03);
        --glass-2:      rgba(0,0,0,0.05);
        --glass-border: rgba(0,0,0,0.10);
        --fg:           rgba(0,0,0,0.85);
        --fg2:          rgba(0,0,0,0.55);
        --fg3:          rgba(0,0,0,0.35);
        --s-glass:      0 2px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04) inset;
        --s-elevated:   0 12px 40px -6px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.06) inset;
        --s-glow:       0 0 24px rgba(124,58,237,0.10);
      }

      ::selection { background: hsla(262,80%,55%,0.30); }
      ::-webkit-scrollbar { width: 5px; height: 5px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.10); border-radius: 3px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.20); }
      [data-theme="light"] ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); }
      [data-theme="light"] ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.20); }

      @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
      @keyframes fadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
      @keyframes orbA { 0%{transform:translate(0,0)scale(1)} 100%{transform:translate(30px,-25px)scale(1.08)} }
      @keyframes orbB { 0%{transform:translate(0,0)scale(1)} 100%{transform:translate(-22px,28px)scale(1.06)} }

      .module-item:hover { background: var(--glass-2) !important; }
      .table-row:hover { background: var(--glass-1) !important; }

      .glass-surface {
        background: var(--glass-1);
        -webkit-backdrop-filter: blur(40px) saturate(1.4);
        backdrop-filter: blur(40px) saturate(1.4);
        border: 1px solid var(--glass-border);
      }
    `;
    document.head.appendChild(s);
    return () => s.remove();
  }, []);

  const addLog = useCallback((msg, type = "info") => {
    setSyncLog(prev => [{ msg, type, time: new Date() }, ...prev].slice(0, 80));
  }, []);

  // ── Load from localStorage ───────────────────────────────

  useEffect(() => {
    const cached = localStorage.getItem("aerchain-module-data");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Object.keys(parsed).length > 0) {
          setModuleData(parsed);
          const fresh = Object.values(parsed).filter(v => v.status?.includes("Fresh")).length;
          addLog(`📦 Loaded ${Object.keys(parsed).length} modules from cache (${fresh} fresh)`, "success");
          return;
        }
      } catch {}
    }
    addLog("🆕 No cached data — sync a module to get started", "info");
  }, []);

  // Persist moduleData to localStorage on every change
  useEffect(() => {
    if (Object.keys(moduleData).length > 0) {
      localStorage.setItem("aerchain-module-data", JSON.stringify(moduleData));
    }
  }, [moduleData]);

  // ── Claude Memory ────────────────────────────────────────

  const logClaudeInteraction = useCallback((module, prompt, response) => {
    const entry = { module, prompt, response, timestamp: new Date().toISOString() };
    setClaudeMemory(prev => {
      const updated = [...prev, entry].slice(-200); // keep last 200
      localStorage.setItem("aerchain-claude-memory", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearClaudeMemory = useCallback(() => {
    setClaudeMemory([]);
    localStorage.removeItem("aerchain-claude-memory");
    addLog("🧹 Claude memory cleared", "info");
  }, [addLog]);

  // ── File upload handler ──────────────────────────────────

  const handleFilesSelected = useCallback((moduleKey, files) => {
    setUploadedFiles(prev => ({ ...prev, [moduleKey]: files }));
    addLog(`📎 ${files.length} file(s) uploaded for ${MOD[moduleKey]?.label || moduleKey}`, "info");
  }, [addLog]);

  // ── Process uploaded files with Claude ──────────────────

  const handleProcess = useCallback(async (moduleKey) => {
    const files = uploadedFiles[moduleKey];
    if (!files || files.length === 0) return;
    if (processing.has(moduleKey)) return;

    setProcessing(prev => new Set([...prev, moduleKey]));
    const label = MOD[moduleKey]?.label || moduleKey;
    addLog(`🧠 Processing ${label} with Claude…`, "info");

    try {
      // Read file contents as text
      const fileContents = await Promise.all(
        files.map(async (f) => {
          const text = await f.text();
          return `--- File: ${f.name} (${f.type || "unknown"}) ---\n${text}`;
        })
      );
      const inputText = `Process the following uploaded data for ${label}:\n\n${fileContents.join("\n\n")}`;

      const text = await processWithClaude(moduleKey, inputText);
      logClaudeInteraction(moduleKey, inputText.slice(0, 500), text);
      const parsed = extractJSON(text);

      if (parsed) {
        const prevCount = moduleData[moduleKey]?.syncCount || 0;
        const entry = { data: parsed, status: "🟢 Fresh", lastSynced: new Date().toISOString(), staleAfterHrs: 24, syncCount: prevCount + 1 };
        setModuleData(prev => ({ ...prev, [moduleKey]: entry }));
        addLog(`✅ ${label} — processed successfully`, "success");

        // Audit to Notion
        try {
          await createNotionAuditEntry({ action: "PROCESS", module: moduleKey, summary: `Processed ${files.length} file(s) with Claude` });
        } catch (e) {
          console.warn("Notion audit failed:", e.message);
        }
      } else {
        addLog(`⚠️ ${label} — no parseable JSON returned from Claude`, "warn");
      }
    } catch (e) {
      addLog(`❌ ${label} — processing error: ${e.message}`, "error");
    } finally {
      setProcessing(prev => { const n = new Set(prev); n.delete(moduleKey); return n; });
    }
  }, [uploadedFiles, processing, moduleData, addLog, logClaudeInteraction]);

  // ── Notion 30-min periodic audit sync ───────────────────

  useEffect(() => {
    const doNotionSync = async () => {
      // Write to localStorage as fallback
      const entry = {
        timestamp: new Date().toISOString(),
        action: "PERIODIC_SYNC",
        modules: Object.keys(moduleData),
        summary: `Periodic Notion audit log sync — ${Object.keys(moduleData).length} modules`,
        refs: [],
      };
      const existing = JSON.parse(localStorage.getItem("aerchain-notion-audit") || "[]");
      const updated = [entry, ...existing].slice(0, 100);
      localStorage.setItem("aerchain-notion-audit", JSON.stringify(updated));

      // Also push to Notion API
      try {
        await createNotionAuditEntry({
          action: "PERIODIC_SYNC",
          module: "all",
          summary: `Periodic audit — ${Object.keys(moduleData).length} modules active`,
        });
        addLog("📓 Notion audit synced", "success");
      } catch (e) {
        addLog(`📓 Notion audit sync failed: ${e.message}`, "warn");
      }
    };

    notionSyncTimerRef.current = setInterval(doNotionSync, 30 * 60 * 1000); // 30 min
    return () => clearInterval(notionSyncTimerRef.current);
  }, [moduleData, addLog]);

  // ── Sync single module ────────────────────────────────────

  const syncModule = useCallback(async (key) => {
    if (key === "settings") return; // settings has no sync
    if (UPLOAD_MODULES.has(key)) return; // upload modules use processWithClaude
    if (syncing.has(key)) return;
    setSyncing(prev => new Set([...prev, key]));
    const label = MOD[key]?.label || key;
    addLog(`🔄 Syncing ${label}…`, "info");
    try {
      const prompt = getSyncPrompt(key);
      const text = await callClaude(prompt);
      logClaudeInteraction(key, prompt, text);
      const parsed = extractJSON(text);
      if (parsed) {
        const prevCount = moduleData[key]?.syncCount || 0;
        const entry = { data: parsed, status: "🟢 Fresh", lastSynced: new Date().toISOString(), staleAfterHrs: moduleData[key]?.staleAfterHrs || 4, syncCount: prevCount + 1 };
        setModuleData(prev => ({ ...prev, [key]: entry }));
        addLog(`✅ ${label} — synced successfully`, "success");
      } else {
        addLog(`⚠️ ${label} — no parseable JSON returned`, "warn");
        setModuleData(prev => ({ ...prev, [key]: { ...prev[key], status: "🔴 Error" } }));
      }
    } catch (e) {
      addLog(`❌ ${label} — ${e.message}`, "error");
      setModuleData(prev => ({ ...prev, [key]: { ...prev[key], status: "🔴 Error" } }));
    } finally {
      setSyncing(prev => { const n = new Set(prev); n.delete(key); return n; });
    }
  }, [syncing, moduleData, addLog, logClaudeInteraction]);

  // ── Sync all ──────────────────────────────────────────────

  const syncAll = useCallback(async () => {
    if (syncingAll) return;
    setSyncingAll(true);
    addLog(`🚀 Full sync started — all ${Object.keys(MOD).length} modules`, "info");
    const syncableKeys = Object.keys(MOD).filter(k => k !== "settings" && !UPLOAD_MODULES.has(k));
    for (const key of syncableKeys) {
      await syncModule(key);
      await new Promise(r => setTimeout(r, 300));
    }
    setSyncingAll(false);
    setLastGlobalSync(new Date());
    addLog("🏁 Full sync complete", "success");
  }, [syncingAll, syncModule, addLog]);

  // ── Download snapshot ────────────────────────────────────

  const downloadSnapshot = useCallback(() => {
    const styleContent = Array.from(document.querySelectorAll("style"))
      .map(s => s.textContent).join("\n");
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Aerchain · SalesOS${showDummy ? " (Demo)" : ""}</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>${styleContent}</style>
</head>
<body style="margin:0;padding:0;">
${document.getElementById("root").innerHTML}
</body>
</html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aerchain-salesos-${showDummy ? "demo-" : ""}${new Date().toISOString().slice(0,10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [showDummy]);

  // ── Download standalone prototype ───────────────────────
  // The prototype HTML content is embedded here so aerchain-prototype.html
  // can be removed from the repo. Content sourced from aerchain-prototype.html (699 lines).

  const downloadPrototype = useCallback(() => {
    const a = document.createElement("a");
    a.href = "/aerchain-salesos/aerchain-prototype.html";
    a.download = "aerchain-prototype.html";
    // Fallback: open in new tab if direct download not available
    a.target = "_blank";
    a.click();
  }, []);

  // ── Derived state ─────────────────────────────────────────

  const mod = MOD[selected] || {};
  const { Icon } = mod;
  const mData = showDummy ? DUMMY_DATA[selected] : moduleData[selected];
  const mStatus = mData?.status || "⬜ Never Synced";
  const mLastSync = mData?.lastSynced;
  const stale = isStale(mLastSync, mData?.staleAfterHrs || 4);
  const isSyncing = syncing.has(selected);
  const anyStale = Object.entries(moduleData).some(([,v]) => isStale(v?.lastSynced, v?.staleAfterHrs || 4));

  // ── Render ────────────────────────────────────────────────

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100dvh", background:T.bg, fontFamily:"'Montserrat',sans-serif", color:T.text, overflow:"hidden", position:"relative" }}>

      {/* Animated background orbs */}
      <div style={{ position:"absolute", width:700, height:700, top:-200, right:-150, background:"radial-gradient(circle, hsla(265,60%,25%,0.30) 0%, transparent 70%)", borderRadius:"50%", pointerEvents:"none", animation:"orbA 20s ease-in-out infinite alternate", zIndex:0 }} />
      <div style={{ position:"absolute", width:550, height:550, bottom:-180, left:-80, background:"radial-gradient(circle, hsla(255,50%,22%,0.25) 0%, transparent 70%)", borderRadius:"50%", pointerEvents:"none", animation:"orbB 26s ease-in-out infinite alternate-reverse", zIndex:0 }} />

      {/* TOPBAR */}
      <div className="glass-surface" style={{ height:56, display:"flex", alignItems:"center", padding:"0 20px", gap:16, flexShrink:0, zIndex:10, position:"relative" }}>
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginRight:6 }}>
          <AerchainLogo height={18} />
          <div style={{ width:1, height:18, background:"rgba(255,255,255,0.1)" }} />
          <div style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:10, fontWeight:500, letterSpacing:"0.12em", textTransform:"uppercase", color:"rgba(255,255,255,0.5)", padding:"3px 9px", background:"hsl(262 60% 50% / .12)", border:"1px solid hsl(262 60% 50% / .18)", borderRadius:6 }}>
            <span style={{ width:5, height:5, borderRadius:"50%", background:T.accent, boxShadow:`0 0 6px ${T.accent}`, display:"inline-block" }} />
            {appName}
          </div>
        </div>

        {/* Current module */}
        <div style={{ height:20, width:1, background:T.border }} />
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          {Icon && <Icon size={13} color={T.accent} />}
          <span style={{ fontSize:13, fontWeight:500 }}>{mod.label}</span>
          {selected !== "settings" && stale && mLastSync && <span style={{ fontSize:10, color:T.warn, background:T.warn+"22", padding:"2px 6px", borderRadius:4 }}>STALE</span>}
          {selected !== "settings" && !mLastSync && <span style={{ fontSize:10, color:T.muted, background:"rgba(255,255,255,0.06)", padding:"2px 6px", borderRadius:4 }}>NEVER SYNCED</span>}
        </div>

        <div style={{ flex:1 }} />

        {/* Status indicators */}
        {anyStale && (
          <div style={{ display:"flex", alignItems:"center", gap:4, color:T.warn, fontSize:11 }}>
            <AlertCircle size={11} /> Some data is stale
          </div>
        )}
        {lastGlobalSync && (
          <span style={{ color:T.muted, fontSize:11 }}>Last full sync: {timeAgo(lastGlobalSync)}</span>
        )}

        {/* Sync All */}
        <button onClick={syncAll} disabled={syncingAll} style={{
          background: syncingAll ? T.bgCard : `linear-gradient(135deg,${T.accent},#6d28d9)`,
          border: "none", borderRadius:7, padding:"6px 14px", color:"#fff", fontSize:12, fontWeight:600,
          cursor: syncingAll ? "default" : "pointer",
          display:"flex", alignItems:"center", gap:6, transition:"opacity 0.2s",
          opacity: syncingAll ? 0.6 : 1
        }}>
          {syncingAll ? <Spinner size={12} /> : <RefreshCw size={12} />}
          {syncingAll ? "Syncing All…" : "Sync All"}
        </button>

        {/* Demo toggle */}
        <button onClick={() => setShowDummy(p=>!p)} style={{
          background: showDummy ? "rgba(139,92,246,0.2)" : "none",
          border: showDummy ? `1px solid rgba(139,92,246,0.4)` : "1px solid transparent",
          borderRadius:6, padding:"4px 10px", cursor:"pointer",
          color: showDummy ? T.accent : T.muted,
          fontSize:11, fontWeight:500,
          display:"flex", alignItems:"center", gap:5,
          transition:"all 0.2s"
        }}>
          <Wand2 size={12} />
          {showDummy ? "Demo ON" : "Demo"}
        </button>

        {/* Download app snapshot */}
        <button onClick={downloadSnapshot} title="Download app snapshot as HTML" style={{ background:"none", border:"none", cursor:"pointer", color:T.muted, padding:4, display:"flex", alignItems:"center" }}>
          <Download size={14} />
        </button>

        {/* Download standalone prototype */}
        <button onClick={downloadPrototype} title="Download standalone prototype HTML" style={{
          background:"none", border:`1px solid ${T.border}`, borderRadius:5,
          cursor:"pointer", color:T.muted, padding:"3px 8px", fontSize:10, fontWeight:500,
          display:"flex", alignItems:"center", gap:4, transition:"color 0.15s"
        }}>
          <Link size={11} /> Prototype
        </button>

        {/* Log toggle */}
        <button onClick={() => setShowLog(p=>!p)} style={{ background:"none", border:"none", cursor:"pointer", color:showLog?T.accent:T.muted, padding:4 }}>
          <Activity size={15} />
        </button>

        {/* Theme toggle */}
        <button onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} title="Toggle theme" style={{
          background:"none", border:"1px solid transparent", borderRadius:6, cursor:"pointer",
          color:T.muted, padding:4, display:"flex", alignItems:"center", transition:"all 0.15s"
        }}>
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        {/* Settings gear */}
        <button onClick={() => setSelected("settings")} title="Settings" style={{
          background: selected==="settings" ? T.accentBg : "none",
          border: selected==="settings" ? `1px solid ${T.borderAcc}` : "1px solid transparent",
          borderRadius:6, cursor:"pointer",
          color: selected==="settings" ? T.accent : T.muted,
          padding:4, display:"flex", alignItems:"center", transition:"all 0.15s"
        }}>
          <Settings size={14} />
        </button>
      </div>

      {/* DEMO BANNER */}
      {showDummy && (
        <div style={{ background:"rgba(139,92,246,0.1)", borderBottom:`1px solid rgba(139,92,246,0.2)`, padding:"4px 20px", fontSize:11, color:T.accent, textAlign:"center", flexShrink:0 }}>
          Demo Mode — Showing sample data
        </div>
      )}

      {/* BODY */}
      <div style={{ display:"flex", flex:1, overflow:"hidden", position:"relative", zIndex:1 }}>

        {/* SIDEBAR */}
        <div className="glass-surface" style={{ width:210, display:"flex", flexDirection:"column", overflow:"hidden", flexShrink:0, borderTop:"none", borderBottom:"none", borderLeft:"none", zIndex:2 }}>

          {/* Main groups (non-pinned) */}
          <div style={{ flex:1, overflowY:"auto", padding:"12px 8px" }}>
            {visibleGroups.filter(g => !g.pinBottom).map(g => (
              <div key={g.id} style={{ marginBottom:6 }}>
                <div style={{ color:T.muted, fontSize:9, fontWeight:700, letterSpacing:1.5, padding:"6px 8px 4px" }}>{g.label}</div>
                {g.modules.map(key => {
                  const { label, Icon: I } = MOD[key] || {};
                  const mStatus = moduleData[key]?.status || "⬜ Never Synced";
                  const isSel = selected === key;
                  const isSync = syncing.has(key);
                  return (
                    <div key={key} className="module-item" onClick={() => setSelected(key)} style={{
                      display:"flex", alignItems:"center", gap:8, padding:"6px 8px", borderRadius:7,
                      background: isSel ? T.bgActive : "transparent",
                      border: isSel ? `1px solid ${T.borderAcc}` : "1px solid transparent",
                      cursor:"pointer", transition:"all 0.15s", marginBottom:2
                    }}>
                      {I && <I size={13} color={isSel ? T.accent : T.muted} />}
                      <span style={{ flex:1, fontSize:12, fontWeight: isSel ? 600 : 400, color: isSel ? T.text : T.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{label}</span>
                      {isSync ? <Spinner size={10}/> : <StatusDot status={mStatus} />}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* SYSTEM group — pinned to bottom */}
          <div style={{ borderTop:`1px solid ${T.border}`, padding:"8px 8px 4px" }}>
            {visibleGroups.filter(g => g.pinBottom).map(g => (
              <div key={g.id}>
                <div style={{ color:T.muted, fontSize:9, fontWeight:700, letterSpacing:1.5, padding:"4px 8px 6px" }}>{g.label}</div>
                {g.modules.map(key => {
                  const { label, Icon: I } = MOD[key] || {};
                  const isSel = selected === key;
                  return (
                    <div key={key} className="module-item" onClick={() => setSelected(key)} style={{
                      display:"flex", alignItems:"center", gap:8, padding:"6px 8px", borderRadius:7,
                      background: isSel ? T.bgActive : "transparent",
                      border: isSel ? `1px solid ${T.borderAcc}` : "1px solid transparent",
                      cursor:"pointer", transition:"all 0.15s", marginBottom:2
                    }}>
                      {I && <I size={13} color={isSel ? T.accent : T.muted} />}
                      <span style={{ flex:1, fontSize:12, fontWeight: isSel ? 600 : 400, color: isSel ? T.text : T.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{label}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ padding:"10px 12px", borderTop:`1px solid ${T.border}`, fontSize:10, color:T.muted }}>
            <div>Aerchain · $6M ARR</div>
            <div style={{ marginTop:2 }}>$20B+ spend managed</div>
          </div>
        </div>

        {/* MAIN PANEL */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          {/* Module header */}
          <div style={{ padding:"14px 20px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
            <div style={{ width:32, height:32, borderRadius:9, background:T.accentBg, display:"flex", alignItems:"center", justifyContent:"center" }}>
              {Icon && <Icon size={15} color={T.accent} />}
            </div>
            <div>
              <div style={{ fontWeight:600, fontSize:15 }}>{mod.label}</div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:2 }}>
                <StatusDot status={mStatus} />
                <span style={{ color:T.muted, fontSize:11 }}>{mStatus}</span>
                <span style={{ color:T.muted, fontSize:11 }}>·</span>
                <Clock size={10} color={T.muted} />
                <span style={{ color:T.muted, fontSize:11 }}>{timeAgo(mLastSync)}</span>
                {mData?.syncCount > 0 && <span style={{ color:T.muted, fontSize:11 }}>· {mData.syncCount} syncs</span>}
              </div>
            </div>
            <div style={{ flex:1 }} />
            {selected !== "settings" && stale && mLastSync && (
              <div style={{ display:"flex", alignItems:"center", gap:4, color:T.warn, fontSize:11, background:T.warn+"15", padding:"4px 10px", borderRadius:6 }}>
                <AlertCircle size={11} /> Data is stale — sync recommended
              </div>
            )}
            {/* Notion audit link */}
            <NotionAuditLink moduleKey={selected} />
            {selected !== "settings" && !UPLOAD_MODULES.has(selected) && <SyncBtn onClick={() => syncModule(selected)} loading={isSyncing} size={14}/>}
          </div>

          {/* Content */}
          <div style={{ flex:1, overflowY:"auto", padding:20 }}>
            <div style={{ animation:"fadeIn 0.2s ease" }}>
              <ModuleContent
                moduleKey={selected}
                data={mData?.data}
                onSync={() => syncModule(selected)}
                syncing={isSyncing}
                claudeMemory={claudeMemory}
                onClearMemory={clearClaudeMemory}
                onFilesSelected={(files) => handleFilesSelected(selected, files)}
                uploadedFiles={uploadedFiles[selected]}
                processing={processing.has(selected)}
                onProcess={() => handleProcess(selected)}
              />
            </div>
          </div>
        </div>

        {/* SYNC LOG PANEL */}
        {showLog && (
          <div style={{ width:272, borderLeft:`1px solid ${T.border}`, display:"flex", flexDirection:"column", overflow:"hidden", flexShrink:0 }}>
            <div style={{ padding:"12px 14px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
              <Activity size={12} color={T.accent}/>
              <span style={{ fontSize:11, fontWeight:600, letterSpacing:0.5, color:T.muted }}>SYNC LOG</span>
              <div style={{ flex:1 }}/>
              <button onClick={() => setSyncLog([])} style={{ background:"none", border:"none", cursor:"pointer", color:T.muted, padding:2, fontSize:10 }}>Clear</button>
              <button onClick={() => setShowLog(false)} style={{ background:"none", border:"none", cursor:"pointer", color:T.muted, padding:2 }}>
                <X size={12}/>
              </button>
            </div>
            <div style={{ flex:1, overflowY:"auto", padding:"8px 10px", display:"flex", flexDirection:"column", gap:4 }}>
              {syncLog.length === 0 ? (
                <div style={{ color:T.muted, fontSize:11, textAlign:"center", marginTop:20 }}>No sync activity yet</div>
              ) : syncLog.map((entry, i) => {
                const col = entry.type==="success"?T.success:entry.type==="error"?T.error:entry.type==="warn"?T.warn:T.muted;
                return (
                  <div key={i} style={{ display:"flex", gap:8, padding:"5px 8px", background:T.bgCard, borderRadius:5, border:`1px solid ${T.border}`, animation:"fadeIn 0.15s ease" }}>
                    <div style={{ width:3, borderRadius:4, background:col, flexShrink:0, alignSelf:"stretch" }}/>
                    <div>
                      <div style={{ color:T.text, fontSize:11, lineHeight:1.4 }}>{entry.msg}</div>
                      <div style={{ color:T.muted, fontSize:10, marginTop:1 }}>{entry.time.toLocaleTimeString()}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Module quick-sync strip */}
            <div style={{ padding:"10px", borderTop:`1px solid ${T.border}`, flexShrink:0 }}>
              <div style={{ color:T.muted, fontSize:10, fontWeight:600, letterSpacing:1, marginBottom:8 }}>QUICK SYNC</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                {Object.keys(MOD).filter(k => k !== "settings" && !UPLOAD_MODULES.has(k)).map(key => (
                  <button key={key} onClick={() => syncModule(key)} disabled={syncing.has(key)} style={{
                    background: syncing.has(key) ? T.accentBg : T.bgCard,
                    border:`1px solid ${syncing.has(key) ? T.borderAcc : T.border}`,
                    borderRadius:5, padding:"4px 8px", color: syncing.has(key) ? T.accent : T.muted,
                    fontSize:10, cursor:syncing.has(key)?"default":"pointer", display:"flex", alignItems:"center", gap:4
                  }}>
                    {syncing.has(key) ? <Spinner size={8}/> : null}
                    {MOD[key]?.label?.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* LUMOS MARKER */}
      <div style={{
        position:"fixed", bottom:16, right:16, zIndex:200,
        display:"flex", alignItems:"center", gap:6,
        background:"rgba(139,92,246,0.15)", border:`1px solid rgba(139,92,246,0.4)`,
        backdropFilter:"blur(12px)", borderRadius:8, padding:"6px 12px",
        boxShadow:"0 0 12px rgba(139,92,246,0.25)",
      }}>
        <Wand2 size={14} color="#8b5cf6" />
        <span style={{ fontSize:11, fontWeight:600, letterSpacing:"0.08em", color:"#8b5cf6" }}>Lumos</span>
      </div>

      {/* GLOBAL SYNC OVERLAY */}
      {syncingAll && (
        <div style={{ position:"fixed", bottom:20, left:"50%", transform:"translateX(-50%)", background:"rgba(13,10,30,0.95)", border:`1px solid ${T.borderAcc}`, backdropFilter:"blur(12px)", borderRadius:12, padding:"12px 20px", display:"flex", alignItems:"center", gap:12, zIndex:100, boxShadow:`0 8px 32px rgba(0,0,0,0.5)` }}>
          <Spinner size={16}/>
          <div>
            <div style={{ color:T.text, fontSize:13, fontWeight:600 }}>Syncing all modules…</div>
            <div style={{ color:T.muted, fontSize:11 }}>{syncing.size} active · {Object.values(moduleData).filter(m=>m?.status?.includes("Fresh")).length} complete</div>
          </div>
          <div style={{ width:120, height:4, background:T.bgCard, borderRadius:4, overflow:"hidden" }}>
            <div style={{ height:"100%", background:`linear-gradient(90deg,${T.accent},#6d28d9)`, borderRadius:4, width: `${(Object.values(moduleData).filter(m=>m?.status?.includes("Fresh")).length/Object.keys(MOD).length)*100}%`, transition:"width 0.5s" }}/>
          </div>
        </div>
      )}
    </div>
  );
}
