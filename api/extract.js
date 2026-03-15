// Vercel Serverless Function — /api/extract
// Handles Design Extractor requests with vision support (images + text).
// Receives pre-built content blocks from the frontend, adds API key server-side.

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// The extraction system prompt — edit here to fine-tune output.
// In future this could be loaded from a database or config.
const EXTRACTION_PROMPT = `You are a design system analyst. Your job is to analyze any input — screenshots, HTML/CSS code, design files, PDFs, or text descriptions — and extract a complete, structured design system specification.

## Your Task

Analyze the provided input and return a **single JSON object** containing every design token and component pattern you can identify. Be thorough and precise. Extract actual hex values, exact pixel sizes, and real font names.

## Output Format

Return ONLY valid JSON (no markdown fencing, no explanation). The JSON must follow this exact structure:

{
  "meta": {
    "name": "Design System Name",
    "description": "Brief description of the design aesthetic",
    "theme": "light" | "dark" | "both",
    "inspiration": "What this design system resembles or is inspired by"
  },
  "colors": {
    "primary": { "hex": "#8B5CF6", "name": "Purple", "usage": "Primary actions, active states" },
    "primaryHover": { "hex": "#7C3AED", "name": "Purple Hover", "usage": "Hover state" },
    "primaryLight": { "hex": "#F3F0FF", "name": "Purple Light", "usage": "Badge backgrounds" },
    "primaryBorder": { "hex": "#DDD6FE", "name": "Purple Border", "usage": "Badge borders, focus rings" },
    "secondary": { "hex": "#06B6D4", "name": "Teal", "usage": "Secondary accent" },
    "secondaryLight": { "hex": "#ECFEFF", "name": "Teal Light", "usage": "Secondary badges" },
    "success": { "hex": "#10B981", "name": "Emerald", "usage": "Success, active, positive" },
    "successLight": { "hex": "#ECFDF5", "name": "Emerald Light", "usage": "Success badge bg" },
    "warning": { "hex": "#F59E0B", "name": "Amber", "usage": "Warning, pending" },
    "warningLight": { "hex": "#FFFBEB", "name": "Amber Light", "usage": "Warning badge bg" },
    "error": { "hex": "#EF4444", "name": "Red", "usage": "Error, danger" },
    "errorLight": { "hex": "#FEF2F2", "name": "Red Light", "usage": "Error badge bg" },
    "brand": { "hex": "#DC5F40", "name": "Brand", "usage": "Brand identity color" },
    "contentBg": { "hex": "#FAFAFA", "name": "Content Background", "usage": "Page background" },
    "cardBg": { "hex": "#FFFFFF", "name": "Card Background", "usage": "Card/panel surfaces" },
    "cardBorder": { "hex": "#F0F0F0", "name": "Card Border", "usage": "Borders, dividers" },
    "sidebarBg": { "hex": "#F5F5F5", "name": "Sidebar Background", "usage": "Navigation sidebar" },
    "textPrimary": { "hex": "#1F2937", "name": "Text Primary", "usage": "Headings, body text" },
    "textSecondary": { "hex": "#6B7280", "name": "Text Secondary", "usage": "Labels, descriptions" },
    "textMuted": { "hex": "#9CA3AF", "name": "Text Muted", "usage": "Timestamps, placeholders" }
  },
  "gradients": [
    { "name": "Primary", "css": "linear-gradient(135deg, #8B5CF6, #06B6D4)", "usage": "Buttons, active states, headings" },
    { "name": "Header", "css": "linear-gradient(135deg, #DBEAFE, #E9D5FF, #CFFAFE)", "usage": "Top bar background" }
  ],
  "typography": {
    "fontFamily": "'DM Sans', 'Plus Jakarta Sans', system-ui, sans-serif",
    "monoFamily": "'JetBrains Mono', 'SF Mono', monospace",
    "googleFontsImport": "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap",
    "scale": [
      { "name": "Page Title", "size": "32px", "weight": "800", "tracking": "-0.5px", "notes": "Use gradient text" },
      { "name": "Section Title", "size": "24px", "weight": "800", "tracking": "normal", "notes": "Use gradient text" },
      { "name": "Card Title", "size": "18px", "weight": "700", "tracking": "normal", "notes": "" },
      { "name": "Subsection", "size": "15px", "weight": "700", "tracking": "normal", "notes": "" },
      { "name": "Body", "size": "14px", "weight": "400", "tracking": "normal", "notes": "Default text" },
      { "name": "Body Small", "size": "13px", "weight": "500", "tracking": "normal", "notes": "Secondary text" },
      { "name": "Label", "size": "11px", "weight": "600", "tracking": "0.8px", "notes": "Uppercase, muted" },
      { "name": "KPI Value", "size": "28px", "weight": "800", "tracking": "-0.5px", "notes": "Use mono or gradient" },
      { "name": "Table Data", "size": "13px", "weight": "500", "tracking": "normal", "notes": "Mono font" },
      { "name": "Timestamp", "size": "10px", "weight": "400", "tracking": "normal", "notes": "Mono font, muted" }
    ]
  },
  "spacing": { "xs": "4px", "sm": "8px", "md": "12px", "lg": "16px", "xl": "20px", "xxl": "24px", "xxxl": "32px" },
  "radius": {
    "xs": { "value": "6px", "usage": "Small chips, file badges" },
    "sm": { "value": "8px", "usage": "Secondary buttons, inner elements" },
    "md": { "value": "12px", "usage": "Inputs, sidebar items, module chips" },
    "lg": { "value": "16px", "usage": "Cards, panels, KPI cards" },
    "xl": { "value": "20px", "usage": "Page headers, large containers" },
    "pill": { "value": "100px", "usage": "Primary buttons, badges, filter pills" }
  },
  "shadows": {
    "card": { "css": "0 2px 12px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.03)", "usage": "Default card shadow" },
    "cardHover": { "css": "0 8px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)", "usage": "Card hover state" },
    "buttonGlow": { "css": "0 4px 14px rgba(139,92,246,0.3)", "usage": "Primary button glow" },
    "focusRing": { "css": "0 0 0 3px rgba(139,92,246,0.12)", "usage": "Input focus state" }
  },
  "components": {
    "button": { "borderRadius": "100px", "padding": "10px 24px", "fontSize": "13px", "fontWeight": "600", "variants": [
      { "name": "primary", "bg": "gradient-primary", "color": "#FFFFFF", "shadow": "buttonGlow" },
      { "name": "secondary", "bg": "#FFFFFF", "color": "#1F2937", "border": "1.5px solid #F0F0F0" },
      { "name": "success", "bg": "linear-gradient(135deg, #10B981, #059669)", "color": "#FFFFFF" },
      { "name": "danger", "bg": "linear-gradient(135deg, #EF4444, #DC2626)", "color": "#FFFFFF" },
      { "name": "ghost", "bg": "transparent", "color": "#8B5CF6", "border": "1.5px solid #DDD6FE" }
    ]},
    "badge": { "borderRadius": "100px", "padding": "3px 10px", "fontSize": "11px", "fontWeight": "600", "hasDot": true, "dotSize": "6px" },
    "card": { "borderRadius": "16px", "padding": "24px", "border": "1px solid #F0F0F0", "shadow": "card", "hoverShadow": "cardHover", "hoverTransform": "translateY(-2px)" },
    "input": { "borderRadius": "12px", "padding": "10px 14px", "border": "1.5px solid #F0F0F0", "focusBorder": "#8B5CF6", "focusShadow": "focusRing" },
    "table": { "headerFontSize": "10px", "headerWeight": "700", "headerTracking": "0.8px", "headerTransform": "uppercase", "cellPadding": "14px 16px", "rowHoverBg": "#FAF5FF" },
    "sidebar": { "width": "250px", "itemPadding": "10px 14px", "itemRadius": "12px", "activeBackground": "gradient-primary", "activeColor": "#FFFFFF", "activeShadow": "0 4px 14px rgba(139,92,246,0.3)" },
    "avatar": { "size": "32px", "sizeLg": "40px", "borderRadius": "50%", "fontWeight": "700", "gradients": ["linear-gradient(135deg, #8B5CF6, #3B82F6)","linear-gradient(135deg, #06B6D4, #10B981)","linear-gradient(135deg, #F59E0B, #EF4444)","linear-gradient(135deg, #EC4899, #8B5CF6)"] }
  },
  "designPrinciples": [
    "Light theme with gradient accents on clean white surfaces",
    "Pill-shaped buttons (border-radius: 100px) for all primary CTAs",
    "Generous whitespace and 16px card radius",
    "Gradient text for section titles and KPI values",
    "Colored badges with light bg + matching border + matching text",
    "Top accent bar (4px) on KPI cards"
  ]
}

## Extraction Rules

1. **Colors**: Extract EXACT hex values. If analyzing an image, use your best estimation. Always provide both the main color and its light/border companion.
2. **Typography**: Identify the font family. If you can't determine the exact font, suggest the closest match from Google Fonts.
3. **Spacing**: Infer the spacing scale from the layout. Look for consistent gaps between elements.
4. **Radius**: Note the border-radius on buttons, cards, inputs. Identify if pill-shaped elements are used.
5. **Shadows**: Describe any box-shadows you observe. If subtle, note that.
6. **Components**: For each UI component you see (buttons, cards, tables, badges, inputs), describe its styling properties.
7. **Gradients**: Note any gradient usage — direction, color stops, where they're applied.
8. **Design Principles**: Summarize 5-8 key principles that define this design system's character.

## If Input Is Minimal

If the user provides only a brief text description (e.g., "dark theme, neon green accent"), generate a COMPLETE design system that matches that description. Fill in reasonable defaults for anything not specified, making cohesive design choices.

## Critical

- Return ONLY the JSON object. No markdown, no explanation, no code fences.
- Every field in the schema above must be present.
- Use real, specific values — never use placeholder text like "TBD" or "varies".`;

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "20mb",
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { contentBlocks, customPrompt } = req.body;

    if (!contentBlocks || !Array.isArray(contentBlocks) || contentBlocks.length === 0) {
      return res.status(400).json({ error: "No content provided" });
    }

    const systemPrompt = customPrompt || EXTRACTION_PROMPT;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{ role: "user", content: contentBlocks }],
    });

    const text = (response.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    // Parse JSON from response
    let tokens;
    try {
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
      tokens = JSON.parse(jsonStr);
    } catch (parseErr) {
      return res.status(500).json({
        error: "Failed to parse Claude response as JSON",
        raw: text.slice(0, 2000),
        parseError: parseErr.message,
      });
    }

    res.status(200).json({
      success: true,
      tokens,
      usage: response.usage,
      model: response.model,
    });
  } catch (err) {
    console.error("Extract error:", err);
    res.status(err.status || 500).json({
      error: err.message || "Extraction failed",
    });
  }
}
