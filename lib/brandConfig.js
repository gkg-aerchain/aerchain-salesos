// ═══════════════════════════════════════════════════════════
// AERCHAIN BRAND CONFIG — Layer 3
// Brand anchors and design constraints used by tokenDeriver
// and tokenValidator. These are soft defaults — extracted
// values always take priority when present.
// ═══════════════════════════════════════════════════════════

export const BRAND = {
  // ── Identity ──────────────────────────────────────────
  aerchainOrange: "#dc5f40",
  aerchainOrangeHSL: { h: 13, s: 68, l: 55 },

  // ── Primary palette hue ranges ────────────────────────
  // The extractor uses these to validate that derived tokens
  // stay within the intended hue family
  primaryHue: { min: 255, max: 280 },    // purple range
  accentHue: { min: 270, max: 285 },     // deeper purple / magenta
  successHue: { min: 140, max: 165 },    // green / emerald
  warningHue: { min: 30, max: 50 },      // amber / orange
  errorHue: { min: 345, max: 15 },       // red (wraps around 0)

  // ── Typography anchors ────────────────────────────────
  requiredFontFamily: "Montserrat",
  monoFontFamily: "JetBrains Mono",
  // Mono is used for ALL numeric / data content
  monoContexts: ["numbers", "kpi", "currency", "percentage", "table-data"],

  // ── Gradient formula ──────────────────────────────────
  gradientAngle: 135,
  // gradient = linear-gradient(135deg, primary, accent)

  // ── Glass morphism tiers ──────────────────────────────
  glass: {
    panel:  { blur: 40, opacity: { dark: 0.04, light: 0.60 } },
    card:   { blur: 20, opacity: { dark: 0.06, light: 0.70 } },
    input:  { blur: 10, opacity: { dark: 0.09, light: 0.80 } },
  },

  // ── Radius scale (px) ────────────────────────────────
  radiusScale: { lg: 14, md: 12, sm: 8, xs: 6 },

  // ── Shadow system ─────────────────────────────────────
  shadow: {
    dark:  { base: "rgba(0,0,0,0.4)",  tint: null },
    light: { base: "rgba(0,0,0,0.08)", tint: "rgba(124,58,237,0.05)" },
  },

  // ── Text opacity hierarchy (dark theme) ───────────────
  textOpacity: {
    primary:   0.92,
    secondary: 0.62,
    muted:     0.36,
  },

  // ── Badge color pattern ───────────────────────────────
  // bg = hsl(H S% L% / 0.10–0.15), text = same hue, darker
  badge: {
    bgAlphaRange: { min: 0.10, max: 0.15 },
    textLightnessShift: -20, // text is darker than base
  },

  // ── Derivation rules ──────────────────────────────────
  derivation: {
    // "Light" variant: same hue, 10-15% saturation, 95-97% lightness
    lightBg: { s: { min: 10, max: 15 }, l: { min: 93, max: 97 } },
    // "Border" variant: same hue, 25-35% saturation, 85-90% lightness
    border: { s: { min: 25, max: 35 }, l: { min: 85, max: 90 } },
    // "Hover" variant: same hue/sat, lightness ±5%
    hoverShift: 5,
    // Focus ring: primary color at 25% opacity
    focusRingAlpha: 0.25,
  },
};
