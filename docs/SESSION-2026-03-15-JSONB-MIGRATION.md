# Session Log — 2026-03-15 — JSONB-First Supabase Migration & Vercel Env Fix

## Problem
- Live app showed no files/data
- Root cause: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` missing from Vercel env vars
- `supabaseClient.js` returns `null` when env vars absent → all DB functions return null → empty app
- Demo data seed fallback had masked this issue until it was removed

## Fixes Applied

### 1. Vercel Environment Variables
- Added `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` via Vercel API
- Triggered production redeploy

### 2. JSONB-First Schema Migration (Option B)

**Before (rigid schema):**
```
saved_files: id, module_key, name, description, status, source, tags, tokens, metadata, created_at, updated_at
modules: id, label, data, status, last_synced, stale_after_hrs, created_at, updated_at
```

**After (JSONB-first):**
```
saved_files: id, module_key, data (JSONB), created_at, updated_at
modules: id, data (JSONB), created_at, updated_at
```

The app's in-memory object IS the DB `data` column. No mapping layer, no property loss.

### 3. Code Changes
- `lib/supabase.js`: Rewritten — save/load functions store/retrieve objects as-is
- `App.jsx`: Removed `DUMMY_DATA`/`SAMPLE_FILES` import and seed fallback

## PRs Merged
- **PR #41**: Fix Supabase schema mismatch, remove demo data seed
- **PR #42**: JSONB-first Supabase schema — app shape drives DB

## Supabase API Landscape (Reference)

| API | Endpoint | Auth Key | Can Do |
|-----|----------|----------|--------|
| REST (PostgREST) | `{project}.supabase.co/rest/v1/` | `anon_key` or `service_role_key` | CRUD on rows |
| Management | `api.supabase.com/v1/projects/{ref}/` | `SUPABASE_ACCESS_TOKEN` | Schema changes, SQL, project config |
| Direct SQL | `psql` connection | `SUPABASE_DB_PASS` | Full Postgres access |

## DB Schema (Final)

### modules
| Column | Type | Notes |
|--------|------|-------|
| id | text (PK) | e.g. "pricing-calculator" |
| data | jsonb | Full module state: `{ data, status, lastSynced, staleAfterHrs, syncCount }` |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Set on upsert |

### saved_files
| Column | Type | Notes |
|--------|------|-------|
| id | text (PK) | e.g. "pc-001" |
| module_key | text | Groups files by module |
| data | jsonb | Full file object — any properties the app puts on it |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Set on upsert |

## Architectural Decision Record

**Decision**: JSONB-first schema — app shape drives DB, not the other way around.

**Context**: As the app evolves, each module will develop unique file properties (sync flags, client info, design tokens, etc.). A rigid column-per-property schema requires migrations for every frontend change.

**Consequence**:
- Frontend can add any property and it persists automatically
- No schema migrations needed for new properties
- Trade-off: less type safety at DB level, but queryable via JSONB operators (`data->>'status'`)
- If query perf matters later, add GIN index: `CREATE INDEX idx_sf_data ON saved_files USING gin(data)`
