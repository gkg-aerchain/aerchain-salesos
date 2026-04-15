import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { DollarSign, TrendingUp, Activity, Settings, BarChart3, AlertTriangle, Building2, Zap, Shield, Clock, Upload, FileText, Brain, Loader2, X, CheckCircle, Gift, Layers, ChevronDown, ChevronRight, SlidersHorizontal } from "lucide-react";
import { T } from "../lib/theme.js";
import { fmt$ } from "../lib/utils.js";
import { Card } from "../components/Common.jsx";
import { StatCard, tableStyle, thStyle, tdStyle } from "../components/DataDisplay.jsx";
import PricingConfigPanel from "../components/PricingConfigPanel.jsx";
import { calculatePricingV2, defaultConfig, calcImplSectionRaw } from "../lib/pricingEngineV2.js";

const labelStyle = { fontSize: 10, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 };
const inputStyle = { width: "100%", padding: "7px 10px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.bgCard, color: T.text, fontSize: 12, outline: "none", boxSizing: "border-box" };
const chipStyle = (active) => ({ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, border: `1px solid ${active ? T.accent : T.border}`, background: active ? T.accentBg : "transparent", color: active ? T.accent : T.muted, fontSize: 10, fontWeight: 500, cursor: "pointer", transition: "all 0.15s", userSelect: "none" });
const tabBtnStyle = (active) => ({ padding: "8px 16px", borderRadius: 8, border: "none", background: active ? T.accentBg : "transparent", color: active ? T.accent : T.muted, fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" });

function Section({ title, icon: Ic, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", userSelect: "none", padding: "8px 0" }} onClick={() => setOpen(!open)}>
        {open ? <ChevronDown size={12} color={T.muted} /> : <ChevronRight size={12} color={T.muted} />}
        {Ic && <Ic size={12} color={T.accent} />}
        <span style={{ fontSize: 11, fontWeight: 600, color: T.text }}>{title}</span>
      </div>
      {open && <div style={{ paddingBottom: 8 }}>{children}</div>}
    </div>
  );
}

function CompositionBar({ comp }) {
  if (!comp || comp.total <= 0) return null;
  const segments = [
    { label: "Platform Access", value: comp.platformAccess, color: T.accent },
    { label: "Workflow Fees", value: comp.workflowFees, color: T.success },
    { label: "Integrations", value: comp.integrations, color: T.warn },
  ].filter(s => s.value > 0);
  return (
    <div>
      <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", height: 8, marginBottom: 8 }}>
        {segments.map(s => (<div key={s.label} style={{ flex: s.value, background: s.color, minWidth: 2 }} />))}
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

function SummaryTab({ p }) {
  const userMultPct = Math.round((p.userMultiplier - 1) * 100);
  const userMultActive = Math.abs(p.userMultiplier - 1) > 0.005;
  const platformSub = userMultActive
    ? `${Math.round(p.feeStructure.platformPct*100)}% + ${userMultPct > 0 ? "+" : ""}${userMultPct}% user mult`
    : `${Math.round(p.feeStructure.platformPct*100)}% of subscription`;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <StatCard label="Platform Access" value={fmt$(p.platformAccess)} sub={platformSub} icon={DollarSign} />
        <StatCard label="Workflow Fees" value={fmt$(p.workflowFeesAnnual)} sub={`${Math.round(p.feeStructure.workflowPct*100)}% of subscription`} icon={Zap} color={T.success} />
        <StatCard label="Y1 Total" value={fmt$(p.y1Total)} sub="Sub + impl + gain share" icon={TrendingUp} color={T.warn} />
      </div>
      {p.gainShare.enabled && p.gainShareFee > 0 && (
        <div style={{ display: "flex", gap: 12 }}>
          <StatCard label="Gain Share (Est.)" value={fmt$(p.gainShareFee)} sub={`${p.gainShare.defaultPct}% of savings, ${p.gainShare.reconciliation}`} icon={Gift} color={T.accent} />
        </div>
      )}
      <Card>
        <div style={labelStyle}>Subscription Composition</div>
        <CompositionBar comp={p.subscriptionComposition} />
      </Card>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {[
          { label: "BPS", value: p.bps },
          { label: "Txns/Month", value: p.totalTxnMonth.toLocaleString() },
          { label: "Users (P/L)", value: `${p.powerUsers} / ${p.lightUsers}` },
          { label: "User Mult", value: `${p.userMultiplier.toFixed(2)}x` },
          { label: "Tier", value: p.tierLabel },
        ].map(m => (
          <div key={m.label} className="glass-surface" style={{ flex: 1, minWidth: 90, borderRadius: 10, padding: 12, boxShadow: T.glass }}>
            <div style={{ fontSize: 10, color: T.muted, fontWeight: 600, marginBottom: 4 }}>{m.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{m.value}</div>
          </div>
        ))}
      </div>
      {p.assumptions.length > 0 && (
        <Card style={{ borderLeft: `3px solid ${T.warn}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <AlertTriangle size={12} color={T.warn} />
            <span style={{ fontSize: 11, fontWeight: 600, color: T.warn }}>Assumptions</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: 16, listStyle: "disc" }}>
            {p.assumptions.map((a, i) => <li key={i} style={{ fontSize: 11, color: T.muted, lineHeight: 1.7 }}>{a}</li>)}
          </ul>
        </Card>
      )}
    </div>
  );
}

function BreakdownTab({ p }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card>
        <div style={labelStyle}>Fee Composition</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {(() => {
            const userAdj = p.platformAccess - p.platformAccessBase;
            const userMultActive = Math.abs(userAdj) >= 500;
            return [
              { label: "Platform Access (baseline)", value: p.platformAccessBase },
              ...(userMultActive ? [{
                label: `User multiplier (${p.userMultiplier.toFixed(2)}x, ${p.powerUsers}P / ${p.lightUsers}L)`,
                value: userAdj,
                color: userAdj > 0 ? T.warn : T.success,
              }] : []),
              { label: "Workflow Fees", value: p.workflowFeesAnnual },
              { label: "Integration Add-Ons", value: p.integrationFees },
              { label: "Gross Subscription", value: p.y1Subscription, bold: true },
              ...(p.dealParams.discount > 0 ? [{ label: `Discount (${p.dealParams.discount}%)`, value: -(p.y1Subscription - p.y1SubDiscounted), color: T.success }] : []),
              { label: "Net Subscription (Y1)", value: p.y1SubDiscounted, bold: true, color: T.accent },
              ...(p.gainShare.enabled ? [{ label: `Gain Share (${p.gainShare.defaultPct}%)`, value: p.gainShareFee, color: T.warn }] : []),
            ];
          })().map((row, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderTop: row.bold ? `1px solid ${T.border}` : "none" }}>
              <span style={{ fontSize: 11, color: row.bold ? T.text : T.muted, fontWeight: row.bold ? 600 : 400 }}>{row.label}</span>
              <span style={{ fontSize: 12, fontWeight: row.bold ? 700 : 500, color: row.color || T.text }}>{fmt$(row.value)}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={labelStyle}>Channel Breakdown (Derived from Workflow Budget)</div>
          <span style={{ fontSize: 10, color: T.muted }}>{fmt$(p.workflowFeesAnnual)} total</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead><tr>
              <th style={thStyle}>Channel</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Txn/Mo</th>
              <th style={{ ...thStyle, textAlign: "right" }}>$/Txn</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Annual</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Weight</th>
            </tr></thead>
            <tbody>
              {p.channelBreakdown.map((ch, i) => (
                <tr key={i} className="table-row">
                  <td style={{ ...tdStyle, fontWeight: 500 }}>{ch.label}{ch.assumed && <span style={{ fontSize: 9, color: T.warn, marginLeft: 4 }}>est.</span>}</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>{ch.volume.toLocaleString()}</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>${ch.perTxn.toFixed(2)}</td>
                  <td style={{ ...tdStyle, textAlign: "right", color: T.success }}>{fmt$(ch.annualCost)}</td>
                  <td style={{ ...tdStyle, textAlign: "right", color: T.muted }}>{Math.round(ch.weight * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function ImplementationTab({ p }) {
  const cfg = p.config;
  const tierMult = cfg.clientTiers[p.tier]?.implMultiplier || 1;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <div style={labelStyle}>Implementation Rate Card</div>
            <div style={{ fontSize: 11, color: T.muted }}>Tier: {p.tierLabel} ({tierMult}x) &middot; {p.implDuration}</div>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: T.text }}>{fmt$(p.implCost)}</div>
        </div>
        {Object.entries(cfg.implSections).map(([key, sec]) => {
          const isOn = sec.alwaysOn || p.implToggles[key] !== false;
          const raw = calcImplSectionRaw(key, cfg);
          const scaled = Math.round(raw * tierMult);
          return (
            <div key={key} style={{ marginBottom: 10, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{sec.label}</span>
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
    </div>
  );
}

function TCOTab({ p }) {
  const hasGS = p.gainShare.enabled;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 12 }}>
        <StatCard label="3-Year TCO" value={fmt$(p.tco3)} sub={`${p.dealParams.termYears}-year term`} icon={Clock} color={T.accent} />
        <StatCard label="5-Year TCO" value={fmt$(p.tco5)} sub="Extended projection" icon={TrendingUp} color={T.warn} />
      </div>
      <Card>
        <div style={labelStyle}>Year-over-Year</div>
        <table style={tableStyle}>
          <thead><tr>
            <th style={thStyle}>Year</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Subscription</th>
            {hasGS && <th style={{ ...thStyle, textAlign: "right" }}>Gain Share</th>}
            <th style={{ ...thStyle, textAlign: "right" }}>Impl</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Total</th>
          </tr></thead>
          <tbody>
            {p.years.map(y => (
              <tr key={y.year} className="table-row" style={{ opacity: y.year > p.dealParams.termYears ? 0.5 : 1 }}>
                <td style={{ ...tdStyle, fontWeight: 600 }}>Y{y.year}{y.year > p.dealParams.termYears ? " (proj)" : ""}</td>
                <td style={{ ...tdStyle, textAlign: "right" }}>{fmt$(y.subscription)}</td>
                {hasGS && <td style={{ ...tdStyle, textAlign: "right", color: T.warn }}>{y.gainShare > 0 ? fmt$(y.gainShare) : "—"}</td>}
                <td style={{ ...tdStyle, textAlign: "right", color: y.implementation > 0 ? T.warn : T.muted }}>{y.implementation > 0 ? fmt$(y.implementation) : "—"}</td>
                <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600, color: T.success }}>{fmt$(y.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function ContextUpload({ onExtracted, onProcessWithClaude }) {
  const [dragOver, setDragOver] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [files, setFiles] = useState([]);
  const [extracting, setExtracting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const addFiles = useCallback((f) => { setFiles(prev => [...prev, ...Array.from(f)]); setResult(null); setError(null); }, []);
  const removeFile = useCallback((idx) => { setFiles(prev => prev.filter((_, i) => i !== idx)); }, []);

  const handleExtract = useCallback(async () => {
    if (extracting || (!pasteText.trim() && files.length === 0)) return;
    setExtracting(true); setError(null); setResult(null);
    try {
      const parts = [];
      if (pasteText.trim()) parts.push("--- PASTED TEXT ---\n" + pasteText.trim());
      for (const file of files) {
        const text = await new Promise((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(r.result);
          r.onerror = rej;
          r.readAsText(file);
        }).catch(() => `[Binary file: ${file.name}]`);
        parts.push("--- FILE: " + file.name + " ---\n" + text);
      }
      const prompt = `You are a pricing parameter extractor for Aerchain SalesOS. Given input context, extract pricing parameters. Return ONLY JSON:\n{"customerName":null,"annualSpendM":null,"products":null,"tierOverride":null,"powerUsers":null,"lightUsers":null,"entityCount":null,"channelVolumes":null,"integrations":null,"discount":null,"termYears":null,"escalation":null,"notes":"summary"}\n\n--- INPUT ---\n${parts.join("\n\n")}`;
      const response = await onProcessWithClaude(prompt, "pricing-extract");
      if (!response) throw new Error("No response");
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Could not parse result");
      const parsed = JSON.parse(jsonMatch[0]);
      setResult(parsed);
      onExtracted(parsed);
    } catch (err) { setError(err.message); }
    finally { setExtracting(false); }
  }, [pasteText, files, extracting, onProcessWithClaude, onExtracted]);

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <Brain size={12} color={T.accent} />
        <span style={{ fontSize: 11, fontWeight: 600, color: T.text }}>Context Input</span>
      </div>
      <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }} onClick={() => inputRef.current?.click()} style={{ border: `1.5px dashed ${dragOver ? T.accent : T.border}`, borderRadius: 8, padding: "10px 8px", textAlign: "center", cursor: "pointer", background: dragOver ? T.accentBg : "transparent", marginBottom: 6 }}>
        <Upload size={14} color={T.muted} />
        <div style={{ fontSize: 9, color: T.muted, marginTop: 2 }}>Drop files (PDF, DOCX, TXT, MD)</div>
        <input ref={inputRef} type="file" multiple accept=".pdf,.docx,.txt,.md,.csv,.json" onChange={e => { if (e.target.files.length) addFiles(e.target.files); e.target.value = ""; }} style={{ display: "none" }} />
      </div>
      {files.length > 0 && files.map((f, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 6px", background: T.bgCard, borderRadius: 5, border: `1px solid ${T.border}`, marginBottom: 3, fontSize: 10 }}>
          <FileText size={9} color={T.accent} /><span style={{ flex: 1, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
          <X size={9} color={T.muted} style={{ cursor: "pointer" }} onClick={e => { e.stopPropagation(); removeFile(i); }} />
        </div>
      ))}
      <textarea value={pasteText} onChange={e => { setPasteText(e.target.value); setResult(null); }} placeholder="Or paste context here..." rows={2} style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.bgCard, color: T.text, fontSize: 10, outline: "none", resize: "vertical", fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box" }} />
      <button onClick={handleExtract} disabled={extracting || (!pasteText.trim() && files.length === 0)} style={{ marginTop: 6, width: "100%", padding: "7px", borderRadius: 6, border: "none", cursor: extracting ? "default" : "pointer", background: (extracting || (!pasteText.trim() && files.length === 0)) ? T.bgCard : `linear-gradient(135deg,${T.accent},#6d28d9)`, color: (extracting || (!pasteText.trim() && files.length === 0)) ? T.muted : "#fff", fontSize: 10, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
        {extracting ? <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} /> : <Brain size={10} />}
        {extracting ? "Extracting..." : "Extract & Auto-Fill"}
      </button>
      {error && <div style={{ marginTop: 4, padding: "4px 8px", borderRadius: 5, background: `${T.error}15`, fontSize: 9, color: T.error }}>{error}</div>}
      {result?.notes && <div style={{ marginTop: 4, padding: "4px 8px", borderRadius: 5, background: `${T.success}15`, fontSize: 9, color: T.success, display: "flex", alignItems: "flex-start", gap: 4 }}><CheckCircle size={10} style={{ flexShrink: 0, marginTop: 1 }} /><span>{result.notes}</span></div>}
    </Card>
  );
}

export default function PricingCalcV2View({ data, onFilesSelected, uploadedFiles, processing, onProcess, processStatus, onProcessWithClaude }) {
  const [config, setConfig] = useState(() => JSON.parse(JSON.stringify(defaultConfig)));
  const [customerName, setCustomerName] = useState("");
  const [spendInput, setSpendInput] = useState("");
  const [selectedProducts, setSelectedProducts] = useState(["intake-to-award"]);
  const [tierOverride, setTierOverride] = useState("");
  const [powerUsers, setPowerUsers] = useState("");
  const [lightUsers, setLightUsers] = useState("");
  const [entityIdx, setEntityIdx] = useState(-1);
  const [channelVolumes, setChannelVolumes] = useState({});
  const [selectedIntegrations, setSelectedIntegrations] = useState(null);
  const [implToggles, setImplToggles] = useState({});
  const [discount, setDiscount] = useState(0);
  const [termYears, setTermYears] = useState(3);
  const [escalation, setEscalation] = useState(10);
  const [activeTab, setActiveTab] = useState("summary");
  const [showConfig, setShowConfig] = useState(() => {
    try { return localStorage.getItem("v2-show-config") !== "false"; }
    catch { return true; }
  });
  useEffect(() => {
    try { localStorage.setItem("v2-show-config", String(showConfig)); } catch {}
  }, [showConfig]);

  const annualSpendM = parseFloat(spendInput) || 0;
  const hasSpend = annualSpendM > 0;

  const handleContextExtracted = useCallback((parsed) => {
    if (parsed.customerName) setCustomerName(parsed.customerName);
    if (parsed.annualSpendM != null) setSpendInput(String(parsed.annualSpendM));
    if (parsed.products?.length > 0) setSelectedProducts(parsed.products.filter(p => config.products[p]));
    if (parsed.tierOverride) setTierOverride(parsed.tierOverride);
    if (parsed.powerUsers != null) setPowerUsers(String(parsed.powerUsers));
    if (parsed.lightUsers != null) setLightUsers(String(parsed.lightUsers));
    if (parsed.entityCount != null) {
      const idx = config.entityTiers.findIndex(et => parsed.entityCount >= et.min && parsed.entityCount <= et.max);
      if (idx >= 0) setEntityIdx(idx);
    }
    if (parsed.channelVolumes) setChannelVolumes(parsed.channelVolumes);
    if (parsed.integrations?.length > 0) setSelectedIntegrations(parsed.integrations);
    if (parsed.discount != null) setDiscount(Math.min(30, Math.max(0, parsed.discount)));
    if (parsed.termYears != null) setTermYears(Math.min(5, Math.max(1, parsed.termYears)));
    if (parsed.escalation != null) setEscalation(Math.min(15, Math.max(0, parsed.escalation)));
  }, [config]);

  const pricing = useMemo(() => {
    if (!hasSpend) return null;
    const entityCount = entityIdx >= 0 ? config.entityTiers[entityIdx].min : undefined;
    const hasChannelOverrides = Object.values(channelVolumes).some(v => v > 0);
    return calculatePricingV2({
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
    }, config);
  }, [customerName, annualSpendM, selectedProducts, tierOverride, powerUsers, lightUsers, entityIdx, channelVolumes, selectedIntegrations, implToggles, discount, termYears, escalation, hasSpend, config]);

  const toggleProduct = (pid) => setSelectedProducts(prev => { if (prev.includes(pid)) { const n = prev.filter(p => p !== pid); return n.length > 0 ? n : prev; } return [...prev, pid]; });
  const toggleInteg = (id) => setSelectedIntegrations(prev => { const cur = prev || config.integrations.filter(i => i.standard).map(i => i.id); return cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id]; });

  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start", position: "relative" }}>
      {/* LEFT: Config Panel (collapsible) */}
      {showConfig ? (
        <div style={{ width: 280, flexShrink: 0 }}>
          <PricingConfigPanel config={config} onChange={setConfig} onHide={() => setShowConfig(false)} />
        </div>
      ) : (
        <button
          onClick={() => setShowConfig(true)}
          title="Show Pricing Rules"
          style={{
            flexShrink: 0, alignSelf: "flex-start",
            width: 36, height: 36, borderRadius: 8,
            background: T.bgCard, border: `1px solid ${T.border}`,
            cursor: "pointer", color: T.muted,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = T.accentBg; e.currentTarget.style.color = T.accent; e.currentTarget.style.borderColor = T.borderAcc; }}
          onMouseLeave={e => { e.currentTarget.style.background = T.bgCard; e.currentTarget.style.color = T.muted; e.currentTarget.style.borderColor = T.border; }}
        >
          <SlidersHorizontal size={14} />
        </button>
      )}

      {/* MIDDLE: Customer Inputs */}
      <div style={{ width: 300, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        <ContextUpload onExtracted={handleContextExtracted} onProcessWithClaude={onProcessWithClaude} />
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <Building2 size={12} color={T.accent} />
            <span style={{ fontSize: 11, fontWeight: 600, color: T.text }}>Customer Profile</span>
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={labelStyle}>Customer Name</div>
            <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="e.g. Iron Mountain" style={inputStyle} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={labelStyle}>Annual Spend ($M)</div>
            <input type="number" value={spendInput} onChange={e => setSpendInput(e.target.value)} placeholder="e.g. 500" min="0" step="10" style={inputStyle} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={labelStyle}>Products</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {Object.entries(config.products).map(([pid, prod]) => (
                <div key={pid} style={chipStyle(selectedProducts.includes(pid))} onClick={() => toggleProduct(pid)}>
                  {prod.label} <span style={{ fontSize: 8, opacity: 0.7 }}>{prod.base ? "1.0x" : `+${prod.multiplier}x`}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={labelStyle}>Client Tier</div>
            <select value={tierOverride} onChange={e => setTierOverride(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="">Auto-detect</option>
              {Object.entries(config.clientTiers).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <div style={{ flex: 1 }}><div style={labelStyle}>Power Users</div><input type="number" value={powerUsers} onChange={e => setPowerUsers(e.target.value)} placeholder={hasSpend && pricing ? String(pricing.powerUsers) : "—"} style={inputStyle} /></div>
            <div style={{ flex: 1 }}><div style={labelStyle}>Light Users</div><input type="number" value={lightUsers} onChange={e => setLightUsers(e.target.value)} placeholder={hasSpend && pricing ? String(pricing.lightUsers) : "—"} style={inputStyle} /></div>
          </div>
          <div>
            <div style={labelStyle}>Entities / BUs</div>
            <div style={{ display: "flex", gap: 3 }}>
              {config.entityTiers.map((et, i) => (
                <div key={i} style={{ ...chipStyle(entityIdx === i), flex: 1, justifyContent: "center", fontSize: 9 }} onClick={() => setEntityIdx(entityIdx === i ? -1 : i)}>{et.label}</div>
              ))}
            </div>
          </div>
        </Card>
        <Card>
          <Section title="Integrations" icon={Layers}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {config.integrations.map(integ => {
                const cur = selectedIntegrations || config.integrations.filter(i => i.standard).map(i => i.id);
                return (<div key={integ.id} style={chipStyle(cur.includes(integ.id))} onClick={() => toggleInteg(integ.id)}>{integ.label}{integ.annualFee > 0 && <span style={{ fontSize: 7 }}>{fmt$(integ.annualFee)}</span>}</div>);
              })}
            </div>
          </Section>
        </Card>
        <Card>
          <Section title="Deal Parameters" icon={Shield}>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={labelStyle}>Discount</span><span style={{ fontSize: 11, fontWeight: 600, color: discount > 0 ? T.success : T.muted }}>{discount}%</span></div>
              <input type="range" min="0" max="30" value={discount} onChange={e => setDiscount(parseInt(e.target.value))} style={{ width: "100%", accentColor: T.accent }} />
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <div style={{ flex: 1 }}><div style={labelStyle}>Term (yrs)</div><select value={termYears} onChange={e => setTermYears(parseInt(e.target.value))} style={{ ...inputStyle, cursor: "pointer" }}>{[1,2,3,4,5].map(y => <option key={y} value={y}>{y}yr</option>)}</select></div>
              <div style={{ flex: 1 }}><div style={labelStyle}>Escalation</div><input type="number" value={escalation} onChange={e => setEscalation(parseInt(e.target.value) || 0)} min="0" max="15" style={inputStyle} /></div>
            </div>
          </Section>
        </Card>
      </div>

      {/* RIGHT: Output */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {!hasSpend ? (
          <div className="glass-surface" style={{ borderRadius: 14, padding: 50, textAlign: "center", boxShadow: T.glass }}>
            <DollarSign size={36} color={T.muted} style={{ marginBottom: 10, opacity: 0.4 }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 4 }}>Enter spend to generate pricing</div>
            <div style={{ fontSize: 11, color: T.muted }}>Set annual spend in the middle panel.</div>
          </div>
        ) : pricing && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="glass-surface" style={{ borderRadius: 14, padding: "14px 18px", boxShadow: T.glass }}>
              {/* Top row: client name + Y1 total */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{pricing.customerName}</div>
                  <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>${annualSpendM}M &middot; {pricing.tierLabel} &middot; {pricing.implDuration} &middot; {Math.round(pricing.feeStructure.platformPct*100)}/{Math.round(pricing.feeStructure.workflowPct*100)} split</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: T.accent, lineHeight: 1 }}>{fmt$(pricing.y1Total)}</div>
                  <div style={{ fontSize: 9, color: T.muted, marginTop: 3, letterSpacing: 0.5 }}>Y1 TOTAL COMMITMENT</div>
                </div>
              </div>

              {/* Breakdown row: Subscription + Services (+ Gain Share) = Y1 Total */}
              <div style={{ display: "flex", alignItems: "stretch", gap: 10, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
                {/* Subscription */}
                <div style={{ flex: 1, padding: "8px 10px", borderRadius: 8, background: T.accentBg, border: `1px solid ${T.borderAcc}` }}>
                  <div style={{ fontSize: 9, color: T.accent, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 4 }}>Subscription</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.text, lineHeight: 1 }}>{fmt$(pricing.y1SubDiscounted)}</div>
                  <div style={{ fontSize: 9, color: T.muted, marginTop: 3 }}>per year &middot; recurring</div>
                </div>

                <div style={{ display: "flex", alignItems: "center", color: T.muted, fontSize: 14, fontWeight: 300 }}>+</div>

                {/* Services / Implementation */}
                <div style={{ flex: 1, padding: "8px 10px", borderRadius: 8, background: "rgba(245,158,11,0.08)", border: `1px solid rgba(245,158,11,0.25)` }}>
                  <div style={{ fontSize: 9, color: T.warn, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 4 }}>Services</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.text, lineHeight: 1 }}>{fmt$(pricing.totalImpl)}</div>
                  <div style={{ fontSize: 9, color: T.muted, marginTop: 3 }}>one-time &middot; implementation</div>
                </div>

                {pricing.gainShare.enabled && pricing.gainShareFee > 0 && (
                  <>
                    <div style={{ display: "flex", alignItems: "center", color: T.muted, fontSize: 14, fontWeight: 300 }}>+</div>
                    <div style={{ flex: 1, padding: "8px 10px", borderRadius: 8, background: "rgba(16,185,129,0.08)", border: `1px solid rgba(16,185,129,0.25)` }}>
                      <div style={{ fontSize: 9, color: T.success, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 4 }}>Gain Share</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: T.text, lineHeight: 1 }}>{fmt$(pricing.gainShareFee)}</div>
                      <div style={{ fontSize: 9, color: T.muted, marginTop: 3 }}>variable &middot; outcome-based</div>
                    </div>
                  </>
                )}

                <div style={{ display: "flex", alignItems: "center", color: T.muted, fontSize: 14, fontWeight: 300 }}>=</div>

                {/* Y1 Total */}
                <div style={{ flex: 1, padding: "8px 10px", borderRadius: 8, background: T.bgCard, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 9, color: T.muted, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 4 }}>Y1 Total</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.accent, lineHeight: 1 }}>{fmt$(pricing.y1Total)}</div>
                  <div style={{ fontSize: 9, color: T.muted, marginTop: 3 }}>year one commitment</div>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 4, background: T.bgCard, borderRadius: 10, padding: 4, border: `1px solid ${T.border}` }}>
              {[{ id: "summary", label: "Summary", icon: BarChart3 }, { id: "breakdown", label: "Breakdown", icon: Activity }, { id: "implementation", label: "Implementation", icon: Settings }, { id: "tco", label: "TCO", icon: TrendingUp }].map(tab => (
                <button key={tab.id} style={tabBtnStyle(activeTab === tab.id)} onClick={() => setActiveTab(tab.id)}>
                  <tab.icon size={10} style={{ marginRight: 3, verticalAlign: "middle" }} />{tab.label}
                </button>
              ))}
            </div>
            {activeTab === "summary" && <SummaryTab p={pricing} />}
            {activeTab === "breakdown" && <BreakdownTab p={pricing} />}
            {activeTab === "implementation" && <ImplementationTab p={pricing} />}
            {activeTab === "tco" && <TCOTab p={pricing} />}
          </div>
        )}
      </div>
    </div>
  );
}
