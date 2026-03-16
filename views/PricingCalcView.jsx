import { useState, useMemo } from "react";
import { Upload, DollarSign, TrendingUp, Activity, Users, Brain, CheckCircle, AlertTriangle, XCircle, FileText, Shield, Clock } from "lucide-react";
import { T } from "../lib/theme.js";
import { fmt$ } from "../lib/utils.js";
import { Card, FileUploadZone, Spinner } from "../components/Common.jsx";
import { StatCard, tableStyle, thStyle, tdStyle } from "../components/DataDisplay.jsx";

// ── File validation config ──────────────────────────────────────
const ALLOWED_TYPES = new Set(["text/csv", "application/pdf", "application/json", "text/plain",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel"]);
const ALLOWED_EXTS = new Set([".csv", ".pdf", ".json", ".txt", ".xlsx", ".xls", ".docx"]);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const WARN_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function getExt(name) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

function validateFile(f) {
  const ext = getExt(f.name);
  const issues = [];
  if (!ALLOWED_TYPES.has(f.type) && !ALLOWED_EXTS.has(ext)) {
    issues.push({ level: "error", msg: `Unsupported file type (${ext || f.type || "unknown"})` });
  }
  if (f.size > MAX_FILE_SIZE) {
    issues.push({ level: "error", msg: `File too large (${(f.size / 1024 / 1024).toFixed(1)} MB — max 10 MB)` });
  } else if (f.size > WARN_FILE_SIZE) {
    issues.push({ level: "warn", msg: `Large file (${(f.size / 1024 / 1024).toFixed(1)} MB) — processing may be slow` });
  }
  if (f.size === 0) {
    issues.push({ level: "error", msg: "File is empty" });
  }
  return issues;
}

function findDuplicates(files) {
  const seen = new Map();
  const dupes = [];
  files.forEach((f, i) => {
    const key = `${f.name}:${f.size}`;
    if (seen.has(key)) dupes.push(i);
    else seen.set(key, i);
  });
  return dupes;
}

// ── Status Panel ────────────────────────────────────────────────
const STEPS = [
  { key: "upload", label: "Files uploaded", icon: Upload },
  { key: "validate", label: "Validating files", icon: Shield },
  { key: "sending", label: "Sending to Claude", icon: Brain },
  { key: "processing", label: "Analyzing pricing data", icon: Clock },
  { key: "done", label: "Processing complete", icon: CheckCircle },
];

function StatusPanel({ status, error }) {
  if (!status || status === "idle") return null;

  const stepIdx = STEPS.findIndex(s => s.key === status);
  const isFailed = status === "error";

  return (
    <Card style={{ marginTop: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Activity size={13} color={T.accent} />
        <span style={{ fontSize: 12, fontWeight: 600 }}>Processing Status</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {STEPS.map((step, i) => {
          const isActive = !isFailed && i === stepIdx;
          const isComplete = !isFailed && i < stepIdx;
          const isPending = !isFailed && i > stepIdx;
          const isErrorStep = isFailed && i === stepIdx;
          const Ic = step.icon;

          const dotColor = isComplete ? T.success
            : isActive ? T.accent
            : isErrorStep ? T.error
            : T.muted;

          const textColor = isComplete ? T.success
            : isActive ? T.text
            : isErrorStep ? T.error
            : T.mutedSoft;

          return (
            <div key={step.key}>
              <div style={{
                display: "flex", alignItems: "center", gap: 10, padding: "7px 0",
                opacity: isPending ? 0.4 : 1,
                transition: "opacity 0.3s ease",
              }}>
                {/* Step icon */}
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isComplete ? "rgba(16,185,129,0.15)"
                    : isActive ? T.accentBg
                    : isErrorStep ? "rgba(239,68,68,0.15)"
                    : "transparent",
                  border: `1.5px solid ${dotColor}`,
                  transition: "all 0.3s ease",
                  flexShrink: 0,
                }}>
                  {isComplete ? <CheckCircle size={12} color={T.success} />
                    : isActive ? <Spinner size={12} />
                    : isErrorStep ? <XCircle size={12} color={T.error} />
                    : <Ic size={11} color={T.mutedSoft} />}
                </div>

                {/* Step label */}
                <span style={{ fontSize: 12, fontWeight: isActive || isErrorStep ? 600 : 400, color: textColor, transition: "color 0.3s" }}>
                  {step.label}
                </span>
              </div>

              {/* Connector line between steps */}
              {i < STEPS.length - 1 && (
                <div style={{
                  width: 1.5, height: 10, marginLeft: 12.5,
                  background: isComplete ? T.success : T.divider,
                  transition: "background 0.3s ease",
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Error message */}
      {isFailed && error && (
        <div style={{
          marginTop: 10, padding: "8px 12px", borderRadius: 8,
          background: "rgba(239,68,68,0.1)", border: `1px solid rgba(239,68,68,0.2)`,
          display: "flex", alignItems: "flex-start", gap: 8,
        }}>
          <AlertTriangle size={13} color={T.error} style={{ marginTop: 1, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: T.error, lineHeight: 1.5 }}>{error}</span>
        </div>
      )}

      {/* Success message */}
      {status === "done" && (
        <div style={{
          marginTop: 10, padding: "8px 12px", borderRadius: 8,
          background: "rgba(16,185,129,0.1)", border: `1px solid rgba(16,185,129,0.2)`,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <CheckCircle size={13} color={T.success} />
          <span style={{ fontSize: 11, color: T.success, fontWeight: 500 }}>Pricing data processed — results shown below</span>
        </div>
      )}
    </Card>
  );
}

// ── File validation summary ─────────────────────────────────────
function FileValidationBar({ files }) {
  if (!files || files.length === 0) return null;

  const dupes = findDuplicates(files);
  const allIssues = files.map((f, i) => {
    const issues = validateFile(f);
    if (dupes.includes(i)) issues.push({ level: "warn", msg: "Duplicate file" });
    return { file: f, issues };
  });

  const hasErrors = allIssues.some(a => a.issues.some(i => i.level === "error"));
  const hasWarnings = allIssues.some(a => a.issues.some(i => i.level === "warn"));
  const allClean = !hasErrors && !hasWarnings;

  return (
    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ color: T.muted, fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
        {files.length} file{files.length > 1 ? "s" : ""} ready
      </div>

      {allIssues.map(({ file, issues }, i) => {
        const fileErrors = issues.filter(x => x.level === "error");
        const fileWarns = issues.filter(x => x.level === "warn");
        const ok = fileErrors.length === 0 && fileWarns.length === 0;

        return (
          <div key={i} style={{
            padding: "6px 10px", borderRadius: 8,
            background: fileErrors.length > 0 ? "rgba(239,68,68,0.06)"
              : fileWarns.length > 0 ? "rgba(245,158,11,0.06)"
              : "rgba(16,185,129,0.06)",
            border: `1px solid ${fileErrors.length > 0 ? "rgba(239,68,68,0.15)"
              : fileWarns.length > 0 ? "rgba(245,158,11,0.15)"
              : "rgba(16,185,129,0.15)"}`,
            display: "flex", flexDirection: "column", gap: 3,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <FileText size={12} color={ok ? T.success : fileErrors.length > 0 ? T.error : T.warn} />
              <span style={{ fontSize: 11, color: T.text, fontWeight: 500 }}>{file.name}</span>
              <span style={{ fontSize: 10, color: T.muted }}>({(file.size / 1024).toFixed(1)} KB)</span>
              {ok && <CheckCircle size={10} color={T.success} style={{ marginLeft: "auto" }} />}
            </div>
            {issues.map((iss, j) => (
              <div key={j} style={{ display: "flex", alignItems: "center", gap: 5, marginLeft: 18 }}>
                {iss.level === "error"
                  ? <XCircle size={10} color={T.error} />
                  : <AlertTriangle size={10} color={T.warn} />}
                <span style={{ fontSize: 10, color: iss.level === "error" ? T.error : T.warn }}>{iss.msg}</span>
              </div>
            ))}
          </div>
        );
      })}

      {/* Summary line */}
      {allClean && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
          <Shield size={11} color={T.success} />
          <span style={{ fontSize: 10, color: T.success, fontWeight: 500 }}>All files validated — ready to process</span>
        </div>
      )}
      {hasErrors && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
          <XCircle size={11} color={T.error} />
          <span style={{ fontSize: 10, color: T.error, fontWeight: 500 }}>Fix errors above before processing</span>
        </div>
      )}
    </div>
  );
}

// ── Main view ───────────────────────────────────────────────────
export default function PricingCalcView({ data, onFilesSelected, uploadedFiles, processing, onProcess, processStatus }) {
  const model = data.standardModel || {};
  const deals = data.recentDeals || [];

  // Derive validation state
  const validationState = useMemo(() => {
    if (!uploadedFiles || uploadedFiles.length === 0) return { hasErrors: false, files: [] };
    const dupes = findDuplicates(uploadedFiles);
    let hasErrors = false;
    const files = uploadedFiles.map((f, i) => {
      const issues = validateFile(f);
      if (dupes.includes(i)) issues.push({ level: "warn", msg: "Duplicate file" });
      if (issues.some(x => x.level === "error")) hasErrors = true;
      return { file: f, issues };
    });
    return { hasErrors, files };
  }, [uploadedFiles]);

  const canProcess = uploadedFiles?.length > 0 && !validationState.hasErrors && !processing;

  // Status from parent (if wired up) or local fallback
  const status = processStatus?.step || (processing ? "processing" : "idle");
  const statusError = processStatus?.error || null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Upload & Process area */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Upload size={13} color={T.accent} />
          <span style={{ fontSize: 12, fontWeight: 600 }}>Upload Pricing Data</span>
        </div>
        <FileUploadZone onFilesSelected={onFilesSelected} />

        {/* Smart file validation */}
        <FileValidationBar files={uploadedFiles} />

        {/* Process button */}
        {uploadedFiles && uploadedFiles.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <button onClick={onProcess} disabled={!canProcess} style={{
              background: !canProcess ? T.bgCard : `linear-gradient(135deg,${T.accent},#6d28d9)`,
              border: "none", borderRadius: 7, padding: "8px 18px", color: !canProcess ? T.muted : "#fff",
              fontSize: 12, fontWeight: 600,
              cursor: !canProcess ? "default" : "pointer", display: "flex", alignItems: "center", gap: 6,
              opacity: validationState.hasErrors ? 0.5 : 1,
              transition: "opacity 0.2s",
            }}>
              {processing ? <Spinner size={12} /> : <Brain size={12} />}
              {processing ? "Processing…" : validationState.hasErrors ? "Fix Errors First" : "Process with Claude"}
            </button>
          </div>
        )}
      </Card>

      {/* Status Panel — shows step-by-step progress */}
      <StatusPanel status={status} error={statusError} />

      {/* Standard Model KPIs */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <StatCard label="Per $1B Spend" value={fmt$(model.per1BSpend)} sub="Annual platform fee" icon={DollarSign} />
        <StatCard label="YoY Escalation" value={model.yoyEscalation || "—"} sub="Contract renewal rate" icon={TrendingUp} color={T.warn} />
        <StatCard label="Break-Even" value={model.breakEven || "—"} sub="Spend under mgmt threshold" icon={Activity} color={T.success} />
      </div>

      {/* Recent Deals Table */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Users size={13} color={T.accent} />
          <span style={{ fontSize: 12, fontWeight: 600 }}>Recent Deals</span>
          <span style={{ color: T.muted, fontSize: 11 }}>({deals.length})</span>
        </div>
        {deals.length === 0 ? (
          <div style={{ color: T.muted, fontSize: 12, textAlign: "center", padding: 20 }}>No deals processed yet — upload pricing data above</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Client</th>
                  <th style={thStyle}>Y1 Amount</th>
                  <th style={thStyle}>Spend Under Mgmt</th>
                  <th style={thStyle}>Modules</th>
                </tr>
              </thead>
              <tbody>
                {deals.map((d, i) => (
                  <tr key={i} className="table-row" style={{ transition: "background 0.1s" }}>
                    <td style={{ ...tdStyle, fontWeight: 600, color: T.text }}>{d.client || "—"}</td>
                    <td style={{ ...tdStyle, color: T.success }}>{fmt$(d.y1Amount)}</td>
                    <td style={{ ...tdStyle, color: T.muted }}>{d.spendUnderMgmt || "—"}</td>
                    <td style={{ ...tdStyle, maxWidth: 200 }}>{d.modules || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Analysis output */}
      {data.analysis && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Brain size={13} color={T.accent} />
            <span style={{ fontSize: 12, fontWeight: 600 }}>Claude Analysis</span>
          </div>
          <div style={{ color: T.text, fontSize: 12, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{data.analysis}</div>
        </Card>
      )}
    </div>
  );
}
