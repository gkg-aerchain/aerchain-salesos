# Aerchain — Canva Design System Specification

> **Purpose:** This document is a machine-readable instruction set. When ingested by any AI model, LLM, design tool, or code generator, it should produce UI output that faithfully reproduces the Aerchain Canva design theme.

---

## 1. Design Philosophy

- **Aesthetic:** Friendly, creative-tool-inspired, professional but approachable
- **Mode:** Light theme only (no dark mode)
- **Feel:** Gradient accents on clean white surfaces, generous whitespace, rounded pill shapes, subtle shadows, colorful without being overwhelming
- **Inspiration:** Canva's brand asset management UI — gradient headers, colorful badges, playful but functional

---

## 2. Color Tokens

### 2.1 Primary Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--purple` | `#8B5CF6` | Primary actions, active states, links, accent |
| `--purple-hover` | `#7C3AED` | Hover state for purple elements |
| `--purple-light` | `#F3F0FF` | Light purple backgrounds (badges, highlights) |
| `--purple-border` | `#DDD6FE` | Purple border color for badges, focus rings |
| `--purple-50` | `#FAF5FF` | Extremely light purple (table row hover) |

### 2.2 Secondary Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--teal` | `#06B6D4` | Secondary accent, gradient endpoint |
| `--teal-light` | `#ECFEFF` | Teal badge/chip background |
| `--teal-border` | `#A5F3FC` | Teal badge border |

### 2.3 Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--emerald` | `#10B981` | Success, active, positive delta, closed-won |
| `--emerald-light` | `#ECFDF5` | Emerald badge background |
| `--emerald-border` | `#A7F3D0` | Emerald badge border |
| `--amber` | `#F59E0B` | Warning, submitted, escalation, pending |
| `--amber-light` | `#FFFBEB` | Amber badge background |
| `--amber-border` | `#FDE68A` | Amber badge border |
| `--red` | `#EF4444` | Error, draft, danger, negative delta |
| `--red-light` | `#FEF2F2` | Red badge background |
| `--red-border` | `#FECACA` | Red badge border |
| `--blue` | `#3B82F6` | Links, informational |
| `--blue-light` | `#EFF6FF` | Blue badge background |

### 2.4 Brand Color

| Token | Hex | Usage |
|-------|-----|-------|
| `--aerchain` | `#DC5F40` | Aerchain brand orange-coral |
| `--aerchain-light` | `#FEF2EE` | Aerchain badge background |
| `--aerchain-border` | `#FDCFBF` | Aerchain badge border |

### 2.5 Surface Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--content-bg` | `#FAFAFA` | Page/content area background |
| `--card-bg` | `#FFFFFF` | Card/panel background |
| `--card-border` | `#F0F0F0` | Default border for cards, dividers |
| `--sidebar-bg` | `#F5F5F5` | Sidebar background |
| `--sidebar-hover` | `#EBEBEB` | Sidebar item hover state |
| `--sidebar-divider` | `#E5E7EB` | Sidebar section dividers |

### 2.6 Text Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--text-primary` | `#1F2937` | Headings, body text, primary content |
| `--text-secondary` | `#6B7280` | Labels, descriptions, secondary info |
| `--text-muted` | `#9CA3AF` | Timestamps, placeholders, disabled text |
| `--text-inverse` | `#FFFFFF` | Text on dark/gradient backgrounds |

---

## 3. Gradients

Gradients are a core design element. Use at 135deg angle.

| Name | CSS | Usage |
|------|-----|-------|
| **Primary** | `linear-gradient(135deg, #8B5CF6, #06B6D4)` | Primary buttons, active sidebar, KPI values, section titles |
| **Header** | `linear-gradient(135deg, #DBEAFE, #E9D5FF, #CFFAFE)` | Top bar background (blue→purple→teal, subtle) |
| **Warm** | `linear-gradient(135deg, #8B5CF6, #EC4899)` | Special highlights, promotional |
| **Avatar 1** | `linear-gradient(135deg, #8B5CF6, #3B82F6)` | Purple-blue avatar |
| **Avatar 2** | `linear-gradient(135deg, #06B6D4, #10B981)` | Teal-green avatar |
| **Avatar 3** | `linear-gradient(135deg, #F59E0B, #EF4444)` | Amber-red avatar |
| **Avatar 4** | `linear-gradient(135deg, #EC4899, #8B5CF6)` | Pink-purple avatar |

### Gradient Text

Apply gradient to text using:
```css
background: var(--gradient-primary);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

Use gradient text for: section titles, KPI values, logo wordmark, total values.

---

## 4. Typography

### 4.1 Font Families

| Purpose | Font Stack |
|---------|-----------|
| **UI / Body** | `'DM Sans', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif` |
| **Data / Numbers** | `'JetBrains Mono', 'SF Mono', 'Fira Code', monospace` |

Google Fonts import:
```
DM Sans: 400, 500, 600, 700, 800
Plus Jakarta Sans: 400, 500, 600, 700, 800
JetBrains Mono: 400, 500, 600
```

### 4.2 Type Scale

| Element | Size | Weight | Tracking | Notes |
|---------|------|--------|----------|-------|
| Page Title | 32px | 800 | -0.5px | Use gradient text |
| Section Title | 24px | 800 | normal | Use gradient text |
| Card Title | 18px | 700 | normal | text-primary |
| Subsection Title | 15px | 700 | normal | text-primary |
| Body | 14px | 400 | normal | text-primary |
| Body Secondary | 13px | 500 | normal | text-secondary |
| Label | 11px | 600 | 0.8px | uppercase, text-muted |
| Group Label | 10px | 700 | 1.8px | uppercase, text-muted |
| KPI Value | 28px | 800 | -0.5px | DM Sans, gradient or semantic color |
| Table Data | 13px | 500 | normal | JetBrains Mono |
| Timestamp | 10px | 400 | normal | JetBrains Mono, text-muted |

### 4.3 Line Height

- Body text: `1.55`
- Headings: `1.2`
- UI elements: `1`

---

## 5. Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--sp-4` | 4px | Tight gaps (badge dot) |
| `--sp-8` | 8px | Small gaps (inline elements) |
| `--sp-10` | 10px | Badge padding, small card gaps |
| `--sp-12` | 12px | Standard inline gap |
| `--sp-16` | 16px | Card internal sections |
| `--sp-20` | 20px | Grid gaps |
| `--sp-24` | 24px | Card padding, content area padding |
| `--sp-32` | 32px | Large section spacing |

---

## 6. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--r-xs` | 6px | File badges, small chips |
| `--r-sm` | 8px | Buttons (secondary), inner elements |
| `--r-md` | 12px | Sidebar items, input fields, module chips |
| `--r-lg` | 16px | Cards, panels, KPI cards |
| `--r-xl` | 20px | Page header, large containers |
| `--r-pill` | 100px | **Buttons (primary), badges, filter pills** |

**Key rule:** Primary/CTA buttons ALWAYS use pill radius (100px). Cards use 16px. Inputs use 12px.

---

## 7. Shadows

| Name | CSS | Usage |
|------|-----|-------|
| **Card Default** | `0 2px 12px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.03)` | All cards at rest |
| **Card Hover** | `0 8px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)` | Cards on hover (+ translateY(-2px)) |
| **Button Glow (Purple)** | `0 4px 14px rgba(139,92,246,0.3)` | Primary buttons, active sidebar |
| **Button Glow (Green)** | `0 4px 14px rgba(16,185,129,0.3)` | Success buttons |
| **Button Glow (Red)** | `0 4px 14px rgba(239,68,68,0.3)` | Danger buttons |
| **Focus Ring** | `0 0 0 3px rgba(139,92,246,0.12)` | Input focus state |

---

## 8. Component Specifications

### 8.1 Buttons

```
Shape:        pill (border-radius: 100px)
Padding:      10px 24px (default), 6px 16px (small), 14px 32px (large)
Font:         DM Sans, 13px, weight 600
Transition:   all 0.2s ease
Gap:          8px (icon + label)
```

| Variant | Background | Color | Shadow |
|---------|-----------|-------|--------|
| Primary | `gradient-primary` | white | purple glow |
| Secondary | white, border 1.5px `card-border` | text-primary | none |
| Success | `gradient(emerald → #059669)` | white | green glow |
| Danger | `gradient(red → #DC2626)` | white | red glow |
| Ghost | transparent, border 1.5px `purple-border` | purple | none |

### 8.2 Badges / Status Pills

```
Shape:        pill (border-radius: 100px)
Padding:      3px 10px
Font:         11px, weight 600
Dot:          6px circle, matching color, placed before label
```

| Variant | Background | Text | Border |
|---------|-----------|------|--------|
| Purple | `#F3F0FF` | `#8B5CF6` | `#DDD6FE` |
| Emerald | `#ECFDF5` | `#10B981` | `#A7F3D0` |
| Amber | `#FFFBEB` | `#F59E0B` | `#FDE68A` |
| Red | `#FEF2F2` | `#EF4444` | `#FECACA` |
| Teal | `#ECFEFF` | `#06B6D4` | `#A5F3FC` |
| Aerchain | `#FEF2EE` | `#DC5F40` | `#FDCFBF` |

### 8.3 KPI Cards

```
Background:   white
Border:       1px solid #F0F0F0
Radius:       16px
Shadow:       card-default
Padding:      22px 24px
Top accent:   4px gradient bar (full width, matches semantic color)
```

Structure:
1. **Label**: 11px, 600 weight, uppercase, 0.8px tracking, text-muted
2. **Value**: 28px, 800 weight, DM Sans (gradient-text for purple, semantic color for others)
3. **Delta**: 12px pill badge (emerald for up, red for down, muted for flat)

### 8.4 Cards

```
Background:   #FFFFFF
Border:       1px solid #F0F0F0
Radius:       16px
Shadow:       card-default
Padding:      24px
Hover:        shadow → card-hover, transform: translateY(-2px)
Transition:   box-shadow 0.2s, transform 0.2s
```

### 8.5 Data Tables

```
Font:         13px body, 10px headers
Header:       uppercase, 700 weight, 0.8px tracking, text-muted, bg: #FAFAFA
              Bottom border: 2px solid #F0F0F0
Cells:        padding 14px 16px
              Bottom border: 1px solid #F0F0F0
Row hover:    background: #FAF5FF (purple-50)
Last row:     no bottom border
Data values:  JetBrains Mono for numbers/currency
```

### 8.6 Form Inputs

```
Padding:      10px 14px
Background:   white
Border:       1.5px solid #F0F0F0
Radius:       12px
Font:         13px, DM Sans
Focus:        border-color: #8B5CF6 + box-shadow: 0 0 0 3px rgba(139,92,246,0.12)
Placeholder:  color: #9CA3AF
```

### 8.7 Upload / Drop Zone

```
Border:       2px dashed #DDD6FE
Radius:       16px
Padding:      32px
Background:   #FAF5FF
Text-align:   center
Hover:        border-color: #8B5CF6, background: #F3F0FF
```

### 8.8 Sidebar

```
Width:        250px
Background:   #F5F5F5
Border-right: 1px solid #E5E7EB

Nav items:
  Padding:    10px 14px
  Radius:     12px
  Font:       13px, weight 500
  Color:      #6B7280 (default), white (active)
  Active bg:  gradient-primary (#8B5CF6 → #06B6D4)
  Active shadow: 0 4px 14px rgba(139,92,246,0.3)

Group labels:
  Font:       10px, weight 700, tracking 1.8px, uppercase
  Color:      #9CA3AF

Footer:
  Font:       11px, JetBrains Mono for data, text-muted
```

### 8.9 Topbar

```
Height:       60px
Background:   gradient-header (#DBEAFE → #E9D5FF → #CFFAFE)
Border-bottom: 1px solid rgba(139,92,246,0.12)
Padding:      0 24px
```

### 8.10 Filter Pills

```
Shape:        pill (100px radius)
Padding:      6px 18px
Font:         12px, weight 600
Default:      white bg, 1.5px border #F0F0F0, text-secondary
Active:       gradient-primary bg, white text, no border
              Shadow: 0 2px 8px rgba(139,92,246,0.25)
```

### 8.11 Module Chips

```
Padding:      10px 14px
Radius:       12px
Font:         12px, weight 500

Active:       bg: #F3F0FF, border: 1.5px solid #DDD6FE, color: #8B5CF6
              Checkmark icon: 14px, stroke #8B5CF6, stroke-width 2.5
Inactive:     bg: #FAFAFA, border: 1.5px solid #F0F0F0, color: #9CA3AF
              Empty checkbox: 14px square, radius 4px, border 1.5px #F0F0F0

Price label:  JetBrains Mono, 11px, right-aligned (margin-left: auto)
```

### 8.12 Progress Bars

```
Track:        height 6px, radius 3px, bg: #FAFAFA
Fill:         height 6px, radius 3px, semantic color
```

### 8.13 Avatars

```
Size:         32px (default), 40px (large)
Shape:        circle (border-radius: 50%)
Background:   one of 4 gradient presets
Font:         12px (default) / 14px (large), weight 700, white
Content:      2-letter initials (uppercase)
```

### 8.14 File Type Badges

```
Padding:      3px 8px
Radius:       6px
Font:         10px, weight 700, JetBrains Mono
```

| Type | Background | Text Color |
|------|-----------|------------|
| CSV | `#DBEAFE` | `#2563EB` |
| PDF | `#FEE2E2` | `#DC2626` |
| XLSX | `#D1FAE5` | `#059669` |
| DOCX | `#E0E7FF` | `#4338CA` |
| JSON | `#FEF3C7` | `#D97706` |
| TXT | `#F3F4F6` | `#6B7280` |

---

## 9. Layout Rules

1. **Page background**: `#FAFAFA`
2. **Max content width**: `1200px` (centered)
3. **Content padding**: `24px`
4. **Grid gaps**: `20px` (standard), `16px` (tight), `14px` (compact)
5. **Section spacing**: `56px` between major sections
6. **Card spacing**: `20px` between cards in a grid
7. **Sidebar width**: `250px` fixed
8. **Topbar height**: `60px` fixed

---

## 10. Interaction States

| Element | Default | Hover | Active/Focus |
|---------|---------|-------|-------------|
| Card | shadow-default | shadow-hover + translateY(-2px) | — |
| Button (Primary) | gradient + glow | glow-larger + translateY(-1px) | — |
| Button (Secondary) | white + border | bg: #FAFAFA, border: purple-border | — |
| Input | border: #F0F0F0 | — | border: #8B5CF6 + focus ring |
| Table Row | transparent | bg: #FAF5FF | — |
| Sidebar Item | transparent | bg: #EBEBEB | gradient bg + white text |
| Badge | static | — | — |
| Drop Zone | dashed purple-border | solid purple border, deeper bg | — |

Transition default: `all 0.2s ease`

---

## 11. Aerchain-Specific Data Contexts

When generating Aerchain UI, use this representative data:

### Company Info
- Company: Aerchain
- ARR: $6M
- Spend Managed: $20B+
- Platform: Cloud-native AI-powered procurement

### Modules & Pricing
| Module | Price |
|--------|-------|
| Base Platform Fee | $120,000 |
| Source-to-Pay | $80,000 |
| e-Sourcing | $60,000 |
| Contract Management | $55,000 |
| Spend Analytics | $45,000 |
| Implementation | $45,000 |
| Supplier Portal | $35,000 |
| Invoice Automation | $40,000 |
| Catalog Management | $30,000 |
| AP Automation | $50,000 |
| YoY Escalation | 10% |

### Sample Deals
| Client | Y1 Amount | Spend Under Mgmt | Modules |
|--------|-----------|-------------------|---------|
| Tata Steel | $420,000 | $2.1B | Sourcing, CLM, SXM |
| Hindalco | $285,000 | $1.4B | Sourcing, Analytics |
| JSW Group | $510,000 | $3.2B | Full Suite |

### Sample Proposals
| Client | Value | Stage | Status | Contact |
|--------|-------|-------|--------|---------|
| Mahindra & Mahindra | $750,000 | Proposal | Submitted | Rajesh Kumar |
| Larsen & Toubro | $1,200,000 | Negotiation | In Review | Priya Sharma |
| Reliance Industries | $2,000,000 | Proposal | Draft | Amit Patel |
| Adani Ports | $680,000 | Closed Won | Won | Sneha Gupta |

### Volume Discount Tiers
| Tier | Discount |
|------|----------|
| Under $500M | $0 |
| $500M – $1B | -$8,000 |
| Over $1B | -$15,000 |

---

## 12. Prompt Instructions for AI Systems

When asked to generate UI in the Aerchain Canva style, follow these rules exactly:

1. **Always use light theme** — white cards on #FAFAFA background
2. **Gradient primary** (`#8B5CF6 → #06B6D4` at 135deg) for: buttons, active nav, section titles, KPI values
3. **Gradient header** (`#DBEAFE → #E9D5FF → #CFFAFE`) for top bar only
4. **Pill-shaped buttons** (border-radius: 100px) for all primary CTAs
5. **Generous border-radius**: 16px cards, 12px inputs, 100px buttons/badges
6. **DM Sans** for UI text, **JetBrains Mono** for numbers/data/timestamps
7. **Colored badges** with light background + matching border + matching text (see Section 8.2)
8. **Gradient avatars** with 2-letter initials for user/client references
9. **Top accent bar** (4px height) on KPI cards using gradient matching the metric's semantic color
10. **Purple focus ring** (3px spread, 12% opacity) on all form inputs
11. **Upload zones** use dashed purple border on light purple background
12. **File type badges** use distinct colors per format (CSV=blue, PDF=red, XLSX=green, etc.)
13. **No dark mode** — this is a light-only design system
14. **Shadows are subtle** — use rgba(0,0,0,0.04) base, increase on hover
15. **Hover lift** — cards translateY(-2px) on hover with deeper shadow

---

*Generated March 2026 — Aerchain Sales OS Design System v1.0*
