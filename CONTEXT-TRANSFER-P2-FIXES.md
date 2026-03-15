# Context Transfer — P2 Fixes (Quality & Polish)

> **Branch:** Create from `main` AFTER P0/P1 merge lands
> **Parent session:** claude/init-refero-mcp-x1icS (March 15, 2026)
> **Estimated total effort:** ~2.5 hours

---

## Overview

This session handles 7 quality-of-life and polish fixes identified during a full scenario analysis of the codebase. These are NOT crash bugs — the app works without them — but they cause confusing UX, wasted resources, or silent failures that compound over time.

**All P0 and P1 items were handled in a prior session.** This branch should be created from `main` after those changes are merged to avoid conflicts (P1 includes splitting App.jsx and extracting theme tokens, which restructures the files these fixes touch).

---

## Item 1: No retry logic on callExtractAPI (Bug 10)

**File:** `DesignExtractorView.jsx:148-194`
**Effort:** 20 min
**Impact:** Inconsistent resilience — sync flow retries, extraction does not

### What's wrong
The regular `callClaude` function in `App.jsx:116` wraps its fetch in `withRetry()` with 3 retries and exponential backoff. The `callExtractAPI` function in `DesignExtractorView.jsx:148` has **zero retry logic**. A transient HTTP 500 or 429 (rate limit) from the Claude API immediately fails the extraction, while the same error on the sync flow would be silently retried.

### Current code (DesignExtractorView.jsx:148-153)
```javascript
async function callExtractAPI(contentBlocks, customPrompt, onProgress) {
  const res = await fetch("/api/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentBlocks, customPrompt: customPrompt || undefined }),
  });
```

### Fix
Import or reimplement the `withRetry` wrapper from App.jsx (or from a shared util if P1 extracted it). Wrap the fetch call:
```javascript
const res = await withRetry(() => fetch("/api/extract", { ... }), 3);
```
Note: Only retry on non-streaming failures (the `!res.ok` path at line 155). Once SSE streaming starts, retrying mid-stream doesn't make sense.

---

## Item 2: No duplicate prevention on Save to Library (Bug 6)

**File:** `DesignExtractorView.jsx:443-459`
**Effort:** 20 min
**Impact:** Clicking "Save to Library" multiple times creates duplicate entries

### What's wrong
`handleSaveToLibrary` creates a new file object with `id: "ds-${Date.now()}"` every time it's called. There is no check for "already saved", no disabled state after saving, and no visual feedback (toast/badge). A user who double-clicks or clicks again "to be sure" ends up with 2-3 identical entries in their library.

### Current code (DesignExtractorView.jsx:443-459)
```javascript
const handleSaveToLibrary = () => {
  if (!tokens || !outputs || !onSaveToLibrary) return;
  const id = `ds-${Date.now()}`;
  const now = new Date().toISOString();
  onSaveToLibrary({
    id,
    name: tokens.meta?.name || "Untitled Design System",
    description: tokens.meta?.description || "",
    status: "final",
    createdAt: now,
    updatedAt: now,
    source: "Design Extractor",
    tags: ["extracted"],
    tokens,
    outputs,
  });
};
```

### Fix
1. Add a `const [saved, setSaved] = useState(false)` state
2. Set `setSaved(true)` after calling `onSaveToLibrary`
3. Reset `saved` to `false` when a new extraction starts (`handleExtract`/`handleInstantExtract`)
4. Disable the button and change label to "Saved" when `saved === true`

---

## Item 3: backdrop-filter blur tanks GPU on many FileCards (Bug 13)

**File:** `FileWorkspace.jsx:133` + `App.jsx:1150-1155`
**Effort:** 30 min
**Impact:** Scroll becomes laggy with 50+ files, unusable with 100+

### What's wrong
Every `FileCard` component has `className="glass-surface"` (line 133), which applies:
```css
.glass-surface {
  background: var(--glass-1);
  -webkit-backdrop-filter: blur(40px) saturate(1.4);
  backdrop-filter: blur(40px) saturate(1.4);
  border: 1px solid var(--glass-border);
}
```
`backdrop-filter: blur()` is one of the most GPU-expensive CSS properties — it composites every pixel behind the element. With 100+ cards in a scrollable grid, this causes severe rendering lag, especially on laptops.

### Fix
Two options (pick one):
- **Option A (simple):** Remove `className="glass-surface"` from FileCard. Use a simple `background: var(--glass-1)` with `border` directly in the inline style. The blur effect isn't visually essential for small cards.
- **Option B (conditional):** Apply `glass-surface` only to the first N cards (e.g., 20) and use a plain background for the rest. Or use `IntersectionObserver` to only apply blur to visible cards.

Option A is recommended — the blur on small grid cards is barely noticeable anyway.

---

## Item 4: Saved files store regeneratable outputs, wasting storage (Bug 15)

**File:** `DesignExtractorView.jsx:447-458`
**Effort:** 30 min
**Impact:** Each saved file is ~30 KB instead of ~15 KB, accelerates 5 MB localStorage wall

### What's wrong
When saving to library, the file object includes both `tokens` AND `outputs`:
```javascript
onSaveToLibrary({
  ...
  tokens,   // ~5 KB — the actual extracted data
  outputs,  // ~15 KB — generated HTML, Markdown, JSON, React theme
});
```
The `outputs` object contains HTML, Markdown, JSON, and React theme strings that are **entirely regeneratable** from `tokens` using `buildOutputs(tokens)` (from `lib/generators.js`). Storing both roughly doubles the per-file storage cost and directly accelerates hitting the 5 MB localStorage limit (see Bug 14, handled in P1).

### Fix
1. Don't store `outputs` in the saved file — only store `tokens`
2. When displaying a saved file, regenerate outputs on-the-fly: `const outputs = buildOutputs(file.tokens)`
3. This may require a small change in `DesignExtractorView` where it checks for `file.outputs` — replace with `buildOutputs(file.tokens)`

---

## Item 5: Debounce localStorage writes

**File:** `App.jsx:1202-1214` (and similar useEffect blocks)
**Effort:** 30 min
**Impact:** Performance improvement for rapid state changes

### What's wrong
Every state change to `moduleData` or `savedFiles` triggers an immediate `localStorage.setItem` with a full JSON serialization:
```javascript
// App.jsx:1202-1206
useEffect(() => {
  if (Object.keys(moduleData).length > 0) {
    localStorage.setItem("aerchain-module-data", JSON.stringify(moduleData));
  }
}, [moduleData]);
```
For rapid operations (bulk delete, multi-file save, fast switching), this causes dozens of synchronous `JSON.stringify` + `setItem` calls. With large data objects, this blocks the main thread.

### Fix
Debounce the write with a 500ms delay:
```javascript
useEffect(() => {
  const timer = setTimeout(() => {
    localStorage.setItem("aerchain-module-data", JSON.stringify(moduleData));
  }, 500);
  return () => clearTimeout(timer);
}, [moduleData]);
```
Apply the same pattern to the `savedFiles` persistence effect and `claudeMemory` effect.

---

## Item 6: Deduplicate SAMPLE_FILES + savedFiles by ID

**File:** `App.jsx:1217-1226` (the `getModuleFiles` function)
**Effort:** 30 min
**Impact:** Prevents duplicate file entries in the grid

### What's wrong
`getModuleFiles` concatenates sample files and saved files with no deduplication:
```javascript
const getModuleFiles = useCallback((moduleKey) => {
  if (moduleKey === "design-extractor") {
    const refs = SAMPLE_FILES["design-extractor"] || [];
    const saved = savedFiles["design-extractor"] || [];
    return [...refs, ...saved];  // <-- no dedup
  }
  ...
}, [showDummy, savedFiles]);
```
If a sample file's `id` collides with a saved file's `id` (unlikely but possible), or if the same file is somehow in both arrays, both appear in the grid.

### Fix
Deduplicate by `id` when merging:
```javascript
const allFiles = [...refs, ...saved];
const seen = new Set();
return allFiles.filter(f => {
  if (seen.has(f.id)) return false;
  seen.add(f.id);
  return true;
});
```

---

## Item 7: Fix EmptyState sync button for upload modules

**File:** `App.jsx:305-339` (EmptyState component) + `App.jsx:987-990`
**Effort:** 15 min
**Impact:** UX clarity — removes confusing "Sync Now" button from upload-only modules

### What's wrong
The `EmptyState` component at line 305 correctly checks `UPLOAD_MODULES.has(moduleKey)` and shows a file upload zone for pricing-calculator and proposal-generator. However, the `design-extractor` module is NOT in `UPLOAD_MODULES` (line 21: only pricing-calculator and proposal-generator are listed). So if design-extractor ever hits the empty state path, it would show a "Sync Now" button — which does nothing meaningful for design extraction.

Current UPLOAD_MODULES definition:
```javascript
const UPLOAD_MODULES = new Set(["pricing-calculator", "proposal-generator"]);
```

EmptyState routing at lines 987-990:
```javascript
if (isEmpty && UPLOAD_MODULES.has(moduleKey)) {
  return <EmptyState moduleKey={moduleKey} onFilesSelected={onFilesSelected} />;
}
if (isEmpty) return <EmptyState moduleKey={moduleKey} onSync={onSync} loading={syncing} />;
```

### Fix
Add `"design-extractor"` to `UPLOAD_MODULES`, or handle design-extractor as a special case in the EmptyState routing. The simplest fix:
```javascript
const UPLOAD_MODULES = new Set(["pricing-calculator", "proposal-generator", "design-extractor"]);
```

---

## File Map (lines referenced are pre-P1-refactor)

| File | Lines | Size |
|------|-------|------|
| `App.jsx` | 1807 lines | Main app — persistence, state, EmptyState, getModuleFiles |
| `DesignExtractorView.jsx` | 813 lines | Extraction UI — callExtractAPI, handleSaveToLibrary |
| `FileWorkspace.jsx` | 619 lines | File grid — FileCard with glass-surface class |
| `lib/generators.js` | — | buildOutputs() function for regenerating outputs from tokens |
| `demo-data/index.js` | — | SAMPLE_FILES definitions |

---

## Testing Checklist

- [ ] Save to Library only creates one entry per click, button disables after save
- [ ] Delete all files in a module, refresh — files stay deleted (P0 fix prerequisite)
- [ ] 50+ FileCards scroll smoothly without jank
- [ ] Extraction failure on transient 500 retries automatically
- [ ] localStorage usage stays reasonable with many saved files (check in DevTools > Application > Storage)
- [ ] No duplicate files appear in the file grid
- [ ] Design Extractor empty state shows upload zone, not "Sync Now"
