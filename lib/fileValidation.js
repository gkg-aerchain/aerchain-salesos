// ── Shared file validation logic ─────────────────────────────
// Used by Pricing Calculator, Proposal Generator, and Design Extractor.

const ALLOWED_TYPES = new Set([
  "text/csv", "application/pdf", "application/json", "text/plain",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml",
]);

const ALLOWED_EXTS = new Set([
  ".csv", ".pdf", ".json", ".txt", ".xlsx", ".xls", ".docx",
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg",
]);

const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const WARN_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export function getExt(name) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

export function validateFile(f, { allowImages = false } = {}) {
  const ext = getExt(f.name);
  const issues = [];

  // Type check
  const typeOk = ALLOWED_TYPES.has(f.type) || ALLOWED_EXTS.has(ext);
  const isImage = IMAGE_EXTS.has(ext) || (f.type && f.type.startsWith("image/"));
  if (!typeOk) {
    issues.push({ level: "error", msg: `Unsupported file type (${ext || f.type || "unknown"})` });
  } else if (isImage && !allowImages) {
    issues.push({ level: "error", msg: `Image files not supported here — use Design Extractor` });
  }

  // Size check
  if (f.size > MAX_FILE_SIZE) {
    issues.push({ level: "error", msg: `File too large (${(f.size / 1024 / 1024).toFixed(1)} MB — max 10 MB)` });
  } else if (f.size > WARN_FILE_SIZE) {
    issues.push({ level: "warn", msg: `Large file (${(f.size / 1024 / 1024).toFixed(1)} MB) — processing may be slow` });
  }

  // Empty check
  if (f.size === 0) {
    issues.push({ level: "error", msg: "File is empty" });
  }

  return issues;
}

export function findDuplicates(files) {
  const seen = new Map();
  const dupes = [];
  files.forEach((f, i) => {
    const key = `${f.name}:${f.size}`;
    if (seen.has(key)) dupes.push(i);
    else seen.set(key, i);
  });
  return dupes;
}

export function validateAllFiles(files, opts = {}) {
  if (!files || files.length === 0) return { hasErrors: false, hasWarnings: false, results: [] };
  const dupes = findDuplicates(files);
  let hasErrors = false;
  let hasWarnings = false;
  const results = files.map((f, i) => {
    const issues = validateFile(f, opts);
    if (dupes.includes(i)) issues.push({ level: "warn", msg: "Duplicate file" });
    if (issues.some(x => x.level === "error")) hasErrors = true;
    if (issues.some(x => x.level === "warn")) hasWarnings = true;
    return { file: f, issues };
  });
  return { hasErrors, hasWarnings, results };
}
