# Context Transfer — P2 Fixes (Quality & Polish)

> **Branch:** Create from `main` AFTER commit `8a4769d2` (P0/P1 merge from PR #34)
> **Parent session:** claude/init-refero-mcp-x1icS (March 15, 2026)
> **Estimated total effort:** ~2.5 hours
> **Repo:** gkg-aerchain/aerchain-salesos

---

## What This App Is

Aerchain SalesOS is a **single-page React application** deployed on Vercel. It's a multi-module enterprise tools dashboard with:

- **Pricing Calculator** — upload pricing data, process with Claude API, view structured output
- **Proposal Generator** — upload proposal docs, process with Claude API
- **Design Extractor** — upload HTML/CSS/images, extract design tokens via Claude API or instant programmatic extraction
- **Settings** — theme selector (dark/light/clean), Claude memory viewer

The app uses **NO React Router** — module switching is done via a sidebar that sets `selected` state, and `ModuleContent` conditionally renders the appropriate view. All data persists in `localStorage`. There is a Notion audit log integration that syncs every 30 minutes.

**Deployment:** Vercel with serverless functions in `/api/` directory. Claude API key lives server-side only.

---

## Architecture Overview (Post-P0/P1)

### File Structure (5,026 total lines across key files)

```
aerchain-salesos/
├── App.jsx                  (1,867 lines) — THE monolith: constants, utilities, UI components, state, rendering
├── DesignExtractorView.jsx  (858 lines)   — Design Extractor module: file upload, Claude API SSE, instant extract, output tabs
├── FileWorkspace.jsx        (619 lines)   — Shared file grid + detail canvas used by all modules
├── lib/
│   ├── generators.js        (248 lines)   — generateHTML/Markdown/JSON/ReactTheme from token JSON
│   └── programmaticExtractor.js (523 lines) — Client-side HTML/CSS → design tokens (no API)
├── demo-data/
│   ├── index.js             (22 lines)    — Central re-export: DUMMY_DATA + SAMPLE_FILES
│   ├── pricing-calculator.js (109 lines)
│   ├── proposal-generator.js (170 lines)
│   └── design-extractor.js  (317 lines)
├── api/
│   ├── process.js           (56 lines)    — Vercel serverless: general Claude API proxy
│   ├── extract.js           (228 lines)   — Vercel serverless: Design Extractor with SSE streaming
│   └── health.js            (9 lines)
├── main.jsx                               — Entry point, renders <App moduleFilter={[...]} />
├── vite.config.js                         — Vite config
└── vercel.json                            — Vercel routing config
```

### State Architecture in App.jsx

All state lives in the `AerchainSalesOS` component (line 1061):

```javascript
const [selected, setSelected]         = useState("pricing-calculator");  // Active module key
const [moduleData, setModuleData]     = useState({});           // Synced data per module { [key]: { data, status, lastSynced, syncCount } }
const [syncing, setSyncing]           = useState(new Set());    // Module keys currently syncing
const [savedFiles, setSavedFiles]     = useState({});           // User-saved files per module { [key]: File[] }
const [uploadedFiles, setUploadedFiles] = useState({});         // Browser File objects pending processing { [key]: File[] }
const [processing, setProcessing]     = useState(new Set());    // Module keys being processed by Claude
const [claudeMemory, setClaudeMemory] = useState([]);           // Last 200 Claude interactions
const [referenceTokens, setReferenceTokens] = useState(null);   // Loaded design system for comparison
const [extractorCache, setExtractorCache]   = useState(null);   // Persists DesignExtractorView results across module switches
const [theme, setTheme]               = useState("dark");       // "dark" | "light" | "clean"
const [showDummy, setShowDummy]       = useState(false);        // Demo mode toggle
```

### localStorage Keys

| Key | Contents | Protected by try/catch | Uses safePersist |
|-----|----------|----------------------|------------------|
| `aerchain-module-data` | `moduleData` JSON | Yes (read) | Yes (write) |
| `aerchain-saved-files` | `savedFiles` JSON | Yes (read) | Yes (write) |
| `aerchain-claude-memory` | Last 200 interactions | Yes (read) | Yes (write) |
| `aerchain-notion-audit` | Last 100 audit entries | Yes (read, fixed in P0/P1) | Yes (write) |

### Theme System

Three themes defined as CSS custom properties on `:root[data-theme="dark|light|clean"]` (App.jsx lines 1104-1200). Components reference via a `T` object that maps to `var(--xxx)`:

```javascript
// DUPLICATED in App.jsx, DesignExtractorView.jsx, and FileWorkspace.jsx
const T = {
  bg:        "var(--canvas)",
  bgCard:    "var(--glass-1)",
  border:    "var(--glass-border)",
  text:      "var(--fg)",
  muted:     "var(--fg2)",
  accent:    "var(--primary)",
  // ... etc
};
```

### Data Flow

```
User uploads file → setUploadedFiles({[key]: files})
                  → handleProcess(key) → reads files as text → callClaude() → /api/process
                  → response parsed → setModuleData({[key]: {data, status}})
                  → useEffect persists to localStorage

Design Extractor: Two paths:
  1. Claude API: handleExtract() → callExtractAPI() → /api/extract (SSE stream) → setTokens/setOutputs
  2. Instant:    handleInstantExtract() → extractFromHTML/extractFromCSS (client-side) → setTokens/setOutputs
```

### Key Component Tree

```
<AerchainSalesOS>
  ├── Sidebar (inline in App.jsx ~line 1590)
  │   └── Module list grouped by GROUPS constant
  ├── Top bar (inline ~line 1700)
  └── Content area
      └── <ModuleErrorBoundary moduleKey={selected}>  ← Added in P0/P1
          └── <ModuleContent moduleKey={selected} ...props>
              ├── if "settings" → <SettingsView>
              ├── if "design-extractor" → <FileWorkspace> + <DesignExtractorView>
              ├── if has files → <FileWorkspace> + upload zone
              ├── if UPLOAD_MODULES → <EmptyState> with upload zone
              └── else → <EmptyState> with "Sync Now" button
```

---

## What Was Fixed in P0/P1 (PR #34, merged as 8a4769d2)

You MUST understand these fixes because some P2 items interact with them:

1. **localStorage persistence guard removed** — `App.jsx:1262-1268` now always calls `safePersist()`, no length check. This means even empty `{}` is written. Your debounce fix (Item 5) wraps these same lines.

2. **`safePersist()` function added** — `App.jsx:103-106`. All 4 `localStorage.setItem` calls now go through this. Your debounce fix should modify `safePersist` or the useEffect calls, NOT add new raw `localStorage.setItem` calls.

3. **SSE stream guarded** — `DesignExtractorView.jsx:161-206`. Added `res.body` null check, try/catch around reader loop, `data?.error` optional chaining.

4. **ModuleErrorBoundary added** — `App.jsx:924-968`. Class component wrapping `<ModuleContent>`. Resets on module switch via `componentDidUpdate`.

5. **AbortController added** — `DesignExtractorView.jsx:297` (`abortRef`), line 338-341 (creates controller on extract), line 405 (AbortError silenced in catch). `callExtractAPI` now takes a 4th `signal` parameter.

6. **Multi-file merge** — `DesignExtractorView.jsx:424-467`. The instant extract loop now collects all tokens into `allTokens[]` and reduces them with shallow merge per token category.

7. **extractorCache** — `App.jsx:1089` state, passed through `ModuleContent` (line 973 props) to `DesignExtractorView` (line 281 props, line 304-309 persist effect).

---

## P2 Items — Detailed Implementation Guide

### Item 1: No retry logic on callExtractAPI

**File:** `DesignExtractorView.jsx:148-207`
**Effort:** 20 min

**Current state of callExtractAPI (lines 148-207):**
```javascript
async function callExtractAPI(contentBlocks, customPrompt, onProgress, signal) {
  const res = await fetch("/api/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentBlocks, customPrompt: customPrompt || undefined }),
    signal,
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || `HTTP ${res.status}`);
  }
  // ... SSE stream parsing follows
```

**What's wrong:** `callClaude` in App.jsx:120 uses `withRetry()`:
```javascript
async function callClaude(prompt, { system, model, maxTokens, moduleKey } = {}) {
  return withRetry(async () => {
    const res = await fetch("/api/process", { ... });
    // ...
  }, { retries: 3, label: moduleKey });
}
```

But `callExtractAPI` has no retry wrapper. Transient 500/429 errors fail immediately.

**Fix:** Only retry the initial fetch, NOT after SSE streaming starts:
```javascript
async function callExtractAPI(contentBlocks, customPrompt, onProgress, signal) {
  const res = await withRetry(() => fetch("/api/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentBlocks, customPrompt: customPrompt || undefined }),
    signal,
  }), { retries: 2, label: "extract" });
  if (!res.ok) { ... }
  // SSE parsing unchanged
```

**IMPORTANT:** `withRetry` is defined in App.jsx:88-101 as a top-level function, NOT exported. You'll need to either:
- Move it to a shared util file (e.g., `lib/retry.js`) and import in both files
- Or duplicate the 14-line function in DesignExtractorView.jsx

The `withRetry` function (App.jsx:88-101):
```javascript
async function withRetry(fn, { retries = 3, label = "" } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try { return await fn(); } catch (err) {
      const status = err?.status || err?.statusCode;
      if (status && status >= 400 && status < 500 && status !== 429) throw err;
      if (attempt === retries) throw err;
      const delay = Math.pow(2, attempt + 1) * 1000;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}
```

---

### Item 2: No duplicate prevention on Save to Library

**File:** `DesignExtractorView.jsx:487-503`
**Effort:** 20 min

**Current code:**
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
    createdAt: now, updatedAt: now,
    source: "Design Extractor",
    tags: ["extracted"],
    tokens, outputs,
  });
};
```

**What's wrong:** Every call creates a new entry with a new `Date.now()` id. No "already saved" state, no disabled button, no toast.

**Fix:**
1. Add state: `const [saved, setSaved] = useState(false);`
2. In `handleSaveToLibrary`: add `setSaved(true)` after `onSaveToLibrary(...)`.
3. Reset: add `setSaved(false)` at the start of `handleExtract` (line 343) and `handleInstantExtract` (line 424).
4. The Save button is rendered around line 700-720 (search for `handleSaveToLibrary`). Add `disabled={saved}` and change label to `saved ? "Saved to Library" : "Save to Library"`.
5. Include `saved` in the `extractorCache` persist effect (line 304-309) so it survives module switches.

---

### Item 3: backdrop-filter blur on FileCards

**File:** `FileWorkspace.jsx:118-135`
**Effort:** 30 min

**Current FileCard (line 118-135):**
```javascript
<div onClick={onClick} style={{
  borderRadius: 14, padding: "16px 18px", cursor: "pointer",
  background: isSelected ? T.bgActive : T.bgCard,
  border: `1px solid ${isSelected ? T.borderAcc : T.border}`,
  boxShadow: isSelected ? "var(--s-glow)" : "var(--s-glass)",
}} className="glass-surface">  // ← THIS applies backdrop-filter: blur(40px)
```

**The CSS class (App.jsx:1207-1212):**
```css
.glass-surface {
  background: var(--glass-1);
  -webkit-backdrop-filter: blur(40px) saturate(1.4);
  backdrop-filter: blur(40px) saturate(1.4);
  border: 1px solid var(--glass-border);
}
```

**Fix:** Remove `className="glass-surface"` from FileCard at line 133. The inline `style` already sets `background`, `border`, and `boxShadow`. **Do NOT** remove `glass-surface` from sidebar, top bar, or large panels — only from FileCard.

---

### Item 4: Saved files store regeneratable outputs

**File:** `DesignExtractorView.jsx:487-503`
**Effort:** 30 min

**What's wrong:** `outputs` in saved file is 100% regeneratable from `tokens` via `buildOutputs(tokens)` (from `lib/generators.js`). Storing both doubles per-file localStorage cost (~30 KB vs ~15 KB).

**Fix:**
1. Remove `outputs` from the save payload in `handleSaveToLibrary`.
2. Where saved files need outputs, call `buildOutputs(file.tokens)`.
3. The `referenceTokens` effect (line 316-323) already calls `buildOutputs(referenceTokens)`, so loading references works.
4. **Migration:** Use `file.outputs || buildOutputs(file.tokens)` where needed to handle old saved data.

---

### Item 5: Debounce localStorage writes

**File:** `App.jsx:1261-1269`
**Effort:** 30 min

**Current persist effects:**
```javascript
useEffect(() => { safePersist("aerchain-module-data", moduleData); }, [moduleData]);
useEffect(() => { safePersist("aerchain-saved-files", savedFiles); }, [savedFiles]);
```

**Fix:** Wrap in `setTimeout` with 500ms delay + cleanup. Add `beforeunload` handler to flush pending writes on tab close. Do NOT debounce the `claudeMemory` persist at line 1312 — it's inside a callback, not a useEffect, and fires infrequently.

---

### Item 6: Deduplicate SAMPLE_FILES + savedFiles by ID

**File:** `App.jsx:1272-1281` (`getModuleFiles`)
**Effort:** 30 min

**Fix:** Filter `[...refs, ...saved]` with a `Set` of seen IDs. Sample file IDs are like `"ds-ref-aerchain"`, saved are like `"ds-1710523456789"`. Collision unlikely but dedup is cheap.

---

### Item 7: Fix EmptyState sync button for upload modules

**File:** `App.jsx:21`
**Effort:** 15 min

**Fix:** Add `"design-extractor"` to `UPLOAD_MODULES`. Side effects are safe — checked all 3 usage sites (getSyncPrompt:56, syncModule:1416, sidebar:1750).

---

## Testing Checklist

- [ ] Save to Library only creates one entry per click; button shows "Saved" and is disabled
- [ ] Upload HTML + CSS, save, reload — no duplicates in file grid
- [ ] Scroll through 50+ FileCards smoothly (no `backdrop-filter` on cards)
- [ ] localStorage usage per saved file is ~15 KB not ~30 KB (DevTools > Application > Storage)
- [ ] Rapid module switching doesn't trigger multiple localStorage writes
- [ ] Close tab within 1s of a change, reopen — data is persisted (beforeunload handler)
- [ ] Design Extractor empty state shows upload zone, not "Sync Now"
- [ ] Transient 500 on `/api/extract` retries automatically
