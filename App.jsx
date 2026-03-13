import { useState, useEffect, useCallback, useRef } from "react";
import {
  RefreshCw, AlertCircle, CheckCircle, Clock, Database,
  Loader2, Activity, FileText, DollarSign, X
} from "lucide-react";

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════

const NOTION_DB_URL = "https://www.notion.so/4044b29e0f85481db7e4dd6b1aa88a2c";
const NOTION_PAGE_IDS = {
  "pricing-calc": "32101f618de2813db745d7b46c936272",
  "proposals":    "32101f618de2813f8ac5e65ed4ef7b14",
};

const MCP = {
  gmail:   { type: "url", url: "https://gmail.mcp.claude.com/mcp",             name: "gmail"   },
  gcal:    { type: "url", url: "https://gcal.mcp.claude.com/mcp",              name: "gcal"    },
  notion:  { type: "url", url: "https://mcp.notion.com/mcp",                   name: "notion"  },
  hubspot: { type: "url", url: "https://mcp.hubspot.com/anthropic",             name: "hubspot" },
  slack:   { type: "url", url: "https://mcp.slack.com/mcp",                    name: "slack"   },
  n8n:     { type: "url", url: "https://gkg-aerchain.app.n8n.cloud/mcp-server/http", name: "n8n" },
};

const GROUPS = [
  { id: "pipeline", label: "PIPELINE", modules: ["pricing-calc","proposals"] },
];

const MOD = {
  "pricing-calc": { label: "Pricing Calc", Icon: DollarSign, keys: ["notion"]           },
  "proposals":    { label: "Proposals",    Icon: FileText,   keys: ["notion","hubspot"] },
};

// ═══════════════════════════════════════════════════════════
// SYNC PROMPTS
// ═══════════════════════════════════════════════════════════

const getSyncPrompt = (key) => {
  const now = new Date().toISOString();
  const prompts = {
    "pricing-calc": `Use the Notion MCP to fetch pricing intelligence from the Aerchain Brain.
Look for deal-level pricing in Section 4 Pipeline & Revenue Intelligence.
Return ONLY raw JSON:
{"standardModel":{"per1BSpend":300000,"yoyEscalation":"10%","breakEven":"$500M-$1B"},"recentDeals":[{"client":"...","y1Amount":0,"spendUnderMgmt":"...","modules":"..."}],"syncedAt":"${now}"}`,

    proposals: `Use HubSpot MCP to list deals at Proposal or later stage. Use Notion MCP to check for active RFP submissions.
Return ONLY raw JSON:
{"activeProposals":[{"client":"...","value":0,"stage":"...","submittedDate":"...","status":"...","contact":"..."}],"total":0,"totalValue":0,"syncedAt":"${now}"}`,
  };
  return prompts[key] || `Return ONLY raw JSON: {"message":"No sync configured","syncedAt":"${now}"}`;
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

function timeAgo(date) {
  if (!date) return "Never";
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function fmt$(n) {
  if (!n || isNaN(n)) return "$—";
  if (n >= 1e6) return `$${(n/1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n/1e3).toFixed(0)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

async function callClaude(prompt, mcpKeys = []) {
  const servers = mcpKeys.map(k => MCP[k]).filter(Boolean);
  const body = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    system: "You are a data sync agent for Aerchain's GKG Master App. Use the provided MCP tools to fetch real live data. After fetching data with tools, return ONLY the raw JSON object requested — no markdown fences, no explanation, no preamble. Your response text must start with { and end with }.",
    messages: [{ role: "user", content: prompt }],
    ...(servers.length > 0 && { mcp_servers: servers }),
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
    throw new Error(e.error?.message || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
}

// ═══════════════════════════════════════════════════════════
// DESIGN TOKENS (Dark Canvas v13)
// ═══════════════════════════════════════════════════════════

const T = {
  bg:        "#0d0a1e",
  bgCard:    "rgba(255,255,255,0.045)",
  bgHover:   "rgba(255,255,255,0.07)",
  bgActive:  "rgba(139,92,246,0.18)",
  border:    "rgba(255,255,255,0.08)",
  borderAcc: "rgba(139,92,246,0.4)",
  text:      "#ffffff",
  muted:     "rgba(255,255,255,0.5)",
  accent:    "#8b5cf6",
  accentBg:  "rgba(139,92,246,0.15)",
  success:   "#10b981",
  warn:      "#f59e0b",
  error:     "#ef4444",
  info:      "#3b82f6",
  topbar:    "rgba(13,10,30,0.92)",
  sidebar:   "rgba(255,255,255,0.025)",
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

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: T.bgCard,
      border: `1px solid ${T.border}`,
      borderRadius: 10,
      padding: "14px 16px",
      ...style
    }}>
      {children}
    </div>
  );
}

function EmptyState({ moduleKey, onSync, loading }) {
  const { label, Icon } = MOD[moduleKey] || {};
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:16, padding:40, textAlign:"center" }}>
      <div style={{ width:56, height:56, borderRadius:16, background:T.accentBg, display:"flex", alignItems:"center", justifyContent:"center" }}>
        {Icon && <Icon size={24} color={T.accent} />}
      </div>
      <div>
        <div style={{ color:T.text, fontWeight:600, marginBottom:6 }}>{label}</div>
        <div style={{ color:T.muted, fontSize:13 }}>No data yet — sync to pull live data from your sources</div>
      </div>
      <button onClick={onSync} disabled={loading} style={{
        background: T.accentBg, border:`1px solid ${T.borderAcc}`, borderRadius:8, padding:"8px 20px",
        color:T.accent, fontSize:13, fontWeight:500, cursor:loading?"default":"pointer",
        display:"flex", alignItems:"center", gap:6
      }}>
        {loading ? <Spinner size={12}/> : <RefreshCw size={12}/>}
        {loading ? "Syncing…" : "Sync Now"}
      </button>
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


// ── MODULE VIEWS ──────────────────────────────────────────

function GenericView({ data }) {
  return (
    <Card>
      <pre style={{ color:T.text, fontSize:11, fontFamily:"'JetBrains Mono',monospace", whiteSpace:"pre-wrap", wordBreak:"break-all", margin:0, lineHeight:1.6 }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </Card>
  );
}

function ModuleContent({ moduleKey, data, onSync, syncing }) {
  const isEmpty = !data || Object.keys(data).length === 0 || (Object.keys(data).length === 1 && data.syncedAt);
  if (isEmpty) return <EmptyState moduleKey={moduleKey} onSync={onSync} loading={syncing} />;
  return <GenericView data={data} />;
}

// ═══════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════

export default function GKGApp({ moduleFilter = null, appName = "GKG Sales OS" }) {
  const visibleGroups = moduleFilter
    ? GROUPS.map(g => ({ ...g, modules: g.modules.filter(m => moduleFilter.includes(m)) })).filter(g => g.modules.length > 0)
    : GROUPS;

  const [selected, setSelected]           = useState(moduleFilter ? moduleFilter[0] : "command-center");
  const [moduleData, setModuleData]       = useState({});
  const [syncing, setSyncing]             = useState(new Set());
  const [syncingAll, setSyncingAll]       = useState(false);
  const [loadingNotion, setLoadingNotion] = useState(true);
  const [syncLog, setSyncLog]             = useState([]);
  const [showLog, setShowLog]             = useState(true);
  const [lastGlobalSync, setLastGlobalSync] = useState(null);

  // Font injection
  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
      * { box-sizing: border-box; }
      body { margin: 0; background: #0d0a1e; }
      ::-webkit-scrollbar { width: 4px; height: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 4px; }
      @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
      @keyframes fadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
      .module-item:hover { background: rgba(255,255,255,0.06) !important; }
      .list-row:hover { background: rgba(255,255,255,0.04) !important; }
    `;
    document.head.appendChild(s);
    return () => s.remove();
  }, []);

  const addLog = useCallback((msg, type = "info") => {
    setSyncLog(prev => [{ msg, type, time: new Date() }, ...prev].slice(0, 80));
  }, []);

  // ── Load from Notion ─────────────────────────────────────

  const loadFromNotion = useCallback(async () => {
    setLoadingNotion(true);
    addLog("🔌 Connecting to Notion Memory DB…", "info");
    try {
      const prompt = `Use the Notion MCP to query the database at this URL: ${NOTION_DB_URL}
Fetch all pages in the database. For each row, extract:
- "Module" (title property)
- "Data" (rich text property - this is a JSON string)
- "Status" (select property)
- "Last Synced" (date property)
- "Stale After (hrs)" (number property)
- "Sync Count" (number property)

Return ONLY a raw JSON object (no markdown, no explanation):
{"modules":[{"module":"command-center","data":{},"status":"⬜ Never Synced","lastSynced":null,"staleAfterHrs":4,"syncCount":0}]}

For the "data" field: if it's a non-empty JSON string, parse it to an object. If empty or "{}", use {}.`;

      const text = await callClaude(prompt, ["notion"]);
      const parsed = extractJSON(text);
      if (parsed?.modules) {
        const next = {};
        parsed.modules.forEach(m => {
          let d = m.data;
          if (typeof d === "string") { try { d = JSON.parse(d); } catch { d = {}; } }
          next[m.module] = { data: d || {}, status: m.status, lastSynced: m.lastSynced, staleAfterHrs: m.staleAfterHrs || 4, syncCount: m.syncCount || 0 };
        });
        setModuleData(next);
        const fresh = parsed.modules.filter(m => m.status?.includes("Fresh")).length;
        addLog(`✅ Loaded ${parsed.modules.length} modules (${fresh} fresh) from Notion`, "success");
      } else {
        addLog("⚠️ Could not parse Notion response — starting with empty state", "warn");
      }
    } catch (e) {
      addLog(`❌ Notion load failed: ${e.message}`, "error");
    } finally {
      setLoadingNotion(false);
    }
  }, [addLog]);

  useEffect(() => {
    const cached = localStorage.getItem("gkg-module-data");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Object.keys(parsed).length > 0) {
          setModuleData(parsed);
          const fresh = Object.values(parsed).filter(v => v.status?.includes("Fresh")).length;
          addLog(`📦 Loaded ${Object.keys(parsed).length} modules from local cache (${fresh} fresh)`, "success");
          setLoadingNotion(false);
          return;
        }
      } catch {}
    }
    loadFromNotion();
  }, []);

  useEffect(() => {
    if (Object.keys(moduleData).length > 0) {
      localStorage.setItem("gkg-module-data", JSON.stringify(moduleData));
    }
  }, [moduleData]);

  // ── Write to Notion (background) ─────────────────────────

  const writeToNotion = useCallback(async (key, data, syncCount) => {
    const pageId = NOTION_PAGE_IDS[key];
    if (!pageId) return;
    const today = new Date().toISOString().split("T")[0];
    const prompt = `Use the Notion MCP to update the page with ID "${pageId}":
Set "Data" property to this exact string: ${JSON.stringify(JSON.stringify(data))}
Set "Status" select to "🟢 Fresh"
Set "Last Synced" date to ${today}
Set "Sync Count" number to ${syncCount}
Set "Audit Log" to "2026-03-12 | SYNC | ${key} | claude-sonnet-4-6"
After updating, respond with only: {"success":true}`;
    try {
      await callClaude(prompt, ["notion"]);
    } catch (e) {
      console.warn(`Background Notion write failed for ${key}:`, e.message);
    }
  }, []);

  // ── Sync single module ────────────────────────────────────

  const syncModule = useCallback(async (key) => {
    if (syncing.has(key)) return;
    setSyncing(prev => new Set([...prev, key]));
    const label = MOD[key]?.label || key;
    addLog(`🔄 Syncing ${label}…`, "info");
    try {
      const prompt = getSyncPrompt(key);
      const mcpKeys = MOD[key]?.keys || ["notion"];
      const text = await callClaude(prompt, mcpKeys);
      const parsed = extractJSON(text);
      if (parsed) {
        const prevCount = moduleData[key]?.syncCount || 0;
        const entry = { data: parsed, status: "🟢 Fresh", lastSynced: new Date().toISOString(), staleAfterHrs: moduleData[key]?.staleAfterHrs || 4, syncCount: prevCount + 1 };
        setModuleData(prev => ({ ...prev, [key]: entry }));
        addLog(`✅ ${label} — synced successfully`, "success");
        writeToNotion(key, parsed, prevCount + 1);
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
  }, [syncing, moduleData, addLog, writeToNotion]);

  // ── Sync all ──────────────────────────────────────────────

  const syncAll = useCallback(async () => {
    if (syncingAll) return;
    setSyncingAll(true);
    addLog(`🚀 Full sync started — all ${Object.keys(MOD).length} modules`, "info");
    for (const key of Object.keys(MOD)) {
      await syncModule(key);
      await new Promise(r => setTimeout(r, 300));
    }
    setSyncingAll(false);
    setLastGlobalSync(new Date());
    addLog("🏁 Full sync complete", "success");
  }, [syncingAll, syncModule, addLog]);

  // ── Derived state ─────────────────────────────────────────

  const mod = MOD[selected] || {};
  const { Icon } = mod;
  const mData = moduleData[selected];
  const mStatus = mData?.status || "⬜ Never Synced";
  const mLastSync = mData?.lastSynced;
  const stale = isStale(mLastSync, mData?.staleAfterHrs || 4);
  const isSyncing = syncing.has(selected);
  const anyStale = Object.entries(moduleData).some(([,v]) => isStale(v?.lastSynced, v?.staleAfterHrs || 4));

  // ── Render ────────────────────────────────────────────────

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100dvh", background:T.bg, fontFamily:"'Montserrat',sans-serif", color:T.text, overflow:"hidden" }}>

      {/* TOPBAR */}
      <div style={{ height:56, background:T.topbar, borderBottom:`1px solid ${T.border}`, backdropFilter:"blur(20px)", display:"flex", alignItems:"center", padding:"0 20px", gap:16, flexShrink:0, zIndex:10 }}>
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
          {stale && mLastSync && <span style={{ fontSize:10, color:T.warn, background:T.warn+"22", padding:"2px 6px", borderRadius:4 }}>STALE</span>}
          {!mLastSync && <span style={{ fontSize:10, color:T.muted, background:"rgba(255,255,255,0.06)", padding:"2px 6px", borderRadius:4 }}>NEVER SYNCED</span>}
        </div>

        <div style={{ flex:1 }} />

        {/* Status indicators */}
        {loadingNotion && (
          <div style={{ display:"flex", alignItems:"center", gap:6, color:T.muted, fontSize:12 }}>
            <Spinner size={11} /> Loading from Notion…
          </div>
        )}
        {anyStale && !loadingNotion && (
          <div style={{ display:"flex", alignItems:"center", gap:4, color:T.warn, fontSize:11 }}>
            <AlertCircle size={11} /> Some data is stale
          </div>
        )}
        {lastGlobalSync && (
          <span style={{ color:T.muted, fontSize:11 }}>Last full sync: {timeAgo(lastGlobalSync)}</span>
        )}

        {/* Sync All */}
        <button onClick={syncAll} disabled={syncingAll || loadingNotion} style={{
          background: syncingAll ? T.bgCard : `linear-gradient(135deg,${T.accent},#6d28d9)`,
          border: "none", borderRadius:7, padding:"6px 14px", color:"#fff", fontSize:12, fontWeight:600,
          cursor: (syncingAll||loadingNotion) ? "default" : "pointer",
          display:"flex", alignItems:"center", gap:6, transition:"opacity 0.2s",
          opacity: (syncingAll||loadingNotion) ? 0.6 : 1
        }}>
          {syncingAll ? <Spinner size={12} /> : <RefreshCw size={12} />}
          {syncingAll ? "Syncing All…" : "Sync All"}
        </button>

        {/* Log toggle */}
        <button onClick={() => setShowLog(p=>!p)} style={{ background:"none", border:"none", cursor:"pointer", color:showLog?T.accent:T.muted, padding:4 }}>
          <Activity size={15} />
        </button>

        {/* Reload Notion */}
        <button onClick={loadFromNotion} disabled={loadingNotion} title="Reload from Notion" style={{ background:"none", border:"none", cursor:"pointer", color:T.muted, padding:4 }}>
          {loadingNotion ? <Spinner size={14}/> : <Database size={14}/>}
        </button>
      </div>

      {/* BODY */}
      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

        {/* SIDEBAR */}
        <div style={{ width:210, background:T.sidebar, borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", overflow:"hidden", flexShrink:0 }}>
          <div style={{ flex:1, overflowY:"auto", padding:"12px 8px" }}>
            {visibleGroups.map(g => (
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
                      <span style={{ flex:1, fontSize:12, fontWeight: isSel ? 600 : 400, color: isSel ? T.text : T.muted, truncate:true, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{label}</span>
                      {isSync ? <Spinner size={10}/> : <StatusDot status={mStatus} />}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ padding:"10px 12px", borderTop:`1px solid ${T.border}`, fontSize:10, color:T.muted }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace" }}>Aerchain · $6M ARR</div>
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
            {stale && mLastSync && (
              <div style={{ display:"flex", alignItems:"center", gap:4, color:T.warn, fontSize:11, background:T.warn+"15", padding:"4px 10px", borderRadius:6 }}>
                <AlertCircle size={11} /> Data is stale — sync recommended
              </div>
            )}
            {/* Sources */}
            <div style={{ display:"flex", gap:4 }}>
              {(MOD[selected]?.keys||[]).map(k => (
                <span key={k} style={{ background:T.bgCard, border:`1px solid ${T.border}`, color:T.muted, fontSize:10, padding:"3px 7px", borderRadius:4, fontWeight:500 }}>{k}</span>
              ))}
            </div>
            <SyncBtn onClick={() => syncModule(selected)} loading={isSyncing} size={14}/>
          </div>

          {/* Content */}
          <div style={{ flex:1, overflowY:"auto", padding:20 }}>
            {loadingNotion && !mData ? (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", gap:10, color:T.muted }}>
                <Spinner size={16}/> Loading from Notion Memory DB…
              </div>
            ) : (
              <div style={{ animation:"fadeIn 0.2s ease" }}>
                <ModuleContent
                  moduleKey={selected}
                  data={mData?.data}
                  onSync={() => syncModule(selected)}
                  syncing={isSyncing}
                />
              </div>
            )}
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
                      <div style={{ color:T.muted, fontSize:10, fontFamily:"'JetBrains Mono',monospace", marginTop:1 }}>{entry.time.toLocaleTimeString()}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Module quick-sync strip */}
            <div style={{ padding:"10px", borderTop:`1px solid ${T.border}`, flexShrink:0 }}>
              <div style={{ color:T.muted, fontSize:10, fontWeight:600, letterSpacing:1, marginBottom:8 }}>QUICK SYNC</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                {Object.keys(MOD).map(key => (
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
