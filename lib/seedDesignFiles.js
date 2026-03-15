// ═══════════════════════════════════════════════════════════
// SEED DESIGN FILES — Pre-built Aerchain theme token files
// Manually extracted from the Aerchain SalesOS master HTML.
// These appear in the Design Extractor's file library on
// first load so the user can see both official themes.
// ═══════════════════════════════════════════════════════════

// ── HSL → Hex helper (inline to keep this file dependency-free) ──

function hsl(h, s, l) {
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

// ═══════════════════════════════════════════════════════════
// 1. AERCHAIN SALESOS — CLEAN / LIGHT THEME
// ═══════════════════════════════════════════════════════════

const lightTokens = {
  meta: {
    name: "Aerchain SalesOS — Clean / Light Theme",
    theme: "light",
    version: "1.0.0",
    source: "Manual extraction from master HTML (data-theme='clean')",
    extractedAt: "2026-03-15T00:00:00.000Z",
  },

  colors: {
    // ── Canvas & Backgrounds ──
    canvas:     { hex: "#F8F9FC", name: "Canvas", usage: "App background" },
    contentBg:  { hex: "#F8F9FC", name: "Content Background", usage: "Main content area" },
    cardBg:     { hex: "#FFFFFF", name: "Card Background", usage: "Cards, panels" },
    topbarBg:   { hex: "#FFFFFF", name: "Topbar Background", usage: "Top navigation bar" },
    sidebarBg:  { hex: "#FFFFFF", name: "Sidebar Background", usage: "Left sidebar" },

    // ── Primary & Accent ──
    primary:    { hex: hsl(262, 65, 52), name: "Primary", usage: "Primary actions, brand anchor" },
    accent:     { hex: hsl(275, 70, 55), name: "Accent", usage: "Secondary brand accent" },
    secondary:  { hex: hsl(275, 70, 55), name: "Secondary", usage: "Secondary actions" },

    // ── Semantic Colors ──
    success:    { hex: hsl(152, 55, 42), name: "Success / Green", usage: "Positive states, confirmations" },
    warning:    { hex: hsl(38, 80, 48),  name: "Warning / Amber", usage: "Caution states, alerts" },
    error:      { hex: hsl(0, 65, 52),   name: "Error / Red", usage: "Destructive actions, errors" },

    // ── Text Hierarchy ──
    textPrimary:   { hex: "#111827", name: "Text Primary", usage: "Headings, body text" },
    textSecondary: { hex: "#6B7280", name: "Text Secondary", usage: "Descriptions, labels" },
    textMuted:     { hex: "#9CA3AF", name: "Text Muted", usage: "Placeholders, hints" },

    // ── Glass Surfaces ──
    glass1: { hex: "#FFFFFF", rgba: "rgba(255, 255, 255, 1.0)", blur: "0px", name: "Glass Panel", usage: "Flat panels, sidebars (no glass in clean theme)" },
    glass2: { hex: "#F3F4F6", rgba: "rgba(243, 244, 246, 1.0)", blur: "0px", name: "Glass Card", usage: "Cards, badges" },
    glass3: { hex: "#FFFFFF", rgba: "rgba(255, 255, 255, 1.0)", blur: "0px", name: "Glass Input", usage: "Inputs, dropdowns" },

    // ── Borders ──
    border:        { hex: "#E5E7EB", name: "Border", usage: "Default borders" },
    glassBorder:   { hex: "#E5E7EB", name: "Glass Border", usage: "Glass element borders" },

    // ── Badge Backgrounds ──
    badgeBg:       { hex: "#F3F4F6", name: "Badge Background", usage: "Default badge background" },

    // ── Derived: Light bg variants ──
    primaryLight:   { hex: hsl(262, 15, 95), name: "Primary Light", usage: "Primary tinted background" },
    successLight:   { hex: hsl(152, 15, 95), name: "Success Light", usage: "Success tinted background" },
    warningLight:   { hex: hsl(38, 15, 95),  name: "Warning Light", usage: "Warning tinted background" },
    errorLight:     { hex: hsl(0, 15, 95),   name: "Error Light", usage: "Error tinted background" },

    // ── Derived: Hover states ──
    primaryHover:   { hex: hsl(262, 65, 46), name: "Primary Hover", usage: "Primary hover state" },
    successHover:   { hex: hsl(152, 55, 36), name: "Success Hover", usage: "Success hover state" },
    warningHover:   { hex: hsl(38, 80, 42),  name: "Warning Hover", usage: "Warning hover state" },
    errorHover:     { hex: hsl(0, 65, 46),   name: "Error Hover", usage: "Error hover state" },

    // ── Derived: Border variants ──
    primaryBorder:  { hex: hsl(262, 20, 88), name: "Primary Border", usage: "Primary border accent" },
    successBorder:  { hex: hsl(152, 20, 88), name: "Success Border", usage: "Success border accent" },
    warningBorder:  { hex: hsl(38, 20, 88),  name: "Warning Border", usage: "Warning border accent" },
    errorBorder:    { hex: hsl(0, 20, 88),   name: "Error Border", usage: "Error border accent" },

    // ── Focus Ring ──
    focusRing: {
      hex: hsl(262, 65, 52),
      rgba: `rgba(108, 59, 196, 0.35)`,
      css: `0 0 0 3px rgba(108, 59, 196, 0.35)`,
      name: "Focus Ring",
      usage: "Keyboard focus indicator",
    },

    // ── Badge colors ──
    primaryBadge: { bg: "rgba(108, 59, 196, 0.10)", text: hsl(262, 65, 35), name: "Primary Badge", usage: "Primary status badge" },
    successBadge: { bg: "rgba(52, 148, 96, 0.10)", text: hsl(152, 55, 28), name: "Success Badge", usage: "Success status badge" },
    warningBadge: { bg: "rgba(199, 134, 14, 0.10)", text: hsl(38, 80, 32), name: "Warning Badge", usage: "Warning status badge" },
    errorBadge:   { bg: "rgba(186, 56, 56, 0.10)", text: hsl(0, 65, 35), name: "Error Badge", usage: "Error status badge" },
  },

  gradients: [
    {
      name: "Primary",
      css: `linear-gradient(135deg, ${hsl(262, 65, 52)}, ${hsl(280, 60, 58)})`,
      usage: "Primary gradient for CTAs, hero elements, sidebar active states",
    },
    {
      name: "Accent Glow",
      css: `linear-gradient(135deg, ${hsl(262, 65, 52)}, ${hsl(275, 70, 55)})`,
      usage: "Accent gradient (--gp) for badges, highlights",
    },
  ],

  typography: {
    fontFamily: "'Montserrat', system-ui, -apple-system, sans-serif",
    monoFamily: "'JetBrains Mono', 'SF Mono', monospace",
    headingWeight: 700,
    bodyWeight: 400,
    labelWeight: 600,
    sizes: {
      xs: "10px",
      sm: "11px",
      base: "13px",
      md: "14px",
      lg: "16px",
      xl: "20px",
      "2xl": "24px",
      "3xl": "30px",
    },
    lineHeight: 1.5,
    letterSpacing: {
      tight: "-0.01em",
      normal: "0",
      wide: "0.5px",
      caps: "1px",
    },
  },

  spacing: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
    "2xl": "32px",
    "3xl": "48px",
    sidebarWidth: "220px",
    topbarHeight: "52px",
    contentPadding: "24px",
  },

  radius: {
    sm:   { value: "6px",   usage: "Small elements — badges, tags" },
    md:   { value: "8px",   usage: "Medium elements — buttons, inputs" },
    lg:   { value: "12px",  usage: "Large elements — cards, panels" },
    xl:   { value: "14px",  usage: "Extra large — modals, dialogs" },
    full: { value: "9999px", usage: "Pill shapes — avatars, toggles" },
  },

  shadows: {
    sm: { css: "0 1px 2px rgba(0, 0, 0, 0.05)", usage: "Subtle elevation — buttons" },
    md: { css: "0 2px 8px rgba(0, 0, 0, 0.06)", usage: "Medium elevation — cards" },
    lg: { css: "0 4px 20px rgba(0, 0, 0, 0.08)", usage: "High elevation — modals, dropdowns" },
    glassShadow: { css: "0 4px 20px 0 rgba(108, 59, 196, 0.05)", usage: "Glass shadow with brand tint" },
  },

  components: {
    button: {
      borderRadius: "8px",
      padding: "8px 16px",
      fontSize: "13px",
      fontWeight: 600,
      transition: "all 0.15s ease",
      variants: [
        { name: "Primary", bg: hsl(262, 65, 52), color: "#FFFFFF", hoverBg: hsl(262, 65, 46), border: "none" },
        { name: "Secondary", bg: "transparent", color: hsl(275, 70, 55), hoverBg: hsl(275, 15, 95), border: `1.5px solid ${hsl(275, 70, 55)}` },
        { name: "Ghost", bg: "transparent", color: hsl(262, 65, 52), hoverBg: hsl(262, 15, 95), border: "none" },
        { name: "Destructive", bg: hsl(0, 65, 52), color: "#FFFFFF", hoverBg: hsl(0, 65, 46), border: "none" },
      ],
    },
    badge: {
      borderRadius: "6px",
      padding: "2px 8px",
      fontSize: "10px",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
    card: {
      borderRadius: "12px",
      border: "1px solid #E5E7EB",
      background: "#FFFFFF",
      padding: "16px",
    },
    input: {
      borderRadius: "8px",
      border: "1px solid #E5E7EB",
      background: "#FFFFFF",
      padding: "8px 12px",
      fontSize: "13px",
    },
  },

  designPrinciples: [
    "Flat, clean aesthetic — no glass morphism in light/clean theme",
    "Solid white backgrounds for panels, sidebar, topbar",
    "Subtle gray (#F3F4F6) for secondary surfaces and badge backgrounds",
    "Sharp, defined borders (#E5E7EB) — no blurred or translucent borders",
    "Minimal shadows — functional elevation only",
    "Purple-first brand palette: primary hsl(262 65% 52%), accent hsl(275 70% 55%)",
    "Montserrat as primary typeface, JetBrains Mono for numeric/code data",
    "Three-tier text opacity: #111827 → #6B7280 → #9CA3AF",
    "Consistent 135° gradient angle across all gradient uses",
    "WCAG AA contrast: all text meets 4.5:1 on white backgrounds",
  ],

  _diagnostics: [
    { level: "info", rule: "source", message: "Tokens manually extracted from Aerchain SalesOS master HTML (clean theme)", fix: "none" },
    { level: "info", rule: "theme", message: "Clean/light theme — flat design, no glassmorphism", fix: "none" },
  ],
};

// ═══════════════════════════════════════════════════════════
// 2. AERCHAIN SALESOS — DARK THEME
// ═══════════════════════════════════════════════════════════

const darkTokens = {
  meta: {
    name: "Aerchain SalesOS — Dark Theme",
    theme: "dark",
    version: "1.0.0",
    source: "Manual extraction from master HTML (data-theme='dark')",
    extractedAt: "2026-03-15T00:00:00.000Z",
  },

  colors: {
    // ── Canvas & Backgrounds ──
    canvas:     { hex: hsl(265, 30, 7), name: "Canvas", usage: "App background (deep purple-black with radial gradient orbs)" },
    contentBg:  { hex: hsl(265, 30, 7), name: "Content Background", usage: "Main content area" },
    cardBg:     { hex: "rgba(255, 255, 255, 0.04)", rgba: "rgba(255, 255, 255, 0.04)", name: "Card Background", usage: "Glass cards" },
    topbarBg:   { hex: "rgba(255, 255, 255, 0.04)", rgba: "rgba(255, 255, 255, 0.04)", name: "Topbar Background", usage: "Glass topbar" },
    sidebarBg:  { hex: "rgba(255, 255, 255, 0.04)", rgba: "rgba(255, 255, 255, 0.04)", name: "Sidebar Background", usage: "Glass sidebar" },

    // ── Primary & Accent ──
    primary:    { hex: hsl(262, 75, 62), name: "Primary", usage: "Primary actions, brand anchor (brighter in dark mode)" },
    accent:     { hex: hsl(275, 80, 65), name: "Accent", usage: "Secondary brand accent" },
    secondary:  { hex: hsl(275, 80, 65), name: "Secondary", usage: "Secondary actions" },

    // ── Semantic Colors ──
    success:    { hex: hsl(152, 60, 52), name: "Success / Green", usage: "Positive states (brighter in dark mode)" },
    warning:    { hex: hsl(38, 85, 58),  name: "Warning / Amber", usage: "Caution states (brighter in dark mode)" },
    error:      { hex: hsl(0, 72, 62),   name: "Error / Red", usage: "Destructive actions (brighter in dark mode)" },

    // ── Text Hierarchy (rgba-based for dark theme) ──
    textPrimary:   { hex: "#E0E0E0", rgba: "rgba(255, 255, 255, 0.88)", name: "Text Primary", usage: "Headings, body text" },
    textSecondary: { hex: "#999999", rgba: "rgba(255, 255, 255, 0.60)", name: "Text Secondary", usage: "Descriptions, labels" },
    textMuted:     { hex: "#595959", rgba: "rgba(255, 255, 255, 0.35)", name: "Text Muted", usage: "Placeholders, hints" },

    // ── Glass Surfaces ──
    glass1: { rgba: "rgba(255, 255, 255, 0.04)", blur: "40px", name: "Glass Panel", usage: "Large panels, sidebars — heavy frosted glass" },
    glass2: { rgba: "rgba(255, 255, 255, 0.07)", blur: "20px", name: "Glass Card", usage: "Cards, modals — medium glass" },
    glass3: { rgba: "rgba(255, 255, 255, 0.10)", blur: "10px", name: "Glass Input", usage: "Inputs, dropdowns — light glass" },

    // ── Borders ──
    border:        { rgba: "rgba(255, 255, 255, 0.09)", name: "Border", usage: "Default borders (translucent white)" },
    glassBorder:   { rgba: "rgba(255, 255, 255, 0.09)", name: "Glass Border", usage: "Glass element borders" },

    // ── Badge Backgrounds ──
    badgeBg:       { rgba: "rgba(255, 255, 255, 0.07)", name: "Badge Background", usage: "Default badge background" },

    // ── Derived: Light bg variants (dark-mode: low-opacity tinted) ──
    primaryLight: {
      hex: hsl(262, 30, 15),
      rgba: `rgba(127, 90, 213, 0.12)`,
      name: "Primary Light", usage: "Primary tinted background",
    },
    successLight: {
      hex: hsl(152, 30, 15),
      rgba: `rgba(62, 179, 118, 0.12)`,
      name: "Success Light", usage: "Success tinted background",
    },
    warningLight: {
      hex: hsl(38, 30, 15),
      rgba: `rgba(214, 159, 39, 0.12)`,
      name: "Warning Light", usage: "Warning tinted background",
    },
    errorLight: {
      hex: hsl(0, 30, 15),
      rgba: `rgba(200, 82, 82, 0.12)`,
      name: "Error Light", usage: "Error tinted background",
    },

    // ── Derived: Hover states (lighten for dark theme) ──
    primaryHover:   { hex: hsl(262, 75, 68), name: "Primary Hover", usage: "Primary hover state" },
    successHover:   { hex: hsl(152, 60, 58), name: "Success Hover", usage: "Success hover state" },
    warningHover:   { hex: hsl(38, 85, 64),  name: "Warning Hover", usage: "Warning hover state" },
    errorHover:     { hex: hsl(0, 72, 68),   name: "Error Hover", usage: "Error hover state" },

    // ── Derived: Border variants ──
    primaryBorder: {
      hex: hsl(262, 40, 25),
      rgba: `rgba(127, 90, 213, 0.20)`,
      name: "Primary Border", usage: "Primary border accent",
    },
    successBorder: {
      hex: hsl(152, 40, 25),
      rgba: `rgba(62, 179, 118, 0.20)`,
      name: "Success Border", usage: "Success border accent",
    },
    warningBorder: {
      hex: hsl(38, 40, 25),
      rgba: `rgba(214, 159, 39, 0.20)`,
      name: "Warning Border", usage: "Warning border accent",
    },
    errorBorder: {
      hex: hsl(0, 40, 25),
      rgba: `rgba(200, 82, 82, 0.20)`,
      name: "Error Border", usage: "Error border accent",
    },

    // ── Focus Ring ──
    focusRing: {
      hex: hsl(262, 75, 62),
      rgba: `rgba(127, 90, 213, 0.40)`,
      css: `0 0 0 3px rgba(127, 90, 213, 0.40)`,
      name: "Focus Ring",
      usage: "Keyboard focus indicator",
    },

    // ── Badge colors ──
    primaryBadge: { bg: "rgba(127, 90, 213, 0.15)", text: hsl(262, 75, 78), name: "Primary Badge", usage: "Primary status badge" },
    successBadge: { bg: "rgba(62, 179, 118, 0.15)", text: hsl(152, 60, 72), name: "Success Badge", usage: "Success status badge" },
    warningBadge: { bg: "rgba(214, 159, 39, 0.15)", text: hsl(38, 85, 74), name: "Warning Badge", usage: "Warning status badge" },
    errorBadge:   { bg: "rgba(200, 82, 82, 0.15)", text: hsl(0, 72, 78), name: "Error Badge", usage: "Error status badge" },
  },

  gradients: [
    {
      name: "Primary",
      css: `linear-gradient(135deg, ${hsl(262, 75, 62)}, ${hsl(275, 80, 65)})`,
      usage: "Primary gradient for CTAs, hero elements, sidebar active states",
    },
    {
      name: "Canvas Background",
      css: `linear-gradient(145deg, ${hsl(265, 30, 7)}, ${hsl(270, 25, 10)}, ${hsl(260, 20, 8)})`,
      usage: "Deep dark canvas with subtle purple tint",
    },
    {
      name: "Orb — Top Left",
      css: `radial-gradient(ellipse 600px 400px at 10% 15%, rgba(127, 90, 213, 0.08), transparent 70%)`,
      usage: "Ambient purple orb decoration (top-left)",
    },
    {
      name: "Orb — Bottom Right",
      css: `radial-gradient(ellipse 500px 500px at 85% 80%, rgba(170, 100, 230, 0.06), transparent 70%)`,
      usage: "Ambient purple orb decoration (bottom-right)",
    },
  ],

  typography: {
    fontFamily: "'Montserrat', system-ui, -apple-system, sans-serif",
    monoFamily: "'JetBrains Mono', 'SF Mono', monospace",
    headingWeight: 700,
    bodyWeight: 400,
    labelWeight: 600,
    sizes: {
      xs: "10px",
      sm: "11px",
      base: "13px",
      md: "14px",
      lg: "16px",
      xl: "20px",
      "2xl": "24px",
      "3xl": "30px",
    },
    lineHeight: 1.5,
    letterSpacing: {
      tight: "-0.01em",
      normal: "0",
      wide: "0.5px",
      caps: "1px",
    },
  },

  spacing: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
    "2xl": "32px",
    "3xl": "48px",
    sidebarWidth: "220px",
    topbarHeight: "52px",
    contentPadding: "24px",
  },

  radius: {
    sm:   { value: "6px",   usage: "Small elements — badges, tags" },
    md:   { value: "8px",   usage: "Medium elements — buttons, inputs" },
    lg:   { value: "12px",  usage: "Large elements — cards, panels" },
    xl:   { value: "14px",  usage: "Extra large — modals, dialogs" },
    full: { value: "9999px", usage: "Pill shapes — avatars, toggles" },
  },

  shadows: {
    sm: { css: "0 1px 3px rgba(0, 0, 0, 0.3)", usage: "Subtle elevation (stronger for dark bg)" },
    md: { css: "0 2px 10px rgba(0, 0, 0, 0.4)", usage: "Medium elevation — cards" },
    lg: { css: "0 8px 30px rgba(0, 0, 0, 0.5)", usage: "High elevation — modals, dropdowns" },
    glow: { css: `0 0 20px rgba(127, 90, 213, 0.15)`, usage: "Purple glow accent for active elements" },
    glassShadow: { css: "0 4px 20px 0 rgba(0, 0, 0, 0.3)", usage: "Dark glass shadow" },
  },

  components: {
    button: {
      borderRadius: "8px",
      padding: "8px 16px",
      fontSize: "13px",
      fontWeight: 600,
      transition: "all 0.15s ease",
      backdropFilter: "blur(10px)",
      variants: [
        { name: "Primary", bg: hsl(262, 75, 62), color: "#FFFFFF", hoverBg: hsl(262, 75, 68), border: "none" },
        { name: "Secondary", bg: "rgba(255,255,255,0.06)", color: hsl(275, 80, 65), hoverBg: "rgba(255,255,255,0.10)", border: `1.5px solid rgba(255,255,255,0.12)` },
        { name: "Ghost", bg: "transparent", color: hsl(262, 75, 62), hoverBg: "rgba(127, 90, 213, 0.10)", border: "none" },
        { name: "Destructive", bg: hsl(0, 72, 62), color: "#FFFFFF", hoverBg: hsl(0, 72, 68), border: "none" },
      ],
    },
    badge: {
      borderRadius: "6px",
      padding: "2px 8px",
      fontSize: "10px",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      backdropFilter: "blur(8px)",
    },
    card: {
      borderRadius: "12px",
      border: "1px solid rgba(255, 255, 255, 0.09)",
      background: "rgba(255, 255, 255, 0.04)",
      backdropFilter: "blur(20px)",
      padding: "16px",
    },
    input: {
      borderRadius: "8px",
      border: "1px solid rgba(255, 255, 255, 0.09)",
      background: "rgba(255, 255, 255, 0.06)",
      backdropFilter: "blur(10px)",
      padding: "8px 12px",
      fontSize: "13px",
      color: "rgba(255, 255, 255, 0.88)",
    },
  },

  designPrinciples: [
    "Full glassmorphism aesthetic — every surface is translucent with backdrop-filter blur",
    "Deep purple-black canvas (hsl 265 30% 7%) with radial gradient orbs for ambient depth",
    "Three-tier glass system: Panel (40px blur, 4% opacity), Card (20px blur, 7% opacity), Input (10px blur, 10% opacity)",
    "rgba-based text hierarchy: 88% → 60% → 35% white opacity",
    "Brighter semantic colors than light theme to maintain contrast on dark surfaces",
    "Purple glow accents on active/focused elements",
    "Translucent borders at rgba(255,255,255,0.09) — just visible enough to define edges",
    "Purple-first brand palette: primary hsl(262 75% 62%), accent hsl(275 80% 65%)",
    "Montserrat as primary typeface, JetBrains Mono for numeric/code data",
    "Consistent 135° gradient angle, matching canvas gradient at 145°",
  ],

  _diagnostics: [
    { level: "info", rule: "source", message: "Tokens manually extracted from Aerchain SalesOS master HTML (dark theme)", fix: "none" },
    { level: "info", rule: "theme", message: "Dark theme — full glassmorphism with backdrop-filter blur and radial orbs", fix: "none" },
  ],
};

// ═══════════════════════════════════════════════════════════
// Wrapped as file objects matching the app's savedFiles schema
// ═══════════════════════════════════════════════════════════

const now = "2026-03-15T00:00:00.000Z";

export const SEED_DESIGN_FILES = [
  {
    id: "seed-light-theme",
    name: "Aerchain SalesOS — Clean / Light Theme",
    type: "design-system",
    source: "Aerchain Master HTML",
    tokens: lightTokens,
    status: "published",
    tags: ["aerchain", "light", "clean", "official"],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "seed-dark-theme",
    name: "Aerchain SalesOS — Dark Theme",
    type: "design-system",
    source: "Aerchain Master HTML",
    tokens: darkTokens,
    status: "published",
    tags: ["aerchain", "dark", "glassmorphism", "official"],
    createdAt: now,
    updatedAt: now,
  },
];
