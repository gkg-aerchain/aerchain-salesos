// ═══════════════════════════════════════════════════════════
// SNAPSHOT TESTS — lib/generators.js
// Run with: npx vitest run
// (vitest must be added: npm install -D vitest)
// ═══════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  generateHTML,
  generateMarkdown,
  generateJSON,
  generateReactTheme,
  buildOutputs,
} from '../generators.js';

// ---------------------------------------------------------------------------
// Minimal but realistic token fixture — mirrors what the design extractor
// produces for a purple/teal SaaS design system.
// ---------------------------------------------------------------------------
const TOKENS = {
  meta: {
    name: 'Aerchain DS',
    description: 'Clean SaaS design system with a purple/teal gradient identity.',
    theme: 'light',
    inspiration: 'Linear, Vercel',
  },
  colors: {
    primary: { hex: '#8B5CF6', name: 'Primary Violet', usage: 'Primary actions, highlights' },
    secondary: { hex: '#06B6D4', name: 'Cyan', usage: 'Accents, badges' },
    contentBg: { hex: '#FAFAFA', name: 'Content Background', usage: 'Page background' },
    cardBg: { hex: '#FFFFFF', name: 'Card Background', usage: 'Card surfaces' },
    cardBorder: { hex: '#F0F0F0', name: 'Card Border', usage: 'Card outlines' },
    sidebarBg: { hex: '#F9F9FB', name: 'Sidebar Background', usage: 'Navigation panel' },
    primaryLight: { hex: '#F3F0FF', name: 'Primary Light', usage: 'Tinted backgrounds' },
    textPrimary: { hex: '#1F2937', name: 'Text Primary', usage: 'Body copy, headings' },
    textSecondary: { hex: '#6B7280', name: 'Text Secondary', usage: 'Subheadings, captions' },
    textMuted: { hex: '#9CA3AF', name: 'Text Muted', usage: 'Placeholder, disabled' },
  },
  gradients: [
    {
      name: 'Primary Gradient',
      css: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
      usage: 'Primary buttons, hero accents',
    },
    {
      name: 'Header Wash',
      css: 'linear-gradient(120deg, #F3F0FF 0%, #E0F7FA 100%)',
      usage: 'Page header background tint',
    },
  ],
  typography: {
    fontFamily: "'Inter', system-ui, sans-serif",
    monoFamily: "'JetBrains Mono', monospace",
    googleFontsImport:
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap',
    scale: [
      { name: 'Display', size: '32px', weight: '800', tracking: 'normal', notes: 'gradient' },
      { name: 'Heading 1', size: '24px', weight: '700', tracking: 'normal', notes: '' },
      { name: 'Body', size: '14px', weight: '400', tracking: 'normal', notes: '' },
      { name: 'Caption', size: '11px', weight: '500', tracking: '0.04em', notes: 'uppercase muted' },
      { name: 'Code', size: '13px', weight: '400', tracking: 'normal', notes: 'mono' },
    ],
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '40px',
  },
  radius: {
    sm: { value: '8px', usage: 'Badges, chips' },
    md: { value: '12px', usage: 'Inputs, small cards' },
    lg: { value: '16px', usage: 'Cards' },
    xl: { value: '20px', usage: 'Modals, panels' },
    full: { value: '9999px', usage: 'Pills, avatars' },
  },
  shadows: {
    card: { css: '0 2px 12px rgba(0,0,0,0.04)', usage: 'Default card elevation' },
    elevated: { css: '0 8px 32px rgba(139,92,246,0.12)', usage: 'Hover or active card' },
    input: { css: '0 0 0 3px rgba(139,92,246,0.15)', usage: 'Focused input ring' },
  },
  components: {
    button: {
      borderRadius: '100px',
      padding: '10px 24px',
      fontSize: '13px',
      fontWeight: '600',
      variants: [
        { name: 'Primary', bg: 'linear-gradient(135deg,#8B5CF6,#06B6D4)', color: '#FFFFFF' },
        { name: 'Secondary', bg: '#FFFFFF', color: '#1F2937', border: '1.5px solid #F0F0F0' },
        { name: 'Ghost', bg: 'transparent', color: '#8B5CF6' },
      ],
    },
    card: {
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid #F0F0F0',
      hoverShadow: '0 8px 32px rgba(139,92,246,0.12)',
      hoverTransform: 'translateY(-2px)',
    },
    input: {
      borderRadius: '12px',
      padding: '10px 14px',
      border: '1.5px solid #F0F0F0',
      focusBorder: '#8B5CF6',
      focusShadow: '0 0 0 3px rgba(139,92,246,0.15)',
    },
    table: {
      headerFontSize: '11px',
      headerWeight: '600',
      headerTransform: 'uppercase',
      cellPadding: '12px 16px',
      rowHoverBg: '#F9F9FB',
    },
    sidebar: {
      width: '220px',
      activeBackground: '#F3F0FF',
      activeColor: '#8B5CF6',
    },
  },
  designPrinciples: [
    'Clarity over decoration — every visual element earns its place.',
    'Gradient identity — the violet-to-cyan gradient is a consistent brand signal.',
    'Subtle depth — light shadows and micro-borders create hierarchy without noise.',
  ],
};

// ---------------------------------------------------------------------------
// generateHTML
// ---------------------------------------------------------------------------
describe('generateHTML', () => {
  it('produces a complete HTML document matching snapshot', () => {
    const result = generateHTML(TOKENS);
    expect(result).toMatchSnapshot();
  });

  it('returns a string starting with <!DOCTYPE html>', () => {
    const result = generateHTML(TOKENS);
    expect(typeof result).toBe('string');
    expect(result.trimStart()).toMatch(/^<!DOCTYPE html>/i);
  });

  it('includes the meta.name in the document title', () => {
    const result = generateHTML(TOKENS);
    expect(result).toContain('Aerchain DS');
  });

  it('renders all color keys as swatch divs', () => {
    const result = generateHTML(TOKENS);
    // Every key in TOKENS.colors should appear as a CSS hex value
    Object.values(TOKENS.colors).forEach(({ hex }) => {
      expect(result).toContain(hex);
    });
  });

  it('renders gradient strips', () => {
    const result = generateHTML(TOKENS);
    TOKENS.gradients.forEach((g) => {
      expect(result).toContain(g.css);
    });
  });

  it('renders typography scale specimens', () => {
    const result = generateHTML(TOKENS);
    TOKENS.typography.scale.forEach((t) => {
      expect(result).toContain(t.size);
    });
  });

  it('handles missing optional fields gracefully (no gradients, no designPrinciples)', () => {
    const minimal = {
      ...TOKENS,
      gradients: undefined,
      designPrinciples: undefined,
    };
    expect(() => generateHTML(minimal)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// generateMarkdown
// ---------------------------------------------------------------------------
describe('generateMarkdown', () => {
  it('produces a Markdown document matching snapshot', () => {
    const result = generateMarkdown(TOKENS);
    expect(result).toMatchSnapshot();
  });

  it('returns a string', () => {
    expect(typeof generateMarkdown(TOKENS)).toBe('string');
  });

  it('contains an H1 with the design system name', () => {
    const result = generateMarkdown(TOKENS);
    expect(result).toContain('# Aerchain DS');
  });

  it('contains a Colors section with all hex values', () => {
    const result = generateMarkdown(TOKENS);
    Object.values(TOKENS.colors).forEach(({ hex }) => {
      expect(result).toContain(hex);
    });
  });

  it('contains a Gradients section with all gradient CSS values', () => {
    const result = generateMarkdown(TOKENS);
    TOKENS.gradients.forEach((g) => {
      expect(result).toContain(g.css);
    });
  });

  it('contains a Typography section with all scale entries', () => {
    const result = generateMarkdown(TOKENS);
    TOKENS.typography.scale.forEach((t) => {
      expect(result).toContain(t.name);
      expect(result).toContain(t.size);
    });
  });

  it('contains a Spacing section with all spacing tokens', () => {
    const result = generateMarkdown(TOKENS);
    Object.values(TOKENS.spacing).forEach((v) => {
      expect(result).toContain(v);
    });
  });

  it('contains a Border Radius section', () => {
    const result = generateMarkdown(TOKENS);
    Object.values(TOKENS.radius).forEach(({ value }) => {
      expect(result).toContain(value);
    });
  });

  it('contains a Shadows section', () => {
    const result = generateMarkdown(TOKENS);
    Object.values(TOKENS.shadows).forEach(({ css }) => {
      expect(result).toContain(css);
    });
  });

  it('contains numbered design principles', () => {
    const result = generateMarkdown(TOKENS);
    expect(result).toContain('1. Clarity over decoration');
    expect(result).toContain('2. Gradient identity');
    expect(result).toContain('3. Subtle depth');
  });

  it('handles empty gradients and designPrinciples arrays', () => {
    const minimal = { ...TOKENS, gradients: [], designPrinciples: [] };
    expect(() => generateMarkdown(minimal)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// generateJSON
// ---------------------------------------------------------------------------
describe('generateJSON', () => {
  it('produces a JSON string matching snapshot', () => {
    const result = generateJSON(TOKENS);
    expect(result).toMatchSnapshot();
  });

  it('returns valid JSON that round-trips to the original tokens', () => {
    const result = generateJSON(TOKENS);
    expect(typeof result).toBe('string');
    const parsed = JSON.parse(result);
    expect(parsed).toEqual(TOKENS);
  });

  it('uses 2-space indentation', () => {
    const result = generateJSON(TOKENS);
    // A 2-space indented JSON will have lines like "  "key": ..."
    expect(result).toMatch(/^{\n  "/);
  });
});

// ---------------------------------------------------------------------------
// generateReactTheme
// ---------------------------------------------------------------------------
describe('generateReactTheme', () => {
  it('produces a React theme file matching snapshot', () => {
    const result = generateReactTheme(TOKENS);
    expect(result).toMatchSnapshot();
  });

  it('returns a string', () => {
    expect(typeof generateReactTheme(TOKENS)).toBe('string');
  });

  it('exports a theme object and a styles object', () => {
    const result = generateReactTheme(TOKENS);
    expect(result).toContain('export const theme =');
    expect(result).toContain('export const styles =');
  });

  it('includes all color keys in the theme', () => {
    const result = generateReactTheme(TOKENS);
    Object.keys(TOKENS.colors).forEach((key) => {
      expect(result).toContain(`${key}:`);
    });
  });

  it('includes all color hex values in the theme', () => {
    const result = generateReactTheme(TOKENS);
    Object.values(TOKENS.colors).forEach(({ hex }) => {
      expect(result).toContain(hex);
    });
  });

  it('includes all spacing tokens', () => {
    const result = generateReactTheme(TOKENS);
    Object.entries(TOKENS.spacing).forEach(([k, v]) => {
      expect(result).toContain(`${k}:`);
      expect(result).toContain(v);
    });
  });

  it('includes all radius tokens', () => {
    const result = generateReactTheme(TOKENS);
    Object.values(TOKENS.radius).forEach(({ value }) => {
      expect(result).toContain(value);
    });
  });

  it('includes all shadow values', () => {
    const result = generateReactTheme(TOKENS);
    Object.values(TOKENS.shadows).forEach(({ css }) => {
      expect(result).toContain(css);
    });
  });

  it('includes card and button style blocks', () => {
    const result = generateReactTheme(TOKENS);
    expect(result).toContain('card:');
    expect(result).toContain('button:');
    expect(result).toContain('primary:');
    expect(result).toContain('secondary:');
    expect(result).toContain('input:');
  });

  it('handles missing optional fields (no gradients) gracefully', () => {
    const minimal = { ...TOKENS, gradients: undefined };
    expect(() => generateReactTheme(minimal)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// buildOutputs
// ---------------------------------------------------------------------------
describe('buildOutputs', () => {
  it('produces all four outputs matching snapshot', () => {
    const result = buildOutputs(TOKENS);
    expect(result).toMatchSnapshot();
  });

  it('returns an object with html, markdown, json, and react keys', () => {
    const result = buildOutputs(TOKENS);
    expect(result).toHaveProperty('html');
    expect(result).toHaveProperty('markdown');
    expect(result).toHaveProperty('json');
    expect(result).toHaveProperty('react');
  });

  it('html output equals generateHTML output', () => {
    const result = buildOutputs(TOKENS);
    expect(result.html).toBe(generateHTML(TOKENS));
  });

  it('markdown output equals generateMarkdown output', () => {
    const result = buildOutputs(TOKENS);
    expect(result.markdown).toBe(generateMarkdown(TOKENS));
  });

  it('json output equals generateJSON output', () => {
    const result = buildOutputs(TOKENS);
    expect(result.json).toBe(generateJSON(TOKENS));
  });

  it('react output equals generateReactTheme output', () => {
    const result = buildOutputs(TOKENS);
    expect(result.react).toBe(generateReactTheme(TOKENS));
  });
});
