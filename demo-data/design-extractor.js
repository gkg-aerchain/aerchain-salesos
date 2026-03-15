// Sample files for Design Extractor module
// Each entry represents a saved design system extraction
// Outputs are generated from real token data via lib/generators.js

import { buildOutputs } from "../lib/generators.js";

// ── DS-001: Aerchain SalesOS — Dark Canvas v3 ────────────
const darkCanvasTokens = {
  meta: {
    name: "Aerchain SalesOS — Dark Canvas v3",
    description: "Glass-morphism dark theme with purple/violet accent system. Translucent surfaces over a gradient canvas with ambient orb lighting.",
    theme: "dark",
    inspiration: "Linear, Raycast, Arc Browser — premium dark interfaces"
  },
  colors: {
    primary:       { hex: "#8B5CF6", name: "Violet",           usage: "Primary buttons, active sidebar, accent thread" },
    primaryHover:  { hex: "#7C3AED", name: "Violet Deep",      usage: "Button hover, pressed states" },
    primaryLight:  { hex: "#1E1538", name: "Violet Glass",     usage: "Active backgrounds, badge surfaces" },
    primaryBorder: { hex: "#6D28D9", name: "Violet Border",    usage: "Focus rings, accent borders" },
    secondary:     { hex: "#A78BFA", name: "Lavender",         usage: "Secondary accent, gradient endpoints" },
    secondaryLight:{ hex: "#1A1230", name: "Lavender Glass",   usage: "Secondary badge backgrounds" },
    success:       { hex: "#34D399", name: "Emerald",          usage: "Active status, positive metrics, closed-won" },
    successLight:  { hex: "#0D2F23", name: "Emerald Glass",    usage: "Success badge background" },
    warning:       { hex: "#F5A623", name: "Amber",            usage: "Pending, draft, stale indicators" },
    warningLight:  { hex: "#2D2010", name: "Amber Glass",      usage: "Warning badge background" },
    error:         { hex: "#F87171", name: "Rose",             usage: "Error states, rejected, closed-lost" },
    errorLight:    { hex: "#2D1515", name: "Rose Glass",       usage: "Error badge background" },
    brand:         { hex: "#DC5F40", name: "Aerchain Orange",  usage: "Logo mark, brand accent in light-theme gradient" },
    contentBg:     { hex: "#0B0914", name: "Canvas Dark",      usage: "Page background (gradient: 145deg, hsl(265,30%,7%) → hsl(260,15%,4%))" },
    cardBg:        { hex: "#FFFFFF0A", name: "Glass Surface",  usage: "Cards, panels (rgba(255,255,255,0.04))" },
    cardBorder:    { hex: "#FFFFFF17", name: "Glass Border",   usage: "Borders, dividers (rgba(255,255,255,0.09))" },
    sidebarBg:     { hex: "#FFFFFF08", name: "Sidebar Glass",  usage: "Navigation sidebar (rgba(255,255,255,0.03))" },
    textPrimary:   { hex: "#FFFFFFE0", name: "Text Primary",   usage: "Headings, body text (rgba(255,255,255,0.88))" },
    textSecondary: { hex: "#FFFFFF99", name: "Text Secondary",  usage: "Labels, descriptions (rgba(255,255,255,0.60))" },
    textMuted:     { hex: "#FFFFFF59", name: "Text Muted",      usage: "Timestamps, placeholders (rgba(255,255,255,0.35))" }
  },
  gradients: [
    { name: "Primary", css: "linear-gradient(135deg, hsl(262 75% 62%), hsl(275 80% 65%))", usage: "Active sidebar items, primary buttons, section headings" },
    { name: "Canvas",  css: "linear-gradient(145deg, hsl(265 30% 7%) 0%, hsl(270 20% 5%) 40%, hsl(260 15% 4%) 100%)", usage: "Page background" },
    { name: "Orb 1",   css: "radial-gradient(circle, hsl(265 60% 25% / .30) 0%, transparent 70%)", usage: "Ambient top-left orb" },
    { name: "Orb 2",   css: "radial-gradient(circle, hsl(255 50% 22% / .25) 0%, transparent 70%)", usage: "Ambient bottom-right orb" }
  ],
  typography: {
    fontFamily: "'Montserrat', system-ui, -apple-system, sans-serif",
    monoFamily: "'JetBrains Mono', 'Fira Code', monospace",
    googleFontsImport: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap",
    scale: [
      { name: "Page Title",    size: "22px", weight: "800", tracking: "-0.3px", notes: "Use gradient text" },
      { name: "Section Title", size: "15px", weight: "800", tracking: "normal",  notes: "" },
      { name: "Card Title",    size: "13px", weight: "700", tracking: "normal",  notes: "" },
      { name: "Body",          size: "12px", weight: "500", tracking: "normal",  notes: "Default text" },
      { name: "Body Small",    size: "11px", weight: "500", tracking: "normal",  notes: "Secondary text" },
      { name: "Label",         size: "9px",  weight: "700", tracking: "0.8px",   notes: "Uppercase, muted" },
      { name: "KPI Value",     size: "22px", weight: "800", tracking: "-0.3px",  notes: "Use mono or gradient" },
      { name: "Table Data",    size: "12px", weight: "500", tracking: "normal",  notes: "Mono font" },
      { name: "Timestamp",     size: "10px", weight: "400", tracking: "normal",  notes: "Mono font, muted" }
    ]
  },
  spacing: { xs: "4px", sm: "6px", md: "8px", lg: "12px", xl: "16px", xxl: "24px", xxxl: "32px" },
  radius: {
    xs:   { value: "4px",    usage: "Badges, status dots" },
    sm:   { value: "7px",    usage: "Buttons, inputs, sidebar items" },
    md:   { value: "10px",   usage: "Inner cards, table headers" },
    lg:   { value: "14px",   usage: "Cards, panels, KPI cards" },
    xl:   { value: "16px",   usage: "Modals, large containers" },
    pill: { value: "9999px", usage: "Avatars, pills, rounded badges" }
  },
  shadows: {
    card:       { css: "0 2px 16px rgba(0,0,0,0.40), 0 0 0 1px rgba(255,255,255,0.04) inset", usage: "Glass card shadow" },
    cardHover:  { css: "0 4px 24px rgba(0,0,0,0.50), 0 0 0 1px rgba(255,255,255,0.06) inset", usage: "Card hover state" },
    elevated:   { css: "0 12px 40px -6px rgba(0,0,0,0.60), 0 0 0 1px rgba(255,255,255,0.07) inset", usage: "Modals, dropdowns" },
    buttonGlow: { css: "0 0 24px rgba(124,58,237,0.18)", usage: "Primary button glow" },
    focusRing:  { css: "0 0 0 3px hsla(262,75%,62%,0.4)", usage: "Input focus state" }
  },
  components: {
    button:  { borderRadius: "7px", padding: "8px 18px", fontSize: "12px", fontWeight: "600", variants: [
      { name: "primary",   bg: "linear-gradient(135deg, hsl(262 75% 62%), hsl(275 80% 65%))", color: "#FFFFFF", shadow: "buttonGlow" },
      { name: "secondary", bg: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.88)", border: "1px solid rgba(255,255,255,0.09)" },
      { name: "success",   bg: "linear-gradient(135deg, #34D399, #059669)", color: "#FFFFFF" },
      { name: "danger",    bg: "linear-gradient(135deg, #F87171, #DC2626)", color: "#FFFFFF" },
      { name: "ghost",     bg: "transparent", color: "#8B5CF6", border: "1px solid hsla(262,75%,62%,0.4)" }
    ]},
    badge:   { borderRadius: "4px", padding: "3px 8px", fontSize: "10px", fontWeight: "600", hasDot: true, dotSize: "6px" },
    card:    { borderRadius: "14px", padding: "14px 16px", border: "1px solid rgba(255,255,255,0.09)", shadow: "card", hoverShadow: "cardHover", hoverTransform: "translateY(-1px)" },
    input:   { borderRadius: "7px", padding: "8px 12px", border: "1px solid rgba(255,255,255,0.09)", focusBorder: "#8B5CF6", focusShadow: "focusRing" },
    table:   { headerFontSize: "9px", headerWeight: "700", headerTracking: "0.8px", headerTransform: "uppercase", cellPadding: "10px 12px", rowHoverBg: "rgba(124,58,237,0.08)" },
    sidebar: { width: "200px", itemPadding: "6px 8px", itemRadius: "7px", activeBackground: "linear-gradient(135deg, hsl(262 75% 62%), hsl(275 80% 65%))", activeColor: "#FFFFFF", activeShadow: "0 4px 14px rgba(124,58,237,0.3)" },
    avatar:  { size: "32px", sizeLg: "40px", borderRadius: "50%", fontWeight: "700", gradients: ["linear-gradient(135deg, #8B5CF6, #3B82F6)","linear-gradient(135deg, #06B6D4, #10B981)","linear-gradient(135deg, #F59E0B, #EF4444)","linear-gradient(135deg, #EC4899, #8B5CF6)"] }
  },
  designPrinciples: [
    "Dark glass morphism — translucent surfaces over gradient canvas with ambient orbs",
    "Data density over white space — every pixel earns its place",
    "Purple/violet accent thread through all interactive elements",
    "Micro-animations (150ms) for state changes, not decoration",
    "Uppercase 9px micro-labels for categorical grouping",
    "Inset box-shadow on glass surfaces for depth illusion"
  ]
};

// ── DS-002: Aerchain SalesOS — Clean Enterprise ──────────
const cleanEnterpriseTokens = {
  meta: {
    name: "Aerchain SalesOS — Clean Enterprise",
    description: "Solid-surface light theme for maximum readability. No glass, no blur — clean borders, white cards, gray background.",
    theme: "light",
    inspiration: "Notion, Figma, modern SaaS dashboards"
  },
  colors: {
    primary:       { hex: "#7C3AED", name: "Purple",            usage: "Primary buttons, active states" },
    primaryHover:  { hex: "#6D28D9", name: "Purple Dark",       usage: "Button hover" },
    primaryLight:  { hex: "#F3F0FF", name: "Purple Tint",       usage: "Badge backgrounds, selected rows" },
    primaryBorder: { hex: "#DDD6FE", name: "Purple Border",     usage: "Focus rings, active borders" },
    secondary:     { hex: "#A855F7", name: "Orchid",            usage: "Secondary accent, gradient pair" },
    secondaryLight:{ hex: "#FAF5FF", name: "Orchid Tint",       usage: "Secondary badge backgrounds" },
    success:       { hex: "#2EB67D", name: "Green",             usage: "Active status, positive metrics" },
    successLight:  { hex: "#ECFDF5", name: "Green Tint",        usage: "Success badge background" },
    warning:       { hex: "#E6930A", name: "Amber",             usage: "Pending, draft, warnings" },
    warningLight:  { hex: "#FFFBEB", name: "Amber Tint",        usage: "Warning badge background" },
    error:         { hex: "#DC3545", name: "Red",               usage: "Error states, rejected" },
    errorLight:    { hex: "#FEF2F2", name: "Red Tint",          usage: "Error badge background" },
    brand:         { hex: "#DC5F40", name: "Aerchain Orange",   usage: "Logo mark" },
    contentBg:     { hex: "#F8F9FC", name: "Page Background",   usage: "Main content area" },
    cardBg:        { hex: "#FFFFFF", name: "Card Surface",      usage: "Cards, panels, modals" },
    cardBorder:    { hex: "#E5E7EB", name: "Border",            usage: "Card borders, table dividers" },
    sidebarBg:     { hex: "#FFFFFF", name: "Sidebar Surface",   usage: "Navigation sidebar" },
    textPrimary:   { hex: "#111827", name: "Text Primary",      usage: "Headings, body text" },
    textSecondary: { hex: "#6B7280", name: "Text Secondary",    usage: "Labels, descriptions" },
    textMuted:     { hex: "#9CA3AF", name: "Text Muted",        usage: "Placeholders, disabled" }
  },
  gradients: [
    { name: "Primary", css: "linear-gradient(135deg, hsl(262 65% 52%), hsl(280 60% 58%))", usage: "Active sidebar items, primary buttons" },
    { name: "Accent",  css: "linear-gradient(135deg, #7C3AED, #A855F7)", usage: "Section title text, KPI values" }
  ],
  typography: {
    fontFamily: "'Montserrat', system-ui, -apple-system, sans-serif",
    monoFamily: "'JetBrains Mono', 'Fira Code', monospace",
    googleFontsImport: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap",
    scale: [
      { name: "Page Title",    size: "22px", weight: "800", tracking: "-0.3px", notes: "" },
      { name: "Section Title", size: "15px", weight: "800", tracking: "normal",  notes: "" },
      { name: "Card Title",    size: "13px", weight: "700", tracking: "normal",  notes: "" },
      { name: "Body",          size: "12px", weight: "500", tracking: "normal",  notes: "Default text" },
      { name: "Body Small",    size: "11px", weight: "500", tracking: "normal",  notes: "Secondary text" },
      { name: "Label",         size: "9px",  weight: "700", tracking: "0.8px",   notes: "Uppercase, muted" },
      { name: "KPI Value",     size: "22px", weight: "800", tracking: "-0.3px",  notes: "Mono font" },
      { name: "Table Data",    size: "12px", weight: "500", tracking: "normal",  notes: "Mono font" },
      { name: "Timestamp",     size: "10px", weight: "400", tracking: "normal",  notes: "Mono font, muted" }
    ]
  },
  spacing: { xs: "4px", sm: "6px", md: "8px", lg: "12px", xl: "16px", xxl: "24px", xxxl: "32px" },
  radius: {
    xs:   { value: "4px",    usage: "Badges, status dots" },
    sm:   { value: "7px",    usage: "Buttons, inputs" },
    md:   { value: "10px",   usage: "Inner cards" },
    lg:   { value: "14px",   usage: "Cards, panels" },
    xl:   { value: "16px",   usage: "Modals, large containers" },
    pill: { value: "9999px", usage: "Avatars, pills" }
  },
  shadows: {
    card:       { css: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)", usage: "Card shadow" },
    cardHover:  { css: "0 4px 16px rgba(0,0,0,0.08)", usage: "Card hover" },
    elevated:   { css: "0 4px 16px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)", usage: "Modals, dropdowns" },
    buttonGlow: { css: "0 0 0 transparent", usage: "No glow in clean theme" },
    focusRing:  { css: "0 0 0 3px rgba(124,58,237,0.25)", usage: "Input focus" }
  },
  components: {
    button:  { borderRadius: "7px", padding: "8px 18px", fontSize: "12px", fontWeight: "600", variants: [
      { name: "primary",   bg: "linear-gradient(135deg, hsl(262 65% 52%), hsl(280 60% 58%))", color: "#FFFFFF" },
      { name: "secondary", bg: "#FFFFFF", color: "#111827", border: "1px solid #E5E7EB" },
      { name: "success",   bg: "linear-gradient(135deg, #2EB67D, #059669)", color: "#FFFFFF" },
      { name: "danger",    bg: "linear-gradient(135deg, #DC3545, #B91C1C)", color: "#FFFFFF" },
      { name: "ghost",     bg: "transparent", color: "#7C3AED", border: "1px solid rgba(124,58,237,0.25)" }
    ]},
    badge:   { borderRadius: "4px", padding: "3px 8px", fontSize: "10px", fontWeight: "600", hasDot: true, dotSize: "6px" },
    card:    { borderRadius: "14px", padding: "14px 16px", border: "1px solid #E5E7EB", shadow: "card", hoverShadow: "cardHover", hoverTransform: "translateY(-1px)" },
    input:   { borderRadius: "7px", padding: "8px 12px", border: "1px solid #E5E7EB", focusBorder: "#7C3AED", focusShadow: "focusRing" },
    table:   { headerFontSize: "9px", headerWeight: "700", headerTracking: "0.8px", headerTransform: "uppercase", cellPadding: "10px 12px", rowHoverBg: "#FAF5FF" },
    sidebar: { width: "200px", itemPadding: "6px 8px", itemRadius: "7px", activeBackground: "linear-gradient(135deg, hsl(262 65% 52%), hsl(280 60% 58%))", activeColor: "#FFFFFF", activeShadow: "none" },
    avatar:  { size: "32px", sizeLg: "40px", borderRadius: "50%", fontWeight: "700", gradients: ["linear-gradient(135deg, #8B5CF6, #3B82F6)","linear-gradient(135deg, #06B6D4, #10B981)","linear-gradient(135deg, #F59E0B, #EF4444)","linear-gradient(135deg, #EC4899, #8B5CF6)"] }
  },
  designPrinciples: [
    "Solid white surfaces on light gray canvas — no glass, no blur",
    "Clean borders (#E5E7EB) replace translucent glass borders",
    "Purple accent preserved across all themes for brand consistency",
    "No glow shadows — clean, subtle elevation only",
    "Same spacing, radius, and typography scale as dark theme",
    "Maximum readability and enterprise-grade clarity"
  ]
};

// ── DS-003: Aerchain Marketing ───────────────────────────
const marketingTokens = {
  meta: {
    name: "Aerchain Marketing",
    description: "Marketing website — warm, bold, conversion-focused with editorial typography and brand orange hero treatment.",
    theme: "light",
    inspiration: "Stripe, Linear marketing sites"
  },
  colors: {
    primary:       { hex: "#DC5F40", name: "Aerchain Orange",   usage: "Hero CTAs, brand moments" },
    primaryHover:  { hex: "#C4533A", name: "Orange Dark",       usage: "Button hover" },
    primaryLight:  { hex: "#FEF3F0", name: "Orange Tint",       usage: "Feature card backgrounds" },
    primaryBorder: { hex: "#FDCFC5", name: "Orange Border",     usage: "Focus rings on CTAs" },
    secondary:     { hex: "#7C3AED", name: "Purple",            usage: "Secondary actions, links" },
    secondaryLight:{ hex: "#F3F0FF", name: "Purple Tint",       usage: "Code block backgrounds" },
    success:       { hex: "#059669", name: "Green",             usage: "Testimonial accents, stats" },
    successLight:  { hex: "#ECFDF5", name: "Green Tint",        usage: "Stats background" },
    warning:       { hex: "#F59E0B", name: "Amber",             usage: "Highlight callouts" },
    warningLight:  { hex: "#FFFBEB", name: "Amber Tint",        usage: "Callout background" },
    error:         { hex: "#EF4444", name: "Red",               usage: "Error states" },
    errorLight:    { hex: "#FEF2F2", name: "Red Tint",          usage: "Error background" },
    brand:         { hex: "#DC5F40", name: "Aerchain Orange",   usage: "Primary brand color" },
    contentBg:     { hex: "#FFFFFF", name: "White",             usage: "Page background" },
    cardBg:        { hex: "#FAFBFC", name: "Off-White",         usage: "Feature cards" },
    cardBorder:    { hex: "#E2E8F0", name: "Cool Gray",         usage: "Card borders" },
    sidebarBg:     { hex: "#FFFFFF", name: "White",             usage: "N/A (no sidebar)" },
    textPrimary:   { hex: "#1A1A2E", name: "Navy",              usage: "Headlines, body" },
    textSecondary: { hex: "#4B5563", name: "Slate",             usage: "Descriptions" },
    textMuted:     { hex: "#9CA3AF", name: "Gray",              usage: "Captions, fine print" }
  },
  gradients: [
    { name: "Hero CTA",      css: "linear-gradient(135deg, #DC5F40, #E8845C)", usage: "Primary call-to-action buttons" },
    { name: "Section Accent", css: "linear-gradient(135deg, #DC5F40, #7C3AED)", usage: "Section dividers, background accents" }
  ],
  typography: {
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    monoFamily: "'Fira Code', monospace",
    googleFontsImport: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
    scale: [
      { name: "Hero",     size: "56px", weight: "800", tracking: "-1px",    notes: "Landing page hero" },
      { name: "Section",  size: "36px", weight: "700", tracking: "-0.5px",  notes: "" },
      { name: "Subhead",  size: "20px", weight: "600", tracking: "normal",  notes: "" },
      { name: "Body",     size: "16px", weight: "400", tracking: "normal",  notes: "Default text" },
      { name: "Small",    size: "14px", weight: "500", tracking: "normal",  notes: "UI labels, nav items" }
    ]
  },
  spacing: { xs: "4px", sm: "8px", md: "16px", lg: "24px", xl: "48px", xxl: "64px", xxxl: "96px" },
  radius: {
    sm:   { value: "6px",  usage: "Badges, tags" },
    md:   { value: "12px", usage: "Buttons, inputs" },
    lg:   { value: "20px", usage: "Feature cards" },
    xl:   { value: "28px", usage: "Hero cards" },
    pill: { value: "100px", usage: "CTA buttons" }
  },
  shadows: {
    card:       { css: "0 4px 24px rgba(0,0,0,0.06)", usage: "Feature cards" },
    cardHover:  { css: "0 8px 32px rgba(0,0,0,0.10)", usage: "Card hover" },
    elevated:   { css: "0 8px 32px rgba(0,0,0,0.10)", usage: "Pricing cards, modals" },
    buttonGlow: { css: "0 0 40px rgba(220,95,64,0.15)", usage: "CTA hover glow" },
    focusRing:  { css: "0 0 0 3px rgba(220,95,64,0.2)", usage: "Input focus" }
  },
  components: {
    button:  { borderRadius: "12px", padding: "14px 32px", fontSize: "16px", fontWeight: "600", variants: [
      { name: "primary",   bg: "linear-gradient(135deg, #DC5F40, #E8845C)", color: "#FFFFFF", shadow: "buttonGlow" },
      { name: "secondary", bg: "#FFFFFF", color: "#1A1A2E", border: "1px solid #E2E8F0" },
      { name: "ghost",     bg: "transparent", color: "#DC5F40", border: "1px solid #FDCFC5" }
    ]},
    badge:   { borderRadius: "6px", padding: "4px 12px", fontSize: "13px", fontWeight: "500" },
    card:    { borderRadius: "20px", padding: "32px", border: "1px solid #E2E8F0", shadow: "card", hoverShadow: "cardHover", hoverTransform: "translateY(-2px)" },
    input:   { borderRadius: "12px", padding: "12px 16px", border: "1.5px solid #E2E8F0", focusBorder: "#DC5F40", focusShadow: "focusRing" },
    table:   { headerFontSize: "13px", headerWeight: "600", headerTracking: "normal", headerTransform: "none", cellPadding: "16px 20px", rowHoverBg: "#FEF3F0" },
    sidebar: { width: "0px", itemPadding: "0", itemRadius: "0", activeBackground: "none", activeColor: "none", activeShadow: "none" },
    avatar:  { size: "48px", sizeLg: "64px", borderRadius: "50%", fontWeight: "700", gradients: ["linear-gradient(135deg, #DC5F40, #7C3AED)"] }
  },
  designPrinciples: [
    "Bold typography hierarchy — hero text demands attention",
    "Warm orange leads, purple supports — brand consistency with product",
    "Generous whitespace for editorial breathing room",
    "Gradient CTAs for visual energy and click invitation",
    "Mobile-first responsive with fluid type scaling",
    "20px+ border radius for friendly, modern feel"
  ]
};

// Generate real outputs from tokens
const darkCanvasOutputs = buildOutputs(darkCanvasTokens);
const cleanEnterpriseOutputs = buildOutputs(cleanEnterpriseTokens);
const marketingOutputs = buildOutputs(marketingTokens);

export const designExtractorFiles = [
  {
    id: "ds-001",
    name: "Aerchain SalesOS — Dark Canvas v3",
    description: "Glass-morphism dark theme with purple/violet accents. The default SalesOS production theme featuring translucent surfaces, ambient orb lighting, and gradient-accent interactive elements.",
    status: "final",
    createdAt: "2026-03-08T14:22:00Z",
    updatedAt: "2026-03-15T09:00:00Z",
    source: "CSS custom properties analysis (App.jsx :root[data-theme='dark'])",
    tags: ["production", "dark", "glass-morphism"],
    tokens: darkCanvasTokens,
    outputs: darkCanvasOutputs
  },
  {
    id: "ds-002",
    name: "Aerchain SalesOS — Clean Enterprise",
    description: "Solid-surface light theme optimized for readability. White cards, gray background, clean borders — no glass, no blur, no glow. Enterprise-grade clarity.",
    status: "final",
    createdAt: "2026-03-10T10:30:00Z",
    updatedAt: "2026-03-15T09:00:00Z",
    source: "CSS custom properties analysis (App.jsx :root[data-theme='clean'])",
    tags: ["production", "light", "enterprise"],
    tokens: cleanEnterpriseTokens,
    outputs: cleanEnterpriseOutputs
  },
  {
    id: "ds-003",
    name: "Aerchain Marketing",
    description: "Marketing website design system — warm orange hero treatment, editorial typography, conversion-focused with generous whitespace and bold gradient CTAs.",
    status: "draft",
    createdAt: "2026-03-13T11:05:00Z",
    updatedAt: "2026-03-15T09:00:00Z",
    source: "Website screenshot analysis",
    tags: ["marketing", "website", "brand"],
    tokens: marketingTokens,
    outputs: marketingOutputs
  }
];
