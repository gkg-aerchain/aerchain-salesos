import { DollarSign, FileText, Palette, Settings } from "lucide-react";

// Modules that use upload→process→output flow instead of sync
export const UPLOAD_MODULES = new Set(["pricing-calculator", "proposal-generator", "design-extractor"]);

// Notion master audit log — "Aerchain SalesOS Notion Log"
export const NOTION_AUDIT_CONFIG = {
  masterPageUrl: "https://www.notion.so/Claude-Code-Log-DB-Dump-32401f618de280c0bb83c67614b4ac93",
  masterDbName:  "Aerchain SalesOS Notion Log",
  modules: {
    "pricing-calculator": { pageName: "Pricing Calculator Log",   pageUrl: null },
    "proposal-generator": { pageName: "Proposal Generator Log",   pageUrl: null },
    "settings":           { pageName: "Settings & Memory Log",    pageUrl: null },
  },
};

// Module groups — DEAL DESK in main area, SYSTEM pinned to sidebar bottom
export const GROUPS = [
  { id: "deal-desk", label: "DEAL DESK",  modules: ["pricing-calculator","proposal-generator"], pinBottom: false },
  { id: "tools",     label: "TOOLS",      modules: ["design-extractor"],                        pinBottom: false },
  { id: "system",    label: "SYSTEM",     modules: ["settings"],                                pinBottom: true  },
];

export const MOD = {
  "pricing-calculator": { label: "Pricing Calculator", Icon: DollarSign },
  "proposal-generator": { label: "Proposal Generator", Icon: FileText   },
  "design-extractor":   { label: "Design Extractor",   Icon: Palette    },
  "settings":           { label: "Settings",           Icon: Settings   },
};

export const getSyncPrompt = (key) => {
  const now = new Date().toISOString();
  if (UPLOAD_MODULES.has(key)) return null;
  return `Return ONLY raw JSON: {"message":"No sync configured for ${key}","syncedAt":"${now}"}`;
};

// System prompts for upload→process→output modules
export const PROCESS_SYSTEM_PROMPTS = {
  "pricing-calculator": "You are a pricing analysis engine for Aerchain SalesOS. Analyze the provided pricing data and return structured JSON output with the following shape: {\"standardModel\":{\"per1BSpend\":0,\"yoyEscalation\":\"\",\"breakEven\":\"\"},\"recentDeals\":[{\"client\":\"\",\"y1Amount\":0,\"spendUnderMgmt\":\"\",\"modules\":\"\"}],\"analysis\":\"\"}. Your response must start with { and end with }.",
  "proposal-generator": "You are a proposal generation engine for Aerchain SalesOS. Using the provided inputs, generate a structured proposal in JSON format: {\"proposalTitle\":\"\",\"client\":\"\",\"value\":0,\"sections\":[{\"heading\":\"\",\"content\":\"\"}],\"summary\":\"\"}. Your response must start with { and end with }.",
};
