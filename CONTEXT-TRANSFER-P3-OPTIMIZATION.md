# Context Transfer — P3 Optimization & Architecture

> **Branch:** Create from `main` AFTER P0/P1 and P2 merges land
> **Parent session:** claude/init-refero-mcp-x1icS (March 15, 2026)
> **Estimated total effort:** 1.5-2.5 days
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

### File Structure (5,026 total lines)

```
aerchain-salesos/
├── App.jsx                  (1,867 lines) — THE monolith: constants, utilities, 15+ components, all state, rendering
├── DesignExtractorView.jsx  (858 lines)   — Design Extractor: file upload, Claude API SSE, instant extract, output tabs
├── FileWorkspace.jsx        (619 lines)   — Shared file grid + detail canvas, used by all modules
├── lib/
│   ├── generators.js        (248 lines)   — generateHTML/Markdown/JSON/ReactTheme from token JSON
│   └── programmaticExtractor.js (523 lines) — Client-side HTML/CSS → design tokens (hidden iframe + DOM walk)
├── demo-data/
│   ├── index.js             (22 lines)    — Central re-export: DUMMY_DATA + SAMPLE_FILES
│   ├── pricing-calculator.js (109 lines)  — Sample pricing files with realistic Aerchain enterprise data
│   ├── proposal-generator.js (170 lines)  — Sample proposal files
│   └── design-extractor.js  (317 lines)   — Sample design system files (Aerchain, MaterialUI references)
├── api/
│   ├── process.js           (56 lines)    — Vercel serverless: general Claude API proxy (non-streaming)
│   ├── extract.js           (228 lines)   — Vercel serverless: Design Extractor with SSE streaming
│   └── health.js            (9 lines)
├── main.jsx                               — Entry point: <App moduleFilter={["pricing-calculator","proposal-generator","design-extractor"]} />
├── index.html                             — Single HTML page, loads main.jsx
├── vite.config.js                         — Vite config (base: "/")
└── vercel.json                            — Rewrites /api/* to serverless, everything else to index.html
```

### What's Inside App.jsx (1,867 lines — The Monolith)

App.jsx contains ALL of the following (line ranges approximate post-P0/P1):

```
Lines 1-11:      Imports (React, lucide-react icons, demo-data, DesignExtractorView, FileWorkspace)
Lines 12-58:     Constants: UPLOAD_MODULES, NOTION_AUDIT_CONFIG, GROUPS, MOD, getSyncPrompt
Lines 60-115:    Utility functions: extractJSON, isStale, withRetry, safePersist, timeAgo
Lines 116-145:   API functions: callClaude (with retry), processWithClaude, createNotionAuditEntry
Lines 146-215:   UI utility components: StatusDot, Spinner, SyncBtn
Lines 216-305:   UI components: Card, FileUploadZone
Lines 305-344:   EmptyState component
Lines 344-420:   AerchainLogo SVG, NotionIcon SVG, NotionAuditLink
Lines 420-920:   Module view components: PricingCalcView, ProposalsView, SettingsView, GenericView
Lines 920-968:   ModuleErrorBoundary (class component)
Lines 970-1058:  ModuleContent router (conditional rendering based on moduleKey)
Lines 1060-1090: AerchainSalesOS main component: state declarations
Lines 1090-1240: Theme CSS injection (inline <style> with 3 theme definitions, ~150 lines of CSS)
Lines 1240-1410: Persistence effects, file management callbacks, Claude memory, Notion sync
Lines 1410-1500: Sync functions: syncModule, syncAll
Lines 1500-1590: Upload & process handlers, computed values (mData, mStatus, isSyncing)
Lines 1590-1700: Sidebar rendering (inline JSX)
Lines 1700-1810: Main content area, top bar, sync log panel
```

### State Architecture

All state lives in `AerchainSalesOS` (line 1061):

```javascript
const [selected, setSelected]         = useState("pricing-calculator");  // Active module key
const [moduleData, setModuleData]     = useState({});           // { [key]: { data, status, lastSynced, syncCount } }
const [syncing, setSyncing]           = useState(new Set());    // Module keys currently syncing
const [savedFiles, setSavedFiles]     = useState({});           // { [key]: SavedFile[] }
const [uploadedFiles, setUploadedFiles] = useState({});         // { [key]: BrowserFile[] } (pending processing)
const [processing, setProcessing]     = useState(new Set());    // Module keys being processed
const [claudeMemory, setClaudeMemory] = useState([]);           // Last 200 Claude interactions
const [referenceTokens, setReferenceTokens] = useState(null);   // Loaded design system tokens
const [extractorCache, setExtractorCache]   = useState(null);   // Persists DesignExtractorView results across switches
const [theme, setTheme]               = useState("dark");       // "dark" | "light" | "clean"
const [showDummy, setShowDummy]       = useState(false);        // Demo mode toggle
```

### Module Registry (hardcoded in 5 places)

Currently, adding a new module requires touching:

1. **`App.jsx:42-47`** — `MOD` object (label + icon):
```javascript
const MOD = {
  "pricing-calculator": { label: "Pricing Calculator", Icon: DollarSign },
  "proposal-generator": { label: "Proposal Generator", Icon: FileText   },
  "design-extractor":   { label: "Design Extractor",   Icon: Palette    },
  "settings":           { label: "Settings",           Icon: Settings   },
};
```

2. **`App.jsx:36-40`** — `GROUPS` array (sidebar grouping):
```javascript
const GROUPS = [
  { id: "deal-desk", label: "DEAL DESK",  modules: ["pricing-calculator","proposal-generator"] },
  { id: "tools",     label: "TOOLS",      modules: ["design-extractor"] },
  { id: "system",    label: "SYSTEM",     modules: ["settings"], pinBottom: true },
];
```

3. **`App.jsx:21`** — `UPLOAD_MODULES` set (determines upload vs sync empty state):
```javascript
const UPLOAD_MODULES = new Set(["pricing-calculator", "proposal-generator"]);
```

4. **`App.jsx:970-1058`** — `ModuleContent` function (switch-case routing):
```javascript
function ModuleContent({ moduleKey, ...props }) {
  if (moduleKey === "settings") return <SettingsView ... />;
  if (moduleKey === "design-extractor") { ... return <DesignExtractorView ... />; }
  // ... upload modules check, empty state, then:
  switch (moduleKey) {
    case "pricing-calculator": return <PricingCalcView ... />;
    case "proposal-generator": return <ProposalsView ... />;
    default: return <GenericView ... />;
  }
}
```

5. **`FileWorkspace.jsx:75-108`** — `getCardMetrics` + `getModuleIcon` (module-specific card display):
```javascript
function getCardMetrics(moduleKey, file) {
  switch (moduleKey) {
    case "pricing-calculator": return [{ label: "Per $1B", ... }, ...];
    case "proposal-generator": return [{ label: "Value", ... }, ...];
    case "design-extractor":   return [{ label: "Theme", ... }, ...];
    default: return [];
  }
}
function getModuleIcon(moduleKey) {
  switch (moduleKey) {
    case "pricing-calculator": return DollarSign;
    case "proposal-generator": return FileText;
    case "design-extractor":   return Palette;
    default: return FileText;
  }
}
```

6. **`demo-data/index.js`** — sample file imports:
```javascript
import { pricingCalculatorDummy, pricingCalculatorFiles } from "./pricing-calculator.js";
import { proposalGeneratorDummy, proposalGeneratorFiles } from "./proposal-generator.js";
import { designExtractorFiles } from "./design-extractor.js";
const SAMPLE_FILES = {
  "pricing-calculator": pricingCalculatorFiles,
  "proposal-generator": proposalGeneratorFiles,
  "design-extractor":   designExtractorFiles,
};
```

### Theme Token Duplication

The `T` theme token object is defined **3 separate times** in 3 files:

**App.jsx (~line 200, inferred from usage):**
```javascript
const T = {
  accent: "var(--primary)", accentBg: "var(--accent-bg)",
  text: "var(--fg)", muted: "var(--fg2)", mutedSoft: "var(--fg3)",
  bgCard: "var(--glass-1)", border: "var(--glass-border)",
  success: "var(--green)", warn: "var(--amber)", error: "var(--red)",
  // ... 15+ keys total
};
```

**DesignExtractorView.jsx:224-239:**
```javascript
const T = {
  bg: "var(--canvas)", bgCard: "var(--glass-1)", border: "var(--glass-border)",
  borderAcc: "var(--accent-border)", text: "var(--fg)", muted: "var(--fg2)",
  // ... similar but NOT identical keys
};
```

**FileWorkspace.jsx:16-34:**
```javascript
const T = {
  bg: "var(--canvas)", bgCard: "var(--glass-1)", bgActive: "var(--active-bg)",
  border: "var(--glass-border)", text: "var(--fg)", muted: "var(--fg2)",
  badgeBg: "var(--badge-bg)",
  // ... includes badgeBg which others don't
};
```

These three copies have **different keys** — they've drifted. This is a key motivation for P1 "Extract shared T tokens" (but that's a different session — noted here for context).

### Data Flow

```
User uploads file → setUploadedFiles({[key]: files})
                  → handleProcess(key) → reads files as text → callClaude() → /api/process
                  → response parsed → setModuleData({[key]: {data, status}})
                  → useEffect persists to localStorage

Design Extractor: Two paths:
  1. Claude API: handleExtract() → callExtractAPI() → /api/extract (SSE) → setTokens/setOutputs
  2. Instant:    handleInstantExtract() → extractFromHTML/extractFromCSS → setTokens/setOutputs
```

### Key Component Tree

```
<AerchainSalesOS>
  ├── Sidebar (inline in App.jsx ~line 1590)
  │   └── Module list grouped by GROUPS constant
  ├── Top bar (inline ~line 1700)
  └── Content area
      └── <ModuleErrorBoundary moduleKey={selected}>
          └── <ModuleContent moduleKey={selected} ...28 props>
              ├── if "settings" → <SettingsView>
              ├── if "design-extractor" → <FileWorkspace> + <DesignExtractorView>
              ├── if has files → <FileWorkspace> + upload zone
              ├── if UPLOAD_MODULES → <EmptyState> with upload zone
              └── else → <EmptyState> with "Sync Now" button
```

---

## What Was Fixed in Prior Sessions

### P0/P1 (PR #34, merged as 8a4769d2):
- localStorage persistence guard removed (always writes, even empty)
- `safePersist()` wrapper for all localStorage.setItem calls
- SSE stream null guards
- ModuleErrorBoundary wrapping ModuleContent
- AbortController on extraction fetch
- Multi-file instant extract merges tokens instead of overwriting
- extractorCache persists DesignExtractorView results across module switches

### P2 (separate session — may or may not be done before P3):
- Retry logic on callExtractAPI
- Duplicate prevention on Save to Library
- backdrop-filter removed from FileCard
- Saved files only store tokens (not regeneratable outputs)
- Debounced localStorage writes
- Deduplication of SAMPLE_FILES + savedFiles
- design-extractor added to UPLOAD_MODULES

---

## P3 Items — Detailed Implementation Guide

### Item 1: Module Plugin Architecture (1-2 days)

**Goal:** Make adding a new module a single-directory operation instead of touching 6 files.

**Proposed directory structure:**
```
modules/
  index.js              — imports all module configs, exports array
  pricing-calculator/
    index.js            — exports config object
    PricingCalcView.jsx — moved from App.jsx (lines 420-700 approx)
    sample-data.js      — moved from demo-data/pricing-calculator.js
  proposal-generator/
    index.js
    ProposalsView.jsx   — moved from App.jsx
    sample-data.js
  design-extractor/
    index.js
    DesignExtractorView.jsx — moved from root
    sample-data.js
  settings/
    index.js
    SettingsView.jsx    — moved from App.jsx
```

**Each module's `index.js` exports:**
```javascript
import { DollarSign } from "lucide-react";
import PricingCalcView from "./PricingCalcView.jsx";
import { pricingCalculatorFiles } from "./sample-data.js";

export default {
  key: "pricing-calculator",
  label: "Pricing Calculator",
  icon: DollarSign,
  group: "deal-desk",
  isUploadModule: true,
  notionConfig: { pageName: "Pricing Calculator Log" },
  View: PricingCalcView,
  sampleFiles: pricingCalculatorFiles,
  getCardMetrics: (file) => [
    { label: "Per $1B", value: fmt$(file.data?.standardModel?.per1BSpend), icon: DollarSign },
    // ...
  ],
};
```

**`modules/index.js`:**
```javascript
import pricingCalculator from "./pricing-calculator";
import proposalGenerator from "./proposal-generator";
import designExtractor from "./design-extractor";
import settings from "./settings";

export default [pricingCalculator, proposalGenerator, designExtractor, settings];
```

**Changes to App.jsx:**
```javascript
import modules from "./modules";

// Replace hardcoded constants:
const MOD = Object.fromEntries(modules.map(m => [m.key, { label: m.label, Icon: m.icon }]));
const UPLOAD_MODULES = new Set(modules.filter(m => m.isUploadModule).map(m => m.key));
const GROUPS = [
  { id: "deal-desk", label: "DEAL DESK", modules: modules.filter(m => m.group === "deal-desk").map(m => m.key) },
  { id: "tools", label: "TOOLS", modules: modules.filter(m => m.group === "tools").map(m => m.key) },
  { id: "system", label: "SYSTEM", modules: modules.filter(m => m.group === "system").map(m => m.key), pinBottom: true },
];

// Replace ModuleContent switch:
function ModuleContent({ moduleKey, ...props }) {
  const mod = modules.find(m => m.key === moduleKey);
  if (!mod) return <GenericView />;
  return <mod.View {...props} />;
}
```

**Changes to FileWorkspace.jsx:**
- Remove `getCardMetrics` and `getModuleIcon` switches
- Accept `getCardMetrics` and `icon` as props from the module config
- Or: keep them but have each module register its metrics function

**Key decisions to make during implementation:**
1. Should module Views receive the same 28-prop interface as current `ModuleContent`, or a smaller focused set?
2. Should `GROUPS` be derived from module configs or remain separate?
3. Should the CSS (~150 lines of theme tokens) stay in App.jsx or move to a `.css` file?
4. How to handle the `settings` module which has a completely different UI pattern (no FileWorkspace)?

**Extraction plan for the monolith:**
- Move `PricingCalcView` (App.jsx ~lines 420-580) → `modules/pricing-calculator/PricingCalcView.jsx`
- Move `ProposalsView` (App.jsx ~lines 580-720) → `modules/proposal-generator/ProposalsView.jsx`
- Move `SettingsView` (App.jsx ~lines 720-920) → `modules/settings/SettingsView.jsx`
- Move `DesignExtractorView.jsx` (root) → `modules/design-extractor/DesignExtractorView.jsx`
- Move `FileWorkspace.jsx` (root) → `components/FileWorkspace.jsx` (shared, not module-specific)
- Move demo-data files into each module directory

**After extraction, App.jsx should shrink from 1,867 lines to ~800 lines** (state management, layout, sidebar, theme CSS).

---

### Item 2: React.memo on FileCard and ModuleContent (1 hr)

**Goal:** Prevent unnecessary re-renders when parent state changes (theme toggle, sidebar hover, log update).

**FileCard (FileWorkspace.jsx:114):**
```javascript
// BEFORE:
function FileCard({ file, moduleKey, isSelected, onClick }) {
  // ...
}

// AFTER:
const FileCard = React.memo(function FileCard({ file, moduleKey, isSelected, onClick }) {
  // ...
});
```

**Critical caveats you MUST address:**

1. **Unstable onClick:** FileCard is called with `onClick={() => handleSelect(file.id)}`. This creates a new function every render, defeating memo. The fix:
```javascript
// In FileWorkspace, the onClick is:
<FileCard onClick={() => handleSelect(file.id)} ... />
// handleSelect is already wrapped in useCallback (line 485-487):
const handleSelect = useCallback((id) => { setSelectedId(prev => prev === id ? null : id); }, []);
// But the inline () => handleSelect(file.id) wrapper creates a new ref each time.
// Fix: pass file.id separately and let FileCard call it:
<FileCard fileId={file.id} onSelect={handleSelect} ... />
// Then in FileCard: onClick={() => onSelect(fileId)}
// Or use a Map of memoized callbacks
```

2. **Unstable `files` array:** `getModuleFiles` (App.jsx:1272) creates a new array with `[...refs, ...saved]` every time `savedFiles` changes for ANY module. This means all FileCards in all modules get new array refs on every save. Fix: memoize `getModuleFiles` output per module with `useMemo`:
```javascript
const moduleFiles = useMemo(() => getModuleFiles(selected), [getModuleFiles, selected]);
```

3. **ModuleContent memo:** This component receives `data` which is `moduleData[selected]` — object reference changes on every sync. A custom comparator may be needed:
```javascript
const MemoizedModuleContent = React.memo(ModuleContent, (prev, next) => {
  return prev.moduleKey === next.moduleKey
    && prev.data === next.data
    && prev.syncing === next.syncing
    && prev.processing === next.processing;
});
```

But with 28 props, this gets unwieldy. Consider: is memo even worth it for ModuleContent? Profile first. FileCard memo is higher impact because there are N cards re-rendering vs 1 ModuleContent.

**Verification:** Use React DevTools Profiler (Components tab > Profiler) to:
1. Record a theme toggle — check if FileCards re-render (they shouldn't after memo)
2. Record a sidebar click — check if content re-renders with same moduleKey (it shouldn't)

---

### Item 3: Lazy Load demo-data — 104 KB (1 hr)

**Goal:** Remove 104 KB from the initial bundle.

**Current static import (App.jsx:8):**
```javascript
import DUMMY_DATA, { SAMPLE_FILES } from "./demo-data/index.js";
```

This pulls in all sample data for all modules at page load, even though:
- Users may never enable "Demo Mode" (`showDummy`)
- Users working on one module don't need other modules' sample data
- Design Extractor sample files include full token JSON objects (~20 KB each)

**demo-data/index.js (22 lines):**
```javascript
import { pricingCalculatorDummy, pricingCalculatorFiles } from "./pricing-calculator.js";
import { proposalGeneratorDummy, proposalGeneratorFiles } from "./proposal-generator.js";
import { designExtractorFiles } from "./design-extractor.js";

const DUMMY_DATA = {
  "pricing-calculator": pricingCalculatorDummy,
  "proposal-generator": proposalGeneratorDummy,
};
const SAMPLE_FILES = {
  "pricing-calculator": pricingCalculatorFiles,
  "proposal-generator": proposalGeneratorFiles,
  "design-extractor":   designExtractorFiles,
};
export { SAMPLE_FILES };
export default DUMMY_DATA;
```

**Fix — Option A (standalone, no plugin arch):**
```javascript
// Replace static import with lazy loader
const sampleDataCache = {};

async function loadSampleFiles(moduleKey) {
  if (sampleDataCache[moduleKey]) return sampleDataCache[moduleKey];
  const mod = await import(`./demo-data/${moduleKey}.js`);
  sampleDataCache[moduleKey] = mod;
  return mod;
}

// In getModuleFiles, handle async:
// Option 1: Pre-load on first module click
// Option 2: Use a state-based approach with useEffect
```

The challenge: `getModuleFiles` is synchronous and used in render. You need to either:
1. Pre-load all sample data on first render (defeats the purpose)
2. Load per-module on first access and show a brief loading state
3. Use `React.lazy` at the module level (requires Suspense)

**Fix — Option B (with plugin architecture from Item 1):**
Each module config has a lazy loader:
```javascript
export default {
  key: "pricing-calculator",
  loadSampleData: () => import("./sample-data.js"),
  // ...
};
```

The FileWorkspace shows a skeleton/spinner until sample data loads. This is the cleanest approach but requires Item 1 first.

**Recommended approach:** If doing Items in order (2 → 3 → 1), use Option A for Item 3, then refactor into Option B when doing Item 1.

**Vite:** Dynamic `import()` is automatically code-split by Vite. No config needed. Each `import("./demo-data/pricing-calculator.js")` becomes a separate chunk.

**Verification:** After implementing, check:
1. `npm run build` output — main chunk should be ~100 KB smaller
2. Network tab on page load — demo-data chunks should NOT load until a module is accessed
3. No flash of empty state while sample data loads

---

## Implementation Order

```
Item 2 (React.memo, 1 hr) → Item 3 (lazy load, 1 hr) → Item 1 (plugin arch, 1-2 days)
```

- **Item 2 first:** Smallest, standalone, immediate measurable impact via React DevTools Profiler
- **Item 3 second:** Also standalone, reduces initial bundle size
- **Item 1 last:** Largest refactor. Benefits from having Items 2+3 done — memo patterns inform prop design, lazy loading informs the plugin config API

If time is limited, do Items 2+3 (2 hours) and skip Item 1. Items 2+3 are independent quick wins. Item 1 is the big architectural investment that pays off when the next 3-5 modules are added.

---

## Commit History (understanding what was added when)

```
8a4769d Fix P0/P1 bugs: crashes, data loss, and silent failures (#34)
c045b60 Fix blank page crash when clicking Design Extractor (#33)
2845727 Add programmatic extraction, SalesOS reference library, and instant extract (#32)
0128ad0 Stream Design Extractor API + real-time progress bar (#31)
bc8c9cb Fix base path for Vercel deployment (#30)
e478c98 Make download buttons generate HTML from live app state (#29)
1ce8aa4 Add file workspace with sample files, card grid, and detail canvas (#28)
3d09195 Fix: add design-extractor to moduleFilter so it appears in sidebar (#27)
a4f0f27 Move Claude API calls server-side via Vercel serverless functions (#26)
2d42136 Add Design Extractor as integrated module in main app sidebar
```

---

## Testing Checklist

- [ ] React DevTools Profiler shows FileCard NOT re-rendering on theme toggle
- [ ] React DevTools Profiler shows FileCard NOT re-rendering when sidebar is clicked (same module)
- [ ] Network tab shows demo-data chunks loaded lazily on first module click, not at page load
- [ ] Initial bundle size reduced by ~100 KB (check `npm run build` output)
- [ ] Demo mode still works — clicking "Demo" loads sample data, shows in grid
- [ ] No flash of empty state while sample data loads
- [ ] Adding a new module requires only creating a `modules/{name}/` directory with config (Item 1)
- [ ] All existing modules still work identically after plugin refactor
- [ ] Sidebar groups render correctly from module configs
- [ ] FileWorkspace card metrics come from module config, not hardcoded switch
