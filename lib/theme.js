// Design tokens — single source of truth.
// Maps semantic names to CSS custom properties injected at runtime.
// Imported by App.jsx, DesignExtractorView.jsx, FileWorkspace.jsx, and all components.
export const T = {
  bg:        "var(--canvas)",
  bgCard:    "var(--glass-1)",
  bgActive:  "var(--active-bg)",
  border:    "var(--glass-border)",
  borderAcc: "var(--accent-border)",
  text:      "var(--fg)",
  muted:     "var(--fg2)",
  mutedSoft: "var(--fg3)",
  accent:    "var(--primary)",
  accentBg:  "var(--accent-bg)",
  success:   "var(--green)",
  warn:      "var(--amber)",
  error:     "var(--red)",
  glass:     "var(--s-glass)",
  elevated:  "var(--s-elevated)",
  glow:      "var(--s-glow)",
  divider:   "var(--divider)",
  badgeBg:   "var(--badge-bg)",
};

// Returns the full CSS stylesheet string for injection into <style>.
// Called once in App.jsx useEffect.
export function buildThemeStylesheet() {
  return `
      @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');
      *, *::before, *::after { box-sizing: border-box; }
      body { margin: 0; }

      /* Dark Canvas v3 tokens */
      :root[data-theme="dark"] {
        --canvas:       linear-gradient(145deg, hsl(265 30% 7%) 0%, hsl(270 20% 5%) 40%, hsl(260 15% 4%) 100%);
        --primary:      hsl(262 75% 62%);
        --accent:       hsl(275 80% 65%);
        --gp:           linear-gradient(135deg, hsl(262 75% 62%), hsl(275 80% 65%));
        --green:        hsl(152 60% 52%);
        --amber:        hsl(38 85% 58%);
        --red:          hsl(0 72% 62%);
        --glass-1:      rgba(255,255,255,0.04);
        --glass-2:      rgba(255,255,255,0.07);
        --glass-border: rgba(255,255,255,0.09);
        --fg:           rgba(255,255,255,0.88);
        --fg2:          rgba(255,255,255,0.60);
        --fg3:          rgba(255,255,255,0.35);
        --logo-fg:      white;
        --active-bg:    hsla(262,75%,62%,0.18);
        --accent-bg:    hsla(262,75%,62%,0.15);
        --accent-border:hsla(262,75%,62%,0.4);
        --divider:      rgba(255,255,255,0.10);
        --badge-bg:     rgba(255,255,255,0.06);
        --topbar-bg:    rgba(255,255,255,0.03);
        --sidebar-bg:   rgba(255,255,255,0.03);
        --orb-1:        radial-gradient(circle, hsl(265 60% 25% / .30) 0%, transparent 70%);
        --orb-2:        radial-gradient(circle, hsl(255 50% 22% / .25) 0%, transparent 70%);
        --s-glass:      0 2px 16px rgba(0,0,0,0.40), 0 0 0 1px rgba(255,255,255,0.04) inset;
        --s-elevated:   0 12px 40px -6px rgba(0,0,0,0.60), 0 0 0 1px rgba(255,255,255,0.07) inset;
        --s-glow:       0 0 24px rgba(124,58,237,0.18);
      }
      :root[data-theme="light"] {
        --canvas:       hsl(262 30% 92%);
        --primary:      hsl(262 65% 52%);
        --accent:       hsl(275 70% 55%);
        --gp:           linear-gradient(135deg, #DC5F40, hsl(262 65% 52%));
        --green:        hsl(152 55% 42%);
        --amber:        hsl(38 80% 48%);
        --red:          hsl(0 65% 52%);
        --glass-1:      rgba(255,255,255,0.90);
        --glass-2:      rgba(255,255,255,0.50);
        --glass-border: rgba(124,58,237,0.10);
        --fg:           rgba(0,0,0,0.88);
        --fg2:          rgba(0,0,0,0.45);
        --fg3:          rgba(80,40,180,0.40);
        --logo-fg:      #1a1a2e;
        --active-bg:    linear-gradient(135deg, rgba(124,58,237,0.12), rgba(220,95,64,0.08));
        --accent-bg:    rgba(124,58,237,0.15);
        --accent-border:rgba(124,58,237,0.15);
        --divider:      rgba(124,58,237,0.10);
        --badge-bg:     rgba(124,58,237,0.08);
        --topbar-bg:    rgba(255,255,255,0.82);
        --sidebar-bg:   rgba(255,255,255,0.55);
        --orb-1:        radial-gradient(circle, hsla(262,50%,75%,0.25) 0%, transparent 70%);
        --orb-2:        radial-gradient(circle, hsla(20,60%,70%,0.15) 0%, transparent 70%);
        --s-glass:      0 2px 12px rgba(124,58,237,0.08), inset 0 0 0 1px rgba(255,255,255,0.5);
        --s-elevated:   0 8px 24px rgba(124,58,237,0.10), inset 0 0 0 1px rgba(255,255,255,0.5);
        --s-glow:       0 0 16px rgba(124,58,237,0.12);
      }

      /* Clean Enterprise theme — matches Aerchain procurement platform */
      :root[data-theme="clean"] {
        --canvas:       #F8F9FC;
        --primary:      hsl(262 65% 52%);
        --accent:       hsl(275 70% 55%);
        --gp:           linear-gradient(135deg, hsl(262 65% 52%), hsl(280 60% 58%));
        --green:        hsl(152 55% 42%);
        --amber:        hsl(38 80% 48%);
        --red:          hsl(0 65% 52%);
        --glass-1:      #FFFFFF;
        --glass-2:      #F3F4F6;
        --glass-border: #E5E7EB;
        --fg:           #111827;
        --fg2:          #6B7280;
        --fg3:          #9CA3AF;
        --logo-fg:      #1a1a2e;
        --active-bg:    rgba(124,58,237,0.08);
        --accent-bg:    rgba(124,58,237,0.08);
        --accent-border:rgba(124,58,237,0.25);
        --divider:      #E5E7EB;
        --badge-bg:     #F3F4F6;
        --topbar-bg:    #FFFFFF;
        --sidebar-bg:   #FFFFFF;
        --orb-1:        radial-gradient(circle, transparent 0%, transparent 70%);
        --orb-2:        radial-gradient(circle, transparent 0%, transparent 70%);
        --s-glass:      0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04);
        --s-elevated:   0 4px 16px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06);
        --s-glow:       0 0 0 transparent;
      }

      ::selection { background: hsla(262,80%,55%,0.30); }
      ::-webkit-scrollbar { width: 5px; height: 5px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.10); border-radius: 3px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.20); }
      [data-theme="light"] ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); }
      [data-theme="light"] ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.20); }
      [data-theme="clean"] ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.10); }
      [data-theme="clean"] ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.18); }

      @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
      @keyframes fadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
      @keyframes orbA { 0%{transform:translate(0,0)scale(1)} 100%{transform:translate(30px,-25px)scale(1.08)} }
      @keyframes orbB { 0%{transform:translate(0,0)scale(1)} 100%{transform:translate(-22px,28px)scale(1.06)} }
      @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

      .module-item:hover { background: var(--glass-2) !important; }
      .table-row:hover { background: var(--glass-1) !important; }

      .glass-surface {
        background: var(--glass-1);
        -webkit-backdrop-filter: blur(40px) saturate(1.4);
        backdrop-filter: blur(40px) saturate(1.4);
        border: 1px solid var(--glass-border);
      }
      .glass-topbar {
        background: var(--topbar-bg);
        -webkit-backdrop-filter: blur(40px) saturate(1.4);
        backdrop-filter: blur(40px) saturate(1.4);
        border-bottom: 1px solid var(--glass-border);
      }
      .glass-sidebar {
        background: var(--sidebar-bg);
        -webkit-backdrop-filter: blur(40px) saturate(1.3);
        backdrop-filter: blur(40px) saturate(1.3);
        border-right: 1px solid var(--glass-border);
      }
      .icon-btn {
        background: none; border: none; padding: 6px;
        border-radius: 6px; cursor: pointer;
        color: var(--fg3); display: flex; align-items: center;
        transition: all 0.15s;
      }
      .icon-btn:hover { color: var(--fg); }
    `;
}
