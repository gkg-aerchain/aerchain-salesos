# Gain Share Pricing Methodology

## Overview
Gain Share is an outcome-based pricing layer where Aerchain earns a percentage of measurable savings generated through the platform. This sits on top of the Platform Access + Workflow subscription fees.

## What Counts as "Savings"

### Negotiation Savings
- **Definition**: Difference between supplier's initial quote and final negotiated price, facilitated by Aerchain's autonomous negotiation engine.
- **Baseline**: Supplier's first formal quote or last-known contract price (whichever is higher).
- **Measurement**: (Baseline Price − Final Negotiated Price) × Volume

### Cycle Time Value
- **Definition**: Monetary value of reduced procurement cycle time.
- **Baseline**: Client's average cycle time (in days) before Aerchain, measured over the prior 12 months.
- **Valuation**: Each day reduced × client-agreed daily value rate (typically $500-$2,000/day depending on deal size).
- **Measurement**: (Baseline Days − Aerchain Days) × Daily Value × Number of Events

### Maverick Spend Elimination
- **Definition**: Spend redirected from off-contract/non-compliant channels to approved suppliers.
- **Baseline**: Client's maverick spend % before Aerchain (typically 15-30% of addressable spend).
- **Measurement**: (Baseline Maverick % − Current Maverick %) × Total Addressable Spend × Savings Factor (typically 8-12%)

## Gain Share Parameters

| Parameter | Default | Range | Notes |
|-----------|---------|-------|-------|
| Gain Share % | 5% | 2-15% | Percentage of measured savings paid to Aerchain |
| Cap | 2× platform fee | 1-5× | Maximum gain share fee per period |
| Floor | $0 | - | Minimum gain share (typically $0 — no savings, no fee) |
| Reconciliation | Quarterly | Q/Annual | How often savings are measured and billed |
| Ramp Period | 2 quarters | 1-4 Q | Grace period before gain share kicks in |

## Exclusions
- Savings from market price decreases unrelated to negotiation
- One-time project savings (only recurring operational savings qualify)
- Savings below a materiality threshold ($10K per event minimum)

## Audit Rights
Client has the right to audit gain share calculations annually. Aerchain provides a detailed savings report with each reconciliation.

## Future Considerations
- Outcome-based pricing tiers (different gain share % for different savings categories)
- Performance guarantees (minimum savings commitment from Aerchain)
- Shared risk model (Aerchain co-invests in implementation for higher gain share %)
