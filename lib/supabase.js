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
      result[row.id] = {
        data: row.data,
        status: row.status || "⬜ Never Synced",
        lastSynced: row.last_synced,
        staleAfterHrs: row.stale_after_hrs || 4,
      };
    }
  }
  return Object.keys(result).length > 0 ? result : null;
}

/** Upsert a single module's data */
export async function saveModuleData(moduleKey, entry) {
  if (!supabase) return;
  const { error } = await supabase.from("modules").upsert({
    id: moduleKey,
    data: entry.data || {},
    status: entry.status || "⬜ Never Synced",
    last_synced: entry.lastSynced || null,
    stale_after_hrs: entry.staleAfterHrs || 4,
  }, { onConflict: "id" });
  if (error) console.warn("Supabase saveModuleData:", error.message);
}

/** Bulk-save all module data (used by debounced persist) */
export async function saveAllModuleData(moduleData) {
  if (!supabase) return;
  const rows = Object.entries(moduleData).map(([key, entry]) => ({
    id: key,
    data: entry?.data || {},
    status: entry?.status || "⬜ Never Synced",
    last_synced: entry?.lastSynced || null,
    stale_after_hrs: entry?.staleAfterHrs || 4,
  }));
  if (rows.length === 0) return;
  const { error } = await supabase.from("modules").upsert(rows, { onConflict: "id" });
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
      id: row.id,
      name: row.name,
      description: row.description || "",
      status: row.status || "draft",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      tags: row.tags || [],
      data: row.metadata || {},
      tokens: row.tokens || undefined,
    });
  }
  return Object.keys(result).length > 0 ? result : null;
}

/** Save a single file (upsert by id) */
export async function saveFile(moduleKey, file) {
  if (!supabase) return;
  const { error } = await supabase.from("saved_files").upsert({
    id: file.id,
    module_key: moduleKey,
    name: file.name,
    description: file.description || "",
    status: file.status || "draft",
    tags: file.tags || [],
    metadata: file.data || {},
    tokens: file.tokens || null,
  }, { onConflict: "id" });
  if (error) console.warn("Supabase saveFile:", error.message);
}

/** Delete a file */
export async function deleteFileFromDB(moduleKey, fileId) {
  if (!supabase) return;
  const { error } = await supabase.from("saved_files").delete()
    .eq("id", fileId);
  if (error) console.warn("Supabase deleteFile:", error.message);
}

/** Bulk-save all saved files for all modules */
export async function saveAllFiles(savedFiles) {
  if (!supabase) return;
  const rows = [];
  for (const [moduleKey, files] of Object.entries(savedFiles)) {
    for (const f of files) {
      rows.push({
        id: f.id,
        module_key: moduleKey,
        name: f.name,
        description: f.description || "",
        status: f.status || "draft",
        tags: f.tags || [],
        metadata: f.data || {},
        tokens: f.tokens || null,
      });
    }
  }
  if (rows.length === 0) return;
  const { error } = await supabase.from("saved_files").upsert(rows, { onConflict: "id" });
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
