// Vercel Serverless Function — /api/health
// Quick check that the deployment is live, API key is configured,
// and optionally validates the key with a minimal Anthropic API call.

import Anthropic from "@anthropic-ai/sdk";

export default async function handler(req, res) {
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

  // Quick mode (default): just check env var
  if (req.method === "GET" && !req.query.deep) {
    return res.status(200).json({ status: "ok", hasApiKey, deep: false });
  }

  // Deep mode (?deep=1): actually ping Anthropic with a tiny request
  if (!hasApiKey) {
    return res.status(200).json({ status: "no_key", hasApiKey: false, deep: true });
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4,
      messages: [{ role: "user", content: "Reply with just: ok" }],
    });
    const text = (response.content || []).filter(b => b.type === "text").map(b => b.text).join("");
    return res.status(200).json({
      status: "connected",
      hasApiKey: true,
      deep: true,
      model: response.model,
      reply: text.slice(0, 20),
    });
  } catch (err) {
    return res.status(200).json({
      status: "error",
      hasApiKey: true,
      deep: true,
      error: err.message || "API call failed",
      code: err.status || null,
    });
  }
}
