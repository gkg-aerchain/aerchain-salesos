import { withRetry } from "./retry.js";
import { PROCESS_SYSTEM_PROMPTS } from "./constants.js";

// Calls /api/process (Vercel serverless function) which holds the API key.
// No secrets in the browser.
export async function callClaude(prompt, { system, model = "claude-sonnet-4-6", maxTokens = 4000, moduleKey } = {}) {
  return withRetry(async () => {
    const res = await fetch("/api/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, system, model, maxTokens, moduleKey }),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      const err = new Error(e.error?.message || e.error || `HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    const data = await res.json();
    return data.text;
  }, { retries: 3, label: "callClaude" });
}

// TODO: connect with VITE_HUBSPOT_API_KEY when ready
export async function callHubSpot(endpoint, { method = "GET", body } = {}) {
  // eslint-disable-next-line no-unused-vars
  const apiKey = import.meta.env.VITE_HUBSPOT_API_KEY;
  throw new Error("HubSpot direct API not yet connected — set VITE_HUBSPOT_API_KEY and implement endpoint calls");
}

export async function callNotion(endpoint, { method = "POST", body } = {}) {
  const apiKey = import.meta.env.VITE_NOTION_API_KEY;
  if (!apiKey) throw new Error("VITE_NOTION_API_KEY not set");
  const res = await fetch(`https://api.notion.com/v1/${endpoint}`, {
    method,
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.message || `Notion API HTTP ${res.status}`);
  }
  return res.json();
}

export async function createNotionAuditEntry({ action, module, summary, refs = [] }) {
  const parentPageId = "32401f61-8de2-80c0-bb83-c67614b4ac93";
  return callNotion("blocks/" + parentPageId + "/children", {
    method: "PATCH",
    body: {
      children: [{
        object: "block",
        type: "callout",
        callout: {
          rich_text: [{
            type: "text",
            text: { content: `[${new Date().toISOString()}] ${action} — ${module}: ${summary}` }
          }],
          icon: { type: "emoji", emoji: "📋" }
        }
      }]
    }
  });
}

export async function processWithClaude(moduleKey, inputText) {
  const system = PROCESS_SYSTEM_PROMPTS[moduleKey];
  if (!system) throw new Error(`No processing prompt configured for ${moduleKey}`);
  return callClaude(inputText, { system, maxTokens: 8000 });
}
