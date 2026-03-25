// ═══════════════════════════════════════════════════════════
// DOCUMENT FORMATTER MODULE — v3 (preview-first layout)
// Input = collapsible slim bar at top
// Preview = full remaining height
// Theme dots = in preview action bar
// ═══════════════════════════════════════════════════════════

import { useState, useRef, useCallback } from "react";
import { Upload, Download, Copy, ExternalLink, Loader2, FileText as FileTextIcon, Type, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { T } from "../lib/theme.js";
import { buildThemedDocument } from "../lib/docTemplate.js";

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

function extractTextFromHTML(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  doc.querySelectorAll("script, style, nav, footer, header, noscript, svg, [aria-hidden]").forEach(el => el.remove());
  const parts = [];
  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) { const t = node.textContent.trim(); if (t) parts.push(t); return; }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const tag = node.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) { parts.push(`\n${"#".repeat(parseInt(tag[1]))} ${node.textContent.trim()}\n`); return; }
    if (tag === "tr") { const cells = Array.from(node.querySelectorAll("td, th")).map(c => c.textContent.trim()); if (cells.length) parts.push(`| ${cells.join(" | ")} |`); return; }
    if (tag === "li") { parts.push(`- ${node.textContent.trim()}`); return; }
    if (tag === "blockquote") { parts.push(`> ${node.textContent.trim()}`); return; }
    if (tag === "p" || tag === "div") {
      const text = node.textContent.trim();
      if (text && text.length > 2) {
        const hasDirectText = Array.from(node.childNodes).some(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 2);
        if (tag === "p" || hasDirectText) { parts.push(`\n${text}\n`); return; }
      }
    }
    for (const child of node.childNodes) walk(child);
  }
  walk(doc.body);
  return parts.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function isHTML(str) { return /<[a-z][\s\S]*>/i.test(str) && (str.includes("</") || str.includes("/>")); }

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
    script.onload = () => { _pdfjsLib = window.pdfjsLib; _pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"; resolve(_pdfjsLib); };
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

const STEPS = [
  { key: "extract", label: "Extract" },
  { key: "analyze", label: "Analyze" },
  { key: "render", label: "Render" },
];

// ═════════════════════════════════════════════════════════════

export default function DocFormatterView() {
  const [inputMode, setInputMode] = useState("upload");
  const [inputExpanded, setInputExpanded] = useState(true);
  const [textContent, setTextContent] = useState("");
  const [fileInfo, setFileInfo] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [fileBase64, setFileBase64] = useState("");
  const [fileType, setFileType] = useState("");
  const [outputTheme, setOutputTheme] = useState("purple-glass");
  const [outputHTML, setOutputHTML] = useState("");
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState({ type: "idle", text: "Ready" });
  const [currentStep, setCurrentStep] = useState(-1);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const hasInput = !!(fileInfo || textContent.trim());

  // Handle file selection
  const handleFile = useCallback(async (file) => {
    setFileInfo({ name: file.name, size: file.size });
    setFileContent(""); setFileBase64(""); setFileType("");
    const ext = file.name.split(".").pop().toLowerCase();

    if (ext === "pdf") {
      setStatus({ type: "working", text: "Extracting text from PDF..." });
      try {
        const pdfjsLib = await loadPdfJs();
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) { const page = await pdf.getPage(i); const content = await page.getTextContent(); text += content.items.map(item => item.str).join(" ") + "\n\n"; }
        const trimmed = text.trim();
        if (!trimmed) throw new Error("no-text");
        setFileContent(trimmed);
        setStatus({ type: "ready", text: `Extracted ${pdf.numPages} pages` });
      } catch {
        setFileBase64(await toBase64(file)); setFileType("application/pdf");
        setStatus({ type: "ready", text: "PDF ready (OCR via Claude)" });
      }
    } else if (/^(png|jpe?g|gif|webp)$/.test(ext)) {
      setFileBase64(await toBase64(file)); setFileType(file.type || "image/png");
      setStatus({ type: "ready", text: "Image ready" });
    } else if (ext === "docx") {
      setStatus({ type: "working", text: "Extracting..." });
      try {
        const mammoth = await loadMammoth();
        const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        const trimmed = result.value.trim();
        if (!trimmed) throw new Error("No text found");
        setFileContent(trimmed);
        setStatus({ type: "ready", text: "Text extracted" });
      } catch (err) { setStatus({ type: "error", text: "DOCX failed: " + err.message }); }
    } else if (/^(html?|txt|md|csv|json|xml|rtf)$/.test(ext)) {
      setFileContent(await file.text());
      setStatus({ type: "ready", text: "File loaded" });
    } else {
      setStatus({ type: "error", text: "Unsupported format" });
    }
  }, []);

  // Format
  const formatDocument = useCallback(async () => {
    let rawContent = inputMode === "paste" ? textContent.trim() : fileContent.trim();
    const hasFile = !!fileBase64;
    if (!rawContent && !hasFile) { setStatus({ type: "error", text: "No content" }); return; }

    setProcessing(true); setOutputHTML(""); setCurrentStep(0);
    setInputExpanded(false); // collapse input on format

    try {
      setStatus({ type: "working", text: "Extracting content..." });
      let contentToSend = rawContent;
      if (rawContent && isHTML(rawContent)) contentToSend = extractTextFromHTML(rawContent);

      setCurrentStep(1);
      setStatus({ type: "working", text: "Claude analyzing..." });

      const response = await fetch("/api/doc-format", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: contentToSend || undefined, fileBase64: hasFile ? fileBase64 : undefined, fileType: hasFile ? fileType : undefined }),
      });
      if (!response.ok) { const err = await response.json(); throw new Error(err.error || "API failed"); }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let jsonStr = "", buffer = "";
      const startTime = Date.now();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n"); buffer = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try { const parsed = JSON.parse(data); if (parsed.text) jsonStr += parsed.text; if (parsed.error) throw new Error(parsed.error); } catch (e) { if (e.message && e.message !== "Unexpected end of JSON input") throw e; }
          }
        }
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
        setStatus({ type: "working", text: `Structuring... ${(jsonStr.length / 1024).toFixed(1)} KB (${elapsed}s)` });
      }

      setCurrentStep(2);
      let cleanJSON = jsonStr.trim();
      if (cleanJSON.startsWith("```")) cleanJSON = cleanJSON.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
      const structured = JSON.parse(cleanJSON);
      const html = buildThemedDocument(structured, outputTheme);
      setOutputHTML(html);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      setCurrentStep(3);
      setStatus({ type: "ready", text: `Done in ${elapsed}s` });
    } catch (err) { setStatus({ type: "error", text: err.message }); }
    finally { setProcessing(false); }
  }, [inputMode, textContent, fileContent, fileBase64, fileType, outputTheme]);

  // Theme switch (instant, no API)
  const switchTheme = useCallback((themeId) => {
    setOutputTheme(themeId);
    if (outputHTML) setOutputHTML(prev => prev.replace(/data-theme="[^"]*"/, `data-theme="${themeId}"`));
  }, [outputHTML]);

  const copyHTML = useCallback(() => navigator.clipboard.writeText(outputHTML), [outputHTML]);
  const downloadHTML = useCallback(() => {
    const blob = new Blob([outputHTML], { type: "text/html" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "aerchain-formatted-document.html"; a.click(); URL.revokeObjectURL(a.href);
  }, [outputHTML]);
  const openNewTab = useCallback(() => { const w = window.open(); w.document.write(outputHTML); w.document.close(); }, [outputHTML]);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files.length) { setInputMode("upload"); handleFile(e.dataTransfer.files[0]); }
  }, [handleFile]);

  const statusColor = status.type === "ready" ? T.success : status.type === "working" ? T.warn : status.type === "error" ? T.error : T.muted;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 140px)", gap: 0 }}>

      {/* ── COLLAPSIBLE INPUT BAR ── */}
      <div className="glass-surface" style={{ borderRadius: 14, marginBottom: 10, boxShadow: "var(--s-glass)", overflow: "hidden" }}>

        {/* Header row — always visible */}
        <div
          onClick={() => setInputExpanded(prev => !prev)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 14px", cursor: "pointer", userSelect: "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={13} color={T.accent} />
            <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>Input</span>

            {/* File badge (visible when collapsed with a file loaded) */}
            {!inputExpanded && fileInfo && (
              <span style={{ fontSize: 11, color: T.muted, display: "flex", alignItems: "center", gap: 4, marginLeft: 4 }}>
                <FileTextIcon size={11} /> {fileInfo.name} ({(fileInfo.size / 1024).toFixed(1)} KB)
              </span>
            )}
            {!inputExpanded && !fileInfo && textContent.trim() && (
              <span style={{ fontSize: 11, color: T.muted, marginLeft: 4 }}>
                {textContent.trim().length > 60 ? textContent.trim().slice(0, 60) + "..." : textContent.trim()}
              </span>
            )}

            {/* Status dot */}
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor, flexShrink: 0, marginLeft: 4, animation: status.type === "working" ? "pulse 1.5s infinite" : "none" }} />
            <span style={{ fontSize: 10, color: T.muted }}>{status.text}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Format button (always accessible) */}
            {!processing && hasInput && (
              <button
                onClick={(e) => { e.stopPropagation(); formatDocument(); }}
                style={{
                  padding: "5px 14px", border: "none", borderRadius: 8,
                  background: `linear-gradient(135deg, ${T.accent}, #6d28d9)`,
                  color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 5,
                }}
              >
                <Sparkles size={11} /> Format
              </button>
            )}
            {processing && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: T.accent }}>
                <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> Processing...
              </div>
            )}
            {inputExpanded ? <ChevronUp size={14} color={T.muted} /> : <ChevronDown size={14} color={T.muted} />}
          </div>
        </div>

        {/* Expandable content */}
        {inputExpanded && (
          <div style={{ padding: "0 14px 12px", borderTop: `1px solid ${T.border}` }}>
            {/* Mode toggle */}
            <div style={{ display: "flex", gap: 4, padding: "10px 0 10px" }}>
              <ModeBtn active={inputMode === "paste"} onClick={() => setInputMode("paste")} icon={<Type size={11} />} label="Paste" />
              <ModeBtn active={inputMode === "upload"} onClick={() => setInputMode("upload")} icon={<Upload size={11} />} label="Upload" />
            </div>

            {inputMode === "paste" && (
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Paste text, HTML, markdown, or data..."
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: "100%", minHeight: 80, maxHeight: 160, background: T.bgCard, border: `1px solid ${T.border}`,
                  borderRadius: 8, padding: 10, color: T.text, fontSize: 12, lineHeight: 1.5, resize: "vertical",
                  outline: "none", fontFamily: "inherit",
                }}
              />
            )}

            {inputMode === "upload" && (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.stopPropagation(); onDrop(e); }}
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                style={{
                  border: `2px dashed ${dragOver ? T.accent : T.border}`, borderRadius: 10,
                  padding: "16px 12px", textAlign: "center", cursor: "pointer",
                  background: dragOver ? T.accentBg : "transparent", transition: "all .2s",
                }}
              >
                <Upload size={18} color={dragOver ? T.accent : T.muted} style={{ marginBottom: 4 }} />
                <div style={{ color: T.text, fontSize: 12, fontWeight: 500, marginBottom: 2 }}>Drop file or click to browse</div>
                <div style={{ color: T.muted, fontSize: 10 }}>PDF, DOCX, HTML, TXT, MD, CSV, JSON, PNG, JPG</div>
                <input ref={fileInputRef} type="file" accept=".html,.htm,.txt,.md,.csv,.json,.pdf,.docx,.png,.jpg,.jpeg,.gif,.webp"
                  onChange={(e) => { if (e.target.files.length) handleFile(e.target.files[0]); }} style={{ display: "none" }} />
              </div>
            )}

            {inputMode === "upload" && fileInfo && (
              <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 5, padding: "5px 8px", background: T.bgCard, borderRadius: 6, fontSize: 10, color: T.muted }}>
                <FileTextIcon size={11} /> {fileInfo.name} ({(fileInfo.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>
        )}

        {/* Progress steps (shown during processing, whether expanded or collapsed) */}
        {processing && (
          <div style={{ display: "flex", gap: 4, padding: "0 14px 10px" }}>
            {STEPS.map((step, i) => (
              <div key={step.key} style={{
                flex: 1, padding: "4px 6px", borderRadius: 6, fontSize: 9, fontWeight: 600,
                background: i <= currentStep ? T.accentBg : T.bgCard,
                color: i === currentStep ? T.accent : i < currentStep ? T.success : T.muted,
                border: `1px solid ${i === currentStep ? T.borderAcc : T.border}`,
                display: "flex", alignItems: "center", gap: 3, justifyContent: "center",
                transition: "all .3s",
              }}>
                {i < currentStep ? "\u2713" : i === currentStep ? <Loader2 size={9} style={{ animation: "spin 1s linear infinite" }} /> : (i + 1)}
                {" "}{step.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── PREVIEW (takes all remaining height) ── */}
      <div className="glass-surface" style={{ flex: 1, borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "var(--s-glass)", minHeight: 0 }}>
        {/* Action bar with theme dots */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "7px 14px", borderBottom: `1px solid ${T.border}`, flexShrink: 0,
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: ".06em" }}>Preview</span>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Theme dots */}
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{ fontSize: 9, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: ".06em", marginRight: 2 }}>Theme</span>
              {THEMES.map(t => (
                <div key={t.id} onClick={() => switchTheme(t.id)} title={t.label} style={{
                  width: 12, height: 12, borderRadius: "50%", background: t.color, cursor: "pointer",
                  border: outputTheme === t.id ? "2px solid rgba(255,255,255,.7)" : "2px solid transparent",
                  transition: "border-color .2s",
                }} />
              ))}
            </div>

            {/* Divider */}
            {outputHTML && <div style={{ width: 1, height: 16, background: T.border }} />}

            {/* Action buttons */}
            {outputHTML && (
              <div style={{ display: "flex", gap: 4 }}>
                <ActionBtn icon={<Copy size={11} />} label="Copy" onClick={copyHTML} />
                <ActionBtn icon={<Download size={11} />} label="Download" onClick={downloadHTML} />
                <ActionBtn icon={<ExternalLink size={11} />} label="New Tab" onClick={openNewTab} />
              </div>
            )}
          </div>
        </div>

        {/* Preview content */}
        {outputHTML ? (
          <iframe
            srcDoc={outputHTML}
            style={{ flex: 1, border: "none", width: "100%", background: "#0a0a0f" }}
            title="Formatted document preview"
          />
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, color: T.muted, padding: 32, textAlign: "center" }}>
            <Sparkles size={32} style={{ opacity: 0.15 }} />
            <div style={{ fontSize: 14, fontWeight: 500, color: T.text, opacity: 0.5 }}>Document Preview</div>
            <div style={{ fontSize: 11, maxWidth: 260, lineHeight: 1.5, opacity: 0.7 }}>
              Upload a file or paste content, then click Format to generate a themed Aerchain document.
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
    <button onClick={(e) => { e.stopPropagation(); onClick(); }} style={{
      display: "flex", alignItems: "center", gap: 4,
      padding: "4px 10px", borderRadius: 14, fontSize: 11, fontWeight: 600,
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
      display: "flex", alignItems: "center", gap: 3,
      padding: "3px 8px", borderRadius: 5, fontSize: 9, fontWeight: 600,
      border: `1px solid ${T.border}`, background: "transparent",
      color: T.muted, cursor: "pointer", transition: "all .2s",
      textTransform: "uppercase", letterSpacing: ".04em",
    }}>
      {icon} {label}
    </button>
  );
}
