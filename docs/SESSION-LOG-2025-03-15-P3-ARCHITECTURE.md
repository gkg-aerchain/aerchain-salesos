# Session Log — 2025-03-15 — P3 Architecture Refactor

## Session Context
- **Branch:** `claude/p3-architecture-changes-y2Pl3`
- **Base:** `main` at commit `ab3477f` (after P2 merge)
- **Prior work:** P0/P1 (commit `8a4769d`), P2 (commit `ab3477f` via PR #35)

---

## Phase 1: Monolith Split (Commit db40d92)

The primary objective was to decompose the 1,880-line `App.jsx` monolith into a clean three-layer architecture: `lib/` (pure utilities), `components/` (shared UI), and `views/` (module-specific screens).

### Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `lib/constants.js` | 41 | `UPLOAD_MODULES`, `GROUPS`, `MOD`, `NOTION_AUDIT_CONFIG`, `getSyncPrompt`, `PROCESS_SYSTEM_PROMPTS` |
| `lib/utils.js` | 41 | `extractJSON`, `isStale`, `safePersist`, `timeAgo`, `fmt$` |
| `lib/api.js` | 74 | `callClaude`, `callHubSpot`, `callNotion`, `createNotionAuditEntry`, `processWithClaude` |
| `lib/theme.js` | 165 | `T` design tokens (single source of truth), `buildThemeStylesheet()` |
| `components/Common.jsx` | 119 | `StatusDot`, `Spinner`, `SyncBtn`, `FileUploadZone`, `Card`, `EmptyState` |
| `components/Branding.jsx` | 51 | `AerchainLogo`, `NotionIcon`, `NotionAuditLink` |
| `components/DataDisplay.jsx` | 50 | `StatCard`, `tableStyle`, `thStyle`, `tdStyle`, `stageBadge`, `statusBadge` |
| `components/ModuleRouter.jsx` | 136 | `ModuleErrorBoundary`, `ModuleContent` (with `React.memo`) |
| `views/PricingCalcView.jsx` | 92 | Upload & Process, KPIs, Deals table, Claude Analysis |
| `views/ProposalsView.jsx` | 103 | Upload & Generate, proposal output, KPIs, table |
| `views/SettingsView.jsx` | 259 | Tabbed: Memory, Theme, Notion Audit, API Connections, Database |
| `views/GenericView.jsx` | 12 | JSON pretty-print fallback |

### Files Modified

- **App.jsx:** 1,880 → 693 lines (**63% reduction**)
- **DesignExtractorView.jsx:** Replaced inline `T` with import from `lib/theme.js`
- **FileWorkspace.jsx:** Replaced inline `T` and `fmt$` with imports

### Duplications Eliminated

1. **T tokens** — was in `App.jsx`, `DesignExtractorView.jsx`, `FileWorkspace.jsx` → now only in `lib/theme.js`
2. **withRetry** — was in `App.jsx` and `lib/retry.js` → now only in `lib/retry.js` (via `lib/api.js`)
3. **fmt$** — was in `App.jsx` and `FileWorkspace.jsx` → now only in `lib/utils.js`

---

## Phase 2: 22-Item P0-P3 Audit

A comprehensive audit was conducted across all priority levels to identify and resolve issues introduced during the rapid P0-P2 development phases.

### Audit Results

| # | Priority | Item | Status |
|---|----------|------|--------|
| 1 | P0 | Error boundary around ModuleContent | APPLIED |
| 2 | P0 | SSE stream null result crash | APPLIED |
| 3 | P0 | Deleted files reappear on refresh | FIXED (ea54eb1) |
| 4 | P1 | Unprotected JSON.parse on Notion sync | APPLIED |
| 5 | P1 | AbortController on extraction fetch | APPLIED |
| 6 | P1 | try/catch on localStorage.setItem | APPLIED |
| 7 | P1 | Multi-file instant extract token merge | APPLIED |
| 8 | P1 | Navigation preserves extraction progress | APPLIED |
| 9 | P1 | Shared T tokens single source | APPLIED |
| 10 | P1 | Split App.jsx monolith | APPLIED |
| 11 | P1 | Snapshot tests for generators.js | FIXED (ea54eb1) |
| 12 | P2 | Retry logic on callExtractAPI | APPLIED |
| 13 | P2 | Duplicate prevention on Save to Library | APPLIED |
| 14 | P2 | backdrop-filter GPU performance | PARTIAL (by design) |
| 15 | P2 | Saved files store only tokens | APPLIED |
| 16 | P2 | Debounce localStorage writes | APPLIED |
| 17 | P2 | Deduplicate SAMPLE_FILES + savedFiles | APPLIED |
| 18 | P2 | EmptyState sync button for upload modules | APPLIED |
| 19 | P3 | Module plugin architecture | PARTIAL (config exists, routing hardcoded) |
| 20 | P3 | React.memo on FileCard/ModuleContent | FIXED (ea54eb1) |
| 21 | P3 | Lazy load demo-data | FIXED (ea54eb1) |
| 22 | P3 | Design extractor retry logic | APPLIED |

### Audit Notes

- **Item 14 (backdrop-filter):** Kept as PARTIAL intentionally. The frosted-glass effect is a core brand element. GPU compositing overhead is acceptable on target hardware (modern Chrome/Edge). No mobile deployment planned.
- **Item 19 (plugin architecture):** The module config (`UPLOAD_MODULES`, `GROUPS`, `MOD`) exists in `lib/constants.js`, but `ModuleRouter.jsx` still uses hardcoded switch logic. Full dynamic routing deferred to a future session.

---

## Phase 3: Build Optimization (Commit ea54eb1)

### Bundle Size Comparison

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Main bundle (gzip) | 97.62 KB | 40.62 KB | **-58%** |
| Initial load (gzip) | 127.98 KB | 47.31 KB | **-63%** |
| Chunks | 2 | 5 | proper splitting |

### Optimizations Applied

1. **Vendor chunk splitting:** `react`/`react-dom` and `lucide-react` extracted as separate cached chunks. These libraries change infrequently, so browsers cache them across deployments.
2. **Externalized `@anthropic-ai/sdk`** from client bundle. This is a server-only dependency used in `/api/` serverless functions — it was being bundled into the client unnecessarily, adding ~40KB gzipped.
3. **Disabled production source maps.** Source maps were being generated and deployed, doubling the effective bundle size on the CDN. Not needed in production (Vercel provides its own error tracking).
4. **Lazy-loaded demo-data** (~30KB deferred to first Demo Mode toggle). The `demo-data/` module is only needed when users activate Demo Mode, which is a development/sales tool — not the default flow.
5. **React.memo on FileCard and ModuleContent.** Prevents unnecessary re-renders when parent state changes (e.g., sidebar toggle, theme switch) don't affect these components.

### Test Coverage Added

- **37 snapshot tests** for `lib/generators.js` via vitest
- Covers: `generateHTML`, `generateMarkdown`, `generateJSON`, `generateReactTheme`, `buildOutputs`
- All passing in **202ms**
- Test file: `lib/__tests__/generators.test.js`

---

## Phase 4: File Hierarchy Cleanup (Commit 609f88d)

Files that were created during rapid prototyping in the root directory were moved to their proper locations in the organized hierarchy:

- `DesignExtractorView.jsx` → `views/DesignExtractorView.jsx`
- `FileWorkspace.jsx` → `components/FileWorkspace.jsx`
- `design-references/` → `docs/design-references/`
- `design-variants/` → `docs/design-variants/`

### tools/design-extractor/ Audit

The standalone prototype in `tools/design-extractor/` was audited against the integrated version in `views/DesignExtractorView.jsx`. Conclusion: **FULLY SUPERSEDED**.

The integrated version adds the following capabilities that the standalone prototype lacks:

- SSE streaming (real-time extraction progress)
- Instant extract (zero API cost for HTML/CSS files)
- Save to Library (persistent token storage)
- AbortController support (cancel in-flight extractions)
- Retry logic with exponential backoff
- Session caching (extractions survive navigation)
- Prompt editor UI (customizable extraction prompts)
- Full theme integration (respects app-wide design tokens)

The standalone prototype is retained in `tools/design-extractor/` as an archived reference but should not be used for development.

---

## Final Repository Structure

```
/ (root)
├── App.jsx, main.jsx, index.html, vite.config.js, package.json
├── api/                    (serverless functions)
├── lib/                    (pure utilities + tests)
│   ├── constants.js, utils.js, api.js, theme.js, retry.js
│   ├── generators.js, programmaticExtractor.js
│   └── __tests__/generators.test.js
├── components/             (shared UI)
│   ├── Common.jsx, Branding.jsx, DataDisplay.jsx
│   ├── ModuleRouter.jsx, FileWorkspace.jsx
├── views/                  (module views)
│   ├── PricingCalcView.jsx, ProposalsView.jsx
│   ├── SettingsView.jsx, GenericView.jsx, DesignExtractorView.jsx
├── demo-data/              (lazy-loaded)
├── docs/                   (static design assets)
└── tools/design-extractor/ (archived prototype)
```

### Layer Responsibilities

| Layer | Directory | Role | Import Rules |
|-------|-----------|------|--------------|
| Utilities | `lib/` | Pure functions, constants, API wrappers | May import nothing from `components/` or `views/` |
| Components | `components/` | Shared, reusable UI primitives | May import from `lib/` only |
| Views | `views/` | Module-specific screens | May import from `lib/` and `components/` |
| App Shell | `App.jsx` | State management, routing, layout | May import from all layers |

---

## Architecture Assessment

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Separation of concerns | **EXCELLENT** | 3-layer architecture, zero cross-view imports |
| State management | **EXCELLENT** | Centralized in `App.jsx`, passed via props |
| Scalability | **GOOD** | New module = 2-3 file changes (constant, view, router case) |
| Performance | **GOOD** | React.memo, lazy-load, vendor splitting |
| Build health | **PASSING** | 1.94s build, zero errors, zero warnings |
| Test coverage | **GOOD** | 37 snapshot tests on generators, all passing |
| Code duplication | **MINIMAL** | 3 major duplications eliminated in Phase 1 |

---

## Commit History

| Commit | Phase | Description |
|--------|-------|-------------|
| `db40d92` | Phase 1 | Monolith split: App.jsx decomposed into lib/, components/, views/ |
| `ea54eb1` | Phase 3 | Build optimization: -63% bundle, snapshot tests, memo, lazy-load |
| `609f88d` | Phase 4 | File hierarchy cleanup: moved files to proper directories |

---

## Pending

- Awaiting **"Excelsior"** codeword to merge to `main`
- Remaining optimization opportunities:
  - **Brotli compression:** Vercel supports Brotli natively; enable via `vercel.json` for additional ~15% size reduction
  - **Lazy-load DesignExtractorView:** Currently bundled in main chunk; could be code-split since it's a heavy module (~259 lines + FileWorkspace)
  - **Archive tools/design-extractor/:** Confirmed superseded; can be removed from repo entirely or moved to a separate archive branch
