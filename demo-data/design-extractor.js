// Sample files for Design Extractor module
// Each entry represents a saved design system extraction

export const designExtractorFiles = [
  {
    id: "ds-001",
    name: "Aerchain Platform Design System",
    description: "Extracted from the live Aerchain procurement platform. Covers the full component library including sidebar, tables, badges, modals, and form elements.",
    status: "final",
    createdAt: "2026-03-08T14:22:00Z",
    updatedAt: "2026-03-12T09:15:00Z",
    source: "Screenshot + HTML/CSS analysis",
    tags: ["production", "enterprise", "procurement"],
    tokens: {
      meta: {
        name: "Aerchain Platform",
        description: "Enterprise procurement SaaS — clean, data-dense UI with purple accent system",
        theme: "light",
        inspiration: "Modern SaaS dashboards (Linear, Notion, Figma)"
      },
      colors: {
        primary:       { hex: "#7C3AED", name: "Violet",           usage: "Primary buttons, active states, sidebar selection" },
        primaryHover:  { hex: "#6D28D9", name: "Violet Dark",      usage: "Button hover, pressed states" },
        primaryLight:  { hex: "#F3F0FF", name: "Violet Tint",      usage: "Badge backgrounds, selected row highlight" },
        primaryBorder: { hex: "#DDD6FE", name: "Violet Border",    usage: "Focus rings, active borders" },
        secondary:     { hex: "#06B6D4", name: "Cyan",             usage: "Secondary badges, links" },
        secondaryLight:{ hex: "#ECFEFF", name: "Cyan Tint",        usage: "Info badges background" },
        success:       { hex: "#10B981", name: "Emerald",          usage: "Active status, positive metrics, closed-won" },
        successLight:  { hex: "#ECFDF5", name: "Emerald Tint",     usage: "Success badge background" },
        warning:       { hex: "#F59E0B", name: "Amber",            usage: "Pending, draft, stale data indicators" },
        warningLight:  { hex: "#FFFBEB", name: "Amber Tint",       usage: "Warning badge background" },
        error:         { hex: "#EF4444", name: "Red",              usage: "Error states, rejected, closed-lost" },
        errorLight:    { hex: "#FEF2F2", name: "Red Tint",         usage: "Error badge background" },
        brand:         { hex: "#DC5F40", name: "Aerchain Orange",  usage: "Logo mark, brand accent in gradients" },
        contentBg:     { hex: "#F8F9FC", name: "Page Background",  usage: "Main content area" },
        cardBg:        { hex: "#FFFFFF", name: "Card Surface",     usage: "Cards, panels, modals" },
        cardBorder:    { hex: "#E5E7EB", name: "Border",           usage: "Card borders, table dividers" },
        sidebarBg:     { hex: "#FFFFFF", name: "Sidebar Surface",  usage: "Navigation sidebar" },
        textPrimary:   { hex: "#111827", name: "Text Primary",     usage: "Headings, body text, table values" },
        textSecondary: { hex: "#6B7280", name: "Text Secondary",   usage: "Labels, descriptions, timestamps" },
        textMuted:     { hex: "#9CA3AF", name: "Text Muted",       usage: "Placeholders, disabled text" }
      },
      gradients: [
        { name: "Primary Action", css: "linear-gradient(135deg, #7C3AED, #6D28D9)", usage: "Primary buttons, CTA" },
        { name: "Brand Accent",   css: "linear-gradient(135deg, #DC5F40, #7C3AED)", usage: "Header bars, hero sections" }
      ],
      typography: {
        fontFamily: "'Montserrat', system-ui, -apple-system, sans-serif",
        monoFamily: "'JetBrains Mono', 'Fira Code', monospace",
        googleFontsImport: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap",
        scale: [
          { name: "Display",  size: "28px", weight: 800, lineHeight: 1.2, usage: "Page titles" },
          { name: "Heading",  size: "18px", weight: 700, lineHeight: 1.3, usage: "Section headers" },
          { name: "Subhead",  size: "14px", weight: 600, lineHeight: 1.4, usage: "Card titles" },
          { name: "Body",     size: "13px", weight: 400, lineHeight: 1.6, usage: "Paragraph text, table cells" },
          { name: "Caption",  size: "11px", weight: 500, lineHeight: 1.4, usage: "Labels, badges, timestamps" },
          { name: "Micro",    size: "9px",  weight: 700, lineHeight: 1.2, usage: "Group headers, overlines" }
        ]
      },
      spacing: { xs: "4px", sm: "8px", md: "12px", lg: "16px", xl: "24px", xxl: "32px", xxxl: "48px" },
      radius: {
        sm:   { value: "4px",   usage: "Badges, small pills" },
        md:   { value: "7px",   usage: "Buttons, inputs, table rows" },
        lg:   { value: "12px",  usage: "Cards, panels" },
        xl:   { value: "16px",  usage: "Modals, large cards" },
        full: { value: "9999px", usage: "Avatars, status dots" }
      },
      shadows: {
        glass:    { css: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)", usage: "Cards, surfaces" },
        elevated: { css: "0 4px 16px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)", usage: "Modals, dropdowns" },
        glow:     { css: "0 0 16px rgba(124,58,237,0.12)", usage: "Active/focused elements" }
      },
      components: {
        button: { padding: "8px 18px", fontSize: "12px", fontWeight: 600, borderRadius: "7px", transition: "all 0.15s" },
        badge:  { padding: "3px 8px", fontSize: "10px", fontWeight: 600, borderRadius: "4px" },
        card:   { padding: "14px 16px", borderRadius: "14px", border: "1px solid #E5E7EB" },
        input:  { padding: "8px 12px", fontSize: "13px", borderRadius: "7px", border: "1px solid #E5E7EB" },
        table:  { fontSize: "12px", headerFontSize: "10px", rowPadding: "10px 12px" },
        sidebar:{ width: "200px", itemPadding: "6px 8px", itemRadius: "7px" },
        avatar: { size: "32px", borderRadius: "50%" }
      },
      designPrinciples: [
        "Data density over white space — every pixel earns its place",
        "Consistent purple accent thread through all interactive elements",
        "Glass morphism for depth without visual weight",
        "Micro-animations (150ms) for state changes, not decoration",
        "Uppercase micro-labels for categorical grouping"
      ]
    },
    outputs: {
      html: "<!-- Full HTML styleguide generated -->",
      markdown: "# Aerchain Platform Design System\n\nExtracted from production UI...",
      json: "{ /* full tokens */ }",
      react: "export const theme = { colors: { primary: '#7C3AED' } }"
    }
  },
  {
    id: "ds-002",
    name: "Aerchain Marketing Site",
    description: "Design system extracted from aerchain.com marketing website. Warmer palette with brand orange as hero color, gradient CTAs, and editorial typography.",
    status: "draft",
    createdAt: "2026-03-13T11:05:00Z",
    updatedAt: "2026-03-13T11:05:00Z",
    source: "Website screenshot analysis",
    tags: ["marketing", "website", "brand"],
    tokens: {
      meta: {
        name: "Aerchain Marketing",
        description: "Marketing website — warm, bold, conversion-focused with editorial feel",
        theme: "light",
        inspiration: "Stripe, Linear marketing sites"
      },
      colors: {
        primary:       { hex: "#DC5F40", name: "Aerchain Orange",   usage: "Hero CTAs, brand moments" },
        primaryHover:  { hex: "#C4533A", name: "Orange Dark",       usage: "Button hover" },
        primaryLight:  { hex: "#FEF3F0", name: "Orange Tint",       usage: "Feature card backgrounds" },
        secondary:     { hex: "#7C3AED", name: "Purple",            usage: "Secondary actions, links" },
        secondaryLight:{ hex: "#F3F0FF", name: "Purple Tint",       usage: "Code block backgrounds" },
        success:       { hex: "#059669", name: "Green",             usage: "Testimonial accents, stats" },
        textPrimary:   { hex: "#1A1A2E", name: "Navy",             usage: "Headlines, body" },
        textSecondary: { hex: "#4B5563", name: "Slate",            usage: "Descriptions" },
        textMuted:     { hex: "#9CA3AF", name: "Gray",             usage: "Captions, fine print" },
        contentBg:     { hex: "#FFFFFF", name: "White",            usage: "Page background" },
        cardBg:        { hex: "#FAFBFC", name: "Off-White",        usage: "Feature cards" },
        cardBorder:    { hex: "#E2E8F0", name: "Cool Gray",        usage: "Card borders" }
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
          { name: "Hero",     size: "56px", weight: 800, lineHeight: 1.1, usage: "Landing page hero" },
          { name: "Section",  size: "36px", weight: 700, lineHeight: 1.2, usage: "Section headings" },
          { name: "Subhead",  size: "20px", weight: 600, lineHeight: 1.4, usage: "Feature titles" },
          { name: "Body",     size: "16px", weight: 400, lineHeight: 1.7, usage: "Paragraph text" },
          { name: "Small",    size: "14px", weight: 500, lineHeight: 1.5, usage: "UI labels, nav items" }
        ]
      },
      spacing: { xs: "4px", sm: "8px", md: "16px", lg: "24px", xl: "48px", xxl: "64px", xxxl: "96px" },
      radius: {
        sm:   { value: "6px",  usage: "Badges, tags" },
        md:   { value: "12px", usage: "Buttons, inputs" },
        lg:   { value: "20px", usage: "Feature cards" },
        xl:   { value: "28px", usage: "Hero cards" }
      },
      shadows: {
        card:     { css: "0 4px 24px rgba(0,0,0,0.06)", usage: "Feature cards" },
        elevated: { css: "0 8px 32px rgba(0,0,0,0.10)", usage: "Pricing cards, modals" },
        glow:     { css: "0 0 40px rgba(220,95,64,0.15)", usage: "CTA hover state" }
      },
      components: {
        button: { padding: "14px 32px", fontSize: "16px", fontWeight: 600, borderRadius: "12px", transition: "all 0.2s" },
        badge:  { padding: "4px 12px", fontSize: "13px", fontWeight: 500, borderRadius: "6px" },
        card:   { padding: "32px", borderRadius: "20px", border: "1px solid #E2E8F0" },
        nav:    { height: "72px", fontSize: "15px", fontWeight: 500 }
      },
      designPrinciples: [
        "Bold typography hierarchy — hero text demands attention",
        "Warm orange leads, purple supports — brand consistency with product",
        "Generous whitespace for editorial breathing room",
        "Gradient CTAs for visual energy and click invitation",
        "Mobile-first responsive with fluid type scaling"
      ]
    },
    outputs: {
      html: "<!-- Marketing styleguide generated -->",
      markdown: "# Aerchain Marketing Design System\n\nExtracted from aerchain.com...",
      json: "{ /* full tokens */ }",
      react: "export const theme = { colors: { primary: '#DC5F40' } }"
    }
  }
];
