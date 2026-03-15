# Context Transfer: Supabase Integration + Cleanup Session
**Date:** 2026-03-15
**Notion Log:** [Session Log](https://www.notion.so/Session-Log-2026-03-15-Supabase-Integration-Cleanup-32401f618de281d984b0cd1a0f0ce6aa)

---

## What Is This App?

**Aerchain SalesOS** — a React SPA (Vite + React 18) that serves as an internal sales operations platform for Aerchain ($6M ARR, $20B+ spend managed). It's a modular dashboard where each module processes user-uploaded data through Claude API and displays structured results.

**Deployed on Vercel.** API routes (`/api/extract`, `/api/process`, `/api/health`) are Vercel serverless functions that proxy Claude API calls — the Anthropic key never touches the browser.

---

## Architecture Overview

```
aerchain-salesos/
├── App.jsx                    # Main shell: sidebar, topbar, module routing, state management
├── main.jsx                   # React DOM entry point
├── index.html                 # Vite HTML entry
├── supabaseClient.js          # Supabase client init (env-based, null if no keys)
├── vite.config.js             # Vite config: React, gzip/brotli compression, vendor splitting
├── vercel.json                # Vercel routing config
├── package.json               # Dependencies: react, supabase, jszip, lucide-react, anthropic-sdk
│
├── lib/                       # Pure utilities (no React)
│   ├── constants.js           # MOD registry, GROUPS, UPLOAD_MODULES, system prompts
│   ├── utils.js               # extractJSON, isStale, safePersist, timeAgo, fmt$
│   ├── api.js                 # callClaude, callNotion, createNotionAuditEntry, processWithClaude
│   ├── theme.js               # T token object + buildThemeStylesheet (CSS custom properties)
│   ├── generators.js          # generateHTML/Markdown/JSON/ReactTheme from design tokens
│   ├── programmaticExtractor.js  # Instant HTML/CSS → token extraction (no API call)
│   ├── retry.js               # withRetry wrapper for fetch calls
│   ├── supabase.js            # Supabase data layer: CRUD for modules, saved_files, claude_memory, sync_log
│   └── __tests__/
│       └── generators.test.js # 37 snapshot tests (vitest)
│
├── components/                # Shared React components
│   ├── Common.jsx             # StatusDot, Spinner, SyncBtn, Card, FileUploadZone, EmptyState
│   ├── Branding.jsx           # AerchainLogo, NotionAuditLink
│   ├── DataDisplay.jsx        # Lazy-loaded data display helpers
│   ├── ModuleRouter.jsx       # ModuleErrorBoundary + ModuleContent (module routing logic)
│   └── FileWorkspace.jsx      # File management UI (create, duplicate, delete, preview)
│
├── views/                     # Module-specific view components (lazy-loaded)
│   ├── PricingCalcView.jsx    # Pricing calculator display
│   ├── ProposalsView.jsx      # Proposal generator display
│   ├── DesignExtractorView.jsx # Design system extractor (file upload, Claude extraction, 4 output formats)
│   ├── GenericView.jsx        # Fallback for modules without custom views
│   └── SettingsView.jsx       # Settings + Claude memory management
│
├── api/                       # Vercel serverless functions
│   ├── extract.js             # POST /api/extract — SSE streaming design extraction via Claude
│   ├── process.js             # POST /api/process — General Claude processing for modules
│   └── health.js              # GET /api/health — Health check
│
├── demo-data/                 # Sample data (lazy-loaded only in Demo Mode)
│   ├── index.js               # Re-exports DUMMY_DATA + SAMPLE_FILES
│   ├── pricing-calculator.js
│   ├── proposal-generator.js
│   └── design-extractor.js
│
├── docs/                      # Documentation + design reference HTML files
│   ├── design-references/
│   └── design-variants/
│
└── public/                    # Static HTML prototypes
```

---

## Module System

4 modules registered in `lib/constants.js`:

| Key | Label | Type | View |
|-----|-------|------|------|
| `pricing-calculator` | Pricing Calculator | Upload + process | `PricingCalcView.jsx` |
| `proposal-generator` | Proposal Generator | Upload + process | `ProposalsView.jsx` |
| `design-extractor` | Design Extractor | Upload + extract | `DesignExtractorView.jsx` |
| `settings` | Settings | Config | `SettingsView.jsx` |

**Upload modules** (`UPLOAD_MODULES` Set): pricing-calculator, proposal-generator, design-extractor
- These do NOT use the "Sync" button — users upload files, Claude processes them
- The sync button is for non-upload modules only (currently none active)

**Module routing** (`components/ModuleRouter.jsx`):
- Uses `MODULE_VIEWS` registry with `React.lazy()` for code-splitting
- Design Extractor has special handling (FileWorkspace + extractor combo)
- Wrapped in `ModuleErrorBoundary` for graceful crash recovery

---

## Data Flow

```
User uploads files → App reads file contents →
  App calls /api/extract or /api/process (Vercel serverless) →
    Serverless function calls Claude API with system prompt →
      Claude returns structured JSON →
        App parses JSON, stores in state →
          State persists to Supabase (primary) + localStorage (fallback)
```

**Key principle:** Claude API is a **processing engine**, not a sync agent. It processes user inputs and returns structured outputs.

---

## Supabase Integration (NEW — This Session)

**Project:** aerchain-salesos (ID: `cjzoyqajycxrhcvjcozj`, region: us-east-1)
**Org:** GKG-Aerchain (ID: `gbujogkvlrdcboamcwmh`)

### Schema (5 tables)

**`modules`** — Module data storage
| Column | Type | Notes |
|--------|------|-------|
| `module_key` | text PK | e.g. "pricing-calculator" |
| `data` | jsonb | The module's processed data |
| `status` | text | e.g. "🟢 Fresh", "🔴 Error" |
| `last_synced` | timestamptz | Last sync timestamp |
| `stale_after_hrs` | integer | Hours before data is "stale" (default 4) |
| `sync_count` | integer | Number of syncs performed |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto (trigger) |

**`saved_files`** — User-created files per module
| Column | Type | Notes |
|--------|------|-------|
| `id` | serial PK | Auto-increment |
| `module_key` | text | Parent module |
| `file_id` | text | Client-generated ID |
| `name` | text | File name |
| `description` | text | Optional |
| `status` | text | "draft", etc. |
| `tags` | jsonb | Array of strings |
| `data` | jsonb | File content |
| `tokens` | jsonb | Design tokens (for extractor files) |
| `created_at` / `updated_at` | timestamptz | Auto |
- Unique constraint on `(module_key, file_id)`

**`claude_memory`** — Claude interaction history
| Column | Type |
|--------|------|
| `id` | serial PK |
| `module` | text |
| `prompt` | text |
| `response` | text |
| `created_at` | timestamptz |

**`sync_log`** — Audit trail
| Column | Type |
|--------|------|
| `id` | serial PK |
| `action` | text |
| `module` | text |
| `summary` | text |
| `detail` | jsonb |
| `created_at` | timestamptz |

**`notion_audit_log`** — Notion sync audit
| Column | Type |
|--------|------|
| `id` | serial PK |
| `action` | text |
| `module` | text |
| `summary` | text |
| `created_at` | timestamptz |

### Data Layer (`lib/supabase.js`)

All functions return `null` when supabase client is unavailable, enabling graceful localStorage fallback:

```
loadModuleData() → { [module_key]: { data, status, lastSynced, staleAfterHrs, syncCount } }
saveModuleData(moduleKey, entry)
saveAllModuleData(moduleData)
loadSavedFiles() → { [module_key]: [...files] }
saveFile(moduleKey, file)
deleteFileFromDB(moduleKey, fileId)
saveAllFiles(savedFiles)
loadClaudeMemory() → [{ module, prompt, response, timestamp }]
saveClaudeMemoryEntry(entry)
clearClaudeMemoryDB()
writeSyncLog(entry)
```

### Dual-Write Pattern in App.jsx

- **On mount:** `Promise.all([sbLoadModules(), sbLoadFiles(), sbLoadMemory()])` — falls back to localStorage if any return null
- **On change:** Debounced (500ms) writes go to BOTH `safePersist()` (localStorage) AND `sbSave*()` (Supabase)
- **File deletes:** Immediate `sbDeleteFile()` call alongside state update
- **Claude memory:** Append via `sbSaveMemEntry()`, clear via `sbClearMemory()`
- **beforeunload:** Flushes to localStorage only (sync, can't await Supabase)

---

## Theming

3 themes: `dark` (default), `light`, `clean`
- CSS custom properties on `:root[data-theme]`
- `T` object in `lib/theme.js` maps semantic names to `var()` references
- `buildThemeStylesheet()` injects all theme CSS at mount

---

## Build & Bundle

**Vite config** (`vite.config.js`):
- React plugin
- Brotli + gzip pre-compression (vite-plugin-compression)
- `@anthropic-ai/sdk` externalized (server-only, not in client bundle)
- Manual chunks: `vendor-react`, `vendor-icons`, `vendor-supabase`

**Current bundle sizes (gzip):**
| Chunk | Size |
|-------|------|
| Main app (`index-*.js`) | 21.8 KB |
| Vendor React | 43.2 KB |
| Vendor Supabase | 46.1 KB |
| Vendor Icons (lucide) | 6.3 KB |
| DesignExtractorView | 12.4 KB |
| FileWorkspace | 4.5 KB |
| generators | 3.9 KB |
| jszip | 30.3 KB |

**Tests:** 37 snapshot tests in `lib/__tests__/generators.test.js` (vitest)

---

## Environment Variables

All secrets auto-bootstrapped from Notion Secrets Vault at session start.

| Variable | Purpose | Used By |
|----------|---------|---------|
| `GITHUB_PAT` | GitHub API (PRs, merges) | Claude Code session |
| `VITE_NOTION_API_KEY` | Notion API (audit logging) | Browser + serverless |
| `NOTION_TOKEN` | Notion MCP server | MCP config |
| `VERCEL_TOKEN` | Vercel deployments | Claude Code session |
| `SUPABASE_ACCESS_TOKEN` | Supabase Management API | Claude Code session |
| `VITE_SUPABASE_URL` | Supabase project URL | Browser (supabaseClient.js) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Browser (supabaseClient.js) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin access | Server-side only |

**Bootstrap process** (per CLAUDE.md):
1. Fetch Notion Secrets Vault page (ID: `32401f61-8de2-818d-be2c-ed7e0e24dc29`) using bootstrap token
2. Read all code blocks → write to `.env.local`

---

## Git History (Recent)

```
4d6519a Remove standalone design extractor, add model selection to integrated view
ef24193 Wire Supabase as primary data store with localStorage fallback
6412088 Add Supabase client configuration and dependency
87f84fb Optimize: Brotli/gzip compression, lazy-load views, module plugin registry
dc0d78e Update transcript with final agent output (secrets redacted)
32a6619 Add P3 session log and full conversation transcript (secrets redacted)
609f88d P3: Move files into modular architecture + relocate design assets
fe4b224 Add vitest snapshot files for generators.js tests
ea54eb1 P3: Fix remaining audit items + optimize build
db40d92 P3: Split App.jsx monolith into modular file structure
ab3477f P2: Quality & polish fixes — items 1-7
8a4769d Fix P0/P1 bugs: crashes, data loss, and silent failures
c045b60 Fix blank page crash when clicking Design Extractor
2845727 Add programmatic extraction, SalesOS reference library, and instant extract
0128ad0 Stream Design Extractor API + real-time progress bar
```

**Merged PRs:**
- #34: P0/P1 bug fixes
- #35: P2 quality polish
- #36: P3 architecture refactor (monolith split)
- #37: Build optimizations (compression, lazy loading)
- #38: Supabase integration (cloud persistence)
- #39: Archive standalone extractor + model selection

---

## Key Architectural Decisions

1. **Monolith → Modular split:** App.jsx was 1,880 lines, split into `lib/`, `components/`, `views/`
2. **Dual-write persistence:** Supabase primary + localStorage fallback for offline resilience
3. **Lazy loading:** All view components + demo data loaded via `React.lazy()` / dynamic `import()`
4. **Vendor chunk splitting:** React, Lucide icons, Supabase SDK each in separate cached chunks
5. **Claude as processing engine:** Not a sync agent. Processes uploaded inputs, returns structured JSON.
6. **`safePersist` pattern:** Try/catch around localStorage.setItem for QuotaExceededError protection
7. **`savedFilesRef` pattern:** useRef to avoid stale closures in beforeunload flush handler
8. **Config-driven module routing:** `MODULE_VIEWS` registry replaces hardcoded switch statement
9. **SSE streaming for extraction:** `/api/extract` streams progress events for real-time UI feedback
10. **RLS on Supabase:** Enabled with permissive policies (single-tenant app, no multi-user auth yet)

---

## What's Working

- Full modular architecture with lazy-loaded views
- Supabase cloud persistence with localStorage fallback
- Design Extractor with model selection (Sonnet 4, Opus 4, Haiku 4)
- Programmatic extraction for HTML/CSS files (no API call needed)
- SSE streaming with real-time progress bar
- File workspace (create, duplicate, delete) per module
- 3-theme system (dark/light/clean) with CSS custom properties
- Brotli/gzip pre-compression on all assets
- 37 unit tests passing
- Notion audit logging
- Demo mode with lazy-loaded sample data
- Standalone HTML snapshot export

---

## What's NOT Done / Known Gaps

1. **HubSpot integration** — `callHubSpot()` in `api.js` throws "not yet connected"
2. **Multi-user auth** — Supabase RLS has permissive policies (single-tenant only)
3. **Supabase MCP server** — Not configured in `.mcp.json` yet (was discussed but not added)
4. **Refero MCP** — Configured in `.mcp.json` but `REFERO_API_KEY` not in `.env.local`
5. **Server-side model param** — `/api/extract` endpoint needs to accept and use the `model` param sent by DesignExtractorView (the client sends it, server may not read it yet)
6. **No Vercel redeployment** since Supabase changes — the env vars need to be added to Vercel project settings for production

---

## Communication Rules (from CLAUDE.md)

- **"geronimo" gate:** Do NOT execute code changes until Gaurav says "geronimo"
- **Never output raw file paths** — always use clickable GitHub URLs
- **HTML files** — always provide `htmlpreview.github.io` rendered links
- **Never ask for manual GitHub ops** — use `GITHUB_PAT` via API
- **Granular instructions** — explain every click, every keystroke for Gaurav
- **Secrets** — never in tracked files, always in `.env.local` or Notion vault

---

## Notion Integration

- **Session logs parent:** Page ID `32401f61-8de2-80c0-bb83-c67614b4ac93`
- **Secrets vault:** Page ID `32401f61-8de2-818d-be2c-ed7e0e24dc29`
- **Bootstrap token:** `ntn_bg5264870102NiuJgsMNitIoKAV8Jav8VTgmj475G9w4kb`
- **Audit entries:** Created via `createNotionAuditEntry()` in `lib/api.js`
- **Periodic sync:** 30-minute interval Notion audit in App.jsx
- **Session logging:** Each session creates a child page under the parent with full transcript

---

## Quick Start for New Session

```bash
# 1. Bootstrap secrets from Notion (CLAUDE.md prescribes this)
# 2. Check branch state
git status
git log --oneline -5

# 3. Verify build
npx vite build

# 4. Run tests
npx vitest run

# 5. Dev server
npx vite --port 3002
```
