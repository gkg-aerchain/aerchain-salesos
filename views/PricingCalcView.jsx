import { useState, useMemo, useRef, useCallback } from "react";
import { DollarSign, TrendingUp, Activity, Users, Layers, Settings, BarChart3, ChevronDown, ChevronRight, AlertTriangle, Building2, Zap, Shield, Clock, Upload, FileText, Brain, Loader2, X, CheckCircle } from "lucide-react";
import { T } from "../lib/theme.js";
import { fmt$ } from "../lib/utils.js";
import { Card } from "../components/Common.jsx";
import { StatCard, tableStyle, thStyle, tdStyle } from "../components/DataDisplay.jsx";
import PricingLogicEditor from "../components/PricingLogicEditor.jsx";
import {
  calculatePricing, PRODUCTS, ENTITY_TIERS, CLIENT_TIERS,
  CHANNELS, INTEGRATIONS, IMPL_SECTIONS, ADD_ONS, DEAL_DEFAULTS,
  calcImplSection,
} from "../lib/pricingEngine.js";
import pricingLogicMd from "../pricing-calculator/pricing-logic.md?raw";

// ─── Context Extraction Prompt ───────────────────────────────────────────────
const EXTRACT_PROMPT = `You are a pricing parameter extractor for Aerchain SalesOS. Given input context (RFP, email, proposal, meeting notes, etc.), extract any pricing-relevant parameters you can find.

Return ONLY a JSON object with these fields. Use null for anything not found or unclear:

{
  "customerName": "string or null",
  "annualSpendM": number_in_millions_or_null,
  "products": ["intake-to-award", "procure-to-pay", "spend-insights"] or null,
  "tierOverride": "mid-market" | "enterprise" | "large-enterprise" | null,
  "powerUsers": number_or_null,
  "lightUsers": number_or_null,
  "entityCount": number_or_null,
  "channelVolumes": { "catalog": num, "self-service-po": num, "auto-sourcing": num, ... } or null,
  "integrations": ["sap", "oracle", "servicenow", "netsuite", "coupa", "docusign", "sso", "custom-api"] or null,
  "discount": 0_to_30_or_null,
  "termYears": 1_to_5_or_null,
  "escalation": 0_to_15_or_null,
  "implToggles": { "core": bool, "integrations": bool, "qa": bool, "customerSuccess": bool } or null,
  "notes": "brief summary of what was extracted and what was missing"
}

Channel volume IDs: catalog, self-service-po, contract-fw, rc-invoice, non-po-spend, auto-sourcing, auto-negotiation, tactical, strategic
Integration IDs: sap, oracle, servicenow, netsuite, coupa, docusign, sso, custom-api
Product IDs: intake-to-award, procure-to-pay, spend-insights

Rules:
- Extract spend in USD millions. Convert from other currencies if needed (use approximate rates).
- If spend is given as a range, use the midpoint.
- If number of POs or transactions is given, map to channel volumes (monthly).
- If specific ERP systems are mentioned, include them in integrations.
- If contract length is mentioned, set termYears.
- Be conservative — only set values you're confident about from the text.
- The notes field should explain what you found and what you defaulted.`;

// ─── Read file as text or base64 ─────────────────────────────────────────────
function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const isText = /\.(txt|md|csv|json|xml|html)$/i.test(file.name) || file.type.startsWith("text/");
    if (isText) {
      reader.onload = () => resolve({ type: "text", content: reader.result, name: file.name });
      reader.onerror = reject;
      reader.readAsText(file);
    } else {
      reader.onload = () => {
        const base64 = reader.result.split(",")[1];
        let mediaType = file.type || "application/octet-stream";
        if (/\.pdf$/i.test(file.name)) mediaType = "application/pdf";
        else if (/\.docx$/i.test(file.name)) mediaType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        else if (/\.(png|jpg|jpeg|gif|webp)$/i.test(file.name)) mediaType = file.type || "image/png";
        resolve({ type: "base64", content: base64, mediaType, name: file.name });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    }
  });
}

// ─── Context Upload Section ──────────────────────────────────────────────────
function ContextUpload({ onExtracted, onProcessWithClaude }) {
  const [dragOver, setDragOver] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [files, setFiles] = useState([]);
  const [extracting, setExtracting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const addFiles = useCallback((newFiles) => {
    setFiles(prev => [...prev, ...Array.from(newFiles)]);
    setResult(null);
    setError(null);
  }, []);

  const removeFile = useCallback((idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const handleExtract = useCallback(async () => {
    if (extracting) return;
    if (!pasteText.trim() && files.length === 0) return;

    setExtracting(true);
    setError(null);
    setResult(null);

    try {
      // Build content parts for Claude
      const parts = [];
      if (pasteText.trim()) {
        parts.push(`--- PASTED TEXT ---\n${pasteText.trim()}`);
      }
      for (const file of files) {
        const data = await readFile(file);
        if (data.type === "text") {
          parts.push(`--- FILE: ${data.name} ---\n${data.content}`);
        } else {
          // For binary files (PDF, DOCX, images), we need to send via the API
          // that supports multimodal content. For now, note the file.
          parts.push(`--- FILE: ${data.name} (${data.mediaType}) ---\n[Binary file uploaded - ${(file.size / 1024).toFixed(1)} KB]`);
        }
      }

      const fullPrompt = `${EXTRACT_PROMPT}\n\n--- INPUT CONTEXT ---\n${parts.join("\n\n")}`;

      const response = await onProcessWithClaude(fullPrompt, "pricing-extract");
      if (!response) throw new Error("No response from Claude");

      // Parse JSON from response
      let parsed;
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse extraction result");
      }

      setResult(parsed);
      onExtracted(parsed);
    } catch (err) {
      setError(err.message || "Failed to extract parameters");
    } finally {
      setExtracting(false);
    }
  }, [pasteText, files, extracting, onProcessWithClaude, onExtracted]);

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <Brain size={12} color={T.accent} />
        <span style={{ fontSize: 11, fontWeight: 600, color: T.text }}>Context Input</span>
        <span style={{ fontSize: 9, color: T.muted, marginLeft: "auto" }}>Upload or paste context to auto-fill</span>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `1.5px dashed ${dragOver ? T.accent : T.border}`,
          borderRadius: 8, padding: "12px 10px", textAlign: "center",
          cursor: "pointer", background: dragOver ? T.accentBg : "transparent",
          transition: "all 0.15s", marginBottom: 8,
        }}
      >
        <Upload size={16} color={dragOver ? T.accent : T.muted} />
        <div style={{ fontSize: 10, color: T.muted, marginTop: 4 }}>Drop files or click (PDF, DOCX, TXT, MD)</div>
        <input ref={inputRef} type="file" multiple accept=".pdf,.docx,.doc,.txt,.md,.csv,.json,.xlsx" onChange={e => { if (e.target.files.length) addFiles(e.target.files); e.target.value = ""; }} style={{ display: "none" }} />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
          {files.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", background: T.bgCard, borderRadius: 6, border: `1px solid ${T.border}` }}>
              <FileText size={10} color={T.accent} />
              <span style={{ fontSize: 10, color: T.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
              <span style={{ fontSize: 9, color: T.muted }}>{(f.size / 1024).toFixed(0)}KB</span>
              <X size={10} color={T.muted} style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); removeFile(i); }} />
            </div>
          ))}
        </div>
      )}

      {/* Paste Area */}
      <textarea
        value={pasteText}
        onChange={e => { setPasteText(e.target.value); setResult(null); setError(null); }}
        placeholder="Or paste context here (RFP excerpt, email, meeting notes, deal summary...)"
        rows={3}
        style={{
          width: "100%", padding: "8px 10px", borderRadius: 7,
          border: `1px solid ${T.border}`, background: T.bgCard,
          color: T.text, fontSize: 11, outline: "none", resize: "vertical",
          fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box",
        }}
      />

      {/* Extract Button */}
      <button
        onClick={handleExtract}
        disabled={extracting || (!pasteText.trim() && files.length === 0)}
        style={{
          marginTop: 8, width: "100%", padding: "8px 12px", borderRadius: 7,
          border: "none", cursor: extracting ? "default" : "pointer",
          background: extracting || (!pasteText.trim() && files.length === 0) ? T.bgCard : `linear-gradient(135deg, ${T.accent}, #6d28d9)`,
          color: extracting || (!pasteText.trim() && files.length === 0) ? T.muted : "#fff",
          fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          transition: "all 0.15s",
        }}
      >
        {extracting ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Brain size={12} />}
        {extracting ? "Extracting parameters..." : "Extract & Auto-Fill"}
      </button>

      {/* Result / Error */}
      {error && (
        <div style={{ marginTop: 6, padding: "6px 10px", borderRadius: 6, background: `${T.error}15`, border: `1px solid ${T.error}30`, fontSize: 10, color: T.error }}>{error}</div>
      )}
      {result?.notes && (
        <div style={{ marginTop: 6, padding: "6px 10px", borderRadius: 6, background: `${T.success}15`, border: `1px solid ${T.success}30`, fontSize: 10, color: T.success, display: "flex", alignItems: "flex-start", gap: 6 }}>
          <CheckCircle size={12} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{result.notes}</span>
        </div>
      )}
    </Card>
  );
}

// ─── Shared Styles ───────────────────────────────────────────────────────────
const labelStyle = { fontSize: 10, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 };
const inputStyle = { width: "100%", padding: "7px 10px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.bgCard, color: T.text, fontSize: 12, outline: "none", boxSizing: "border-box" };
const chipStyle = (active) => ({ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, border: `1px solid ${active ? T.accent : T.border}`, background: active ? T.accentBg : "transparent", color: active ? T.accent : T.muted, fontSize: 10, fontWeight: 500, cursor: "pointer", transition: "all 0.15s", userSelect: "none" });
const sectionHeaderStyle = { display: "flex", alignItems: "center", gap: 6, cursor: "pointer", userSelect: "none", padding: "8px 0" };
const tabBtnStyle = (active) => ({ padding: "8px 16px", borderRadius: 8, border: "none", background: active ? T.accentBg : "transparent", color: active ? T.accent : T.muted, fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" });

// ─── Collapsible Section ─────────────────────────────────────────────────────
function Section({ title, icon: Ic, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 4 }}>
      <div style={sectionHeaderStyle} onClick={() => setOpen(!open)}>
        {open ? <ChevronDown size={12} color={T.muted} /> : <ChevronRight size={12} color={T.muted} />}
        {Ic && <Ic size={12} color={T.accent} />}
        <span style={{ fontSize: 11, fontWeight: 600, color: T.text }}>{title}</span>
      </div>
      {open && <div style={{ paddingBottom: 8 }}>{children}</div>}
    </div>
  );
}

// ─── Subscription Composition Bar ────────────────────────────────────────────
function CompositionBar({ comp }) {
  if (!comp || comp.total <= 0) return null;
  const segments = [
    { label: "Platform Fee", value: comp.platform, color: T.accent },
    { label: "Integrations", value: comp.integrations, color: T.warn },
  ].filter(s => s.value > 0);
  return (
    <div>
      <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", height: 8, marginBottom: 8 }}>
        {segments.map(s => (
          <div key={s.label} style={{ flex: s.value, background: s.color, minWidth: 2 }} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {segments.map(s => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color, display: "inline-block" }} />
            <span style={{ fontSize: 10, color: T.muted }}>{s.label}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: T.text }}>{fmt$(s.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Summary Tab ─────────────────────────────────────────────────────────────
function SummaryTab({ p }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <StatCard label="Platform Cost" value={fmt$(p.y1SubDiscounted)} sub="Annual subscription (Y1)" icon={DollarSign} />
        <StatCard label="Implementation" value={fmt$(p.totalImpl)} sub={`${p.implDuration} delivery`} icon={Settings} color={T.warn} />
        <StatCard label="Y1 Total" value={fmt$(p.y1Total)} sub="Subscription + implementation" icon={TrendingUp} color={T.success} />
      </div>
      <Card>
        <div style={labelStyle}>Subscription Composition</div>
        <CompositionBar comp={p.subscriptionComposition} />
      </Card>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div className="glass-surface" style={{ flex: 1, minWidth: 120, borderRadius: 10, padding: 12, boxShadow: T.glass }}>
          <div style={{ fontSize: 10, color: T.muted, fontWeight: 600, marginBottom: 4 }}>BPS</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{p.costPerTxnBps}</div>
        </div>
        <div className="glass-surface" style={{ flex: 1, minWidth: 120, borderRadius: 10, padding: 12, boxShadow: T.glass }}>
          <div style={{ fontSize: 10, color: T.muted, fontWeight: 600, marginBottom: 4 }}>Txns/Month</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{p.totalTxnMonth.toLocaleString()}</div>
        </div>
        <div className="glass-surface" style={{ flex: 1, minWidth: 120, borderRadius: 10, padding: 12, boxShadow: T.glass }}>
          <div style={{ fontSize: 10, color: T.muted, fontWeight: 600, marginBottom: 4 }}>Multiplier</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{p.productMultiplier.toFixed(2)}x</div>
        </div>
        <div className="glass-surface" style={{ flex: 1, minWidth: 120, borderRadius: 10, padding: 12, boxShadow: T.glass }}>
          <div style={{ fontSize: 10, color: T.muted, fontWeight: 600, marginBottom: 4 }}>Tier</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{p.tierLabel}</div>
        </div>
      </div>
      {p.assumptions.length > 0 && (
        <Card style={{ borderLeft: `3px solid ${T.warn}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <AlertTriangle size={12} color={T.warn} />
            <span style={{ fontSize: 11, fontWeight: 600, color: T.warn }}>Assumptions & Estimates</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: 16, listStyle: "disc" }}>
            {p.assumptions.map((a, i) => <li key={i} style={{ fontSize: 11, color: T.muted, lineHeight: 1.7 }}>{a}</li>)}
          </ul>
        </Card>
      )}
    </div>
  );
}

// ─── Breakdown Tab ───────────────────────────────────────────────────────────
function BreakdownTab({ p }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card>
        <div style={labelStyle}>Channel Breakdown</div>
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Channel</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Txn/Mo</th>
                <th style={{ ...thStyle, textAlign: "right" }}>$/Txn</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Annual</th>
                <th style={{ ...thStyle, textAlign: "right" }}>% of Total</th>
              </tr>
            </thead>
            <tbody>
              {p.channelBreakdown.map((ch, i) => (
                <tr key={i} className="table-row">
                  <td style={{ ...tdStyle, fontWeight: 500 }}>
                    {ch.label}
                    {ch.assumed && <span style={{ fontSize: 9, color: T.warn, marginLeft: 4 }}>est.</span>}
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>{ch.volume.toLocaleString()}</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>${ch.perTxn.toFixed(0)}</td>
                  <td style={{ ...tdStyle, textAlign: "right", color: T.success }}>{fmt$(ch.annualCost)}</td>
                  <td style={{ ...tdStyle, textAlign: "right", color: T.muted }}>
                    {p.workflowFeesAnnual > 0 ? `${Math.round(ch.annualCost / p.workflowFeesAnnual * 100)}%` : "—"}
                  </td>
                </tr>
              ))}
              <tr>
                <td style={{ ...tdStyle, fontWeight: 700, borderBottom: "none" }}>Total Workflow Fees</td>
                <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, borderBottom: "none" }}>{p.totalTxnMonth.toLocaleString()}</td>
                <td style={{ ...tdStyle, borderBottom: "none" }} />
                <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, color: T.success, borderBottom: "none" }}>{fmt$(p.workflowFeesAnnual)}</td>
                <td style={{ ...tdStyle, borderBottom: "none" }} />
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
      <Card>
        <div style={labelStyle}>Fee Composition</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { label: "Platform Fee (from spend tiers)", value: p.platformBase, bold: true },
            { label: "Workflow Cost Basis (justification)", value: p.workflowFeesAnnual, color: T.muted, note: true },
            { label: "Integration Add-Ons", value: p.integrationFees },
            { label: "Gross Subscription", value: p.y1Subscription, bold: true },
            ...(p.dealParams.discount > 0 ? [{ label: `Discount (${p.dealParams.discount}%)`, value: -(p.y1Subscription - p.y1SubDiscounted), color: T.success }] : []),
            { label: "Net Subscription (Y1)", value: p.y1SubDiscounted, bold: true, color: T.accent },
          ].map((row, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderTop: row.bold ? `1px solid ${T.border}` : "none" }}>
              <span style={{ fontSize: 11, color: row.bold ? T.text : T.muted, fontWeight: row.bold ? 600 : 400 }}>{row.label}</span>
              <span style={{ fontSize: 12, fontWeight: row.bold ? 700 : 500, color: row.color || T.text }}>{fmt$(row.value)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Implementation Tab ──────────────────────────────────────────────────────
function ImplementationTab({ p, implToggles, setImplToggles }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <div style={labelStyle}>Implementation Rate Card</div>
            <div style={{ fontSize: 11, color: T.muted }}>Scope: Intake to Award &middot; Tier: {p.tierLabel} &middot; Duration: {p.implDuration}</div>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: T.text }}>{fmt$(p.implCost)}</div>
        </div>
        {Object.entries(IMPL_SECTIONS).map(([key, sec]) => {
          if (sec.isTnM) return null;
          const isOn = sec.alwaysOn || implToggles[key] !== false;
          const rawTotal = calcImplSection(key);
          const tierMult = CLIENT_TIERS[p.tier]?.implMultiplier || 1;
          const scaled = Math.round(rawTotal * tierMult);
          return (
            <div key={key} style={{ marginBottom: 12, borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {!sec.alwaysOn && (
                    <div onClick={() => setImplToggles(t => ({ ...t, [key]: !isOn }))} style={{ width: 32, height: 18, borderRadius: 9, background: isOn ? T.accent : T.border, cursor: "pointer", position: "relative", transition: "background 0.15s" }}>
                      <div style={{ width: 14, height: 14, borderRadius: 7, background: "#fff", position: "absolute", top: 2, left: isOn ? 16 : 2, transition: "left 0.15s" }} />
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{sec.label}</div>
                    <div style={{ fontSize: 10, color: T.muted }}>{sec.description}</div>
                  </div>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: isOn ? T.text : T.muted }}>{isOn ? fmt$(scaled) : "OFF"}</span>
              </div>
              {isOn && (
                <table style={{ ...tableStyle, marginTop: 4 }}>
                  <thead><tr>
                    <th style={thStyle}>Role</th><th style={thStyle}>HC</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Rate/Mo</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Months</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Cost</th>
                  </tr></thead>
                  <tbody>
                    {sec.roles.map((r, i) => (
                      <tr key={i} className="table-row">
                        <td style={tdStyle}>{r.title}</td>
                        <td style={tdStyle}>{r.hc}</td>
                        <td style={{ ...tdStyle, textAlign: "right" }}>{fmt$(r.rate)}</td>
                        <td style={{ ...tdStyle, textAlign: "right" }}>{r.months}</td>
                        <td style={{ ...tdStyle, textAlign: "right", color: T.success }}>{fmt$(Math.round(r.hc * r.rate * r.months * tierMult))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </Card>
      <Card>
        <div style={labelStyle}>Add-On Services</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {ADD_ONS.map(a => (
            <div key={a.id} style={{ ...chipStyle(false), cursor: "default" }}>
              {a.label} &middot; {a.price > 0 ? fmt$(a.price) : "Actuals"} <span style={{ color: T.mutedSoft }}>{a.unit}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── TCO Tab ─────────────────────────────────────────────────────────────────
function TCOTab({ p }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 12 }}>
        <StatCard label="3-Year TCO" value={fmt$(p.tco3)} sub={`${p.dealParams.termYears}-year term`} icon={Clock} color={T.accent} />
        <StatCard label="5-Year TCO" value={fmt$(p.tco5)} sub="Extended projection" icon={TrendingUp} color={T.warn} />
      </div>
      <Card>
        <div style={labelStyle}>Year-over-Year Breakdown</div>
        <table style={tableStyle}>
          <thead><tr>
            <th style={thStyle}>Year</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Subscription</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Implementation</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Total</th>
          </tr></thead>
          <tbody>
            {p.years.map(y => (
              <tr key={y.year} className="table-row" style={{ opacity: y.year > p.dealParams.termYears ? 0.5 : 1 }}>
                <td style={{ ...tdStyle, fontWeight: 600 }}>Year {y.year}{y.year > p.dealParams.termYears ? " (proj.)" : ""}</td>
                <td style={{ ...tdStyle, textAlign: "right" }}>{fmt$(y.subscription)}</td>
                <td style={{ ...tdStyle, textAlign: "right", color: y.implementation > 0 ? T.warn : T.muted }}>{y.implementation > 0 ? fmt$(y.implementation) : "—"}</td>
                <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600, color: T.success }}>{fmt$(y.total)}</td>
              </tr>
            ))}
            <tr>
              <td style={{ ...tdStyle, fontWeight: 700, borderBottom: "none" }}>Total</td>
              <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, borderBottom: "none" }}>{fmt$(p.years.reduce((s, y) => s + y.subscription, 0))}</td>
              <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, borderBottom: "none" }}>{fmt$(p.totalImpl)}</td>
              <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, color: T.accent, borderBottom: "none" }}>{fmt$(p.years.reduce((s, y) => s + y.total, 0))}</td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

export default function PricingCalcView({ data, onFilesSelected, uploadedFiles, processing, onProcess, processStatus, onProcessWithClaude }) {
  // ─── Input State ─────────────────────────────────────────────────────────
  const [customerName, setCustomerName] = useState("");
  const [spendInput, setSpendInput] = useState("");
  const [selectedProducts, setSelectedProducts] = useState(["intake-to-award"]);
  const [tierOverride, setTierOverride] = useState("");
  const [powerUsers, setPowerUsers] = useState("");
  const [lightUsers, setLightUsers] = useState("");
  const [entityIdx, setEntityIdx] = useState(-1); // -1 = auto
  const [channelVolumes, setChannelVolumes] = useState({});
  const [selectedIntegrations, setSelectedIntegrations] = useState(null);
  const [implToggles, setImplToggles] = useState({});
  const [discount, setDiscount] = useState(0);
  const [termYears, setTermYears] = useState(3);
  const [escalation, setEscalation] = useState(10);
  const [activeTab, setActiveTab] = useState("summary");

  // ─── Context Extraction Handler ────────────────────────────────────────────
  const handleContextExtracted = useCallback((parsed) => {
    if (parsed.customerName) setCustomerName(parsed.customerName);
    if (parsed.annualSpendM != null) setSpendInput(String(parsed.annualSpendM));
    if (parsed.products && parsed.products.length > 0) setSelectedProducts(parsed.products.filter(p => PRODUCTS[p]));
    if (parsed.tierOverride) setTierOverride(parsed.tierOverride);
    if (parsed.powerUsers != null) setPowerUsers(String(parsed.powerUsers));
    if (parsed.lightUsers != null) setLightUsers(String(parsed.lightUsers));
    if (parsed.entityCount != null) {
      const idx = ENTITY_TIERS.findIndex(et => parsed.entityCount >= et.min && parsed.entityCount <= et.max);
      if (idx >= 0) setEntityIdx(idx);
    }
    if (parsed.channelVolumes) setChannelVolumes(parsed.channelVolumes);
    if (parsed.integrations && parsed.integrations.length > 0) setSelectedIntegrations(parsed.integrations.filter(id => INTEGRATIONS.find(i => i.id === id)));
    if (parsed.discount != null) setDiscount(Math.min(30, Math.max(0, parsed.discount)));
    if (parsed.termYears != null) setTermYears(Math.min(5, Math.max(1, parsed.termYears)));
    if (parsed.escalation != null) setEscalation(Math.min(15, Math.max(0, parsed.escalation)));
    if (parsed.implToggles) setImplToggles(parsed.implToggles);
  }, []);

  const annualSpendM = parseFloat(spendInput) || 0;
  const hasSpend = annualSpendM > 0;

  // ─── Calculate Pricing ───────────────────────────────────────────────────
  const pricing = useMemo(() => {
    if (!hasSpend) return null;
    const entityCount = entityIdx >= 0 ? ENTITY_TIERS[entityIdx].min : undefined;
    const hasChannelOverrides = Object.values(channelVolumes).some(v => v > 0);
    return calculatePricing({
      customerName: customerName || "Unnamed Client",
      annualSpendM,
      selectedProducts,
      tierOverride: tierOverride || undefined,
      powerUsers: powerUsers !== "" ? parseInt(powerUsers) : undefined,
      lightUsers: lightUsers !== "" ? parseInt(lightUsers) : undefined,
      entityCount,
      channelVolumes: hasChannelOverrides ? channelVolumes : undefined,
      selectedIntegrations: selectedIntegrations || undefined,
      implToggles,
      addOns: [],
      dealParams: { discount, termYears, escalation },
    });
  }, [customerName, annualSpendM, selectedProducts, tierOverride, powerUsers, lightUsers, entityIdx, channelVolumes, selectedIntegrations, implToggles, discount, termYears, escalation, hasSpend]);

  // ─── Product Toggle ──────────────────────────────────────────────────────
  const toggleProduct = (pid) => {
    setSelectedProducts(prev => {
      if (prev.includes(pid)) {
        const next = prev.filter(p => p !== pid);
        return next.length > 0 ? next : prev; // must keep at least one
      }
      return [...prev, pid];
    });
  };

  // ─── Integration Toggle ──────────────────────────────────────────────────
  const toggleInteg = (id) => {
    setSelectedIntegrations(prev => {
      const current = prev || INTEGRATIONS.filter(i => i.standard).map(i => i.id);
      if (current.includes(id)) return current.filter(x => x !== id);
      return [...current, id];
    });
  };

  // ─── Channel Volume Change ───────────────────────────────────────────────
  const setChannelVol = (chId, val) => {
    setChannelVolumes(prev => ({ ...prev, [chId]: parseInt(val) || 0 }));
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Main Two-Panel Layout */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>

        {/* ─── LEFT PANEL ─────────────────────────────────────────────────── */}
        <div style={{ width: 320, flexShrink: 0, display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Context Upload */}
          <ContextUpload onExtracted={handleContextExtracted} onProcessWithClaude={onProcessWithClaude} />

          {/* Customer Profile */}
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
              <Building2 size={12} color={T.accent} />
              <span style={{ fontSize: 11, fontWeight: 600, color: T.text }}>Customer Profile</span>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={labelStyle}>Customer Name</div>
              <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="e.g. Iron Mountain" style={inputStyle} />
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={labelStyle}>Annual Spend Under Management ($M)</div>
              <input type="number" value={spendInput} onChange={e => setSpendInput(e.target.value)} placeholder="e.g. 500" min="0" step="10" style={inputStyle} />
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={labelStyle}>Products</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {Object.entries(PRODUCTS).map(([pid, prod]) => (
                  <div key={pid} style={chipStyle(selectedProducts.includes(pid))} onClick={() => toggleProduct(pid)}>
                    {prod.label} <span style={{ fontSize: 9, opacity: 0.7 }}>{prod.base ? "1.0x" : `+${prod.multiplier}x`}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={labelStyle}>Client Tier {!tierOverride && hasSpend && <span style={{ color: T.warn, fontWeight: 400 }}>(auto)</span>}</div>
              <select value={tierOverride} onChange={e => setTierOverride(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="">Auto-detect from spend</option>
                {Object.entries(CLIENT_TIERS).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}
              </select>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>Power Users {powerUsers === "" && hasSpend && <span style={{ color: T.warn, fontWeight: 400 }}>(auto)</span>}</div>
                <input type="number" value={powerUsers} onChange={e => setPowerUsers(e.target.value)} placeholder={hasSpend && pricing ? String(pricing.powerUsers) : "—"} min="0" style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>Light Users {lightUsers === "" && hasSpend && <span style={{ color: T.warn, fontWeight: 400 }}>(auto)</span>}</div>
                <input type="number" value={lightUsers} onChange={e => setLightUsers(e.target.value)} placeholder={hasSpend && pricing ? String(pricing.lightUsers) : "—"} min="0" style={inputStyle} />
              </div>
            </div>

            <div>
              <div style={labelStyle}>Entities / BUs {entityIdx < 0 && hasSpend && <span style={{ color: T.warn, fontWeight: 400 }}>(auto)</span>}</div>
              <div style={{ display: "flex", gap: 4 }}>
                {ENTITY_TIERS.map((et, i) => (
                  <div key={i} style={{ ...chipStyle(entityIdx === i), flex: 1, justifyContent: "center" }} onClick={() => setEntityIdx(entityIdx === i ? -1 : i)}>
                    {et.label} <span style={{ fontSize: 8, opacity: 0.6 }}>{et.multiplier}x</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Workflow Channels */}
          <Card>
            <Section title="Workflow Channels" icon={Zap} defaultOpen={false}>
              <div style={{ fontSize: 10, color: T.muted, marginBottom: 8 }}>Override auto-derived volumes per channel (txns/month)</div>
              {CHANNELS.map(ch => (
                <div key={ch.id} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: T.text, width: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ch.label}</span>
                  <input type="number" value={channelVolumes[ch.id] || ""} onChange={e => setChannelVol(ch.id, e.target.value)} placeholder={hasSpend && pricing ? String(pricing.channelBreakdown.find(c => c.id === ch.id)?.volume || 0) : "—"} min="0" style={{ ...inputStyle, width: 80, padding: "4px 6px", fontSize: 11 }} />
                  <span style={{ fontSize: 9, color: T.muted }}>/mo</span>
                </div>
              ))}
            </Section>
          </Card>

          {/* Integrations */}
          <Card>
            <Section title="Integrations" icon={Layers} defaultOpen={false}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {INTEGRATIONS.map(integ => {
                  const current = selectedIntegrations || INTEGRATIONS.filter(i => i.standard).map(i => i.id);
                  const active = current.includes(integ.id);
                  return (
                    <div key={integ.id} style={chipStyle(active)} onClick={() => toggleInteg(integ.id)}>
                      {integ.label}
                      {integ.annualFee > 0 && <span style={{ fontSize: 8, opacity: 0.6 }}>{fmt$(integ.annualFee)}/yr</span>}
                      {integ.standard && <span style={{ fontSize: 8, opacity: 0.6 }}>std</span>}
                    </div>
                  );
                })}
              </div>
            </Section>
          </Card>

          {/* Deal Parameters */}
          <Card>
            <Section title="Deal Parameters" icon={Shield} defaultOpen={false}>
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={labelStyle}>Discount</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: discount > 0 ? T.success : T.muted }}>{discount}%</span>
                </div>
                <input type="range" min="0" max="30" step="1" value={discount} onChange={e => setDiscount(parseInt(e.target.value))} style={{ width: "100%", accentColor: T.accent }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: T.muted }}>
                  <span>0%</span><span>30%</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={labelStyle}>Term (yrs)</div>
                  <select value={termYears} onChange={e => setTermYears(parseInt(e.target.value))} style={{ ...inputStyle, cursor: "pointer" }}>
                    {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>{y} year{y > 1 ? "s" : ""}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={labelStyle}>Escalation (%)</div>
                  <input type="number" value={escalation} onChange={e => setEscalation(parseInt(e.target.value) || 0)} min="0" max="15" style={inputStyle} />
                </div>
              </div>
            </Section>
          </Card>
        </div>

        {/* ─── RIGHT PANEL ────────────────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {!hasSpend ? (
            /* Empty State */
            <div className="glass-surface" style={{ borderRadius: 14, padding: 60, textAlign: "center", boxShadow: T.glass }}>
              <DollarSign size={40} color={T.muted} style={{ marginBottom: 12, opacity: 0.4 }} />
              <div style={{ fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 6 }}>Enter spend to generate pricing</div>
              <div style={{ fontSize: 12, color: T.muted }}>Set the annual spend under management in the left panel to see the full pricing breakdown.</div>
            </div>
          ) : pricing && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Header */}
              <div className="glass-surface" style={{ borderRadius: 14, padding: "14px 16px", boxShadow: T.glass }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{pricing.customerName}</div>
                    <div style={{ fontSize: 11, color: T.muted }}>${annualSpendM}M spend &middot; {pricing.tierLabel} &middot; {pricing.implDuration}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: T.accent }}>{fmt$(pricing.y1Total)}</div>
                    <div style={{ fontSize: 10, color: T.muted }}>Y1 Total</div>
                  </div>
                </div>
              </div>

              {/* Tab Bar */}
              <div style={{ display: "flex", gap: 4, background: T.bgCard, borderRadius: 10, padding: 4, border: `1px solid ${T.border}` }}>
                {[
                  { id: "summary", label: "Summary", icon: BarChart3 },
                  { id: "breakdown", label: "Breakdown", icon: Activity },
                  { id: "implementation", label: "Implementation", icon: Settings },
                  { id: "tco", label: "TCO", icon: TrendingUp },
                ].map(tab => (
                  <button key={tab.id} style={tabBtnStyle(activeTab === tab.id)} onClick={() => setActiveTab(tab.id)}>
                    <tab.icon size={11} style={{ marginRight: 4, verticalAlign: "middle" }} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === "summary" && <SummaryTab p={pricing} />}
              {activeTab === "breakdown" && <BreakdownTab p={pricing} />}
              {activeTab === "implementation" && <ImplementationTab p={pricing} implToggles={implToggles} setImplToggles={setImplToggles} />}
              {activeTab === "tco" && <TCOTab p={pricing} />}
            </div>
          )}
        </div>
      </div>

      {/* ─── PRICING LOGIC EDITOR (Bottom) ──────────────────────────────────── */}
      <PricingLogicEditor defaultLogic={pricingLogicMd} onProcessWithClaude={onProcessWithClaude} />
    </div>
  );
}
