// ═══════════════════════════════════════════════════════════
// DOCUMENT FORMATTER MODULE — v2
// 1. Client-side: extract text from input (HTML → stripped text)
// 2. Claude: return structured JSON (~3-5KB, 10-30 seconds)
// 3. Client-side: render JSON into static Aerchain template (instant)
// ═══════════════════════════════════════════════════════════

import { useState, useRef, useCallback } from "react";
import { Upload, Download, Copy, ExternalLink, Loader2, FileText as FileTextIcon, Type, Sparkles } from "lucide-react";
import { T } from "../lib/theme.js";
import { buildThemedDocument } from "../lib/docTemplate.js";

// 8 output theme options
const THEMES = [
  { id: "purple-glass", color: "#7c3aed", label: "Purple Glass" },
  { id: "deep-ocean", color: "#0ea5e9", label: "Deep Ocean" },
  { id: "rose-quartz", color: "#ec4899", label: "Rose Quartz" },
  { id: "midnight-emerald", color: "#10b981", label: "Emerald" },
  { id: "arctic", color: "#3b82f6", label: "Arctic" },
  { id: "topaz", color: "#14b8a6", label: "Topaz" },
  { id: "citrine", color: "#eab308", label: "Citrine" },
  { id: "slate", color: "#6366f1", label: "Slate" },
];

// ── Client-side text extraction ─────────────────────────────

/**
 * Extract structured text from HTML, preserving headings, lists, tables.
 * Reduces a 45KB HTML file to ~5KB of clean structured text.
 */
function extractTextFromHTML(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Remove non-content elements
  doc.querySelectorAll("script, style, nav, footer, header, noscript, svg, [aria-hidden]").forEach(el => el.remove());

  const parts = [];

  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = node.textContent.trim();
      if (t) parts.push(t);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const tag = node.tagName.toLowerCase();

    // Headings
    if (/^h[1-6]$/.test(tag)) {
      parts.push(`\n${"#".repeat(parseInt(tag[1]))} ${node.textContent.trim()}\n`);
      return;
    }
    // Table rows
    if (tag === "tr") {
      const cells = Array.from(node.querySelectorAll("td, th")).map(c => c.textContent.trim());
      if (cells.length) parts.push(`| ${cells.join(" | ")} |`);
      return;
    }
    // List items
    if (tag === "li") {
      parts.push(`- ${node.textContent.trim()}`);
      return;
    }
    // Blockquotes
    if (tag === "blockquote") {
      parts.push(`> ${node.textContent.trim()}`);
      return;
    }
    // Paragraphs
    if (tag === "p" || tag === "div") {
      const text = node.textContent.trim();
      if (text && text.length > 2) {
        // Only push if this div/p has direct text (not just child elements)
        const hasDirectText = Array.from(node.childNodes).some(
          n => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 2
        );
        if (tag === "p" || hasDirectText) {
          parts.push(`\n${text}\n`);
          return;
        }
      }
    }
    // Recurse for other elements
    for (const child of node.childNodes) walk(child);
  }

  walk(doc.body);
  return parts.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Check if a string looks like HTML */
function isHTML(str) {
  return /<[a-z][\s\S]*>/i.test(str) && (str.includes("</") || str.includes("/>"));
}

// ── File helpers ────────────────────────────────────────────

async function toBase64(file) {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

let _pdfjsLib = null;
async function loadPdfJs() {
  if (_pdfjsLib) return _pdfjsLib;
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      _pdfjsLib = window.pdfjsLib;
      _pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      resolve(_pdfjsLib);
    };
    script.onerror = () => reject(new Error("Failed to load PDF.js"));
    document.head.appendChild(script);
  });
}

let _mammoth = null;
async function loadMammoth() {
  if (_mammoth) return _mammoth;
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js";
    script.onload = () => { _mammoth = window.mammoth; resolve(_mammoth); };
    script.onerror = () => reject(new Error("Failed to load mammoth.js"));
    document.head.appendChild(script);
  });
}

// ── Progress steps ──────────────────────────────────────────

const STEPS = [
  { key: "extract", label: "Extracting content" },
  { key: "analyze", label: "Claude analyzing structure" },
  { key: "render", label: "Rendering document" },
];

// ═════════════════════════════════════════════════════════════
// COMPONENT
// ═════════════════════════════════════════════════════════════

export default function DocFormatterView() {
  const [inputMode, setInputMode] = useState("paste");
  const [textContent, setTextContent] = useState("");
  const [fileInfo, setFileInfo] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [fileBase64, setFileBase64] = useState("");
  const [fileType, setFileType] = useState("");
  const [outputTheme, setOutputTheme] = useState("purple-glass");
  const [outputHTML, setOutputHTML] = useState("");
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState({ type: "idle", text: "Ready" });
  const [currentStep, setCurrentStep] = useState(-1); // -1 = not started
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFile = useCallback(async (file) => {
    setFileInfo({ name: file.name, size: file.size });
    setFileContent("");
    setFileBase64("");
    setFileType("");

    const ext = file.name.split(".").pop().toLowerCase();

    if (ext === "pdf") {
      setStatus({ type: "working", text: "Extracting text from PDF..." });
      try {
        const pdfjsLib = await loadPdfJs();
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(item => item.str).join(" ") + "\n\n";
        }
        const trimmed = text.trim();
        if (!trimmed) throw new Error("no-text");
        setFileContent(trimmed);
        setStatus({ type: "ready", text: `Extracted ${pdf.numPages} pages — ready to format` });
      } catch {
        const b64 = await toBase64(file);
        setFileBase64(b64);
        setFileType("application/pdf");
        setStatus({ type: "ready", text: "PDF loaded (will send to Claude for OCR) — ready" });
      }
    } else if (/^(png|jpe?g|gif|webp)$/.test(ext)) {
      const b64 = await toBase64(file);
      setFileBase64(b64);
      setFileType(file.type || "image/png");
      setStatus({ type: "ready", text: "Image loaded — ready to format" });
    } else if (ext === "docx") {
      setStatus({ type: "working", text: "Extracting text from DOCX..." });
      try {
        const mammoth = await loadMammoth();
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        const trimmed = result.value.trim();
        if (!trimmed) throw new Error("No text found");
        setFileContent(trimmed);
        setStatus({ type: "ready", text: "Text extracted — ready to format" });
      } catch (err) {
        setStatus({ type: "error", text: "DOCX extraction failed: " + err.message });
      }
    } else if (/^(html?|txt|md|csv|json|xml|rtf)$/.test(ext)) {
      const text = await file.text();
      setFileContent(text);
      setStatus({ type: "ready", text: "File loaded — ready to format" });
    } else {
      setStatus({ type: "error", text: "Unsupported format. Use PDF, DOCX, HTML, TXT, or images." });
    }
  }, []);

  // ── MAIN FORMAT FLOW ──────────────────────────────────────
  const formatDocument = useCallback(async () => {
    let rawContent = inputMode === "paste" ? textContent.trim() : fileContent.trim();
    const hasFile = !!fileBase64;

    if (!rawContent && !hasFile) {
      setStatus({ type: "error", text: "No content provided" });
      return;
    }

    setProcessing(true);
    setOutputHTML("");
    setCurrentStep(0);

    try {
      // ── STEP 1: Extract text (client-side) ──
      setStatus({ type: "working", text: "Step 1/3 — Extracting content..." });
      let contentToSend = rawContent;

      if (rawContent && isHTML(rawContent)) {
        contentToSend = extractTextFromHTML(rawContent);
        const reduction = ((1 - contentToSend.length / rawContent.length) * 100).toFixed(0);
        setStatus({ type: "working", text: `Step 1/3 — Extracted text (${reduction}% smaller)` });
      }

      // ── STEP 2: Send to Claude for structuring ──
      setCurrentStep(1);
      setStatus({ type: "working", text: "Step 2/3 — Claude analyzing structure..." });

      const body = {
        content: contentToSend || undefined,
        fileBase64: hasFile ? fileBase64 : undefined,
        fileType: hasFile ? fileType : undefined,
      };

      const response = await fetch("/api/doc-format", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "API request failed");
      }

      // Stream and collect JSON
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let jsonStr = "";
      let buffer = "";
      const startTime = Date.now();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) jsonStr += parsed.text;
              if (parsed.error) throw new Error(parsed.error);
            } catch (e) {
              if (e.message && e.message !== "Unexpected end of JSON input") throw e;
            }
          }
        }

        // Live progress
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
        const kbReceived = (jsonStr.length / 1024).toFixed(1);
        setStatus({ type: "working", text: `Step 2/3 — Structuring content... ${kbReceived} KB (${elapsed}s)` });
      }

      // ── STEP 3: Parse JSON + render template (client-side, instant) ──
      setCurrentStep(2);
      setStatus({ type: "working", text: "Step 3/3 — Rendering document..." });

      // Clean JSON (remove markdown fences if present)
      let cleanJSON = jsonStr.trim();
      if (cleanJSON.startsWith("```")) {
        cleanJSON = cleanJSON.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
      }

      const structured = JSON.parse(cleanJSON);
      const html = buildThemedDocument(structured, outputTheme);

      setOutputHTML(html);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      setCurrentStep(3); // all done
      setStatus({ type: "ready", text: `Done in ${elapsed}s — ${(html.length / 1024).toFixed(1)} KB document` });

    } catch (err) {
      setStatus({ type: "error", text: err.message });
    } finally {
      setProcessing(false);
    }
  }, [inputMode, textContent, fileContent, fileBase64, fileType, outputTheme]);

  // Re-render with new theme (instant, no API call)
  const switchTheme = useCallback((themeId) => {
    setOutputTheme(themeId);
    if (outputHTML) {
      // Re-render the existing outputHTML with new theme by swapping data-theme attribute
      setOutputHTML(prev => prev.replace(/data-theme="[^"]*"/, `data-theme="${themeId}"`));
    }
  }, [outputHTML]);

  // Actions
  const copyHTML = useCallback(() => navigator.clipboard.writeText(outputHTML), [outputHTML]);
  const downloadHTML = useCallback(() => {
    const blob = new Blob([outputHTML], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "aerchain-formatted-document.html";
    a.click();
    URL.revokeObjectURL(a.href);
  }, [outputHTML]);
  const openNewTab = useCallback(() => {
    const w = window.open();
    w.document.write(outputHTML);
    w.document.close();
  }, [outputHTML]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) {
      setInputMode("upload");
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const statusColor = status.type === "ready" ? T.success
    : status.type === "working" ? T.warn
    : status.type === "error" ? T.error
    : T.muted;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 0 }}>
      {/* ── INPUT SECTION ── */}
      <div className="glass-surface" style={{ borderRadius: 14, padding: "14px 16px", marginBottom: 12, boxShadow: "var(--s-glass)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Sparkles size={13} color={T.accent} />
            <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>Document Formatter</span>
            <div style={{ display: "flex", gap: 4, marginLeft: 8 }}>
              <ModeBtn active={inputMode === "paste"} onClick={() => setInputMode("paste")} icon={<Type size={11} />} label="Paste" />
              <ModeBtn active={inputMode === "upload"} onClick={() => setInputMode("upload")} icon={<Upload size={11} />} label="Upload" />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: ".08em", marginRight: 4 }}>Theme</span>
            {THEMES.map(t => (
              <div
                key={t.id}
                onClick={() => switchTheme(t.id)}
                title={t.label}
                style={{
                  width: 14, height: 14, borderRadius: "50%", background: t.color, cursor: "pointer",
                  border: outputTheme === t.id ? "2px solid rgba(255,255,255,.7)" : "2px solid transparent",
                  transition: "border-color .2s, transform .2s",
                }}
              />
            ))}
          </div>
        </div>

        {inputMode === "paste" && (
          <textarea
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            placeholder="Paste any text, HTML, markdown, data, or document content here..."
            style={{
              width: "100%", minHeight: 120, maxHeight: 220, background: T.bgCard, border: `1px solid ${T.border}`,
              borderRadius: 10, padding: 12, color: T.text, fontSize: 13, lineHeight: 1.6, resize: "vertical",
              outline: "none", fontFamily: "inherit",
            }}
          />
        )}

        {inputMode === "upload" && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? T.accent : T.border}`, borderRadius: 12,
              padding: "24px 16px", textAlign: "center", cursor: "pointer",
              background: dragOver ? T.accentBg : "transparent", transition: "all .2s",
            }}
          >
            <Upload size={22} color={dragOver ? T.accent : T.muted} style={{ marginBottom: 6 }} />
            <div style={{ color: T.text, fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Drop a file here or click to browse</div>
            <div style={{ color: T.muted, fontSize: 11 }}>PDF, DOCX, HTML, TXT, MD, CSV, JSON, PNG, JPG</div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".html,.htm,.txt,.md,.csv,.json,.pdf,.docx,.png,.jpg,.jpeg,.gif,.webp"
              onChange={(e) => { if (e.target.files.length) handleFile(e.target.files[0]); }}
              style={{ display: "none" }}
            />
          </div>
        )}

        {inputMode === "upload" && fileInfo && (
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: T.bgCard, borderRadius: 8, fontSize: 11, color: T.muted }}>
            <FileTextIcon size={12} /> {fileInfo.name} ({(fileInfo.size / 1024).toFixed(1)} KB)
          </div>
        )}

        <button
          onClick={formatDocument}
          disabled={processing}
          style={{
            marginTop: 12, width: "100%", padding: "10px 16px", border: "none", borderRadius: 10,
            background: processing ? T.bgCard : `linear-gradient(135deg, ${T.accent}, #6d28d9)`,
            color: "#fff", fontSize: 13, fontWeight: 600, cursor: processing ? "default" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "all .2s",
          }}
        >
          {processing ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={14} />}
          {processing ? "Formatting..." : "Format with Claude"}
        </button>

        {/* Progress steps */}
        {processing && (
          <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
            {STEPS.map((step, i) => (
              <div key={step.key} style={{
                flex: 1, padding: "6px 8px", borderRadius: 8, fontSize: 10, fontWeight: 600,
                background: i <= currentStep ? T.accentBg : T.bgCard,
                color: i === currentStep ? T.accent : i < currentStep ? T.success : T.muted,
                border: `1px solid ${i === currentStep ? T.borderAcc : T.border}`,
                display: "flex", alignItems: "center", gap: 4, justifyContent: "center",
                transition: "all .3s",
              }}>
                {i < currentStep ? "\u2713" : i === currentStep ? <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} /> : (i + 1)}
                {" "}{step.label}
              </div>
            ))}
          </div>
        )}

        {/* Status bar */}
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: T.muted }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor, flexShrink: 0, animation: status.type === "working" ? "pulse 1.5s infinite" : "none" }} />
          {status.text}
        </div>
      </div>

      {/* ── OUTPUT SECTION ── */}
      <div className="glass-surface" style={{ flex: 1, borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "var(--s-glass)", minHeight: 200 }}>
        {outputHTML && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: ".06em" }}>Preview</span>
            <div style={{ display: "flex", gap: 6 }}>
              <ActionBtn icon={<Copy size={12} />} label="Copy" onClick={copyHTML} />
              <ActionBtn icon={<Download size={12} />} label="Download" onClick={downloadHTML} />
              <ActionBtn icon={<ExternalLink size={12} />} label="New Tab" onClick={openNewTab} />
            </div>
          </div>
        )}

        {outputHTML ? (
          <iframe
            srcDoc={outputHTML}
            style={{ flex: 1, border: "none", width: "100%", background: "#0a0a0f", borderRadius: "0 0 14px 14px" }}
            title="Formatted document preview"
          />
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: T.muted, padding: 32, textAlign: "center" }}>
            <Sparkles size={36} style={{ opacity: 0.2 }} />
            <div style={{ fontSize: 15, fontWeight: 500, color: T.text, opacity: 0.6 }}>Formatted Document Preview</div>
            <div style={{ fontSize: 12, maxWidth: 280, lineHeight: 1.5 }}>
              Paste text or upload a file, then click "Format with Claude" to generate a beautifully themed HTML document.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ──

function ModeBtn({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 4,
      padding: "4px 10px", borderRadius: 16, fontSize: 11, fontWeight: 600,
      border: `1px solid ${active ? T.borderAcc : T.border}`,
      background: active ? T.accentBg : "transparent",
      color: active ? T.accent : T.muted, cursor: "pointer", transition: "all .2s",
    }}>
      {icon} {label}
    </button>
  );
}

function ActionBtn({ icon, label, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 4,
      padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 600,
      border: `1px solid ${T.border}`, background: "transparent",
      color: T.muted, cursor: "pointer", transition: "all .2s",
      textTransform: "uppercase", letterSpacing: ".04em",
    }}>
      {icon} {label}
    </button>
  );
}
