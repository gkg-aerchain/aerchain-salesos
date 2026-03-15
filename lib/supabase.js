import { supabase } from "../supabaseClient.js";

// ── Supabase data layer ─────────────────────────────────
// All functions return null when supabase client is unavailable,
// allowing localStorage fallback in App.jsx.

// ── Module Data ──────────────────────────────────────────

/** Load all module data rows → { [module_key]: { data, status, ... } } */
export async function loadModuleData() {
  if (!supabase) return null;
  const { data, error } = await supabase.from("modules").select("*");
  if (error) { console.warn("Supabase loadModuleData:", error.message); return null; }
  const result = {};
  for (const row of data) {
    if (row.data && Object.keys(row.data).length > 0) {
      result[row.module_key] = {
        data: row.data,
        status: row.status || "⬜ Never Synced",
        lastSynced: row.last_synced,
        staleAfterHrs: row.stale_after_hrs || 4,
        syncCount: row.sync_count || 0,
      };
    }
  }
  return Object.keys(result).length > 0 ? result : null;
}

/** Upsert a single module's data */
export async function saveModuleData(moduleKey, entry) {
  if (!supabase) return;
  const { error } = await supabase.from("modules").upsert({
    module_key: moduleKey,
    data: entry.data || {},
    status: entry.status || "⬜ Never Synced",
    last_synced: entry.lastSynced || null,
    stale_after_hrs: entry.staleAfterHrs || 4,
    sync_count: entry.syncCount || 0,
  }, { onConflict: "module_key" });
  if (error) console.warn("Supabase saveModuleData:", error.message);
}

/** Bulk-save all module data (used by debounced persist) */
export async function saveAllModuleData(moduleData) {
  if (!supabase) return;
  const rows = Object.entries(moduleData).map(([key, entry]) => ({
    module_key: key,
    data: entry?.data || {},
    status: entry?.status || "⬜ Never Synced",
    last_synced: entry?.lastSynced || null,
    stale_after_hrs: entry?.staleAfterHrs || 4,
    sync_count: entry?.syncCount || 0,
  }));
  if (rows.length === 0) return;
  const { error } = await supabase.from("modules").upsert(rows, { onConflict: "module_key" });
  if (error) console.warn("Supabase saveAllModuleData:", error.message);
}

// ── Saved Files ──────────────────────────────────────────

/** Load all saved files → { [module_key]: [...files] } */
export async function loadSavedFiles() {
  if (!supabase) return null;
  const { data, error } = await supabase.from("saved_files").select("*").order("created_at", { ascending: true });
  if (error) { console.warn("Supabase loadSavedFiles:", error.message); return null; }
  const result = {};
  for (const row of data) {
    if (!result[row.module_key]) result[row.module_key] = [];
    result[row.module_key].push({
      id: row.file_id,
      name: row.name,
      description: row.description || "",
      status: row.status || "draft",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      tags: row.tags || [],
      data: row.data || {},
      tokens: row.tokens || undefined,
    });
  }
  return Object.keys(result).length > 0 ? result : null;
}

/** Save a single file (upsert by module_key + file_id) */
export async function saveFile(moduleKey, file) {
  if (!supabase) return;
  const { error } = await supabase.from("saved_files").upsert({
    module_key: moduleKey,
    file_id: file.id,
    name: file.name,
    description: file.description || "",
    status: file.status || "draft",
    tags: file.tags || [],
    data: file.data || {},
    tokens: file.tokens || null,
  }, { onConflict: "module_key,file_id" });
  if (error) console.warn("Supabase saveFile:", error.message);
}

/** Delete a file */
export async function deleteFileFromDB(moduleKey, fileId) {
  if (!supabase) return;
  const { error } = await supabase.from("saved_files").delete()
    .eq("module_key", moduleKey).eq("file_id", fileId);
  if (error) console.warn("Supabase deleteFile:", error.message);
}

/** Bulk-save all saved files for all modules */
export async function saveAllFiles(savedFiles) {
  if (!supabase) return;
  const rows = [];
  for (const [moduleKey, files] of Object.entries(savedFiles)) {
    for (const f of files) {
      rows.push({
        module_key: moduleKey,
        file_id: f.id,
        name: f.name,
        description: f.description || "",
        status: f.status || "draft",
        tags: f.tags || [],
        data: f.data || {},
        tokens: f.tokens || null,
      });
    }
  }
  if (rows.length === 0) return;
  const { error } = await supabase.from("saved_files").upsert(rows, { onConflict: "module_key,file_id" });
  if (error) console.warn("Supabase saveAllFiles:", error.message);
}

// ── Claude Memory ────────────────────────────────────────

/** Load claude memory entries */
export async function loadClaudeMemory() {
  if (!supabase) return null;
  const { data, error } = await supabase.from("claude_memory")
    .select("*").order("created_at", { ascending: true }).limit(200);
  if (error) { console.warn("Supabase loadClaudeMemory:", error.message); return null; }
  return data.length > 0
    ? data.map(r => ({ module: r.module, prompt: r.prompt, response: r.response, timestamp: r.created_at }))
    : null;
}

/** Append a claude memory entry */
export async function saveClaudeMemoryEntry(entry) {
  if (!supabase) return;
  const { error } = await supabase.from("claude_memory").insert({
    module: entry.module,
    prompt: entry.prompt,
    response: entry.response,
  });
  if (error) console.warn("Supabase saveClaudeMemoryEntry:", error.message);
}

/** Clear all claude memory */
export async function clearClaudeMemoryDB() {
  if (!supabase) return;
  const { error } = await supabase.from("claude_memory").delete().neq("id", 0);
  if (error) console.warn("Supabase clearClaudeMemory:", error.message);
}

// ── Sync Log (audit) ────────────────────────────────────

/** Write a sync log entry */
export async function writeSyncLog(entry) {
  if (!supabase) return;
  const { error } = await supabase.from("sync_log").insert({
    action: entry.action,
    module: entry.module || null,
    summary: entry.summary || "",
    detail: entry.detail || null,
  });
  if (error) console.warn("Supabase writeSyncLog:", error.message);
}
