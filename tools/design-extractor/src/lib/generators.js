// ═══════════════════════════════════════════════════════════
// OUTPUT GENERATORS
// Takes structured JSON tokens → produces HTML, MD, JSON, React outputs
// ═══════════════════════════════════════════════════════════

export function generateHTML(tokens) {
  const { meta, colors, gradients, typography, spacing, radius, shadows, components, designPrinciples } = tokens;

  const colorSwatches = Object.entries(colors).map(([key, c]) => {
    const isLight = ['contentBg','cardBg','cardBorder','sidebarBg','primaryLight','secondaryLight','successLight','warningLight','errorLight'].includes(key);
    return `<div class="swatch ${isLight ? 'dark-text' : 'light-text'}" style="background:${c.hex};${isLight ? 'border:1px solid #E5E7EB;' : ''}"><span class="swatch-name">${c.name}</span>${c.hex}</div>`;
  }).join('\n      ');

  const gradientStrips = (gradients || []).map(g =>
    `<div class="gradient-strip" style="background:${g.css};">${g.name} — ${g.usage}</div>`
  ).join('\n    ');

  const typeSpecimens = (typography.scale || []).map(t =>
    `<div class="type-specimen">
      <div style="font-size:${t.size};font-weight:${t.weight};${t.tracking !== 'normal' ? `letter-spacing:${t.tracking};` : ''}${t.notes?.includes('uppercase') ? 'text-transform:uppercase;' : ''}${t.notes?.includes('muted') ? `color:${colors.textMuted?.hex || '#9CA3AF'};` : ''}${t.notes?.includes('gradient') ? `background:${gradients?.[0]?.css || 'linear-gradient(135deg,#8B5CF6,#06B6D4)'};-webkit-background-clip:text;-webkit-text-fill-color:transparent;` : ''}${t.notes?.includes('mono') || t.notes?.includes('Mono') ? `font-family:${typography.monoFamily || 'monospace'};` : ''}">${meta.name} — ${t.name}</div>
      <div class="type-meta">${t.size} / ${t.weight}${t.tracking !== 'normal' ? ` / ${t.tracking} tracking` : ''} — ${t.name}${t.notes ? ` (${t.notes})` : ''}</div>
    </div>`
  ).join('\n    ');

  const radiusBoxes = Object.entries(radius).map(([key, r]) =>
    `<div style="width:60px;height:50px;background:${colors.primaryLight?.hex || '#F3F0FF'};border:2px solid ${colors.primaryBorder?.hex || '#DDD6FE'};border-radius:${r.value};display:flex;align-items:center;justify-content:center;font-size:10px;font-family:monospace;">${r.value}</div>`
  ).join('\n        ');

  const principles = (designPrinciples || []).map((p, i) =>
    `<li style="padding:8px 0;border-bottom:1px solid ${colors.cardBorder?.hex || '#F0F0F0'};font-size:13px;">${p}</li>`
  ).join('\n      ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${meta.name} — Design System Reference</title>
${typography.googleFontsImport ? `<link href="${typography.googleFontsImport}" rel="stylesheet">` : ''}
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: ${typography.fontFamily || 'system-ui, sans-serif'};
  font-size: 14px; line-height: 1.55;
  background: ${colors.contentBg?.hex || '#FAFAFA'};
  color: ${colors.textPrimary?.hex || '#1F2937'};
  -webkit-font-smoothing: antialiased;
}
.page { max-width: 1200px; margin: 0 auto; padding: 40px 32px 80px; }
.section { margin-bottom: 56px; }
.section-title {
  font-size: 24px; font-weight: 800; margin-bottom: 8px;
  ${gradients?.[0]?.css ? `background: ${gradients[0].css}; -webkit-background-clip: text; -webkit-text-fill-color: transparent;` : `color: ${colors.primary?.hex || '#8B5CF6'};`}
}
.section-desc { font-size: 14px; color: ${colors.textSecondary?.hex || '#6B7280'}; margin-bottom: 24px; }
.subsection-title { font-size: 15px; font-weight: 700; margin-bottom: 14px; }
.sample-card {
  background: ${colors.cardBg?.hex || '#FFFFFF'};
  border: 1px solid ${colors.cardBorder?.hex || '#F0F0F0'};
  border-radius: ${radius.lg?.value || '16px'};
  padding: 24px;
  box-shadow: ${shadows.card?.css || '0 2px 12px rgba(0,0,0,0.04)'};
  margin-bottom: 20px;
}
.swatch-row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; }
.swatch {
  width: 100px; height: 80px; border-radius: ${radius.md?.value || '12px'};
  display: flex; flex-direction: column; justify-content: flex-end;
  padding: 8px; font-size: 10px; font-family: ${typography.monoFamily || 'monospace'};
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.swatch.light-text { color: white; }
.swatch.dark-text { color: ${colors.textPrimary?.hex || '#1F2937'}; }
.swatch-name { font-weight: 600; font-family: ${typography.fontFamily || 'system-ui'}; font-size: 11px; }
.gradient-strip {
  height: 56px; border-radius: ${radius.md?.value || '12px'};
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 12px; color: white;
  margin-bottom: 10px;
}
.type-specimen { padding: 16px 0; border-bottom: 1px solid ${colors.cardBorder?.hex || '#F0F0F0'}; }
.type-specimen:last-child { border-bottom: none; }
.type-meta { font-size: 11px; font-family: ${typography.monoFamily || 'monospace'}; color: ${colors.textMuted?.hex || '#9CA3AF'}; margin-top: 4px; }
.page-header {
  ${gradients?.[1]?.css ? `background: ${gradients[1].css};` : `background: ${colors.primaryLight?.hex || '#F3F0FF'};`}
  border-radius: ${radius.xl?.value || '20px'};
  padding: 40px; margin-bottom: 48px;
}
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.flex-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
</style>
</head>
<body>
<div class="page">

<div class="page-header">
  <h1 style="font-size:32px;font-weight:800;margin-bottom:8px;">${meta.name}</h1>
  <p style="font-size:15px;color:${colors.textSecondary?.hex || '#6B7280'};max-width:600px;">${meta.description}</p>
  <div style="margin-top:12px;font-size:12px;color:${colors.textMuted?.hex || '#9CA3AF'};">Theme: ${meta.theme} | ${meta.inspiration || ''}</div>
</div>

<div class="section">
  <div class="section-title">Color Palette</div>
  <div class="section-desc">All color tokens extracted from the design</div>
  <div class="swatch-row">
    ${colorSwatches}
  </div>
</div>

<div class="section">
  <div class="section-title">Gradients</div>
  <div class="section-desc">Gradient definitions</div>
  ${gradientStrips}
</div>

<div class="section">
  <div class="section-title">Typography</div>
  <div class="section-desc">Font: ${typography.fontFamily} | Mono: ${typography.monoFamily || 'monospace'}</div>
  <div class="sample-card">
    ${typeSpecimens}
  </div>
</div>

<div class="section">
  <div class="section-title">Border Radius</div>
  <div class="section-desc">Radius scale</div>
  <div class="flex-row">
    ${radiusBoxes}
  </div>
</div>

<div class="section">
  <div class="section-title">Design Principles</div>
  <div class="section-desc">Core rules that define this design system</div>
  <div class="sample-card">
    <ol style="padding-left:20px;list-style:decimal;">
      ${principles}
    </ol>
  </div>
</div>

</div>
</body>
</html>`;
}


export function generateMarkdown(tokens) {
  const { meta, colors, gradients, typography, spacing, radius, shadows, components, designPrinciples } = tokens;

  const colorTable = Object.entries(colors).map(([key, c]) =>
    `| \`--${key}\` | \`${c.hex}\` | ${c.name} | ${c.usage} |`
  ).join('\n');

  const gradientTable = (gradients || []).map(g =>
    `| ${g.name} | \`${g.css}\` | ${g.usage} |`
  ).join('\n');

  const typeTable = (typography.scale || []).map(t =>
    `| ${t.name} | ${t.size} | ${t.weight} | ${t.tracking} | ${t.notes || ''} |`
  ).join('\n');

  const radiusTable = Object.entries(radius).map(([key, r]) =>
    `| \`--r-${key}\` | \`${r.value}\` | ${r.usage} |`
  ).join('\n');

  const shadowTable = Object.entries(shadows).map(([key, s]) =>
    `| ${key} | \`${s.css}\` | ${s.usage} |`
  ).join('\n');

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

  return `// ═══════════════════════════════════════════════════════════
// AUTO-GENERATED THEME — ${tokens.meta?.name || 'Design System'}
// Edit design tokens below, import into your React app
// ═══════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════
// STYLED COMPONENTS
// ═══════════════════════════════════════════════════════════

export const styles = {
  card: {
    background: '${colors.cardBg?.hex || '#FFFFFF'}',
    border: '${components.card?.border || '1px solid #F0F0F0'}',
    borderRadius: '${components.card?.borderRadius || '16px'}',
    padding: '${components.card?.padding || '24px'}',
    boxShadow: '${shadows.card?.css || 'none'}',
    transition: 'box-shadow 0.2s, transform 0.2s',
  },
  cardHover: {
    boxShadow: '${shadows.cardHover?.css || 'none'}',
    transform: '${components.card?.hoverTransform || 'translateY(-2px)'}',
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
      boxShadow: '${shadows.buttonGlow?.css || 'none'}',
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
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  inputFocus: {
    borderColor: '${components.input?.focusBorder || colors.primary?.hex || '#8B5CF6'}',
    boxShadow: '${shadows.focusRing?.css || 'none'}',
  },
  badge: (variant = 'primary') => {
    const map = {
      primary: { bg: '${colors.primaryLight?.hex || '#F3F0FF'}', color: '${colors.primary?.hex || '#8B5CF6'}', border: '${colors.primaryBorder?.hex || '#DDD6FE'}' },
      success: { bg: '${colors.successLight?.hex || '#ECFDF5'}', color: '${colors.success?.hex || '#10B981'}', border: '${colors.successBorder?.hex || '#A7F3D0'}' },
      warning: { bg: '${colors.warningLight?.hex || '#FFFBEB'}', color: '${colors.warning?.hex || '#F59E0B'}', border: '${colors.warningBorder?.hex || '#FDE68A'}' },
      error: { bg: '${colors.errorLight?.hex || '#FEF2F2'}', color: '${colors.error?.hex || '#EF4444'}', border: '${colors.errorBorder?.hex || '#FECACA'}' },
    };
    const v = map[variant] || map.primary;
    return {
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 10px', borderRadius: '100px',
      fontSize: '11px', fontWeight: '600',
      background: v.bg, color: v.color, border: \`1px solid \${v.border}\`,
    };
  },
};

// ═══════════════════════════════════════════════════════════
// EXAMPLE USAGE
// ═══════════════════════════════════════════════════════════
/*
import { theme, styles } from './theme';

function Card({ children }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      style={{ ...styles.card, ...(hovered ? styles.cardHover : {}) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </div>
  );
}

function Button({ children, variant = 'primary', ...props }) {
  return <button style={styles.button[variant]} {...props}>{children}</button>;
}

function Badge({ children, variant = 'primary' }) {
  return <span style={styles.badge(variant)}>{children}</span>;
}
*/
`;
}
