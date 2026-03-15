// Vercel Serverless Function — /api/health
// Quick check that the deployment is live and API key is configured.

export default function handler(req, res) {
  res.status(200).json({
    status: "ok",
    hasApiKey: !!process.env.ANTHROPIC_API_KEY,
  });
}
