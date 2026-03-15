# Context Transfer — P3 Optimization & Architecture

> **Branch:** Create from `main` AFTER P0/P1 and P2 merges land
> **Parent session:** claude/init-refero-mcp-x1icS (March 15, 2026)
> **Estimated total effort:** 1.5-2.5 days

---

## Overview

This session handles 3 optimization and architecture improvements. These are forward-looking — the app works fine without them today, but they prevent scaling problems as more modules and files are added.

**Prerequisites:** P0/P1 fixes must be merged first (they restructure App.jsx and extract theme tokens). P2 fixes should ideally be merged too, but are not strictly required.

---

## Item 1: Module Plugin Architecture

**Effort:** 1-2 days
**Impact:** Scalability — makes adding new modules a drop-in operation

### What's wrong now
Adding a new module currently requires touching **5+ files**:

1. `App.jsx` — Add to `MOD` constant (line ~32), add `case` to `ModuleContent` switch (line ~992), add to sidebar rendering, add to `UPLOAD_MODULES` if needed, add to `NOTION_AUDIT_CONFIG`
2. `demo-data/index.js` — Import and export sample files
3. `demo-data/{module-name}.js` — Create sample data file
4. Create a new `{ModuleName}View.jsx` component
5. `FileWorkspace.jsx` — Add module-specific card metrics in `getCardMetrics` (line ~70) and icon in `getModuleIcon` (line ~95)

This is error-prone and requires knowledge of the full codebase.

### Current module registry (App.jsx, around line 32)
```javascript
const MOD = {
  "pricing-calculator":  { label:"Pricing Calculator",  Icon:DollarSign,  group:"tools" },
  "proposal-generator":  { label:"Proposal Generator",  Icon:FileText,    group:"tools" },
  "design-extractor":    { label:"Design Extractor",     Icon:Palette,     group:"tools" },
  "settings":            { label:"Settings & Memory",    Icon:Settings,    group:"system" },
};
```

### Proposed architecture
Create a `modules/` directory where each module is self-contained:

```
modules/
  pricing-calculator/
    index.js          — exports { config, View, sampleFiles }
    PricingCalcView.jsx
    sample-data.js
  proposal-generator/
    index.js
    ProposalsView.jsx
    sample-data.js
  design-extractor/
    index.js
    DesignExtractorView.jsx  — move from root
    sample-data.js
```

Each module's `index.js` exports a config object:
```javascript
export default {
  key: "pricing-calculator",
  label: "Pricing Calculator",
  icon: DollarSign,
  group: "tools",
  isUploadModule: true,
  notionConfig: { pageName: "Pricing Calculator Log" },
  View: PricingCalcView,
  sampleFiles: pricingCalculatorFiles,
  cardMetrics: (file) => ({ ... }),  // for FileWorkspace
};
```

Then `App.jsx` just imports all modules and iterates:
```javascript
import modules from "./modules";
// modules is an array of config objects
// Sidebar: modules.map(m => <SidebarItem ...m />)
// Content: const mod = modules.find(m => m.key === selected); <mod.View ... />
```

### Key decisions to make
- Whether to use dynamic `import()` for lazy loading (ties into Item 3 below)
- Whether FileWorkspace should also be per-module or remain shared
- How to handle the "system" group modules (settings) which have a different UI pattern

### Files to change
| File | Change |
|------|--------|
| `App.jsx` | Remove MOD constant, ModuleContent switch, UPLOAD_MODULES. Replace with dynamic module loading |
| `FileWorkspace.jsx` | Remove `getCardMetrics` and `getModuleIcon` switches. Accept these as props from module config |
| `demo-data/` | Move into per-module directories |
| `DesignExtractorView.jsx` | Move into `modules/design-extractor/` |
| New: `modules/index.js` | Central module registry that imports all module configs |

---

## Item 2: React.memo on FileCard and ModuleContent

**Effort:** 1 hour
**Impact:** Prevents unnecessary re-renders on state changes

### What's wrong now
`FileCard` (FileWorkspace.jsx:114) and `ModuleContent` (App.jsx:919) are regular function components. They re-render on **every** parent state change — theme toggle, sidebar hover, log update, etc. — even when their props haven't changed.

### Current FileCard definition
```javascript
function FileCard({ file, moduleKey, isSelected, onClick }) {
  const metrics = getCardMetrics(moduleKey, file);
  const Icon = getModuleIcon(moduleKey);
  return (
    <div onClick={onClick} style={{ ... }} className="glass-surface" ...>
      ...
    </div>
  );
}
```

### Fix
Wrap both components with `React.memo`:
```javascript
const FileCard = React.memo(function FileCard({ file, moduleKey, isSelected, onClick }) {
  ...
});
```

**Important caveats:**
1. `onClick` callbacks must be stable (wrapped in `useCallback`) or memo won't help — the parent creates a new function reference each render. Check that `onClick` is passed as `() => setSelectedFile(file.id)` (unstable) vs a memoized callback.
2. `file` objects from `getModuleFiles` are spread from arrays — check if new array references are created on every render (they are, since `[...refs, ...saved]` creates a new array). May need to memoize `getModuleFiles` output with `useMemo`.
3. `ModuleContent` receives `data` which is `moduleData[selected]` — this object reference changes on every sync. A custom comparator may be needed: `React.memo(ModuleContent, (prev, next) => prev.moduleKey === next.moduleKey && prev.data === next.data)`.

### Files to change
| File | Change |
|------|--------|
| `FileWorkspace.jsx` | Wrap `FileCard` in `React.memo` |
| `App.jsx` (or post-P1 module files) | Wrap `ModuleContent` in `React.memo`, ensure stable callback props |

---

## Item 3: Lazy Load demo-data (104 KB)

**Effort:** 1 hour
**Impact:** Faster initial page load

### What's wrong now
Sample data files are statically imported at the top of `App.jsx`:
```javascript
import DUMMY_DATA, { SAMPLE_FILES } from "./demo-data/index.js";
```

This pulls in all sample files for all modules (~104 KB of JSON/JS) into the initial bundle, even though:
- Users may never click "Demo Mode"
- Users working on one module don't need sample data for other modules
- The data is only used when `showDummy === true` or in `getModuleFiles` for sample files

### demo-data structure
```
demo-data/
  index.js              — re-exports from all module files
  pricing-calculator.js — pricingCalculatorDummy + pricingCalculatorFiles
  proposal-generator.js — proposalGeneratorDummy + proposalGeneratorFiles
  design-extractor.js   — designExtractorFiles
```

`demo-data/index.js`:
```javascript
import { pricingCalculatorDummy, pricingCalculatorFiles } from "./pricing-calculator.js";
import { proposalGeneratorDummy, proposalGeneratorFiles } from "./proposal-generator.js";
import { designExtractorFiles } from "./design-extractor.js";

const DUMMY_DATA = {
  "pricing-calculator":  pricingCalculatorDummy,
  "proposal-generator":  proposalGeneratorDummy,
};

const SAMPLE_FILES = {
  "pricing-calculator":  pricingCalculatorFiles,
  "proposal-generator":  proposalGeneratorFiles,
  "design-extractor":    designExtractorFiles,
};

export { SAMPLE_FILES };
export default DUMMY_DATA;
```

### Fix
Use dynamic `import()` to load sample data on demand:

```javascript
// In App.jsx or a custom hook
const [sampleFiles, setSampleFiles] = useState({});

const loadSampleData = useCallback(async (moduleKey) => {
  if (sampleFiles[moduleKey]) return sampleFiles[moduleKey];
  const mod = await import(`./demo-data/${moduleKey}.js`);
  setSampleFiles(prev => ({ ...prev, [moduleKey]: mod }));
  return mod;
}, [sampleFiles]);
```

**If using the module plugin architecture (Item 1)**, this becomes even cleaner — each module config can have a `loadSampleData: () => import("./sample-data.js")` field.

### Interaction with other items
- **Item 1 (plugin architecture):** If implemented, sample data loading moves into each module's directory. Lazy loading becomes natural.
- **P2 Item 5 (debounce localStorage):** No interaction.
- **Vite code splitting:** Vite automatically code-splits dynamic imports. No extra config needed.

### Files to change
| File | Change |
|------|--------|
| `App.jsx` | Replace static import with dynamic import() |
| `demo-data/index.js` | May become unnecessary if each module loads its own data |
| `getModuleFiles` | Needs to handle async data loading (show loading state or pre-load) |

---

## Implementation Order Recommendation

```
Item 2 (React.memo) → Item 3 (lazy load) → Item 1 (plugin architecture)
```

- **Item 2 first** because it's the smallest change with immediate measurable impact (React DevTools Profiler)
- **Item 3 second** because it's standalone and reduces bundle size
- **Item 1 last** because it's the largest refactor and benefits from Items 2+3 being done (memo patterns and lazy loading inform the plugin API design)

If time is limited, Items 2 and 3 are independent quick wins. Item 1 is the big architectural investment that pays off over the next several modules.

---

## File Map (lines referenced are pre-P1-refactor)

| File | Lines | Role |
|------|-------|------|
| `App.jsx` | 1807 | Main app — MOD registry, ModuleContent, state management |
| `FileWorkspace.jsx` | 619 | File grid — FileCard, getCardMetrics, getModuleIcon |
| `DesignExtractorView.jsx` | 813 | Design Extractor UI |
| `demo-data/index.js` | 22 | Central re-export of all sample data |
| `demo-data/pricing-calculator.js` | — | Pricing sample data + files |
| `demo-data/proposal-generator.js` | — | Proposal sample data + files |
| `demo-data/design-extractor.js` | — | Design extractor sample files |

---

## Testing Checklist

- [ ] React DevTools Profiler shows FileCard not re-rendering on theme toggle (Item 2)
- [ ] Network tab shows demo-data chunks loaded lazily on first module click (Item 3)
- [ ] Initial bundle size reduced by ~100 KB (Item 3)
- [ ] Adding a new module requires only creating a `modules/{name}/` directory with config (Item 1)
- [ ] All existing modules still work identically after refactor
- [ ] Demo mode still works with lazy-loaded data
- [ ] No flash of empty state while sample data loads
