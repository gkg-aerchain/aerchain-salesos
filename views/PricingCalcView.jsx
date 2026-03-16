import { useMemo } from "react";
import { Upload, DollarSign, TrendingUp, Activity, Users, Brain } from "lucide-react";
import { T } from "../lib/theme.js";
import { fmt$ } from "../lib/utils.js";
import { validateAllFiles } from "../lib/fileValidation.js";
import { Card, FileUploadZone, Spinner } from "../components/Common.jsx";
import { StatCard, tableStyle, thStyle, tdStyle } from "../components/DataDisplay.jsx";
import { StatusPanel, FileValidationBar } from "../components/StatusPanel.jsx";

export default function PricingCalcView({ data, onFilesSelected, uploadedFiles, processing, onProcess, processStatus }) {
  const model = data.standardModel || {};
  const deals = data.recentDeals || [];

  const validation = useMemo(
    () => validateAllFiles(uploadedFiles, { allowImages: false }),
    [uploadedFiles]
  );

  const canProcess = uploadedFiles?.length > 0 && !validation.hasErrors && !processing;
  const status = processStatus?.step || (processing ? "processing" : "idle");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Upload & Process area */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Upload size={13} color={T.accent} />
          <span style={{ fontSize: 12, fontWeight: 600 }}>Upload Pricing Data</span>
        </div>
        <FileUploadZone onFilesSelected={onFilesSelected} />
        <FileValidationBar validationResults={validation} />

        {uploadedFiles && uploadedFiles.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <button onClick={onProcess} disabled={!canProcess} style={{
              background: !canProcess ? T.bgCard : `linear-gradient(135deg,${T.accent},#6d28d9)`,
              border: "none", borderRadius: 7, padding: "8px 18px", color: !canProcess ? T.muted : "#fff",
              fontSize: 12, fontWeight: 600,
              cursor: !canProcess ? "default" : "pointer", display: "flex", alignItems: "center", gap: 6,
              opacity: validation.hasErrors ? 0.5 : 1, transition: "opacity 0.2s",
            }}>
              {processing ? <Spinner size={12} /> : <Brain size={12} />}
              {processing ? "Processing…" : validation.hasErrors ? "Fix Errors First" : "Process with Claude"}
            </button>
          </div>
        )}
      </Card>

      <StatusPanel status={status} error={processStatus?.error} processingLabel="Analyzing pricing data" />

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
