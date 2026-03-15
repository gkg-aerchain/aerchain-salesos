# Context Transfer: App.jsx Modifications

**Date:** 2026-03-15
**From session:** claude/setup-aerchain-salesos-WRBkk
**For:** Next Claude Code session implementing App.jsx changes
**Author:** Gaurav Guha (Head of Sales, Aerchain) via Claude Code

---

## 1. WHY THIS DOCUMENT EXISTS

The current branch (`claude/setup-aerchain-salesos-WRBkk`) has 3 commits pending merge that touch prototype HTML, mockup HTML, and config files — but NOT App.jsx. During this session, critical architectural corrections were made by Gaurav that fundamentally change how App.jsx should work. This document captures everything the next session needs to implement those changes.

---

## 2. CRITICAL ARCHITECTURAL CORRECTIONS

These were stated directly by Gaurav during this session. They override the assumptions baked into the current App.jsx.

### Correction 1: Claude API Role

**WRONG (current code):** Claude API "syncs" data — `getSyncPrompt()` tells Claude to "Fetch current pricing intelligence" and Claude generates fictional/hallucinated data.

**CORRECT:** Claude API is a **processing engine**. Users upload pricing data, proposal documents, and files INTO the app. The app passes those inputs to Claude via API. Claude processes the real inputs (analyzes pricing, generates proposal documents) and returns structured output back to the app.

**Gaurav's exact words:**
> "Cloud API is not really syncing data; it's being used as an API call using the proposal information and files. We have uploaded inside the Sales OS app into the Pricing Calculator module or the Proposal module. And it is then passing that to Cloud API to process the input and prepare the result, and then push the output back into the Sales OS app."

### Correction 2: Sync Button Scope

**WRONG (current code):** Sync button appears on Pricing Calculator and Proposal Generator modules.

**CORRECT:** Sync button is a **general app artifact** — keep it in the app but **remove it from Pricing Calculator and Proposal Generator**. Those modules get an upload → process → output flow instead.

**Gaurav's exact words:**
> "The sync button is going to be used for other users, so keep that as an overall app artifact, but remove it from the pricing calculator and a proposal generator context."

### Correction 3: Data Flow Direction

**WRONG:** Claude → App (Claude generates data, app displays it)
**CORRECT:** User → App → Claude → App (User uploads, app sends to Claude, Claude processes, app displays output)

---

## 3. WHAT TO CHANGE IN APP.JSX (Line-by-Line Reference)

App.jsx is currently 1,144 lines. Here is every section that needs modification:

### 3.1 getSyncPrompt() — Lines 46-55
**Current:** Returns a prompt telling Claude to "Fetch current pricing intelligence" with a hardcoded JSON shape.
**Change:** This function should NOT be used for pricing-calculator or proposal-generator. Either:
- Remove the pricing-calculator prompt entirely
- Or refactor to accept user-provided input data as context for Claude to process
- Keep the fallback for other potential future modules that DO use sync

### 3.2 callClaude() — Lines 109-138
**Current:** System prompt says "You are a data sync agent for Aerchain SalesOS. Return ONLY the raw JSON object requested."
**Change:** The system prompt needs to be context-dependent:
- For pricing processing: "You are a pricing analysis engine. Analyze the provided pricing data and return structured output."
- For proposal generation: "You are a proposal generation engine. Using the provided inputs, generate a structured proposal."
- The function signature may need to accept different system prompts per use case

### 3.3 callNotion() — Lines 148-154
**Current:** Stub that throws an error.
**Change:** Wire up with real Notion API calls. The token is available as `import.meta.env.VITE_NOTION_API_KEY`. Key operations needed:
- Create pages (for audit log entries)
- Append blocks to pages
- Query/search pages
- **IMPORTANT:** This exposes the token in the browser. For production, needs a backend proxy. For now, direct calls are acceptable for development.

### 3.4 Design Tokens T — Lines 156-175
**Current:** Flat JavaScript object with hardcoded color values.
**Change:** Should migrate to CSS custom properties matching the Dark Canvas v3 system used in the prototype (`public/aerchain-prototype.html`). The prototype uses:
```css
--canvas:       linear-gradient(145deg, hsl(265 30% 7%) 0%, ...);
--glass-1:      rgba(255,255,255,0.04);
--glass-2:      rgba(255,255,255,0.07);
--glass-border: rgba(255,255,255,0.09);
--fg:           rgba(255,255,255,0.88);
--fg2:          rgba(255,255,255,0.60);
--fg3:          rgba(255,255,255,0.35);
--primary:      hsl(262 75% 62%);
--accent:       hsl(275 80% 65%);
--green:        hsl(152 60% 52%);
--amber:        hsl(38 85% 58%);
--red:          hsl(0 72% 62%);
```
Plus glass morphism surfaces (`backdrop-filter: blur(40px)`), animated gradient orbs, and dark/light theme toggle support via `data-theme` attribute.

### 3.5 EmptyState Component — Lines 215-236
**Current:** Shows "No data yet — use Demo to preview, or Sync when APIs are connected" with a "Sync Now" button.
**Change:** For pricing-calculator and proposal-generator, the empty state should show an upload prompt instead:
- "Upload pricing data to get started" / "Upload proposal documents to get started"
- File upload UI (drag-and-drop zone or file picker)
- No "Sync Now" button for these modules

### 3.6 PricingCalcView — Lines 330-379
**Current:** Read-only view with KPI cards and deals table. Data comes from sync (Claude-generated).
**Change:** This view needs to become interactive:
- File/data upload area at the top
- "Process with Claude" button (replaces sync)
- Output section showing Claude's analysis results
- The KPI cards and table can stay but should show processed results, not synced data

### 3.7 ProposalsView — Lines 405-458
**Current:** Read-only view with KPI cards and proposals table.
**Change:** Similar to PricingCalcView:
- Document/file upload area
- "Generate Proposal" button
- Output section showing Claude-generated proposal
- Table shows uploaded/generated proposals, not synced data

### 3.8 ModuleContent Router — Lines 631-645
**Current:** Routes to views, uses `EmptyState` with `onSync` for empty modules.
**Change:** For pricing-calculator and proposal-generator, should NOT pass `onSync`. Should pass upload handlers instead.

### 3.9 Notion Audit Sync — Lines 738-758
**Current:** 30-minute timer writes to localStorage only with a TODO comment.
**Change:** Replace with real Notion API calls:
- Use `callNotion()` (once wired up) to create audit entries
- Each entry should be a child block under the appropriate module's log page
- The parent page exists: ID `32401f61-8de2-80c0-bb83-c67614b4ac93`

### 3.10 syncModule() — Lines 762-788
**Current:** Calls `getSyncPrompt(key)` → `callClaude(prompt)` → parses JSON → stores in moduleData.
**Change:** This function should NOT be called for pricing-calculator or proposal-generator. It can remain for other modules that genuinely use sync. For pricing/proposal modules, create separate `processWithClaude(key, inputData)` function.

### 3.11 Topbar Sync All Button — Lines 896-905
**Current:** "Sync All" button syncs all modules.
**Change:** Keep as general app artifact. It should only sync modules that use sync (exclude pricing-calculator and proposal-generator from `syncAll`).

### 3.12 Module Header Sync Button — Line 1049
**Current:** `{selected !== "settings" && <SyncBtn onClick={() => syncModule(selected)} loading={isSyncing} size={14}/>}`
**Change:** Also exclude pricing-calculator and proposal-generator:
```jsx
{selected !== "settings" && selected !== "pricing-calculator" && selected !== "proposal-generator" && <SyncBtn ... />}
```

### 3.13 Quick Sync Strip — Lines 1096-1112
**Current:** Shows sync buttons for all non-settings modules.
**Change:** Filter out pricing-calculator and proposal-generator from the quick sync strip.

### 3.14 NOTION_AUDIT_CONFIG — Lines 18-28
**Current:** `masterPageUrl` is a placeholder URL.
**Change:** Update to the real URL: `https://www.notion.so/Claude-Code-Log-DB-Dump-32401f618de280c0bb83c67614b4ac93`
Module page URLs should be set when the sub-pages are created programmatically.

### 3.15 Settings API Connections Tab — Lines 572-596
**Current:** Shows Notion status as "Stub".
**Change:** Notion is now configured — update the status indicator to reflect that `VITE_NOTION_API_KEY` is set and `callNotion()` is wired up (once implemented).

---

## 4. DESIGN SYSTEM MIGRATION

The prototype HTML (`public/aerchain-prototype.html`) has been fully re-themed to Dark Canvas v3 with:

1. **CSS Custom Properties** — All colors via `--var` tokens, not hardcoded
2. **Glass Morphism** — `backdrop-filter: blur(40px)` on surfaces
3. **Animated Orbs** — Background gradient orbs with CSS animations
4. **Dark/Light Theme Toggle** — `data-theme="dark"` attribute with full light theme token set
5. **Multi-stop Gradient Canvas** — Instead of flat `#0d0a1e`

App.jsx currently uses the flat `T` object (line 160-175). The migration should:
- Replace the `T` object with CSS custom properties injected via the `useEffect` style injection (line 674-690)
- Update all `style={{ color: T.text }}` references to use `var(--fg)` etc.
- Add glass morphism to Card, topbar, sidebar components
- Add animated background orbs
- Add theme toggle button

**Reference:** Look at `public/aerchain-prototype.html` lines 8-130 for the complete Dark Canvas v3 CSS token set and glass morphism styles.

---

## 5. NEW COMPONENTS NEEDED

### 5.1 FileUploadZone
A drag-and-drop file upload component for pricing data and proposal documents.
- Accepts: CSV, PDF, DOCX, XLSX, JSON
- Shows file list after upload
- "Process" / "Generate" button to send to Claude API

### 5.2 ProcessingStatus
Shows the status of Claude API processing:
- Uploading → Processing → Complete
- Spinner/progress during processing
- Error state with retry

### 5.3 ProcessedOutput
Displays Claude's output after processing:
- For pricing: analysis results, KPI cards, recommendations
- For proposals: generated proposal document, download options

---

## 6. ENVIRONMENT & INTEGRATION STATUS

| Integration | Status | Key Location |
|---|---|---|
| Claude API | WORKING | `VITE_ANTHROPIC_KEY` in `.env.local` |
| Notion API | TOKEN SET, STUB NOT WIRED | `VITE_NOTION_API_KEY` in `.env.local` |
| Notion MCP | CONFIGURED | `.mcp.json` + `~/.claude.json` (local) |
| HubSpot | STUB | No key configured |
| Supabase | REMOVED | `supabaseClient.js` exports null |
| GitHub | WORKING | Git push/pull via proxy |

**Notion Page IDs:**
- Parent page (Claude Code Log/DB/Dump): `32401f61-8de2-80c0-bb83-c67614b4ac93`
- Token: stored in `.env.local` as `VITE_NOTION_API_KEY` and `NOTION_TOKEN`

---

## 7. FILES TO REFERENCE

| File | Why |
|---|---|
| `App.jsx` | The file being modified (1,144 lines) |
| `public/aerchain-prototype.html` | Dark Canvas v3 CSS tokens and glass morphism reference |
| `public/salesos-v3-mockup.html` | Design mockup with demo toggle and enriched panels |
| `demo-data/pricing-calculator.js` | Sample pricing data structure |
| `demo-data/proposal-generator.js` | Sample proposal data structure |
| `CLAUDE.md` | Session context loading instructions + architectural decisions |
| `.mcp.json` | MCP server config (Refero + Notion) |
| `.env.local` | API keys (gitignored) |

---

## 8. WHAT NOT TO CHANGE

- **demo-data/** — Keep as-is, still used for Demo mode toggle
- **main.jsx** — No changes needed
- **supabaseClient.js** — Leave as placeholder
- **vite.config.js** — No changes needed
- **Lumos marker** (lines 1117-1127) — Keep as-is (branding element)
- **Download snapshot** (lines 808-831) — Keep as-is
- **Download prototype** (lines 837-844) — Keep as-is
- **Sync log panel** (lines 1067-1113) — Keep but update to exclude pricing/proposal from quick sync

---

## 9. SUGGESTED IMPLEMENTATION ORDER

1. **Remove sync from pricing-calculator and proposal-generator** (quick win, fixes the architecture)
   - Lines 1049, 879-880, 896-905 (Sync All filtering), 1096-1112 (Quick Sync strip)
   - Update `EmptyState` to not show sync for these modules

2. **Wire up callNotion()** (enables audit logging)
   - Replace stub at lines 148-154
   - Update Notion audit sync at lines 738-758

3. **Migrate design tokens to CSS custom properties** (visual upgrade)
   - Replace `T` object with CSS vars
   - Add glass morphism, orbs, theme toggle

4. **Add file upload UI** (new capability)
   - FileUploadZone component
   - Update PricingCalcView and ProposalsView

5. **Rewrite Claude API for processing** (core feature change)
   - New `processWithClaude()` function
   - Context-dependent system prompts
   - Handle file content as input

---

## 10. GAURAV'S COMMUNICATION PREFERENCES

From CLAUDE.md — when giving instructions for actions outside the coding environment:
- Be extremely granular — say exactly which app, where to click, what to type
- Never assume familiarity with developer tools
- Treat every instruction like explaining to someone who has never used a terminal

---

*End of Context Transfer Document*
