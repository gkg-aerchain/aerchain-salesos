import { useState, useRef } from "react";
import { RefreshCw, Loader2, Upload } from "lucide-react";
import { T } from "../lib/theme.js";
import { UPLOAD_MODULES, MOD } from "../lib/constants.js";

export function StatusDot({ status }) {
  const color = status === "🟢 Fresh" ? T.success
    : status === "🟡 Stale" ? T.warn
    : status === "🔴 Error" ? T.error
    : T.muted;
  return <span style={{ display:"inline-block", width:6, height:6, borderRadius:"50%", background:color, flexShrink:0 }} />;
}

export function Spinner({ size = 14 }) {
  return <Loader2 size={size} style={{ animation:"spin 1s linear infinite", color:T.accent }} />;
}

export function SyncBtn({ onClick, loading, size = 13 }) {
  return (
    <button onClick={onClick} disabled={loading} style={{ background:"none", border:"none", cursor:loading?"default":"pointer", padding:2, color: T.muted, display:"flex", alignItems:"center" }}>
      {loading ? <Spinner size={size} /> : <RefreshCw size={size} />}
    </button>
  );
}

export function FileUploadZone({ onFilesSelected, acceptTypes = ".csv,.pdf,.docx,.xlsx,.json,.txt" }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) onFilesSelected(files);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      style={{
        border: `2px dashed ${dragOver ? T.accent : T.border}`,
        borderRadius: 12,
        padding: "28px 20px",
        textAlign: "center",
        cursor: "pointer",
        background: dragOver ? T.accentBg : "transparent",
        transition: "all 0.2s",
      }}
    >
      <Upload size={24} color={dragOver ? T.accent : T.muted} style={{ marginBottom: 8 }} />
      <div style={{ color: T.text, fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
        Drop files here or click to browse
      </div>
      <div style={{ color: T.muted, fontSize: 11 }}>
        Accepts: CSV, PDF, DOCX, XLSX, JSON, TXT
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={acceptTypes}
        onChange={(e) => { if (e.target.files.length > 0) onFilesSelected(Array.from(e.target.files)); }}
        style={{ display: "none" }}
      />
    </div>
  );
}

export function Card({ children, style = {} }) {
  return (
    <div className="glass-surface" style={{
      borderRadius: 14,
      padding: "14px 16px",
      boxShadow: "var(--s-glass)",
      ...style
    }}>
      {children}
    </div>
  );
}

export function EmptyState({ moduleKey, onSync, loading, onFilesSelected }) {
  const { label, Icon } = MOD[moduleKey] || {};
  const isUploadModule = UPLOAD_MODULES.has(moduleKey);
  const uploadLabel = moduleKey === "pricing-calculator"
    ? "Upload pricing data to get started"
    : moduleKey === "proposal-generator"
    ? "Upload proposal documents to get started"
    : "No data yet — use Demo to preview, or Sync when APIs are connected";

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:16, padding:40, textAlign:"center" }}>
      <div style={{ width:56, height:56, borderRadius:16, background:T.accentBg, display:"flex", alignItems:"center", justifyContent:"center" }}>
        {Icon && <Icon size={24} color={T.accent} />}
      </div>
      <div>
        <div style={{ color:T.text, fontWeight:600, marginBottom:6 }}>{label}</div>
        <div style={{ color:T.muted, fontSize:13 }}>{uploadLabel}</div>
      </div>
      {isUploadModule ? (
        <div style={{ width: "100%", maxWidth: 400 }}>
          <FileUploadZone onFilesSelected={onFilesSelected} />
        </div>
      ) : (
        <button onClick={onSync} disabled={loading} style={{
          background: T.accentBg, border:`1px solid ${T.borderAcc}`, borderRadius:8, padding:"8px 20px",
          color:T.accent, fontSize:13, fontWeight:500, cursor:loading?"default":"pointer",
          display:"flex", alignItems:"center", gap:6
        }}>
          {loading ? <Spinner size={12}/> : <RefreshCw size={12}/>}
          {loading ? "Syncing…" : "Sync Now"}
        </button>
      )}
    </div>
  );
}
