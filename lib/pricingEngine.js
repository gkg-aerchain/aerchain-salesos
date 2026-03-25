/**
 * Aerchain Pricing Engine v1.0
 *
 * Pure calculation engine — derives all pricing from inputs + pricing-logic.md rules.
 * No side effects, no API calls. All functions are deterministic.
 */

// ─── Spend Tier Table (from pricing-logic.md §1) ───────────────────────────
const SPEND_TIERS = [
  { spend: 100,  fee: 100  },  // $100M → $100K
  { spend: 250,  fee: 225  },  // $250M → $225K
  { spend: 500,  fee: 400  },  // $500M → $400K
  { spend: 750,  fee: 575  },  // $750M → $575K
  { spend: 1000, fee: 750  },  // $1B   → $750K
];
const MARGINAL_BPS_ABOVE_1B = 7.0;
const BPS_BELOW_100M = 10.0;

// ─── Product Multipliers (§2) ──────────────────────────────────────────────
export const PRODUCTS = {
  "intake-to-award":  { label: "Intake to Award",  sub: "Autonomous & Strategic Sourcing", multiplier: 1.00, base: true },
  "procure-to-pay":   { label: "Procure to Pay",   sub: "PO, Invoice, Payments",           multiplier: 0.75 },
  "spend-insights":   { label: "Spend Insights",   sub: "Analytics & Intelligence",        multiplier: 0.40 },
};

// ─── Entity Multipliers (§3) ───────────────────────────────────────────────
export const ENTITY_TIERS = [
  { label: "1",    min: 1,  max: 1,   multiplier: 1.00 },
  { label: "2-3",  min: 2,  max: 3,   multiplier: 1.15 },
  { label: "4-10", min: 4,  max: 10,  multiplier: 1.30 },
  { label: "10+",  min: 11, max: 999, multiplier: 1.50 },
];

// ─── Client Tiers (§4) ────────────────────────────────────────────────────
export const CLIENT_TIERS = {
  "mid-market":       { label: "Mid-Market",        minSpend: 0,   maxSpend: 250,  powerUsers: 10,  lightUsers: 50,   entities: 1,   implMultiplier: 0.60, implDuration: "3-4 months" },
  "enterprise":       { label: "Enterprise",        minSpend: 250, maxSpend: 750,  powerUsers: 25,  lightUsers: 150,  entities: 2,   implMultiplier: 0.85, implDuration: "4-6 months" },
  "large-enterprise": { label: "Large Enterprise",  minSpend: 750, maxSpend: 99999, powerUsers: 40, lightUsers: 350,  entities: 11,  implMultiplier: 1.00, implDuration: "6-8 months" },
};

// ─── Workflow Channels (§5) ────────────────────────────────────────────────
export const CHANNELS = [
  { id: "catalog",        label: "Catalog",               code: "CAT",  complexity: 2,  defaultTxnPct: 0.30, defaultSpendPct: 0.06 },
  { id: "self-service-po", label: "Self-Service PO",      code: "SSPO", complexity: 3,  defaultTxnPct: 0.10, defaultSpendPct: 0.02 },
  { id: "contract-fw",    label: "Contract Framework",    code: "CF",   complexity: 8,  defaultTxnPct: 0.05, defaultSpendPct: 0.03 },
  { id: "rc-invoice",     label: "RC Invoice",            code: "RCI",  complexity: 4,  defaultTxnPct: 0.05, defaultSpendPct: 0.04 },
  { id: "non-po-spend",   label: "Non-PO Spend",          code: "NPS",  complexity: 4,  defaultTxnPct: 0.05, defaultSpendPct: 0.01 },
  { id: "auto-sourcing",  label: "Autonomous Sourcing",   code: "AS",   complexity: 21, defaultTxnPct: 0.20, defaultSpendPct: 0.15 },
  { id: "auto-negotiation", label: "Autonomous Negotiation", code: "AN", complexity: 15, defaultTxnPct: 0.05, defaultSpendPct: 0.09 },
  { id: "tactical",       label: "Tactical Sourcing",     code: "TS",   complexity: 28, defaultTxnPct: 0.15, defaultSpendPct: 0.23 },
  { id: "strategic",      label: "Strategic Sourcing",    code: "SS",   complexity: 33, defaultTxnPct: 0.05, defaultSpendPct: 0.37 },
];

// Per-transaction pricing by volume tier (§5.2)
// Index matches CHANNELS order above
const TXN_PRICING = [
  // [≤1000, 1001-2500, 2501-5000, 5001-10000, 10000+]
  [5,    4,    3,    2.5,  2   ],  // Catalog
  [7,    6,    5,    4,    3   ],  // Self-Service PO
  [9,    7,    6,    5,    4   ],  // Contract Framework
  [7,    6,    5,    4,    3   ],  // RC Invoice
  [7,    6,    5,    4,    3   ],  // Non-PO Spend
  [48,   38,   29,   24,   19  ],  // Autonomous Sourcing
  [49,   39,   30,   25,   20  ],  // Autonomous Negotiation
  [78,   62,   47,   39,   31  ],  // Tactical Sourcing
  [157,  126,  94,   78,   63  ],  // Strategic Sourcing
];

const VOLUME_TIERS = [1000, 2500, 5000, 10000];

// Transaction volume estimation from spend (§5.3)
const TXN_VOLUME_TIERS = [
  { spend: 100,  txnPerMonth: 1000  },
  { spend: 250,  txnPerMonth: 2500  },
  { spend: 500,  txnPerMonth: 5500  },
  { spend: 750,  txnPerMonth: 7000  },
  { spend: 1000, txnPerMonth: 10000 },
];

// ─── Implementation Rate Card (§8) ────────────────────────────────────────
export const IMPL_SECTIONS = {
  core: {
    label: "Core Implementation",
    description: "Advisory, blueprint, and core product configuration",
    alwaysOn: true,
    roles: [
      { code: "SA",  title: "Solution Architect",        hc: 1, rate: 24000, months: 1,   phases: ["Advisory"] },
      { code: "PCL", title: "PC Team Lead",              hc: 1, rate: 9000,  months: 3,   phases: ["Build"] },
      { code: "PjM", title: "Project Manager",           hc: 1, rate: 9000,  months: 6,   phases: ["Full Project"] },
      { code: "PC",  title: "Product Consultant",        hc: 1, rate: 9000,  months: 5,   phases: ["Advisory", "Build"] },
      { code: "APC", title: "Assoc. Product Consultant", hc: 2, rate: 8000,  months: 6,   phases: ["Advisory", "Build", "Validation"] },
    ],
  },
  productDev: {
    label: "Product Dev & Innovation",
    description: "Custom development, AI models, and platform extensions",
    alwaysOn: false,
    isTnM: true,
    roles: [
      { code: "AIL", title: "AI Lead",        hc: 1, rate: 14000, months: 4, phases: ["Dev"] },
      { code: "AIE", title: "AI Engineer",    hc: 1, rate: 10000, months: 4, phases: ["Dev"] },
      { code: "PM",  title: "Project Manager", hc: 1, rate: 9000,  months: 4, phases: ["Dev"] },
      { code: "UX",  title: "UX Designer",    hc: 1, rate: 7000,  months: 4, phases: ["Dev"] },
      { code: "ETL", title: "ETL Developer",  hc: 1, rate: 7000,  months: 4, phases: ["Dev"] },
      { code: "DEV", title: "Developer",      hc: 7, rate: 7000,  months: 4, phases: ["Dev"] },
    ],
  },
  integrations: {
    label: "Integrations",
    description: "ERP and system integration setup",
    alwaysOn: false,
    defaultOn: true,
    roles: [
      { code: "INL", title: "Integration Lead",     hc: 1, rate: 9000, months: 2, phases: ["Build"] },
      { code: "INE", title: "Integration Engineer",  hc: 1, rate: 9000, months: 2, phases: ["Build"] },
    ],
  },
  qa: {
    label: "QA & Validation",
    description: "UAT, SAT, and integration testing",
    alwaysOn: false,
    defaultOn: true,
    roles: [
      { code: "QA", title: "QA Lead",     hc: 1, rate: 9000, months: 1.5, phases: ["Validation"] },
      { code: "QE", title: "QA Engineer", hc: 2, rate: 7000, months: 1.5, phases: ["Validation"] },
    ],
  },
  customerSuccess: {
    label: "Customer Success",
    description: "Post-launch support and hypercare",
    alwaysOn: false,
    defaultOn: true,
    roles: [
      { code: "CSM", title: "Customer Success Manager", hc: 1, rate: 8000, months: 3, phases: ["Hypercare"] },
      { code: "SS",  title: "Support Specialist",       hc: 2, rate: 4000, months: 3, phases: ["Hypercare"] },
      { code: "SE",  title: "Support Engineer",          hc: 2, rate: 7000, months: 3, phases: ["Hypercare"] },
    ],
  },
};

// ─── Add-On Services (§9) ─────────────────────────────────────────────────
export const ADD_ONS = [
  { id: "onsite",        label: "On-Site Deployment",           price: 12000, unit: "per person/month" },
  { id: "custom-fields", label: "Additional Custom Fields",     price: 5000,  unit: "per field" },
  { id: "extra-integ",   label: "Additional Integration",       price: 18000, unit: "per integration" },
  { id: "ext-hypercare", label: "Extended Hypercare",           price: 28000, unit: "per month" },
  { id: "training",      label: "Additional Training Sessions", price: 5000,  unit: "per session" },
  { id: "data-migration", label: "Data Migration",              price: 15000, unit: "per source" },
  { id: "change-request", label: "Change Request (Scope Addition)", price: 10000, unit: "per CR" },
  { id: "travel",        label: "Travel & Expenses",            price: 0,     unit: "actuals" },
];

// ─── Integration Options (§7) ─────────────────────────────────────────────
export const INTEGRATIONS = [
  { id: "sap",        label: "SAP S/4HANA",    standard: true,  annualFee: 0 },
  { id: "oracle",     label: "Oracle Fusion",   standard: true,  annualFee: 0 },
  { id: "servicenow", label: "ServiceNow",      standard: true,  annualFee: 0 },
  { id: "netsuite",   label: "NetSuite",        standard: false, annualFee: 18000 },
  { id: "coupa",      label: "Coupa",           standard: false, annualFee: 18000 },
  { id: "docusign",   label: "DocuSign / CLM",  standard: false, annualFee: 18000 },
  { id: "sso",        label: "SSO / SCIM",      standard: true,  annualFee: 0 },
  { id: "custom-api", label: "Custom API",      standard: false, annualFee: 18000 },
];

// ─── Default Deal Parameters (§10) ────────────────────────────────────────
export const DEAL_DEFAULTS = {
  discount: 0,        // 0-30%
  termYears: 3,       // 1-5
  escalation: 10,     // 0-15%
  abandonRate: 5,     // 0-15%
};


// ═══════════════════════════════════════════════════════════════════════════
// CALCULATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Interpolate platform base fee from spend (in $M).
 * Returns fee in $K.
 */
export function interpolateBaseFee(spendM) {
  if (spendM <= 0) return 0;

  // Below lowest tier — extrapolate at 10 BPS
  if (spendM < SPEND_TIERS[0].spend) {
    return spendM * (BPS_BELOW_100M / 1000); // BPS to $K ratio
  }

  // Above highest tier — extrapolate at marginal rate
  const last = SPEND_TIERS[SPEND_TIERS.length - 1];
  if (spendM > last.spend) {
    const excess = spendM - last.spend;
    return last.fee + excess * (MARGINAL_BPS_ABOVE_1B / 1000);
  }

  // Between tiers — linear interpolation
  for (let i = 0; i < SPEND_TIERS.length - 1; i++) {
    const lo = SPEND_TIERS[i];
    const hi = SPEND_TIERS[i + 1];
    if (spendM >= lo.spend && spendM <= hi.spend) {
      const ratio = (spendM - lo.spend) / (hi.spend - lo.spend);
      return lo.fee + ratio * (hi.fee - lo.fee);
    }
  }

  return 0;
}

/**
 * Determine client tier from spend ($M).
 */
export function classifyTier(spendM) {
  if (spendM >= 750) return "large-enterprise";
  if (spendM >= 250) return "enterprise";
  return "mid-market";
}

/**
 * Get entity multiplier from entity count.
 */
export function getEntityMultiplier(entityCount) {
  for (const tier of ENTITY_TIERS) {
    if (entityCount >= tier.min && entityCount <= tier.max) return tier.multiplier;
  }
  return ENTITY_TIERS[ENTITY_TIERS.length - 1].multiplier;
}

/**
 * Calculate combined product multiplier from selected product IDs.
 */
export function getProductMultiplier(selectedProducts) {
  let m = 0;
  for (const pid of selectedProducts) {
    const p = PRODUCTS[pid];
    if (p) m += p.multiplier;
  }
  return Math.max(m, 1); // Minimum 1.0x
}

/**
 * Estimate monthly transaction volume from spend ($M).
 */
export function estimateTxnVolume(spendM) {
  if (spendM <= 0) return 0;

  const tiers = TXN_VOLUME_TIERS;
  if (spendM <= tiers[0].spend) {
    return Math.round(tiers[0].txnPerMonth * (spendM / tiers[0].spend));
  }
  const last = tiers[tiers.length - 1];
  if (spendM >= last.spend) {
    return Math.round(last.txnPerMonth * (spendM / last.spend));
  }
  for (let i = 0; i < tiers.length - 1; i++) {
    if (spendM >= tiers[i].spend && spendM <= tiers[i + 1].spend) {
      const ratio = (spendM - tiers[i].spend) / (tiers[i + 1].spend - tiers[i].spend);
      return Math.round(tiers[i].txnPerMonth + ratio * (tiers[i + 1].txnPerMonth - tiers[i].txnPerMonth));
    }
  }
  return 0;
}

/**
 * Get per-transaction price for a channel at a given monthly volume.
 */
export function getTxnPrice(channelIndex, monthlyVolume) {
  const prices = TXN_PRICING[channelIndex];
  if (!prices) return 0;

  if (monthlyVolume <= VOLUME_TIERS[0]) return prices[0];
  if (monthlyVolume > VOLUME_TIERS[VOLUME_TIERS.length - 1]) return prices[prices.length - 1];

  for (let i = 0; i < VOLUME_TIERS.length - 1; i++) {
    if (monthlyVolume <= VOLUME_TIERS[i + 1]) return prices[i + 1];
  }
  return prices[prices.length - 1];
}

/**
 * Calculate per-role implementation cost.
 */
function calcRoleCost(role) {
  return role.hc * role.rate * role.months;
}

/**
 * Calculate implementation section total.
 */
export function calcImplSection(sectionKey) {
  const section = IMPL_SECTIONS[sectionKey];
  if (!section) return 0;
  return section.roles.reduce((sum, r) => sum + calcRoleCost(r), 0);
}

/**
 * Calculate full implementation cost with tier multiplier and section toggles.
 * @param {string} tierKey - Client tier key
 * @param {Object} sectionToggles - { core: true, integrations: true, qa: true, customerSuccess: true }
 */
export function calcImplementation(tierKey, sectionToggles = {}) {
  const tier = CLIENT_TIERS[tierKey] || CLIENT_TIERS["large-enterprise"];
  let total = 0;

  for (const [key, section] of Object.entries(IMPL_SECTIONS)) {
    if (section.isTnM) continue; // Product Dev is T&M, excluded from standard
    const isOn = section.alwaysOn || sectionToggles[key] !== false;
    if (isOn) {
      total += section.roles.reduce((sum, r) => sum + calcRoleCost(r), 0);
    }
  }

  return Math.round(total * tier.implMultiplier);
}

/**
 * Calculate integration annual fees.
 * @param {string[]} selectedIntegrations - Array of integration IDs
 */
export function calcIntegrationFees(selectedIntegrations) {
  return selectedIntegrations.reduce((sum, id) => {
    const integ = INTEGRATIONS.find(i => i.id === id);
    return sum + (integ ? integ.annualFee : 0);
  }, 0);
}

/**
 * Calculate add-on services total.
 * @param {Array<{id: string, qty: number}>} selectedAddOns
 */
export function calcAddOns(selectedAddOns) {
  return selectedAddOns.reduce((sum, sel) => {
    const addon = ADD_ONS.find(a => a.id === sel.id);
    return sum + (addon ? addon.price * (sel.qty || 1) : 0);
  }, 0);
}


// ═══════════════════════════════════════════════════════════════════════════
// MASTER CALCULATION — Full pricing from inputs
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate complete pricing from user inputs.
 * Tracks which values are assumed vs confirmed.
 *
 * @param {Object} inputs - User-provided inputs
 * @param {string} inputs.customerName
 * @param {number} inputs.annualSpendM - Spend in $M
 * @param {string[]} inputs.selectedProducts - Product IDs
 * @param {string} [inputs.tierOverride] - Manual tier override
 * @param {number} [inputs.powerUsers]
 * @param {number} [inputs.lightUsers]
 * @param {number} [inputs.entityCount]
 * @param {Object} [inputs.channelVolumes] - { channelId: txnsPerMonth }
 * @param {string[]} [inputs.selectedIntegrations]
 * @param {Object} [inputs.implToggles] - Section toggles
 * @param {Array} [inputs.addOns]
 * @param {Object} [inputs.dealParams] - { discount, termYears, escalation, abandonRate }
 *
 * @returns {Object} Complete pricing breakdown with assumptions tracking
 */
export function calculatePricing(inputs) {
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
  } = inputs;

  const assumptions = [];
  const confirmed = [];

  // ─── 1. Tier Classification ──────────────────────────────────────────
  let tier;
  if (tierOverride) {
    tier = tierOverride;
    confirmed.push(`Client tier: ${CLIENT_TIERS[tier]?.label} (manually selected)`);
  } else {
    tier = classifyTier(annualSpendM);
    assumptions.push(`Client tier auto-classified as "${CLIENT_TIERS[tier]?.label}" based on $${annualSpendM}M spend`);
  }
  const tierData = CLIENT_TIERS[tier];

  // ─── 2. Users ────────────────────────────────────────────────────────
  const pUsers = powerUsers ?? tierData.powerUsers;
  const lUsers = lightUsers ?? tierData.lightUsers;
  if (powerUsers != null) {
    confirmed.push(`Power users: ${pUsers} (entered by user)`);
  } else {
    assumptions.push(`Power users estimated at ${pUsers} (${tierData.label} tier benchmark)`);
  }
  if (lightUsers != null) {
    confirmed.push(`Light users: ${lUsers} (entered by user)`);
  } else {
    assumptions.push(`Light users estimated at ${lUsers} (${tierData.label} tier benchmark)`);
  }

  // ─── 3. Entities ─────────────────────────────────────────────────────
  const entities = entityCount ?? tierData.entities;
  const entityMult = getEntityMultiplier(entities);
  if (entityCount != null) {
    confirmed.push(`Entities/BUs: ${entities} (entered by user)`);
  } else {
    assumptions.push(`Entity count assumed at ${entities} (${tierData.label} tier default)`);
  }

  // ─── 4. Platform Base Fee ────────────────────────────────────────────
  const baseFeeK = interpolateBaseFee(annualSpendM);
  const productMult = getProductMultiplier(selectedProducts);
  const platformFeeK = baseFeeK * productMult * entityMult;

  confirmed.push(`Annual spend: $${annualSpendM}M (entered by user)`);
  confirmed.push(`Products: ${selectedProducts.map(p => PRODUCTS[p]?.label).join(", ")}`);

  // ─── 5. Transaction Volumes & Workflow Pricing ───────────────────────
  const totalTxnMonth = estimateTxnVolume(annualSpendM);
  let channelBreakdown;
  let workflowFeesAnnual = 0;

  if (channelVolumes && Object.keys(channelVolumes).length > 0) {
    // User provided specific volumes
    channelBreakdown = CHANNELS.map((ch, idx) => {
      const vol = channelVolumes[ch.id] || 0;
      const price = getTxnPrice(idx, totalTxnMonth);
      const annual = vol * price * 12;
      return { ...ch, volume: vol, perTxn: price, annualCost: annual, assumed: false };
    });
    confirmed.push("Channel volumes provided by user");
  } else {
    // Derive from spend using defaults
    channelBreakdown = CHANNELS.map((ch, idx) => {
      const vol = Math.round(totalTxnMonth * ch.defaultTxnPct);
      const price = getTxnPrice(idx, totalTxnMonth);
      const annual = vol * price * 12;
      return { ...ch, volume: vol, perTxn: price, annualCost: annual, assumed: true };
    });
    assumptions.push(`Transaction volume estimated at ~${totalTxnMonth.toLocaleString()}/month (~${(totalTxnMonth * 12).toLocaleString()}/year)`);
    assumptions.push("Channel distribution based on standard industry split");
  }

  workflowFeesAnnual = channelBreakdown.reduce((sum, ch) => sum + ch.annualCost, 0);

  // ─── 6. Integration Fees ─────────────────────────────────────────────
  const integrations = selectedIntegrations ?? [
    INTEGRATIONS.find(i => i.standard && i.id !== "sso")?.id || "sap",
    "sso",
  ];
  const integrationFees = calcIntegrationFees(integrations);

  if (selectedIntegrations) {
    confirmed.push(`Integrations: ${integrations.map(id => INTEGRATIONS.find(i => i.id === id)?.label).join(", ")}`);
  } else {
    assumptions.push("Standard single-ERP integration assumed (SAP S/4HANA + SSO)");
  }

  // ─── 7. Total Platform Subscription ──────────────────────────────────
  // Platform fee (from spend tiers) IS the subscription price.
  // Workflow fees are the ground-up cost derivation that justifies the platform fee,
  // NOT an addition on top. Integration fees for non-standard integrations are additive.
  const platformBase = Math.round(platformFeeK * 1000);
  const y1Subscription = platformBase + integrationFees;

  // ─── 8. Deal Parameters ──────────────────────────────────────────────
  const dp = { ...DEAL_DEFAULTS, ...dealParams };
  const hasCustomDealParams = Object.keys(dealParams).length > 0;

  if (!hasCustomDealParams) {
    assumptions.push(`Standard deal terms: ${dp.termYears}-year term, ${dp.escalation}% YoY escalation, 0% discount`);
  }

  // Apply discount
  const y1SubDiscounted = Math.round(y1Subscription * (1 - dp.discount / 100));

  // ─── 9. Implementation ──────────────────────────────────────────────
  const implCost = calcImplementation(tier, implToggles);
  const addOnCost = calcAddOns(addOns);
  const totalImpl = implCost + addOnCost;

  // ─── 10. TCO Calculation ─────────────────────────────────────────────
  const years = [];
  for (let y = 1; y <= Math.max(dp.termYears, 5); y++) {
    const sub = y === 1
      ? y1SubDiscounted
      : Math.round(years[y - 2].subscription * (1 + dp.escalation / 100));
    const impl = y === 1 ? totalImpl : 0;
    years.push({ year: y, subscription: sub, implementation: impl, total: sub + impl });
  }

  const tco3 = years.slice(0, 3).reduce((s, y) => s + y.total, 0);
  const tco5 = years.slice(0, 5).reduce((s, y) => s + y.total, 0);

  // ─── 11. Summary Metrics ─────────────────────────────────────────────
  const totalTxnYear = totalTxnMonth * 12;
  const costPerTxnBps = annualSpendM > 0 ? (y1SubDiscounted / (annualSpendM * 1000000)) * 10000 : 0;
  const volDiscount = annualSpendM >= 500 ? Math.round((1 - (y1SubDiscounted / (annualSpendM * 10000 * BPS_BELOW_100M))) * 100) : 0;

  // ─── 12. Subscription Composition ────────────────────────────────────
  // Workflow fees are the ground-up cost justification, shown for transparency
  // but NOT added to the subscription price.
  const subscriptionComposition = {
    platform: platformBase,
    workflowCostBasis: workflowFeesAnnual, // informational — the "why" behind the price
    integrations: integrationFees,
    total: y1Subscription,
    discountedTotal: y1SubDiscounted,
  };

  return {
    // Identity
    customerName,
    annualSpendM,

    // Classification
    tier,
    tierLabel: tierData.label,
    implDuration: tierData.implDuration,
    powerUsers: pUsers,
    lightUsers: lUsers,
    entityCount: entities,

    // Multipliers
    productMultiplier: productMult,
    entityMultiplier: entityMult,
    selectedProducts,

    // Platform Fee
    baseFeeK,
    platformBase,
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

    // Deal
    dealParams: dp,

    // Y1 Total
    y1Total: y1SubDiscounted + totalImpl,

    // TCO
    years,
    tco3,
    tco5,

    // Summary metrics
    costPerTxnBps: Math.round(costPerTxnBps * 10) / 10,
    volDiscount,

    // Assumptions tracking
    assumptions,
    confirmed,
  };
}


// ═══════════════════════════════════════════════════════════════════════════
// QUICK ESTIMATE — Minimum input mode
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate pricing from just spend amount.
 * Everything else is auto-derived.
 */
export function quickEstimate(customerName, annualSpendM, selectedProducts = ["intake-to-award"]) {
  return calculatePricing({ customerName, annualSpendM, selectedProducts });
}
