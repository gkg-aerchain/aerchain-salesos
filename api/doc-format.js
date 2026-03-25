// Vercel Serverless Function — /api/doc-format
// Reformats any input content into Aerchain Dark Theme HTML using Claude.
// Supports text input and base64-encoded PDF/image files (Claude handles natively).
// Streams response back via SSE.

import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;

export const config = {
  api: { bodyParser: { sizeLimit: "20mb" } },
  maxDuration: 300,
};

const DESIGN_SYSTEM_PROMPT = `You are the Aerchain Document Formatter — an AI that takes ANY input content and reformats it into a fully self-contained, beautifully designed HTML document using the Aerchain Dark Theme design system.

## YOUR TASK
Take the user's input content (text, HTML, markdown, data, PDF, image, etc.), preserve EVERY word and piece of information, and output a single complete HTML document styled in the Aerchain dark theme with all 8 color theme variants and a theme switcher.

## CRITICAL RULES
1. PRESERVE ALL CONTENT WORD-FOR-WORD. Do not summarize, omit, or rephrase anything.
2. Output a COMPLETE, SELF-CONTAINED HTML file (<!DOCTYPE html> through </html>)
3. ALL CSS must be inline in a <style> tag — no external stylesheets except Google Fonts
4. Include the theme switcher bar with all 8 dark theme variants
5. Use semantic HTML structure with proper heading hierarchy
6. Apply appropriate component patterns based on content type

## DESIGN TOKENS

### CSS Custom Properties (Root / Default = purple-glass)
:root {
  --canvas-a: hsl(262 55% 18%);
  --canvas-b: hsl(270 45% 12%);
  --canvas-c: hsl(255 40% 10%);
  --canvas-d: hsl(245 35% 8%);
  --aerchain: #DC5F40;
  --gp: linear-gradient(135deg, hsl(262 80% 55%), hsl(275 85% 58%));
  --active-glow: hsl(262 80% 55% / .25);
  --col-purple: hsl(262 80% 55%);
  --col-blue: hsl(217 88% 58%);
  --col-green: hsl(152 68% 42%);
  --col-amber: hsl(38 92% 50%);
  --col-red: hsl(0 68% 48%);
  --col-orange: hsl(18 90% 55%);
  --glass-1: rgba(255,255,255,.03);
  --glass-2: rgba(255,255,255,.06);
  --glass-3: rgba(255,255,255,.10);
  --glass-border: rgba(255,255,255,.06);
  --glass-border-h: rgba(255,255,255,.14);
  --fg: rgba(255,255,255,.94);
  --fg2: rgba(255,255,255,.72);
  --fg3: rgba(255,255,255,.42);
  --nav-bg: linear-gradient(180deg, hsl(262 40% 14% / .96), hsl(255 35% 10% / .88));
  --dot: radial-gradient(rgba(255,255,255,.045) 1px, transparent 1px);
  --r: 16px;
  --rm: 12px;
}

### 8 Theme Variants (applied via [data-theme="NAME"] on body)

[data-theme="purple-glass"] (DEFAULT):
  --canvas-a: hsl(262 55% 18%); --canvas-b: hsl(270 45% 12%); --canvas-c: hsl(255 40% 10%); --canvas-d: hsl(245 35% 8%);
  --gp: linear-gradient(135deg, hsl(262 80% 55%), hsl(275 85% 58%)); --active-glow: hsl(262 80% 55% / .25);

[data-theme="deep-ocean"]:
  --canvas-a: hsl(200 55% 16%); --canvas-b: hsl(210 50% 11%); --canvas-c: hsl(215 45% 9%); --canvas-d: hsl(220 40% 7%);
  --gp: linear-gradient(135deg, hsl(195 85% 45%), hsl(175 80% 42%)); --active-glow: hsl(195 85% 45% / .25);

[data-theme="rose-quartz"]:
  --canvas-a: hsl(330 38% 15%); --canvas-b: hsl(335 32% 11%); --canvas-c: hsl(340 28% 9%); --canvas-d: hsl(345 22% 7%);
  --gp: linear-gradient(135deg, hsl(330 72% 58%), hsl(290 70% 55%)); --active-glow: hsl(330 72% 58% / .25);

[data-theme="midnight-emerald"]:
  --canvas-a: hsl(155 40% 14%); --canvas-b: hsl(160 35% 10%); --canvas-c: hsl(165 30% 8%); --canvas-d: hsl(170 25% 6%);
  --gp: linear-gradient(135deg, hsl(152 68% 42%), hsl(165 75% 38%)); --active-glow: hsl(152 68% 42% / .25);

[data-theme="arctic"]:
  --canvas-a: hsl(225 45% 16%); --canvas-b: hsl(230 40% 12%); --canvas-c: hsl(235 35% 9%); --canvas-d: hsl(240 30% 7%);
  --gp: linear-gradient(135deg, hsl(217 88% 58%), hsl(200 90% 55%)); --active-glow: hsl(217 88% 58% / .25);

[data-theme="topaz"]:
  --canvas-a: hsl(192 40% 14%); --canvas-b: hsl(196 36% 10%); --canvas-c: hsl(200 32% 8%); --canvas-d: hsl(205 28% 6%);
  --gp: linear-gradient(135deg, hsl(188 80% 48%), hsl(42 88% 52%)); --active-glow: hsl(188 80% 48% / .25);

[data-theme="citrine"]:
  --canvas-a: hsl(48 55% 12%); --canvas-b: hsl(45 50% 9%); --canvas-c: hsl(42 45% 7%); --canvas-d: hsl(38 40% 5%);
  --gp: linear-gradient(135deg, hsl(48 95% 52%), hsl(38 90% 44%)); --active-glow: hsl(48 95% 52% / .30);

[data-theme="slate"]:
  --canvas-a: hsl(215 22% 15%); --canvas-b: hsl(218 20% 11%); --canvas-c: hsl(220 18% 9%); --canvas-d: hsl(222 16% 7%);
  --gp: linear-gradient(135deg, hsl(213 72% 52%), hsl(232 68% 58%)); --active-glow: hsl(213 72% 52% / .25);

## TYPOGRAPHY
- Primary font: 'Montserrat', system-ui, sans-serif (weight 300-800)
- Monospace: 'JetBrains Mono', monospace (for labels, data, codes)
- Import both from Google Fonts
- Hero/Title: 48-80px, weight 300, letter-spacing -.03em
- Section headers: 36-48px, weight 300, letter-spacing -.025em
- Bold words in headings get gradient text (background-clip: text with --gp)
- Body: 15px, weight 400, line-height 1.6, color var(--fg2)
- Labels/eyebrows: 11-13px, JetBrains Mono, weight 700, uppercase, letter-spacing .14em

## SURFACE & GLASS SYSTEM
- Card surfaces: background var(--glass-1), border 1px solid var(--glass-border), border-radius var(--r)
- Hover: border-color var(--glass-border-h), box-shadow 0 14px 44px rgba(0,0,0,.22), translateY(-3px)
- Glass containers: backdrop-filter: blur(20px)

## COMPONENT PATTERNS
- Navigation: sticky top, glass bg, logo left, theme dots right
- Theme switcher: 8 colored dots, onclick switches data-theme on body
- Section headers: eyebrow label + large h2 with gradient bold words
- Cards: glass bg + border + dot texture overlay
- Tables: glass bg, monospace headers, subtle row borders
- Quote blocks: frosted glass + left accent bar
- KPI cards: large gradient-text number + monospace label
- Lists: custom gradient dot bullets
- Dividers: linear-gradient(90deg, var(--glass-border), transparent)

## LAYOUT
- max-width: 1280px, margin: 0 auto, padding: 80px 48px
- Body background: linear-gradient(145deg, var(--canvas-d), var(--canvas-c) 30%, var(--canvas-b) 60%, var(--canvas-a) 100%) fixed

## OUTPUT FORMAT
Return ONLY the complete HTML document. No markdown, no code fences, no explanation. Just the raw HTML starting with <!DOCTYPE html>.

The default theme should be: THEME_PLACEHOLDER
`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured on server" });
  }

  const anthropic = new Anthropic({ apiKey });

  try {
    const { content, defaultTheme = "purple-glass", fileBase64, fileType } = req.body;

    if (!content && !fileBase64) {
      return res.status(400).json({ error: "No content provided" });
    }

    const systemPrompt = DESIGN_SYSTEM_PROMPT.replace("THEME_PLACEHOLDER", defaultTheme);

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
      ? `Reformat the following content into the Aerchain Dark Theme HTML document. Preserve ALL content word-for-word:\n\n${content}`
      : `Reformat the uploaded document into the Aerchain Dark Theme HTML document. Extract and preserve ALL content word-for-word.`;

    contentBlocks.push({ type: "text", text: textInstruction });

    // Always stream for better UX
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    });

    try {
      const stream = anthropic.messages.stream({
        model: "claude-sonnet-4-6",
        max_tokens: 64000,
        system: systemPrompt,
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
