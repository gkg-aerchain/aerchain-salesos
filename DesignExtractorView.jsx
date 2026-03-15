// ═══════════════════════════════════════════════════════════
// DESIGN EXTRACTOR MODULE
// Accepts any input (images, files, text), calls Claude API
// to extract design tokens, generates 4 outputs:
//   HTML styleguide, Markdown spec, JSON tokens, React theme
// ═══════════════════════════════════════════════════════════

import { useState, useRef, useCallback } from "react";
import { Upload, Download, Copy, Eye, FileText, Code, Loader2, X, Palette, AlertCircle, CheckCircle } from "lucide-react";

// ── DEFAULT EXTRACTION PROMPT (editable in UI) ───────────
// This is only used as the default value for the prompt editor.
// The actual prompt used for extraction is sent to /api/extract
// which holds the canonical version server-side.

const DEFAULT_EXTRACTION_PROMPT = `You are a design system analyst. Your job is to analyze any input — screenshots, HTML/CSS code, design files, PDFs, or text descriptions — and extract a complete, structured design system specification.

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


// ── OUTPUT GENERATORS ─────────────────────────────────────
// Inlined from tools/design-extractor/src/lib/generators.js

function generateHTML(tokens) {
  const { meta, colors, gradients, typography, spacing, radius, shadows, components, designPrinciples } = tokens;
  const colorSwatches = Object.entries(colors).map(([key, c]) => {
    const isLight = ['contentBg','cardBg','cardBorder','sidebarBg','primaryLight','secondaryLight','successLight','warningLight','errorLight'].includes(key);
    return `<div class="swatch ${isLight ? 'dark-text' : 'light-text'}" style="background:${c.hex};${isLight ? 'border:1px solid #E5E7EB;' : ''}"><span class="swatch-name">${c.name}</span>${c.hex}</div>`;
  }).join('\n      ');
  const gradientStrips = (gradients || []).map(g =>
    `<div class="gradient-strip" style="background:${g.css};">${g.name} — ${g.usage}</div>`
  ).join('\n    ');
  const typeSpecimens = (typography.scale || []).map(t =>
    `<div class="type-specimen">
      <div style="font-size:${t.size};font-weight:${t.weight};${t.tracking !== 'normal' ? `letter-spacing:${t.tracking};` : ''}${t.notes?.includes('uppercase') ? 'text-transform:uppercase;' : ''}${t.notes?.includes('muted') ? `color:${colors.textMuted?.hex || '#9CA3AF'};` : ''}${t.notes?.includes('gradient') ? `background:${gradients?.[0]?.css || 'linear-gradient(135deg,#8B5CF6,#06B6D4)'};-webkit-background-clip:text;-webkit-text-fill-color:transparent;` : ''}${t.notes?.includes('mono') || t.notes?.includes('Mono') ? `font-family:${typography.monoFamily || 'monospace'};` : ''}">${meta.name} — ${t.name}</div>
      <div class="type-meta">${t.size} / ${t.weight}${t.tracking !== 'normal' ? ` / ${t.tracking} tracking` : ''} — ${t.name}${t.notes ? ` (${t.notes})` : ''}</div>
    </div>`
  ).join('\n    ');
  const radiusBoxes = Object.entries(radius).map(([key, r]) =>
    `<div style="width:60px;height:50px;background:${colors.primaryLight?.hex || '#F3F0FF'};border:2px solid ${colors.primaryBorder?.hex || '#DDD6FE'};border-radius:${r.value};display:flex;align-items:center;justify-content:center;font-size:10px;font-family:monospace;">${r.value}</div>`
  ).join('\n        ');
  const principles = (designPrinciples || []).map((p) =>
    `<li style="padding:8px 0;border-bottom:1px solid ${colors.cardBorder?.hex || '#F0F0F0'};font-size:13px;">${p}</li>`
  ).join('\n      ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${meta.name} — Design System Reference</title>
${typography.googleFontsImport ? `<link href="${typography.googleFontsImport}" rel="stylesheet">` : ''}
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: ${typography.fontFamily || 'system-ui, sans-serif'}; font-size: 14px; line-height: 1.55; background: ${colors.contentBg?.hex || '#FAFAFA'}; color: ${colors.textPrimary?.hex || '#1F2937'}; -webkit-font-smoothing: antialiased; }
.page { max-width: 1200px; margin: 0 auto; padding: 40px 32px 80px; }
.section { margin-bottom: 56px; }
.section-title { font-size: 24px; font-weight: 800; margin-bottom: 8px; ${gradients?.[0]?.css ? `background: ${gradients[0].css}; -webkit-background-clip: text; -webkit-text-fill-color: transparent;` : `color: ${colors.primary?.hex || '#8B5CF6'};`} }
.section-desc { font-size: 14px; color: ${colors.textSecondary?.hex || '#6B7280'}; margin-bottom: 24px; }
.sample-card { background: ${colors.cardBg?.hex || '#FFFFFF'}; border: 1px solid ${colors.cardBorder?.hex || '#F0F0F0'}; border-radius: ${radius.lg?.value || '16px'}; padding: 24px; box-shadow: ${shadows.card?.css || '0 2px 12px rgba(0,0,0,0.04)'}; margin-bottom: 20px; }
.swatch-row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; }
.swatch { width: 100px; height: 80px; border-radius: ${radius.md?.value || '12px'}; display: flex; flex-direction: column; justify-content: flex-end; padding: 8px; font-size: 10px; font-family: ${typography.monoFamily || 'monospace'}; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.swatch.light-text { color: white; }
.swatch.dark-text { color: ${colors.textPrimary?.hex || '#1F2937'}; }
.swatch-name { font-weight: 600; font-family: ${typography.fontFamily || 'system-ui'}; font-size: 11px; }
.gradient-strip { height: 56px; border-radius: ${radius.md?.value || '12px'}; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; color: white; margin-bottom: 10px; }
.type-specimen { padding: 16px 0; border-bottom: 1px solid ${colors.cardBorder?.hex || '#F0F0F0'}; }
.type-specimen:last-child { border-bottom: none; }
.type-meta { font-size: 11px; font-family: ${typography.monoFamily || 'monospace'}; color: ${colors.textMuted?.hex || '#9CA3AF'}; margin-top: 4px; }
.page-header { ${gradients?.[1]?.css ? `background: ${gradients[1].css};` : `background: ${colors.primaryLight?.hex || '#F3F0FF'};`} border-radius: ${radius.xl?.value || '20px'}; padding: 40px; margin-bottom: 48px; }
.flex-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
</style>
</head>
<body>
<div class="page">
<div class="page-header">
  <h1 style="font-size:32px;font-weight:800;margin-bottom:8px;">${meta.name}</h1>
  <p style="font-size:15px;color:${colors.textSecondary?.hex || '#6B7280'};max-width:600px;">${meta.description}</p>
  <div style="margin-top:12px;font-size:12px;color:${colors.textMuted?.hex || '#9CA3AF'};">Theme: ${meta.theme} | ${meta.inspiration || ''}</div>
</div>
<div class="section"><div class="section-title">Color Palette</div><div class="section-desc">All color tokens extracted from the design</div><div class="swatch-row">${colorSwatches}</div></div>
<div class="section"><div class="section-title">Gradients</div><div class="section-desc">Gradient definitions</div>${gradientStrips}</div>
<div class="section"><div class="section-title">Typography</div><div class="section-desc">Font: ${typography.fontFamily} | Mono: ${typography.monoFamily || 'monospace'}</div><div class="sample-card">${typeSpecimens}</div></div>
<div class="section"><div class="section-title">Border Radius</div><div class="section-desc">Radius scale</div><div class="flex-row">${radiusBoxes}</div></div>
<div class="section"><div class="section-title">Design Principles</div><div class="section-desc">Core rules that define this design system</div><div class="sample-card"><ol style="padding-left:20px;list-style:decimal;">${principles}</ol></div></div>
</div>
</body>
</html>`;
}

function generateMarkdown(tokens) {
  const { meta, colors, gradients, typography, spacing, radius, shadows, components, designPrinciples } = tokens;
  const colorTable = Object.entries(colors).map(([key, c]) => `| \`--${key}\` | \`${c.hex}\` | ${c.name} | ${c.usage} |`).join('\n');
  const gradientTable = (gradients || []).map(g => `| ${g.name} | \`${g.css}\` | ${g.usage} |`).join('\n');
  const typeTable = (typography.scale || []).map(t => `| ${t.name} | ${t.size} | ${t.weight} | ${t.tracking} | ${t.notes || ''} |`).join('\n');
  const radiusTable = Object.entries(radius).map(([key, r]) => `| \`--r-${key}\` | \`${r.value}\` | ${r.usage} |`).join('\n');
  const shadowTable = Object.entries(shadows).map(([key, s]) => `| ${key} | \`${s.css}\` | ${s.usage} |`).join('\n');
  const principles = (designPrinciples || []).map((p, i) => `${i + 1}. ${p}`).join('\n');

  return `# ${meta.name} — Design System Specification

> ${meta.description}
> Theme: ${meta.theme} | Inspiration: ${meta.inspiration || 'N/A'}

---

## Colors

| Token | Hex | Name | Usage |
|-------|-----|------|-------|
${colorTable}

## Gradients

| Name | CSS | Usage |
|------|-----|-------|
${gradientTable}

## Typography

- **Font Family:** \`${typography.fontFamily}\`
- **Mono Family:** \`${typography.monoFamily || 'monospace'}\`
${typography.googleFontsImport ? `- **Google Fonts:** \`${typography.googleFontsImport}\`` : ''}

| Element | Size | Weight | Tracking | Notes |
|---------|------|--------|----------|-------|
${typeTable}

## Spacing

| Token | Value |
|-------|-------|
${Object.entries(spacing).map(([k, v]) => `| \`--sp-${k}\` | \`${v}\` |`).join('\n')}

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
${radiusTable}

## Shadows

| Name | CSS | Usage |
|------|-----|-------|
${shadowTable}

## Components

### Button
- Border Radius: \`${components.button?.borderRadius}\`
- Padding: \`${components.button?.padding}\`
- Font: \`${components.button?.fontSize}\` / \`${components.button?.fontWeight}\`
${(components.button?.variants || []).map(v => `- **${v.name}**: bg \`${v.bg}\`, color \`${v.color}\`${v.border ? `, border \`${v.border}\`` : ''}`).join('\n')}

### Card
- Border Radius: \`${components.card?.borderRadius}\`
- Padding: \`${components.card?.padding}\`
- Border: \`${components.card?.border}\`
- Hover: shadow → \`${components.card?.hoverShadow}\`, transform: \`${components.card?.hoverTransform}\`

### Input
- Border Radius: \`${components.input?.borderRadius}\`
- Padding: \`${components.input?.padding}\`
- Focus: border \`${components.input?.focusBorder}\` + shadow \`${components.input?.focusShadow}\`

### Table
- Header: \`${components.table?.headerFontSize}\` / \`${components.table?.headerWeight}\` / \`${components.table?.headerTransform}\`
- Cell Padding: \`${components.table?.cellPadding}\`
- Row Hover: \`${components.table?.rowHoverBg}\`

### Sidebar
- Width: \`${components.sidebar?.width}\`
- Active: bg \`${components.sidebar?.activeBackground}\`, color \`${components.sidebar?.activeColor}\`

## Design Principles

${principles}

---

*Auto-generated by Aerchain Design Extractor*
`;
}

function generateJSON(tokens) {
  return JSON.stringify(tokens, null, 2);
}

function generateReactTheme(tokens) {
  const { colors, gradients, typography, spacing, radius, shadows, components } = tokens;
  return `// AUTO-GENERATED THEME — ${tokens.meta?.name || 'Design System'}

export const theme = {
  colors: {
${Object.entries(colors).map(([k, c]) => `    ${k}: '${c.hex}',`).join('\n')}
  },
  gradients: {
${(gradients || []).map(g => `    ${g.name.toLowerCase().replace(/\s+/g, '')}: '${g.css}',`).join('\n')}
  },
  typography: {
    fontFamily: "${typography.fontFamily}",
    monoFamily: "${typography.monoFamily || 'monospace'}",
  },
  spacing: {
${Object.entries(spacing).map(([k, v]) => `    ${k}: '${v}',`).join('\n')}
  },
  radius: {
${Object.entries(radius).map(([k, r]) => `    ${k}: '${r.value}',`).join('\n')}
  },
  shadows: {
${Object.entries(shadows).map(([k, s]) => `    ${k}: '${s.css}',`).join('\n')}
  },
};

export const styles = {
  card: {
    background: '${colors.cardBg?.hex || '#FFFFFF'}',
    border: '${components.card?.border || '1px solid #F0F0F0'}',
    borderRadius: '${components.card?.borderRadius || '16px'}',
    padding: '${components.card?.padding || '24px'}',
    boxShadow: '${shadows.card?.css || 'none'}',
  },
  button: {
    primary: {
      background: '${gradients?.[0]?.css || colors.primary?.hex || '#8B5CF6'}',
      color: '#FFFFFF',
      borderRadius: '${components.button?.borderRadius || '100px'}',
      padding: '${components.button?.padding || '10px 24px'}',
      fontSize: '${components.button?.fontSize || '13px'}',
      fontWeight: '${components.button?.fontWeight || '600'}',
      border: 'none',
      cursor: 'pointer',
    },
    secondary: {
      background: '${colors.cardBg?.hex || '#FFFFFF'}',
      color: '${colors.textPrimary?.hex || '#1F2937'}',
      borderRadius: '${components.button?.borderRadius || '100px'}',
      padding: '${components.button?.padding || '10px 24px'}',
      fontSize: '${components.button?.fontSize || '13px'}',
      fontWeight: '${components.button?.fontWeight || '600'}',
      border: '1.5px solid ${colors.cardBorder?.hex || '#F0F0F0'}',
      cursor: 'pointer',
    },
  },
  input: {
    padding: '${components.input?.padding || '10px 14px'}',
    borderRadius: '${components.input?.borderRadius || '12px'}',
    border: '${components.input?.border || '1.5px solid #F0F0F0'}',
    fontSize: '13px',
    fontFamily: '${typography.fontFamily}',
    outline: 'none',
  },
};
`;
}


// ── SERVER API CALL (SSE streaming) ──────────────────────
// Calls /api/extract which streams SSE events back for real-time progress.
// No secrets in the browser.

async function callExtractAPI(contentBlocks, customPrompt, onProgress) {
  const res = await fetch("/api/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentBlocks, customPrompt: customPrompt || undefined }),
  });

  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || `HTTP ${res.status}`);
  }

  // Parse SSE stream
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Process complete SSE messages (double newline delimited)
    const messages = buffer.split("\n\n");
    buffer = messages.pop(); // keep incomplete message in buffer

    for (const msg of messages) {
      if (!msg.trim()) continue;
      const eventMatch = msg.match(/^event: (\w+)/m);
      const dataMatch = msg.match(/^data: (.+)$/m);
      if (!eventMatch || !dataMatch) continue;

      const event = eventMatch[1];
      let data;
      try { data = JSON.parse(dataMatch[1]); } catch { continue; }

      if (event === "status" && onProgress) onProgress({ type: "status", ...data });
      if (event === "progress" && onProgress) onProgress({ type: "progress", ...data });
      if (event === "complete") result = data;
      if (event === "error") throw new Error(data.error || "Extraction failed");
    }
  }

  if (!result) throw new Error("Stream ended without result");
  return result;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}


// ── DESIGN TOKENS (uses parent app's T or fallback) ──────

const T = {
  bg:        "var(--canvas)",
  bgCard:    "var(--glass-1)",
  border:    "var(--glass-border)",
  borderAcc: "var(--accent-border)",
  text:      "var(--fg)",
  muted:     "var(--fg2)",
  mutedSoft: "var(--fg3)",
  accent:    "var(--primary)",
  accentBg:  "var(--accent-bg)",
  success:   "var(--green)",
  error:     "var(--red)",
  glass:     "var(--s-glass)",
  elevated:  "var(--s-elevated)",
  divider:   "var(--divider)",
};


// ── MAIN COMPONENT ───────────────────────────────────────

const TABS = [
  { key: "html",     label: "HTML",     Icon: Eye,      ext: ".html" },
  { key: "markdown", label: "Markdown", Icon: FileText,  ext: ".md" },
  { key: "json",     label: "JSON",     Icon: Code,      ext: ".json" },
  { key: "react",    label: "React",    Icon: Code,      ext: ".jsx" },
];

// ── PROGRESS STAGES ──────────────────────────────────────
// Maps stream progress to human-readable status messages.
// Driven by character count from the streaming response.
const PROGRESS_STAGES = [
  { at: 0,    pct: 5,   label: "Preparing input files" },
  { at: 0,    pct: 10,  label: "Sending to Claude API" },
  { at: 0,    pct: 15,  label: "Connecting to Claude API" },
  { at: 50,   pct: 22,  label: "Analyzing design elements" },
  { at: 300,  pct: 30,  label: "Extracting color palette" },
  { at: 800,  pct: 40,  label: "Scanning typography scale" },
  { at: 1500, pct: 50,  label: "Mapping gradient tokens" },
  { at: 2500, pct: 60,  label: "Parsing component styles" },
  { at: 3500, pct: 70,  label: "Reading spacing + radius" },
  { at: 4500, pct: 78,  label: "Extracting shadow values" },
  { at: 5500, pct: 85,  label: "Building token structure" },
  { at: 6500, pct: 92,  label: "Finalizing design system" },
];

function getProgressStage(chars, phase) {
  if (phase === "parsing") return { pct: 95, label: "Validating JSON output" };
  if (phase === "generating") return { pct: 98, label: "Generating outputs" };
  // Find the highest stage that matches the current char count
  let stage = PROGRESS_STAGES[0];
  for (const s of PROGRESS_STAGES) {
    if (chars >= s.at) stage = s;
  }
  return stage;
}

export default function DesignExtractorView() {
  const [files, setFiles] = useState([]);
  const [textInput, setTextInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tokens, setTokens] = useState(null);
  const [outputs, setOutputs] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [usage, setUsage] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState(DEFAULT_EXTRACTION_PROMPT);
  const [progress, setProgress] = useState({ pct: 0, label: "" });
  const fileInputRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
  }, []);

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const handleExtract = async () => {
    if (!textInput.trim() && files.length === 0) {
      setError("Upload files or enter a text description.");
      return;
    }
    setLoading(true);
    setError(null);
    setTokens(null);
    setOutputs(null);
    setProgress({ pct: 5, label: "Preparing input files" });

    try {
      // Build content blocks for Claude API
      const contentBlocks = [];

      for (const file of files) {
        if (file.type.startsWith("image/")) {
          const base64 = await fileToBase64(file);
          contentBlocks.push({
            type: "image",
            source: { type: "base64", media_type: file.type, data: base64 },
          });
          contentBlocks.push({ type: "text", text: `[Uploaded image: ${file.name}]` });
        } else {
          const text = await readFileAsText(file);
          const ext = file.name.split(".").pop();
          contentBlocks.push({
            type: "text",
            text: `--- File: ${file.name} (${ext}) ---\n${text}\n--- End of ${file.name} ---`,
          });
        }
      }

      if (textInput.trim()) {
        contentBlocks.push({
          type: "text",
          text: `--- User Description ---\n${textInput}\n--- End Description ---`,
        });
      }

      contentBlocks.push({
        type: "text",
        text: "Analyze all the inputs above and extract a complete design system. Return ONLY the JSON object as specified in your system prompt.",
      });

      setProgress({ pct: 10, label: "Sending to Claude API" });

      // Call server-side API with progress callback
      const result = await callExtractAPI(contentBlocks, customPrompt, (evt) => {
        if (evt.type === "status") {
          const stage = getProgressStage(0, evt.phase);
          setProgress(stage);
        } else if (evt.type === "progress") {
          const stage = getProgressStage(evt.chars, null);
          setProgress(stage);
        }
      });

      if (!result.success) {
        throw new Error(result.error || "Extraction failed");
      }

      setProgress({ pct: 98, label: "Generating outputs" });

      setUsage(result.usage);
      setTokens(result.tokens);
      setOutputs({
        html: generateHTML(result.tokens),
        markdown: generateMarkdown(result.tokens),
        json: generateJSON(result.tokens),
        react: generateReactTheme(result.tokens),
      });
      setProgress({ pct: 100, label: "Complete" });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = (content, filename) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadZip = async () => {
    if (!outputs) return;
    // Dynamically import JSZip — it's already in package.json
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    const name = tokens?.meta?.name?.replace(/\s+/g, "-").toLowerCase() || "design-system";
    zip.file(`${name}-styleguide.html`, outputs.html);
    zip.file(`${name}-spec.md`, outputs.markdown);
    zip.file(`${name}-tokens.json`, outputs.json);
    zip.file(`${name}-theme.jsx`, outputs.react);
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}-design-system.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentTab = TABS[activeTab];
  const currentOutput = outputs ? outputs[currentTab.key] : "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── INPUT SECTION ── */}
      <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24, boxShadow: T.glass }}>
        <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
          {/* Drop Zone */}
          <div
            style={{
              flex: 1,
              border: `2px dashed ${dragOver ? T.accent : T.border}`,
              borderRadius: 12,
              padding: "28px 16px",
              textAlign: "center",
              cursor: "pointer",
              background: dragOver ? T.accentBg : "transparent",
              transition: "all 0.2s",
            }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => setFiles(prev => [...prev, ...Array.from(e.target.files)])}
              style={{ display: "none" }}
              accept="image/*,.html,.css,.json,.md,.txt,.pdf"
            />
            <Upload size={24} style={{ color: T.accent, marginBottom: 8 }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Drop files here or click to browse</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>Images, HTML, CSS, JSON, Markdown, PDF</div>
          </div>

          {/* Text Input */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: T.muted, marginBottom: 6 }}>
              Text Description
            </label>
            <textarea
              style={{
                flex: 1,
                border: `1.5px solid ${T.border}`,
                borderRadius: 12,
                padding: "10px 14px",
                fontSize: 13,
                color: T.text,
                background: "transparent",
                resize: "none",
                outline: "none",
                fontFamily: "inherit",
              }}
              placeholder='Describe the design: e.g. "Dark theme with neon green accents, rounded cards..."'
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
            />
          </div>
        </div>

        {/* File Chips */}
        {files.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
            {files.map((f, i) => (
              <span key={i} style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: T.accentBg, border: `1px solid ${T.borderAcc}`,
                borderRadius: 100, padding: "3px 10px", fontSize: 11, fontWeight: 500, color: T.accent,
              }}>
                {f.name}
                <button onClick={() => removeFile(i)} style={{ background: "none", border: "none", color: T.accent, cursor: "pointer", padding: 0, lineHeight: 1 }}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Actions Row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {!loading ? (
            <button
              onClick={handleExtract}
              style={{
                background: `linear-gradient(135deg, var(--primary), var(--green, #10B981))`,
                color: "#fff",
                border: "none",
                borderRadius: 100,
                padding: "10px 28px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8,
                boxShadow: "0 4px 14px rgba(139,92,246,0.3)",
              }}
            >
              <Palette size={14} /> Extract Design System
            </button>
          ) : (
            /* ── PROGRESS INDICATOR ── */
            <div style={{ flex: 1, maxWidth: 380 }}>
              {/* Status label */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <Loader2 size={13} style={{ color: T.accent, animation: "spin 1s linear infinite", flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{progress.label}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: T.muted, marginLeft: "auto" }}>{progress.pct}%</span>
              </div>
              {/* Track */}
              <div style={{
                height: 6,
                borderRadius: 100,
                background: T.divider,
                overflow: "hidden",
              }}>
                <div style={{
                  height: "100%",
                  width: `${progress.pct}%`,
                  borderRadius: 100,
                  background: `linear-gradient(90deg, var(--primary), var(--green, #10B981))`,
                  transition: "width 0.4s ease",
                  boxShadow: "0 0 8px rgba(139,92,246,0.4)",
                }} />
              </div>
            </div>
          )}

          <button
            onClick={() => setShowPrompt(!showPrompt)}
            style={{
              background: "none", border: `1.5px solid ${T.border}`,
              borderRadius: 100, padding: "8px 16px", fontSize: 11, fontWeight: 600,
              color: T.muted, cursor: "pointer",
            }}
          >
            {showPrompt ? "Hide Prompt" : "Edit Prompt"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginTop: 14, padding: "10px 14px", background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12,
            fontSize: 12, color: T.error, display: "flex", alignItems: "flex-start", gap: 8,
          }}>
            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ whiteSpace: "pre-wrap" }}>{error}</span>
          </div>
        )}
      </div>

      {/* ── PROMPT EDITOR (collapsible) ── */}
      {showPrompt && (
        <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20, boxShadow: T.glass }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 10 }}>Extraction System Prompt</div>
          <div style={{ fontSize: 11, color: T.muted, marginBottom: 10 }}>
            Edit this prompt to change what Claude extracts and how it structures the output. Changes apply to the next extraction.
          </div>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            style={{
              width: "100%", minHeight: 300, border: `1.5px solid ${T.border}`,
              borderRadius: 12, padding: 14, fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
              color: T.text, background: "transparent", resize: "vertical", outline: "none",
              lineHeight: 1.6,
            }}
          />
        </div>
      )}

      {/* ── OUTPUT SECTION ── */}
      {outputs && (
        <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24, boxShadow: T.glass }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: T.text }}>
              {tokens?.meta?.name || "Design System"}
            </span>
            {usage && (
              <span style={{
                fontSize: 10, fontWeight: 600, background: T.accentBg,
                color: T.accent, padding: "2px 8px", borderRadius: 100,
                border: `1px solid ${T.borderAcc}`,
              }}>
                {usage.input_tokens + usage.output_tokens} tokens
              </span>
            )}
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button onClick={downloadZip} style={{
                background: `linear-gradient(135deg, var(--green, #10B981), #059669)`,
                color: "#fff", border: "none", borderRadius: 100,
                padding: "7px 18px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <Download size={13} /> Download ZIP
              </button>
            </div>
          </div>
          {tokens?.meta?.description && (
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>{tokens.meta.description}</div>
          )}

          {/* Tabs */}
          <div style={{ display: "flex", gap: 2, borderBottom: `1px solid ${T.border}`, marginBottom: 14 }}>
            {TABS.map((tab, i) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(i)}
                style={{
                  background: "none", border: "none",
                  borderBottom: `2px solid ${activeTab === i ? T.accent : "transparent"}`,
                  padding: "8px 14px", fontSize: 12, fontWeight: 600,
                  color: activeTab === i ? T.accent : T.muted,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                  transition: "all 0.15s",
                }}
              >
                <tab.Icon size={13} /> {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Actions */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button
              onClick={() => copyToClipboard(currentOutput)}
              style={{
                background: "none", border: `1.5px solid ${T.border}`, borderRadius: 100,
                padding: "5px 14px", fontSize: 11, fontWeight: 600, color: T.text,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
              }}
            >
              {copied ? <><CheckCircle size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
            </button>
            <button
              onClick={() => {
                const name = tokens?.meta?.name?.replace(/\s+/g, "-").toLowerCase() || "design-system";
                downloadFile(currentOutput, `${name}${currentTab.ext}`);
              }}
              style={{
                background: "none", border: `1.5px solid ${T.border}`, borderRadius: 100,
                padding: "5px 14px", fontSize: 11, fontWeight: 600, color: T.text,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
              }}
            >
              <Download size={12} /> Download
            </button>
            {activeTab === 0 && (
              <button
                onClick={() => {
                  const w = window.open("", "_blank");
                  w.document.write(currentOutput);
                  w.document.close();
                }}
                style={{
                  background: "none", border: `1.5px solid ${T.border}`, borderRadius: 100,
                  padding: "5px 14px", fontSize: 11, fontWeight: 600, color: T.text,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                }}
              >
                <Eye size={12} /> Preview
              </button>
            )}
          </div>

          {/* Output Content */}
          <div style={{
            background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12,
            maxHeight: 480, overflow: "auto",
          }}>
            <pre style={{
              margin: 0, padding: 16, fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.6,
              color: T.text, whiteSpace: "pre-wrap", wordBreak: "break-word",
            }}>
              {currentOutput}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
