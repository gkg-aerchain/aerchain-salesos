import { useState } from "react";
import { Settings, ChevronDown, ChevronRight, RotateCcw, Save, AlertTriangle, Percent, Layers, Building2, Zap, Wrench, Gift, EyeOff, TrendingDown, TrendingUp } from "lucide-react";
import { T } from "../lib/theme.js";
import { Card } from "./Common.jsx";
import { fmt$ } from "../lib/utils.js";
import { defaultConfig, interpolateTotal, getProductMultiplier, getEntityMultiplier, estimateTxnVolume, volumeDiscount, calcImplSpendMultiplier } from "../lib/pricingEngineV2.js";
import gainShareMd from "../pricing-calculator-v2/gain-share-logic.md?raw";

const labelStyle = { fontSize: 10, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 };
const inputStyle = { width: "100%", padding: "6px 8px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.bgCard, color: T.text, fontSize: 11, outline: "none", boxSizing: "border-box" };
const smallInput = { ...inputStyle, width: 70, textAlign: "right" };

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

export default function PricingConfigPanel({ config, onChange, onHide }) {
  const [showGainShareEditor, setShowGainShareEditor] = useState(false);
  const [gainShareLogic, setGainShareLogic] = useState(gainShareMd);

  const update = (path, value) => {
    const next = JSON.parse(JSON.stringify(config));
    const keys = path.split(".");
    let obj = next;
    for (let i = 0; i < keys.length - 1; i++) {
      if (obj[keys[i]] == null || typeof obj[keys[i]] !== "object") obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    onChange(next);
  };

  const updateChannel = (idx, field, value) => {
    const channels = [...config.channels];
    channels[idx] = { ...channels[idx], [field]: value };
    // Auto-normalize weights if editing weight
    if (field === "weight") {
      const total = channels.reduce((s, c) => s + c.weight, 0);
      if (total > 0 && Math.abs(total - 1) > 0.001) {
        // Don't normalize — show warning instead
      }
    }
    onChange({ ...config, channels });
  };

  const updateSpendTier = (idx, field, value) => {
    const tiers = [...config.spendTiers];
    tiers[idx] = { ...tiers[idx], [field]: value };
    onChange({ ...config, spendTiers: tiers });
  };

  const updateProduct = (pid, field, value) => {
    const products = { ...config.products };
    products[pid] = { ...products[pid], [field]: value };
    onChange({ ...config, products });
  };

  const updateEntityTier = (idx, field, value) => {
    const tiers = [...config.entityTiers];
    tiers[idx] = { ...tiers[idx], [field]: value };
    onChange({ ...config, entityTiers: tiers });
  };

  const resetToDefaults = () => {
    onChange(JSON.parse(JSON.stringify(defaultConfig)));
  };

  // Live preview calculations
  const previewSpend = 250;
  const previewTotalK = interpolateTotal(previewSpend, config);
  const previewTotal = Math.round(previewTotalK * 1000);
  const previewPlatform = Math.round(previewTotal * config.feeStructure.platformPct);
  const previewWorkflow = Math.round(previewTotal * config.feeStructure.workflowPct);

  const channelWeightTotal = config.channels.reduce((s, c) => s + c.weight, 0);
  const weightsBalanced = Math.abs(channelWeightTotal - 1) < 0.005;

  return (
    <Card style={{ maxHeight: "calc(100vh - 180px)", overflowY: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: 1 }}>
          <Settings size={12} color={T.accent} />
          <span style={{ fontSize: 12, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Pricing Rules</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          <button onClick={resetToDefaults} title="Reset to defaults" style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 8px", color: T.muted, fontSize: 9, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            <RotateCcw size={10} /> Reset
          </button>
          {onHide && (
            <button onClick={onHide} title="Hide (presentation mode)" style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 8px", color: T.muted, fontSize: 9, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              <EyeOff size={10} /> Hide
            </button>
          )}
        </div>
      </div>

      {/* ─── Fee Structure ─────────────────────────────────────────────── */}
      <Section title="Fee Structure" icon={Percent} defaultOpen={true}>
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: T.muted }}>Platform Access</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.accent }}>{Math.round(config.feeStructure.platformPct * 100)}%</span>
          </div>
          <input type="range" min="20" max="80" step="5" value={Math.round(config.feeStructure.platformPct * 100)} onChange={e => {
            const pct = parseInt(e.target.value) / 100;
            onChange({ ...config, feeStructure: { platformPct: pct, workflowPct: 1 - pct } });
          }} style={{ width: "100%", accentColor: T.accent }} />
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
            <span style={{ fontSize: 10, color: T.muted }}>Workflow Fees</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.success }}>{Math.round(config.feeStructure.workflowPct * 100)}%</span>
          </div>
        </div>
        <div className="glass-surface" style={{ borderRadius: 8, padding: "8px 10px", boxShadow: T.glass }}>
          <div style={{ fontSize: 9, color: T.muted, marginBottom: 4 }}>PREVIEW AT $250M SPEND</div>
          <div style={{ display: "flex", gap: 12 }}>
            <div><span style={{ fontSize: 10, color: T.muted }}>Platform: </span><span style={{ fontSize: 11, fontWeight: 600, color: T.accent }}>{fmt$(previewPlatform)}</span></div>
            <div><span style={{ fontSize: 10, color: T.muted }}>Workflow: </span><span style={{ fontSize: 11, fontWeight: 600, color: T.success }}>{fmt$(previewWorkflow)}</span></div>
            <div><span style={{ fontSize: 10, color: T.muted }}>Total: </span><span style={{ fontSize: 11, fontWeight: 600, color: T.text }}>{fmt$(previewTotal)}</span></div>
          </div>
        </div>
      </Section>

      {/* ─── Spend Tiers ───────────────────────────────────────────────── */}
      <Section title="Spend Tier Anchors" icon={Layers}>
        <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
          <span style={{ flex: 1, ...labelStyle }}>Spend ($M)</span>
          <span style={{ width: 70, ...labelStyle, textAlign: "right" }}>Fee ($K)</span>
          <span style={{ width: 50, ...labelStyle, textAlign: "right" }}>BPS</span>
        </div>
        {config.spendTiers.map((t, i) => (
          <div key={i} style={{ display: "flex", gap: 4, marginBottom: 3, alignItems: "center" }}>
            <input type="number" value={t.spend} onChange={e => updateSpendTier(i, "spend", parseFloat(e.target.value) || 0)} style={{ ...inputStyle, flex: 1, padding: "4px 6px", fontSize: 11 }} />
            <input type="number" value={t.fee} onChange={e => updateSpendTier(i, "fee", parseFloat(e.target.value) || 0)} style={{ ...smallInput, width: 70 }} />
            <span style={{ width: 50, fontSize: 10, color: T.muted, textAlign: "right" }}>{t.spend > 0 ? (t.fee / t.spend * 10).toFixed(1) : "—"}</span>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <div style={{ flex: 1 }}>
            <div style={labelStyle}>Below min (BPS)</div>
            <input type="number" value={config.bpsBelow100M} onChange={e => update("bpsBelow100M", parseFloat(e.target.value) || 0)} step="0.5" style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={labelStyle}>Above max (BPS)</div>
            <input type="number" value={config.bpsAbove1B} onChange={e => update("bpsAbove1B", parseFloat(e.target.value) || 0)} step="0.5" style={inputStyle} />
          </div>
        </div>
        <div style={{ marginTop: 6 }}>
          <div style={labelStyle}>Baseline Floor ($K) — minimum subscription</div>
          <input type="number" value={config.baselineFloorK ?? 100} onChange={e => update("baselineFloorK", parseFloat(e.target.value) || 0)} step="10" style={inputStyle} />
        </div>
      </Section>

      {/* ─── Volume Discount Curve ─────────────────────────────────────── */}
      <Section title="Volume Discount Curve" icon={TrendingDown}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div onClick={() => update("volumeDiscount.enabled", !(config.volumeDiscount?.enabled ?? true))} style={{ width: 32, height: 18, borderRadius: 9, background: (config.volumeDiscount?.enabled ?? true) ? T.accent : T.border, cursor: "pointer", position: "relative", transition: "background 0.15s" }}>
            <div style={{ width: 14, height: 14, borderRadius: 7, background: "#fff", position: "absolute", top: 2, left: (config.volumeDiscount?.enabled ?? true) ? 16 : 2, transition: "left 0.15s" }} />
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, color: (config.volumeDiscount?.enabled ?? true) ? T.text : T.muted }}>
            {(config.volumeDiscount?.enabled ?? true) ? "Auto-applied" : "Disabled"}
          </span>
        </div>
        {(config.volumeDiscount?.enabled ?? true) && (
          <>
            <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>Floor ($M)</div>
                <input type="number" value={config.volumeDiscount?.floor ?? 100} onChange={e => update("volumeDiscount.floor", parseFloat(e.target.value) || 0)} step="50" style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>Cap ($M)</div>
                <input type="number" value={config.volumeDiscount?.cap ?? 3000} onChange={e => update("volumeDiscount.cap", parseFloat(e.target.value) || 0)} step="100" style={inputStyle} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>Max Discount %</div>
                <input type="number" value={Math.round((config.volumeDiscount?.maxDiscount ?? 0.60) * 100)} onChange={e => update("volumeDiscount.maxDiscount", (parseFloat(e.target.value) || 0) / 100)} step="5" min="0" max="90" style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>Exponent (shape)</div>
                <input type="number" value={config.volumeDiscount?.exponent ?? 0.60} onChange={e => update("volumeDiscount.exponent", parseFloat(e.target.value) || 0)} step="0.05" min="0.1" max="3" style={inputStyle} />
              </div>
            </div>
            <div className="glass-surface" style={{ borderRadius: 8, padding: "8px 10px", boxShadow: T.glass }}>
              <div style={{ fontSize: 9, color: T.muted, marginBottom: 6, fontWeight: 700, letterSpacing: 0.5 }}>DISCOUNT CURVE PREVIEW</div>
              {[100, 250, 500, 750, 1000, 1500, 2000, 3000].map(s => {
                const d = volumeDiscount(s, config);
                const pct = Math.round(d * 1000) / 10;
                return (
                  <div key={s} style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: T.muted, padding: "1px 0" }}>
                    <span>${s >= 1000 ? (s/1000).toFixed(1) + "B" : s + "M"}</span>
                    <span style={{ color: d > 0 ? T.success : T.muted, fontWeight: 600 }}>{pct.toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 9, color: T.muted, marginTop: 6, lineHeight: 1.5 }}>
              Formula: <code style={{ fontSize: 9, color: T.accent }}>max × ((spend−floor)/(cap−floor))^exp</code>. Exponent &lt; 1 = concave (fast rise, tapers). Stacks multiplicatively with manual discount slider.
            </div>
          </>
        )}
      </Section>

      {/* ─── Products ──────────────────────────────────────────────────── */}
      <Section title="Product Multipliers" icon={Building2}>
        {Object.entries(config.products).map(([pid, prod]) => (
          <div key={pid} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ flex: 1, fontSize: 10, color: T.text }}>{prod.label}</span>
            <input type="number" value={prod.multiplier} onChange={e => updateProduct(pid, "multiplier", parseFloat(e.target.value) || 0)} step="0.05" min="0" style={smallInput} />
            <span style={{ fontSize: 9, color: T.muted }}>x</span>
          </div>
        ))}
      </Section>

      {/* ─── Entity Tiers ──────────────────────────────────────────────── */}
      <Section title="Entity Scaling" icon={Building2}>
        {config.entityTiers.map((et, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ flex: 1, fontSize: 10, color: T.text }}>{et.label} entities</span>
            <input type="number" value={et.multiplier} onChange={e => updateEntityTier(i, "multiplier", parseFloat(e.target.value) || 0)} step="0.05" min="1" style={smallInput} />
            <span style={{ fontSize: 9, color: T.muted }}>x</span>
          </div>
        ))}
      </Section>

      {/* ─── Channel Weights ───────────────────────────────────────────── */}
      <Section title="Channel Weights (Full Suite)" icon={Zap}>
        {!weightsBalanced && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 6, background: `${T.warn}15`, marginBottom: 6 }}>
            <AlertTriangle size={10} color={T.warn} />
            <span style={{ fontSize: 9, color: T.warn }}>Weights sum to {(channelWeightTotal * 100).toFixed(0)}% — should be 100%</span>
          </div>
        )}
        {config.channels.map((ch, i) => {
          const pct = Math.round(ch.weight * 100);
          return (
            <div key={ch.id} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <span style={{ width: 120, fontSize: 10, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ch.label}</span>
              <input type="range" min="0" max="50" step="1" value={pct} onChange={e => updateChannel(i, "weight", parseInt(e.target.value) / 100)} style={{ flex: 1, accentColor: T.accent }} />
              <span style={{ width: 30, fontSize: 10, fontWeight: 600, color: T.text, textAlign: "right" }}>{pct}%</span>
            </div>
          );
        })}
        <div style={{ fontSize: 9, color: T.muted, marginTop: 4, lineHeight: 1.5 }}>
          These weights apply when no scope preset is active (the "Full Suite" default). When a preset is selected in Customer Profile, channels outside the preset are excluded entirely and the workflow budget is re-distributed across the active channels using <strong>complexity-weighted normalization</strong> (each channel's <code>complexity</code> value ÷ total complexity of active channels).
        </div>
      </Section>

      {/* ─── Deal Defaults ─────────────────────────────────────────────── */}
      <Section title="Deal Defaults" icon={Wrench}>
        <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
          <div style={{ flex: 1 }}>
            <div style={labelStyle}>Term (yrs)</div>
            <input type="number" value={config.dealDefaults.termYears} onChange={e => update("dealDefaults.termYears", parseInt(e.target.value) || 3)} min="1" max="5" style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={labelStyle}>Escalation %</div>
            <input type="number" value={config.dealDefaults.escalation} onChange={e => update("dealDefaults.escalation", parseInt(e.target.value) || 0)} min="0" max="15" style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={labelStyle}>Max Discount %</div>
            <input type="number" value={config.dealDefaults.discount} onChange={e => update("dealDefaults.discount", parseInt(e.target.value) || 0)} min="0" max="30" style={inputStyle} />
          </div>
        </div>
      </Section>

      {/* ─── Implementation Spend Scaling ──────────────────────────────── */}
      <Section title="Implementation Spend Scaling" icon={TrendingUp}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div onClick={() => update("implSpendScaling.enabled", !(config.implSpendScaling?.enabled ?? true))} style={{ width: 32, height: 18, borderRadius: 9, background: (config.implSpendScaling?.enabled ?? true) ? T.accent : T.border, cursor: "pointer", position: "relative", transition: "background 0.15s" }}>
            <div style={{ width: 14, height: 14, borderRadius: 7, background: "#fff", position: "absolute", top: 2, left: (config.implSpendScaling?.enabled ?? true) ? 16 : 2, transition: "left 0.15s" }} />
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, color: (config.implSpendScaling?.enabled ?? true) ? T.text : T.muted }}>
            {(config.implSpendScaling?.enabled ?? true) ? "Enabled" : "Disabled"}
          </span>
        </div>
        {(config.implSpendScaling?.enabled ?? true) && (
          <>
            <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>Ref Spend ($M)</div>
                <input type="number" value={config.implSpendScaling?.refSpend ?? 750} onChange={e => update("implSpendScaling.refSpend", parseFloat(e.target.value) || 0)} step="50" style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>Exponent</div>
                <input type="number" value={config.implSpendScaling?.exponent ?? 0.5} onChange={e => update("implSpendScaling.exponent", parseFloat(e.target.value) || 0)} step="0.05" min="0.1" max="2" style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>Max Mult</div>
                <input type="number" value={config.implSpendScaling?.maxMult ?? 3.0} onChange={e => update("implSpendScaling.maxMult", parseFloat(e.target.value) || 1.0)} step="0.25" min="1.0" max="10.0" style={inputStyle} />
              </div>
            </div>
            <div className="glass-surface" style={{ borderRadius: 8, padding: "8px 10px", boxShadow: T.glass }}>
              <div style={{ fontSize: 9, color: T.muted, marginBottom: 6, fontWeight: 700, letterSpacing: 0.5 }}>SPEND SCALING CURVE PREVIEW</div>
              {[500, 750, 1000, 1500, 2000, 3000, 5000, 10000].map(s => {
                const m = calcImplSpendMultiplier(s, config);
                const pct = Math.round((m - 1) * 100);
                return (
                  <div key={s} style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: T.muted, padding: "1px 0" }}>
                    <span>${s >= 1000 ? (s/1000).toFixed(1) + "B" : s + "M"}</span>
                    <span style={{ color: m > 1.001 ? T.warn : T.muted, fontWeight: 600 }}>{m.toFixed(2)}x {pct > 0 ? `(+${pct}%)` : ""}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 9, color: T.muted, marginTop: 6, lineHeight: 1.5 }}>
              Formula: <code style={{ fontSize: 9, color: T.accent }}>clamp(min, max, (spend/refSpend)^exp)</code>. Below refSpend = 1.0x (no scaling, tier multipliers handle it). Default exp=0.5 = square root (diminishing returns).
            </div>
          </>
        )}
      </Section>

      {/* ─── Gain Share ────────────────────────────────────────────────── */}
      <Section title="Gain Share Pricing" icon={Gift}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div onClick={() => update("gainShare.enabled", !config.gainShare.enabled)} style={{ width: 36, height: 20, borderRadius: 10, background: config.gainShare.enabled ? T.accent : T.border, cursor: "pointer", position: "relative", transition: "background 0.15s" }}>
            <div style={{ width: 16, height: 16, borderRadius: 8, background: "#fff", position: "absolute", top: 2, left: config.gainShare.enabled ? 18 : 2, transition: "left 0.15s" }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: config.gainShare.enabled ? T.text : T.muted }}>
            {config.gainShare.enabled ? "Enabled" : "Disabled"}
          </span>
        </div>
        {config.gainShare.enabled && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>Gain Share %</div>
                <input type="number" value={config.gainShare.defaultPct} onChange={e => update("gainShare.defaultPct", parseFloat(e.target.value) || 0)} min="0" max="15" step="0.5" style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>Cap (x platform)</div>
                <input type="number" value={config.gainShare.cap} onChange={e => update("gainShare.cap", parseFloat(e.target.value) || 0)} min="0.5" max="5" step="0.5" style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>Reconciliation</div>
                <select value={config.gainShare.reconciliation} onChange={e => update("gainShare.reconciliation", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
            </div>
            <button onClick={() => setShowGainShareEditor(!showGainShareEditor)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 10px", color: T.muted, fontSize: 10, cursor: "pointer", width: "100%", textAlign: "left" }}>
              {showGainShareEditor ? "▾ Hide" : "▸ Show"} Gain Share Methodology
            </button>
            {showGainShareEditor && (
              <textarea value={gainShareLogic} onChange={e => setGainShareLogic(e.target.value)} rows={12} style={{ width: "100%", marginTop: 6, padding: 8, borderRadius: 6, border: `1px solid ${T.border}`, background: T.bgCard, color: T.text, fontSize: 10, fontFamily: "monospace", lineHeight: 1.5, resize: "vertical", boxSizing: "border-box", outline: "none" }} />
            )}
          </>
        )}
      </Section>
    </Card>
  );
}
