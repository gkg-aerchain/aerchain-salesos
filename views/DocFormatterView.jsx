// ═══════════════════════════════════════════════════════════
// DOCUMENT FORMATTER MODULE
// Accepts any input (text, PDF, DOCX, images), sends to Claude
// via /api/doc-format, streams back formatted HTML document
// in the Aerchain Dark Theme with 8 color variants.
// ═══════════════════════════════════════════════════════════

import { useState, useRef, useCallback } from "react";
import { Upload, Download, Copy, ExternalLink, Loader2, FileText as FileTextIcon, Type, Sparkles } from "lucide-react";
import { T } from "../lib/theme.js";

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

// File → base64
async function toBase64(file) {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

// PDF.js lazy loader
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

// Mammoth.js lazy loader
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

export default function DocFormatterView() {
  const [inputMode, setInputMode] = useState("paste"); // "paste" | "upload"
  const [textContent, setTextContent] = useState("");
  const [fileInfo, setFileInfo] = useState(null); // { name, size }
  const [fileContent, setFileContent] = useState(""); // extracted text
  const [fileBase64, setFileBase64] = useState("");
  const [fileType, setFileType] = useState("");
  const [outputTheme, setOutputTheme] = useState("purple-glass");
  const [outputHTML, setOutputHTML] = useState("");
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState({ type: "idle", text: "Ready" });
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
        setStatus({ type: "ready", text: "PDF loaded (will send directly to Claude) — ready to format" });
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
        if (!trimmed) throw new Error("No text found in DOCX");
        setFileContent(trimmed);
        setStatus({ type: "ready", text: "Text extracted — ready to format" });
      } catch (err) {
        setStatus({ type: "error", text: "DOCX extraction failed: " + err.message });
      }
    } else if (/^(doc|pptx?|xlsx?)$/.test(ext)) {
      setStatus({ type: "error", text: "Binary format not supported. Save as PDF or paste text." });
    } else {
      const text = await file.text();
      setFileContent(text);
      setStatus({ type: "ready", text: "File loaded — ready to format" });
    }
  }, []);

  // Format document via streaming API
  const formatDocument = useCallback(async () => {
    const content = inputMode === "paste" ? textContent.trim() : fileContent.trim();
    if (!content && !fileBase64) {
      setStatus({ type: "error", text: "No content provided" });
      return;
    }

    setProcessing(true);
    setOutputHTML("");
    setStatus({ type: "working", text: "Formatting with Claude AI..." });

    try {
      const body = {
        content: content || undefined,
        defaultTheme: outputTheme,
        stream: true,
        fileBase64: fileBase64 || undefined,
        fileType: fileType || undefined,
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

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullHTML = "";
      let buffer = "";
      let lastPreviewUpdate = 0;
      const PREVIEW_INTERVAL = 1500; // update preview every 1.5s

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
              if (parsed.text) fullHTML += parsed.text;
              if (parsed.error) throw new Error(parsed.error);
            } catch (e) {
              if (e.message && e.message !== "Unexpected end of JSON input") throw e;
            }
          }
        }

        // Live progress: update status + periodic preview
        const kbSoFar = (fullHTML.length / 1024).toFixed(1);
        setStatus({ type: "working", text: `Streaming from Claude... ${kbSoFar} KB received` });

        const now = Date.now();
        if (now - lastPreviewUpdate > PREVIEW_INTERVAL && fullHTML.length > 100) {
          lastPreviewUpdate = now;
          setOutputHTML(fullHTML);
        }
      }

      setOutputHTML(fullHTML);
      setStatus({ type: "ready", text: `Formatted — ${(fullHTML.length / 1024).toFixed(1)} KB output` });
    } catch (err) {
      setStatus({ type: "error", text: err.message });
    } finally {
      setProcessing(false);
    }
  }, [inputMode, textContent, fileContent, fileBase64, fileType, outputTheme]);

  // Copy HTML
  const copyHTML = useCallback(() => {
    navigator.clipboard.writeText(outputHTML);
  }, [outputHTML]);

  // Download HTML
  const downloadHTML = useCallback(() => {
    const blob = new Blob([outputHTML], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "aerchain-formatted-document.html";
    a.click();
    URL.revokeObjectURL(a.href);
  }, [outputHTML]);

  // Open in new tab
  const openNewTab = useCallback(() => {
    const w = window.open();
    w.document.write(outputHTML);
    w.document.close();
  }, [outputHTML]);

  // Drop handlers
  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) {
      setInputMode("upload");
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  // Status dot color
  const statusColor = status.type === "ready" ? T.success
    : status.type === "working" ? T.warn
    : status.type === "error" ? T.error
    : T.muted;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 0 }}>
      {/* ── INPUT SECTION ── */}
      <div className="glass-surface" style={{ borderRadius: 14, padding: "14px 16px", marginBottom: 12, boxShadow: "var(--s-glass)" }}>
        {/* Mode toggle + theme selector */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Sparkles size={13} color={T.accent} />
            <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>Document Formatter</span>
            <div style={{ display: "flex", gap: 4, marginLeft: 8 }}>
              <ModeBtn active={inputMode === "paste"} onClick={() => setInputMode("paste")} icon={<Type size={11} />} label="Paste" />
              <ModeBtn active={inputMode === "upload"} onClick={() => setInputMode("upload")} icon={<Upload size={11} />} label="Upload" />
            </div>
          </div>
          {/* Output theme dots */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: ".08em", marginRight: 4 }}>Theme</span>
            {THEMES.map(t => (
              <div
                key={t.id}
                onClick={() => setOutputTheme(t.id)}
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

        {/* Paste mode */}
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

        {/* Upload mode */}
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
            <div style={{ color: T.text, fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
              Drop a file here or click to browse
            </div>
            <div style={{ color: T.muted, fontSize: 11 }}>
              PDF, DOCX, HTML, TXT, MD, CSV, JSON, PNG, JPG
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".html,.htm,.txt,.md,.csv,.json,.pdf,.docx,.png,.jpg,.jpeg,.gif,.webp"
              onChange={(e) => { if (e.target.files.length) handleFile(e.target.files[0]); }}
              style={{ display: "none" }}
            />
          </div>
        )}

        {/* File info badge */}
        {inputMode === "upload" && fileInfo && (
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: T.bgCard, borderRadius: 8, fontSize: 11, color: T.muted }}>
            <FileTextIcon size={12} /> {fileInfo.name} ({(fileInfo.size / 1024).toFixed(1)} KB)
          </div>
        )}

        {/* Format button */}
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

        {/* Status bar */}
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: T.muted }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor, flexShrink: 0, animation: status.type === "working" ? "pulse 1.5s infinite" : "none" }} />
          {status.text}
        </div>
      </div>

      {/* ── OUTPUT SECTION ── */}
      <div className="glass-surface" style={{ flex: 1, borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "var(--s-glass)", minHeight: 200 }}>
        {/* Action bar */}
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

        {/* Preview iframe or empty state */}
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

// ── Small sub-components ──

function ModeBtn({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 4,
        padding: "4px 10px", borderRadius: 16, fontSize: 11, fontWeight: 600,
        border: `1px solid ${active ? T.borderAcc : T.border}`,
        background: active ? T.accentBg : "transparent",
        color: active ? T.accent : T.muted,
        cursor: "pointer", transition: "all .2s",
      }}
    >
      {icon} {label}
    </button>
  );
}

function ActionBtn({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 4,
        padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 600,
        border: `1px solid ${T.border}`, background: "transparent",
        color: T.muted, cursor: "pointer", transition: "all .2s",
        textTransform: "uppercase", letterSpacing: ".04em",
      }}
    >
      {icon} {label}
    </button>
  );
}
