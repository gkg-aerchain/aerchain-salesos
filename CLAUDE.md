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

## GitHub API Access (INVIOLABLE — READ EVERY SESSION)

**NEVER ask Gaurav to do manual GitHub operations.** You have full GitHub API access. Use it.

**GitHub Personal Access Token:** Stored in `.env.local` as `GITHUB_PAT`. Read it from there every session.

### Rules — NO EXCEPTIONS:
1. **PRs**: Create them yourself via `curl` to `https://api.github.com/repos/gkg-aerchain/aerchain-salesos/pulls` with the token as `Authorization: token <TOKEN>`
2. **Merges**: Merge them yourself via `curl` to `https://api.github.com/repos/gkg-aerchain/aerchain-salesos/pulls/{number}/merge`
3. **Any GitHub API operation**: Read the token from `.env.local` (`GITHUB_PAT`). Do not fumble around trying proxy paths, credential helpers, or env vars. Just use this token directly.
4. **NEVER tell Gaurav to open a GitHub link, click buttons, or do any manual git/GitHub work.** Handle it yourself end-to-end.
5. If the token stops working, tell Gaurav it needs to be refreshed — but still never ask him to manually merge or create PRs.

### Custom Instruction — "geronimo" Gate:
Do NOT execute any code changes until Gaurav explicitly says **"geronimo"**. If waiting, prompt him. No exceptions.
