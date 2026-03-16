import { useState } from "react";
import {
  Brain, Palette, ExternalLink, Sun, Moon, Monitor, Check,
  HardDrive, FileText, Trash2, RotateCcw, ChevronDown, ChevronRight,
  Download, AlertTriangle, DollarSign
} from "lucide-react";
import { T } from "../lib/theme.js";
import { NOTION_AUDIT_CONFIG, MOD } from "../lib/constants.js";
import { Card } from "../components/Common.jsx";
import { NotionIcon } from "../components/Branding.jsx";

export default function SettingsView({ claudeMemory, onClearMemory, theme, setTheme, savedFiles = {}, trashedFiles = {}, onEmptyAllTrash, onRestoreFile, onPermanentDelete, onEmptyModuleTrash }) {
  const [activeTab, setActiveTab] = useState("memory");
  const [expandedModule, setExpandedModule] = useState(null);
  const [confirmEmptyAll, setConfirmEmptyAll] = useState(false);

  const tabs = [
    { id: "files",   label: "File System"   },
    { id: "memory",  label: "Claude Memory" },
    { id: "theme",   label: "Theme"         },
    { id: "notion",  label: "Notion Audit"  },
    { id: "apis",    label: "API Connections"},
    { id: "supabase",label: "Database"      },
  ];

  const themeOptions = [
    {
      id: "dark",
      name: "Dark Canvas",
      desc: "Glassmorphic dark theme with purple accent orbs. Optimized for low-light environments.",
      icon: Moon,
      colors: ["hsl(265,30%,7%)", "hsl(262,75%,62%)", "rgba(255,255,255,0.04)", "rgba(255,255,255,0.88)"],
      labels: ["Canvas", "Accent", "Surface", "Text"],
    },
    {
      id: "light",
      name: "Soft Lilac",
      desc: "Warm purple-tinted light theme with frosted glass surfaces. Vibrant and expressive.",
      icon: Sun,
      colors: ["hsl(262,30%,92%)", "hsl(262,65%,52%)", "rgba(255,255,255,0.90)", "rgba(0,0,0,0.88)"],
      labels: ["Canvas", "Accent", "Surface", "Text"],
    },
    {
      id: "clean",
      name: "Clean Enterprise",
      desc: "Neutral white surfaces with gray borders. Matches the Aerchain procurement platform.",
      icon: Monitor,
      colors: ["#F8F9FC", "hsl(262,65%,52%)", "#FFFFFF", "#111827"],
      labels: ["Canvas", "Accent", "Surface", "Text"],
    },
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

      {/* File System tab */}
      {activeTab === "files" && (() => {
        const FILE_MODULES = ["pricing-calculator", "proposal-generator", "design-extractor"];
        const moduleStats = FILE_MODULES.map(key => {
          const active = savedFiles[key] || [];
          const trashed = trashedFiles[key] || [];
          const activeSize = JSON.stringify(active).length;
          const trashedSize = JSON.stringify(trashed).length;
          return { key, label: MOD[key]?.label || key, active, trashed, activeSize, trashedSize };
        });
        const totalActive = moduleStats.reduce((sum, m) => sum + m.active.length, 0);
        const totalTrashed = moduleStats.reduce((sum, m) => sum + m.trashed.length, 0);
        const totalSize = moduleStats.reduce((sum, m) => sum + m.activeSize + m.trashedSize, 0);

        const fmtSize = (bytes) => bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;

        const moduleIcons = {
          "pricing-calculator": DollarSign,
          "proposal-generator": FileText,
          "design-extractor": Palette,
        };

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Summary card */}
            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <HardDrive size={13} color={T.accent} />
                <span style={{ fontSize: 12, fontWeight: 600 }}>File System Overview</span>
                <div style={{ flex: 1 }} />
                {totalTrashed > 0 && (
                  confirmEmptyAll ? (
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      <span style={{ fontSize: 10, color: T.error, fontWeight: 600 }}>Delete all trash permanently?</span>
                      <button onClick={() => { onEmptyAllTrash && onEmptyAllTrash(); setConfirmEmptyAll(false); }} style={{
                        background: T.error, border: "none", borderRadius: 5, padding: "3px 10px",
                        color: "#fff", fontSize: 10, fontWeight: 600, cursor: "pointer",
                      }}>Yes, empty all</button>
                      <button onClick={() => setConfirmEmptyAll(false)} style={{
                        background: "none", border: `1px solid ${T.border}`, borderRadius: 5, padding: "3px 10px",
                        color: T.muted, fontSize: 10, cursor: "pointer",
                      }}>Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmEmptyAll(true)} style={{
                      display: "flex", alignItems: "center", gap: 4,
                      background: "none", border: `1px solid rgba(239,68,68,0.3)`,
                      borderRadius: 6, padding: "4px 10px",
                      color: T.error, fontSize: 10, fontWeight: 500, cursor: "pointer",
                    }}>
                      <Trash2 size={10} /> Empty All Trash ({totalTrashed})
                    </button>
                  )
                )}
              </div>

              {/* Summary stats */}
              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                {[
                  { label: "Active Files", value: totalActive, color: T.success },
                  { label: "In Trash", value: totalTrashed, color: T.error },
                  { label: "Total Size", value: fmtSize(totalSize), color: T.accent },
                ].map((stat, i) => (
                  <div key={i} style={{
                    flex: 1, padding: "12px 14px", borderRadius: 10,
                    background: T.bgCard, border: `1px solid ${T.border}`,
                    textAlign: "center",
                  }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: T.muted, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Module breakdown table */}
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 11 }}>
                <thead>
                  <tr>
                    {["Module", "Active", "Trashed", "Size"].map(h => (
                      <th key={h} style={{
                        textAlign: "left", padding: "8px 10px", fontSize: 9, fontWeight: 700,
                        letterSpacing: 0.8, color: T.muted, borderBottom: `1px solid ${T.border}`,
                        textTransform: "uppercase",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {moduleStats.map(m => {
                    const MIcon = moduleIcons[m.key] || FileText;
                    const isExpanded = expandedModule === m.key;
                    return [
                      <tr key={m.key} onClick={() => setExpandedModule(isExpanded ? null : m.key)}
                        style={{ cursor: "pointer", background: isExpanded ? T.accentBg : "transparent" }}
                        className="table-row"
                      >
                        <td style={{ padding: "10px 10px", borderBottom: `1px solid ${T.border}`, fontWeight: 600, color: T.text }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {isExpanded ? <ChevronDown size={10} color={T.muted} /> : <ChevronRight size={10} color={T.muted} />}
                            <MIcon size={12} color={T.accent} />
                            {m.label}
                          </div>
                        </td>
                        <td style={{ padding: "10px 10px", borderBottom: `1px solid ${T.border}` }}>
                          <span style={{ color: T.success, fontWeight: 600 }}>{m.active.length}</span>
                        </td>
                        <td style={{ padding: "10px 10px", borderBottom: `1px solid ${T.border}` }}>
                          <span style={{ color: m.trashed.length > 0 ? T.error : T.muted, fontWeight: 600 }}>{m.trashed.length}</span>
                        </td>
                        <td style={{ padding: "10px 10px", borderBottom: `1px solid ${T.border}`, color: T.muted, fontFamily: "monospace", fontSize: 10 }}>
                          {fmtSize(m.activeSize + m.trashedSize)}
                        </td>
                      </tr>,
                      // Expanded detail rows
                      isExpanded && (
                        <tr key={`${m.key}-detail`}>
                          <td colSpan={4} style={{ padding: 0, borderBottom: `1px solid ${T.border}` }}>
                            <div style={{ padding: "8px 16px 12px 32px", background: T.bgCard }}>
                              {/* Active files */}
                              {m.active.length > 0 && (
                                <div style={{ marginBottom: 8 }}>
                                  <div style={{ fontSize: 9, fontWeight: 700, color: T.success, letterSpacing: 0.8, marginBottom: 4, textTransform: "uppercase" }}>Active Files</div>
                                  {m.active.map(f => (
                                    <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 11 }}>
                                      <FileText size={10} color={T.muted} />
                                      <span style={{ flex: 1, color: T.text, fontWeight: 500 }}>{f.name}</span>
                                      <span style={{
                                        fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 3,
                                        background: (f.status || "").toLowerCase().includes("draft") ? "rgba(245,158,11,0.12)" : "rgba(16,185,129,0.12)",
                                        color: (f.status || "").toLowerCase().includes("draft") ? T.warn : T.success,
                                      }}>{f.status || "—"}</span>
                                      <span style={{ fontSize: 10, color: T.muted, fontFamily: "monospace" }}>{fmtSize(JSON.stringify(f).length)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {/* Trashed files */}
                              {m.trashed.length > 0 && (
                                <div>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                    <span style={{ fontSize: 9, fontWeight: 700, color: T.error, letterSpacing: 0.8, textTransform: "uppercase" }}>Trashed Files</span>
                                    <div style={{ flex: 1 }} />
                                    <button onClick={(e) => { e.stopPropagation(); onEmptyModuleTrash && onEmptyModuleTrash(m.key); }} style={{
                                      background: "none", border: `1px solid rgba(239,68,68,0.2)`, borderRadius: 4, padding: "1px 6px",
                                      color: T.error, fontSize: 9, cursor: "pointer",
                                    }}>Empty</button>
                                  </div>
                                  {m.trashed.map(f => (
                                    <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 11, opacity: 0.7 }}>
                                      <Trash2 size={10} color={T.error} />
                                      <span style={{ flex: 1, color: T.muted }}>{f.name}</span>
                                      <button onClick={(e) => { e.stopPropagation(); onRestoreFile && onRestoreFile(m.key, f.id); }} title="Restore" style={{
                                        background: "none", border: "none", cursor: "pointer", padding: 2, color: T.success, display: "flex",
                                      }}>
                                        <RotateCcw size={11} />
                                      </button>
                                      <button onClick={(e) => { e.stopPropagation(); onPermanentDelete && onPermanentDelete(m.key, f.id); }} title="Delete forever" style={{
                                        background: "none", border: "none", cursor: "pointer", padding: 2, color: T.error, display: "flex",
                                      }}>
                                        <Trash2 size={11} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {m.active.length === 0 && m.trashed.length === 0 && (
                                <div style={{ color: T.muted, fontSize: 11, padding: "6px 0" }}>No files in this module</div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ),
                    ];
                  })}
                </tbody>
              </table>
            </Card>

            {/* Export all */}
            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Download size={13} color={T.accent} />
                <span style={{ fontSize: 12, fontWeight: 600 }}>Export All Files</span>
                <div style={{ flex: 1 }} />
                <button onClick={() => {
                  const blob = new Blob([JSON.stringify({ savedFiles, trashedFiles }, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url; a.download = `aerchain-files-backup-${new Date().toISOString().slice(0,10)}.json`; a.click();
                  URL.revokeObjectURL(url);
                }} style={{
                  display: "flex", alignItems: "center", gap: 5,
                  background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "5px 12px",
                  color: T.text, fontSize: 11, fontWeight: 500, cursor: "pointer",
                }}>
                  <Download size={11} /> Download Backup JSON
                </button>
              </div>
              <div style={{ color: T.muted, fontSize: 11, marginTop: 6 }}>
                Exports all active and trashed files across every module as a single JSON file.
              </div>
            </Card>
          </div>
        );
      })()}

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

      {/* Theme tab */}
      {activeTab === "theme" && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <Card>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
              <Palette size={13} color={T.accent} />
              <span style={{ fontSize:12, fontWeight:600 }}>Appearance</span>
            </div>
            <div style={{ color:T.muted, fontSize:12, marginBottom:16 }}>
              Choose a visual theme. This affects colors, surfaces, and shadows. Layout and structure stay the same.
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {themeOptions.map(opt => {
                const Icon = opt.icon;
                const isSel = theme === opt.id;
                return (
                  <div key={opt.id} onClick={() => setTheme(opt.id)} style={{
                    display:"flex", alignItems:"center", gap:14,
                    padding:"14px 16px", borderRadius:10, cursor:"pointer",
                    background: isSel ? T.accentBg : T.bgCard,
                    border: `1px solid ${isSel ? T.borderAcc : T.border}`,
                    transition:"all 0.15s",
                  }}>
                    <div style={{
                      width:20, height:20, borderRadius:"50%", flexShrink:0,
                      border: isSel ? "none" : `2px solid ${T.border}`,
                      background: isSel ? T.accent : "transparent",
                      display:"flex", alignItems:"center", justifyContent:"center",
                    }}>
                      {isSel && <Check size={12} color="white" strokeWidth={3} />}
                    </div>
                    <div style={{
                      width:36, height:36, borderRadius:8, flexShrink:0,
                      background: T.accentBg,
                      display:"flex", alignItems:"center", justifyContent:"center",
                    }}>
                      <Icon size={16} color={T.accent} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:2 }}>{opt.name}</div>
                      <div style={{ fontSize:11, color:T.muted, lineHeight:1.4 }}>{opt.desc}</div>
                    </div>
                    <div style={{ display:"flex", gap:4, flexShrink:0 }}>
                      {opt.colors.map((c, i) => (
                        <div key={i} style={{ textAlign:"center" }}>
                          <div style={{
                            width:24, height:24, borderRadius:6,
                            background:c, border:`1px solid ${T.border}`,
                          }} />
                          <div style={{ fontSize:8, color:T.mutedSoft, marginTop:2 }}>{opt.labels[i]}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <div style={{ fontSize:11, color:T.muted, lineHeight:1.6 }}>
              <strong style={{ color:T.text }}>Tip:</strong> You can also toggle themes quickly using the{" "}
              {theme === "dark" ? <Sun size={10} style={{ verticalAlign:"middle" }} /> : theme === "light" ? <Monitor size={10} style={{ verticalAlign:"middle" }} /> : <Moon size={10} style={{ verticalAlign:"middle" }} />}
              {" "}button in the top bar. It cycles through Dark → Light → Clean.
            </div>
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
              { name:"Claude (Anthropic)", envKey:"ANTHROPIC_API_KEY",  status:"configured", note:"Server-side via /api/ routes" },
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
