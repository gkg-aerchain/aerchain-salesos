# Aerchain Pricing Logic v2.0

> **This file is the single source of truth for Pricing Calculator V2.**
> V2 replaces V1's additive model with a **unified subscription model** where
> Platform Access and Workflow Fees are two components of ONE total, split by
> a configurable ratio (default 45/55). Per-transaction prices are DERIVED
> from the workflow budget, not independently set.
> V2 also introduces **Gain Share** — an outcome-based pricing layer.

---

## 0. Key Difference from V1

| Aspect | V1 | V2 |
|--------|----|----|
| Subscription model | Additive: Platform Fee + Workflow Fees + Integrations (each computed independently) | **Unified**: spend-tier total is THE number, split into Platform + Workflow by ratio |
| Per-txn prices | Fixed price table by volume tier | **Back-derived** from workflow budget × channel weight / volume |
| Fee split | Not enforced | **45% Platform / 55% Workflow** (configurable) |
| Gain share | Not included | **Yes** — outcome-based layer on top of subscription |
| Config location | Hard-coded in engine + markdown | **JSON config** (`default-config.json`) — edit without code changes |

**Why this matters:** In V1, platform fee and workflow fees can drift apart — you can't guarantee they sum to the spend-tier target. In V2, the total is derived first from spend tiers, then mathematically split — the two components are always internally consistent.

---

## 1. Spend-to-Total-Subscription (North Star)

The **total subscription** is determined by spend under management — the total annual spend entering the Aerchain platform.

### Spend Tiers

| Spend (USD) | Total Subscription (USD) | BPS |
|-------------|-------------------------|-----|
| $100M | $100,000 | 10.0 |
| $250M | $225,000 | 9.0 |
| $500M | $400,000 | 8.0 |
| $750M | $575,000 | 7.7 |
| $1,000M | $750,000 | 7.5 |

### Interpolation Rule

- **Between tiers**: Linear interpolation
- **Below $100M**: 10 BPS extrapolation, but with a **hard $100K baseline floor** so tiny-spend deals never drop below the minimum subscription
- **Above $1B**: 7.0 BPS marginal rate on excess spend

### Unit Math (for auditors)

```
fee_$    = spend_$ × BPS / 10000
fee_$K   = spendM × BPS / 10
```

So a 7.0 BPS marginal rate from $1B to $3B adds `2000 × 7 / 10 = 1400` → $1.4M, taking the baseline from $750K (at $1B) to $2,150K (at $3B).

---

## 1b. Volume Discount Curve (NEW)

On top of the spend-tier baseline, a **volume discount** is auto-applied using a smooth power curve. This is the primary mechanism for scaling pricing down at large spend levels, replacing hard-coded anchor points with a continuous formula.

### Formula

```
t        = clamp(0, 1, (spend − floor) / (cap − floor))
discount = maxDiscount × t ^ exponent
```

**Default parameters:**
| Parameter | Default | Meaning |
|-----------|---------|---------|
| floor | $100M | Below this spend, volume discount = 0% |
| cap | $3B | Above this spend, volume discount = maxDiscount (capped) |
| maxDiscount | 60% | Maximum discount reached at cap |
| exponent | 0.60 | Curve shape (< 1 = concave, fast rise then tapers) |

### Why a Power Curve (not anchor points or log)?

- **Smooth, no kinks**: A client at $999M vs $1.001B sees nearly identical discount and slope — no arbitrary cliffs
- **Single tunable shape parameter**: Change exponent from 0.60 → 0.50 and the entire curve steepens uniformly
- **Explainable analytically**: "60% × (normalized spend)^0.6" is one sentence, not a lookup table
- **Naturally handles edge cases**: Below floor = 0, above cap = max, monotonically increasing

### Default Curve (exponent = 0.60)

| Spend | Discount | Notes |
|-------|----------|-------|
| ≤ $100M | 0.0% | Baseline, no discount |
| $250M | 9.9% | Light discount starts |
| $500M | 17.3% | Mid-tier |
| $750M | 23.6% | |
| $1B | 29.8% | Round milestone |
| $1.5B | 38.8% | |
| $2B | 46.9% | |
| $3B+ | 60.0% | Capped |

### Where It Sits in the Calculation Chain

**The volume discount is applied to the baseline BEFORE the platform/workflow split**, so that Platform Access + Workflow Fees always directly sum to the post-discount subscription. This keeps the UI breakdown internally consistent.

```
interpolate(spend) × productMult × entityMult         = Baseline Total (list price)
                     ↓
× (1 − volumeDiscount(spend))  ← AUTO, spend-driven  = Net Baseline
                     ↓ split 45/55
Platform Access (× userMultiplier)                   = Platform net
Workflow Fees (× volumeMultiplier)                   = Workflow net
Platform + Workflow                                   = Subscription Target (net)
                     ↓
+ integrationFees (not subject to volume discount)    = Gross Subscription
                     ↓
× (1 − manualDiscount) ← sales slider, stacks on top  = Net Subscription (Y1)
                     ↓
+ implementation + addOns (flat, no discount)         = Y1 Total
```

**Why apply the discount before the split**: Mathematically equivalent to applying after (both produce `B × (1-d) × (pu + wv)`), but gives a cleaner client-facing breakdown where Platform Access + Workflow Fees directly add up to the net subscription. No confusion between "list price" components and "what you're actually paying."

### Sample Full-Pipeline Results (Intake to Award, 1 entity, default multipliers)

| Spend | Baseline | Vol Discount | Net Subscription | Effective BPS |
|-------|----------|--------------|------------------|---------------|
| $50M | $100K (floor) | 0% | $100K | 20.0 |
| $100M | $100K | 0% | $100K | 10.0 |
| $250M | $225K | 10.1% | $202K | 8.1 |
| $500M | $400K | 18.3% | $327K | 6.5 |
| $1B | $750K | 29.7% | $527K | 5.3 |
| $1.5B | $1,100K | 38.8% | $674K | 4.5 |
| $2B | $1,450K | 46.6% | $775K | 3.9 |
| $3B | $2,150K | 60.0% | $860K | 2.9 |
| $5B | $3,550K | 60.0% (capped) | $1,420K | 2.8 |

### Client-Facing Explanation

> *"Our volume discount scales continuously with spend using a power-law curve — the more you commit, the larger the automatic discount, reaching 60% for $3B+ commitments. The curve is smooth (no tier cliffs) so your discount grows naturally as your scope grows. For your projected spend of $X, the auto-discount works out to Y%, which you can see itemized on every quote. This auto-applied volume discount stacks with any additional negotiated discount."*

---

## 2. Unified Platform + Workflow Split

Once the total subscription target is computed, it is split into two components by a fixed ratio.

### Fee Structure (Configurable)

```
Total Subscription = interpolate(spend) × productMult × entityMult

  Platform Access = Total × 45%    (platformPct)
  Workflow Fees   = Total × 55%    (workflowPct)
```

The ratio is controlled by `feeStructure.platformPct` and `feeStructure.workflowPct` in `default-config.json`. Default is 45/55.

### Per-Transaction Price Back-Derivation

Each workflow channel gets a fixed **weight** — its share of the workflow budget. Per-transaction price is then reverse-engineered:

```
channel_budget = workflow_fees × channel_weight
per_txn_price  = channel_budget / (annual_volume_for_that_channel)
```

This guarantees that the sum of (channel_volume × per_txn_price) always equals the workflow fee target.

---

## 2b. Scope Presets & Active Channels (NEW)

**The problem**: Without scoping, the calculator attributes workflow fees across all 9 channels regardless of what the client actually bought. A client buying "Autonomous Sourcing only" still sees Catalog, Tactical, Strategic, etc. in their breakdown with diluted per-transaction prices — which is factually wrong and produces meaningless numbers.

**The fix**: A **Scope Preset** selector in Customer Profile activates a subset of channels. When a preset is active:
1. Only the channels in the preset receive workflow budget allocation
2. Within the active set, weights are re-derived using **complexity-weighted normalization**:
   ```
   weight[channel] = channel.complexity / Σ complexity[active channels]
   ```
3. Transaction volume shares are normalized across active channels (preserving total monthly volume)
4. Inactive channels appear as "not in scope" (hidden by default in Breakdown tab, toggleable)

### Why Complexity-Weighted?

Each channel has a `complexity` value reflecting how much AI compute, analyst effort, integration work, and ongoing orchestration it requires:

| Channel | Complexity | Rationale |
|---------|-----------|-----------|
| Catalog | 2 | Simple lookup + approval |
| Self-Service PO | 3 | Basic form → workflow |
| RC Invoice | 4 | OCR + matching |
| Non-PO Spend | 4 | Classification + routing |
| Contract Framework | 8 | Terms extraction + CLM |
| Auto Negotiation | 15 | Agentic negotiation loop |
| Auto Sourcing | 21 | Market analysis + supplier scoring |
| Tactical Sourcing | 28 | Multi-round RFx + evaluation |
| Strategic Sourcing | 33 | Full lifecycle + stakeholder facilitation |

Complexity is a defensible, objective principle (vs. arbitrary weight percentages picked by a sales leader).

### Default Presets (Editable in `default-config.json`)

**Combined:**
- **Full Suite** — all 9 channels active, manual weights (fallback when no preset selected)
- **Sourcing-Led** — all 4 I2A channels, complexity-weighted
- **P2P-Led** — all 5 P2P channels, complexity-weighted

**Intake to Award:**
- I2A — Autonomous Only *(1 channel)*
- I2A — Autonomous + Negotiation *(2 channels)*
- I2A — Autonomous + Tactical *(2 channels)*
- I2A — Autonomous + Tactical + Strategic *(3 channels)*
- I2A — Full *(all 4 sourcing channels)*

**Procure to Pay:**
- P2P — Catalog Only *(1 channel)*
- P2P — Catalog + Self-Service PO *(2 channels)*
- P2P — Transactional *(Catalog + SSPO + RC Invoice + Non-PO, 4 channels)*
- P2P — Full *(all 5 P2P channels including Contract Framework)*

### Sample: $400M Enterprise, Workflow Budget $209K

**Preset: Autonomous Sourcing Only**
| Channel | Weight | Volume/mo | $/Txn | Annual |
|---------|--------|-----------|-------|--------|
| Autonomous Sourcing | 100% | 4,300 | $4.05 | $209K |

One channel absorbs the entire workflow budget. Per-txn price is meaningful and defensible.

**Preset: Autonomous + Tactical + Strategic**
| Channel | Weight | Volume/mo | $/Txn | Annual |
|---------|--------|-----------|-------|--------|
| Autonomous Sourcing | 25.6% | 2,150 | $2.07 | $54K |
| Tactical Sourcing | 34.1% | 1,613 | $3.69 | $71K |
| Strategic Sourcing | 40.2% | 538 | $13.03 | $84K |

Weights derived from complexity: 21 / (21+28+33) = 25.6%, 28/82 = 34.1%, 33/82 = 40.2%. Strategic sourcing gets the highest per-txn price because of its complexity, even though it's the lowest volume.

### Client-Facing Explanation

> *"We scope the deal to the specific channels you're buying. If you're purchasing autonomous sourcing only, 100% of the workflow budget flows through that channel — we're not diluting the math with channels you're not using. When you add tactical or strategic sourcing, the budget redistributes across the active channels using our published complexity model (lower-complexity channels absorb less cost because they use fewer AI and analyst resources per transaction)."*

---

## 3. Channel Weights & Default Transaction Split (Full Suite Only)

| Channel | Workflow Budget Weight | Default Txn % | Complexity |
|---------|----------------------|---------------|-----------|
| Catalog | 6% | 30% | 2 (Low) |
| Self-Service PO | 2% | 10% | 3 (Low) |
| Contract Framework | 3% | 5% | 8 (Medium) |
| RC Invoice | 4% | 5% | 4 (Low) |
| Non-PO Spend | 1% | 5% | 4 (Low) |
| Autonomous Sourcing | 15% | 20% | 21 (High) |
| Autonomous Negotiation | 9% | 5% | 15 (High) |
| Tactical Sourcing | 23% | 15% | 28 (High) |
| Strategic Sourcing | 37% | 5% | 33 (Very High) |

**Weights sum to 100%** of the workflow budget. Default Txn % sums to 100% of the estimated total transaction volume (for auto-derivation when user doesn't specify per-channel volumes).

### Transaction Volume Estimation (Preset-Aware Power Curve)

Each preset has its own `volumeBasis` defining a **power-curve** for estimating monthly transaction count at any spend level:

```
volume(spend) = refVolume × (spend / refSpend)^exponent
```

**Why sublinear**: Procurement transaction counts scale sublinearly with spend. A $3B company doesn't run 6x more strategic sourcing events than a $500M company — they run BIGGER ones, not more of them. Typical exponents:
- **0.60** for sourcing-heavy presets (Auto, Tactical, Strategic) — events cap out at organizational bandwidth
- **0.70–0.75** for P2P-heavy presets (Catalog, PO, Invoice) — more linear with spend volume

### Default Volume Bases (Editable in `default-config.json`)

| Preset | Ref Spend | Ref Volume | Exponent | $100M | $750M | $2B |
|--------|-----------|-----------|----------|-------|-------|-----|
| **Full Suite** | $750M | 7,000/mo | 0.70 | 1,708 | 7,000 | 13,908 |
| Sourcing-Led | $750M | 1,250/mo | 0.60 | 373 | 1,250 | 2,252 |
| P2P-Led | $750M | 6,000/mo | 0.75 | 1,324 | 6,000 | 12,521 |
| I2A — Autonomous Only | $750M | 400/mo | 0.60 | 119 | 400 | 721 |
| I2A — Auto + Negotiation | $750M | 500/mo | 0.60 | 149 | 500 | 901 |
| **I2A — Auto + Tactical** ⭐ | $750M | 1,000/mo | 0.60 | 299 | 1,000 | 1,801 |
| I2A — Auto + Tactical + Strategic | $750M | 1,150/mo | 0.60 | 343 | 1,150 | 2,071 |
| I2A — Full | $750M | 1,250/mo | 0.60 | 373 | 1,250 | 2,252 |
| P2P — Catalog Only | $750M | 3,500/mo | 0.75 | 772 | 3,500 | 7,304 |
| P2P — Catalog + SSPO | $750M | 4,000/mo | 0.75 | 883 | 4,000 | 8,348 |
| P2P — Transactional | $750M | 5,000/mo | 0.75 | 1,103 | 5,000 | 10,434 |
| P2P — Full | $750M | 6,000/mo | 0.75 | 1,324 | 6,000 | 12,521 |

⭐ **Anchor point**: Sales leadership calibration — $750M Auto+Tactical scope = 1,000 txn/month. All other preset volume bases are extrapolated from this anchor and should be validated/adjusted based on real deal data.

---

## 3b. Volume Multiplier (Workflow Fees only)

User can override the estimate by entering actual monthly transactions in the Customer Profile. When provided, a **soft multiplier** scales the workflow fee component (mirroring the user multiplier pattern on Platform Access).

### Formula

```
actualVol     = user input (optional)
expectedVol   = preset volume basis × (spend / refSpend)^exponent
volumeRatio   = actualVol / expectedVol
volumeMult    = clamp(0.85, 2.00, volumeRatio ^ 0.30)

workflowFees  = (baselineTotal × workflowPct) × volumeMult
```

**Key properties:**
- **Dampened (`^0.30`)**: A team running 2x the expected volume triggers a ~1.23x multiplier (not 2x linear). 10x volume triggers exactly 2.0x. The dampening reflects economies of scale — workflow cost doesn't scale linearly with transaction count.
- **Clamped [0.85, 2.00]**: Light-volume clients get up to -15% discount. Heavy-volume clients pay up to +100% (2x). The upper cap is reached at ~10x expected volume. Beyond that, no additional multiplier.
- **Only applies to workflow component**: Platform Access is unaffected (that's the user multiplier's domain).
- **Only active when user provides override**: If blank, the multiplier stays at 1.00 and the estimate is shown for reference.

### Exponent Intuition

The exponent controls how sensitive the multiplier is to volume changes:

| Exponent | 2x Volume → | 10x Volume → | Meaning |
|----------|------------|-------------|---------|
| 1.0 | 2.00x | 10.00x | Linear (no dampening) |
| 0.5 | 1.41x | 3.16x | Square root (gentle) |
| **0.30** ⭐ | **1.23x** | **2.00x** | **Aggressive (current)** |
| 0.2 | 1.15x | 1.58x | Very aggressive |

At **0.30**, a 2x volume swing gives +23%, a 5x swing gives +62%, and 10x+ hits the 2.0 cap. This reflects "workflow cost scales sublinearly with transaction count" — a proven pattern in procurement SaaS.

### Impact Examples ($750M, Auto+Tactical preset, $317K workflow budget baseline)

| Actual Volume | Ratio | Multiplier | Workflow Fees | Δ |
|---------------|-------|-----------|---------------|---|
| 250/mo (0.25x) | 0.25 | 0.85x (clamped) | $270K | -$47K |
| 500/mo (0.50x) | 0.50 | 0.85x (clamped) | $270K | -$47K |
| 750/mo (0.75x) | 0.75 | 0.92x | $291K | -$26K |
| **1,000/mo** (expected) | 1.00 | 1.00x | **$317K** | — |
| 1,500/mo (1.50x) | 1.50 | 1.13x | $358K | +$41K |
| 2,000/mo (2.00x) | 2.00 | 1.23x | $390K | +$73K |
| 3,000/mo (3.00x) | 3.00 | 1.39x | $440K | +$123K |
| 5,000/mo (5.00x) | 5.00 | 1.62x | $514K | +$197K |
| 7,000/mo (7.00x) | 7.00 | 1.80x | $570K | +$253K |
| **10,000/mo (10.00x)** | 10.00 | **2.00x (clamped)** | **$634K** | **+$317K** |
| 20,000/mo+ | 20.00 | 2.00x (clamped) | $634K | +$317K |

### Client-Facing Explanation

> *"Workflow fees scale with actual transaction volume relative to the typical deployment profile for your scope. If your procurement team runs significantly more transactions than the benchmark, there's a small premium on the workflow component (up to +15%). Running fewer gets you a discount (down to -15%). Power users of the platform pay more; lighter users pay less. This is separate from the Platform Access fee, which scales with user count rather than transaction volume."*

---

## 4. Product Multipliers (Same as V1)

| Product | Multiplier |
|---------|-----------|
| Intake to Award | 1.00x (base) |
| Procure to Pay | +0.75x |

Combined multiplier applies to the total subscription target before the platform/workflow split.

---

## 4b. User Multiplier (NEW in V2)

User counts now meaningfully affect pricing via a **soft multiplier on Platform Access only**. This keeps the spend-based foundation intact while acknowledging that teams significantly larger or smaller than tier defaults drive different load on the platform (training, provisioning, support, change management).

### Formula

```
weightedUsers    = powerUsers × 1.0 + lightUsers × 0.2
weightedDefault  = tier.powerUsers × 1.0 + tier.lightUsers × 0.2
userRatio        = weightedUsers / weightedDefault
userMultiplier   = clamp(0.85, 1.15, userRatio ^ 0.3)

platformAccess   = (baselineTotal × platformPct) × userMultiplier
```

### Why these specific parameters

- **Light users weighted at 0.2x**: Power users do the actual procurement work (sourcing, negotiation, contract management) — they drive ~80% of platform load. Light users (approvers, requisitioners, stakeholders) are occasional touchpoints that still require provisioning and licensing but generate minimal transaction activity.
- **`^0.3` dampening**: Prevents linear scaling. A team 2x larger than default = 1.23x raw multiplier, not 2.0x. A team 4x larger = 1.52x raw. Without dampening, a Fortune 500 with 10x the default users would pay 10x the platform fee, which is wrong — the platform cost doesn't scale linearly with seat count.
- **±15% clamp**: Hard cap ensures users can move the price meaningfully but never dominate it. Spend remains the primary pricing driver.

### Impact Examples ($400M Enterprise, $171K baseline platform access)

| Scenario | Power / Light | Weighted | Ratio | Multiplier | Platform Access | Δ |
|----------|--------------|----------|-------|-----------|-----------------|---|
| Skeleton team | 11 / 67 | 24.4 | 0.50 | 0.85x (clamped) | $145K | -$26K |
| Default | 22 / 135 | 49.0 | 1.00 | 1.00x | $171K | — |
| Moderate growth | 35 / 200 | 75.0 | 1.53 | 1.14x | $195K | +$24K |
| Oversized team | 50 / 300 | 110.0 | 2.24 | 1.15x (clamped) | $197K | +$26K |
| J&J-scale override | 150 / 1,000 | 350.0 | 7.14 | 1.15x (clamped) | $197K | +$26K |

### Client-Facing Explanation

> *"Platform Access scales slightly with your user count relative to the tier benchmark. A procurement team significantly larger than the typical Enterprise deployment (22 power + 135 light users) drives additional provisioning, training, and support load — we reflect that with a multiplier of up to +15%. Conversely, leaner teams get up to -15%. Power users (full-cycle procurement operators) count 5x more than light users (occasional stakeholders), reflecting their much higher platform engagement."*

---

## 5. Entity Multiplier (Updated from V1)

| Entities / BUs | Multiplier |
|---------------|-----------|
| 1 | 1.00x |
| 2–3 | 1.15x |
| 4–10 | 1.30x |
| 11+ | 1.50x |

*Note: V1 defined the top tier as "10+" with min=10. V2 defines it as "11+" with min=11 for cleaner boundary math.*

---

## 6. Client Tier Classification (Same as V1)

| Tier | Spend Range | Power/Light Users | Entities | Impl Multiplier | Duration |
|------|------------|-------------------|---------|----------------|----------|
| Mid-Market | < $250M | 15 / 60 | 1 | 0.60x | 3–4 months |
| Enterprise | $250M – $750M | 30 / 180 | 2 | 0.85x | 4–6 months |
| Large Enterprise | > $750M | 50 / 400 | 11 | 1.00x | 6–8 months |

**Default user counts are calibrated above Hackett Group / APQC procurement team sizing benchmarks to err on the higher side — proposals should assume healthy team engagement:**
- Mid-Market companies typically run 10–15 procurement FTEs per $1B spend; defaults sit at the upper end of typical staffing
- Enterprise averages 8–12 FTE/$1B with higher centralization; defaults reflect well-staffed mid-size deployments
- Large Enterprise achieves economies of scale at 5–10 FTE/$1B but with broader stakeholder populations
- Fortune 500 / Global 2000 prospects should override defaults — the "Large Enterprise" tier is sized for the $750M–$2B range; above that, user overrides are expected

---

## 7. Integrations

| Integration | Standard? | Annual Fee |
|------------|----------|-----------|
| SAP S/4HANA | Yes | $0 |
| Oracle Fusion | Yes | $0 |
| ServiceNow | Yes | $0 |
| SSO / SCIM | Yes | $0 |
| NetSuite | No | $18,000 |
| Coupa | No | $18,000 |
| DocuSign / CLM | No | $18,000 |
| Custom API | No | $18,000 |

Standard integrations are included in the base platform fee. Additional integrations incur the annual fee.

---

## 8. Implementation Rate Card (Same as V1)

Large Enterprise baseline = **~$398,000** total.

| Section | Toggleable | Cost |
|---------|-----------|------|
| Core Implementation | Always ON | $248,000 |
| Integrations | ON by default | $36,000 |
| QA & Validation | ON by default | $34,500 |
| Customer Success | ON by default | $90,000 |
| **Total** | | **~$408,500** |

### Tier Scaling

| Tier | Multiplier | Approx Total |
|------|-----------|-------------|
| Mid-Market | 0.60x | ~$245,000 |
| Enterprise | 0.85x | ~$347,000 |
| Large Enterprise | 1.00x | ~$408,500 |

### Role Detail

**Core ($248K):**
- PC Team Lead × 1, $10K/mo, 3 mo = $30K
- Project Manager × 1, $10K/mo, 6 mo = $60K
- Product Consultant × 1, $10K/mo, 5 mo = $50K
- Assoc. Product Consultant × 2, $9K/mo, 6 mo = $108K

**Integrations ($36K):** Integration Lead + Engineer × 2 months
**QA ($32K):** QA Lead + 2 QA Engineers × 1.5 months
**Customer Success ($83K):** CSM + 2 Support Specialists + 2 Support Engineers × 3 months

---

## 9. Add-On Services (Same as V1)

| Add-On | Price | Unit |
|--------|-------|------|
| On-Site Deployment | $12,000 | per person/month |
| Additional Custom Fields | $5,000 | per field |
| Additional Integration | $18,000 | per integration |
| Extended Hypercare | $28,000 | per month |
| Training Sessions | $5,000 | per session |
| Data Migration | $15,000 | per source |
| Change Request | $10,000 | per CR |

---

## 10. Deal Parameters (Same as V1)

| Parameter | Default | Range |
|-----------|---------|-------|
| Discount | 0% | 0–30% |
| Term | 3 years | 1–5 |
| YoY Escalation | 10% | 0–15% |

---

## 11. Gain Share (NEW in V2)

Outcome-based pricing layer on top of the subscription. Aerchain earns a percentage of measurable savings generated through the platform.

### What Counts as "Savings"

**Negotiation Savings**
- Difference between supplier's initial quote and final negotiated price via Aerchain's autonomous negotiation.
- Baseline: first formal quote or last-known contract price (whichever is higher).
- `Savings = (Baseline Price − Final Price) × Volume`

**Cycle Time Value**
- Monetary value of reduced procurement cycle time.
- Baseline: client's average cycle time over prior 12 months.
- Valuation: $500–$2,000/day depending on deal size.
- `Savings = (Baseline Days − Aerchain Days) × Daily Value × Events`

**Maverick Spend Elimination**
- Spend redirected from off-contract channels to approved suppliers.
- Baseline: maverick spend % before Aerchain (typically 15–30% of addressable spend).
- `Savings = (Baseline % − Current %) × Addressable Spend × Savings Factor (8–12%)`

### Gain Share Parameters

| Parameter | Default | Range |
|-----------|---------|-------|
| Gain Share % | 5% | 2–15% |
| Cap | 2× platform fee | 1–5× |
| Floor | $0 | — |
| Reconciliation | Quarterly | Q/Annual |
| Ramp Period | 2 quarters | 1–4 Q |

### Exclusions
- Market price decreases unrelated to negotiation
- One-time project savings (only recurring operational savings qualify)
- Savings below $10K per event (materiality threshold)

### Audit Rights
Client has annual audit rights. Aerchain provides detailed savings reports with each reconciliation.

---

## 12. TCO Calculation

### Year 1
```
Y1 Subscription   = Total Target × (1 − discount%)
Y1 Implementation = Impl Rate Card × tier multiplier + Add-Ons (one-time)
Y1 Gain Share     = estimated_savings × gain_share_% (capped)
Y1 Total          = Y1 Subscription + Y1 Implementation + Y1 Gain Share
```

### Multi-Year
```
Yn Subscription = Y(n-1) Subscription × (1 + escalation%)
Yn Gain Share   = Y(n-1) Gain Share × (1 + escalation%)
Implementation  = Year 1 only
```

### TCO
```
3-Year TCO = Y1 + Y2 + Y3
5-Year TCO = Y1 + Y2 + Y3 + Y4 + Y5
```

---

## 13. Auto-Derivation Rules (Same as V1)

### Minimum Required Input
1. Customer Name
2. Annual Spend (USD)
3. At least one product selected

### Derivation Chain
```
spend → client tier → default users, entities
spend → total subscription target → platform/workflow split
spend → estimated txn volume → default channel split → back-derived per-txn prices
tier → implementation rate card (× tier multiplier)
defaults → standard integrations + SSO
defaults → deal parameters (0% discount, 3yr, 10% escalation)
gain share → OFF by default
```

### Assumption Flags
- `[ASSUMED]` — auto-derived
- `[CONFIRMED]` — explicitly entered by user
- `[CALCULATED]` — computed from other inputs

---

## 14. Pricing Validation Rules

### Sanity Checks
1. Total subscription should be 5–15 BPS of spend under management
2. Platform + Workflow components must sum to total subscription target (enforced by construction)
3. Implementation should not exceed 100% of Y1 subscription
4. Per-txn prices should never go below V1 floor prices (sanity check only)
5. Discount ≤ 30% without executive override
6. Gain share ≤ cap (2× platform fee by default)

---

*Last updated: 2026-04-13*
*Version: 2.0*
*Config source: `pricing-calculator-v2/default-config.json`*
*Engine: `lib/pricingEngineV2.js`*
*Owner: Gaurav Guha, Head of Sales*
