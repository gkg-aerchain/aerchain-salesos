// ═══════════════════════════════════════════════════════════
// DESIGN SYSTEM OUTPUT GENERATORS
// Shared by DesignExtractorView.jsx and demo-data/design-extractor.js
// Accepts a token JSON object, returns formatted output strings.
// ═══════════════════════════════════════════════════════════

export function generateHTML(tokens) {
  const { meta, colors, gradients, typography, spacing, radius, shadows, components, designPrinciples } = tokens;

  // Helper for safe color access
  const c = (key, fallback) => colors[key]?.hex || fallback;
  const r = (key, fallback) => radius[key]?.value || fallback;
  const s = (key, fallback) => shadows[key]?.css || fallback;
  const grad = (idx, fallback) => gradients?.[idx]?.css || fallback;

  const primary = c('primary', '#8B5CF6');
  const accent = c('secondary', primary);
  const success = c('success', '#10B981');
  const warning = c('warning', '#F59E0B');
  const error = c('error', '#EF4444');
  const brand = c('brand', '#DC5F40');
  const bg = c('contentBg', '#FAFAFA');
  const cardBg = c('cardBg', '#FFFFFF');
  const cardBorder = c('cardBorder', '#F0F0F0');
  const fg = c('textPrimary', '#1F2937');
  const fg2 = c('textSecondary', '#6B7280');
  const fg3 = c('textMuted', '#9CA3AF');
  const primaryLight = c('primaryLight', primary + '15');
  const primaryBorder = c('primaryBorder', primary + '30');
  const gp = grad(0, `linear-gradient(135deg, ${primary}, ${accent})`);
  const fontDisplay = typography?.fontFamily || "'system-ui', sans-serif";
  const fontMono = typography?.monoFamily || 'monospace';
  const rCard = r('lg', '16px');
  const rMd = r('md', '12px');
  const rSm = r('sm', '8px');
  const rPill = r('pill', '100px');
  const sCard = s('card', '0 2px 12px rgba(0,0,0,0.04)');
  const btnRadius = components?.button?.borderRadius || rPill;
  const btnPad = components?.button?.padding || '10px 24px';
  const btnFont = components?.button?.fontSize || '13px';
  const btnWeight = components?.button?.fontWeight || '600';

  // Build color swatches
  const colorSwatches = Object.entries(colors).map(([key, cv]) => {
    const isLight = ['contentBg','cardBg','cardBorder','sidebarBg','primaryLight','secondaryLight','successLight','warningLight','errorLight'].includes(key);
    return `<div class="swatch ${isLight ? 'dark-text' : 'light-text'}" style="background:${cv.hex};${isLight ? `border:1px solid ${cardBorder};` : ''}" onclick="navigator.clipboard.writeText('${cv.hex}');this.querySelector('.swatch-hex').textContent='Copied!';setTimeout(()=>this.querySelector('.swatch-hex').textContent='${cv.hex}',1200)" title="Click to copy ${cv.hex}"><span class="swatch-name">${cv.name}</span><span class="swatch-hex">${cv.hex}</span><span class="swatch-usage">${cv.usage || key}</span></div>`;
  }).join('\n');

  // Gradient strips
  const gradientStrips = (gradients || []).map(g =>
    `<div class="gradient-strip" style="background:${g.css};"><span>${g.name}</span><span class="grad-css">${g.css}</span></div>`
  ).join('\n');

  // Typography specimens
  const typeSpecimens = (typography?.scale || []).map(t => {
    const isGradient = t.notes?.includes('gradient');
    const isMono = t.notes?.includes('mono') || t.notes?.includes('Mono');
    return `<div class="type-row">
      <span class="type-meta">${t.size} / ${t.weight}</span>
      <span style="font-size:${t.size};font-weight:${t.weight};${t.tracking !== 'normal' ? `letter-spacing:${t.tracking};` : ''}${isGradient ? `background:${gp};-webkit-background-clip:text;-webkit-text-fill-color:transparent;` : ''}${isMono ? `font-family:${fontMono};` : ''}">${meta.name} — ${t.name}</span>
    </div>`;
  }).join('\n');

  // Spacing scale
  const spacingBars = Object.entries(spacing || {}).map(([key, val]) =>
    `<div class="spacing-item"><span class="sp-label">${key}</span><div class="sp-bar" style="width:${val};"></div><span class="sp-value">${val}</span></div>`
  ).join('\n');

  // Radius boxes
  const radiusBoxes = Object.entries(radius || {}).map(([key, rv]) =>
    `<div class="radius-box" style="border-radius:${rv.value};"><span class="r-val">${rv.value}</span><span class="r-label">${key}</span></div>`
  ).join('\n');

  // Shadow demos
  const shadowDemos = Object.entries(shadows || {}).map(([key, sv]) =>
    `<div class="shadow-demo" style="box-shadow:${sv.css};"><span class="sh-name">${key}</span><code class="sh-css">${sv.css}</code></div>`
  ).join('\n');

  // Button variants
  const btnVariants = (components?.button?.variants || [
    { name: 'primary', bg: gp, color: '#FFFFFF' },
    { name: 'secondary', bg: cardBg, color: fg, border: `1.5px solid ${cardBorder}` },
  ]).map(v => {
    const bgStyle = v.bg?.includes('gradient') ? `background:${v.bg}` : `background:${v.bg || cardBg}`;
    return `<button class="demo-btn" style="${bgStyle};color:${v.color || '#fff'};${v.border ? `border:${v.border};` : 'border:none;'}${v.shadow ? `box-shadow:${s(v.shadow, 'none')};` : ''}">${v.name}</button>`;
  }).join('\n');

  // Principles
  const principles = (designPrinciples || []).map((p, i) =>
    `<div class="principle"><span class="p-num">${String(i + 1).padStart(2, '0')}</span><span>${p}</span></div>`
  ).join('\n');

  // CSS tokens code block
  const cssTokensCode = `:root {\n${Object.entries(colors).map(([k, cv]) => `  --${k}: ${cv.hex};`).join('\n')}\n${(gradients || []).map((g, i) => `  --gradient-${i}: ${g.css};`).join('\n')}\n${Object.entries(spacing || {}).map(([k, v]) => `  --sp-${k}: ${v};`).join('\n')}\n${Object.entries(radius || {}).map(([k, rv]) => `  --r-${k}: ${rv.value};`).join('\n')}\n${Object.entries(shadows || {}).map(([k, sv]) => `  --shadow-${k}: ${sv.css};`).join('\n')}\n}`;

  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${meta.name} — Design System Reference</title>
${typography?.googleFontsImport ? `<link href="${typography.googleFontsImport}" rel="stylesheet">` : '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">'}
<style>
/* ── Reset & Base ── */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --primary:${primary};--accent:${accent};--success:${success};--warning:${warning};--error:${error};--brand:${brand};
  --gp:${gp};
  --bg:${bg};--card-bg:${cardBg};--card-border:${cardBorder};
  --fg:${fg};--fg2:${fg2};--fg3:${fg3};
  --primary-light:${primaryLight};--primary-border:${primaryBorder};
  --r-card:${rCard};--r-md:${rMd};--r-sm:${rSm};--r-pill:${rPill};
  --s-card:${sCard};
  --font-display:${fontDisplay};--font-mono:${fontMono};
}
[data-theme="dark"]{
  --bg:#0d0b14;--card-bg:rgba(255,255,255,0.04);--card-border:rgba(255,255,255,0.09);
  --fg:rgba(255,255,255,0.88);--fg2:rgba(255,255,255,0.60);--fg3:rgba(255,255,255,0.35);
  --primary-light:${primary}20;--primary-border:${primary}40;
}
body{background:var(--bg);color:var(--fg);font-family:var(--font-display);font-size:14px;line-height:1.55;-webkit-font-smoothing:antialiased;transition:background .3s,color .3s}
::selection{background:color-mix(in srgb, var(--primary) 25%, transparent)}

/* ── Layout ── */
.page{max-width:1200px;margin:0 auto;padding:40px 32px 80px}
.section{margin-bottom:56px}
.section-title{font-size:24px;font-weight:800;margin-bottom:8px;background:var(--gp);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.section-desc{font-size:14px;color:var(--fg2);margin-bottom:24px}
.card{background:var(--card-bg);border:1px solid var(--card-border);border-radius:var(--r-card);padding:24px;box-shadow:var(--s-card)}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}

/* ── Floating Nav ── */
.float-nav{position:sticky;top:16px;z-index:100;display:flex;align-items:center;gap:12px;padding:10px 20px;background:color-mix(in srgb, var(--card-bg) 85%, transparent);backdrop-filter:blur(20px);border:1px solid var(--card-border);border-radius:var(--r-pill);max-width:fit-content;margin:0 auto 32px}
.float-nav a{font-size:12px;font-weight:500;color:var(--fg3);text-decoration:none;padding:5px 12px;border-radius:var(--r-pill);transition:all .2s}
.float-nav a:hover{color:var(--fg);background:var(--primary-light)}
.theme-toggle{background:var(--card-bg);border:1px solid var(--card-border);border-radius:var(--r-pill);padding:5px 14px;font-size:13px;cursor:pointer;color:var(--fg2);transition:all .2s}

/* ── Hero Header ── */
.hero{border-radius:24px;padding:48px 40px;margin-bottom:48px;background:var(--gp);position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 30% 50%, rgba(255,255,255,0.15), transparent 70%)}
.hero h1{font-size:36px;font-weight:800;color:white;position:relative;margin-bottom:8px}
.hero p{font-size:15px;color:rgba(255,255,255,0.8);max-width:600px;position:relative}
.hero .meta{margin-top:16px;display:flex;gap:12px;position:relative}
.hero .tag{padding:4px 14px;border-radius:var(--r-pill);font-size:11px;font-weight:600;background:rgba(255,255,255,0.2);color:white;backdrop-filter:blur(10px)}

/* ── Color Swatches ── */
.swatch-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px}
.swatch{border-radius:var(--r-md);padding:12px;height:100px;display:flex;flex-direction:column;justify-content:flex-end;cursor:pointer;transition:transform .15s,box-shadow .15s;position:relative;overflow:hidden}
.swatch:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.12)}
.swatch.light-text{color:white}
.swatch.dark-text{color:var(--fg)}
.swatch-name{font-weight:700;font-size:11px;letter-spacing:.02em}
.swatch-hex{font-size:10px;font-family:var(--font-mono);opacity:.85;margin-top:2px}
.swatch-usage{font-size:9px;opacity:.6;margin-top:1px}

/* ── Gradients ── */
.gradient-strip{height:64px;border-radius:var(--r-md);display:flex;align-items:center;justify-content:space-between;padding:0 24px;font-weight:700;font-size:13px;color:white;margin-bottom:10px;transition:transform .15s}
.gradient-strip:hover{transform:translateY(-1px)}
.grad-css{font-size:10px;font-family:var(--font-mono);font-weight:400;opacity:.8}

/* ── Typography Scale ── */
.type-scale{display:flex;flex-direction:column;gap:0}
.type-row{display:flex;align-items:baseline;gap:16px;padding:16px 0;border-bottom:1px solid var(--card-border)}
.type-row:last-child{border-bottom:none}
.type-meta{font-size:10px;color:var(--fg3);font-family:var(--font-mono);min-width:120px;flex-shrink:0}

/* ── Spacing ── */
.spacing-item{display:flex;align-items:center;gap:12px;padding:8px 0}
.sp-label{font-size:11px;font-weight:600;font-family:var(--font-mono);color:var(--fg3);min-width:40px}
.sp-bar{height:8px;border-radius:var(--r-pill);background:var(--gp);transition:width .4s}
.sp-value{font-size:11px;font-family:var(--font-mono);color:var(--fg2)}

/* ── Radius ── */
.radius-grid{display:flex;gap:14px;flex-wrap:wrap}
.radius-box{width:72px;height:60px;background:var(--primary-light);border:2px solid var(--primary-border);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;transition:transform .15s}
.radius-box:hover{transform:scale(1.05)}
.r-val{font-size:10px;font-family:var(--font-mono);font-weight:600;color:var(--primary)}
.r-label{font-size:9px;color:var(--fg3);text-transform:uppercase;letter-spacing:.05em;font-weight:600}

/* ── Shadows ── */
.shadow-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px}
.shadow-demo{background:var(--card-bg);border:1px solid var(--card-border);border-radius:var(--r-card);padding:20px;display:flex;flex-direction:column;gap:6px;transition:transform .15s}
.shadow-demo:hover{transform:translateY(-2px)}
.sh-name{font-size:12px;font-weight:700;color:var(--fg)}
.sh-css{font-size:10px;font-family:var(--font-mono);color:var(--fg3);word-break:break-all}

/* ── Buttons ── */
.btn-showcase{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.demo-btn{padding:${btnPad};border-radius:${btnRadius};font-size:${btnFont};font-weight:${btnWeight};cursor:pointer;font-family:inherit;transition:all .15s;display:inline-flex;align-items:center;gap:6px}
.demo-btn:hover{transform:translateY(-1px);filter:brightness(1.05)}

/* ── Badges ── */
.badge-row{display:flex;flex-wrap:wrap;gap:8px}
.demo-badge{padding:4px 12px;border-radius:var(--r-pill);font-size:11px;font-weight:600}

/* ── Form Controls ── */
.demo-input{padding:10px 14px;background:var(--card-bg);border:1.5px solid var(--card-border);border-radius:var(--r-md);color:var(--fg);font-size:13px;outline:none;font-family:inherit;width:100%;transition:border-color .2s,box-shadow .2s}
.demo-input:focus{border-color:var(--primary);box-shadow:0 0 0 3px color-mix(in srgb, var(--primary) 12%, transparent)}

/* ── Alerts ── */
.alert{display:flex;align-items:flex-start;gap:12px;padding:14px 18px;border-radius:var(--r-md);border:1px solid}
.alert-body{flex:1}
.alert-title{font-size:13px;font-weight:700;margin-bottom:2px}
.alert-desc{font-size:12px;opacity:.8}

/* ── Design Principles ── */
.principle{display:flex;align-items:flex-start;gap:14px;padding:14px 0;border-bottom:1px solid var(--card-border)}
.principle:last-child{border-bottom:none}
.p-num{font-size:24px;font-weight:800;font-family:var(--font-mono);color:var(--primary);opacity:.3;min-width:36px;line-height:1}

/* ── CSS Tokens Code Block ── */
.code-block{background:${meta.theme === 'dark' ? 'rgba(0,0,0,0.4)' : '#1e1b2e'};border-radius:var(--r-md);padding:20px;overflow-x:auto;position:relative}
.code-block code{font-family:var(--font-mono);font-size:12px;line-height:1.7;color:#e2e8f0;white-space:pre}
.code-block .copy-btn{position:absolute;top:12px;right:12px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);border-radius:6px;padding:4px 12px;font-size:10px;color:rgba(255,255,255,0.7);cursor:pointer;font-family:inherit}

/* ── KPI Cards ── */
.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.kpi-card{background:var(--card-bg);border:1px solid var(--card-border);border-radius:var(--r-card);padding:18px 20px;position:relative;overflow:hidden}
.kpi-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--gp)}
.kpi-label{font-size:10px;color:var(--fg3);text-transform:uppercase;letter-spacing:.06em;font-weight:600;margin-bottom:6px}
.kpi-value{font-size:26px;font-weight:800;font-family:var(--font-mono)}

/* ── Table ── */
.demo-table{width:100%;border-collapse:collapse}
.demo-table thead th{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--fg3);padding:10px 14px;text-align:left;border-bottom:1px solid var(--card-border)}
.demo-table tbody tr{border-bottom:1px solid color-mix(in srgb, var(--card-border) 60%, transparent);transition:background .1s}
.demo-table tbody tr:hover{background:var(--primary-light)}
.demo-table tbody td{padding:10px 14px;font-size:13px;color:var(--fg2)}
.demo-table tbody td:first-child{color:var(--fg);font-weight:600}

/* ── Footer ── */
.ds-footer{border-top:1px solid var(--card-border);padding-top:32px;margin-top:16px;text-align:center;color:var(--fg3);font-size:11px;font-family:var(--font-mono)}

@media print{.float-nav,.theme-toggle{display:none!important}.hero{break-inside:avoid}}
</style>
</head>
<body>
<!-- Floating Nav -->
<nav class="float-nav">
  <strong style="font-size:13px;color:var(--fg);margin-right:8px">${meta.name}</strong>
  <a href="#colors">Colors</a>
  <a href="#gradients">Gradients</a>
  <a href="#typography">Type</a>
  <a href="#spacing">Spacing</a>
  <a href="#components">Components</a>
  <a href="#tokens">Tokens</a>
  <button class="theme-toggle" onclick="var h=document.documentElement;h.dataset.theme=h.dataset.theme==='dark'?'light':'dark'">&#9680; Theme</button>
</nav>

<div class="page">

<!-- Hero Header -->
<div class="hero">
  <h1>${meta.name}</h1>
  <p>${meta.description}</p>
  <div class="meta">
    <span class="tag">Theme: ${meta.theme}</span>
    ${meta.inspiration ? `<span class="tag">${meta.inspiration}</span>` : ''}
    <span class="tag">${Object.keys(colors).length} color tokens</span>
    <span class="tag">${(typography?.scale || []).length} type sizes</span>
  </div>
</div>

<!-- ═══ 1. COLORS ═══ -->
<div class="section" id="colors">
  <div class="section-title">Color Palette</div>
  <div class="section-desc">All ${Object.keys(colors).length} color tokens — click any swatch to copy its hex value</div>
  <div class="swatch-grid">
    ${colorSwatches}
  </div>
</div>

<!-- ═══ 2. GRADIENTS ═══ -->
<div class="section" id="gradients">
  <div class="section-title">Gradients</div>
  <div class="section-desc">${(gradients || []).length} gradient definitions used across the system</div>
  ${gradientStrips}
</div>

<!-- ═══ 3. TYPOGRAPHY ═══ -->
<div class="section" id="typography">
  <div class="section-title">Typography Scale</div>
  <div class="section-desc">Primary: ${fontDisplay} &nbsp;|&nbsp; Mono: ${fontMono}</div>
  <div class="card">
    <div class="type-scale">
      ${typeSpecimens}
    </div>
  </div>
</div>

<!-- ═══ 4. SPACING ═══ -->
<div class="section" id="spacing">
  <div class="section-title">Spacing Scale</div>
  <div class="section-desc">Consistent spacing tokens from xs to xxxl</div>
  <div class="card">
    ${spacingBars}
  </div>
</div>

<!-- ═══ 5. BORDER RADIUS ═══ -->
<div class="section">
  <div class="section-title">Border Radius</div>
  <div class="section-desc">Radius scale from subtle rounding to pill shapes</div>
  <div class="radius-grid">
    ${radiusBoxes}
  </div>
</div>

<!-- ═══ 6. ELEVATION & SHADOWS ═══ -->
<div class="section">
  <div class="section-title">Elevation & Shadows</div>
  <div class="section-desc">Shadow tokens for layered depth</div>
  <div class="shadow-grid">
    ${shadowDemos}
  </div>
</div>

<!-- ═══ 7. COMPONENTS ═══ -->
<div class="section" id="components">
  <div class="section-title">Components</div>
  <div class="section-desc">Live component demos using extracted tokens</div>
  <div class="grid-2">
    <!-- Buttons -->
    <div class="card">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--fg3);margin-bottom:14px">Button Variants</div>
      <div class="btn-showcase">
        ${btnVariants}
      </div>
    </div>
    <!-- Badges -->
    <div class="card">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--fg3);margin-bottom:14px">Badges & Status</div>
      <div class="badge-row">
        <span class="demo-badge" style="background:color-mix(in srgb, var(--success) 15%, transparent);border:1px solid color-mix(in srgb, var(--success) 30%, transparent);color:var(--success)">Success</span>
        <span class="demo-badge" style="background:color-mix(in srgb, var(--warning) 15%, transparent);border:1px solid color-mix(in srgb, var(--warning) 30%, transparent);color:var(--warning)">Warning</span>
        <span class="demo-badge" style="background:color-mix(in srgb, var(--error) 15%, transparent);border:1px solid color-mix(in srgb, var(--error) 30%, transparent);color:var(--error)">Error</span>
        <span class="demo-badge" style="background:color-mix(in srgb, var(--primary) 15%, transparent);border:1px solid color-mix(in srgb, var(--primary) 30%, transparent);color:var(--primary)">Info</span>
        <span class="demo-badge" style="background:color-mix(in srgb, var(--accent) 15%, transparent);border:1px solid color-mix(in srgb, var(--accent) 30%, transparent);color:var(--accent)">Pending</span>
      </div>
    </div>
    <!-- Form Controls -->
    <div class="card">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--fg3);margin-bottom:14px">Form Controls</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <input class="demo-input" placeholder="Text input" value="Aerchain SalesOS">
        <select class="demo-input"><option>Select an option</option><option>Pipeline</option><option>Proposals</option></select>
        <textarea class="demo-input" rows="2" placeholder="Textarea..."></textarea>
      </div>
    </div>
    <!-- Alerts -->
    <div class="card">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--fg3);margin-bottom:14px">Alert Banners</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div class="alert" style="background:color-mix(in srgb, var(--primary) 10%, transparent);border-color:color-mix(in srgb, var(--primary) 25%, transparent);color:var(--primary)">
          <div class="alert-body"><div class="alert-title">Information</div><div class="alert-desc">Pipeline updated with 3 new deals</div></div>
        </div>
        <div class="alert" style="background:color-mix(in srgb, var(--success) 10%, transparent);border-color:color-mix(in srgb, var(--success) 25%, transparent);color:var(--success)">
          <div class="alert-body"><div class="alert-title">Success</div><div class="alert-desc">Deal closed — $420K added to revenue</div></div>
        </div>
        <div class="alert" style="background:color-mix(in srgb, var(--warning) 10%, transparent);border-color:color-mix(in srgb, var(--warning) 25%, transparent);color:var(--warning)">
          <div class="alert-body"><div class="alert-title">Warning</div><div class="alert-desc">Q2 quota at risk — 18 days remaining</div></div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ═══ 8. KPI METRICS ═══ -->
<div class="section">
  <div class="section-title">Metrics & KPI Cards</div>
  <div class="section-desc">Dashboard metric cards with accent bar</div>
  <div class="kpi-grid">
    <div class="kpi-card"><div class="kpi-label">Pipeline</div><div class="kpi-value">$4.2M</div></div>
    <div class="kpi-card"><div class="kpi-label">Deals Won</div><div class="kpi-value">34</div></div>
    <div class="kpi-card"><div class="kpi-label">Win Rate</div><div class="kpi-value">68%</div></div>
    <div class="kpi-card"><div class="kpi-label">Revenue</div><div class="kpi-value">$1.8M</div></div>
  </div>
</div>

<!-- ═══ 9. DATA TABLE ═══ -->
<div class="section">
  <div class="section-title">Data Table</div>
  <div class="section-desc">Table component with hover states and type hierarchy</div>
  <div class="card" style="padding:0;overflow:hidden">
    <table class="demo-table">
      <thead><tr><th>Deal</th><th>Stage</th><th>Value</th><th>Owner</th><th>Close Date</th></tr></thead>
      <tbody>
        <tr><td>Project Atlas</td><td>Proposal</td><td style="font-family:var(--font-mono)">$240K</td><td>S. Chen</td><td>Apr 30</td></tr>
        <tr><td>Meridian Corp</td><td>Qualified</td><td style="font-family:var(--font-mono)">$180K</td><td>V. Patel</td><td>May 15</td></tr>
        <tr><td>Helix Ventures</td><td>Negotiation</td><td style="font-family:var(--font-mono)">$310K</td><td>M. Kim</td><td>Mar 28</td></tr>
        <tr><td>Tectonic Group</td><td>Closed Won</td><td style="font-family:var(--font-mono)">$420K</td><td>S. Chen</td><td>Mar 1</td></tr>
      </tbody>
    </table>
  </div>
</div>

<!-- ═══ 10. DESIGN PRINCIPLES ═══ -->
<div class="section">
  <div class="section-title">Design Principles</div>
  <div class="section-desc">${(designPrinciples || []).length} core rules that define this design system</div>
  <div class="card">
    ${principles}
  </div>
</div>

<!-- ═══ 11. CSS TOKENS ═══ -->
<div class="section" id="tokens">
  <div class="section-title">CSS Custom Properties</div>
  <div class="section-desc">Copy-paste ready CSS variables for implementation</div>
  <div class="code-block">
    <button class="copy-btn" onclick="navigator.clipboard.writeText(this.nextElementSibling.textContent);this.textContent='Copied!';setTimeout(()=>this.textContent='Copy',1200)">Copy</button>
    <code>${cssTokensCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code>
  </div>
</div>

</div><!-- /.page -->

<div class="ds-footer">
  Auto-generated by Aerchain Design Extractor &mdash; ${new Date().toLocaleDateString()}
</div>

</body>
</html>`;
}

export function generateMarkdown(tokens) {
  const { meta, colors, gradients, typography, spacing, radius, shadows, components, designPrinciples } = tokens;
  const colorTable = Object.entries(colors).map(([key, c]) => `| \`--${key}\` | \`${c.hex}\` | ${c.name} | ${c.usage} |`).join('\n');
  const gradientTable = (gradients || []).map(g => `| ${g.name} | \`${g.css}\` | ${g.usage} |`).join('\n');
  const typeTable = (typography.scale || []).map(t => `| ${t.name} | ${t.size} | ${t.weight} | ${t.tracking} | ${t.notes || ''} |`).join('\n');
  const radiusTable = Object.entries(radius).map(([key, r]) => `| \`--r-${key}\` | \`${r.value}\` | ${r.usage} |`).join('\n');
  const shadowTable = Object.entries(shadows).map(([key, s]) => `| ${key} | \`${s.css}\` | ${s.usage} |`).join('\n');
  const principles = (designPrinciples || []).map((p, i) => `${i + 1}. ${p}`).join('\n');

  return `# ${meta.name} — Design System Specification

> ${meta.description}
> Theme: ${meta.theme} | Inspiration: ${meta.inspiration || 'N/A'}

---

## Colors

| Token | Hex | Name | Usage |
|-------|-----|------|-------|
${colorTable}

## Gradients

| Name | CSS | Usage |
|------|-----|-------|
${gradientTable}

## Typography

- **Font Family:** \`${typography.fontFamily}\`
- **Mono Family:** \`${typography.monoFamily || 'monospace'}\`
${typography.googleFontsImport ? `- **Google Fonts:** \`${typography.googleFontsImport}\`` : ''}

| Element | Size | Weight | Tracking | Notes |
|---------|------|--------|----------|-------|
${typeTable}

## Spacing

| Token | Value |
|-------|-------|
${Object.entries(spacing).map(([k, v]) => `| \`--sp-${k}\` | \`${v}\` |`).join('\n')}

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
${radiusTable}

## Shadows

| Name | CSS | Usage |
|------|-----|-------|
${shadowTable}

## Components

### Button
- Border Radius: \`${components.button?.borderRadius}\`
- Padding: \`${components.button?.padding}\`
- Font: \`${components.button?.fontSize}\` / \`${components.button?.fontWeight}\`
${(components.button?.variants || []).map(v => `- **${v.name}**: bg \`${v.bg}\`, color \`${v.color}\`${v.border ? `, border \`${v.border}\`` : ''}`).join('\n')}

### Card
- Border Radius: \`${components.card?.borderRadius}\`
- Padding: \`${components.card?.padding}\`
- Border: \`${components.card?.border}\`
- Hover: shadow → \`${components.card?.hoverShadow}\`, transform: \`${components.card?.hoverTransform}\`

### Input
- Border Radius: \`${components.input?.borderRadius}\`
- Padding: \`${components.input?.padding}\`
- Focus: border \`${components.input?.focusBorder}\` + shadow \`${components.input?.focusShadow}\`

### Table
- Header: \`${components.table?.headerFontSize}\` / \`${components.table?.headerWeight}\` / \`${components.table?.headerTransform}\`
- Cell Padding: \`${components.table?.cellPadding}\`
- Row Hover: \`${components.table?.rowHoverBg}\`

### Sidebar
- Width: \`${components.sidebar?.width}\`
- Active: bg \`${components.sidebar?.activeBackground}\`, color \`${components.sidebar?.activeColor}\`

## Design Principles

${principles}

---

*Auto-generated by Aerchain Design Extractor*
`;
}

export function generateJSON(tokens) {
  return JSON.stringify(tokens, null, 2);
}

export function generateReactTheme(tokens) {
  const { colors, gradients, typography, spacing, radius, shadows, components } = tokens;
  return `// AUTO-GENERATED THEME — ${tokens.meta?.name || 'Design System'}

export const theme = {
  colors: {
${Object.entries(colors).map(([k, c]) => `    ${k}: '${c.hex}',`).join('\n')}
  },
  gradients: {
${(gradients || []).map(g => `    ${g.name.toLowerCase().replace(/\s+/g, '')}: '${g.css}',`).join('\n')}
  },
  typography: {
    fontFamily: "${typography.fontFamily}",
    monoFamily: "${typography.monoFamily || 'monospace'}",
  },
  spacing: {
${Object.entries(spacing).map(([k, v]) => `    ${k}: '${v}',`).join('\n')}
  },
  radius: {
${Object.entries(radius).map(([k, r]) => `    ${k}: '${r.value}',`).join('\n')}
  },
  shadows: {
${Object.entries(shadows).map(([k, s]) => `    ${k}: '${s.css}',`).join('\n')}
  },
};

export const styles = {
  card: {
    background: '${colors.cardBg?.hex || '#FFFFFF'}',
    border: '${components.card?.border || '1px solid #F0F0F0'}',
    borderRadius: '${components.card?.borderRadius || '16px'}',
    padding: '${components.card?.padding || '24px'}',
    boxShadow: '${shadows.card?.css || 'none'}',
  },
  button: {
    primary: {
      background: '${gradients?.[0]?.css || colors.primary?.hex || '#8B5CF6'}',
      color: '#FFFFFF',
      borderRadius: '${components.button?.borderRadius || '100px'}',
      padding: '${components.button?.padding || '10px 24px'}',
      fontSize: '${components.button?.fontSize || '13px'}',
      fontWeight: '${components.button?.fontWeight || '600'}',
      border: 'none',
      cursor: 'pointer',
    },
    secondary: {
      background: '${colors.cardBg?.hex || '#FFFFFF'}',
      color: '${colors.textPrimary?.hex || '#1F2937'}',
      borderRadius: '${components.button?.borderRadius || '100px'}',
      padding: '${components.button?.padding || '10px 24px'}',
      fontSize: '${components.button?.fontSize || '13px'}',
      fontWeight: '${components.button?.fontWeight || '600'}',
      border: '1.5px solid ${colors.cardBorder?.hex || '#F0F0F0'}',
      cursor: 'pointer',
    },
  },
  input: {
    padding: '${components.input?.padding || '10px 14px'}',
    borderRadius: '${components.input?.borderRadius || '12px'}',
    border: '${components.input?.border || '1.5px solid #F0F0F0'}',
    fontSize: '13px',
    fontFamily: '${typography.fontFamily}',
    outline: 'none',
  },
};
`;
}

// Helper to generate all 4 outputs at once
export function buildOutputs(tokens) {
  return {
    html: generateHTML(tokens),
    markdown: generateMarkdown(tokens),
    json: generateJSON(tokens),
    react: generateReactTheme(tokens),
  };
}
