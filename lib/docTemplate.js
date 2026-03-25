// ═══════════════════════════════════════════════════════════
// AERCHAIN DOCUMENT TEMPLATE
// Static HTML template builder. Takes structured JSON content
// and renders a complete, self-contained themed HTML document.
// Claude only needs to return the structured JSON — this file
// handles ALL styling, theming, and layout.
// ═══════════════════════════════════════════════════════════

// Inline SVG of the Aerchain logo (white text + orange AI icon) for dark backgrounds
const AERCHAIN_LOGO_SVG = `<svg height="22" viewBox="0 0 168 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.7951 26.9895C3.61396 27.3937 3.43282 27.6616 3.254 27.7956C3.07286 27.9295 2.80115 27.9977 2.44119 27.9977H0.678569C0.225721 27.9977 0.000457764 27.852 0.000457764 27.5606C0.000457764 27.4478 0.056193 27.2574 0.169986 26.9895L10.3672 5.68021C10.7063 4.98698 10.9547 4.53109 11.1127 4.31959C11.2706 4.10575 11.4633 4 11.6886 4C11.893 4 12.0671 4.10575 12.2134 4.31959C12.3597 4.53344 12.6036 4.98698 12.9426 5.68021L23.242 26.9895C23.3558 27.2574 23.4116 27.4501 23.4116 27.5606C23.4116 27.852 23.1747 27.9977 22.7009 27.9977H20.8036C20.4413 27.9977 20.1766 27.9295 20.0071 27.7956C19.8375 27.6616 19.6518 27.3914 19.4474 26.9895L11.6212 10.2509L3.7951 26.9895Z" fill="#FFFFFF"/><path d="M40.5221 24.8957C40.6359 24.9991 40.6916 25.1989 40.6916 25.495V27.2433C40.6916 27.5418 40.6359 27.7415 40.5221 27.8426C40.4083 27.946 40.2179 27.9977 39.9462 27.9977H27.1062C26.8345 27.9977 26.644 27.946 26.5302 27.8426C26.4165 27.7392 26.3607 27.5394 26.3607 27.2433V4.75433C26.3607 4.45824 26.4165 4.25614 26.5302 4.1551C26.6417 4.0517 26.8345 4 27.1039 4H39.9113C40.183 4 40.3735 4.0517 40.4873 4.1551C40.6011 4.25849 40.6568 4.45824 40.6568 4.75433V6.50269C40.6568 6.80114 40.6011 7.00088 40.4873 7.10193C40.3735 7.20533 40.183 7.25703 39.9113 7.25703H30.153C29.9951 7.25703 29.8883 7.28523 29.8302 7.34162C29.7745 7.39802 29.7466 7.49672 29.7466 7.63302V13.9074C29.7466 14.0672 29.7745 14.1753 29.8302 14.234C29.886 14.2904 29.9928 14.3186 30.153 14.3186H38.7595C39.0312 14.3186 39.2216 14.3703 39.3354 14.4737C39.4492 14.5771 39.5049 14.7769 39.5049 15.0729V16.7861C39.5049 17.061 39.4492 17.2537 39.3354 17.3688C39.2216 17.484 39.0312 17.5404 38.7595 17.5404H30.153C29.9951 17.5404 29.8883 17.5686 29.8302 17.625C29.7745 17.6814 29.7466 17.7801 29.7466 17.9164V24.3623C29.7466 24.4986 29.7745 24.5973 29.8302 24.6537C29.886 24.7101 29.9928 24.7383 30.153 24.7383H39.9438C40.2156 24.7383 40.406 24.79 40.5198 24.8934L40.5221 24.8957Z" fill="#FFFFFF"/><path d="M48.7198 27.8449C48.606 27.9483 48.4156 28 48.1439 28H46.2466C45.9748 28 45.7844 27.9483 45.6706 27.8449C45.5568 27.7415 45.5011 27.5418 45.5011 27.2457V4.75433C45.5011 4.45824 45.5568 4.25614 45.6706 4.1551C45.7844 4.0517 45.9772 4 46.2466 4H52.7188C59.1562 4 62.3749 6.47919 62.3749 11.4399C62.3749 13.0849 61.9685 14.4408 61.1557 15.503C60.3429 16.5652 59.212 17.35 57.7675 17.8506L63.5941 26.9707C63.7753 27.2222 63.8659 27.4384 63.8659 27.6217C63.8659 27.758 63.8031 27.8567 63.6801 27.9131C63.5547 27.9695 63.3689 27.9977 63.1204 27.9977H61.1209C60.7377 27.9977 60.4544 27.9413 60.2733 27.8261C60.0921 27.711 59.8785 27.4619 59.63 27.0718L53.3969 17.061C53.2622 16.8777 53.1926 16.7179 53.1926 16.5816C53.1926 16.3983 53.3621 16.2949 53.7011 16.2738C57.1126 15.9095 58.8172 14.3656 58.8172 11.6444C58.8172 10.0911 58.2807 8.95369 57.2078 8.23225C56.1349 7.51317 54.5813 7.15128 52.5493 7.15128H49.2957C49.1378 7.15128 49.031 7.17948 48.9729 7.23588C48.9172 7.29227 48.8893 7.40272 48.8893 7.56252V27.241C48.8893 27.5394 48.8336 27.7392 48.7198 27.8402V27.8449Z" fill="#FFFFFF"/><path d="M84.5991 22.4471C84.8476 22.2473 85.0404 22.1486 85.1751 22.1486C85.2656 22.1486 85.3562 22.1815 85.4468 22.2473C85.5374 22.3131 85.6163 22.3907 85.6837 22.48L86.666 23.81C86.7798 23.944 86.8355 24.0991 86.8355 24.2753C86.8355 24.3646 86.8007 24.4586 86.7333 24.5573C86.666 24.656 86.5638 24.7618 86.4291 24.8722C85.2308 25.8686 83.8815 26.6394 82.3813 27.1822C80.8788 27.7251 79.3043 27.9977 77.6555 27.9977C75.4423 27.9977 73.415 27.4877 71.5734 26.4678C69.7318 25.448 68.2757 24.0309 67.2028 22.2121C66.1299 20.3956 65.5934 18.3558 65.5934 16.0952C65.5934 13.8345 66.1299 11.7525 67.2028 9.91247C68.2757 8.07246 69.7434 6.62724 71.6082 5.57446C73.4707 4.52639 75.5538 4 77.8575 4C79.4831 4 81.0367 4.27729 82.516 4.83188C83.9953 5.38647 85.3121 6.1408 86.464 7.09253C86.6892 7.24763 86.803 7.41447 86.803 7.59072C86.803 7.74581 86.7357 7.92206 86.5986 8.12181L85.6163 9.41898C85.4352 9.66337 85.254 9.78557 85.0752 9.78557C84.9405 9.78557 84.7478 9.69627 84.4993 9.52002C83.5286 8.78919 82.4766 8.21345 81.3479 7.79046C80.2193 7.36982 79.0326 7.15833 77.7902 7.15833C76.1855 7.15833 74.7247 7.53432 73.4033 8.28865C72.0819 9.04298 71.0369 10.0958 70.2682 11.447C69.4995 12.7982 69.1164 14.328 69.1164 16.0341C69.1164 17.7401 69.4949 19.1689 70.252 20.5225C71.009 21.8737 72.0471 22.9335 73.3685 23.6973C74.6899 24.461 76.1646 24.844 77.7902 24.844C80.3424 24.844 82.6113 24.0474 84.5991 22.4518V22.4471Z" fill="#FFFFFF"/><path d="M109.401 27.8449C109.288 27.9483 109.097 28 108.826 28H106.928C106.657 28 106.466 27.9483 106.352 27.8449C106.238 27.7415 106.183 27.5418 106.183 27.2457V17.6814C106.183 17.5451 106.155 17.4464 106.099 17.39C106.043 17.3336 105.934 17.3054 105.776 17.3054H94.562C94.4041 17.3054 94.2972 17.3336 94.2392 17.39C94.1834 17.4464 94.1556 17.5451 94.1556 17.6814V27.2457C94.1556 27.5441 94.0998 27.7439 93.986 27.8449C93.8722 27.9483 93.6818 28 93.4101 28H91.5128C91.2411 28 91.0507 27.9483 90.9369 27.8449C90.8231 27.7415 90.7673 27.5418 90.7673 27.2457V4.75433C90.7673 4.45824 90.8231 4.25614 90.9369 4.1551C91.0483 4.0517 91.2411 4 91.5105 4H93.4078C93.6795 4 93.8723 4.0517 93.9837 4.1551C94.0975 4.25849 94.1532 4.45824 94.1532 4.75433V13.6677C94.1532 13.804 94.1811 13.9074 94.2369 13.9755C94.2926 14.0437 94.3994 14.0789 94.5596 14.0789H105.774C105.932 14.0789 106.039 14.0437 106.097 13.9755C106.153 13.9074 106.18 13.804 106.18 13.6677V4.75433C106.18 4.45824 106.236 4.25614 106.35 4.1551C106.464 4.0517 106.657 4 106.928 4H108.826C109.095 4 109.288 4.0517 109.401 4.1551C109.515 4.25849 109.571 4.45824 109.571 4.75433V27.2457C109.571 27.5441 109.515 27.7439 109.401 27.8449Z" fill="#FFFFFF"/><path d="M164.252 4.1504C164.366 4.04935 164.558 4 164.828 4H166.725C166.997 4 167.189 4.04935 167.301 4.1504C167.415 4.24909 167.47 4.44414 167.47 4.73318V26.9049C167.47 27.6358 167.245 28.0023 166.792 28.0023C166.611 28.0023 166.421 27.9295 166.216 27.7862C166.012 27.6428 165.731 27.3702 165.369 26.9707L151.614 11.0498V26.9049C151.614 27.194 151.558 27.3867 151.444 27.4877C151.33 27.5864 151.14 27.6381 150.868 27.6381H148.971C148.699 27.6381 148.509 27.5888 148.395 27.4877C148.281 27.389 148.226 27.194 148.226 26.9049V5.09742C148.226 4.72143 148.281 4.44414 148.395 4.26554C148.509 4.0893 148.69 4 148.939 4C149.12 4 149.31 4.07285 149.514 4.2162C149.719 4.35954 149.988 4.63214 150.327 5.03163L164.082 20.9525V4.73083C164.082 4.44414 164.138 4.24909 164.252 4.14805V4.1504Z" fill="#FFFFFF"/><path d="M143.732 18.7083C143.72 18.6519 143.704 18.4944 143.699 18.4193C143.704 18.4357 143.73 18.6754 143.732 18.7083Z" fill="#DC5F40"/><path d="M141.613 11.08C142.698 10.9602 143.483 9.9732 143.364 8.87342C143.246 7.776 142.27 6.98171 141.184 7.10156C140.099 7.22141 139.314 8.20839 139.433 9.30816C139.551 10.4056 140.526 11.1999 141.613 11.08Z" fill="#DC5F40"/><path d="M143.857 20.6254C143.943 16.1699 142.092 10.7674 137.252 13.8364C136.846 13.9962 136.614 13.9398 136.4 13.6343C135.789 12.5158 135.32 11.3713 134.739 10.1964C130.371 -1.17501 125.383 5.32729 120.114 12.0575C108.347 27.4497 113.89 34.2669 132.438 20.75C133.086 20.2847 134.384 19.3118 134.851 19.2719C135.343 19.192 135.548 19.5962 135.919 20.4421C136.279 21.3093 136.878 22.5383 137.426 23.4148C140.592 29.6304 144.098 28.1899 143.859 20.6513V20.6254H143.857ZM129.909 18.3084C127.575 19.7842 125.36 21.5913 122.796 22.6699C121.679 23.1422 120.051 22.6205 119.649 21.7064C119.194 20.2894 120.822 18.2003 121.621 16.7292C122.547 15.0537 123.776 13.5638 124.953 12.0458C126.096 10.5489 127.647 8.32817 129.798 9.2987C131.523 10.2904 132.231 13.0328 133.218 14.6871C133.664 15.4039 133.65 15.9114 132.87 16.3438C131.925 16.9525 130.901 17.6457 129.928 18.299L129.909 18.3107V18.3084ZM142.556 21.2435C142.505 22.0965 142.345 25.323 141.27 23.7861C140.271 21.8874 139.175 19.521 138.197 17.4977C137.817 16.4637 140.192 16.0454 140.81 16.2216C142.535 16.8655 142.596 19.6197 142.556 21.2294V21.2458V21.2435Z" fill="#DC5F40"/></svg>`;

/**
 * Build a complete Aerchain-themed HTML document from structured content.
 * @param {Object} data - Structured content from Claude
 * @param {string} data.title - Document title
 * @param {string} [data.subtitle] - Optional subtitle
 * @param {Array} data.sections - Array of section objects
 * @param {string} theme - Theme ID (e.g. "purple-glass")
 * @returns {string} Complete HTML document string
 */
export function buildThemedDocument(data, theme = "purple-glass") {
  if (!data || !data.sections) return "";
  const sectionsHTML = data.sections.map(renderSection).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(data.title || "Aerchain Document")}</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
${TEMPLATE_CSS}
</style>
</head>
<body data-theme="${esc(theme)}">

<nav>
  <div class="logo">${AERCHAIN_LOGO_SVG}</div>
  <div class="theme-bar">
    <span class="tb-label">Theme</span>
    <div class="td active" data-t="purple-glass" style="background:#7c3aed" onclick="st(this)"></div>
    <div class="td" data-t="deep-ocean" style="background:#0ea5e9" onclick="st(this)"></div>
    <div class="td" data-t="rose-quartz" style="background:#ec4899" onclick="st(this)"></div>
    <div class="td" data-t="midnight-emerald" style="background:#10b981" onclick="st(this)"></div>
    <div class="td" data-t="arctic" style="background:#3b82f6" onclick="st(this)"></div>
    <div class="td" data-t="topaz" style="background:#14b8a6" onclick="st(this)"></div>
    <div class="td" data-t="citrine" style="background:#eab308" onclick="st(this)"></div>
    <div class="td" data-t="slate" style="background:#6366f1" onclick="st(this)"></div>
  </div>
</nav>

<main>
  <section class="hero">
    <div class="eyebrow">AERCHAIN DOCUMENT</div>
    <h1>${formatHeading(data.title || "Untitled")}</h1>
    ${data.subtitle ? `<p class="subtitle">${esc(data.subtitle)}</p>` : ""}
  </section>

  ${sectionsHTML}
</main>

<footer>
  <div class="footer-inner">
    <div class="footer-logo">${AERCHAIN_LOGO_SVG}</div>
    <div class="footer-note">Generated by Aerchain SalesOS Document Formatter</div>
  </div>
</footer>

<script>
function st(el){document.body.setAttribute('data-theme',el.dataset.t);document.querySelectorAll('.td').forEach(d=>d.classList.remove('active'));el.classList.add('active')}
</script>
</body>
</html>`;
}

// ── Section renderers ──────────────────────────────────────

function renderSection(s) {
  switch (s.type) {
    case "text": return renderText(s);
    case "kpis": return renderKPIs(s);
    case "cards": return renderCards(s);
    case "table": return renderTable(s);
    case "list": return renderList(s);
    case "quote": return renderQuote(s);
    case "divider": return `<div class="divider"></div>`;
    case "image-note": return renderImageNote(s);
    default: return renderText(s); // fallback
  }
}

function sectionHeader(s) {
  let html = "";
  if (s.eyebrow) html += `<div class="eyebrow">${esc(s.eyebrow)}</div>`;
  if (s.heading) html += `<h2>${formatHeading(s.heading)}</h2>`;
  return html;
}

function renderText(s) {
  const paragraphs = (s.content || "")
    .split(/\n\n+/)
    .filter(Boolean)
    .map(p => `<p>${esc(p)}</p>`)
    .join("\n    ");
  return `
  <section class="content-section">
    ${sectionHeader(s)}
    ${paragraphs}
  </section>`;
}

function renderKPIs(s) {
  if (!s.items || !s.items.length) return "";
  const cards = s.items.map(k => `
      <div class="kpi-card">
        <div class="kpi-value">${esc(k.value)}</div>
        <div class="kpi-label">${esc(k.label)}</div>
      </div>`).join("");
  return `
  <section class="content-section">
    ${sectionHeader(s)}
    <div class="kpi-grid">${cards}
    </div>
  </section>`;
}

function renderCards(s) {
  if (!s.items || !s.items.length) return "";
  const cards = s.items.map(c => `
      <div class="glass-card">
        <div class="card-title">${esc(c.title)}</div>
        <div class="card-desc">${esc(c.description || "")}</div>
      </div>`).join("");
  return `
  <section class="content-section">
    ${sectionHeader(s)}
    <div class="card-grid">${cards}
    </div>
  </section>`;
}

function renderTable(s) {
  if (!s.headers || !s.rows) return "";
  const ths = s.headers.map(h => `<th>${esc(h)}</th>`).join("");
  const trs = s.rows.map(row => {
    const tds = row.map(cell => `<td>${esc(String(cell))}</td>`).join("");
    return `<tr>${tds}</tr>`;
  }).join("\n        ");
  return `
  <section class="content-section">
    ${sectionHeader(s)}
    <div class="table-wrap">
      <table>
        <thead><tr>${ths}</tr></thead>
        <tbody>
        ${trs}
        </tbody>
      </table>
    </div>
  </section>`;
}

function renderList(s) {
  if (!s.items || !s.items.length) return "";
  const tag = s.ordered ? "ol" : "ul";
  const lis = s.items.map(i => `<li>${esc(i)}</li>`).join("\n      ");
  return `
  <section class="content-section">
    ${sectionHeader(s)}
    <${tag} class="styled-list">
      ${lis}
    </${tag}>
  </section>`;
}

function renderQuote(s) {
  return `
  <section class="content-section">
    <blockquote class="glass-quote">
      <p>${esc(s.text)}</p>
      ${s.attribution ? `<cite>${esc(s.attribution)}</cite>` : ""}
    </blockquote>
  </section>`;
}

function renderImageNote(s) {
  return `
  <section class="content-section">
    ${sectionHeader(s)}
    <div class="image-note">
      <div class="image-note-icon">&#128444;</div>
      <p>${esc(s.description || "Visual element from source document")}</p>
    </div>
  </section>`;
}

// ── Helpers ─────────────────────────────────────────────────

function esc(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Apply gradient bold to words wrapped in **word** markdown syntax */
function formatHeading(text) {
  return esc(text).replace(/\*\*(.+?)\*\*/g, '<b class="gradient-text">$1</b>');
}

// ── Static CSS ──────────────────────────────────────────────

const TEMPLATE_CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --canvas-a:hsl(262 55% 18%);--canvas-b:hsl(270 45% 12%);--canvas-c:hsl(255 40% 10%);--canvas-d:hsl(245 35% 8%);
  --aerchain:#DC5F40;
  --gp:linear-gradient(135deg,hsl(262 80% 55%),hsl(275 85% 58%));
  --active-glow:hsl(262 80% 55%/.25);
  --col-purple:hsl(262 80% 55%);--col-blue:hsl(217 88% 58%);--col-green:hsl(152 68% 42%);
  --col-amber:hsl(38 92% 50%);--col-red:hsl(0 68% 48%);--col-orange:hsl(18 90% 55%);
  --glass-1:rgba(255,255,255,.03);--glass-2:rgba(255,255,255,.06);--glass-3:rgba(255,255,255,.10);
  --glass-border:rgba(255,255,255,.06);--glass-border-h:rgba(255,255,255,.14);
  --fg:rgba(255,255,255,.94);--fg2:rgba(255,255,255,.72);--fg3:rgba(255,255,255,.42);
  --nav-bg:linear-gradient(180deg,hsl(262 40% 14%/.96),hsl(255 35% 10%/.88));
  --dot:radial-gradient(rgba(255,255,255,.045) 1px,transparent 1px);
  --r:16px;--rm:12px;
}

/* Theme variants */
[data-theme="deep-ocean"]{--canvas-a:hsl(200 55% 16%);--canvas-b:hsl(210 50% 11%);--canvas-c:hsl(215 45% 9%);--canvas-d:hsl(220 40% 7%);--gp:linear-gradient(135deg,hsl(195 85% 45%),hsl(175 80% 42%));--active-glow:hsl(195 85% 45%/.25);--nav-bg:linear-gradient(180deg,hsl(200 55% 16%/.96),hsl(210 50% 11%/.88))}
[data-theme="rose-quartz"]{--canvas-a:hsl(330 38% 15%);--canvas-b:hsl(335 32% 11%);--canvas-c:hsl(340 28% 9%);--canvas-d:hsl(345 22% 7%);--gp:linear-gradient(135deg,hsl(330 72% 58%),hsl(290 70% 55%));--active-glow:hsl(330 72% 58%/.25);--nav-bg:linear-gradient(180deg,hsl(330 30% 13%/.96),hsl(335 25% 9%/.88))}
[data-theme="midnight-emerald"]{--canvas-a:hsl(155 40% 14%);--canvas-b:hsl(160 35% 10%);--canvas-c:hsl(165 30% 8%);--canvas-d:hsl(170 25% 6%);--gp:linear-gradient(135deg,hsl(152 68% 42%),hsl(165 75% 38%));--active-glow:hsl(152 68% 42%/.25);--nav-bg:linear-gradient(180deg,hsl(155 35% 12%/.96),hsl(160 30% 8%/.88))}
[data-theme="arctic"]{--canvas-a:hsl(225 45% 16%);--canvas-b:hsl(230 40% 12%);--canvas-c:hsl(235 35% 9%);--canvas-d:hsl(240 30% 7%);--gp:linear-gradient(135deg,hsl(217 88% 58%),hsl(200 90% 55%));--active-glow:hsl(217 88% 58%/.25);--nav-bg:linear-gradient(180deg,hsl(225 40% 14%/.96),hsl(230 35% 10%/.88))}
[data-theme="topaz"]{--canvas-a:hsl(192 40% 14%);--canvas-b:hsl(196 36% 10%);--canvas-c:hsl(200 32% 8%);--canvas-d:hsl(205 28% 6%);--gp:linear-gradient(135deg,hsl(188 80% 48%),hsl(42 88% 52%));--active-glow:hsl(188 80% 48%/.25);--nav-bg:linear-gradient(180deg,hsl(192 35% 12%/.96),hsl(196 30% 8%/.88))}
[data-theme="citrine"]{--canvas-a:hsl(48 55% 12%);--canvas-b:hsl(45 50% 9%);--canvas-c:hsl(42 45% 7%);--canvas-d:hsl(38 40% 5%);--gp:linear-gradient(135deg,hsl(48 95% 52%),hsl(38 90% 44%));--active-glow:hsl(48 95% 52%/.30);--nav-bg:linear-gradient(180deg,hsl(48 45% 10%/.96),hsl(45 40% 7%/.88))}
[data-theme="slate"]{--canvas-a:hsl(215 22% 15%);--canvas-b:hsl(218 20% 11%);--canvas-c:hsl(220 18% 9%);--canvas-d:hsl(222 16% 7%);--gp:linear-gradient(135deg,hsl(213 72% 52%),hsl(232 68% 58%));--active-glow:hsl(213 72% 52%/.25);--nav-bg:linear-gradient(180deg,hsl(215 20% 13%/.96),hsl(218 18% 9%/.88))}

html,body{height:100%;font-family:'Montserrat',system-ui,sans-serif;color:var(--fg);
  background:linear-gradient(145deg,var(--canvas-d),var(--canvas-c) 30%,var(--canvas-b) 60%,var(--canvas-a) 100%) fixed}

/* Nav */
nav{position:sticky;top:0;z-index:50;display:flex;align-items:center;justify-content:space-between;
  padding:0 32px;height:56px;background:var(--nav-bg);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
  border-bottom:1px solid var(--glass-border)}
.logo{display:flex;align-items:center}
.logo svg{height:22px;width:auto}
.theme-bar{display:flex;align-items:center;gap:6px}
.tb-label{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.12em;color:var(--fg3);margin-right:4px}
.td{width:12px;height:12px;border-radius:50%;cursor:pointer;border:2px solid transparent;transition:border-color .2s,transform .2s}
.td:hover{transform:scale(1.2)}
.td.active{border-color:rgba(255,255,255,.7)}

/* Main */
main{max-width:1280px;margin:0 auto;padding:80px 48px}

/* Hero */
.hero{margin-bottom:64px}
.hero h1{font-size:clamp(36px,5vw,64px);font-weight:300;letter-spacing:-.03em;line-height:1.1;margin-top:12px}
.subtitle{font-size:18px;color:var(--fg2);margin-top:16px;font-weight:400;max-width:680px;line-height:1.6}

/* Eyebrow */
.eyebrow{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;text-transform:uppercase;
  letter-spacing:.14em;color:var(--fg3);display:flex;align-items:center;gap:8px;margin-bottom:8px}
.eyebrow::before{content:'';width:16px;height:1.5px;border-radius:1px;background:var(--gp)}

/* Gradient text */
.gradient-text{background:var(--gp);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-weight:700}

/* Content sections */
.content-section{margin-bottom:56px}
.content-section h2{font-size:clamp(24px,3vw,40px);font-weight:300;letter-spacing:-.025em;line-height:1.2;margin-bottom:20px}
.content-section p{font-size:15px;color:var(--fg2);line-height:1.7;margin-bottom:12px;max-width:780px}

/* KPI grid */
.kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-top:20px}
.kpi-card{background:var(--glass-1);border:1px solid var(--glass-border);border-radius:var(--r);padding:24px;
  text-align:center;transition:all .3s}
.kpi-card:hover{border-color:var(--glass-border-h);transform:translateY(-3px);box-shadow:0 14px 44px rgba(0,0,0,.22)}
.kpi-value{font-size:36px;font-weight:700;background:var(--gp);-webkit-background-clip:text;
  -webkit-text-fill-color:transparent;background-clip:text;margin-bottom:8px}
.kpi-label{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;text-transform:uppercase;
  letter-spacing:.1em;color:var(--fg3)}

/* Card grid */
.card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin-top:20px}
.glass-card{background:var(--glass-1);border:1px solid var(--glass-border);border-radius:var(--r);padding:24px;
  transition:all .3s;position:relative;overflow:hidden}
.glass-card::before{content:'';position:absolute;inset:0;background:var(--dot);background-size:24px 24px;opacity:.5;pointer-events:none}
.glass-card:hover{border-color:var(--glass-border-h);transform:translateY(-3px);box-shadow:0 14px 44px rgba(0,0,0,.22)}
.card-title{font-size:16px;font-weight:600;margin-bottom:8px;color:var(--fg)}
.card-desc{font-size:13px;color:var(--fg2);line-height:1.6}

/* Table */
.table-wrap{overflow-x:auto;margin-top:16px}
table{width:100%;border-collapse:collapse;background:var(--glass-1);border:1px solid var(--glass-border);border-radius:var(--rm);overflow:hidden}
thead{background:var(--glass-2)}
th{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;text-transform:uppercase;
  letter-spacing:.08em;color:var(--fg3);padding:12px 16px;text-align:left;border-bottom:1px solid var(--glass-border)}
td{padding:12px 16px;font-size:14px;color:var(--fg2);border-bottom:1px solid var(--glass-border)}
tr:last-child td{border-bottom:none}
tr:hover td{background:var(--glass-2)}

/* Lists */
.styled-list{list-style:none;padding:0;margin-top:12px}
.styled-list li{position:relative;padding:8px 0 8px 24px;font-size:15px;color:var(--fg2);line-height:1.6}
.styled-list li::before{content:'';position:absolute;left:0;top:16px;width:8px;height:8px;border-radius:50%;background:var(--gp)}
ol.styled-list{counter-reset:item}
ol.styled-list li{counter-increment:item}
ol.styled-list li::before{content:counter(item);width:20px;height:20px;border-radius:50%;background:var(--gp);
  display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;top:10px}

/* Quotes */
.glass-quote{background:var(--glass-1);border:1px solid var(--glass-border);border-left:3px solid;
  border-image:var(--gp) 1;border-radius:0 var(--rm) var(--rm) 0;padding:24px 28px;margin:20px 0;
  backdrop-filter:blur(12px)}
.glass-quote p{font-size:16px;font-style:italic;color:var(--fg);line-height:1.7;margin:0}
.glass-quote cite{display:block;margin-top:12px;font-size:13px;color:var(--fg3);font-style:normal;
  font-family:'JetBrains Mono',monospace}

/* Image note */
.image-note{background:var(--glass-1);border:1px solid var(--glass-border);border-radius:var(--r);
  padding:24px;display:flex;align-items:flex-start;gap:16px}
.image-note-icon{font-size:28px;opacity:.5}
.image-note p{font-size:13px;color:var(--fg2);line-height:1.6;margin:0;font-style:italic}

/* Divider */
.divider{height:1px;background:linear-gradient(90deg,var(--glass-border),transparent);margin:40px 0}

/* Footer */
footer{border-top:1px solid var(--glass-border);padding:40px 48px;margin-top:40px}
.footer-inner{max-width:1280px;margin:0 auto;display:flex;align-items:center;justify-content:space-between}
.footer-logo{display:flex;align-items:center}
.footer-logo svg{height:16px;width:auto}
.footer-note{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--fg3);text-transform:uppercase;letter-spacing:.1em}

/* Responsive */
@media(max-width:768px){
  main{padding:40px 20px}
  .hero h1{font-size:32px}
  .kpi-grid,.card-grid{grid-template-columns:1fr}
  nav{padding:0 16px}
}

/* Scrollbar */
::-webkit-scrollbar{width:6px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--glass-border-h);border-radius:3px}
`;
