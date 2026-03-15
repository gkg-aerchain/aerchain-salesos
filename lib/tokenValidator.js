// ═══════════════════════════════════════════════════════════
// TOKEN VALIDATOR — Layer 2
// Validates + auto-corrects extracted tokens with guardrails.
// Checks contrast ratios, opacity hierarchies, radius
// consistency, shadow spread rules, and clashing colors.
// Returns corrected tokens + a diagnostics array.
// ═══════════════════════════════════════════════════════════

import { BRAND } from "./brandConfig.js";

// ── Public API ───────────────────────────────────────────

export function validateTokens(tokens) {
  const diagnostics = [];
  const colors = { ...tokens.colors };
  const typography = { ...tokens.typography };
  const radius = { ...tokens.radius };
  const shadows = { ...tokens.shadows };
  const components = { ...tokens.components };

  // 1. Text contrast — ensure text is readable on backgrounds
  validateTextContrast(colors, diagnostics);

  // 2. Text opacity hierarchy — primary > secondary > muted
  validateTextHierarchy(colors, diagnostics);

  // 3. Radius scale consistency
  validateRadiusScale(radius, diagnostics);

  // 4. Color clashing — semantic colors shouldn't be too close
  validateSemanticSeparation(colors, diagnostics);

  // 5. Typography — ensure required fonts present
  validateTypography(typography, diagnostics);

  // 6. Badge color integrity
  validateBadgeColors(colors, diagnostics);

  // 7. Component completeness
  validateComponentCompleteness(components, colors, diagnostics);

  return {
    ...tokens,
    colors,
    typography,
    radius,
    shadows,
    components,
    _diagnostics: diagnostics,
  };
}

// ── Contrast Validation ─────────────────────────────────

function validateTextContrast(colors, diagnostics) {
  const pairs = [
    ["textPrimary", "contentBg", 4.5],
    ["textPrimary", "cardBg", 4.5],
    ["textSecondary", "contentBg", 3.0],
    ["textMuted", "contentBg", 2.0],
  ];

  for (const [fgKey, bgKey, minRatio] of pairs) {
    const fg = colors[fgKey]?.hex;
    const bg = colors[bgKey]?.hex;
    if (!fg || !bg) continue;

    const ratio = contrastRatio(fg, bg);
    if (ratio < minRatio) {
      diagnostics.push({
        level: "warn",
        rule: "contrast",
        message: `${fgKey} on ${bgKey}: contrast ${ratio.toFixed(1)}:1 < ${minRatio}:1`,
        fix: "auto-adjusted",
      });

      // Auto-fix: push text further from background luminance
      const bgHSL = hexToHSL(bg);
      const fgHSL = hexToHSL(fg);
      if (bgHSL.l > 50) {
        // Light bg → darken text
        fgHSL.l = Math.max(0, fgHSL.l - 15);
      } else {
        // Dark bg → lighten text
        fgHSL.l = Math.min(100, fgHSL.l + 15);
      }
      colors[fgKey] = { ...colors[fgKey], hex: hslToHex(fgHSL.h, fgHSL.s, fgHSL.l) };
    }
  }
}

// ── Text Hierarchy ──────────────────────────────────────

function validateTextHierarchy(colors, diagnostics) {
  const primary = colors.textPrimary?.hex;
  const secondary = colors.textSecondary?.hex;
  const muted = colors.textMuted?.hex;

  if (!primary || !secondary || !muted) return;

  const bg = colors.contentBg?.hex || "#FFFFFF";
  const pRatio = contrastRatio(primary, bg);
  const sRatio = contrastRatio(secondary, bg);
  const mRatio = contrastRatio(muted, bg);

  // Hierarchy must be: primary > secondary > muted
  if (sRatio >= pRatio) {
    diagnostics.push({
      level: "warn",
      rule: "text-hierarchy",
      message: `textSecondary (${sRatio.toFixed(1)}) has more contrast than textPrimary (${pRatio.toFixed(1)})`,
      fix: "swapped",
    });
    // Swap
    [colors.textPrimary, colors.textSecondary] = [colors.textSecondary, colors.textPrimary];
  }

  if (mRatio >= sRatio) {
    diagnostics.push({
      level: "warn",
      rule: "text-hierarchy",
      message: `textMuted (${mRatio.toFixed(1)}) has more contrast than textSecondary (${sRatio.toFixed(1)})`,
      fix: "swapped",
    });
    [colors.textSecondary, colors.textMuted] = [colors.textMuted, colors.textSecondary];
  }
}

// ── Radius Scale ────────────────────────────────────────

function validateRadiusScale(radius, diagnostics) {
  const keys = ["sm", "md", "lg", "xl"];
  const vals = keys.map(k => radius[k]?.value ? parseFloat(radius[k].value) : null).filter(Boolean);

  if (vals.length < 2) return;

  // Check monotonically increasing
  for (let i = 1; i < vals.length; i++) {
    if (vals[i] <= vals[i - 1]) {
      diagnostics.push({
        level: "warn",
        rule: "radius-scale",
        message: `Radius scale not monotonic: ${keys[i - 1]}=${vals[i - 1]}px >= ${keys[i]}=${vals[i]}px`,
        fix: "auto-corrected",
      });
      // Fix: ensure each step is at least 2px more than previous
      const fixed = vals[i - 1] + 2;
      radius[keys[i]] = { ...radius[keys[i]], value: `${fixed}px` };
      vals[i] = fixed;
    }
  }
}

// ── Semantic Color Separation ───────────────────────────

function validateSemanticSeparation(colors, diagnostics) {
  const roles = [
    ["success", "primary"],
    ["warning", "error"],
    ["success", "warning"],
  ];

  for (const [a, b] of roles) {
    const cA = colors[a]?.hex;
    const cB = colors[b]?.hex;
    if (!cA || !cB) continue;

    const hslA = hexToHSL(cA);
    const hslB = hexToHSL(cB);
    const hueDiff = Math.abs(hslA.h - hslB.h);
    const effectiveDiff = Math.min(hueDiff, 360 - hueDiff);

    if (effectiveDiff < 25) {
      diagnostics.push({
        level: "warn",
        rule: "color-separation",
        message: `${a} (h=${hslA.h}) and ${b} (h=${hslB.h}) are too close (${effectiveDiff}° apart, need 25°+)`,
        fix: "flagged — manual review suggested",
      });
    }
  }
}

// ── Typography Validation ───────────────────────────────

function validateTypography(typography, diagnostics) {
  if (!typography.fontFamily) return;

  const family = typography.fontFamily.toLowerCase();
  const required = BRAND.requiredFontFamily.toLowerCase();

  // Soft check: if a font is extracted, we don't override it,
  // but we note if Montserrat isn't present
  if (!family.includes(required)) {
    diagnostics.push({
      level: "info",
      rule: "typography",
      message: `Font "${typography.fontFamily}" detected — Aerchain brand uses ${BRAND.requiredFontFamily}`,
      fix: "none — extracted font respected",
    });
  }

  // Ensure mono family is set
  if (!typography.monoFamily || typography.monoFamily === "monospace") {
    typography.monoFamily = `'${BRAND.monoFontFamily}', monospace`;
    diagnostics.push({
      level: "info",
      rule: "typography",
      message: `Set mono font to ${BRAND.monoFontFamily} (brand default for numeric data)`,
      fix: "auto-set",
    });
  }
}

// ── Badge Color Validation ──────────────────────────────

function validateBadgeColors(colors, diagnostics) {
  const roles = ["primary", "success", "warning", "error"];

  for (const role of roles) {
    const badge = colors[`${role}Badge`];
    if (!badge?.bg || !badge?.text) continue;

    // Ensure badge text is actually darker / more readable than bg
    // (bg should be translucent, text should be solid)
    if (badge.text.includes("rgba") || badge.text.includes("rgb")) {
      diagnostics.push({
        level: "warn",
        rule: "badge-color",
        message: `${role}Badge text should be a solid color, not translucent`,
        fix: "flagged",
      });
    }
  }
}

// ── Component Completeness ──────────────────────────────

function validateComponentCompleteness(components, colors, diagnostics) {
  const required = ["button", "badge", "card", "input"];

  for (const comp of required) {
    if (!components[comp]) {
      diagnostics.push({
        level: "info",
        rule: "component-completeness",
        message: `Missing component definition: ${comp}`,
        fix: "none",
      });
    }
  }

  // Button should have at least a primary variant
  const bv = components.button?.variants;
  if (components.button && (!bv || (Array.isArray(bv) ? bv.length === 0 : Object.keys(bv).length === 0))) {
    diagnostics.push({
      level: "warn",
      rule: "component-completeness",
      message: "Button has no variants defined",
      fix: "should be resolved by tokenDeriver",
    });
  }
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

function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function luminance(hex) {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const toLinear = (c) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(hex1, hex2) {
  const l1 = luminance(hex1);
  const l2 = luminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
