# Plan: Download Button + Dummy Data Toggle

## What You're Trying to Achieve

You want to **demo/share** the app's UI without requiring live API keys, Supabase, or sync. Two goals:

1. **Dummy Data Toggle** — Fill the app with realistic sample data so it looks populated (for demos, screenshots, walkthroughs). Toggle it on/off without affecting real synced data.
2. **HTML Snapshot Export** — Download a self-contained `.html` file that captures the current visual state (including whether dummy data is shown or hidden), so anyone can open it in a browser and see exactly what you see — no server, no keys, no build step.

The HTML export respects the toggle: if dummy data is ON, the export shows it. If OFF, the export shows whatever the real state is (empty or synced).

---

## Implementation Plan

### 1. Define Dummy Data Constants

**File:** `App.jsx` (near the top, after SYNC PROMPTS section)

Add a `DUMMY_DATA` object with realistic sample data for both modules:

```js
const DUMMY_DATA = {
  "pricing-calc": {
    standardModel: { per1BSpend: 300000, yoyEscalation: "10%", breakEven: "$500M-$1B" },
    recentDeals: [
      { client: "Tata Steel", y1Amount: 420000, spendUnderMgmt: "$2.1B", modules: "Sourcing, CLM, SXM" },
      { client: "Hindalco", y1Amount: 285000, spendUnderMgmt: "$1.4B", modules: "Sourcing, Analytics" },
      { client: "JSW Group", y1Amount: 510000, spendUnderMgmt: "$3.2B", modules: "Full Suite" },
    ],
    syncedAt: "2026-03-14T10:00:00Z",
    lastSynced: "2026-03-14T10:00:00Z",
  },
  proposals: {
    activeProposals: [
      { client: "Mahindra & Mahindra", value: 750000, stage: "Proposal", status: "Submitted", submittedDate: "2026-03-10", contact: "Rajesh Kumar" },
      { client: "Larsen & Toubro", value: 1200000, stage: "Negotiation", status: "In Review", submittedDate: "2026-03-05", contact: "Priya Sharma" },
      { client: "Reliance Industries", value: 2000000, stage: "Proposal", status: "Draft", submittedDate: "2026-03-12", contact: "Amit Patel" },
      { client: "Adani Ports", value: 680000, stage: "Closed Won", status: "Submitted", submittedDate: "2026-02-28", contact: "Sneha Gupta" },
    ],
    total: 4,
    totalValue: 4630000,
    syncedAt: "2026-03-14T10:00:00Z",
    lastSynced: "2026-03-14T10:00:00Z",
  },
};
```

### 2. Add `showDummy` State

**File:** `App.jsx` (in the App component, near other useState declarations)

```js
const [showDummy, setShowDummy] = useState(false);
```

### 3. Merge Dummy Data Into Display Data

Where `ModuleContent` receives its `data` prop, compute the effective data:

```js
const effectiveData = showDummy ? { ...(DUMMY_DATA[selected] || {}), ...(mData || {}) } : (mData || {});
// Actually: when showDummy is ON, use DUMMY_DATA as the base (dummy wins)
const effectiveData = showDummy ? (DUMMY_DATA[selected] || {}) : (mData || {});
```

Pass `effectiveData` to `ModuleContent` instead of the raw `mData`.

### 4. Add Toggle Button to Topbar

**File:** `App.jsx` (in the topbar, between "Sync All" and the Activity log toggle)

Add a button with a beaker/test-tube icon (use `Wand2` from lucide which is already imported, or add `TestTube2`/`Eye`/`EyeOff`):

```jsx
{/* Dummy Data Toggle */}
<button onClick={() => setShowDummy(p => !p)} style={{
  background: showDummy ? "rgba(139,92,246,0.2)" : "none",
  border: showDummy ? "1px solid rgba(139,92,246,0.4)" : "1px solid transparent",
  borderRadius: 6, padding: "4px 10px", cursor: "pointer",
  color: showDummy ? T.accent : T.muted,
  fontSize: 11, fontWeight: 500,
  display: "flex", alignItems: "center", gap: 5,
  transition: "all 0.2s"
}}>
  <Wand2 size={12} />
  {showDummy ? "Demo ON" : "Demo"}
</button>
```

When active, the button glows purple so it's obvious you're in demo mode.

### 5. Add "Demo Mode" Banner (Optional but Recommended)

When `showDummy` is true, show a small banner below the topbar:

```jsx
{showDummy && (
  <div style={{ background: "rgba(139,92,246,0.1)", borderBottom: "1px solid rgba(139,92,246,0.2)",
    padding: "4px 20px", fontSize: 11, color: T.accent, textAlign: "center" }}>
    Demo Mode — Showing sample data. Toggle off to see real data.
  </div>
)}
```

### 6. Add Download Button to Topbar

**File:** `App.jsx` (in the topbar, next to the demo toggle)

Import `Download` from lucide-react. Add a button:

```jsx
<button onClick={downloadSnapshot} style={{
  background: "none", border: "none", cursor: "pointer",
  color: T.muted, padding: 4
}} title="Download HTML snapshot">
  <Download size={14} />
</button>
```

### 7. Implement `downloadSnapshot` Function

**File:** `App.jsx` (as a function inside the App component)

This function:
1. Clones the entire document's rendered HTML
2. Inlines all computed styles (since the app uses inline styles, they're already in the DOM)
3. Strips out any script tags, React internals, Supabase references
4. Wraps in a self-contained HTML shell with the Google Fonts link
5. Triggers a file download

```js
const downloadSnapshot = useCallback(() => {
  // Clone the current DOM
  const clone = document.documentElement.cloneNode(true);

  // Remove all script tags
  clone.querySelectorAll("script").forEach(s => s.remove());

  // Remove noscript tags
  clone.querySelectorAll("noscript").forEach(s => s.remove());

  // Build self-contained HTML
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aerchain · Pricing & Proposals${showDummy ? " (Demo)" : ""}</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>${document.querySelector("style")?.textContent || ""}</style>
</head>
<body style="margin:0;padding:0;">
  ${document.getElementById("root").innerHTML}
</body>
</html>`;

  // Download
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `aerchain-snapshot-${new Date().toISOString().slice(0,10)}.html`;
  a.click();
  URL.revokeObjectURL(url);
}, [showDummy]);
```

---

## Summary of Changes

| # | What | Where | Lines Changed |
|---|------|-------|---------------|
| 1 | Add `Download` to lucide imports | `App.jsx:2-6` | ~1 line |
| 2 | Add `DUMMY_DATA` constant | `App.jsx:~52` (after sync prompts) | ~30 lines |
| 3 | Add `showDummy` state | `App.jsx` (useState section) | 1 line |
| 4 | Compute `effectiveData` | `App.jsx` (before render) | 1 line |
| 5 | Pass `effectiveData` to ModuleContent | `App.jsx` (render) | 1 line change |
| 6 | Demo toggle button in topbar | `App.jsx` (topbar) | ~12 lines |
| 7 | Demo mode banner | `App.jsx` (below topbar) | ~5 lines |
| 8 | Download button in topbar | `App.jsx` (topbar) | ~5 lines |
| 9 | `downloadSnapshot` function | `App.jsx` (component body) | ~25 lines |

**Total: ~80 lines added/changed, all in `App.jsx`**

---

## UX Flow

1. User opens app → sees real data (or empty state if never synced)
2. User clicks **"Demo"** toggle → KPIs and tables fill with realistic sample data, button glows purple, banner appears
3. User clicks **Download (↓)** icon → gets `aerchain-snapshot-2026-03-14.html` — a static file showing exactly what's on screen
4. User clicks **"Demo ON"** again → back to real data
5. Download while demo is OFF → exports the real/empty state

No new files. No new dependencies. Single-file change.
