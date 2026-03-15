import { Upload, FileText, DollarSign, TrendingUp, Brain } from "lucide-react";
import { T } from "../lib/theme.js";
import { fmt$ } from "../lib/utils.js";
import { Card, FileUploadZone, Spinner } from "../components/Common.jsx";
import { StatCard, tableStyle, thStyle, tdStyle, stageBadge, statusBadge } from "../components/DataDisplay.jsx";

export default function ProposalsView({ data, onFilesSelected, uploadedFiles, processing, onProcess }) {
  const proposals = data.activeProposals || [];
  const total = data.total || proposals.length;
  const totalValue = data.totalValue || proposals.reduce((s, p) => s + (p.value || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Upload & Generate area */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Upload size={13} color={T.accent} />
          <span style={{ fontSize: 12, fontWeight: 600 }}>Upload Proposal Documents</span>
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
              {processing ? "Generating…" : "Generate Proposal"}
            </button>
          </div>
        )}
      </Card>

      {/* Generated proposal output */}
      {data.proposalTitle && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Brain size={13} color={T.accent} />
            <span style={{ fontSize: 12, fontWeight: 600 }}>Generated Proposal: {data.proposalTitle}</span>
          </div>
          {data.summary && <div style={{ color: T.muted, fontSize: 12, marginBottom: 12 }}>{data.summary}</div>}
          {data.sections?.map((s, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ color: T.text, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{s.heading}</div>
              <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{s.content}</div>
            </div>
          ))}
        </Card>
      )}

      {/* KPI Row */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <StatCard label="Active Proposals" value={total} sub="In pipeline" icon={FileText} />
        <StatCard label="Total Value" value={fmt$(totalValue)} sub="Combined deal value" icon={DollarSign} color={T.success} />
        <StatCard label="Avg Deal Size" value={total > 0 ? fmt$(totalValue / total) : "$—"} sub="Per proposal" icon={TrendingUp} color={T.warn} />
      </div>

      {/* Proposals Table */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <FileText size={13} color={T.accent} />
          <span style={{ fontSize: 12, fontWeight: 600 }}>Proposals</span>
          <span style={{ color: T.muted, fontSize: 11 }}>({proposals.length})</span>
        </div>
        {proposals.length === 0 ? (
          <div style={{ color: T.muted, fontSize: 12, textAlign: "center", padding: 20 }}>No proposals generated yet — upload documents above</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Client</th>
                  <th style={thStyle}>Value</th>
                  <th style={thStyle}>Stage</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Submitted</th>
                  <th style={thStyle}>Contact</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((p, i) => (
                  <tr key={i} className="table-row" style={{ transition: "background 0.1s" }}>
                    <td style={{ ...tdStyle, fontWeight: 600, color: T.text }}>{p.client || "—"}</td>
                    <td style={{ ...tdStyle, color: T.success }}>{fmt$(p.value)}</td>
                    <td style={tdStyle}>{stageBadge(p.stage)}</td>
                    <td style={tdStyle}>{statusBadge(p.status)}</td>
                    <td style={{ ...tdStyle, color: T.muted }}>{p.submittedDate || "—"}</td>
                    <td style={{ ...tdStyle, color: T.muted }}>{p.contact || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
