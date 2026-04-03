/**
 * Aerchain Pricing Engine v2 — Unified Platform + Workflow Model
 *
 * Key difference from v1: Platform Access Fee and Workflow Fees are two
 * components of ONE total subscription, split by a configurable ratio
 * (default 45/55). Per-transaction prices are DERIVED from the workflow
 * budget, not independently set. This guarantees the two systems always
 * add up to the spend-tier-based total.
 *
 * All functions are pure, deterministic, and config-driven.
 */

import defaultConfig from "../pricing-calculator-v2/default-config.json";

// ═══════════════════════════════════════════════════════════════════════════
// CONFIG HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/** Deep-merge user config over defaults. */
export function mergeConfig(userConfig) {
  if (!userConfig) return { ...defaultConfig };
  return {
    ...defaultConfig,
    ...userConfig,
    feeStructure: { ...defaultConfig.feeStructure, ...userConfig.feeStructure },
    dealDefaults: { ...defaultConfig.dealDefaults, ...userConfig.dealDefaults },
    gainShare: { ...defaultConfig.gainShare, ...userConfig.gainShare },
  };
}

export { defaultConfig };

// ═══════════════════════════════════════════════════════════════════════════
// INTERPOLATION & CLASSIFICATION
// ═══════════════════════════════════════════════════════════════════════════

/** Interpolate total subscription target from spend tiers. Returns $K. */
export function interpolateTotal(spendM, cfg) {
  const tiers = cfg.spendTiers;
  if (spendM <= 0) return 0;

  if (spendM < tiers[0].spend) {
    return spendM * (cfg.bpsBelow100M / 1000);
  }

  const last = tiers[tiers.length - 1];
  if (spendM > last.spend) {
    return last.fee + (spendM - last.spend) * (cfg.bpsAbove1B / 1000);
  }

  for (let i = 0; i < tiers.length - 1; i++) {
    const lo = tiers[i], hi = tiers[i + 1];
    if (spendM >= lo.spend && spendM <= hi.spend) {
      const ratio = (spendM - lo.spend) / (hi.spend - lo.spend);
      return lo.fee + ratio * (hi.fee - lo.fee);
    }
  }
  return 0;
}

/** Classify client tier from spend. */
export function classifyTier(spendM, cfg) {
  const tiers = cfg.clientTiers;
  if (spendM >= 750) return "large-enterprise";
  if (spendM >= 250) return "enterprise";
  return "mid-market";
}

/** Get entity multiplier. */
export function getEntityMultiplier(entityCount, cfg) {
  for (const tier of cfg.entityTiers) {
    if (entityCount >= tier.min && entityCount <= tier.max) return tier.multiplier;
  }
  return cfg.entityTiers[cfg.entityTiers.length - 1].multiplier;
}

/** Combined product multiplier. */
export function getProductMultiplier(selectedProducts, cfg) {
  let m = 0;
  for (const pid of selectedProducts) {
    const p = cfg.products[pid];
    if (p) m += p.multiplier;
  }
  return Math.max(m, 1);
}

/** Estimate monthly transaction volume from spend. */
export function estimateTxnVolume(spendM, cfg) {
  const tiers = cfg.txnVolumeTiers;
  if (spendM <= 0) return 0;
  if (spendM <= tiers[0].spend) return Math.round(tiers[0].txnPerMonth * (spendM / tiers[0].spend));
  const last = tiers[tiers.length - 1];
  if (spendM >= last.spend) return Math.round(last.txnPerMonth * (spendM / last.spend));
  for (let i = 0; i < tiers.length - 1; i++) {
    if (spendM >= tiers[i].spend && spendM <= tiers[i + 1].spend) {
      const ratio = (spendM - tiers[i].spend) / (tiers[i + 1].spend - tiers[i].spend);
      return Math.round(tiers[i].txnPerMonth + ratio * (tiers[i + 1].txnPerMonth - tiers[i].txnPerMonth));
    }
  }
  return 0;
}

// ═══════════════════════════════════════════════════════════════════════════
// IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════

/** Calculate implementation section raw cost. */
export function calcImplSectionRaw(sectionKey, cfg) {
  const sec = cfg.implSections[sectionKey];
  if (!sec) return 0;
  return sec.roles.reduce((sum, r) => sum + r.hc * r.rate * r.months, 0);
}

/** Full implementation cost with tier multiplier and toggles. */
export function calcImplementation(tierKey, sectionToggles, cfg) {
  const tier = cfg.clientTiers[tierKey] || cfg.clientTiers["large-enterprise"];
  let total = 0;
  for (const [key, sec] of Object.entries(cfg.implSections)) {
    const isOn = sec.alwaysOn || sectionToggles[key] !== false;
    if (isOn) total += calcImplSectionRaw(key, cfg);
  }
  return Math.round(total * tier.implMultiplier);
}

/** Integration annual fees. */
export function calcIntegrationFees(selectedIds, cfg) {
  return selectedIds.reduce((sum, id) => {
    const integ = cfg.integrations.find(i => i.id === id);
    return sum + (integ ? integ.annualFee : 0);
  }, 0);
}

/** Add-on services total. */
export function calcAddOns(selectedAddOns, cfg) {
  return selectedAddOns.reduce((sum, sel) => {
    const a = cfg.addOns.find(x => x.id === sel.id);
    return sum + (a ? a.price * (sel.qty || 1) : 0);
  }, 0);
}

// ═══════════════════════════════════════════════════════════════════════════
// MASTER CALCULATION — Unified Platform + Workflow
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate complete pricing from inputs + config.
 *
 * The key unification: totalSubscription is derived from spend tiers,
 * then SPLIT into platformAccess and workflowFees. Per-txn prices are
 * back-derived from the workflow budget.
 */
export function calculatePricingV2(inputs, userConfig) {
  const cfg = mergeConfig(userConfig);
  const {
    customerName = "",
    annualSpendM = 0,
    selectedProducts = ["intake-to-award"],
    tierOverride,
    powerUsers,
    lightUsers,
    entityCount,
    channelVolumes,
    selectedIntegrations,
    implToggles = {},
    addOns = [],
    dealParams = {},
    gainShareOverride,
  } = inputs;

  const assumptions = [];
  const confirmed = [];

  // ─── 1. Tier ──────────────────────────────────────────────────────────
  let tier;
  if (tierOverride) {
    tier = tierOverride;
    confirmed.push(`Client tier: ${cfg.clientTiers[tier]?.label} (manually selected)`);
  } else {
    tier = classifyTier(annualSpendM, cfg);
    assumptions.push(`Client tier: "${cfg.clientTiers[tier]?.label}" (auto from $${annualSpendM}M spend)`);
  }
  const tierData = cfg.clientTiers[tier];

  // ─── 2. Users ─────────────────────────────────────────────────────────
  const pUsers = powerUsers ?? tierData.powerUsers;
  const lUsers = lightUsers ?? tierData.lightUsers;
  if (powerUsers == null) assumptions.push(`Power users: ${pUsers} (${tierData.label} default)`);
  else confirmed.push(`Power users: ${pUsers}`);
  if (lightUsers == null) assumptions.push(`Light users: ${lUsers} (${tierData.label} default)`);
  else confirmed.push(`Light users: ${lUsers}`);

  // ─── 3. Entities ──────────────────────────────────────────────────────
  const entities = entityCount ?? tierData.entities;
  const entityMult = getEntityMultiplier(entities, cfg);
  if (entityCount == null) assumptions.push(`Entities: ${entities} (${tierData.label} default, ${entityMult}x)`);
  else confirmed.push(`Entities: ${entities} (${entityMult}x)`);

  // ─── 4. Total Subscription Target (from spend tiers) ──────────────────
  const totalBaseK = interpolateTotal(annualSpendM, cfg);
  const productMult = getProductMultiplier(selectedProducts, cfg);
  const totalTargetK = totalBaseK * productMult * entityMult;
  const totalTarget = Math.round(totalTargetK * 1000); // in dollars

  confirmed.push(`Spend: $${annualSpendM}M`);
  confirmed.push(`Products: ${selectedProducts.map(p => cfg.products[p]?.label).filter(Boolean).join(", ")} (${productMult.toFixed(2)}x)`);

  // ─── 5. Platform / Workflow Split ─────────────────────────────────────
  const { platformPct, workflowPct } = cfg.feeStructure;
  const platformAccess = Math.round(totalTarget * platformPct);
  const workflowBudget = Math.round(totalTarget * workflowPct);

  // ─── 6. Transaction Volumes & Channel Breakdown ───────────────────────
  const totalTxnMonth = estimateTxnVolume(annualSpendM, cfg);
  let channelBreakdown;

  if (channelVolumes && Object.keys(channelVolumes).length > 0) {
    // User provided volumes — derive per-txn from workflow budget × weight
    channelBreakdown = cfg.channels.map(ch => {
      const vol = channelVolumes[ch.id] || 0;
      const budgetShare = Math.round(workflowBudget * ch.weight);
      const perTxn = vol > 0 ? Math.round(budgetShare / (vol * 12) * 100) / 100 : 0;
      return { ...ch, volume: vol, perTxn, annualCost: budgetShare, assumed: false };
    });
    confirmed.push("Channel volumes provided by user");
  } else {
    // Derive volumes from spend, derive per-txn from budget
    channelBreakdown = cfg.channels.map(ch => {
      const vol = Math.round(totalTxnMonth * ch.defaultTxnPct);
      const budgetShare = Math.round(workflowBudget * ch.weight);
      const perTxn = vol > 0 ? Math.round(budgetShare / (vol * 12) * 100) / 100 : 0;
      return { ...ch, volume: vol, perTxn, annualCost: budgetShare, assumed: true };
    });
    assumptions.push(`Txn volume: ~${totalTxnMonth.toLocaleString()}/mo (~${(totalTxnMonth * 12).toLocaleString()}/yr)`);
    assumptions.push("Channel distribution: standard industry split");
  }

  const workflowFeesAnnual = channelBreakdown.reduce((s, ch) => s + ch.annualCost, 0);

  // ─── 7. Integrations ─────────────────────────────────────────────────
  const integrations = selectedIntegrations ?? cfg.integrations.filter(i => i.standard).map(i => i.id);
  const integrationFees = calcIntegrationFees(integrations, cfg);
  if (!selectedIntegrations) assumptions.push("Standard integrations assumed (SAP + SSO)");
  else confirmed.push(`Integrations: ${integrations.map(id => cfg.integrations.find(i => i.id === id)?.label).join(", ")}`);

  // ─── 8. Gross Subscription ────────────────────────────────────────────
  const y1Subscription = totalTarget + integrationFees;

  // ─── 9. Deal Parameters ──────────────────────────────────────────────
  const dp = { ...cfg.dealDefaults, ...dealParams };
  if (Object.keys(dealParams).length === 0) {
    assumptions.push(`Deal terms: ${dp.termYears}yr, ${dp.escalation}% escalation, 0% discount`);
  }
  const y1SubDiscounted = Math.round(y1Subscription * (1 - dp.discount / 100));

  // ─── 10. Implementation ──────────────────────────────────────────────
  const implCost = calcImplementation(tier, implToggles, cfg);
  const addOnCost = calcAddOns(addOns, cfg);
  const totalImpl = implCost + addOnCost;

  // ─── 11. Gain Share ──────────────────────────────────────────────────
  const gs = { ...cfg.gainShare, ...gainShareOverride };
  let gainShareFee = 0;
  let gainShareNote = null;
  if (gs.enabled) {
    // Placeholder: estimated savings = 8% of spend (conservative)
    const estimatedSavings = annualSpendM * 1000000 * 0.08;
    gainShareFee = Math.round(estimatedSavings * (gs.defaultPct / 100));
    const cap = Math.round(totalTarget * gs.cap);
    if (gainShareFee > cap) gainShareFee = cap;
    gainShareNote = `Gain share: ${gs.defaultPct}% of est. savings ($${(estimatedSavings / 1000).toFixed(0)}K), capped at ${gs.cap}x platform = $${(cap / 1000).toFixed(0)}K`;
    assumptions.push(gainShareNote);
  }

  // ─── 12. Y1 Total ────────────────────────────────────────────────────
  const y1Total = y1SubDiscounted + totalImpl + gainShareFee;

  // ─── 13. TCO ─────────────────────────────────────────────────────────
  const years = [];
  for (let y = 1; y <= Math.max(dp.termYears, 5); y++) {
    const sub = y === 1
      ? y1SubDiscounted
      : Math.round(years[y - 2].subscription * (1 + dp.escalation / 100));
    const impl = y === 1 ? totalImpl : 0;
    const gsY = gs.enabled ? (y === 1 ? gainShareFee : Math.round(gainShareFee * Math.pow(1 + dp.escalation / 100, y - 1))) : 0;
    years.push({ year: y, subscription: sub, implementation: impl, gainShare: gsY, total: sub + impl + gsY });
  }
  const tco3 = years.slice(0, 3).reduce((s, y) => s + y.total, 0);
  const tco5 = years.slice(0, 5).reduce((s, y) => s + y.total, 0);

  // ─── 14. Metrics ─────────────────────────────────────────────────────
  const totalTxnYear = totalTxnMonth * 12;
  const bps = annualSpendM > 0 ? Math.round((y1SubDiscounted / (annualSpendM * 1000000)) * 10000 * 10) / 10 : 0;

  // ─── 15. Composition ─────────────────────────────────────────────────
  const subscriptionComposition = {
    platformAccess,
    workflowFees: workflowFeesAnnual,
    integrations: integrationFees,
    total: y1Subscription,
    discounted: y1SubDiscounted,
  };

  return {
    customerName,
    annualSpendM,
    tier,
    tierLabel: tierData.label,
    implDuration: tierData.implDuration,
    powerUsers: pUsers,
    lightUsers: lUsers,
    entityCount: entities,

    productMultiplier: productMult,
    entityMultiplier: entityMult,
    selectedProducts,

    // Fee structure
    feeStructure: cfg.feeStructure,
    totalTarget,
    platformAccess,
    workflowBudget,
    subscriptionComposition,

    // Workflows
    totalTxnMonth,
    totalTxnYear,
    channelBreakdown,
    workflowFeesAnnual,

    // Integrations
    integrations,
    integrationFees,

    // Subscription
    y1Subscription,
    y1SubDiscounted,

    // Implementation
    implCost,
    addOnCost,
    totalImpl,
    implToggles,

    // Gain Share
    gainShare: gs,
    gainShareFee,
    gainShareNote,

    // Deal
    dealParams: dp,
    y1Total,

    // TCO
    years,
    tco3,
    tco5,

    // Metrics
    bps,

    // Tracking
    assumptions,
    confirmed,

    // Config reference
    config: cfg,
  };
}
