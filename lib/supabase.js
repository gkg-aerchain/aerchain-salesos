import { supabase } from "../supabaseClient.js";

// ── Supabase data layer (JSONB-first) ───────────────────
// Both `modules` and `saved_files` use a minimal schema:
//   id (text PK) | data (jsonb) | created_at | updated_at
// Plus `module_key` on saved_files for grouping.
//
// The app object IS the JSONB — no column mapping, no property loss.
// When the frontend adds new properties, they persist automatically.
//
// All functions return null when supabase client is unavailable,
// allowing localStorage fallback in App.jsx.

// ── Module Data ──────────────────────────────────────────

/** Load all module data → { [moduleKey]: { data, status, lastSynced, ... } } */
export async function loadModuleData() {
  if (!supabase) return null;
  const { data: rows, error } = await supabase.from("modules").select("*");
  if (error) { console.warn("Supabase loadModuleData:", error.message); return null; }
  const result = {};
  for (const row of rows) {
    if (row.data && Object.keys(row.data).length > 0) {
      result[row.id] = row.data;
    }
  }
  return Object.keys(result).length > 0 ? result : null;
}

/** Upsert a single module's data */
export async function saveModuleData(moduleKey, entry) {
  if (!supabase) return;
  const { error } = await supabase.from("modules").upsert({
    id: moduleKey,
    data: entry,
    updated_at: new Date().toISOString(),
  }, { onConflict: "id" });
  if (error) console.warn("Supabase saveModuleData:", error.message);
}

/** Bulk-save all module data (used by debounced persist) */
export async function saveAllModuleData(moduleData) {
  if (!supabase) return;
  const rows = Object.entries(moduleData).map(([key, entry]) => ({
    id: key,
    data: entry,
    updated_at: new Date().toISOString(),
  }));
  if (rows.length === 0) return;
  const { error } = await supabase.from("modules").upsert(rows, { onConflict: "id" });
  if (error) console.warn("Supabase saveAllModuleData:", error.message);
}

// ── Saved Files ──────────────────────────────────────────

/** Load all saved files → { [module_key]: [...fileObjects] } */
export async function loadSavedFiles() {
  if (!supabase) return null;
  const { data: rows, error } = await supabase.from("saved_files").select("*").order("created_at", { ascending: true });
  if (error) { console.warn("Supabase loadSavedFiles:", error.message); return null; }
  const result = {};
  for (const row of rows) {
    if (!result[row.module_key]) result[row.module_key] = [];
    // The file object is stored as-is in `data`. Ensure id is present.
    const file = { ...row.data, id: row.id };
    result[row.module_key].push(file);
  }
  return Object.keys(result).length > 0 ? result : null;
}

/** Save a single file (upsert by id) */
export async function saveFile(moduleKey, file) {
  if (!supabase) return;
  const { error } = await supabase.from("saved_files").upsert({
    id: file.id,
    module_key: moduleKey,
    data: file,
    updated_at: new Date().toISOString(),
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
        data: f,
        updated_at: new Date().toISOString(),
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
