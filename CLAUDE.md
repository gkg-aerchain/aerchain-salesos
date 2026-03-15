# Project Instructions

## Session Context from Notion (READ THIS FIRST)

At the start of every Claude Code session on this repo, fetch the latest session logs from Notion to understand prior work, decisions, and architectural context.

**Notion Parent Page:** "Claude Code Log/DB/Dump"
**Page ID:** `32401f61-8de2-80c0-bb83-c67614b4ac93`

### How to load context:
1. Read the Notion API key from `.env.local` (variable: `VITE_NOTION_API_KEY`)
2. Use the Notion MCP server (configured in `.mcp.json`) OR call the Notion API directly
3. Fetch child pages of the parent page above — these are session logs
4. Read the MOST RECENT session log to understand: what was built, what decisions were made, what's pending, and any architectural corrections
5. If a prior session log references corrections or pending work, treat those as active requirements

### What gets logged to Notion:
- Every Claude Code session should create a new child page under the parent page above
- Include: full conversation transcript, thinking/reasoning, decisions made, commits created, architectural corrections
- Title format: `Session Log — YYYY-MM-DD — [brief description]`
- At session end, push the log to Notion before closing

### Key architectural decisions (from prior sessions):
- Claude API is a **processing engine**, NOT a data sync agent — it processes user-uploaded inputs and returns outputs
- Sync button is a general app artifact — it is NOT used for Pricing Calculator or Proposal Generator
- Data flow: User uploads → App sends to Claude → Claude processes → Output returned to app
- Notion integration is for audit logging and session context persistence
- Token stored in `.env.local` (gitignored) — must be recreated per environment

## Communicating with Gaurav

When giving instructions that involve actions outside this environment (terminal commands, clicking things, navigating UIs, etc.), ALWAYS be extremely granular:

- Say exactly WHICH app/window to look at (e.g. "the Terminal window on your Mac", "this browser tab")
- Say exactly WHERE to click (e.g. "click inside the Terminal window so it's active")
- Say exactly WHAT to type or paste, and HOW to paste it (e.g. "press Cmd+V to paste")
- Say exactly WHAT key to press (e.g. "press the Enter key on your keyboard")
- Say exactly WHAT to look for to know it worked (e.g. "you'll see the % sign appear again")
- Say exactly WHERE to come back to and what to report

Never assume familiarity with developer tools. Treat every instruction like explaining to someone who has never used a terminal before.

## Output Links Rule (INVIOLABLE)

**NEVER output raw file paths, folder paths, or repo-relative paths as if Gaurav can do something with them.** He cannot click a file path. He cannot navigate a repo tree.

Every single reference to a location, file, folder, or action MUST be a **clickable hyperlink** — a full URL that opens directly in the browser when clicked.

- **Folders:** Link to the GitHub folder URL (e.g. `https://github.com/gkg-aerchain/aerchain-salesos/tree/branch/folder`)
- **Upload locations:** Link to the GitHub upload URL (e.g. `https://github.com/gkg-aerchain/aerchain-salesos/upload/branch/folder`)
- **Files:** Link to the GitHub file URL (e.g. `https://github.com/gkg-aerchain/aerchain-salesos/blob/branch/file`)
- **PRs:** Link to the PR URL
- **Anything else:** If it cannot be made into a clickable link, explain the action step-by-step with exact clicks instead

If you catch yourself writing something like `design-references/` or `App.jsx` in a sentence directed at Gaurav — STOP. Replace it with a clickable GitHub URL. No exceptions.

## HTML Preview Rule (INVIOLABLE)

Whenever you create an HTML file (prototype, preview, mockup, comparison, design reference — ANY `.html` file), you MUST:

1. Commit and push it to a branch
2. Immediately provide a **clickable htmlpreview.github.io link** so Gaurav can view it rendered in browser

**Format:** `https://htmlpreview.github.io/?https://github.com/gkg-aerchain/aerchain-salesos/blob/{branch}/{path-to-file}.html`

Do NOT just link to the raw GitHub blob. Do NOT just say "here's the file." Do NOT wait to be asked. The rendered preview link is ALWAYS provided automatically the moment the HTML file is pushed. No exceptions.

## GitHub API Access (INVIOLABLE — READ EVERY SESSION)

**NEVER ask Gaurav to do manual GitHub operations.** You have full GitHub API access. Use it.

**All secrets (GitHub PAT, Notion, Anthropic, HubSpot, etc.)** are stored in Notion and auto-loaded at session start.

### Auto-Bootstrap (EVERY SESSION — ANY DEVICE):
At the start of every session, BEFORE doing anything else:
1. The Notion token is the only hardcoded bootstrap key (see below)
2. Fetch the **Secrets Vault** page from Notion:
   - **Page ID:** `32401f61-8de2-818d-be2c-ed7e0e24dc29`
   - **Parent:** Under "Claude Code Log/DB/Dump"
   - Use `curl` with Notion API: `GET https://api.notion.com/v1/blocks/{page_id}/children`
   - **Notion Bootstrap Token:** `ntn_bg5264870102NiuJgsMNitIoKAV8Jav8VTgmj475G9w4kb`
3. Read all `code` blocks — each contains a `KEY=VALUE` pair
4. Write them ALL to `.env.local` (create or overwrite)
5. Now the session has every secret it needs — GitHub PAT, Notion keys, Anthropic key, etc.

**NEVER ask Gaurav for any token or secret.** Always pull from Notion first.
**NEVER put secrets in any tracked/committed file.** GitHub push protection will block it.

To add a new secret (e.g. HubSpot, Supabase): just add a code block to the Notion Secrets Vault page. Every future session picks it up automatically.

### Rules — NO EXCEPTIONS:
1. **PRs**: Create them yourself via `curl` to `https://api.github.com/repos/gkg-aerchain/aerchain-salesos/pulls` with the token as `Authorization: token <TOKEN>`
2. **Merges**: Merge them yourself via `curl` to `https://api.github.com/repos/gkg-aerchain/aerchain-salesos/pulls/{number}/merge`
3. **Any GitHub API operation**: Read the token from `.env.local` (`GITHUB_PAT`). Do not fumble around trying proxy paths, credential helpers, or env vars. Just use this token directly.
4. **NEVER tell Gaurav to open a GitHub link, click buttons, or do any manual git/GitHub work.** Handle it yourself end-to-end.
5. If the token is expired or rejected, ask Gaurav for a new one, store it in `.env.local`, and continue — but still never ask him to manually merge or create PRs.

### Custom Instruction — "geronimo" Gate:
Do NOT execute any code changes until Gaurav explicitly says **"geronimo"**. If waiting, prompt him. No exceptions.
