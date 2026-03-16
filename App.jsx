import { useState, useEffect, useCallback, useRef } from "react";
import {
  RefreshCw, AlertCircle, Clock,
  Activity, X,
  Wand2, Download, Settings, Sun, Moon, Monitor, Link
} from "lucide-react";
// ── Lib imports ──────────────────────────────────────────
import { UPLOAD_MODULES, GROUPS, MOD, getSyncPrompt } from "./lib/constants.js";
import { extractJSON, isStale, safePersist, timeAgo } from "./lib/utils.js";
import { callClaude, createNotionAuditEntry, processWithClaude } from "./lib/api.js";
import { T, buildThemeStylesheet } from "./lib/theme.js";
import { SEED_DESIGN_FILES } from "./lib/seedDesignFiles.js";
import {
  loadModuleData as sbLoadModules, saveAllModuleData as sbSaveModules,
  loadSavedFiles as sbLoadFiles, saveAllFiles as sbSaveFiles, saveFile as sbSaveFile, deleteFileFromDB as sbDeleteFile,
  loadTrashedFiles as sbLoadTrashed, saveAllTrashedFiles as sbSaveTrashed,
  trashFile as sbTrashFile, restoreFileFromTrash as sbRestoreFile,
  permanentDeleteFile as sbPermanentDelete, emptyModuleTrashDB as sbEmptyModuleTrash, emptyAllTrashDB as sbEmptyAllTrash,
  loadClaudeMemory as sbLoadMemory, saveClaudeMemoryEntry as sbSaveMemEntry, clearClaudeMemoryDB as sbClearMemory,
  writeSyncLog as sbWriteLog,
} from "./lib/supabase.js";

// ── Component imports ────────────────────────────────────
import { StatusDot, Spinner, SyncBtn } from "./components/Common.jsx";
import { AerchainLogo, NotionAuditLink } from "./components/Branding.jsx";
import { ModuleErrorBoundary, ModuleContent } from "./components/ModuleRouter.jsx";

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
  // Demo toggle removed — data lives in Supabase
  const [theme, setTheme]               = useState("dark");
  const [claudeMemory, setClaudeMemory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("aerchain-claude-memory") || "[]"); } catch { return []; }
  });
  const notionSyncTimerRef = useRef(null);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [processing, setProcessing] = useState(new Set());
  const [savedFiles, setSavedFiles] = useState(() => {
    try { return JSON.parse(localStorage.getItem("aerchain-saved-files") || "{}"); } catch { return {}; }
  });
  // Always-current ref used by beforeunload to avoid stale-closure writes
  const savedFilesRef = useRef(savedFiles);
  const [trashedFiles, setTrashedFiles] = useState(() => {
    try { return JSON.parse(localStorage.getItem("aerchain-trashed-files") || "{}"); } catch { return {}; }
  });
  const trashedFilesRef = useRef(trashedFiles);
  const [referenceTokens, setReferenceTokens] = useState(null);
  const [extractorCache, setExtractorCache] = useState(null);

  // Dark Canvas v3 theme + font injection
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = buildThemeStylesheet();
    document.head.appendChild(s);
    return () => s.remove();
  }, []);

  const addLog = useCallback((msg, type = "info") => {
    setSyncLog(prev => [{ msg, type, time: new Date() }, ...prev].slice(0, 80));
  }, []);

  // ── Load data (Supabase → localStorage fallback) ────────

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Try Supabase first
      const [sbMods, sbFiles, sbTrashed, sbMem] = await Promise.all([
        sbLoadModules(), sbLoadFiles(), sbLoadTrashed(), sbLoadMemory(),
      ]);
      if (cancelled) return;

      if (sbMods && Object.keys(sbMods).length > 0) {
        setModuleData(sbMods);
        const fresh = Object.values(sbMods).filter(v => v.status?.includes("Fresh")).length;
        addLog(`☁️ Loaded ${Object.keys(sbMods).length} modules from Supabase (${fresh} fresh)`, "success");
      } else {
        // Fall back to localStorage
        const cached = localStorage.getItem("aerchain-module-data");
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Object.keys(parsed).length > 0) {
              setModuleData(parsed);
              const fresh = Object.values(parsed).filter(v => v.status?.includes("Fresh")).length;
              addLog(`📦 Loaded ${Object.keys(parsed).length} modules from cache (${fresh} fresh)`, "success");
            }
          } catch { /* corrupted cache */ }
        }
      }

      if (sbFiles && Object.keys(sbFiles).length > 0) {
        setSavedFiles(sbFiles);
      } else {
        // Fall back to localStorage
        const cachedFiles = localStorage.getItem("aerchain-saved-files");
        if (cachedFiles) {
          try {
            const parsed = JSON.parse(cachedFiles);
            if (Object.keys(parsed).length > 0) {
              setSavedFiles(parsed);
            }
          } catch { /* corrupted cache */ }
        }
      }
      // Load trashed files
      if (sbTrashed && Object.keys(sbTrashed).length > 0) {
        setTrashedFiles(sbTrashed);
      } else {
        const cachedTrash = localStorage.getItem("aerchain-trashed-files");
        if (cachedTrash) {
          try {
            const parsed = JSON.parse(cachedTrash);
            if (Object.keys(parsed).length > 0) setTrashedFiles(parsed);
          } catch { /* corrupted cache */ }
        }
      }

      // Inject seed design files if they haven't been added yet
      setSavedFiles(prev => {
        const existing = prev["design-extractor"] || [];
        const existingIds = new Set(existing.map(f => f.id));
        const missing = SEED_DESIGN_FILES.filter(f => !existingIds.has(f.id));
        if (missing.length === 0) return prev;
        return { ...prev, "design-extractor": [...existing, ...missing] };
      });

      if (sbMem) setClaudeMemory(sbMem);
    })();
    return () => { cancelled = true; };
  }, []);

  // Persist moduleData to localStorage + Supabase on every change (debounced)
  useEffect(() => {
    const id = setTimeout(() => {
      safePersist("aerchain-module-data", moduleData);
      sbSaveModules(moduleData);
    }, 500);
    return () => clearTimeout(id);
  }, [moduleData]);

  // Keep refs current so beforeunload always flushes the latest value
  useEffect(() => { savedFilesRef.current = savedFiles; }, [savedFiles]);
  useEffect(() => { trashedFilesRef.current = trashedFiles; }, [trashedFiles]);

  // Persist savedFiles to localStorage + Supabase (debounced)
  useEffect(() => {
    const id = setTimeout(() => {
      safePersist("aerchain-saved-files", savedFiles);
      sbSaveFiles(savedFiles);
    }, 500);
    return () => clearTimeout(id);
  }, [savedFiles]);

  // Persist trashedFiles to localStorage + Supabase (debounced)
  useEffect(() => {
    const id = setTimeout(() => {
      safePersist("aerchain-trashed-files", trashedFiles);
      sbSaveTrashed(trashedFiles);
    }, 500);
    return () => clearTimeout(id);
  }, [trashedFiles]);

  // Flush pending writes on tab close
  useEffect(() => {
    const flush = () => {
      safePersist("aerchain-module-data", moduleData);
      safePersist("aerchain-saved-files", savedFilesRef.current);
      safePersist("aerchain-trashed-files", trashedFilesRef.current);
    };
    window.addEventListener("beforeunload", flush);
    return () => window.removeEventListener("beforeunload", flush);
  }, [moduleData]);

  // ── File management callbacks ──────────────────────────
  const getModuleFiles = useCallback((moduleKey) => {
    return savedFiles[moduleKey] || [];
  }, [savedFiles]);

  const createFile = useCallback((moduleKey) => {
    const id = `${moduleKey.slice(0,2)}-${Date.now()}`;
    const now = new Date().toISOString();
    const newFile = { id, name: "Untitled", description: "", status: "draft", createdAt: now, updatedAt: now, tags: [], data: {} };
    setSavedFiles(prev => ({ ...prev, [moduleKey]: [...(prev[moduleKey] || []), newFile] }));
    addLog(`📄 New file created in ${MOD[moduleKey]?.label || moduleKey}`, "info");
  }, [addLog]);

  const duplicateFile = useCallback((moduleKey, file) => {
    const id = `${moduleKey.slice(0,2)}-${Date.now()}`;
    const now = new Date().toISOString();
    const copy = { ...file, id, name: `${file.name} (Copy)`, status: "draft", createdAt: now, updatedAt: now };
    setSavedFiles(prev => ({ ...prev, [moduleKey]: [...(prev[moduleKey] || []), copy] }));
    addLog(`📄 Duplicated "${file.name}" in ${MOD[moduleKey]?.label || moduleKey}`, "info");
  }, [addLog]);

  // Soft-delete: move file to trash
  const deleteFile = useCallback((moduleKey, fileId) => {
    setSavedFiles(prev => {
      const files = prev[moduleKey] || [];
      const file = files.find(f => f.id === fileId);
      if (file) {
        const trashedFile = { ...file, trashedAt: new Date().toISOString() };
        setTrashedFiles(tp => ({ ...tp, [moduleKey]: [...(tp[moduleKey] || []), trashedFile] }));
        sbTrashFile(moduleKey, trashedFile);
      }
      return { ...prev, [moduleKey]: files.filter(f => f.id !== fileId) };
    });
    addLog(`🗑 File moved to trash in ${MOD[moduleKey]?.label || moduleKey}`, "info");
  }, [addLog]);

  // Restore a file from trash back to active
  const restoreFile = useCallback((moduleKey, fileId) => {
    setTrashedFiles(prev => {
      const files = prev[moduleKey] || [];
      const file = files.find(f => f.id === fileId);
      if (file) {
        const { trashedAt, ...restored } = file;
        restored.updatedAt = new Date().toISOString();
        setSavedFiles(sp => ({ ...sp, [moduleKey]: [...(sp[moduleKey] || []), restored] }));
        sbRestoreFile(moduleKey, file);
      }
      return { ...prev, [moduleKey]: files.filter(f => f.id !== fileId) };
    });
    addLog(`♻️ File restored from trash in ${MOD[moduleKey]?.label || moduleKey}`, "success");
  }, [addLog]);

  // Permanently delete a file from trash
  const permanentlyDeleteFile = useCallback((moduleKey, fileId) => {
    setTrashedFiles(prev => ({
      ...prev,
      [moduleKey]: (prev[moduleKey] || []).filter(f => f.id !== fileId)
    }));
    sbPermanentDelete(fileId);
    addLog(`💀 File permanently deleted from ${MOD[moduleKey]?.label || moduleKey}`, "warn");
  }, [addLog]);

  // Empty all trash for a specific module
  const emptyModuleTrash = useCallback((moduleKey) => {
    setTrashedFiles(prev => ({ ...prev, [moduleKey]: [] }));
    sbEmptyModuleTrash(moduleKey);
    addLog(`🗑 Trash emptied for ${MOD[moduleKey]?.label || moduleKey}`, "info");
  }, [addLog]);

  // Empty all trash across all modules
  const emptyAllTrash = useCallback(() => {
    setTrashedFiles({});
    sbEmptyAllTrash();
    addLog(`🗑 All trash emptied`, "info");
  }, [addLog]);

  const getModuleTrash = useCallback((moduleKey) => {
    return trashedFiles[moduleKey] || [];
  }, [trashedFiles]);

  // ── Claude Memory ────────────────────────────────────────

  const logClaudeInteraction = useCallback((module, prompt, response) => {
    const entry = { module, prompt, response, timestamp: new Date().toISOString() };
    setClaudeMemory(prev => {
      const updated = [...prev, entry].slice(-200);
      safePersist("aerchain-claude-memory", updated);
      return updated;
    });
    sbSaveMemEntry(entry);
  }, []);

  const clearClaudeMemory = useCallback(() => {
    setClaudeMemory([]);
    localStorage.removeItem("aerchain-claude-memory");
    sbClearMemory();
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
      const entry = {
        timestamp: new Date().toISOString(),
        action: "PERIODIC_SYNC",
        modules: Object.keys(moduleData),
        summary: `Periodic Notion audit log sync — ${Object.keys(moduleData).length} modules`,
        refs: [],
      };
      let existing = [];
      try { existing = JSON.parse(localStorage.getItem("aerchain-notion-audit") || "[]"); } catch { /* corrupted — reset */ }
      const updated = [entry, ...existing].slice(0, 100);
      safePersist("aerchain-notion-audit", updated);

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

    notionSyncTimerRef.current = setInterval(doNotionSync, 30 * 60 * 1000);
    return () => clearInterval(notionSyncTimerRef.current);
  }, [moduleData, addLog]);

  // ── Sync single module ────────────────────────────────────

  const syncModule = useCallback(async (key) => {
    if (key === "settings") return;
    if (UPLOAD_MODULES.has(key)) return;
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

  // ── Generate self-contained HTML from live app ──────────

  const generateStandaloneHTML = useCallback((title, filename) => {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";

    const styleContent = Array.from(document.querySelectorAll("style"))
      .map(s => s.textContent).join("\n");

    const computedStyle = getComputedStyle(document.documentElement);
    const cssVars = [
      "canvas","primary","accent","gp","green","amber","red",
      "glass-1","glass-2","glass-border","fg","fg2","fg3","logo-fg",
      "active-bg","accent-bg","accent-border","divider","badge-bg",
      "topbar-bg","sidebar-bg","orb-1","orb-2",
      "s-glass","s-elevated","s-glow"
    ].map(v => {
      const val = computedStyle.getPropertyValue(`--${v}`).trim();
      return val ? `  --${v}: ${val};` : "";
    }).filter(Boolean).join("\n");

    const appHTML = document.getElementById("root").innerHTML;

    const html = `<!DOCTYPE html>
<html lang="en" data-theme="${currentTheme}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — ${currentTheme} theme — ${new Date().toISOString().slice(0,10)}</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
/* Computed theme vars (frozen at export time) */
:root[data-theme="${currentTheme}"] {
${cssVars}
}

/* App styles */
${styleContent}

/* Ensure static rendering works */
body { margin: 0; padding: 0; }
[style*="animation"] { animation: none !important; }
</style>
</head>
<body>
<div id="root">${appHTML}</div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const downloadSnapshot = useCallback(() => {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
    const filename = `aerchain-salesos-${currentTheme}-${new Date().toISOString().slice(0,10)}.html`;
    generateStandaloneHTML("Aerchain · SalesOS", filename);
  }, [generateStandaloneHTML]);

  const downloadPrototype = useCallback(() => {
    generateStandaloneHTML(
      "Aerchain · SalesOS Prototype",
      `aerchain-prototype-${new Date().toISOString().slice(0,10)}.html`
    );
  }, [generateStandaloneHTML]);

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
    <div style={{ display:"flex", flexDirection:"column", height:"100dvh", background:T.bg, fontFamily:"'Montserrat',sans-serif", color:T.text, overflow:"hidden", position:"relative" }}>

      {/* Animated background orbs */}
      <div style={{ position:"absolute", width:700, height:700, top:-200, right:-150, background:"var(--orb-1)", borderRadius:"50%", pointerEvents:"none", animation:"orbA 20s ease-in-out infinite alternate", zIndex:0 }} />
      <div style={{ position:"absolute", width:550, height:550, bottom:-180, left:-80, background:"var(--orb-2)", borderRadius:"50%", pointerEvents:"none", animation:"orbB 26s ease-in-out infinite alternate-reverse", zIndex:0 }} />

      {/* TOPBAR */}
      <div className="glass-topbar" style={{ height:54, display:"flex", alignItems:"center", padding:"0 20px", gap:16, flexShrink:0, zIndex:10, position:"relative" }}>
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
          <AerchainLogo height={18} />
          <div style={{ width:1, height:18, background:T.divider, margin:"0 2px" }} />
          <div style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:10, fontWeight:500, letterSpacing:"0.12em", textTransform:"uppercase", color:T.muted, padding:"3px 9px", background:T.accentBg, border:`1px solid ${T.borderAcc}`, borderRadius:6 }}>
            <span style={{ width:5, height:5, borderRadius:"50%", background:T.accent, boxShadow:`0 0 6px ${T.accent}`, display:"inline-block" }} />
            {appName}
          </div>
        </div>

        {/* Current module */}
        <div style={{ height:20, width:1, background:T.divider, margin:"0 -4px" }} />
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          {Icon && <Icon size={13} color={T.accent} />}
          <span style={{ fontSize:13, fontWeight:500 }}>{mod.label}</span>
          {selected !== "settings" && stale && mLastSync && <span style={{ fontSize:10, color:T.warn, background:T.badgeBg, padding:"2px 6px", borderRadius:4 }}>STALE</span>}
          {selected !== "settings" && !mLastSync && <span style={{ fontSize:10, color:T.muted, background:T.badgeBg, padding:"2px 6px", borderRadius:4 }}>NEVER SYNCED</span>}
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
          background: syncingAll ? T.bgCard : "var(--gp)",
          border: "none", borderRadius:8, padding:"6px 12px", color:"#fff", fontSize:12, fontWeight:600,
          cursor: syncingAll ? "default" : "pointer",
          display:"flex", alignItems:"center", gap:4, transition:"opacity 0.2s",
          opacity: syncingAll ? 0.6 : 1, boxShadow: syncingAll ? "none" : "var(--s-glow)"
        }}>
          {syncingAll ? <Spinner size={12} /> : <RefreshCw size={12} />}
          {syncingAll ? "Syncing All…" : "Sync All"}
        </button>

        {/* Demo toggle removed — data lives in Supabase */}

        {/* Download app snapshot */}
        <button className="icon-btn" onClick={downloadSnapshot} title="Download app snapshot as HTML">
          <Download size={14} />
        </button>

        {/* Download standalone prototype */}
        <button onClick={downloadPrototype} title="Download standalone prototype HTML" style={{
          background:"none", border:`1px solid ${T.border}`, borderRadius:8,
          cursor:"pointer", color:T.muted, padding:"6px 12px", fontSize:10, fontWeight:500,
          display:"flex", alignItems:"center", gap:4, transition:"color 0.15s"
        }}>
          <Link size={11} /> Prototype
        </button>

        <div style={{ width:1, height:18, background:T.divider, margin:"0 -4px" }} />

        {/* Log toggle */}
        <button className="icon-btn" onClick={() => setShowLog(p=>!p)} style={{ color:showLog?T.accent:undefined }}>
          <Activity size={14} />
        </button>

        {/* Theme toggle */}
        <button className="icon-btn" onClick={() => setTheme(t => t === "dark" ? "light" : t === "light" ? "clean" : "dark")} title={`Theme: ${theme}`}>
          {theme === "dark" ? <Sun size={14} /> : theme === "light" ? <Monitor size={14} /> : <Moon size={14} />}
        </button>

        {/* Settings gear */}
        <button className="icon-btn" onClick={() => setSelected("settings")} title="Settings" style={{
          background: selected==="settings" ? T.accentBg : undefined,
          border: selected==="settings" ? `1px solid ${T.borderAcc}` : undefined,
          borderRadius:6, color: selected==="settings" ? T.accent : undefined,
        }}>
          <Settings size={14} />
        </button>
      </div>

      {/* Demo banner removed — data lives in Supabase */}

      {/* BODY */}
      <div style={{ display:"flex", flex:1, overflow:"hidden", position:"relative", zIndex:1 }}>

        {/* SIDEBAR */}
        <div className="glass-sidebar" style={{ width:200, display:"flex", flexDirection:"column", overflow:"hidden", flexShrink:0, zIndex:2 }}>

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
            {selected !== "settings" && selected !== "design-extractor" && !UPLOAD_MODULES.has(selected) && <SyncBtn onClick={() => syncModule(selected)} loading={isSyncing} size={14}/>}
          </div>

          {/* Content */}
          <div style={{ flex:1, overflowY:"auto", padding:20 }}>
            <div style={{ animation:"fadeIn 0.2s ease" }}>
              <ModuleErrorBoundary moduleKey={selected}>
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
                  theme={theme}
                  setTheme={setTheme}
                  moduleFiles={getModuleFiles(selected)}
                  onCreateFile={() => createFile(selected)}
                  onDuplicateFile={(file) => duplicateFile(selected, file)}
                  onDeleteFile={(fileId) => deleteFile(selected, fileId)}
                  trashedFiles={getModuleTrash(selected)}
                  onRestoreFile={(fileId) => restoreFile(selected, fileId)}
                  onPermanentDelete={(fileId) => permanentlyDeleteFile(selected, fileId)}
                  onEmptyTrash={() => emptyModuleTrash(selected)}
                  allSavedFiles={savedFiles}
                  allTrashedFiles={trashedFiles}
                  onEmptyAllTrash={emptyAllTrash}
                  onRestoreFileGlobal={restoreFile}
                  onPermanentDeleteGlobal={permanentlyDeleteFile}
                  onEmptyModuleTrash={emptyModuleTrash}
                  referenceTokens={referenceTokens}
                  onSaveToLibrary={(file) => setSavedFiles(prev => ({ ...prev, "design-extractor": [...(prev["design-extractor"] || []), file] }))}
                  onLoadReference={(file) => setReferenceTokens(file.tokens)}
                  extractorCache={extractorCache}
                  setExtractorCache={setExtractorCache}
                />
              </ModuleErrorBoundary>
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
        background:T.accentBg, border:`1px solid ${T.borderAcc}`,
        backdropFilter:"blur(12px)", borderRadius:8, padding:"6px 12px",
        boxShadow:"var(--s-glow)",
      }}>
        <Wand2 size={14} color={T.accent} />
        <span style={{ fontSize:11, fontWeight:600, letterSpacing:"0.08em", color:T.accent }}>Lumos</span>
      </div>

      {/* GLOBAL SYNC OVERLAY */}
      {syncingAll && (
        <div className="glass-surface" style={{ position:"fixed", bottom:20, left:"50%", transform:"translateX(-50%)", borderRadius:12, padding:"12px 20px", display:"flex", alignItems:"center", gap:12, zIndex:100, boxShadow:"var(--s-elevated)" }}>
          <Spinner size={16}/>
          <div>
            <div style={{ color:T.text, fontSize:13, fontWeight:600 }}>Syncing all modules…</div>
            <div style={{ color:T.muted, fontSize:11 }}>{syncing.size} active · {Object.values(moduleData).filter(m=>m?.status?.includes("Fresh")).length} complete</div>
          </div>
          <div style={{ width:120, height:4, background:T.bgCard, borderRadius:4, overflow:"hidden" }}>
            <div style={{ height:"100%", background:"var(--gp)", borderRadius:4, width: `${(Object.values(moduleData).filter(m=>m?.status?.includes("Fresh")).length/Object.keys(MOD).length)*100}%`, transition:"width 0.5s" }}/>
          </div>
        </div>
      )}
    </div>
  );
}
