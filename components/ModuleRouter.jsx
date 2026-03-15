import { Component, memo } from "react";
import { Upload, Palette, Brain, AlertCircle } from "lucide-react";
import { T } from "../lib/theme.js";
import { UPLOAD_MODULES } from "../lib/constants.js";
import { Card, FileUploadZone, EmptyState, Spinner } from "./Common.jsx";
import PricingCalcView from "../views/PricingCalcView.jsx";
import ProposalsView from "../views/ProposalsView.jsx";
import SettingsView from "../views/SettingsView.jsx";
import GenericView from "../views/GenericView.jsx";
import DesignExtractorView from "../views/DesignExtractorView.jsx";
import FileWorkspace from "./FileWorkspace.jsx";

export class ModuleErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("ModuleContent crashed:", error, info.componentStack);
  }
  componentDidUpdate(prevProps) {
    if (prevProps.moduleKey !== this.props.moduleKey) {
      this.setState({ hasError: false, error: null });
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:16, padding:40, textAlign:"center" }}>
          <div style={{ width:56, height:56, borderRadius:16, background:"#FEF2F2", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <AlertCircle size={24} color="#EF4444" />
          </div>
          <div>
            <div style={{ color:"var(--text-primary,#1F2937)", fontWeight:600, marginBottom:6 }}>Something went wrong</div>
            <div style={{ color:"var(--text-secondary,#6B7280)", fontSize:13, maxWidth:400 }}>
              {this.state.error?.message || "An unexpected error occurred in this module."}
            </div>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              background:"var(--accent-bg,#F3F0FF)", border:"1px solid var(--accent-border,#DDD6FE)",
              borderRadius:8, padding:"8px 20px", color:"var(--accent,#8B5CF6)",
              fontSize:13, fontWeight:500, cursor:"pointer"
            }}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const ModuleContent = memo(function ModuleContent({ moduleKey, data, onSync, syncing, claudeMemory, onClearMemory, onFilesSelected, uploadedFiles, processing, onProcess, theme, setTheme, moduleFiles, onCreateFile, onDuplicateFile, onDeleteFile, referenceTokens, onSaveToLibrary, onLoadReference, extractorCache, setExtractorCache }) {
  if (moduleKey === "settings") return <SettingsView claudeMemory={claudeMemory} onClearMemory={onClearMemory} theme={theme} setTheme={setTheme} />;

  if (moduleKey === "design-extractor") {
    const files = moduleFiles || [];
    if (files.length > 0) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
          <FileWorkspace moduleKey={moduleKey} files={files} onCreateNew={onCreateFile} onDuplicate={onDuplicateFile} onDelete={onDeleteFile} onLoadReference={onLoadReference} />
          <div className="glass-surface" style={{ borderRadius: 14, padding: "12px 16px", boxShadow: "var(--s-glass)" }}>
            <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <Palette size={12} color={T.accent} /> Extract New Design System
            </div>
            <DesignExtractorView
              onSaveToLibrary={onSaveToLibrary}
              referenceTokens={referenceTokens}
              cachedState={extractorCache}
              onStateChange={setExtractorCache}
            />
          </div>
        </div>
      );
    }
    return <DesignExtractorView
      onSaveToLibrary={onSaveToLibrary}
      referenceTokens={referenceTokens}
      cachedState={extractorCache}
      onStateChange={setExtractorCache}
    />;
  }

  const files = moduleFiles || [];
  if (files.length > 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
        <FileWorkspace moduleKey={moduleKey} files={files} onCreateNew={onCreateFile} onDuplicate={onDuplicateFile} onDelete={onDeleteFile} />
        {UPLOAD_MODULES.has(moduleKey) && (
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Upload size={13} color={T.accent} />
              <span style={{ fontSize: 12, fontWeight: 600 }}>Upload & Process New</span>
            </div>
            <FileUploadZone onFilesSelected={onFilesSelected} />
            {uploadedFiles && uploadedFiles.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ color: T.muted, fontSize: 11, marginBottom: 6 }}>{uploadedFiles.length} file(s) ready:</div>
                {uploadedFiles.map((f, i) => (
                  <div key={i} style={{ color: T.text, fontSize: 11, padding: "3px 0" }}>📄 {f.name} ({(f.size / 1024).toFixed(1)} KB)</div>
                ))}
                <button onClick={onProcess} disabled={processing} style={{
                  marginTop: 10, background: processing ? T.bgCard : `linear-gradient(135deg,${T.accent},#6d28d9)`,
                  border: "none", borderRadius: 7, padding: "8px 18px", color: "#fff", fontSize: 12, fontWeight: 600,
                  cursor: processing ? "default" : "pointer", display: "flex", alignItems: "center", gap: 6
                }}>
                  {processing ? <Spinner size={12} /> : <Brain size={12} />}
                  {processing ? "Processing…" : "Process with Claude"}
                </button>
              </div>
            )}
          </Card>
        )}
      </div>
    );
  }

  const isEmpty = !data || Object.keys(data).length === 0 || (Object.keys(data).length === 1 && data.syncedAt);

  if (isEmpty && UPLOAD_MODULES.has(moduleKey)) {
    return <EmptyState moduleKey={moduleKey} onFilesSelected={onFilesSelected} />;
  }
  if (isEmpty) return <EmptyState moduleKey={moduleKey} onSync={onSync} loading={syncing} />;

  switch (moduleKey) {
    case "pricing-calculator": return <PricingCalcView data={data} onFilesSelected={onFilesSelected} uploadedFiles={uploadedFiles} processing={processing} onProcess={onProcess} />;
    case "proposal-generator": return <ProposalsView data={data} onFilesSelected={onFilesSelected} uploadedFiles={uploadedFiles} processing={processing} onProcess={onProcess} />;
    default:                   return <GenericView data={data} />;
  }
});
