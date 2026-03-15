// Vercel Serverless Function — /api/process
// Handles text-based Claude API calls for Pricing Calculator, Proposal Generator, and generic sync.
// API key lives server-side only — never exposed to browser.

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPTS = {
  "pricing-calculator":
    'You are a pricing analysis engine for Aerchain SalesOS. Analyze the provided pricing data and return structured JSON output with the following shape: {"standardModel":{"per1BSpend":0,"yoyEscalation":"","breakEven":""},"recentDeals":[{"client":"","y1Amount":0,"spendUnderMgmt":"","modules":""}],"analysis":""}. Your response must start with { and end with }.',
  "proposal-generator":
    'You are a proposal field extraction engine for Aerchain SalesOS. Analyze the provided input (RFP text, client notes, pricing data, or any unstructured proposal brief) and extract ALL relevant fields into structured JSON. Return ONLY this JSON shape: {"clientName":"","clientIndustry":"","execSummary":"","currentChallenges":"","solutionOverview":"","modules":"comma-separated list","deploymentModel":"","implementationTimeline":"","y1License":0,"y2License":0,"y3License":0,"implFee":0,"paymentTerms":"","clientSpend":0,"projectedSavingsPercent":"15-22","roiMultiple":"","cycleTimeReduction":"","paybackPeriod":"","whyAerchain":"","nextSteps":""}. Fill in every field you can extract or infer. For missing numeric values use 0. For missing text use empty string. Your response must start with { and end with }.',
};

const DEFAULT_SYSTEM =
  "You are a processing engine for Aerchain SalesOS. Analyze the provided inputs and return structured JSON output. Your response must start with { and end with }.";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt, moduleKey, system, model = "claude-sonnet-4-6", maxTokens = 8000 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "No prompt provided" });
    }

    const systemPrompt = system || SYSTEM_PROMPTS[moduleKey] || DEFAULT_SYSTEM;

    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    });

    const text = (response.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    res.status(200).json({
      text,
      usage: response.usage,
      model: response.model,
    });
  } catch (err) {
    console.error("Process error:", err);
    res.status(err.status || 500).json({
      error: err.message || "Processing failed",
    });
  }
}
