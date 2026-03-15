// ═══════════════════════════════════════════════════════════
// TOKEN DERIVER — Layer 1
// Auto-derives missing token variants from base colors.
// Fills gaps the raw extractor leaves: light bg variants,
// border variants, hover states, focus rings, button variants,
// badge colors, and glass surfaces.
// ═══════════════════════════════════════════════════════════

import { BRAND } from "./brandConfig.js";

// ── Public API ───────────────────────────────────────────

export function deriveTokens(tokens) {
  const theme = tokens.meta?.theme || "light";
  const colors = { ...tokens.colors };
  const components = { ...tokens.components };
  const shadows = { ...tokens.shadows };
  const gradients = { ...tokens.gradients };

  // 1. Derive light-bg and border variants for semantic colors
  deriveColorVariants(colors, theme);

  // 2. Derive hover states
  deriveHoverStates(colors, theme);

  // 3. Derive focus ring
  deriveFocusRing(colors);

  // 4. Derive glass surfaces
  deriveGlassSurfaces(colors, theme);

  // 5. Derive badge color set
  deriveBadgeColors(colors);

  // 6. Enrich button component with variants
  enrichButtonVariants(components, colors);

  // 7. Derive gradient if missing
  deriveGradient(gradients, colors);

  // 8. Derive shadow tint for light themes
  deriveShadowTint(shadows, colors, theme);

  return {
    ...tokens,
    colors,
    components,
    shadows,
    gradients,
  };
}

// ── Color Variant Derivation ────────────────────────────

const SEMANTIC_ROLES = ["primary", "secondary", "success", "warning", "error"];

function deriveColorVariants(colors, theme) {
  const { derivation } = BRAND;

  for (const role of SEMANTIC_ROLES) {
    const base = colors[role];
    if (!base?.hex) continue;

    const hsl = hexToHSL(base.hex);

    // Light bg variant (e.g. primaryLight)
    const lightKey = `${role}Light`;
    if (!colors[lightKey]) {
      if (theme === "dark") {
        // Dark theme: use base color at 10-12% opacity as rgba
        const rgb = hexToRGB(base.hex);
        colors[lightKey] = {
          hex: hslToHex(hsl.h, Math.min(hsl.s, 30), 15),
          rgba: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`,
          name: `${capitalize(role)} Light`,
          usage: `${capitalize(role)} tinted background`,
        };
      } else {
        // Light theme: very desaturated, very light
        const s = clamp(derivation.lightBg.s.min, derivation.lightBg.s.max, hsl.s * 0.2);
        const l = avg(derivation.lightBg.l.min, derivation.lightBg.l.max);
        colors[lightKey] = {
          hex: hslToHex(hsl.h, s, l),
          name: `${capitalize(role)} Light`,
          usage: `${capitalize(role)} tinted background`,
        };
      }
    }

    // Border variant (e.g. primaryBorder)
    const borderKey = `${role}Border`;
    if (!colors[borderKey]) {
      if (theme === "dark") {
        const rgb = hexToRGB(base.hex);
        colors[borderKey] = {
          hex: hslToHex(hsl.h, Math.min(hsl.s, 40), 25),
          rgba: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.20)`,
          name: `${capitalize(role)} Border`,
          usage: `${capitalize(role)} border accent`,
        };
      } else {
        const s = clamp(derivation.border.s.min, derivation.border.s.max, hsl.s * 0.4);
        const l = avg(derivation.border.l.min, derivation.border.l.max);
        colors[borderKey] = {
          hex: hslToHex(hsl.h, s, l),
          name: `${capitalize(role)} Border`,
          usage: `${capitalize(role)} border accent`,
        };
      }
    }
  }
}

function deriveHoverStates(colors, theme) {
  const shift = BRAND.derivation.hoverShift;

  for (const role of SEMANTIC_ROLES) {
    const base = colors[role];
    if (!base?.hex) continue;

    const hoverKey = `${role}Hover`;
    if (!colors[hoverKey]) {
      const hsl = hexToHSL(base.hex);
      // Dark theme: lighten on hover; light theme: darken on hover
      const newL = theme === "dark"
        ? Math.min(100, hsl.l + shift)
        : Math.max(0, hsl.l - shift);
      colors[hoverKey] = {
        hex: hslToHex(hsl.h, hsl.s, newL),
        name: `${capitalize(role)} Hover`,
        usage: `${capitalize(role)} hover state`,
      };
    }
  }
}

function deriveFocusRing(colors) {
  if (colors.focusRing) return;
  const primary = colors.primary;
  if (!primary?.hex) return;

  const rgb = hexToRGB(primary.hex);
  colors.focusRing = {
    hex: primary.hex,
    rgba: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${BRAND.derivation.focusRingAlpha})`,
    css: `0 0 0 3px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${BRAND.derivation.focusRingAlpha})`,
    name: "Focus Ring",
    usage: "Keyboard focus indicator",
  };
}

function deriveGlassSurfaces(colors, theme) {
  if (colors.glass1 && colors.glass2 && colors.glass3) return;

  const tiers = BRAND.glass;
  const mode = theme === "dark" ? "dark" : "light";
  const base = theme === "dark" ? "255, 255, 255" : "255, 255, 255";

  if (!colors.glass1) {
    colors.glass1 = {
      rgba: `rgba(${base}, ${tiers.panel.opacity[mode]})`,
      blur: `${tiers.panel.blur}px`,
      name: "Glass Panel",
      usage: "Large panels, sidebars",
    };
  }
  if (!colors.glass2) {
    colors.glass2 = {
      rgba: `rgba(${base}, ${tiers.card.opacity[mode]})`,
      blur: `${tiers.card.blur}px`,
      name: "Glass Card",
      usage: "Cards, modals",
    };
  }
  if (!colors.glass3) {
    colors.glass3 = {
      rgba: `rgba(${base}, ${tiers.input.opacity[mode]})`,
      blur: `${tiers.input.blur}px`,
      name: "Glass Input",
      usage: "Inputs, dropdowns",
    };
  }
}

function deriveBadgeColors(colors) {
  const roles = ["primary", "success", "warning", "error"];
  const { badge } = BRAND;
  const alpha = avg(badge.bgAlphaRange.min, badge.bgAlphaRange.max);

  for (const role of roles) {
    const base = colors[role];
    if (!base?.hex) continue;

    const badgeKey = `${role}Badge`;
    if (colors[badgeKey]) continue;

    const hsl = hexToHSL(base.hex);
    const rgb = hexToRGB(base.hex);

    colors[badgeKey] = {
      bg: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha.toFixed(2)})`,
      text: hslToHex(hsl.h, hsl.s, Math.max(15, hsl.l + badge.textLightnessShift)),
      name: `${capitalize(role)} Badge`,
      usage: `${capitalize(role)} status badge`,
    };
  }
}

// ── Component Enrichment ────────────────────────────────

function enrichButtonVariants(components, colors) {
  if (!components.button) return;

  // Only add variants if they don't exist
  if (components.button.variants && Object.keys(components.button.variants).length > 0) return;

  const variants = {};

  if (colors.primary?.hex) {
    const primaryHSL = hexToHSL(colors.primary.hex);
    const hoverHex = colors.primaryHover?.hex || hslToHex(primaryHSL.h, primaryHSL.s, primaryHSL.l - 5);
    variants.primary = {
      bg: colors.primary.hex,
      text: "#FFFFFF",
      hoverBg: hoverHex,
      border: "none",
    };
  }

  if (colors.secondary?.hex) {
    variants.secondary = {
      bg: "transparent",
      text: colors.secondary.hex,
      hoverBg: colors.secondaryLight?.hex || "#F3F4F6",
      border: `1.5px solid ${colors.secondary.hex}`,
    };
  }

  // Ghost / outline variant
  if (colors.primary?.hex) {
    variants.ghost = {
      bg: "transparent",
      text: colors.primary.hex,
      hoverBg: colors.primaryLight?.hex || "#F5F3FF",
      border: "none",
    };
  }

  // Destructive variant
  if (colors.error?.hex) {
    variants.destructive = {
      bg: colors.error.hex,
      text: "#FFFFFF",
      hoverBg: colors.errorHover?.hex || colors.error.hex,
      border: "none",
    };
  }

  components.button.variants = variants;
}

// ── Gradient Derivation ─────────────────────────────────

function deriveGradient(gradients, colors) {
  if (gradients.primary) return;

  const primary = colors.primary?.hex;
  const accent = colors.secondary?.hex || colors.primary?.hex;
  if (!primary) return;

  gradients.primary = {
    css: `linear-gradient(${BRAND.gradientAngle}deg, ${primary}, ${accent})`,
    usage: "Primary gradient for CTAs and hero elements",
  };
}

// ── Shadow Derivation ───────────────────────────────────

function deriveShadowTint(shadows, colors, theme) {
  if (shadows.glassShadow) return;
  if (theme !== "light") return;

  // Light themes get purple-tinted glass shadow
  const primary = colors.primary?.hex;
  if (!primary) {
    shadows.glassShadow = {
      css: `0 4px 20px 0 ${BRAND.shadow.light.tint}`,
      usage: "Glass shadow with brand tint",
    };
    return;
  }

  const rgb = hexToRGB(primary);
  shadows.glassShadow = {
    css: `0 4px 20px 0 rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05)`,
    usage: "Glass shadow with brand tint",
  };
}

// ── Color Utilities ─────────────────────────────────────

function hexToHSL(hex) {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;

  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hexToRGB(hex) {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16),
  };
}

function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = clamp(0, 100, s) / 100;
  l = clamp(0, 100, l) / 100;

  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function clamp(min, max, value) {
  return Math.max(min, Math.min(max, value));
}

function avg(a, b) {
  return (a + b) / 2;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
