// Vercel Serverless Function — /api/doc-format
// Analyzes input content and returns STRUCTURED JSON for the client-side
// template to render. Claude only decides content structure — NOT styling.
// This makes responses 10-20x faster (3-5KB JSON vs 80-100KB HTML).

import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;

export const config = {
  api: { bodyParser: { sizeLimit: "20mb" } },
  maxDuration: 120,
};

const SYSTEM_PROMPT = `You are a content structuring engine. Your job is to analyze input content and return a structured JSON object that maps the content into document sections.

## YOUR TASK
Take the user's input (text, markdown, extracted HTML text, or document description) and organize ALL of it into a structured JSON format. Preserve EVERY piece of information — do not summarize or omit anything.

## OUTPUT FORMAT
Return ONLY valid JSON (no markdown fencing, no explanation). The JSON must follow this structure:

{
  "title": "Document Title",
  "subtitle": "Optional subtitle or tagline",
  "sections": [
    {
      "type": "text",
      "eyebrow": "SECTION LABEL",
      "heading": "Section **Heading** Here",
      "content": "Paragraph text. Multiple paragraphs separated by double newlines."
    },
    {
      "type": "kpis",
      "eyebrow": "KEY METRICS",
      "heading": "Performance **Overview**",
      "items": [
        { "value": "15%", "label": "Cost Reduction" },
        { "value": "$2.4M", "label": "Annual Savings" }
      ]
    },
    {
      "type": "cards",
      "eyebrow": "CAPABILITIES",
      "heading": "Core **Features**",
      "items": [
        { "title": "Feature Name", "description": "Feature description text" }
      ]
    },
    {
      "type": "table",
      "eyebrow": "COMPARISON",
      "heading": "Feature **Matrix**",
      "headers": ["Feature", "Basic", "Pro"],
      "rows": [["Analytics", "Yes", "Yes"], ["AI", "No", "Yes"]]
    },
    {
      "type": "list",
      "eyebrow": "KEY POINTS",
      "heading": "Important **Details**",
      "ordered": false,
      "items": ["First point", "Second point"]
    },
    {
      "type": "quote",
      "text": "Quote text here",
      "attribution": "— Author Name, Title"
    },
    {
      "type": "divider"
    },
    {
      "type": "image-note",
      "eyebrow": "VISUAL ELEMENT",
      "heading": "Infographic **Description**",
      "description": "Description of a visual element, chart, or infographic from the source that cannot be represented as text/data"
    }
  ]
}

## RULES
1. PRESERVE ALL CONTENT — every word, number, and data point from the input
2. Use **double asterisks** around 1-2 key words in each heading for gradient emphasis
3. Choose the most appropriate section type for each piece of content:
   - Numbers/metrics/KPIs → "kpis" (extract the value and label)
   - Feature lists with descriptions → "cards"
   - Tabular/comparison data → "table"
   - Bullet points → "list"
   - Testimonials/quotes → "quote"
   - Charts/images/diagrams you can see but can't represent as data → "image-note" with a description
   - Everything else → "text"
4. Create logical section groupings with descriptive eyebrow labels
5. Keep sections in the same order as the source content
6. For large documents, ensure ALL content is captured — do NOT truncate
7. Return ONLY the JSON object. No explanation, no markdown fences.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured on server" });
  }

  const anthropic = new Anthropic({ apiKey });

  try {
    const { content, fileBase64, fileType } = req.body;

    if (!content && !fileBase64) {
      return res.status(400).json({ error: "No content provided" });
    }

    // Build message content blocks
    const contentBlocks = [];

    // If a file was uploaded (PDF or image), add it as a document/image block
    if (fileBase64 && fileType) {
      if (fileType === "application/pdf") {
        contentBlocks.push({
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: fileBase64 },
        });
      } else if (fileType.startsWith("image/")) {
        contentBlocks.push({
          type: "image",
          source: { type: "base64", media_type: fileType, data: fileBase64 },
        });
      }
    }

    // Add text instruction
    const textInstruction = content
      ? `Analyze the following content and return structured JSON. Preserve ALL content:\n\n${content}`
      : `Analyze the uploaded document and return structured JSON. Extract and preserve ALL visible content, text, data, and describe any visual elements.`;

    contentBlocks.push({ type: "text", text: textInstruction });

    // Stream SSE
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    });

    try {
      const stream = anthropic.messages.stream({
        model: "claude-sonnet-4-6",
        max_tokens: 16000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: contentBlocks }],
      });

      stream.on("text", (text) => {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      });

      const finalMsg = await stream.finalMessage();
      res.write(`data: ${JSON.stringify({ usage: finalMsg.usage })}\n\n`);
    } catch (streamErr) {
      console.error("Doc-format stream error:", streamErr);
      const errMsg = streamErr.message || "Streaming failed";
      const hint = streamErr.status === 401 ? "Invalid API key" :
                   streamErr.status === 400 ? "Input may be too large" :
                   streamErr.status === 429 ? "Rate limited — try again shortly" : null;
      res.write(`data: ${JSON.stringify({ error: errMsg, hint })}\n\n`);
    }

    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (err) {
    console.error("Doc-format error:", err);
    if (res.headersSent) {
      try {
        res.write(`data: ${JSON.stringify({ error: err.message || "Formatting failed" })}\n\n`);
        res.write(`data: [DONE]\n\n`);
        res.end();
      } catch {}
    } else {
      res.status(err.status || 500).json({ error: err.message || "Formatting failed" });
    }
  }
}
