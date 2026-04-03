import { DollarSign, FileText, Palette, Settings, Sparkles, BookOpen, Calculator } from "lucide-react";

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
  { id: "deal-desk",    label: "DEAL DESK",    modules: ["pricing-calculator","pricing-calculator-v2","proposal-generator"], pinBottom: false },
  { id: "tools",        label: "TOOLS",         modules: ["design-extractor","doc-formatter"],        pinBottom: false },
  { id: "enablement",   label: "ENABLEMENT",    modules: ["training"],                                pinBottom: false },
  { id: "system",       label: "SYSTEM",        modules: ["settings"],                                pinBottom: true  },
];

export const MOD = {
  "pricing-calculator": { label: "Pricing Calculator", Icon: DollarSign },
  "pricing-calculator-v2": { label: "Pricing Calc v2", Icon: Calculator },
  "proposal-generator": { label: "Proposal Generator", Icon: FileText   },
  "design-extractor":   { label: "Design Extractor",   Icon: Palette    },
  "doc-formatter":      { label: "Doc Formatter",      Icon: Sparkles   },
  "training":           { label: "Training & L&D",     Icon: BookOpen   },
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
  "proposal-generator": "You are a proposal field extraction engine for Aerchain SalesOS. Analyze the provided input (RFP text, client notes, pricing data, or any unstructured proposal brief) and extract ALL relevant fields into structured JSON. Return ONLY this JSON shape: {\"clientName\":\"\",\"clientIndustry\":\"\",\"execSummary\":\"\",\"currentChallenges\":\"\",\"solutionOverview\":\"\",\"modules\":\"comma-separated list\",\"deploymentModel\":\"\",\"implementationTimeline\":\"\",\"y1License\":0,\"y2License\":0,\"y3License\":0,\"implFee\":0,\"paymentTerms\":\"\",\"clientSpend\":0,\"projectedSavingsPercent\":\"15-22\",\"roiMultiple\":\"\",\"cycleTimeReduction\":\"\",\"paybackPeriod\":\"\",\"whyAerchain\":\"\",\"nextSteps\":\"\"}. Fill in every field you can extract or infer. For missing numeric values use 0. For missing text use empty string. Your response must start with { and end with }.",
};

