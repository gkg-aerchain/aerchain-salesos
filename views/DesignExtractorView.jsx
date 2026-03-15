// ═══════════════════════════════════════════════════════════
// DESIGN EXTRACTOR MODULE
// Accepts any input (images, files, text), calls Claude API
// to extract design tokens, generates 4 outputs:
//   HTML styleguide, Markdown spec, JSON tokens, React theme
// ═══════════════════════════════════════════════════════════

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Upload, Download, Copy, Eye, FileText, Code, Loader2, X, Palette, AlertCircle, CheckCircle, Zap, Save, Monitor } from "lucide-react";
import { generateHTML, generateMarkdown, generateJSON, generateReactTheme, buildOutputs } from "../lib/generators.js";
import { canExtractProgrammatically, extractFromHTML, extractFromCSS } from "../lib/programmaticExtractor.js";
import { buildPreviewHTML } from "../lib/previewSkeleton.js";
import { withRetry } from "../lib/retry.js";
import { T } from "../lib/theme.js";

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
// Imported from lib/generators.js (shared with demo-data)


// ── SERVER API CALL (SSE streaming) ──────────────────────
// Calls /api/extract which streams SSE events back for real-time progress.
// No secrets in the browser.

async function callExtractAPI(contentBlocks, customPrompt, onProgress, signal, model) {
  const res = await withRetry(() => fetch("/api/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentBlocks, customPrompt: customPrompt || undefined, model: model || undefined }),
    signal,
  }), { retries: 2, label: "extract" });

  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || `HTTP ${res.status}`);
  }

  // Parse SSE stream
  if (!res.body) throw new Error("No response stream — connection may have dropped");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result = null;

  try {
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
        if (event === "error") throw new Error(data?.error || "Extraction failed");
      }
    }
  } catch (streamErr) {
    // Re-throw application errors (from "error" SSE event), catch network failures
    if (result) return result; // got result before stream broke — use it
    throw streamErr;
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

// T imported from ./lib/theme.js (single source of truth)


// ── MAIN COMPONENT ───────────────────────────────────────

const TABS = [
  { key: "preview",  label: "Preview",  Icon: Monitor,   ext: ".html" },
  { key: "html",     label: "HTML",     Icon: Eye,       ext: ".html" },
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

export default function DesignExtractorView({ onSaveToLibrary, referenceTokens, cachedState, onStateChange }) {
  const [files, setFiles] = useState([]);
  const [textInput, setTextInput] = useState(cachedState?.textInput || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tokens, setTokens] = useState(cachedState?.tokens || null);
  const [outputs, setOutputs] = useState(cachedState?.outputs || null);
  const [activeTab, setActiveTab] = useState(0);
  const [usage, setUsage] = useState(cachedState?.usage || null);
  const [dragOver, setDragOver] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState(DEFAULT_EXTRACTION_PROMPT);
  const [progress, setProgress] = useState({ pct: 0, label: "" });
  const [canInstant, setCanInstant] = useState(false);
  const [saved, setSaved] = useState(cachedState?.saved || false);
  const [model, setModel] = useState("claude-sonnet-4-20250514");
  const [previewDark, setPreviewDark] = useState(false);
  const fileInputRef = useRef(null);
  const abortRef = useRef(null);
  const iframeRef = useRef(null);

  // Abort in-flight extraction on unmount
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  // Persist extraction results to parent so they survive unmount
  useEffect(() => {
    if (onStateChange && (tokens || textInput)) {
      onStateChange({ tokens, outputs, usage, textInput, saved });
    }
  }, [tokens, outputs, usage, textInput, saved]);

  // Auto-detect if files support programmatic extraction
  useEffect(() => {
    setCanInstant(files.length > 0 && canExtractProgrammatically(files));
  }, [files]);

  // Load reference tokens from library
  useEffect(() => {
    if (referenceTokens) {
      setTokens(referenceTokens);
      setOutputs(buildOutputs(referenceTokens));
      setUsage({ input_tokens: 0, output_tokens: 0 });
    }
  }, [referenceTokens]);

  // Build preview HTML from tokens — instant, no API call
  const previewHTML = useMemo(() => {
    if (!tokens) return null;
    return buildPreviewHTML(tokens);
  }, [tokens]);

  // Toggle dark/light theme inside preview iframe
  useEffect(() => {
    if (!iframeRef.current) return;
    try {
      const doc = iframeRef.current.contentDocument;
      if (doc?.documentElement) {
        doc.documentElement.setAttribute("data-theme", previewDark ? "dark" : "light");
      }
    } catch { /* cross-origin safety */ }
  }, [previewDark]);

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
    // Abort any previous in-flight extraction
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setTokens(null);
    setOutputs(null);
    setSaved(false);
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
      }, controller.signal, model);

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
      if (err.name === "AbortError") return; // user navigated away or started new extraction
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Instant (programmatic) extraction — no API call ──
  const handleInstantExtract = async () => {
    if (files.length === 0) {
      setError("Upload HTML/CSS files for instant extraction.");
      return;
    }
    setLoading(true);
    setError(null);
    setTokens(null);
    setOutputs(null);
    setSaved(false);
    setProgress({ pct: 10, label: "Reading files" });

    try {
      const allTokens = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const text = await readFileAsText(file);
        const ext = file.name.split(".").pop().toLowerCase();

        setProgress({ pct: 10 + Math.round((i / files.length) * 40), label: `Analyzing ${file.name}` });

        let result = null;
        if (ext === "html" || ext === "htm") {
          result = await extractFromHTML(text);
        } else if (ext === "css") {
          result = extractFromCSS(text);
        }
        if (result) allTokens.push(result);
      }

      if (allTokens.length === 0) {
        throw new Error("No extractable content found in uploaded files.");
      }

      // Merge tokens from all files — later files supplement earlier ones
      const extractedTokens = allTokens.reduce((merged, t) => {
        return {
          meta: { ...merged.meta, ...t.meta },
          colors: { ...merged.colors, ...t.colors },
          gradients: [...(merged.gradients || []), ...(t.gradients || [])],
          typography: { ...merged.typography, ...t.typography },
          spacing: { ...merged.spacing, ...t.spacing },
          radius: { ...merged.radius, ...t.radius },
          shadows: { ...merged.shadows, ...t.shadows },
          components: { ...merged.components, ...t.components },
          designPrinciples: [...new Set([...(merged.designPrinciples || []), ...(t.designPrinciples || [])])],
        };
      });

      setProgress({ pct: 70, label: "Extracting design tokens" });

      // Short delay so progress is visible
      await new Promise(r => setTimeout(r, 200));

      setProgress({ pct: 90, label: "Generating outputs" });

      setTokens(extractedTokens);
      setOutputs(buildOutputs(extractedTokens));
      setUsage({ input_tokens: 0, output_tokens: 0 });
      setProgress({ pct: 100, label: "Complete — no API cost" });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Save current extraction to library ──
  const handleSaveToLibrary = () => {
    if (!tokens || !onSaveToLibrary) return;
    const id = `ds-${Date.now()}`;
    const now = new Date().toISOString();
    onSaveToLibrary({
      id,
      name: tokens.meta?.name || "Untitled Design System",
      description: tokens.meta?.description || "",
      status: "final",
      createdAt: now,
      updatedAt: now,
      source: "Design Extractor",
      tags: ["extracted"],
      tokens,
      // outputs intentionally omitted — regenerate via buildOutputs(tokens)
    });
    setSaved(true);
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
  const isPreviewTab = currentTab.key === "preview";
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
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Model selector */}
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                style={{
                  background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 8,
                  padding: "8px 10px", fontSize: 12, fontWeight: 500, color: T.text,
                  cursor: "pointer", outline: "none",
                }}
              >
                <option value="claude-sonnet-4-20250514">Sonnet 4</option>
                <option value="claude-opus-4-20250514">Opus 4</option>
                <option value="claude-haiku-4-20250514">Haiku 4</option>
              </select>
              {canInstant && (
                <button
                  onClick={handleInstantExtract}
                  style={{
                    background: `linear-gradient(135deg, var(--green, #10B981), #059669)`,
                    color: "#fff",
                    border: "none",
                    borderRadius: 100,
                    padding: "10px 24px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 8,
                    boxShadow: "0 4px 14px rgba(16,185,129,0.3)",
                  }}
                >
                  <Zap size={14} /> Instant Extract
                </button>
              )}
              <button
                onClick={handleExtract}
                style={{
                  background: `linear-gradient(135deg, var(--primary), ${canInstant ? 'var(--accent, #A78BFA)' : 'var(--green, #10B981)'})`,
                  color: "#fff",
                  border: "none",
                  borderRadius: 100,
                  padding: "10px 24px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 8,
                  boxShadow: "0 4px 14px rgba(139,92,246,0.3)",
                }}
              >
                <Palette size={14} /> {canInstant ? "AI Extract" : "Extract Design System"}
              </button>
            </div>
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
              {onSaveToLibrary && (
                <button onClick={handleSaveToLibrary} disabled={saved} style={{
                  background: "none", border: `1.5px solid ${T.borderAcc}`,
                  color: T.accent, borderRadius: 100,
                  padding: "7px 18px", fontSize: 12, fontWeight: 600, cursor: saved ? "default" : "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                  opacity: saved ? 0.5 : 1,
                }}>
                  <Save size={13} /> {saved ? "Saved to Library" : "Save to Library"}
                </button>
              )}
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

          {/* Tab Actions — hidden on Preview tab */}
          {!isPreviewTab && (
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
              {currentTab.key === "html" && (
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
          )}

          {/* Preview Tab — live iframe with theme toggle */}
          {isPreviewTab && previewHTML && (
            <div>
              {/* Preview toolbar */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <button
                  onClick={() => setPreviewDark(!previewDark)}
                  style={{
                    background: previewDark ? "#1e1b2e" : "#fff",
                    color: previewDark ? "#e2e8f0" : "#1f2937",
                    border: `1.5px solid ${T.border}`, borderRadius: 100,
                    padding: "5px 14px", fontSize: 11, fontWeight: 600,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                    transition: "all 0.2s",
                  }}
                >
                  {previewDark ? "☾ Dark" : "☀ Light"}
                </button>
                <button
                  onClick={() => {
                    const w = window.open("", "_blank");
                    w.document.write(previewHTML);
                    w.document.close();
                  }}
                  style={{
                    background: "none", border: `1.5px solid ${T.border}`, borderRadius: 100,
                    padding: "5px 14px", fontSize: 11, fontWeight: 600, color: T.text,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                  }}
                >
                  <Eye size={12} /> Open in New Tab
                </button>
                <button
                  onClick={() => {
                    const name = tokens?.meta?.name?.replace(/\s+/g, "-").toLowerCase() || "design-system";
                    downloadFile(previewHTML, `${name}-preview.html`);
                  }}
                  style={{
                    background: "none", border: `1.5px solid ${T.border}`, borderRadius: 100,
                    padding: "5px 14px", fontSize: 11, fontWeight: 600, color: T.text,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                  }}
                >
                  <Download size={12} /> Download Preview
                </button>
                <span style={{ fontSize: 10, color: T.muted, marginLeft: "auto" }}>
                  Instant algorithmic render — no API cost
                </span>
              </div>
              {/* iframe */}
              <div style={{
                border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden",
                height: 640, background: previewDark ? "#0f0d1a" : "#f8f9fa",
              }}>
                <iframe
                  ref={iframeRef}
                  srcDoc={previewHTML}
                  title="Design System Preview"
                  style={{ width: "100%", height: "100%", border: "none" }}
                  sandbox="allow-scripts"
                />
              </div>
            </div>
          )}

          {/* Output Content — code view for non-preview tabs */}
          {!isPreviewTab && (
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
          )}
        </div>
      )}
    </div>
  );
}
