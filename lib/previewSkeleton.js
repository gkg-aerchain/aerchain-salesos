// ═══════════════════════════════════════════════════════════
// DESIGN SYSTEM PREVIEW GENERATOR
// Instant, zero-API preview: takes extracted token JSON,
// maps it to CSS custom properties, injects into a pre-built
// HTML skeleton with 10 sections of realistic Aerchain UI.
// Returns a self-contained HTML string for iframe.srcDoc.
// ═══════════════════════════════════════════════════════════

/**
 * Build a complete self-contained HTML preview from extracted design tokens.
 * The skeleton is static — only the :root CSS variables change per design system.
 * This means instant rendering, zero API cost, consistent output every time.
 *
 * @param {object} tokens - The extracted token JSON (same schema as Claude extraction)
 * @returns {string} Complete HTML string ready for iframe.srcDoc
 */
export function buildPreviewHTML(tokens) {
  const css = buildCSSFromTokens(tokens);
  return `<!DOCTYPE html>
<html data-theme="dark" lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${tokens.meta?.name || "Design System"} — Preview</title>
${css}
</head>
<body>
${SKELETON_HTML}
<script>
document.querySelector('.theme-btn')?.addEventListener('click', function() {
  var h = document.documentElement;
  h.dataset.theme = h.dataset.theme === 'dark' ? 'light' : 'dark';
});
</script>
</body>
</html>`;
}

// ── TOKEN → CSS MAPPER ────────────────────────────────────
// Maps the structured token schema to CSS custom properties.

function buildCSSFromTokens(tokens) {
  const { colors = {}, gradients = [], typography = {}, spacing = {}, radius = {}, shadows = {}, components = {}, meta = {} } = tokens;

  const isDark = meta.theme === "dark";

  // Resolve color values safely
  const c = (key, fallback) => colors[key]?.hex || fallback;
  const r = (key, fallback) => radius[key]?.value || fallback;
  const s = (key, fallback) => shadows[key]?.css || fallback;
  const grad = (idx, fallback) => gradients[idx]?.css || fallback;

  // Font import
  const fontImport = typography.googleFontsImport
    ? `<link href="${typography.googleFontsImport}" rel="stylesheet">`
    : `<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">`;

  // Determine primary/accent for component styling
  const primary = c("primary", "#7c3aed");
  const primaryLight = c("primaryLight", primary + "20");
  const primaryBorder = c("primaryBorder", primary + "40");
  const accent = c("secondary", primary);
  const brand = c("brand", "#DC5F40");

  // Background/surface
  const bg = c("contentBg", isDark ? "#0d0b14" : "#fafafa");
  const cardBg = c("cardBg", isDark ? "rgba(255,255,255,0.04)" : "#ffffff");
  const cardBorder = c("cardBorder", isDark ? "rgba(255,255,255,0.09)" : "#f0f0f0");
  const sidebarBg = c("sidebarBg", isDark ? "rgba(255,255,255,0.03)" : "#f5f5f5");

  // Text
  const fg = c("textPrimary", isDark ? "rgba(255,255,255,0.88)" : "#1f2937");
  const fg2 = c("textSecondary", isDark ? "rgba(255,255,255,0.60)" : "#6b7280");
  const fg3 = c("textMuted", isDark ? "rgba(255,255,255,0.35)" : "#9ca3af");

  // Semantic
  const success = c("success", "#10b981");
  const warning = c("warning", "#f59e0b");
  const error = c("error", "#ef4444");

  // Typography
  const fontDisplay = typography.fontFamily || "'Montserrat', system-ui, sans-serif";
  const fontMono = typography.monoFamily || "'JetBrains Mono', monospace";

  // Gradient
  const gp = grad(0, `linear-gradient(135deg, ${primary}, ${accent})`);

  // Radius
  const rCard = r("lg", "14px");
  const rMd = r("md", "12px");
  const rSm = r("sm", "8px");
  const rXs = r("xs", "5px");
  const rPill = r("pill", "100px");

  // Shadows
  const sCard = s("card", "0 2px 16px rgba(0,0,0,0.40), 0 0 0 1px rgba(255,255,255,0.04) inset");
  const sElevated = s("elevated", "0 12px 40px -6px rgba(0,0,0,0.60)");
  const sGlow = s("buttonGlow", `0 4px 16px ${primary}4d`);

  // Button component
  const btnRadius = components.button?.borderRadius || rPill;
  const btnPadding = components.button?.padding || "8px 18px";
  const btnFont = components.button?.fontSize || "13px";
  const btnWeight = components.button?.fontWeight || "600";

  return `${fontImport}
<style>
:root {
  --primary: ${primary};
  --primary-light: ${primaryLight};
  --primary-border: ${primaryBorder};
  --accent: ${accent};
  --brand: ${brand};
  --gp: ${gp};
  --success: ${success};
  --warning: ${warning};
  --error: ${error};
  --bg: ${bg};
  --card-bg: ${cardBg};
  --card-border: ${cardBorder};
  --sidebar-bg: ${sidebarBg};
  --fg: ${fg};
  --fg2: ${fg2};
  --fg3: ${fg3};
  --r-card: ${rCard};
  --r-md: ${rMd};
  --r-sm: ${rSm};
  --r-xs: ${rXs};
  --r-pill: ${rPill};
  --s-card: ${sCard};
  --s-elevated: ${sElevated};
  --s-glow: ${sGlow};
  --font-display: ${fontDisplay};
  --font-mono: ${fontMono};
  --btn-radius: ${btnRadius};
  --btn-padding: ${btnPadding};
  --btn-font: ${btnFont};
  --btn-weight: ${btnWeight};
  --logo-fg: ${isDark ? "white" : "#0a0a0f"};
}
:root[data-theme="light"] {
  --logo-fg: #0a0a0f;
  --bg: ${isDark ? "#f5f4f8" : bg};
  --card-bg: ${isDark ? "#ffffff" : cardBg};
  --card-border: ${isDark ? "rgba(0,0,0,0.10)" : cardBorder};
  --sidebar-bg: ${isDark ? "#f5f5f5" : sidebarBg};
  --fg: ${isDark ? "rgba(0,0,0,0.85)" : fg};
  --fg2: ${isDark ? "rgba(0,0,0,0.55)" : fg2};
  --fg3: ${isDark ? "rgba(0,0,0,0.35)" : fg3};
}
:root[data-theme="dark"] {
  --logo-fg: white;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--fg);font-family:var(--font-display);min-height:100vh;font-size:14px;line-height:1.55}
::selection{background:color-mix(in srgb, var(--primary) 25%, transparent)}

/* ── NAV ── */
nav.topbar{position:sticky;top:0;z-index:100;display:flex;align-items:center;gap:14px;padding:0 24px;height:54px;background:var(--card-bg);border-bottom:1px solid var(--card-border);backdrop-filter:blur(20px)}
nav .nav-links{display:flex;gap:4px;margin-left:20px}
nav .nav-links a{padding:6px 12px;border-radius:var(--r-sm);font-size:13px;color:var(--fg2);text-decoration:none;transition:all .2s;font-weight:500}
nav .nav-links a:hover,nav .nav-links a.active{color:var(--fg);background:var(--primary-light)}
nav .search{padding:7px 14px;background:var(--card-bg);border:1px solid var(--card-border);border-radius:var(--r-sm);color:var(--fg);font-size:12px;width:200px;outline:none;font-family:inherit}
nav .avatar{width:32px;height:32px;border-radius:50%;background:var(--gp);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;cursor:pointer}
nav .theme-btn{padding:6px 12px;background:var(--card-bg);border:1px solid var(--card-border);border-radius:var(--r-sm);color:var(--fg2);cursor:pointer;font-size:14px}
nav .bell{position:relative;cursor:pointer;color:var(--fg2)}
nav .bell .dot{position:absolute;top:-2px;right:-2px;width:7px;height:7px;border-radius:50%;background:var(--error);border:2px solid var(--bg)}
.spacer{flex:1}

/* ── PAGE ── */
.page{padding:28px 32px;display:flex;flex-direction:column;gap:32px;max-width:1400px;margin:0 auto;width:100%}
.section-title{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--fg3);margin-bottom:16px}

/* ── KPI ── */
.kpi-strip{display:grid;grid-template-columns:repeat(5,1fr);gap:14px}
.kpi-card{background:var(--card-bg);border:1px solid var(--card-border);border-radius:var(--r-card);padding:18px 20px;display:flex;flex-direction:column;gap:6px;position:relative;overflow:hidden}
.kpi-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--gp)}
.kpi-label{font-size:10px;color:var(--fg3);text-transform:uppercase;letter-spacing:.06em;font-weight:600}
.kpi-value{font-size:26px;font-weight:800;font-family:var(--font-mono);color:var(--fg)}
.kpi-trend{font-size:11px;display:flex;align-items:center;gap:4px;font-weight:600}
.kpi-trend.up{color:var(--success)} .kpi-trend.down{color:var(--error)}

/* ── KANBAN ── */
.kanban{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.kanban-col{background:var(--card-bg);border:1px solid var(--card-border);border-radius:var(--r-md);padding:14px}
.col-header{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--fg3);margin-bottom:12px;display:flex;justify-content:space-between;align-items:center}
.col-count{font-size:10px;background:var(--primary-light);color:var(--primary);padding:2px 7px;border-radius:var(--r-pill);font-family:var(--font-mono)}
.deal-card{background:color-mix(in srgb, var(--card-bg) 80%, transparent);border:1px solid var(--card-border);border-radius:var(--r-sm);padding:12px;margin-bottom:8px;transition:all .15s}
.deal-card:hover{border-color:var(--primary-border);box-shadow:var(--s-glow)}
.deal-value{font-size:16px;font-weight:700;color:var(--fg);font-family:var(--font-mono)}
.deal-company{font-size:12px;color:var(--fg2);margin-bottom:8px;font-weight:500}
.deal-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.avatar-sm{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:white}
.badge{padding:3px 10px;border-radius:var(--r-pill);font-size:10px;font-weight:600;font-family:var(--font-mono)}
.dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.dot.green{background:var(--success)} .dot.amber{background:var(--warning)} .dot.red{background:var(--error)}
.time-ago{font-size:10px;color:var(--fg3);margin-left:auto;font-family:var(--font-mono)}

/* ── CHART ── */
.chart-wrap{background:var(--card-bg);border:1px solid var(--card-border);border-radius:var(--r-card);padding:20px}
.chart-legend{display:flex;gap:20px;margin-bottom:12px}
.legend-item{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--fg2);font-weight:500}

/* ── TABLE ── */
table{width:100%;border-collapse:collapse}
thead th{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--fg3);padding:10px 14px;text-align:left;border-bottom:1px solid var(--card-border)}
tbody tr{border-bottom:1px solid color-mix(in srgb, var(--card-border) 60%, transparent);transition:background .1s}
tbody tr:hover{background:var(--primary-light)}
tbody td{padding:10px 14px;font-size:13px;color:var(--fg2)}
tbody td:first-child{color:var(--fg);font-weight:600}
.table-wrap{background:var(--card-bg);border:1px solid var(--card-border);border-radius:var(--r-card);overflow:hidden}
.pagination{display:flex;align-items:center;gap:8px;padding:12px 16px;border-top:1px solid var(--card-border)}
.page-btn{padding:4px 10px;border-radius:var(--r-xs);font-size:12px;background:var(--card-bg);border:1px solid var(--card-border);color:var(--fg2);cursor:pointer;font-family:inherit;font-weight:500}
.page-btn.active{background:var(--primary);color:white;border-color:transparent}

/* ── ACTIVITY ── */
.activity-list{display:flex;flex-direction:column;background:var(--card-bg);border:1px solid var(--card-border);border-radius:var(--r-card);overflow:hidden}
.activity-item{display:flex;align-items:flex-start;gap:12px;padding:14px 18px;border-bottom:1px solid color-mix(in srgb, var(--card-border) 60%, transparent)}
.activity-item:last-child{border-bottom:none}
.act-icon{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px}
.act-body{flex:1;min-width:0}
.act-actor{font-size:13px;font-weight:600;color:var(--fg)}
.act-text{font-size:12px;color:var(--fg2);margin-top:2px}
.act-time{font-size:10px;color:var(--fg3);font-family:var(--font-mono)}
.act-deal{padding:2px 8px;border-radius:var(--r-pill);font-size:10px;background:var(--primary-light);border:1px solid var(--primary-border);color:var(--primary);font-weight:600;white-space:nowrap;font-family:var(--font-mono)}

/* ── COMPONENTS ── */
.components-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}
.comp-panel{background:var(--card-bg);border:1px solid var(--card-border);border-radius:var(--r-card);padding:20px;display:flex;flex-direction:column;gap:14px}
.comp-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--fg3);margin-bottom:4px}
.form-group{display:flex;flex-direction:column;gap:5px}
.form-label{font-size:10px;font-weight:600;color:var(--fg3);text-transform:uppercase;letter-spacing:.05em}
.form-input{padding:8px 12px;background:var(--card-bg);border:1px solid var(--card-border);border-radius:var(--r-sm);color:var(--fg);font-size:13px;outline:none;width:100%;font-family:inherit}
.form-input:focus{border-color:var(--primary);box-shadow:0 0 0 3px color-mix(in srgb, var(--primary) 12%, transparent)}
.checkbox-row{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--fg2);cursor:pointer}
.toggle{width:38px;height:20px;border-radius:10px;background:var(--card-border);position:relative;cursor:pointer;transition:background .2s}
.toggle.on{background:var(--primary)}
.toggle::after{content:'';position:absolute;left:3px;top:3px;width:14px;height:14px;border-radius:50%;background:white;transition:transform .2s}
.toggle.on::after{transform:translateX(18px)}
.btn-row{display:flex;flex-wrap:wrap;gap:8px}
.btn{padding:var(--btn-padding);border-radius:var(--btn-radius);font-size:var(--btn-font);font-weight:var(--btn-weight);cursor:pointer;border:1px solid transparent;display:inline-flex;align-items:center;gap:6px;font-family:inherit;transition:all .15s}
.btn-primary{background:var(--gp);color:white;box-shadow:var(--s-glow)}
.btn-secondary{background:var(--card-bg);border-color:var(--card-border);color:var(--fg)}
.btn-outline{background:transparent;border-color:var(--primary);color:var(--primary)}
.btn-ghost{background:transparent;border-color:transparent;color:var(--fg2)}
.btn-danger{background:color-mix(in srgb, var(--error) 15%, transparent);border-color:color-mix(in srgb, var(--error) 30%, transparent);color:var(--error)}
.btn-disabled{background:var(--card-bg);border-color:var(--card-border);color:var(--fg3);cursor:not-allowed;opacity:.6}

/* ── BADGES & ALERTS ── */
.badge-row{display:flex;flex-wrap:wrap;gap:8px}
.alert-banner{display:flex;align-items:flex-start;gap:12px;padding:14px 18px;border-radius:var(--r-md);margin-top:10px;border:1px solid}
.alert-body{flex:1}
.alert-title{font-size:13px;font-weight:700;margin-bottom:2px}
.alert-desc{font-size:12px;opacity:.8}
.alert-close{background:none;border:none;cursor:pointer;opacity:.6;font-size:16px;color:inherit}

/* ── TYPE SCALE ── */
.type-scale{background:var(--card-bg);border:1px solid var(--card-border);border-radius:var(--r-card);padding:24px 28px;display:flex;flex-direction:column;gap:0}
.type-row{display:flex;align-items:baseline;gap:16px;padding:14px 0;border-bottom:1px solid color-mix(in srgb, var(--card-border) 60%, transparent)}
.type-row:last-child{border-bottom:none;padding-bottom:0}
.type-meta{font-size:10px;color:var(--fg3);font-family:var(--font-mono);min-width:140px;flex-shrink:0}

/* ── COLOR GRID ── */
.color-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px}
.color-swatch{border-radius:var(--r-sm);padding:10px;height:80px;display:flex;flex-direction:column;justify-content:flex-end;border:1px solid var(--card-border)}
.color-name{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em}
.color-hex{font-size:10px;font-family:var(--font-mono);opacity:.8;margin-top:2px}

/* ── FOOTER ── */
footer{border-top:1px solid var(--card-border);padding:40px 32px;margin-top:16px}
.footer-inner{max-width:1400px;margin:0 auto;display:grid;grid-template-columns:1fr auto auto auto;gap:40px;align-items:start}
.footer-links h4{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--fg3);margin-bottom:12px}
.footer-links a{display:block;font-size:13px;color:var(--fg2);text-decoration:none;margin-bottom:6px}
.footer-copy{font-size:11px;color:var(--fg3);margin-top:16px;padding-top:16px;border-top:1px solid var(--card-border);font-family:var(--font-mono)}

@keyframes spin{to{transform:rotate(360deg)}}
.spin{display:inline-block;width:13px;height:13px;border:2px solid color-mix(in srgb, var(--primary) 30%, transparent);border-top-color:var(--primary);border-radius:50%;animation:spin .7s linear infinite}
</style>`;
}

// ── Aerchain logo inline SVG ────────────────────────────────
const LOGO_SVG = `<svg width="110" height="20" viewBox="0 0 168 32" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#pL)"><path d="M3.8 27C3.6 27.4 3.4 27.7 3.3 27.8 3.1 27.9 2.8 28 2.4 28H.7C.2 28 0 27.9 0 27.6 0 27.4.1 27.3.2 27L10.4 5.7C10.7 5 11 4.5 11.1 4.3 11.3 4.1 11.5 4 11.7 4 11.9 4 12.1 4.1 12.2 4.3 12.4 4.5 12.6 5 12.9 5.7L23.2 27C23.4 27.3 23.4 27.5 23.4 27.6 23.4 27.9 23.2 28 22.7 28H20.8C20.4 28 20.2 27.9 20 27.8 19.8 27.7 19.7 27.4 19.4 27L11.6 10.3Z" fill="var(--logo-fg,white)"/><path d="M40.5 24.9V27.2C40.5 27.5 40.4 27.7 40.3 27.8 40.2 27.9 40 28 39.7 28H27C26.8 28 26.6 27.9 26.5 27.8 26.4 27.7 26.4 27.5 26.4 27.2V4.8C26.4 4.5 26.4 4.3 26.5 4.2 26.6 4.1 26.8 4 27.1 4H39.9C40.2 4 40.4 4.1 40.5 4.2 40.6 4.3 40.7 4.5 40.7 4.8V6.5C40.7 6.8 40.6 7 40.5 7.1 40.4 7.2 40.2 7.3 39.9 7.3H30.2C30 7.3 29.9 7.3 29.8 7.3 29.8 7.4 29.7 7.5 29.7 7.6V14C29.7 14.1 29.8 14.2 29.8 14.2 29.9 14.3 30 14.3 30.2 14.3H38.8C39 14.3 39.2 14.4 39.3 14.5 39.4 14.6 39.5 14.8 39.5 15.1V16.8C39.5 17.1 39.4 17.3 39.3 17.4 39.2 17.5 39 17.5 38.8 17.5H30.2C30 17.5 29.9 17.6 29.8 17.6 29.8 17.7 29.7 17.8 29.7 17.9V24.4C29.7 24.5 29.8 24.6 29.8 24.7 29.9 24.7 30 24.7 30.2 24.7H39.9C40.2 24.7 40.4 24.8 40.5 24.9Z" fill="var(--logo-fg,white)"/><path d="M48.7 27.8C48.6 27.9 48.4 28 48.1 28H46.2C46 28 45.8 27.9 45.7 27.8 45.6 27.7 45.5 27.5 45.5 27.2V4.8C45.5 4.5 45.6 4.3 45.7 4.2 45.8 4.1 46 4 46.2 4H52.7C59.2 4 62.4 6.5 62.4 11.4 62.4 13.1 62 14.4 61.2 15.5 60.3 16.6 59.2 17.4 57.8 17.9L63.6 27C63.8 27.2 63.9 27.4 63.9 27.6 63.9 27.8 63.8 27.9 63.7 27.9 63.6 28 63.4 28 63.1 28H61.1C60.7 28 60.5 27.9 60.3 27.8 60.1 27.7 59.9 27.5 59.6 27.1L53.4 17.1C53.3 16.9 53.2 16.7 53.2 16.6 53.2 16.4 53.4 16.3 53.7 16.3 57.1 15.9 58.8 14.4 58.8 11.6 58.8 10.1 58.3 9 57.2 8.2 56.1 7.5 54.6 7.2 52.5 7.2H49.3C49.1 7.2 49 7.2 49 7.2 48.9 7.3 48.9 7.4 48.9 7.6V27.2C48.9 27.5 48.8 27.7 48.7 27.8Z" fill="var(--logo-fg,white)"/><path d="M84.6 22.4C84.8 22.2 85 22.1 85.2 22.1 85.3 22.1 85.4 22.2 85.4 22.2 85.5 22.3 85.6 22.4 85.7 22.5L86.7 23.8C86.8 23.9 86.8 24.1 86.8 24.3 86.8 24.4 86.8 24.5 86.7 24.6 86.7 24.7 86.6 24.8 86.4 24.9 85.2 25.9 83.9 26.6 82.4 27.2 80.9 27.7 79.3 28 77.7 28 75.4 28 73.4 27.5 71.6 26.5 69.7 25.4 68.3 24 67.2 22.2 66.1 20.4 65.6 18.4 65.6 16.1 65.6 13.8 66.1 11.8 67.2 9.9 68.3 8.1 69.7 6.6 71.6 5.6 73.5 4.5 75.6 4 77.9 4 79.5 4 81 4.3 82.5 4.8 84 5.4 85.3 6.1 86.5 7.1 86.7 7.2 86.8 7.4 86.8 7.6 86.8 7.7 86.7 7.9 86.6 8.1L85.6 9.4C85.4 9.7 85.3 9.8 85.1 9.8 85 9.8 84.7 9.7 84.5 9.5 83.5 8.8 82.5 8.2 81.3 7.8 80.2 7.4 79 7.2 77.8 7.2 76.2 7.2 74.7 7.5 73.4 8.3 72.1 9 71.1 10.1 70.3 11.4 69.5 12.8 69.1 14.3 69.1 16 69.1 17.7 69.5 19.2 70.3 20.5 71 21.9 72.1 22.9 73.4 23.7 74.7 24.5 76.2 24.8 77.8 24.8 80.3 24.8 82.6 24 84.6 22.4Z" fill="var(--logo-fg,white)"/><path d="M109.4 27.8C109.3 27.9 109.1 28 108.8 28H106.9C106.7 28 106.5 27.9 106.4 27.8 106.2 27.7 106.2 27.5 106.2 27.2V17.7C106.2 17.5 106.1 17.4 106.1 17.4 106 17.3 105.9 17.3 105.8 17.3H94.6C94.4 17.3 94.3 17.3 94.2 17.4 94.2 17.4 94.2 17.5 94.2 17.7V27.2C94.2 27.5 94.1 27.7 94 27.8 93.9 27.9 93.7 28 93.4 28H91.5C91.2 28 91.1 27.9 90.9 27.8 90.8 27.7 90.8 27.5 90.8 27.2V4.8C90.8 4.5 90.8 4.3 90.9 4.2 91 4.1 91.2 4 91.5 4H93.4C93.7 4 93.9 4.1 94 4.2 94.1 4.3 94.2 4.5 94.2 4.8V13.7C94.2 13.8 94.2 13.9 94.2 14 94.3 14 94.4 14.1 94.6 14.1H105.8C106 14.1 106 14 106.1 14 106.1 13.9 106.2 13.8 106.2 13.7V4.8C106.2 4.5 106.2 4.3 106.4 4.2 106.5 4.1 106.7 4 106.9 4H108.8C109.1 4 109.3 4.1 109.4 4.2 109.5 4.3 109.6 4.5 109.6 4.8V27.2C109.6 27.5 109.5 27.7 109.4 27.8Z" fill="var(--logo-fg,white)"/><path d="M164.3 4.2C164.4 4.1 164.6 4 164.8 4H166.7C167 4 167.2 4.1 167.3 4.2 167.4 4.3 167.5 4.4 167.5 4.7V26.9C167.5 27.6 167.2 28 166.8 28 166.6 28 166.4 27.9 166.2 27.8 166 27.6 165.7 27.4 165.4 27L151.6 11V26.9C151.6 27.2 151.6 27.4 151.4 27.5 151.3 27.6 151.1 27.6 150.9 27.6H149C148.7 27.6 148.5 27.6 148.4 27.5 148.3 27.4 148.2 27.2 148.2 26.9V5.1C148.2 4.7 148.3 4.4 148.4 4.3 148.5 4.1 148.7 4 148.9 4 149.1 4 149.3 4.1 149.5 4.2 149.7 4.4 150 4.6 150.3 5L164.1 20.9V4.7C164.1 4.4 164.1 4.3 164.3 4.2Z" fill="var(--logo-fg,white)"/><path d="M141.6 11.1C142.7 11 143.5 10 143.4 8.9 143.2 7.8 142.3 7 141.2 7.1 140.1 7.2 139.3 8.2 139.4 9.3 139.6 10.4 140.5 11.2 141.6 11.1Z" fill="#DC5F40"/><path d="M143.9 20.6C144 16.2 142.1 10.8 137.3 13.8 136.8 14 136.6 13.9 136.4 13.6 135.8 12.5 135.3 11.4 134.7 10.2 130.4-1.2 125.4 5.3 120.1 12.1 108.3 27.4 113.9 34.3 132.4 20.8 133.1 20.3 134.4 19.3 134.9 19.3 135.3 19.2 135.5 19.6 135.9 20.4 136.3 21.3 136.9 22.5 137.4 23.4 140.6 29.6 144.1 28.2 143.9 20.6ZM129.9 18.3C127.6 19.8 125.4 21.6 122.8 22.7 121.7 23.1 120 22.6 119.6 21.7 119.2 20.3 120.8 18.2 121.6 16.7 122.5 15.1 123.8 13.6 124.9 12 126.1 10.5 127.6 8.3 129.8 9.3 131.5 10.3 132.2 13 133.2 14.7 133.7 15.4 133.6 15.9 132.9 16.3 131.9 16.9 130.9 17.6 129.9 18.3ZM142.6 21.2C142.5 22.1 142.3 25.3 141.3 23.8 140.3 21.9 139.2 19.5 138.2 17.5 137.8 16.5 140.2 16 140.8 16.2 142.5 16.9 142.6 19.6 142.6 21.2Z" fill="#DC5F40"/></g><defs><clipPath id="pL"><rect width="168" height="32" fill="white"/></clipPath></defs></svg>`;

// ── STATIC HTML SKELETON ─────────────────────────────────────
// All 10 sections with realistic Aerchain sales data.
// Every visual property uses var() references — the :root block controls everything.

const SKELETON_HTML = `
<!-- ═══ 1. HEADER / NAV ═══ -->
<nav class="topbar">
  ${LOGO_SVG}
  <div class="nav-links">
    <a href="#" class="active">Dashboard</a>
    <a href="#">Pipeline</a>
    <a href="#">Reports</a>
    <a href="#">Team</a>
  </div>
  <div class="spacer"></div>
  <input class="search" placeholder="Search deals…">
  <div class="bell">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
    <div class="dot"></div>
  </div>
  <button class="theme-btn">&#9680;</button>
  <div class="avatar">SC</div>
</nav>

<div class="page">

<!-- ═══ 2. KPI STRIP ═══ -->
<div class="section-title">Key Metrics</div>
<div class="kpi-strip">
  <div class="kpi-card">
    <div class="kpi-label">Pipeline</div>
    <div class="kpi-value">$4.2M</div>
    <div class="kpi-trend up">↑ 18% <svg width="60" height="24" viewBox="0 0 60 24"><rect x="2" y="16" width="5" height="8" rx="1" fill="var(--success)" opacity=".3"/><rect x="10" y="13" width="5" height="11" rx="1" fill="var(--success)" opacity=".4"/><rect x="18" y="10" width="5" height="14" rx="1" fill="var(--success)" opacity=".5"/><rect x="26" y="12" width="5" height="12" rx="1" fill="var(--success)" opacity=".5"/><rect x="34" y="8" width="5" height="16" rx="1" fill="var(--success)" opacity=".6"/><rect x="42" y="6" width="5" height="18" rx="1" fill="var(--success)" opacity=".7"/><rect x="50" y="3" width="5" height="21" rx="1" fill="var(--success)" opacity=".9"/></svg></div>
  </div>
  <div class="kpi-card">
    <div class="kpi-label">Deals Won</div>
    <div class="kpi-value">34</div>
    <div class="kpi-trend up">↑ 8 this month</div>
  </div>
  <div class="kpi-card">
    <div class="kpi-label">Win Rate</div>
    <div class="kpi-value">68%</div>
    <div class="kpi-trend up">↑ 5pp vs Q1</div>
  </div>
  <div class="kpi-card">
    <div class="kpi-label">MoM Growth</div>
    <div class="kpi-value">+12%</div>
    <div class="kpi-trend up">↑ Accelerating</div>
  </div>
  <div class="kpi-card">
    <div class="kpi-label">Quota</div>
    <div class="kpi-value">84%</div>
    <div class="kpi-trend down">↓ 16% remaining</div>
  </div>
</div>

<!-- ═══ 3. PIPELINE KANBAN ═══ -->
<div class="section-title">Pipeline</div>
<div class="kanban">
  <div class="kanban-col">
    <div class="col-header">Prospecting <span class="col-count">2</span></div>
    <div class="deal-card">
      <div class="deal-company">Helix Ventures</div>
      <div class="deal-value">$310K</div>
      <div class="deal-meta">
        <div class="avatar-sm" style="background:var(--primary)">MK</div>
        <span class="badge" style="background:var(--primary-light);color:var(--primary)">New</span>
        <div class="dot green"></div>
        <span class="time-ago">2d</span>
      </div>
    </div>
    <div class="deal-card">
      <div class="deal-company">Apex Industries</div>
      <div class="deal-value">$95K</div>
      <div class="deal-meta">
        <div class="avatar-sm" style="background:var(--success)">ER</div>
        <span class="badge" style="background:color-mix(in srgb, var(--warning) 15%, transparent);color:var(--warning)">Follow-up</span>
        <div class="dot amber"></div>
        <span class="time-ago">5d</span>
      </div>
    </div>
  </div>
  <div class="kanban-col">
    <div class="col-header">Qualified <span class="col-count">2</span></div>
    <div class="deal-card">
      <div class="deal-company">Meridian Corp</div>
      <div class="deal-value">$180K</div>
      <div class="deal-meta">
        <div class="avatar-sm" style="background:var(--accent)">VP</div>
        <span class="badge" style="background:var(--primary-light);color:var(--primary)">RFP</span>
        <div class="dot green"></div>
        <span class="time-ago">1d</span>
      </div>
    </div>
    <div class="deal-card">
      <div class="deal-company">Cascade Systems</div>
      <div class="deal-value">$67K</div>
      <div class="deal-meta">
        <div class="avatar-sm" style="background:var(--warning)">PN</div>
        <span class="badge" style="background:color-mix(in srgb, var(--success) 15%, transparent);color:var(--success)">Demo done</span>
        <div class="dot green"></div>
        <span class="time-ago">3d</span>
      </div>
    </div>
  </div>
  <div class="kanban-col">
    <div class="col-header">Proposal <span class="col-count">2</span></div>
    <div class="deal-card">
      <div class="deal-company">Project Atlas</div>
      <div class="deal-value">$240K</div>
      <div class="deal-meta">
        <div class="avatar-sm" style="background:var(--gp)">SC</div>
        <span class="badge" style="background:color-mix(in srgb, var(--warning) 15%, transparent);color:var(--warning)">Pending</span>
        <div class="dot amber"></div>
        <span class="time-ago">1d</span>
      </div>
    </div>
    <div class="deal-card">
      <div class="deal-company">Blue Ridge Partners</div>
      <div class="deal-value">$155K</div>
      <div class="deal-meta">
        <div class="avatar-sm" style="background:var(--primary)">VP</div>
        <span class="badge" style="background:var(--primary-light);color:var(--primary)">Sent</span>
        <div class="dot green"></div>
        <span class="time-ago">4h</span>
      </div>
    </div>
  </div>
  <div class="kanban-col">
    <div class="col-header">Closed Won <span class="col-count">2</span></div>
    <div class="deal-card">
      <div class="deal-company">Tectonic Group</div>
      <div class="deal-value">$420K</div>
      <div class="deal-meta">
        <div class="avatar-sm" style="background:var(--success)">SC</div>
        <span class="badge" style="background:color-mix(in srgb, var(--success) 15%, transparent);color:var(--success)">Won</span>
        <div class="dot green"></div>
        <span class="time-ago">2d</span>
      </div>
    </div>
    <div class="deal-card">
      <div class="deal-company">Nomad Logistics</div>
      <div class="deal-value">$88K</div>
      <div class="deal-meta">
        <div class="avatar-sm" style="background:var(--accent)">MK</div>
        <span class="badge" style="background:color-mix(in srgb, var(--success) 15%, transparent);color:var(--success)">Won</span>
        <div class="dot green"></div>
        <span class="time-ago">1w</span>
      </div>
    </div>
  </div>
</div>

<!-- ═══ 4. REVENUE CHART ═══ -->
<div class="section-title">Revenue</div>
<div class="chart-wrap">
  <div class="chart-legend">
    <div class="legend-item"><div style="width:16px;height:3px;border-radius:2px;background:var(--primary)"></div> Actual</div>
    <div class="legend-item"><div style="width:16px;height:0;border-top:2px dashed var(--warning)"></div> Target</div>
  </div>
  <svg viewBox="0 0 700 200" width="100%" height="200" style="overflow:visible">
    <line x1="80" y1="20" x2="680" y2="20" stroke="var(--card-border)" stroke-width=".5"/>
    <line x1="80" y1="65" x2="680" y2="65" stroke="var(--card-border)" stroke-width=".5"/>
    <line x1="80" y1="110" x2="680" y2="110" stroke="var(--card-border)" stroke-width=".5"/>
    <line x1="80" y1="155" x2="680" y2="155" stroke="var(--card-border)" stroke-width=".5"/>
    <text x="8" y="24" fill="var(--fg3)" font-size="10" font-family="var(--font-mono)">$500K</text>
    <text x="8" y="69" fill="var(--fg3)" font-size="10" font-family="var(--font-mono)">$375K</text>
    <text x="8" y="114" fill="var(--fg3)" font-size="10" font-family="var(--font-mono)">$250K</text>
    <text x="8" y="159" fill="var(--fg3)" font-size="10" font-family="var(--font-mono)">$125K</text>
    <text x="130" y="190" fill="var(--fg3)" font-size="10" font-family="var(--font-mono)">Jan</text>
    <text x="230" y="190" fill="var(--fg3)" font-size="10" font-family="var(--font-mono)">Feb</text>
    <text x="330" y="190" fill="var(--fg3)" font-size="10" font-family="var(--font-mono)">Mar</text>
    <text x="430" y="190" fill="var(--fg3)" font-size="10" font-family="var(--font-mono)">Apr</text>
    <text x="530" y="190" fill="var(--fg3)" font-size="10" font-family="var(--font-mono)">May</text>
    <text x="620" y="190" fill="var(--fg3)" font-size="10" font-family="var(--font-mono)">Jun</text>
    <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--primary)" stop-opacity=".25"/><stop offset="100%" stop-color="var(--primary)" stop-opacity=".02"/></linearGradient></defs>
    <path fill="url(#ag)" d="M120,155 L220,128 L320,100 L420,72 L520,52 L620,38 L620,175 L120,175Z"/>
    <polyline fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="120,155 220,128 320,100 420,72 520,52 620,38"/>
    <polyline fill="none" stroke="var(--warning)" stroke-width="2" stroke-dasharray="6,3" points="120,145 220,118 320,95 420,78 520,62 620,52"/>
    <circle cx="120" cy="155" r="4" fill="var(--primary)"/><circle cx="220" cy="128" r="4" fill="var(--primary)"/><circle cx="320" cy="100" r="4" fill="var(--primary)"/><circle cx="420" cy="72" r="4" fill="var(--primary)"/><circle cx="520" cy="52" r="4" fill="var(--primary)"/><circle cx="620" cy="38" r="4" fill="var(--primary)"/>
  </svg>
</div>

<!-- ═══ 5. DEALS TABLE ═══ -->
<div class="section-title">Deals</div>
<div class="table-wrap">
  <table>
    <thead><tr><th>Deal</th><th>Stage</th><th>Value</th><th>Owner</th><th>Close Date</th><th>Health</th></tr></thead>
    <tbody>
      <tr><td>Project Atlas</td><td>Proposal</td><td style="font-family:var(--font-mono)">$240K</td><td>S. Chen</td><td>Apr 30</td><td><span class="dot green"></span></td></tr>
      <tr><td>Meridian Corp RFP</td><td>Qualified</td><td style="font-family:var(--font-mono)">$180K</td><td>V. Patel</td><td>May 15</td><td><span class="dot amber"></span></td></tr>
      <tr><td>Apex Industries</td><td>Prospecting</td><td style="font-family:var(--font-mono)">$95K</td><td>E. Rodriguez</td><td>Jun 1</td><td><span class="dot green"></span></td></tr>
      <tr><td>Helix Ventures</td><td>Negotiation</td><td style="font-family:var(--font-mono)">$310K</td><td>M. Kim</td><td>Mar 28</td><td><span class="dot red"></span></td></tr>
      <tr><td>Cascade Systems</td><td>Qualified</td><td style="font-family:var(--font-mono)">$67K</td><td>P. Nair</td><td>May 20</td><td><span class="dot green"></span></td></tr>
      <tr><td>Tectonic Group</td><td>Closed Won</td><td style="font-family:var(--font-mono)">$420K</td><td>S. Chen</td><td>Mar 1</td><td><span class="dot green"></span></td></tr>
    </tbody>
  </table>
  <div class="pagination">
    <button class="page-btn">Prev</button>
    <button class="page-btn active">1</button>
    <button class="page-btn">2</button>
    <button class="page-btn">3</button>
    <button class="page-btn">Next</button>
  </div>
</div>

<!-- ═══ 6. ACTIVITY FEED ═══ -->
<div class="section-title">Activity</div>
<div class="activity-list">
  <div class="activity-item">
    <div class="act-icon" style="background:color-mix(in srgb, var(--success) 15%, transparent);color:var(--success)">&#9742;</div>
    <div class="act-body"><div class="act-actor">Sarah Chen</div><div class="act-text">Called contact at Tectonic Group — confirmed PO signature</div></div>
    <span class="act-deal">Tectonic</span>
    <span class="act-time">2m ago</span>
  </div>
  <div class="activity-item">
    <div class="act-icon" style="background:color-mix(in srgb, var(--primary) 15%, transparent);color:var(--primary)">&#9993;</div>
    <div class="act-body"><div class="act-actor">Vikram Patel</div><div class="act-text">Emailed revised proposal to Meridian Corp procurement</div></div>
    <span class="act-deal">Meridian</span>
    <span class="act-time">14m ago</span>
  </div>
  <div class="activity-item">
    <div class="act-icon" style="background:color-mix(in srgb, var(--accent) 15%, transparent);color:var(--accent)">&#128197;</div>
    <div class="act-body"><div class="act-actor">Elena Rodriguez</div><div class="act-text">Scheduled demo for Apex Industries — Mar 22, 2pm EST</div></div>
    <span class="act-deal">Apex</span>
    <span class="act-time">1h ago</span>
  </div>
  <div class="activity-item">
    <div class="act-icon" style="background:color-mix(in srgb, var(--warning) 15%, transparent);color:var(--warning)">&#9998;</div>
    <div class="act-body"><div class="act-actor">Marcus Kim</div><div class="act-text">Added note: "CFO wants ROI analysis before Q2 board meeting"</div></div>
    <span class="act-deal">Helix</span>
    <span class="act-time">3h ago</span>
  </div>
  <div class="activity-item">
    <div class="act-icon" style="background:color-mix(in srgb, var(--success) 15%, transparent);color:var(--success)">&#9742;</div>
    <div class="act-body"><div class="act-actor">Priya Nair</div><div class="act-text">Cold call connected — Cascade Systems interested in Q3 pilot</div></div>
    <span class="act-deal">Cascade</span>
    <span class="act-time">5h ago</span>
  </div>
  <div class="activity-item">
    <div class="act-icon" style="background:color-mix(in srgb, var(--primary) 15%, transparent);color:var(--primary)">&#9993;</div>
    <div class="act-body"><div class="act-actor">Sarah Chen</div><div class="act-text">Sent contract to Blue Ridge Partners legal team</div></div>
    <span class="act-deal">Blue Ridge</span>
    <span class="act-time">yesterday</span>
  </div>
</div>

<!-- ═══ 7. FORM & BUTTON SHOWCASE ═══ -->
<div class="section-title">Components</div>
<div class="components-grid">
  <div class="comp-panel">
    <div class="comp-title">Form Controls</div>
    <div class="form-group"><label class="form-label">Company Name</label><input class="form-input" placeholder="e.g. Acme Corp"></div>
    <div class="form-group"><label class="form-label">Stage</label><select class="form-input"><option>Prospecting</option><option>Qualified</option><option>Proposal</option><option>Negotiation</option><option>Closed Won</option></select></div>
    <div class="form-group"><label class="form-label">Notes</label><textarea class="form-input" rows="3" placeholder="Add deal notes…"></textarea></div>
    <div class="checkbox-row"><input type="checkbox" checked> Email alerts</div>
    <div class="checkbox-row"><input type="checkbox"> Slack notifications</div>
    <div class="checkbox-row"><input type="checkbox" checked> Weekly digest</div>
    <div style="display:flex;align-items:center;gap:8px;margin-top:4px">
      <div class="toggle on"></div>
      <span style="font-size:13px;color:var(--fg2)">Auto-assign leads</span>
    </div>
  </div>
  <div class="comp-panel">
    <div class="comp-title">Button Variants</div>
    <div class="btn-row">
      <button class="btn btn-primary">Primary</button>
      <button class="btn btn-secondary">Secondary</button>
      <button class="btn btn-outline">Outline</button>
      <button class="btn btn-ghost">Ghost</button>
      <button class="btn btn-danger">Destructive</button>
      <button class="btn btn-disabled" disabled>Disabled</button>
      <button class="btn btn-primary"><span class="spin"></span> Loading</button>
    </div>
  </div>
</div>

<!-- ═══ 8. BADGE & ALERT SYSTEM ═══ -->
<div class="section-title">Status System</div>
<div class="badge-row">
  <span class="badge" style="background:color-mix(in srgb, var(--success) 15%, transparent);border:1px solid color-mix(in srgb, var(--success) 30%, transparent);color:var(--success)">Success</span>
  <span class="badge" style="background:color-mix(in srgb, var(--warning) 15%, transparent);border:1px solid color-mix(in srgb, var(--warning) 30%, transparent);color:var(--warning)">Warning</span>
  <span class="badge" style="background:color-mix(in srgb, var(--error) 15%, transparent);border:1px solid color-mix(in srgb, var(--error) 30%, transparent);color:var(--error)">Danger</span>
  <span class="badge" style="background:color-mix(in srgb, var(--primary) 15%, transparent);border:1px solid color-mix(in srgb, var(--primary) 30%, transparent);color:var(--primary)">Info</span>
  <span class="badge" style="background:color-mix(in srgb, var(--fg3) 15%, transparent);border:1px solid color-mix(in srgb, var(--fg3) 30%, transparent);color:var(--fg2)">Neutral</span>
  <span class="badge" style="background:color-mix(in srgb, var(--accent) 15%, transparent);border:1px solid color-mix(in srgb, var(--accent) 30%, transparent);color:var(--accent)">Pending</span>
  <span class="badge" style="background:color-mix(in srgb, var(--brand) 15%, transparent);border:1px solid color-mix(in srgb, var(--brand) 30%, transparent);color:var(--brand)">Hot</span>
</div>
<div class="alert-banner" style="background:color-mix(in srgb, var(--primary) 10%, transparent);border-color:color-mix(in srgb, var(--primary) 25%, transparent);color:var(--primary)">
  <span style="font-size:16px">&#8505;</span>
  <div class="alert-body"><div class="alert-title">Pipeline updated</div><div class="alert-desc">3 deals moved to Qualified stage this week — review recommended</div></div>
  <button class="alert-close" onclick="this.closest('.alert-banner').remove()">&#215;</button>
</div>
<div class="alert-banner" style="background:color-mix(in srgb, var(--warning) 10%, transparent);border-color:color-mix(in srgb, var(--warning) 25%, transparent);color:var(--warning)">
  <span style="font-size:16px">&#9888;</span>
  <div class="alert-body"><div class="alert-title">Quota at risk</div><div class="alert-desc">Q2 attainment is 62% with 18 days remaining — 3 deals need acceleration</div></div>
  <button class="alert-close" onclick="this.closest('.alert-banner').remove()">&#215;</button>
</div>

<!-- ═══ 9. TYPOGRAPHY & COLOUR TOKENS ═══ -->
<div class="section-title">Typography</div>
<div class="type-scale">
  <div class="type-row"><span class="type-meta">h1 · 32px · 800</span><span style="font-size:32px;font-weight:800">Sales Command Center</span></div>
  <div class="type-row"><span class="type-meta">h2 · 24px · 700</span><span style="font-size:24px;font-weight:700">Pipeline Overview</span></div>
  <div class="type-row"><span class="type-meta">h3 · 18px · 600</span><span style="font-size:18px;font-weight:600">Active Deals</span></div>
  <div class="type-row"><span class="type-meta">h4 · 14px · 600</span><span style="font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:.06em">Deal Details</span></div>
  <div class="type-row"><span class="type-meta">body · 14px · 400</span><span style="font-size:14px">Aerchain helps procurement teams close deals faster with intelligent pipeline management.</span></div>
  <div class="type-row"><span class="type-meta">caption · 12px · 400</span><span style="font-size:12px;color:var(--fg3)">Last updated 2 minutes ago</span></div>
  <div class="type-row"><span class="type-meta">mono · 12px · 500</span><code style="font-family:var(--font-mono);background:var(--card-bg);border:1px solid var(--card-border);padding:4px 10px;border-radius:var(--r-xs);font-size:12px">--primary: var(--primary)</code></div>
</div>

<!-- ═══ 10. FOOTER ═══ -->
</div><!-- /.page -->
<footer>
  <div class="footer-inner">
    <div>
      ${LOGO_SVG}
      <p style="font-size:13px;color:var(--fg3);margin-top:8px">Procurement intelligence for modern teams</p>
    </div>
    <div class="footer-links"><h4>Product</h4><a href="#">Dashboard</a><a href="#">Pipeline</a><a href="#">Reports</a><a href="#">Analytics</a></div>
    <div class="footer-links"><h4>Company</h4><a href="#">About</a><a href="#">Blog</a><a href="#">Careers</a></div>
    <div class="footer-links"><h4>Legal</h4><a href="#">Privacy</a><a href="#">Terms</a><a href="#">Security</a></div>
  </div>
  <div class="footer-copy">&copy; 2025 Aerchain Inc. All rights reserved.</div>
</footer>
`;
