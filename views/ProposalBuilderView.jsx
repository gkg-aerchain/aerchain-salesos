import { useState, useRef, useCallback, useMemo } from "react";
import {
  Upload, Brain, FileText, Download, Eye, Edit3, ChevronRight,
  Loader2, DollarSign, TrendingUp, X
} from "lucide-react";
import { PROPOSAL_FIELDS_DEFAULT, mergeProposalTemplate } from "../lib/proposal-template.js";
import { T } from "../lib/theme.js";
import { validateAllFiles } from "../lib/fileValidation.js";
import { StatusPanel, FileValidationBar } from "../components/StatusPanel.jsx";

function Spinner({ size = 14 }) {
  return <Loader2 size={size} style={{ animation: "spin 1s linear infinite", color: T.accent }} />;
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12,
      padding: "14px 16px", boxShadow: "var(--s-glass)", ...style
    }}>
      {children}
    </div>
  );
}

// ── Field definitions for the editable form ─────────────
const FIELD_GROUPS = [
  {
    label: "Client Details",
    fields: [
      { key: "clientName", label: "Client Name", type: "text" },
      { key: "clientIndustry", label: "Industry", type: "text" },
      { key: "preparedBy", label: "Prepared By", type: "text" },
      { key: "preparedDate", label: "Date", type: "date" },
    ],
  },
  {
    label: "Proposal Content",
    fields: [
      { key: "execSummary", label: "Executive Summary", type: "textarea" },
      { key: "currentChallenges", label: "Current Challenges", type: "textarea" },
      { key: "solutionOverview", label: "Solution Overview", type: "textarea" },
      { key: "modules", label: "Modules (comma-separated)", type: "text" },
      { key: "deploymentModel", label: "Deployment Model", type: "text" },
      { key: "implementationTimeline", label: "Implementation Timeline", type: "text" },
    ],
  },
  {
    label: "Pricing",
    fields: [
      { key: "y1License", label: "Year 1 License ($)", type: "number" },
      { key: "y2License", label: "Year 2 License ($)", type: "number" },
      { key: "y3License", label: "Year 3 License ($)", type: "number" },
      { key: "implFee", label: "Implementation Fee ($)", type: "number" },
      { key: "paymentTerms", label: "Payment Terms", type: "text" },
    ],
  },
  {
    label: "ROI & Impact",
    fields: [
      { key: "clientSpend", label: "Client Annual Spend ($)", type: "number" },
      { key: "projectedSavingsPercent", label: "Projected Savings (%)", type: "text" },
      { key: "roiMultiple", label: "ROI Multiple", type: "text" },
      { key: "cycleTimeReduction", label: "Cycle Time Reduction", type: "text" },
      { key: "paybackPeriod", label: "Payback Period", type: "text" },
    ],
  },
  {
    label: "Closing",
    fields: [
      { key: "whyAerchain", label: "Why Aerchain", type: "textarea" },
      { key: "nextSteps", label: "Next Steps", type: "textarea" },
    ],
  },
];

// ── Tab button ──────────────────────────────────────────
function TabBtn({ active, icon: Icon, label, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "8px 16px", borderRadius: 8, border: "none",
        background: active ? T.accentBg : "transparent",
        color: active ? T.accent : T.muted,
        fontSize: 12, fontWeight: active ? 600 : 500,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transition: "all 0.15s",
      }}
    >
      <Icon size={13} />
      {label}
    </button>
  );
}

// ── Input field renderer ────────────────────────────────
function FieldInput({ field, value, onChange }) {
  const common = {
    value: value ?? "",
    onChange: (e) => onChange(field.key, field.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value),
    style: {
      width: "100%", padding: "8px 10px", borderRadius: 7,
      border: `1px solid ${T.border}`, background: T.bgCard,
      color: T.text, fontSize: 12, fontFamily: "'Montserrat',sans-serif",
      outline: "none", resize: "vertical",
    },
  };

  if (field.type === "textarea") {
    return <textarea {...common} rows={3} />;
  }
  return <input type={field.type === "number" ? "number" : "text"} {...common} />;
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export default function ProposalBuilderView({
  data,
  onFilesSelected,
  uploadedFiles,
  processing,
  onProcess,
  processStatus,
  textInput = "",
  onTextInputChange,
}) {
  const [tab, setTab] = useState("input"); // input | edit | preview
  const [fields, setFields] = useState(() => ({ ...PROPOSAL_FIELDS_DEFAULT }));
  const rawInput = textInput;
  const setRawInput = onTextInputChange || (() => {});

  const validation = useMemo(
    () => validateAllFiles(uploadedFiles, { allowImages: false }),
    [uploadedFiles]
  );
  const canProcess = !processing && (rawInput.trim() || (uploadedFiles?.length > 0 && !validation.hasErrors));
  const status = processStatus?.step || (processing ? "processing" : "idle");
  const [previewHtml, setPreviewHtml] = useState("");
  const [hasGenerated, setHasGenerated] = useState(false);
  const iframeRef = useRef(null);

  // When Claude returns data, map it into our fields
  const applyClaudeData = useCallback((claudeData) => {
    if (!claudeData) return;
    const mapped = { ...PROPOSAL_FIELDS_DEFAULT };

    // Map Claude response fields to our template fields
    if (claudeData.clientName || claudeData.client) mapped.clientName = claudeData.clientName || claudeData.client || "";
    if (claudeData.clientIndustry) mapped.clientIndustry = claudeData.clientIndustry;
    if (claudeData.execSummary || claudeData.summary) mapped.execSummary = claudeData.execSummary || claudeData.summary || "";
    if (claudeData.currentChallenges) mapped.currentChallenges = claudeData.currentChallenges;
    if (claudeData.solutionOverview) mapped.solutionOverview = claudeData.solutionOverview;
    if (claudeData.modules) {
      mapped.modules = Array.isArray(claudeData.modules) ? claudeData.modules.join(", ") : claudeData.modules;
    }
    if (claudeData.deploymentModel) mapped.deploymentModel = claudeData.deploymentModel;
    if (claudeData.implementationTimeline) mapped.implementationTimeline = claudeData.implementationTimeline;
    if (claudeData.y1License) mapped.y1License = claudeData.y1License;
    if (claudeData.y2License) mapped.y2License = claudeData.y2License;
    if (claudeData.y3License) mapped.y3License = claudeData.y3License;
    if (claudeData.implFee) mapped.implFee = claudeData.implFee;
    if (claudeData.paymentTerms) mapped.paymentTerms = claudeData.paymentTerms;
    if (claudeData.clientSpend) mapped.clientSpend = claudeData.clientSpend;
    if (claudeData.projectedSavingsPercent) mapped.projectedSavingsPercent = claudeData.projectedSavingsPercent;
    if (claudeData.roiMultiple) mapped.roiMultiple = claudeData.roiMultiple;
    if (claudeData.cycleTimeReduction) mapped.cycleTimeReduction = claudeData.cycleTimeReduction;
    if (claudeData.paybackPeriod) mapped.paybackPeriod = claudeData.paybackPeriod;
    if (claudeData.whyAerchain) mapped.whyAerchain = claudeData.whyAerchain;
    if (claudeData.nextSteps) {
      mapped.nextSteps = Array.isArray(claudeData.nextSteps) ? claudeData.nextSteps.join("\n") : claudeData.nextSteps;
    }

    // Handle legacy sections format from existing data
    if (claudeData.sections && Array.isArray(claudeData.sections)) {
      claudeData.sections.forEach((s) => {
        const h = (s.heading || "").toLowerCase();
        if (h.includes("executive") || h.includes("summary")) mapped.execSummary = mapped.execSummary || s.content;
        else if (h.includes("challenge") || h.includes("current") || h.includes("pain")) mapped.currentChallenges = mapped.currentChallenges || s.content;
        else if (h.includes("solution") || h.includes("proposed")) mapped.solutionOverview = mapped.solutionOverview || s.content;
        else if (h.includes("commercial") || h.includes("pricing") || h.includes("terms")) {
          // Try to extract numbers from content
          const nums = s.content.match(/\$[\d,.]+/g);
          if (nums && nums.length >= 1 && !mapped.y1License) mapped.y1License = parseFloat(nums[0].replace(/[$,]/g, "")) || 0;
          if (nums && nums.length >= 2 && !mapped.y2License) mapped.y2License = parseFloat(nums[1].replace(/[$,]/g, "")) || 0;
          if (nums && nums.length >= 3 && !mapped.y3License) mapped.y3License = parseFloat(nums[2].replace(/[$,]/g, "")) || 0;
        }
        else if (h.includes("roi") || h.includes("return") || h.includes("projection")) {
          const spendMatch = s.content.match(/\$[\d,.]+[BMK]?/);
          if (spendMatch && !mapped.clientSpend) {
            let val = spendMatch[0].replace(/[$,]/g, "");
            if (val.endsWith("B")) val = parseFloat(val) * 1e9;
            else if (val.endsWith("M")) val = parseFloat(val) * 1e6;
            else if (val.endsWith("K")) val = parseFloat(val) * 1e3;
            else val = parseFloat(val);
            mapped.clientSpend = val || 0;
          }
        }
        else if (h.includes("why") || h.includes("aerchain")) mapped.whyAerchain = mapped.whyAerchain || s.content;
        else if (h.includes("next") || h.includes("step")) mapped.nextSteps = mapped.nextSteps || s.content;
      });
    }

    // Also populate from proposalTitle if present
    if (claudeData.proposalTitle) mapped.execSummary = mapped.execSummary || claudeData.proposalTitle;
    if (claudeData.value && !mapped.y1License) mapped.y1License = claudeData.value;

    setFields(mapped);
    setHasGenerated(true);
    setTab("edit");
  }, []);

  // Handle field change
  const handleFieldChange = useCallback((key, value) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Generate preview
  const handlePreview = useCallback(() => {
    const html = mergeProposalTemplate(fields);
    setPreviewHtml(html);
    setTab("preview");
  }, [fields]);

  // Download HTML
  const handleDownload = useCallback(() => {
    const html = mergeProposalTemplate(fields);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aerchain-proposal-${fields.clientName || "draft"}-${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [fields]);

  // Process handler wrapper — calls parent onProcess, then applies result
  const handleProcessClick = useCallback(() => {
    onProcess();
  }, [onProcess]);

  // Watch for data changes from parent (Claude response)
  const lastDataRef = useRef(null);
  if (data && data !== lastDataRef.current && data.proposalTitle) {
    lastDataRef.current = data;
    // Schedule apply on next tick to avoid render-during-render
    setTimeout(() => applyClaudeData(data), 0);
  }

  // KPI values from existing proposals data
  const proposals = data?.activeProposals || [];
  const total = data?.total || proposals.length;
  const totalValue = data?.totalValue || proposals.reduce((s, p) => s + (p.value || 0), 0);
  const fmtUSD = (n) => {
    if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
    return `$${n.toLocaleString()}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Tab bar */}
      <Card style={{ padding: "8px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <TabBtn active={tab === "input"} icon={Upload} label="Input" onClick={() => setTab("input")} />
          <ChevronRight size={12} color={T.mutedSoft} />
          <TabBtn active={tab === "edit"} icon={Edit3} label="Edit Fields" onClick={() => setTab("edit")} disabled={!hasGenerated && !data?.proposalTitle} />
          <ChevronRight size={12} color={T.mutedSoft} />
          <TabBtn active={tab === "preview"} icon={Eye} label="Preview" onClick={handlePreview} disabled={!hasGenerated && !data?.proposalTitle} />
          <div style={{ flex: 1 }} />
          <button
            onClick={handleDownload}
            disabled={!hasGenerated && !data?.proposalTitle}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 8,
              background: hasGenerated || data?.proposalTitle ? `linear-gradient(135deg,${T.accent},#6d28d9)` : T.bgCard,
              border: "none", color: "#fff", fontSize: 12, fontWeight: 600,
              cursor: hasGenerated || data?.proposalTitle ? "pointer" : "default",
              opacity: hasGenerated || data?.proposalTitle ? 1 : 0.4,
            }}
          >
            <Download size={12} />
            Download HTML
          </button>
        </div>
      </Card>

      {/* ── INPUT TAB ──────────────────────────────────────── */}
      {tab === "input" && (
        <>
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Upload size={13} color={T.accent} />
              <span style={{ fontSize: 12, fontWeight: 600 }}>Upload Documents or Paste Text</span>
            </div>

            {/* Text input */}
            <textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder="Paste proposal brief, client requirements, RFP text, pricing notes, or any unstructured input here. Claude will extract all relevant fields..."
              rows={6}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8,
                border: `1px solid ${T.border}`, background: T.bgCard,
                color: T.text, fontSize: 12, fontFamily: "'Montserrat',sans-serif",
                resize: "vertical", outline: "none", marginBottom: 12,
              }}
            />

            {/* File upload */}
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 8 }}>Or upload files:</div>
            <div
              onClick={() => document.getElementById("proposal-file-input")?.click()}
              style={{
                border: `2px dashed ${T.border}`, borderRadius: 10, padding: "18px 16px",
                textAlign: "center", cursor: "pointer", transition: "all 0.2s",
              }}
            >
              <Upload size={20} color={T.muted} style={{ marginBottom: 4 }} />
              <div style={{ color: T.muted, fontSize: 11 }}>Drop files or click — CSV, PDF, DOCX, TXT</div>
              <input
                id="proposal-file-input"
                type="file"
                multiple
                accept=".csv,.pdf,.docx,.xlsx,.json,.txt"
                onChange={(e) => { if (e.target.files.length > 0) onFilesSelected(Array.from(e.target.files)); }}
                style={{ display: "none" }}
              />
            </div>

            <FileValidationBar validationResults={validation} />

            {/* Generate button */}
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button
                onClick={handleProcessClick}
                disabled={!canProcess}
                style={{
                  background: !canProcess ? T.bgCard : `linear-gradient(135deg,${T.accent},#6d28d9)`,
                  border: "none", borderRadius: 7, padding: "10px 22px", color: !canProcess ? T.muted : "#fff",
                  fontSize: 12, fontWeight: 600, cursor: !canProcess ? "default" : "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                  opacity: validation.hasErrors ? 0.5 : (!rawInput.trim() && (!uploadedFiles || uploadedFiles.length === 0)) ? 0.4 : 1,
                  transition: "opacity 0.2s",
                }}
              >
                {processing ? <Spinner size={12} /> : <Brain size={12} />}
                {processing ? "Extracting Fields…" : validation.hasErrors ? "Fix Errors First" : "Extract with Claude"}
              </button>

              <button
                onClick={() => {
                  setFields({ ...PROPOSAL_FIELDS_DEFAULT });
                  setHasGenerated(true);
                  setTab("edit");
                }}
                style={{
                  background: "transparent", border: `1px solid ${T.border}`,
                  borderRadius: 7, padding: "10px 18px", color: T.muted,
                  fontSize: 12, fontWeight: 500, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <Edit3 size={12} />
                Start from Blank
              </button>
            </div>
          </Card>

          <StatusPanel status={status} error={processStatus?.error} processingLabel="Extracting proposal fields" />

          {/* KPI row — show existing pipeline stats */}
          {total > 0 && (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <KpiCard label="Active Proposals" value={total} sub="In pipeline" icon={FileText} />
              <KpiCard label="Total Value" value={fmtUSD(totalValue)} sub="Combined deal value" icon={DollarSign} color={T.success} />
              <KpiCard label="Avg Deal Size" value={total > 0 ? fmtUSD(totalValue / total) : "$—"} sub="Per proposal" icon={TrendingUp} color={T.warn} />
            </div>
          )}
        </>
      )}

      {/* ── EDIT TAB ───────────────────────────────────────── */}
      {tab === "edit" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {FIELD_GROUPS.map((group) => (
            <Card key={group.label}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.accent, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {group.label}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: group.fields.some((f) => f.type === "textarea") ? "1fr" : "1fr 1fr", gap: 12 }}>
                {group.fields.map((field) => (
                  <div key={field.key} style={{ gridColumn: field.type === "textarea" ? "1 / -1" : undefined }}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: T.muted, marginBottom: 4 }}>
                      {field.label}
                    </label>
                    <FieldInput field={field} value={fields[field.key]} onChange={handleFieldChange} />
                  </div>
                ))}
              </div>
            </Card>
          ))}

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handlePreview}
              style={{
                background: `linear-gradient(135deg,${T.accent},#6d28d9)`,
                border: "none", borderRadius: 7, padding: "10px 22px", color: "#fff",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <Eye size={12} />
              Generate Preview
            </button>
            <button
              onClick={handleDownload}
              style={{
                background: "transparent", border: `1px solid ${T.border}`,
                borderRadius: 7, padding: "10px 18px", color: T.muted,
                fontSize: 12, fontWeight: 500, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <Download size={12} />
              Download HTML
            </button>
          </div>
        </div>
      )}

      {/* ── PREVIEW TAB ────────────────────────────────────── */}
      {tab === "preview" && (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderBottom: `1px solid ${T.border}` }}>
            <Eye size={13} color={T.accent} />
            <span style={{ fontSize: 12, fontWeight: 600 }}>Proposal Preview</span>
            <div style={{ flex: 1 }} />
            <button
              onClick={() => setTab("edit")}
              style={{ background: "none", border: "none", color: T.muted, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            >
              <Edit3 size={11} /> Edit
            </button>
            <button
              onClick={handleDownload}
              style={{ background: T.accentBg, border: `1px solid ${T.borderAcc}`, borderRadius: 6, padding: "5px 12px", color: T.accent, fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            >
              <Download size={11} /> Download
            </button>
          </div>
          <iframe
            ref={iframeRef}
            srcDoc={previewHtml}
            style={{ width: "100%", height: "70vh", border: "none", background: "#fff" }}
            title="Proposal Preview"
          />
        </Card>
      )}
    </div>
  );
}

// ── Mini KPI card ────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, color }) {
  return (
    <Card style={{ flex: "1 1 180px", minWidth: 160 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: T.accentBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={13} color={color || T.accent} />
        </div>
        <div style={{ fontSize: 11, color: T.muted }}>{label}</div>
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: color || T.text }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{sub}</div>}
    </Card>
  );
}
