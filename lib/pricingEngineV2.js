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

/**
 * Interpolate total subscription target from spend tiers. Returns $K.
 *
 * Unit math: spendM is in $M, BPS is basis points (1/10000).
 *   fee_$ = spend_$ × BPS / 10000
 *   fee_$ = (spendM × 1,000,000) × BPS / 10000 = spendM × BPS × 100
 *   fee_$K = fee_$ / 1000 = spendM × BPS / 10
 *
 * A hard floor of $100K baseline is enforced (per config) so tiny-spend
 * deals never drop below the minimum subscription.
 */
export function interpolateTotal(spendM, cfg) {
  if (spendM <= 0) return 0;
  const tiers = cfg.spendTiers;
  const floor = cfg.baselineFloorK ?? 100; // $100K minimum
  let feeK;

  if (spendM < tiers[0].spend) {
    // Extrapolate below lowest tier at bpsBelow100M
    feeK = spendM * (cfg.bpsBelow100M / 10);
  } else {
    const last = tiers[tiers.length - 1];
    if (spendM > last.spend) {
      // Extrapolate above highest tier at bpsAbove1B marginal rate
      feeK = last.fee + (spendM - last.spend) * (cfg.bpsAbove1B / 10);
    } else {
      // Linear interpolation between tiers
      feeK = 0;
      for (let i = 0; i < tiers.length - 1; i++) {
        const lo = tiers[i], hi = tiers[i + 1];
        if (spendM >= lo.spend && spendM <= hi.spend) {
          const ratio = (spendM - lo.spend) / (hi.spend - lo.spend);
          feeK = lo.fee + ratio * (hi.fee - lo.fee);
          break;
        }
      }
    }
  }

  // Hard floor
  return Math.max(feeK, floor);
}

/**
 * Volume discount curve — power function clamped between floor and cap.
 *
 *   t = clamp(0, 1, (spend - floor) / (cap - floor))
 *   discount = maxDiscount × t^exponent
 *
 * - Below floor: discount = 0 (baseline pricing, no discount)
 * - Above cap: discount = maxDiscount (full discount)
 * - Exponent < 1 gives a concave curve (fast rise, then eases)
 *
 * @param {number} spendM - Annual spend in $M
 * @param {Object} cfg - Merged config
 * @returns {number} Fractional discount (0.0 to maxDiscount)
 */
export function volumeDiscount(spendM, cfg) {
  const vd = cfg.volumeDiscount;
  if (!vd || !vd.enabled) return 0;
  const { floor, cap, maxDiscount, exponent } = vd;
  if (spendM <= floor) return 0;
  if (spendM >= cap) return maxDiscount;
  const t = (spendM - floor) / (cap - floor);
  return maxDiscount * Math.pow(t, exponent);
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

/**
 * Estimate monthly transaction volume from spend.
 *
 * Preset-aware: if a presetId is provided and its preset defines a volumeBasis
 * { refSpend, refVolume, exponent }, uses a sublinear power curve:
 *
 *   volume(spend) = refVolume × (spend / refSpend)^exponent
 *
 * This reflects the reality that procurement transaction counts scale
 * SUBLINEARLY with spend — a $3B F500 doesn't do 6x more strategic sourcing
 * events than a $500M mid-market company; they do bigger ones. Typical
 * exponents: 0.60 for sourcing-heavy (cap out due to bandwidth), 0.75 for
 * P2P-heavy (more linear with spend volume).
 *
 * Fallback: if no preset or no volumeBasis, use the global txnVolumeTiers
 * table (Full Suite interpolation).
 */
export function estimateTxnVolume(spendM, cfg, presetId) {
  if (spendM <= 0) return 0;

  // Preset-aware power curve
  if (presetId && cfg.channelPresets) {
    const preset = cfg.channelPresets.find(p => p.id === presetId);
    if (preset?.volumeBasis) {
      const { refSpend, refVolume, exponent = 0.65 } = preset.volumeBasis;
      if (refSpend > 0 && refVolume > 0) {
        return Math.round(refVolume * Math.pow(spendM / refSpend, exponent));
      }
    }
  }

  // Fallback: legacy tier table (Full Suite)
  const tiers = cfg.txnVolumeTiers;
  if (!tiers || tiers.length === 0) return 0;
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
    activeChannelIds,    // optional: array of channel IDs to restrict weighting to (from preset)
    scopePresetId,       // optional: preset ID for preset-aware volume estimation
    actualTxnVolume,     // optional: user-provided monthly volume override
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

  // ─── 2b. User Multiplier (Platform Access only) ───────────────────────
  // Power users count 1.0x, light users count 0.2x (weighted load).
  // Ratio vs. tier default drives a soft multiplier, dampened by ^0.3
  // and clamped to ±15% so users matter but don't dominate pricing.
  const weightedUsers = pUsers * 1.0 + lUsers * 0.2;
  const weightedDefault = tierData.powerUsers * 1.0 + tierData.lightUsers * 0.2;
  const userRatioRaw = weightedDefault > 0 ? weightedUsers / weightedDefault : 1;
  const userMultiplierUnclamped = Math.pow(userRatioRaw, 0.3);
  const userMultiplier = Math.max(0.85, Math.min(1.15, userMultiplierUnclamped));
  if (powerUsers != null || lightUsers != null) {
    const pctDelta = Math.round((userMultiplier - 1) * 100);
    if (pctDelta !== 0) confirmed.push(`User multiplier: ${userMultiplier.toFixed(2)}x (${pctDelta > 0 ? "+" : ""}${pctDelta}% on platform access)`);
  }

  // ─── 3. Entities ──────────────────────────────────────────────────────
  const entities = entityCount ?? tierData.entities;
  const entityMult = getEntityMultiplier(entities, cfg);
  if (entityCount == null) assumptions.push(`Entities: ${entities} (${tierData.label} default, ${entityMult}x)`);
  else confirmed.push(`Entities: ${entities} (${entityMult}x)`);

  // ─── 4. Total Subscription Target (from spend tiers) ──────────────────
  const totalBaseK = interpolateTotal(annualSpendM, cfg);
  const productMult = getProductMultiplier(selectedProducts, cfg);
  const totalTargetK = totalBaseK * productMult * entityMult;
  const baselineTotal = Math.round(totalTargetK * 1000); // in dollars, pre-user-multiplier

  confirmed.push(`Spend: $${annualSpendM}M`);
  confirmed.push(`Products: ${selectedProducts.map(p => cfg.products[p]?.label).filter(Boolean).join(", ")} (${productMult.toFixed(2)}x)`);

  // ─── 4b. Transaction Volume Estimate (preset-aware) ──────────────────
  // Uses the active preset's volumeBasis power curve if available, else
  // falls back to the global txnVolumeTiers table. If the user provided
  // an actualTxnVolume override, we use that and derive a multiplier.
  const expectedTxnMonth = estimateTxnVolume(annualSpendM, cfg, scopePresetId);
  const actualTxnMonthResolved = actualTxnVolume != null && actualTxnVolume > 0
    ? Math.round(actualTxnVolume)
    : expectedTxnMonth;
  const totalTxnMonth = actualTxnMonthResolved;

  // ─── 4c. Volume Multiplier (Workflow Fees only) ───────────────────────
  // Dampened multiplier that scales workflow fees up/down based on actual
  // vs. expected monthly volume. Uses ^0.3 dampening (aggressive — a 10x
  // volume swing produces ~2x multiplier, not 10x) because the cost to
  // serve doesn't scale linearly with transaction count.
  //
  // Clamp range: 0.85x (lower) to 2.0x (upper). Heavy-volume clients can
  // pay up to 2x the baseline workflow fee but never more. Light-volume
  // clients get up to -15% discount.
  //
  // With ^0.3 dampening and a 2.0 cap, the upper clamp kicks in at
  // ~10x expected volume (2.0 = 10^0.3 ≈ 1.995).
  //
  // Only applies when actualTxnVolume is explicitly provided.
  const volumeMultMin = 0.85;
  const volumeMultMax = 2.00;
  const volumeExponent = 0.30;
  let volumeMultiplier = 1.0;
  let volumeRatioRaw = 1.0;
  if (actualTxnVolume != null && actualTxnVolume > 0 && expectedTxnMonth > 0) {
    volumeRatioRaw = actualTxnVolume / expectedTxnMonth;
    const unclamped = Math.pow(volumeRatioRaw, volumeExponent);
    volumeMultiplier = Math.max(volumeMultMin, Math.min(volumeMultMax, unclamped));
    const pctDelta = Math.round((volumeMultiplier - 1) * 100);
    if (pctDelta !== 0) confirmed.push(`Volume multiplier: ${volumeMultiplier.toFixed(2)}x (${pctDelta > 0 ? "+" : ""}${pctDelta}% on workflow fees, ${actualTxnVolume.toLocaleString()} vs ~${expectedTxnMonth.toLocaleString()} expected/mo)`);
  } else {
    assumptions.push(`Expected txn volume: ~${expectedTxnMonth.toLocaleString()}/mo (${scopePresetId ? "preset curve" : "full-suite tiers"})`);
  }

  // ─── 4d. Volume Discount (Spend-Driven, Applied to Baseline) ──────────
  // The auto volume discount is applied to the baseline total BEFORE the
  // platform/workflow split. This ensures Platform Access + Workflow Fees
  // always sum to the post-discount subscription, so the UI breakdown is
  // internally consistent. The discount amount is still shown separately
  // in the Summary and Breakdown tabs as a savings indicator.
  const volumeDiscountPct = volumeDiscount(annualSpendM, cfg);
  const volumeDiscountAmount = Math.round(baselineTotal * volumeDiscountPct);
  const netBaseline = baselineTotal - volumeDiscountAmount;
  if (volumeDiscountPct > 0) {
    const pct = Math.round(volumeDiscountPct * 1000) / 10;
    confirmed.push(`Volume discount: ${pct}% auto-applied (-$${Math.round(volumeDiscountAmount / 1000)}K)`);
  }

  // ─── 5. Platform / Workflow Split (applied to NET baseline) ───────────
  // Both components now reflect post-volume-discount values. User mult
  // still scales platform access; volume mult still scales workflow fees.
  const { platformPct, workflowPct } = cfg.feeStructure;
  const platformAccessBase = Math.round(netBaseline * platformPct);
  const platformAccess = Math.round(platformAccessBase * userMultiplier);
  const workflowBudgetBase = Math.round(netBaseline * workflowPct);
  const workflowBudget = Math.round(workflowBudgetBase * volumeMultiplier);
  const totalTarget = platformAccess + workflowBudget;

  // ─── 6. Channel Breakdown ─────────────────────────────────────────────

  // Determine the active channel set and their weights.
  // If activeChannelIds is provided (from a preset), only those channels receive
  // any workflow budget allocation. Weights within the active set are derived
  // from channel.complexity (normalized to sum to 1.0 across active channels).
  // If no preset is active, all channels use their manual weights from config.
  const hasActivePreset = Array.isArray(activeChannelIds) && activeChannelIds.length > 0;
  let activeWeights = {};
  if (hasActivePreset) {
    const activeSet = cfg.channels.filter(c => activeChannelIds.includes(c.id));
    const totalComplexity = activeSet.reduce((s, c) => s + (c.complexity || 1), 0);
    if (totalComplexity > 0) {
      activeSet.forEach(c => { activeWeights[c.id] = (c.complexity || 1) / totalComplexity; });
    } else {
      // Fallback: equal weights if complexity is zero everywhere
      activeSet.forEach(c => { activeWeights[c.id] = 1 / activeSet.length; });
    }
    assumptions.push(`Active channels: ${activeSet.map(c => c.label).join(", ")} (complexity-weighted)`);
  } else {
    cfg.channels.forEach(c => { activeWeights[c.id] = c.weight; });
  }

  // For preset mode, when deriving default txn volumes, normalize txn shares
  // across the active channels only (so the total monthly volume is preserved).
  const totalActiveTxnPct = hasActivePreset
    ? cfg.channels.filter(c => activeChannelIds.includes(c.id)).reduce((s, c) => s + (c.defaultTxnPct || 0), 0)
    : 1;

  let channelBreakdown;
  if (channelVolumes && Object.keys(channelVolumes).length > 0) {
    // User provided volumes — derive per-txn from workflow budget × active weight
    channelBreakdown = cfg.channels.map(ch => {
      const isActive = hasActivePreset ? activeChannelIds.includes(ch.id) : true;
      if (!isActive) {
        return { ...ch, volume: 0, perTxn: 0, annualCost: 0, assumed: false, inactive: true };
      }
      const vol = channelVolumes[ch.id] || 0;
      const weight = activeWeights[ch.id] || 0;
      const budgetShare = Math.round(workflowBudget * weight);
      const perTxn = vol > 0 ? Math.round(budgetShare / (vol * 12) * 100) / 100 : 0;
      return { ...ch, volume: vol, perTxn, annualCost: budgetShare, assumed: false, inactive: false };
    });
    confirmed.push("Channel volumes provided by user");
  } else {
    // Derive volumes from spend, derive per-txn from budget
    channelBreakdown = cfg.channels.map(ch => {
      const isActive = hasActivePreset ? activeChannelIds.includes(ch.id) : true;
      if (!isActive) {
        return { ...ch, volume: 0, perTxn: 0, annualCost: 0, assumed: true, inactive: true };
      }
      // Normalize the default txn % across active channels so volume is preserved
      const txnShare = hasActivePreset && totalActiveTxnPct > 0
        ? (ch.defaultTxnPct || 0) / totalActiveTxnPct
        : (ch.defaultTxnPct || 0);
      const vol = Math.round(totalTxnMonth * txnShare);
      const weight = activeWeights[ch.id] || 0;
      const budgetShare = Math.round(workflowBudget * weight);
      const perTxn = vol > 0 ? Math.round(budgetShare / (vol * 12) * 100) / 100 : 0;
      return { ...ch, volume: vol, perTxn, annualCost: budgetShare, assumed: true, inactive: false };
    });
    if (!hasActivePreset) assumptions.push("Channel distribution: standard industry split (Full Suite)");
  }

  const workflowFeesAnnual = channelBreakdown.reduce((s, ch) => s + ch.annualCost, 0);

  // ─── 7. Integrations ─────────────────────────────────────────────────
  const integrations = selectedIntegrations ?? cfg.integrations.filter(i => i.standard).map(i => i.id);
  const integrationFees = calcIntegrationFees(integrations, cfg);
  if (!selectedIntegrations) assumptions.push("Standard integrations assumed (ERP + ServiceNow + SSO)");
  else confirmed.push(`Integrations: ${integrations.map(id => cfg.integrations.find(i => i.id === id)?.label).join(", ")}`);

  // ─── 8. Gross Subscription ────────────────────────────────────────────
  // totalTarget is already post-volume-discount (discount was applied to
  // the baseline before the platform/workflow split). Integration fees
  // are additive and NOT subject to the volume discount.
  const y1Subscription = totalTarget + integrationFees;

  // ─── 10. Deal Parameters (Manual Discount Slider) ─────────────────────
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
    // Cap is based on post-volume-discount subscription (what the client actually pays)
    const cap = Math.round(totalTarget * gs.cap);
    if (gainShareFee > cap) gainShareFee = cap;
    gainShareNote = `Gain share: ${gs.defaultPct}% of est. savings ($${(estimatedSavings / 1000).toFixed(0)}K), capped at ${gs.cap}x subscription = $${(cap / 1000).toFixed(0)}K`;
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
    userMultiplier,
    userMultiplierUnclamped,
    volumeMultiplier,
    volumeRatioRaw,
    expectedTxnMonth,
    actualTxnProvided: actualTxnVolume != null && actualTxnVolume > 0,
    selectedProducts,

    // Fee structure
    feeStructure: cfg.feeStructure,
    totalTarget,
    platformAccessBase,
    platformAccess,
    workflowBudgetBase,
    workflowBudget,
    subscriptionComposition,

    // Volume discount
    volumeDiscountConfig: cfg.volumeDiscount,
    volumeDiscountPct,
    volumeDiscountAmount,
    baselineTotal,           // pre-volume-discount baseline (list price)
    netBaseline,             // post-volume-discount baseline, pre-multipliers
    // NOTE: totalTarget (above) is now the final post-discount, post-multiplier
    // subscription amount (before integrations). Platform Access + Workflow Fees = totalTarget.

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
