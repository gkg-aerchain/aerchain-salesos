// ═══════════════════════════════════════════════════════════
// PROGRAMMATIC DESIGN TOKEN EXTRACTOR
// Client-side extraction for HTML/CSS — no API call needed.
// Renders HTML in a hidden iframe, walks DOM with getComputedStyle,
// or parses CSS with regex. Returns the same token JSON schema
// that the Claude API extraction returns.
// ═══════════════════════════════════════════════════════════

const INSTANT_EXTS = new Set(["html", "htm", "css"]);
const MAX_ELEMENTS = 2000;

// ── Public API ───────────────────────────────────────────

export function canExtractProgrammatically(files) {
  if (!files || files.length === 0) return false;
  return files.every(f => {
    const ext = f.name.split(".").pop().toLowerCase();
    return INSTANT_EXTS.has(ext);
  });
}

export async function extractFromHTML(htmlString) {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:1280px;height:900px;opacity:0;pointer-events:none;";
    iframe.sandbox = "allow-same-origin";
    document.body.appendChild(iframe);

    iframe.onload = () => {
      try {
        const doc = iframe.contentDocument;
        if (!doc || !doc.body) throw new Error("Cannot access iframe document");

        // Also extract CSS from <style> tags for font-family detection
        const styleText = Array.from(doc.querySelectorAll("style"))
          .map(s => s.textContent).join("\n");
        const cssTokens = parseCSS(styleText);

        const domTokens = walkDOM(doc);
        const merged = mergeExtracted(domTokens, cssTokens);
        const tokens = buildTokenSchema(merged);
        resolve(tokens);
      } catch (e) {
        reject(e);
      } finally {
        document.body.removeChild(iframe);
      }
    };

    iframe.onerror = () => {
      document.body.removeChild(iframe);
      reject(new Error("Failed to load HTML in iframe"));
    };

    iframe.srcdoc = htmlString;
  });
}

export function extractFromCSS(cssString) {
  const extracted = parseCSS(cssString);
  return buildTokenSchema(extracted);
}

// ── DOM Walker ───────────────────────────────────────────

function walkDOM(doc) {
  const colors = new Map();     // hex -> { count, contexts: Set }
  const fonts = new Map();      // family -> count
  const fontSizes = new Map();  // size -> { count, weights: Map<weight,count> }
  const spacings = new Set();
  const radii = new Set();
  const shadows = new Set();
  const gradients = new Set();

  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT);
  let count = 0;
  let node = walker.currentNode;

  while (node && count < MAX_ELEMENTS) {
    const cs = doc.defaultView.getComputedStyle(node);

    // Colors
    collectColor(cs.color, "text", colors);
    collectColor(cs.backgroundColor, "bg", colors);
    collectColor(cs.borderTopColor, "border", colors);
    collectColor(cs.borderLeftColor, "border", colors);

    // Typography
    const family = cs.fontFamily.split(",")[0].trim().replace(/['"]/g, "");
    if (family && family !== "serif" && family !== "sans-serif" && family !== "monospace") {
      fonts.set(family, (fonts.get(family) || 0) + 1);
    }
    const size = cs.fontSize;
    if (size && size !== "0px") {
      const entry = fontSizes.get(size) || { count: 0, weights: new Map() };
      entry.count++;
      const w = cs.fontWeight;
      entry.weights.set(w, (entry.weights.get(w) || 0) + 1);
      fontSizes.set(size, entry);
    }

    // Spacing
    for (const prop of ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "marginTop", "marginRight", "marginBottom", "marginLeft"]) {
      const v = cs[prop];
      if (v && v !== "0px" && v !== "auto") spacings.add(v);
    }
    if (cs.gap && cs.gap !== "normal" && cs.gap !== "0px") spacings.add(cs.gap);

    // Radius
    const br = cs.borderRadius;
    if (br && br !== "0px") radii.add(br);

    // Shadows
    const bs = cs.boxShadow;
    if (bs && bs !== "none") shadows.add(bs);

    // Gradients
    const bg = cs.backgroundImage;
    if (bg && bg.includes("gradient")) gradients.add(bg);

    node = walker.nextNode();
    count++;
  }

  return { colors, fonts, fontSizes, spacings, radii, shadows, gradients, cssVars: new Map() };
}

// ── CSS Parser (regex-based) ─────────────────────────────

function parseCSS(cssText) {
  const colors = new Map();
  const fonts = new Map();
  const fontSizes = new Map();
  const spacings = new Set();
  const radii = new Set();
  const shadows = new Set();
  const gradients = new Set();
  const cssVars = new Map(); // --var-name -> resolved value

  if (!cssText) return { colors, fonts, fontSizes, spacings, radii, shadows, gradients, cssVars };

  // ── Extract @import URLs (Google Fonts, etc.) ──────────
  const importMatch = cssText.match(/@import\s+url\(['"]?(https:\/\/fonts\.googleapis\.com[^'")\s]+)['"]?\)/);
  if (importMatch) {
    cssVars.set("__googleFontsImport", importMatch[1]);
  }

  // ── Extract CSS custom properties from :root ──────────
  // This captures explicit design token declarations like --card-bg: #FFFFFF
  const rootMatch = cssText.match(/:root\s*\{([^}]+)\}/);
  if (rootMatch) {
    const rootBlock = rootMatch[1];
    const varRegex = /--([\w-]+)\s*:\s*([^;}]+)/g;
    let vm;
    while ((vm = varRegex.exec(rootBlock)) !== null) {
      const name = vm[1].trim();
      let val = vm[2].trim();
      // Resolve simple var() references within :root
      if (val.startsWith("var(")) {
        const ref = val.match(/var\(--([\w-]+)/);
        if (ref && cssVars.has(ref[1])) val = cssVars.get(ref[1]);
      }
      cssVars.set(name, val);
    }
  }

  // Extract color values
  const colorProps = /(?:color|background-color|border(?:-top|-right|-bottom|-left)?-color)\s*:\s*([^;}]+)/gi;
  let m;
  while ((m = colorProps.exec(cssText)) !== null) {
    const val = m[1].trim();
    const hex = toHex(val);
    if (hex) {
      const entry = colors.get(hex) || { count: 0, contexts: new Set() };
      entry.count++;
      if (m[0].startsWith("background")) entry.contexts.add("bg");
      else if (m[0].startsWith("border")) entry.contexts.add("border");
      else entry.contexts.add("text");
      colors.set(hex, entry);
    }
  }

  // Extract font families
  const fontMatch = /font-family\s*:\s*([^;}]+)/gi;
  while ((m = fontMatch.exec(cssText)) !== null) {
    const family = m[1].trim().split(",")[0].trim().replace(/['"]/g, "");
    if (family) fonts.set(family, (fonts.get(family) || 0) + 1);
  }

  // Extract font sizes
  const sizeMatch = /font-size\s*:\s*([^;}]+)/gi;
  while ((m = sizeMatch.exec(cssText)) !== null) {
    const size = m[1].trim();
    if (size.endsWith("px") || size.endsWith("rem") || size.endsWith("em")) {
      const entry = fontSizes.get(size) || { count: 0, weights: new Map() };
      entry.count++;
      fontSizes.set(size, entry);
    }
  }

  // Extract spacing
  const spacingMatch = /(?:padding|margin|gap)\s*:\s*([^;}]+)/gi;
  while ((m = spacingMatch.exec(cssText)) !== null) {
    const vals = m[1].trim().split(/\s+/);
    vals.forEach(v => { if (v !== "0" && v !== "0px" && v !== "auto") spacings.add(v); });
  }

  // Extract border-radius
  const radiusMatch = /border-radius\s*:\s*([^;}]+)/gi;
  while ((m = radiusMatch.exec(cssText)) !== null) {
    const v = m[1].trim();
    if (v !== "0" && v !== "0px") radii.add(v);
  }

  // Extract box-shadow
  const shadowMatch = /box-shadow\s*:\s*([^;}]+)/gi;
  while ((m = shadowMatch.exec(cssText)) !== null) {
    const v = m[1].trim();
    if (v !== "none") shadows.add(v);
  }

  // Extract gradients
  const gradientMatch = /((?:linear|radial|conic)-gradient\([^)]+\))/gi;
  while ((m = gradientMatch.exec(cssText)) !== null) {
    gradients.add(m[1]);
  }

  // Extract font-weight values
  const weightMatch = /font-weight\s*:\s*([^;}]+)/gi;
  while ((m = weightMatch.exec(cssText)) !== null) {
    // Associate with last seen font-size if possible
    const w = m[1].trim();
    for (const [size, entry] of fontSizes) {
      entry.weights.set(w, (entry.weights.get(w) || 0) + 1);
    }
  }

  return { colors, fonts, fontSizes, spacings, radii, shadows, gradients, cssVars };
}

// ── Post-Processing ──────────────────────────────────────

function mergeExtracted(a, b) {
  // Merge two extracted objects
  const colors = new Map(a.colors);
  for (const [hex, entry] of b.colors) {
    const existing = colors.get(hex) || { count: 0, contexts: new Set() };
    existing.count += entry.count;
    entry.contexts.forEach(c => existing.contexts.add(c));
    colors.set(hex, existing);
  }

  const fonts = new Map(a.fonts);
  for (const [f, c] of b.fonts) fonts.set(f, (fonts.get(f) || 0) + c);

  const fontSizes = new Map(a.fontSizes);
  for (const [s, e] of b.fontSizes) {
    const existing = fontSizes.get(s) || { count: 0, weights: new Map() };
    existing.count += e.count;
    for (const [w, c] of e.weights) existing.weights.set(w, (existing.weights.get(w) || 0) + c);
    fontSizes.set(s, existing);
  }

  // Merge CSS custom properties (later files override)
  const cssVars = new Map([...(a.cssVars || new Map()), ...(b.cssVars || new Map())]);

  return {
    colors,
    fonts,
    fontSizes,
    spacings: new Set([...a.spacings, ...b.spacings]),
    radii: new Set([...a.radii, ...b.radii]),
    shadows: new Set([...a.shadows, ...b.shadows]),
    gradients: new Set([...a.gradients, ...b.gradients]),
    cssVars,
  };
}

function buildTokenSchema(extracted) {
  const { colors, fonts, fontSizes, spacings, radii, shadows, gradients, cssVars } = extracted;

  return {
    meta: {
      name: inferName(cssVars),
      description: "Programmatically extracted from HTML/CSS — no API used",
      theme: inferTheme(colors),
      inspiration: "Extracted from source code",
    },
    colors: buildColorTokens(colors, cssVars),
    gradients: buildGradientTokens(gradients, cssVars),
    typography: buildTypographyTokens(fonts, fontSizes, cssVars),
    spacing: buildSpacingTokens(spacings),
    radius: buildRadiusTokens(radii),
    shadows: buildShadowTokens(shadows, cssVars),
    components: inferComponents(extracted),
    designPrinciples: inferPrinciples(extracted),
  };
}

function inferName(cssVars) {
  if (!cssVars || cssVars.size === 0) return "Extracted Design System";
  // Try to infer a name from common patterns
  return "Extracted Design System";
}

// ── Color Helpers ────────────────────────────────────────

function collectColor(val, context, colorMap) {
  if (!val || val === "rgba(0, 0, 0, 0)" || val === "transparent") return;
  const hex = toHex(val);
  if (!hex) return;
  const entry = colorMap.get(hex) || { count: 0, contexts: new Set() };
  entry.count++;
  entry.contexts.add(context);
  colorMap.set(hex, entry);
}

function toHex(val) {
  if (!val) return null;
  val = val.trim();

  // Already hex
  if (/^#[0-9a-fA-F]{3,8}$/.test(val)) {
    if (val.length === 4) return `#${val[1]}${val[1]}${val[2]}${val[2]}${val[3]}${val[3]}`.toUpperCase();
    return val.toUpperCase();
  }

  // rgb/rgba
  const rgbMatch = val.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch;
    return `#${(+r).toString(16).padStart(2, "0")}${(+g).toString(16).padStart(2, "0")}${(+b).toString(16).padStart(2, "0")}`.toUpperCase();
  }

  // hsl
  const hslMatch = val.match(/hsla?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)%?\s*[, ]\s*([\d.]+)%?/);
  if (hslMatch) {
    const [, h, s, l] = hslMatch.map(Number);
    return hslToHex(h, s, l);
  }

  return null;
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

function hexToHSL(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
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

function inferTheme(colors) {
  // Check if most bg colors are dark
  let darkBg = 0, lightBg = 0;
  for (const [hex, entry] of colors) {
    if (entry.contexts.has("bg")) {
      const { l } = hexToHSL(hex);
      if (l < 40) darkBg++; else lightBg++;
    }
  }
  return darkBg > lightBg ? "dark" : "light";
}

function buildColorTokens(colorMap, cssVars) {
  const result = {};

  // ── STRATEGY 1: CSS Custom Properties (authoritative) ──
  // If the source defines semantic CSS vars, use them directly.
  // This is far more reliable than frequency-based guessing.
  if (cssVars && cssVars.size > 0) {
    const varColorMap = buildColorMapFromVars(cssVars);
    if (varColorMap) Object.assign(result, varColorMap);
  }

  // ── STRATEGY 2: Frequency-based heuristics (fallback) ──
  // Only fill in roles that weren't resolved from CSS vars.
  const sorted = [...colorMap.entries()].sort((a, b) => b[1].count - a[1].count);
  const textColors = sorted.filter(([, e]) => e.contexts.has("text"));
  const bgColors = sorted.filter(([, e]) => e.contexts.has("bg"));
  const borderColors = sorted.filter(([, e]) => e.contexts.has("border"));

  // Find primary: most-saturated, most-frequent non-gray color
  const saturated = sorted.filter(([hex]) => { const { s } = hexToHSL(hex); return s > 30; });
  if (!result.primary && saturated.length > 0) {
    result.primary = { hex: saturated[0][0], name: "Primary", usage: "Main accent color" };
  }
  if (!result.secondary && saturated.length > 1) {
    result.secondary = { hex: saturated[1][0], name: "Secondary", usage: "Secondary accent" };
  }

  // Map well-known color roles by hue
  for (const [hex] of saturated) {
    const { h, s } = hexToHSL(hex);
    if (s < 20) continue;
    if (h >= 100 && h <= 170 && !result.success) result.success = { hex, name: "Success", usage: "Success states" };
    if (h >= 30 && h <= 50 && !result.warning) result.warning = { hex, name: "Warning", usage: "Warning states" };
    if ((h <= 15 || h >= 345) && !result.error) result.error = { hex, name: "Error", usage: "Error states" };
  }

  // Background colors — prefer unsaturated, high-lightness colors
  if (!result.contentBg || !result.cardBg) {
    const neutralBgs = bgColors
      .map(([hex, entry]) => ({ hex, entry, ...hexToHSL(hex) }))
      .filter(c => c.s < 15 && c.l > 85)
      .sort((a, b) => b.entry.count - a.entry.count);
    if (!result.contentBg && neutralBgs.length > 0) {
      result.contentBg = { hex: neutralBgs[0].hex, name: "Background", usage: "Page background" };
    }
    if (!result.cardBg && neutralBgs.length > 1) {
      result.cardBg = { hex: neutralBgs[1].hex, name: "Card Surface", usage: "Card background" };
    } else if (!result.cardBg && neutralBgs.length === 1) {
      // If only one neutral bg, use white for card
      result.cardBg = { hex: "#FFFFFF", name: "Card Surface", usage: "Card background" };
    }
  }
  // Fallback: if still no contentBg, use the lightest bg color
  if (!result.contentBg && bgColors.length > 0) {
    const lightest = bgColors.map(([hex]) => ({ hex, ...hexToHSL(hex) })).sort((a, b) => b.l - a.l)[0];
    result.contentBg = { hex: lightest.hex, name: "Background", usage: "Page background" };
  }
  if (!result.cardBg) result.cardBg = { hex: "#FFFFFF", name: "Card Surface", usage: "Card background" };

  // Text colors — prefer dark, unsaturated colors
  if (!result.textPrimary) {
    const darkTexts = textColors
      .map(([hex, entry]) => ({ hex, entry, ...hexToHSL(hex) }))
      .filter(c => c.l < 50)
      .sort((a, b) => a.l - b.l);
    if (darkTexts.length > 0) result.textPrimary = { hex: darkTexts[0].hex, name: "Text Primary", usage: "Main text" };
    else if (textColors.length > 0) result.textPrimary = { hex: textColors[0][0], name: "Text Primary", usage: "Main text" };
  }
  if (!result.textSecondary && textColors.length > 1) {
    const mids = textColors
      .map(([hex, entry]) => ({ hex, entry, ...hexToHSL(hex) }))
      .filter(c => c.l >= 30 && c.l <= 60 && c.s < 20)
      .sort((a, b) => b.entry.count - a.entry.count);
    if (mids.length > 0) result.textSecondary = { hex: mids[0].hex, name: "Text Secondary", usage: "Secondary text" };
    else result.textSecondary = { hex: textColors[1][0], name: "Text Secondary", usage: "Secondary text" };
  }
  if (!result.textMuted && textColors.length > 2) {
    const muted = textColors
      .map(([hex, entry]) => ({ hex, entry, ...hexToHSL(hex) }))
      .filter(c => c.l >= 50 && c.s < 20)
      .sort((a, b) => b.entry.count - a.entry.count);
    if (muted.length > 0) result.textMuted = { hex: muted[0].hex, name: "Text Muted", usage: "Muted text" };
    else result.textMuted = { hex: textColors[2][0], name: "Text Muted", usage: "Muted text" };
  }

  // Border — prefer low-saturation, high-lightness colors
  if (!result.cardBorder) {
    const neutralBorders = borderColors
      .map(([hex, entry]) => ({ hex, entry, ...hexToHSL(hex) }))
      .filter(c => c.s < 15 && c.l > 80)
      .sort((a, b) => b.entry.count - a.entry.count);
    if (neutralBorders.length > 0) result.cardBorder = { hex: neutralBorders[0].hex, name: "Border", usage: "Borders, dividers" };
    else if (borderColors.length > 0) result.cardBorder = { hex: borderColors[0][0], name: "Border", usage: "Borders, dividers" };
  }

  return result;
}

// ── CSS Variable → Token Mapping ─────────────────────────
// Maps well-known CSS custom property names to token roles.
const VAR_TO_TOKEN = {
  // Background surfaces
  "content-bg":    { role: "contentBg",    name: "Background",      usage: "Page background" },
  "bg":            { role: "contentBg",    name: "Background",      usage: "Page background" },
  "page-bg":       { role: "contentBg",    name: "Background",      usage: "Page background" },
  "card-bg":       { role: "cardBg",       name: "Card Surface",    usage: "Card background" },
  "surface":       { role: "cardBg",       name: "Card Surface",    usage: "Card background" },
  "sidebar-bg":    { role: "sidebarBg",    name: "Sidebar",         usage: "Sidebar background" },
  // Borders
  "card-border":   { role: "cardBorder",   name: "Border",          usage: "Borders, dividers" },
  "border":        { role: "cardBorder",   name: "Border",          usage: "Borders, dividers" },
  "divider":       { role: "cardBorder",   name: "Border",          usage: "Borders, dividers" },
  "sidebar-divider": { role: "cardBorder", name: "Border",          usage: "Borders, dividers" },
  // Text
  "text-primary":  { role: "textPrimary",  name: "Text Primary",    usage: "Main text" },
  "text-secondary":{ role: "textSecondary",name: "Text Secondary",  usage: "Secondary text" },
  "text-muted":    { role: "textMuted",    name: "Text Muted",      usage: "Muted text" },
  "fg":            { role: "textPrimary",  name: "Text Primary",    usage: "Main text" },
  "fg-secondary":  { role: "textSecondary",name: "Text Secondary",  usage: "Secondary text" },
  "fg-muted":      { role: "textMuted",    name: "Text Muted",      usage: "Muted text" },
  // Accent colors
  "purple":        { role: "primary",      name: "Primary",         usage: "Primary accent" },
  "primary":       { role: "primary",      name: "Primary",         usage: "Primary accent" },
  "accent":        { role: "primary",      name: "Primary",         usage: "Primary accent" },
  "teal":          { role: "secondary",    name: "Secondary",       usage: "Secondary accent" },
  "secondary":     { role: "secondary",    name: "Secondary",       usage: "Secondary accent" },
  // Semantic
  "emerald":       { role: "success",      name: "Success",         usage: "Success states" },
  "success":       { role: "success",      name: "Success",         usage: "Success states" },
  "green":         { role: "success",      name: "Success",         usage: "Success states" },
  "amber":         { role: "warning",      name: "Warning",         usage: "Warning states" },
  "warning":       { role: "warning",      name: "Warning",         usage: "Warning states" },
  "red":           { role: "error",        name: "Error",           usage: "Error states" },
  "error":         { role: "error",        name: "Error",           usage: "Error states" },
  "danger":        { role: "error",        name: "Error",           usage: "Error states" },
  // Brand
  "brand":         { role: "brand",        name: "Brand",           usage: "Brand identity" },
  // Light variants
  "purple-light":  { role: "primaryLight", name: "Primary Light",   usage: "Primary light bg" },
  "primary-light": { role: "primaryLight", name: "Primary Light",   usage: "Primary light bg" },
  "purple-border": { role: "primaryBorder",name: "Primary Border",  usage: "Primary border" },
  "primary-border":{ role: "primaryBorder",name: "Primary Border",  usage: "Primary border" },
  "teal-light":    { role: "secondaryLight",name: "Secondary Light", usage: "Secondary light bg" },
  "teal-border":   { role: "secondaryBorder",name: "Secondary Border",usage: "Secondary border" },
  "emerald-light": { role: "successLight", name: "Success Light",   usage: "Success light bg" },
  "success-light": { role: "successLight", name: "Success Light",   usage: "Success light bg" },
  "amber-light":   { role: "warningLight", name: "Warning Light",   usage: "Warning light bg" },
  "warning-light": { role: "warningLight", name: "Warning Light",   usage: "Warning light bg" },
  "red-light":     { role: "errorLight",   name: "Error Light",     usage: "Error light bg" },
  "error-light":   { role: "errorLight",   name: "Error Light",     usage: "Error light bg" },
};

function buildColorMapFromVars(cssVars) {
  const result = {};
  let matched = 0;

  for (const [name, value] of cssVars) {
    const mapping = VAR_TO_TOKEN[name];
    if (!mapping) continue;
    const hex = toHex(value);
    if (!hex) continue;
    // Don't overwrite if already set (first match wins for each role)
    if (!result[mapping.role]) {
      result[mapping.role] = { hex, name: mapping.name, usage: mapping.usage };
      matched++;
    }
  }

  // Only use var-based mapping if we got meaningful coverage
  return matched >= 3 ? result : null;
}

function buildGradientTokens(gradientSet, cssVars) {
  const result = [];

  // Prefer gradients from CSS vars (they have semantic names)
  if (cssVars) {
    const gradientVars = [
      { key: "gradient-primary", name: "Primary" },
      { key: "gradient-header", name: "Header" },
      { key: "gradient-warm", name: "Warm" },
      { key: "gradient-secondary", name: "Secondary" },
    ];
    for (const gv of gradientVars) {
      const val = cssVars.get(gv.key);
      if (val && val.includes("gradient")) {
        result.push({ name: gv.name, css: val, usage: `${gv.name} gradient` });
      }
    }
  }

  // Fill from DOM-extracted gradients
  const arr = [...gradientSet];
  for (const css of arr) {
    if (result.length >= 4) break;
    if (result.some(r => r.css === css)) continue;
    result.push({
      name: result.length === 0 ? "Primary" : `Gradient ${result.length + 1}`,
      css,
      usage: result.length === 0 ? "Primary gradient" : "Accent gradient",
    });
  }

  if (result.length === 0) return [{ name: "Primary", css: "linear-gradient(135deg, #8B5CF6, #06B6D4)", usage: "Primary gradient" }];
  return result;
}

function buildTypographyTokens(fonts, fontSizes, cssVars) {
  // Most frequent font = primary
  const sortedFonts = [...fonts.entries()].sort((a, b) => b[1] - a[1]);
  const primary = sortedFonts[0]?.[0] || "system-ui, sans-serif";
  const mono = sortedFonts.find(([f]) => /mono|code|courier/i.test(f))?.[0] || "monospace";

  // Try to get Google Fonts import from CSS
  let googleFontsImport = "";
  if (cssVars && cssVars.has("__googleFontsImport")) {
    googleFontsImport = cssVars.get("__googleFontsImport");
  }

  // Build type scale
  const sortedSizes = [...fontSizes.entries()]
    .map(([size, entry]) => ({ size, count: entry.count, weight: [...entry.weights.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "400" }))
    .sort((a, b) => parseFloat(b.size) - parseFloat(a.size));

  const scaleNames = ["Display", "Heading", "Subhead", "Body", "Caption", "Micro", "Tiny", "Fine"];
  const scale = sortedSizes.slice(0, 8).map((s, i) => ({
    name: scaleNames[i] || `Size ${i + 1}`,
    size: s.size,
    weight: s.weight,
    tracking: "normal",
    notes: i === 0 ? "Largest text" : i === sortedSizes.length - 1 ? "Smallest text" : "",
  }));

  return {
    fontFamily: `'${primary}', system-ui, sans-serif`,
    monoFamily: `'${mono}', monospace`,
    googleFontsImport,
    scale,
  };
}

function buildSpacingTokens(spacingSet) {
  const nums = [...spacingSet].map(v => parseFloat(v)).filter(n => n > 0 && n <= 200).sort((a, b) => a - b);
  const unique = [...new Set(nums)];
  const names = ["xs", "sm", "md", "lg", "xl", "xxl", "xxxl"];

  if (unique.length === 0) return { xs: "4px", sm: "8px", md: "12px", lg: "16px", xl: "24px", xxl: "32px", xxxl: "48px" };

  // Pick representative values
  const step = Math.max(1, Math.floor(unique.length / 7));
  const result = {};
  for (let i = 0; i < 7 && i * step < unique.length; i++) {
    result[names[i]] = `${unique[Math.min(i * step, unique.length - 1)]}px`;
  }
  return result;
}

function buildRadiusTokens(radiiSet) {
  const nums = [...radiiSet].map(v => parseFloat(v)).filter(n => n > 0).sort((a, b) => a - b);
  const unique = [...new Set(nums)];
  const names = ["sm", "md", "lg", "xl", "pill"];
  const usages = ["Small elements", "Inputs, buttons", "Cards, panels", "Large containers", "Pills, avatars"];

  if (unique.length === 0) return {
    sm: { value: "4px", usage: "Small elements" },
    md: { value: "8px", usage: "Buttons, inputs" },
    lg: { value: "12px", usage: "Cards" },
    xl: { value: "16px", usage: "Large containers" },
    pill: { value: "9999px", usage: "Pills" },
  };

  const result = {};
  const step = Math.max(1, Math.floor(unique.length / 5));
  for (let i = 0; i < 5 && i * step < unique.length; i++) {
    result[names[i]] = { value: `${unique[Math.min(i * step, unique.length - 1)]}px`, usage: usages[i] };
  }
  // Always add pill if a very large radius exists
  if (unique.some(v => v >= 50)) {
    result.pill = { value: `${unique[unique.length - 1]}px`, usage: "Pills, avatars" };
  }
  return result;
}

function buildShadowTokens(shadowSet, cssVars) {
  // Try CSS vars first
  if (cssVars) {
    const cardShadow = cssVars.get("card-shadow");
    if (cardShadow && cardShadow !== "none") {
      const result = { card: { css: cardShadow, usage: "Card surfaces" } };
      const arr = [...shadowSet].filter(s => s !== cardShadow);
      if (arr.length > 0) result.elevated = { css: arr[0], usage: "Elevated elements" };
      if (arr.length > 1) result.glow = { css: arr[1], usage: "Glow effects" };
      return result;
    }
  }
  const arr = [...shadowSet];
  if (arr.length === 0) return {
    card: { css: "0 2px 8px rgba(0,0,0,0.08)", usage: "Card shadow" },
    elevated: { css: "0 8px 24px rgba(0,0,0,0.12)", usage: "Elevated elements" },
  };
  const names = ["card", "elevated", "glow", "focus"];
  const usages = ["Card surfaces", "Elevated elements", "Glow effects", "Focus rings"];
  const result = {};
  arr.slice(0, 4).forEach((css, i) => {
    result[names[i] || `shadow${i}`] = { css, usage: usages[i] || "Shadow" };
  });
  return result;
}

function inferComponents(extracted) {
  // Best-effort component inference from raw data
  const radii = [...extracted.radii].map(v => parseFloat(v)).sort((a, b) => a - b);
  const smallRadius = radii.length > 0 ? `${radii[0]}px` : "4px";
  const medRadius = radii.length > 1 ? `${radii[Math.floor(radii.length / 2)]}px` : "8px";
  const lgRadius = radii.length > 2 ? `${radii[radii.length - 1]}px` : "12px";

  return {
    button: { borderRadius: medRadius, padding: "8px 18px", fontSize: "13px", fontWeight: "600" },
    badge: { borderRadius: smallRadius, padding: "3px 8px", fontSize: "11px", fontWeight: "600" },
    card: { borderRadius: lgRadius, padding: "16px", border: "1px solid #E5E7EB" },
    input: { borderRadius: medRadius, padding: "8px 12px", border: "1.5px solid #E5E7EB" },
    table: { headerFontSize: "10px", headerWeight: "700", headerTransform: "uppercase", cellPadding: "10px 12px" },
    sidebar: { width: "200px", itemPadding: "6px 8px", itemRadius: medRadius },
    avatar: { size: "32px", borderRadius: "50%" },
  };
}

function inferPrinciples(extracted) {
  const principles = [];
  const theme = inferTheme(extracted.colors);
  principles.push(theme === "dark" ? "Dark theme with luminous accent colors" : "Light theme with clean surfaces");

  if (extracted.gradients.size > 0) principles.push("Gradient accents for visual depth and energy");
  if (extracted.shadows.size > 2) principles.push("Layered shadows for spatial hierarchy");

  const radii = [...extracted.radii].map(v => parseFloat(v));
  if (radii.some(r => r >= 50)) principles.push("Pill-shaped elements (large border-radius) for interactive CTAs");
  else if (radii.every(r => r < 8)) principles.push("Subtle rounding — functional, not decorative");

  const fonts = [...extracted.fonts.entries()].sort((a, b) => b[1] - a[1]);
  if (fonts.length > 0) principles.push(`Typography anchored by ${fonts[0][0]}`);

  if (principles.length < 5) principles.push("Consistent spacing scale across all components");
  if (principles.length < 5) principles.push("Semantic color system mapping intent to palette");

  return principles;
}
