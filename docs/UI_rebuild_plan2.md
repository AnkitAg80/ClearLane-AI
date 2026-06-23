# ClearLane AI — Complete Frontend UI Rebuild Plan

## 0. Current State Assessment

**Backend (unchanged):** FastAPI at `app/app.py` + `app/dashboard_service.py` serving 15 API endpoints. All Python backend code remains intact.

**Frontend (to be built from scratch):** No `frontend/` directory exists currently. The README documents a React + Vite setup that was never committed.

**API Surface (15 endpoints the UI must consume):**

| Endpoint | Method | Purpose | Key Data |
|---|---|---|---|
| `/api/overview` | GET | Summary + filters + search suggestions | `summary`, `highlights`, `filters`, `artifacts` |
| `/api/map` | GET | H3 hex cells for the command map | `rows[]`, `bbox` |
| `/api/hotspots` | GET | Ranked hotspot list | `rows[]` with 16 columns |
| `/api/hotspots/{h3}` | GET | Single hotspot detail | `h3`, `title`, `scorecards`, `signals`, `raw` |
| `/api/deployment` | GET | Optimized vs reactive plans | `totals`, `optimized[]`, `reactive[]` |
| `/api/evidence` | GET | Model trust, backtest, feature importance | `backtest`, `roi`, `model`, `feature_importance` |
| `/api/intelligence` | GET | Curb intelligence (lifecycle, theft, fingerprint) | `rows[]`, `summary` |
| `/api/timeline` | GET | Forecast horizons (now, +60m, +3h, pattern) | `horizons[]`, `rows[]` |
| `/api/missions` | GET | Mission cards with marginal officer values | `rows[]` (mission card objects) |
| `/api/optimize` | POST | Re-run optimization with new budget | `{ officer_budget }` → `{ status }` |
| `/api/dashboard` | GET | Legacy aggregate endpoint | `summary`, `map_data`, `deployment_plan`, `metrics` |
| `/api/config` | GET | Mappls/CARTO map provider config | `provider`, `mappls`, `fallback` |
| `/api/health` | GET | Artifact readiness check | `status`, `missing_count` |
| `/api/artifacts` | GET | Artifact file status list | `rows[]` |
| `/api/feature_importance` | GET | Regression + ranker feature weights | `regression[]`, `ranker[]` |

**Filter parameters shared across map/hotspots/intelligence/timeline/missions:** `station`, `min_support`, `query`, `limit`

---

## 1. Technology Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | **Next.js 14 (App Router)** | Server components, streaming, image optimization, API routes proxy, built-in layout system |
| Language | **TypeScript** (strict mode) | Type-safe API contracts, autocompletion, runtime safety |
| Styling | **Tailwind CSS 3.4** + CSS variables | Utility-first, dark glassmorphism tokens, responsive breakpoints |
| Animation | **Framer Motion 11** | Layout animations, AnimatePresence, gesture-driven, spring physics |
| Maps | **Mapbox GL JS 3** + **mapbox-gl-js** | Deck.gl H3 layer on top of Mapbox for 3D hex rendering, smooth fly-to; Mappls SDK as optional basemap |
| Charting | **Recharts 2** + **@nivo/line** | React-native charting with confidence bands, streaming area charts, responsive containers |
| Icons | **Lucide React** | Consistent 24×24 viewBox, tree-shakeable, no emojis |
| Command Palette | **cmdk** (by Paco) | Linear/Raycast-style keyboard-first palette, fully accessible |
| State | **Zustand 4** | Minimal boilerplate, selectors for re-render control, time-travel devtools |
| Data Fetching | **SWR 2** | Stale-while-revalidate, optimistic updates, focus revalidation, pagination |
| Notifications | **sonner** | Stackable toast with glass styling, accessible, promise-based |
| Virtualization | **@tanstack/react-virtual** | Efficient rendering for 250+ hotspot rows, timeline rows |
| Package Manager | **pnpm** | Faster installs, strict hoisting, disk-efficient |
| Build | **Vite** (via Next.js) or standalone Vite | Fast HMR, tree-shaking, compatible with existing `vercel.json` build command |

---

## 2. Design System Foundation

### 2.1 Color Tokens (CSS Variables)

```css
:root {
  --bg-void:         #020617;    /* deepest background */
  --bg-primary:      #0F172A;    /* card surfaces */
  --bg-secondary:    #1E293B;    /* sidebar, panels */
  --bg-elevated:     #334155;    /* hover, active states */

  --glass-bg:        rgba(255, 255, 255, 0.05);
  --glass-border:    rgba(255, 255, 255, 0.08);
  --glass-hover:     rgba(255, 255, 255, 0.12);
  --glass-blur:      20px;

  --text-primary:    #F8FAFC;    /* slate-50, main text */
  --text-secondary:  #94A3B8;    /* slate-400, muted */
  --text-tertiary:   #64748B;    /* slate-500, labels */

  --accent-green:    #22C55E;    /* positive, deployed, relief */
  --accent-amber:    #F59E0B;    /* warning, emerging */
  --accent-red:      #EF4444;    /* critical, chronic */
  --accent-blue:     #3B82F6;    /* info, forecast */
  --accent-purple:   #A855F7;    /* mission types */
  --accent-cyan:     #06B6D4;    /* data, intelligence */

  --ring-focus:      #3B82F6;
  --surface-radius:  16px;
  --surface-radius-sm: 10px;
  --border-subtle:  rgba(255, 255, 255, 0.06);
}
```

### 2.2 Typography

- **Font:** Inter (variable, weights 300-700)
- **Scale:** 12/14/16/20/24/32/40px
- **Monospace:** JetBrains Mono for data values, code, cell IDs
- **Letter spacing:** -0.025em on headings, 0 on body, +0.05em on labels/caps

### 2.3 Spacing & Layout Grid

- **8px base unit** — all spacing multiples of 4
- **Max content width:** 1440px
- **Sidebar:** 280px collapsed → 320px expanded
- **Panel widths:** 400px detail, 360px inspector
- **Grid:** 12-column, 24px gutters

### 2.4 Elevation/Z-Depth (Swiss Layered Glass)

| Level | Shadow | Blur | Use |
|---|---|---|---|
| 0 | none | none | Background canvas (map) |
| 1 | 0 1px 2px rgba(0,0,0,.3) | 8px | Cards, table rows |
| 2 | 0 4px 12px rgba(0,0,0,.4) | 12px | Panels, sidebar |
| 3 | 0 8px 30px rgba(0,0,0,.5) | 16px | Modals, command palette |
| 4 | 0 16px 48px rgba(0,0,0,.6) | 20px | Toast overlays |

### 2.5 Motion Tokens

| Property | Value | When |
|---|---|---|
| `--duration-instant` | 100ms | Hover color changes |
| `--duration-fast` | 200ms | Tooltip appearance, focus ring |
| `--duration-normal` | 300ms | Panel slide, drawer open |
| `--duration-slow` | 450ms | Page transitions, layout shifts |
| `--ease-default` | cubic-bezier(0.25, 0.1, 0.25, 1) | General |
| `--ease-spring` | spring(1, 100, 10) | Bouncy microinteractions |
| `--ease-out` | cubic-bezier(0, 0, 0.2, 1) | Entering elements |
| `--ease-in` | cubic-bezier(0.4, 0, 1, 1) | Exiting elements |

### 2.6 Accessibility Requirements

- All text meets **WCAG AAA** (7:1) for body, **AA** (4.5:1) for large text on dark bg
- `prefers-reduced-motion` disables all Framer Motion animations, replaces with instant state changes
- Skip-link → main content
- Visible focus rings (2px solid `--ring-focus`, 2px offset)
- ARIA roles on all glass cards, command palette, map overlays
- Screen reader announcements for live data (aria-live="polite" on forecast updates)
- Keyboard navigation: Tab order follows visual order, `Cmd+K` opens command palette, `Escape` closes panels

---

## 3. Application Architecture

### 3.1 Directory Structure

```
frontend/
├── package.json
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── postcss.config.js
├── public/
│   └── favicon.svg
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout: font, providers, skip-link
│   │   ├── page.tsx                  # Dashboard page (single-page app)
│   │   ├── loading.tsx               # Skeleton loader
│   │   ├── error.tsx                 # Error boundary
│   │   └── globals.css               # CSS variables, base glass styles
│   │
│   ├── components/
│   │   ├── primitives/               # Atoms (never fetch data)
│   │   │   ├── GlassCard.tsx         # backdrop-blur container
│   │   │   ├── GlassPanel.tsx        # Slide-in side panel
│   │   │   ├── Badge.tsx             # Lifecycle/status badges
│   │   │   ├── Button.tsx            # Primary/ghost/danger variants
│   │   │   ├── ActionIcon.tsx        # Icon-only button with tooltip
│   │   │   ├── MetricValue.tsx       # Animated counter + unit
│   │   │   ├── SparkLine.tsx         # Inline mini-chart (SVG path)
│   │   │   ├── ProgressRing.tsx      # Circular progress for scores
│   │   │   ├── Skeleton.tsx          # Shimmer placeholder
│   │   │   ├── Tooltip.tsx           # Accessible tooltip
│   │   │   ├── SearchInput.tsx       # Search with suggestions dropdown
│   │   │   └── VirtualList.tsx       # @tanstack/react-virtual wrapper
│   │   │
│   │   ├── command-palette/          # Cmd+K palette
│   │   │   ├── CommandPalette.tsx     # Root dialog + keyboard handler
│   │   │   ├── CommandItem.tsx       # Single result row
│   │   │   ├── CommandGroup.tsx      # Grouped results (hotspots, actions, views)
│   │   │   └── commands.ts           # Registry of all commands + search logic
│   │   │
│   │   ├── map/                      # Infinite Canvas Map
│   │   │   ├── CommandMap.tsx        # Mapbox + Deck.gl container
│   │   │   ├── H3HexLayer.tsx        # Custom Deck.gl H3 layer with color ramp
│   │   │   ├── MapControls.tsx       # Zoom, pitch, bearing, layer toggles
│   │   │   ├── MapModeSelector.tsx   # Forecast / After-deploy / Officer / Relief / Score
│   │   │   ├── MapTooltip.tsx        # Glass tooltip on hex hover
│   │   │   ├── MapPopup.tsx         # Glass popup card on hex click
│   │   │   └── MapLegend.tsx         # Color scale legend bar
│   │   │
│   │   ├── sidebar/                  # Left navigation rail
│   │   │   ├── Sidebar.tsx           # Collapsible sidebar container
│   │   │   ├── SidebarNav.tsx        # View switcher icons + labels
│   │   │   ├── SidebarStatus.tsx     # System health indicator
│   │   │   └── SidebarSearch.tsx     # Quick search trigger
│   │   │
│   │   ├── overview/                 # Overview dashboard
│   │   │   ├── OverviewGrid.tsx      # Metric cards + mini charts
│   │   │   ├── MetricCard.tsx        # Single KPI glass card (animated counter)
│   │   │   ├── HighlightsBar.tsx      # Lift %, NDCG, top-25 recall
│   │   │   └── ArtifactStatus.tsx    # File readiness checklist
│   │   │
│   │   ├── hotspots/                 # Hotspot list + detail
│   │   │   ├── HotspotTable.tsx      # Virtualized, sortable, filterable
│   │   │   ├── HotspotRow.tsx        # Single row with micro-sparkline
│   │   │   ├── HotspotDetail.tsx     # Right panel: scorecards + signals
│   │   │   ├── HotspotSignals.tsx    # Signal bar visualization
│   │   │   └── HotspotFilters.tsx   # Station, support, search filters
│   │   │
│   │   ├── deployment/               # Deployment console
│   │   │   ├── DeploymentConsole.tsx # Optimized vs reactive comparison
│   │   │   ├── DeploymentTable.tsx   # Officer assignments table
│   │   │   ├── BudgetSlider.tsx      # Officer budget input (animated)
│   │   │   ├── ReliefComparison.tsx # Side-by-side relief charts
│   │   │   └── RunOptimize.tsx       # POST /api/optimize trigger
│   │   │
│   │   ├── intelligence/             # Curb Intelligence layer
│   │   │   ├── IntelligenceFeed.tsx  # Card feed with lifecycle badges
│   │   │   ├── IntelCard.tsx         # Single intelligence card
│   │   │   ├── CapacityTheftMeter.tsx # Lane theft visualization
│   │   │   ├── LifecycleTimeline.tsx  # active→spreading→chronic flow
│   │   │   └── FingerprintTag.tsx    # Mission type fingerprint badge
│   │   │
│   │   ├── timeline/                 # Forecast timeline
│   │   │   ├── TimelineChart.tsx    # Recharts area + confidence band
│   │   │   ├── HorizonTabs.tsx      # now / +60m / +3h / pattern tabs
│   │   │   ├── ForecastRow.tsx      # Single cell forecast row
│   │   │   └── CriticalityBadge.tsx # "critical in X min" badge
│   │   │
│   │   ├── missions/                 # Mission cards
│   │   │   ├── MissionBoard.tsx     # Kanban-style or card grid
│   │   │   ├── MissionCard.tsx      # Rich description card
│   │   │   └── MarginalValueChart.tsx # Bar chart for officer ROI
│   │   │
│   │   ├── evidence/                 # AI Trust & Evidence
│   │   │   ├── EvidencePanel.tsx    # Full evidence view
│   │   │   ├── FeatureBarChart.tsx  # Feature importance horizontal bars
│   │   │   ├── BacktestMetrics.tsx  # Metric summary grid
│   │   │   └── ModelTransparency.tsx # Model metadata display
│   │   │
│   │   └── layout/                   # App shell
│   │       ├── AppShell.tsx          # Sidebar + main + panel grid
│   │       ├── HeaderBar.tsx         # Top bar: logo, Cmd+K trigger, status
│   │       ├── StatusBar.tsx         # Bottom: last updated, artifact count
│   │       └── PanelResizer.tsx      # Draggable panel width handle
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── useApi.ts                 # SWR wrapper with error + loading
│   │   ├── useMapData.ts            # Fetch + transform /api/map
│   │   ├── useHotspots.ts           # Fetch + filter hotspots
│   │   ├── useOverview.ts           # Fetch overview payload
│   │   ├── useDeployment.ts         # Fetch + mutate deployment
│   │   ├── useIntelligence.ts        # Fetch intelligence
│   │   ├── useTimeline.ts           # Fetch timeline
│   │   ├── useMissions.ts           # Fetch missions
│   │   ├── useEvidence.ts           # Fetch evidence
│   │   ├── useFilters.ts            # Shared filter state (station, query, support)
│   │   ├── useCommandPalette.ts     # Cmd+K open/close + search
│   │   ├── useKeyboardShortcuts.ts  # Global keyboard handlers
│   │   ├── useReducedMotion.ts      # prefers-reduced-motion hook
│   │   └── useMapConfig.ts          # Map provider + SDK loading
│   │
│   ├── stores/                       # Zustand stores
│   │   ├── viewStore.ts             # Active view, panel state
│   │   ├── mapStore.ts              # Map mode, viewport, selected hex
│   │   ├── filterStore.ts           # Station, support, query filters
│   │   └── uiStore.ts              # Sidebar collapsed, panel widths, palette open
│   │
│   ├── lib/                          # Utilities
│   │   ├── api.ts                    # Base fetcher, SWR config, API URL const
│   │   ├── format.ts                 # Number, date, percentage formatters
│   │   ├── cn.ts                     # clsx + tailwind-merge utility
│   │   ├── color-ramp.ts            # CII → color mapping functions
│   │   ├── constants.ts              # API endpoints, filter defaults
│   │   └── types.ts                  # Shared TypeScript interfaces
│   │
│   └── providers/
│       ├── SWRProvider.tsx           # SWR config with refresh interval
│       └── ThemeProvider.tsx          # Dark-only (no light mode toggle needed)
```

### 3.2 File-to-API Mapping

```
hooks/useOverview.ts      → GET /api/overview
hooks/useMapData.ts       → GET /api/map?{station,min_support,query,limit}
hooks/useHotspots.ts      → GET /api/hotspots?{station,min_support,query,limit}
hooks/useDeployment.ts    → GET /api/deployment + POST /api/optimize
hooks/useIntelligence.ts  → GET /api/intelligence?{station,query,limit}
hooks/useTimeline.ts      → GET /api/timeline?{station,query,limit}
hooks/useMissions.ts      → GET /api/missions?{station,query,limit}
hooks/useEvidence.ts      → GET /api/evidence
hooks/useMapConfig.ts     → GET /api/config
```

**Shared filter flow:** When `filterStore` changes (station, query, support), ALL active hooks automatically refetch via SWR's dependency key mechanism.

### 3.3 Component-to-Component Connections (Data Flow)

```
AppShell
├── SidebarNav
│   ├── onClick → viewStore.setView('overview'|'map'|'hotspots'|'deployment'|'intelligence'|'timeline'|'missions'|'evidence')
│   └── SidebarStatus → useApi('/api/health')
│
├── HeaderBar
│   ├── SearchInput onClick → uiStore.openPalette()
│   ├── Badge: online/offline ← /api/health
│   └── ActionIcon: refresh sidebar
│
├── CommandPalette (Cmd+K)
│   ├── reads: viewStore (available views)
│   ├── reads: filterStore (stations)
│   ├── reads: useHotspots (search results)
│   ├── actions: navigate to view, select hotspot, change filter, run optimize
│   └── onEscape → uiStore.closePalette()
│
├── Main Content Area (switches on viewStore.currentView)
│   │
│   ├── 'overview' → OverviewGrid
│   │   ├── MetricCard × 5 (officers, cells, relief, lift, ndcg)
│   │   ├── HighlightsBar (ROI lift, backtest)
│   │   └── ArtifactStatus (readiness dots)
│   │
│   ├── 'map' → CommandMap
│   │   ├── MapModeSelector → mapStore.setMode('forecast'|'after'|'officer'|'relief'|'score')
│   │   ├── H3HexLayer (reads mapStore.mode → selects color column)
│   │   ├── MapTooltip (hover → hotspot preview)
│   │   ├── MapPopup (click → full card + "View Details" link)
│   │   ├── MapControls (zoom, pitch, bearing)
│   │   └── MapLegend (active color ramp)
│   │
│   ├── 'hotspots' → HotspotTable + HotspotDetail
│   │   ├── HotspotFilters → filterStore.setStation/setQuery/setSupport
│   │   ├── HotspotRow (virtual) → onClick → viewStore.selectHex(h3)
│   │   ├── HotspotDetail ← /api/hotspots/{h3} (slides from right)
│   │   │   ├── scorecards: deployment_score, pred_cii, relief, support
│   │   │   └── HotspotSignals: bar visualization of 16 signals
│   │   └── sync: selected hex → mapStore.flyTo(h3)
│   │
│   ├── 'deployment' → DeploymentConsole
│   │   ├── BudgetSlider → PATCH /api/optimize { officer_budget }
│   │   ├── DeploymentTable (optimized plan, sorted by score)
│   │   └── ReliefComparison (optimized vs reactive bar chart)
│   │
│   ├── 'intelligence' → IntelligenceFeed
│   │   ├── IntelCard × N (virtualized)
│   │   │   ├── LifecycleTimeline (badge: emerging→active→spreading→chronic→cooling)
│   │   │   ├── CapacityTheftMeter (lanes depleted animation)
│   │   │   ├── FingerprintTag (metro surge, school pickup, etc.)
│   │   │   └── CriticalityBadge ("critical in 60 min")
│   │   └── Summary bar: total, critical count, opportunity gap
│   │
│   ├── 'timeline' → TimelineChart
│   │   ├── HorizonTabs (now/+60m/+3h/pattern)
│   │   ├── Recharts AreaChart with confidence bands
│   │   └── ForecastRow × N (virtualized, with criticality badges)
│   │
│   ├── 'missions' → MissionBoard
│   │   ├── MissionCard × N
│   │   │   ├── title, station, location
│   │   │   ├── MarginalValueChart (bar: officer 1→4 ROI)
│   │   │   └── action: "View on Map" → viewStore.setView('map') + selectHex
│   │   └── sorted by deployment_score desc
│   │
│   └── 'evidence' → EvidencePanel
│       ├── BacktestMetrics (ndcg, recall)
│       ├── FeatureBarChart (regression + ranker importance)
│       └── ModelTransparency (features, target, ranker status)
│
└── StatusBar
    └── "Last refreshed: {time}" + "{active_artifacts}/9 artifacts ready"
```

---

## 4. Implementation Steps (10 Parts)

### Part 1: Project Scaffolding & Design Tokens

**Files created:**
- `frontend/package.json` — dependencies (next, react, tailwind, framer-motion, mapbox-gl, deck.gl, recharts, cmdk, zustand, swr, lucide-react, sonner, @tanstack/react-virtual, clsx, tailwind-merge)
- `frontend/tailwind.config.ts` — extended theme with glass tokens, custom colors, custom font
- `frontend/postcss.config.js`
- `frontend/tsconfig.json`
- `frontend/next.config.js` — API proxy to `localhost:8501`, image domains, transpile packages
- `frontend/src/app/globals.css` — CSS variables (§2.1-2.6), `@layer base`, glass utility classes, scrollbar styling, reduced-motion media query
- `frontend/src/app/layout.tsx` — Inter font via `next/font/google`, `<SWRProvider>`, skip-link, meta tags
- `frontend/src/lib/cn.ts` — `clsx` + `tailwind-merge`
- `frontend/src/lib/constants.ts` — `API_BASE = '/api'`, filter defaults, H3 resolution
- `frontend/src/lib/types.ts` — All TypeScript interfaces: `OverviewPayload`, `MapRow`, `HotspotRow`, `HotspotDetail`, `DeploymentPayload`, `IntelligenceRow`, `TimelineRow`, `MissionCard`, `EvidencePayload`, `MapConfig`

**Key connections:** `globals.css` defines tokens used by every component. `types.ts` mirrors `dashboard_service.py` field names exactly. `layout.tsx` wraps all pages in SWR + font providers.

---

### Part 2: Primitives (Atoms)

**Files created (11 components):**

| Component | Props | API | Key behaviors |
|---|---|---|---|
| `GlassCard.tsx` | `elevation: 1-4`, `hoverable`, `className`, `children` | None | `backdrop-blur`, glass-bg, glass-border, hover glow, Framer Motion `whileHover` scale(1.01) |
| `GlassPanel.tsx` | `side: 'left'\|'right'`, `open`, `width`, `onClose` | None | `AnimatePresence` slide-in from side, focus trap when open, `Escape` closes |
| `Badge.tsx` | `variant: lifecycle\|status\|mission`, `label` | None | Color-coded: green(active), amber(emerging), red(chronic), cyan(cooling) |
| `Button.tsx` | `variant: primary\|ghost\|danger`, `size`, `loading`, `icon`, `onClick` | None | Framer tap scale(0.97), loading spinner, `aria-label` |
| `ActionIcon.tsx` | `icon: LucideIcon`, `label`, `onClick`, `variant` | None | `Tooltip` on hover, focus ring, `cursor-pointer` |
| `MetricValue.tsx` | `value: number`, `format: 'default'\|'pct'\|'score'`, `trend?: 'up'\|'down'` | None | Animated counter (useSpring from Framer), trend arrow, monospace font |
| `SparkLine.tsx` | `data: number[]`, `color`, `width`, `height` | None | SVG polyline, gradient fill, micro-animation on hover |
| `ProgressRing.tsx` | `value: 0-1`, `size`, `stroke`, `color` | None | SVG circle, `stroke-dashoffset` animation, label inside |
| `Skeleton.tsx` | `width`, `height`, `radius` | None | Shimmer gradient animation, respects `prefers-reduced-motion` |
| `Tooltip.tsx` | `content: string`, `children`, `side` | None | Accessible (role=tooltip), glass-bg, delay 300ms, dismiss on Escape |
| `SearchInput.tsx` | `value`, `onChange`, `suggestions: Suggestion[]`, `onSelect` | None | Glass input, dropdown with suggestions, keyboard nav (arrows + Enter), `aria-combobox` |

**Key connections:** Every compound component composes these atoms. `MetricValue` is the engine for all KPI cards. `GlassCard` is the foundation for every panel/card. `SparkLine` appears inside `HotspotRow` and `MetricCard`. `Badge` is used across intelligence, timeline, and hotspot views.

---

### Part 3: Zustand Stores + API Hooks

**Stores (4 files):**

| Store | State | Actions | Consumers |
|---|---|---|---|
| `viewStore.ts` | `currentView`, `selectedHex`, `detailPanelOpen` | `setView()`, `selectHex(h3)`, `clearSelection()` | SidebarNav, CommandPalette, AppShell, all view components |
| `mapStore.ts` | `mode` (forecast/after/officer/relief/score), `viewport`, `selectedH3` | `setMode()`, `flyTo(lat,lng)` | MapModeSelector, CommandMap, HotspotRow click |
| `filterStore.ts` | `station`, `query`, `minSupport`, `limit` | `setStation()`, `setQuery()`, `setMinSupport()`, `reset()` | HotspotFilters, CommandPalette, HeaderBar search |
| `uiStore.ts` | `sidebarCollapsed`, `paletteOpen`, `detailWidth` | `toggleSidebar()`, `openPalette()`, `closePalette()`, `setDetailWidth()` | CommandPalette, Sidebar, PanelResizer |

**Hooks (12 files):**

| Hook | SWR Key | Fetches | Returns | Auto-refetch |
|---|---|---|---|---|
| `useOverview.ts` | `/api/overview` | OverviewPayload | `{ overview, isLoading, error }` | On focus |
| `useMapData.ts` | `/api/map?station=...&min_support=...&query=...&limit=300` | MapRow[] | `{ rows, bbox, isLoading }` | On filter change |
| `useHotspots.ts` | `/api/hotspots?...` | HotspotRow[] | `{ hotspots, isLoading }` | On filter change |
| `useDeployment.ts` | `/api/deployment` | DeploymentPayload | `{ deployment, optimize, isLoading }` | On focus + after POST |
| `useIntelligence.ts` | `/api/intelligence?...` | IntelligencePayload | `{ intel, summary, isLoading }` | On filter change |
| `useTimeline.ts` | `/api/timeline?...` | TimelinePayload | `{ horizons, rows, isLoading }` | On filter change |
| `useMissions.ts` | `/api/missions?...` | MissionPayload | `{ missions, isLoading }` | On filter change |
| `useEvidence.ts` | `/api/evidence` | EvidencePayload | `{ evidence, isLoading }` | On mount |
| `useMapConfig.ts` | `/api/config` | MapConfig | `{ config, isLoading }` | On mount |
| `useFilters.ts` | (local) | — | Computed from `filterStore` | — |
| `useCommandPalette.ts` | — | — | `{ open, query, setOpen }` | — |
| `useKeyboardShortcuts.ts` | — | — | Registers `Cmd+K`, `Escape`, view number shortcuts | — |

**Key connections:** When `filterStore.station` changes, SWR key changes → `useMapData`, `useHotspots`, `useIntelligence`, `useTimeline`, `useMissions` all refetch. When `viewStore.selectHex(h3)` fires, `mapStore.flyTo()` is called, and `HotspotDetail` slides open. POST /api/optimize via `useDeployment.optimize()` triggers SWR `mutate()` on deployment + map + overview.

**`lib/api.ts`:** Central SWR fetcher with error handling, base URL from env, revalidation strategy (focus + interval 30s for live data).

---

### Part 4: App Shell + Layout System

**Files:**
- `src/components/layout/AppShell.tsx` — Main grid: sidebar (60px collapsed / 280px expanded) | content area | optional detail panel (400px)
- `src/components/layout/HeaderBar.tsx` — Logo (Lucide `Radar`), search trigger (`Cmd+K`), health badge, refresh button
- `src/components/layout/StatusBar.tsx` — Fixed bottom bar: "Last updated", artifact count, version
- `src/components/layout/PanelResizer.tsx` — Drag handle for detail panel width

**Layout grid (CSS):**
```
+---sidebar---+-----main content------+--detail panel--+
|   icons     |    header bar         |   (optional)   |
|   + labels  |                       |                |
|             |  [view content here]   |  HotspotDetail |
|   nav items |                       |  or IntelCard  |
|             |                       |                |
+-------------+-----------------------+----------------+
|                status bar                             |
+------------------------------------------------------+
```

**Transitions:** Sidebar collapse/expand uses Framer `layout` prop. View switching uses `AnimatePresence` with `mode="wait"` → fade+slide. Detail panel uses `motion.div` with `initial={{ x: '100%' }}` → `animate={{ x: 0 }}`.

**Key connections:** `AppShell` reads `viewStore.currentView` for content routing, `uiStore.sidebarCollapsed` for sidebar width, `viewStore.selectedHex` for detail panel. `HeaderBar` triggers `uiStore.openPalette()`. `StatusBar` reads `/api/health`.

---

### Part 5: Infinite Canvas Map (CommandMap)

**Files:**
- `src/components/map/CommandMap.tsx`
- `src/components/map/H3HexLayer.tsx`
- `src/components/map/MapControls.tsx`
- `src/components/map/MapModeSelector.tsx`
- `src/components/map/MapTooltip.tsx`
- `src/components/map/MapPopup.tsx`
- `src/components/map/MapLegend.tsx`
- `src/lib/color-ramp.ts`

**Map rendering pipeline:**

1. `CommandMap` mounts → initializes Mapbox GL JS (or Mappls SDK if `useMapConfig` returns `provider: 'mappls'`)
2. On top of Mapbox, creates a Deck.gl `Deck` overlay
3. `H3HexLayer` receives `useMapData().rows` → creates `H3HexagonLayer` with:
   - `getHexagon: d => d.h3`
   - `getFillColor: colorRamp(d, mapStore.mode)` (5 modes below)
   - `getElevation: d => d[modeColumn] * 50`
   - `pickable: true` → triggers hover/click
4. On hex hover → `MapTooltip` (glass card with top 3 metrics + sparkline)
5. On hex click → `MapPopup` (glass card with full detail preview + "View Details" button → `viewStore.selectHex(h3)`)
6. `MapModeSelector` — 5 pill buttons at top-right, each maps to a color column:
   - **Forecast** → `pred_next_3h_cii` (green→amber→red ramp)
   - **After Deploy** → `remaining_next_3h_cii` (same ramp, dimmer = less pressure)
   - **Officers** → `officers_assigned` (0 = gray, 1-4 = green density)
   - **Relief** → `expected_relief` (green intensity)
   - **Score** → `deployment_score` (hot ramp from transparent→red)
7. `MapLegend` — dynamic gradient bar matching active mode
8. `MapControls` — compass, zoom +/-, 3D pitch toggle, reset north

**`color-ramp.ts`:** Functions `forecastRamp(v)`, `reliefRamp(v)`, `officerRamp(v)`, `scoreRamp(v)` — all return `[r, g, b, a]` arrays for Deck.gl. Uses `d3-scale-chromatic` `interpolateYlOrRd` adapted for dark bg (brighter, higher contrast).

**Performance:** Deck.gl renders up to 1000 H3 cells at 60fps. Data debounced at 16ms. View state changes throttled at 100ms.

**Key connections:** `CommandMap` reads `useMapData()` rows + `mapStore.mode` for color coding. Click on hex → `viewStore.selectHex(h3)` → `HotspotDetail` panel opens. `MapModeSelector` writes to `mapStore.setMode()`. Filter changes in `filterStore` → `useMapData` refetches → `H3HexLayer` re-renders with new data.

---

### Part 6: Overview Dashboard

**Files:**
- `src/components/overview/OverviewGrid.tsx`
- `src/components/overview/MetricCard.tsx`
- `src/components/overview/HighlightsBar.tsx`
- `src/components/overview/ArtifactStatus.tsx`

**Layout:** 2×3 grid of `MetricCard`s on desktop, 1-col on mobile.

| Card | Value source | Format | Sparkline |
|---|---|---|---|
| Officers Deployed | `overview.summary.officers_deployed` | integer, green | No |
| Active Cells | `overview.summary.active_cells` | integer, cyan | No |
| Expected Relief | `overview.summary.expected_relief` | 2 decimal, green | Yes (last 5 points) |
| AI Lift | `overview.summary.lift_pct` | percentage, accent | Trend arrow |
| Forecast Pressure | `overview.summary.forecast_pressure` | 1 decimal, amber | Yes |
| Backtest NDCG | `overview.highlights.deployment_score_ndcg_at_25` | 3 decimal, blue | No |

**Microinteractions:**
- Numbers animate from 0 to value on mount (Framer `useSpring`, 800ms, `ease-out`)
- Cards have `whileHover={{ y: -4, boxShadow: '0 8px 30px rgba(0,0,0,.5)' }}`
- Sparkline draws on scroll (Intersection Observer → path stroke animation)
- `HighlightsBar` — horizontal flex of 3 key metrics with gradient backgrounds
- `ArtifactStatus` — 9 dots (green=exists, red=missing) with tooltip on hover showing filename + size

**Key connections:** `OverviewGrid` → `useOverview()`. Each `MetricCard` is a `GlassCard` wrapping `MetricValue`. `ArtifactStatus` reads `overview.artifacts[]`. Clicking a metric card can navigate: "Officers Deployed" → `viewStore.setView('deployment')`, "Active Cells" → `viewStore.setView('hotspots')`.

---

### Part 7: Hotspot Detail Panel + Data Table

**Files:**
- `src/components/hotspots/HotspotTable.tsx`
- `src/components/hotspots/HotspotRow.tsx`
- `src/components/hotspots/HotspotDetail.tsx`
- `src/components/hotspots/HotspotSignals.tsx`
- `src/components/hotspots/HotspotFilters.tsx`

**HotspotTable:**
- Virtual list via `@tanstack/react-virtual` (renders 250 rows efficiently)
- Column headers: Location, Station, Deploy Score, Forecast CII, Officers, Relief, Support
- Sortable: click header → `useHotspots` sorts client-side
- Row hover: glass highlight, micro-sparkline appears for CII trend
- Row click → `viewStore.selectHex(h3)` → detail panel opens + map flies to hex

**HotspotDetail (right panel, 400px):**
- `GlassPanel` with `side="right"`
- Header: hotspot label, station badge, location
- Scorecards grid (2×4): deployment_score, pred_next_3h_cii, rank_score, officers_assigned, expected_relief, forecast_cii, support_score, data_quality_score — each is a `MetricValue` inside `GlassCard`
- `HotspotSignals`: horizontal bars for 16 signal values (current_cii, violation_count, capacity_ratio, etc.), each bar colored by value intensity, animated from 0 to value width
- Close button (`Escape` or X) → `viewStore.clearSelection()`

**HotspotFilters:**
- Station dropdown (populated from `overview.filters.stations[]`)
- Support score slider (min/max from `overview.filters.support`)
- Search input (uses `SearchInput` primitive, suggestions from `overview.filters.suggestions[]`)
- All changes → `filterStore` → all view hooks refetch

**Key connections:** `HotspotTable` ← `useHotspots()`. Click row → `viewStore.selectHex(h3)` → `HotspotDetail` fetches `/api/hotspots/{h3}`. `HotspotFilters` writes to `filterStore` which triggers `useHotspots` refetch. Selected hex syncs to map: `viewStore.selectHex` → `mapStore.flyTo()`.

---

### Part 8: Deployment Console + Intelligence Feed + Timeline

**Files (deployment):**
- `src/components/deployment/DeploymentConsole.tsx`
- `src/components/deployment/DeploymentTable.tsx`
- `src/components/deployment/BudgetSlider.tsx`
- `src/components/deployment/ReliefComparison.tsx`
- `src/components/deployment/RunOptimize.tsx`

**Deployment flow:**
1. `BudgetSlider` — glass range slider (1-200 officers), animated thumb, value display
2. `RunOptimize` — green button: POST `/api/optimize` with `{ officer_budget }`, shows `sonner` toast with promise ("Optimizing..." → "Done. Relief: X")
3. After POST success → SWR `mutate('/api/deployment')` + `mutate('/api/overview')` + `mutate('/api/map')`
4. `DeploymentTable` — virtualized list of optimized assignments sorted by `deployment_score`
5. `ReliefComparison` — horizontal bar chart (Recharts): optimized relief vs reactive relief, with animated bar width transitions

**Files (intelligence):**
- `src/components/intelligence/IntelligenceFeed.tsx`
- `src/components/intelligence/IntelCard.tsx`
- `src/components/intelligence/CapacityTheftMeter.tsx`
- `src/components/intelligence/LifecycleTimeline.tsx`
- `src/components/intelligence/FingerprintTag.tsx`

**Intelligence flow:**
1. `IntelligenceFeed` — virtual grid of `IntelCard`s (2 columns on desktop, 1 on mobile)
2. Each `IntelCard` (GlassCard) contains:
   - Header: label + `FingerprintTag` (metro surge, school pickup, etc.)
   - `LifecycleTimeline`: animated bar showing lifecycle stage with color badge
   - `CapacityTheftMeter`: visual lane reduction (e.g., "2.0 lanes → 0.8 lanes") with animated width
   - `CriticalityBadge`: time-to-criticality with pulsing animation if <60min
   - Opportunity gap score with ProgressRing
3. Summary bar at top: total hotspots, critical count, opportunity gap sum

**Files (timeline):**
- `src/components/timeline/TimelineChart.tsx`
- `src/components/timeline/HorizonTabs.tsx`
- `src/components/timeline/ForecastRow.tsx`
- `src/components/timeline/CriticalityBadge.tsx`

**Timeline flow:**
1. `HorizonTabs` — 4 pills: "Now", "+60m", "+3h", "Pattern" — selects which CII column to visualize
2. `TimelineChart` — Recharts `AreaChart` with:
   - X-axis: H3 cells (top 50 by selected horizon)
   - Y-axis: CII value
   - Area fill with gradient (low=green, high=red)
   - Confidence band (if `horizon_source === 'learned'`, show ±20% band)
3. `ForecastRow` — table row with sparkline + criticality badge
4. `CriticalityBadge`: "critical now" (red pulse), "critical in 60 min" (amber), "stable" (green)

**Key connections:** `useDeployment()` triggers POST + mutations. `useIntelligence()` ← `/api/intelligence`. `useTimeline()` ← `/api/timeline`. All read `filterStore` for shared filters. Timeline horizon selection in `HorizonTabs` → local state → `ForecastRow` reads matching column.

---

### Part 9: Mission Board + Evidence Panel + Command Palette

**Files (missions):**
- `src/components/missions/MissionBoard.tsx`
- `src/components/missions/MissionCard.tsx`
- `src/components/missions/MarginalValueChart.tsx`

**Mission Board:**
1. Card grid (3 cols desktop, 1 col mobile) of `MissionCard`s
2. Each `MissionCard` (GlassCard, `whileHover={{ y: -6 }}`):
   - Title: "Clear {label}"
   - Station badge, location, mission type tag
   - `MarginalValueChart`: 4 horizontal bars showing officer 1→4 diminishing returns (animated stagger on mount)
   - Predicted CII, expected relief, officer requirement
   - Quick action: "View on Map" → `viewStore.setView('map')` + `viewStore.selectHex(h3)`

**Files (evidence):**
- `src/components/evidence/EvidencePanel.tsx`
- `src/components/evidence/FeatureBarChart.tsx`
- `src/components/evidence/BacktestMetrics.tsx`
- `src/components/evidence/ModelTransparency.tsx`

**Evidence Panel:**
1. `BacktestMetrics` — 2×2 grid of key metrics (NDCG@25, Recall@25, optimized relief, lift %)
2. `FeatureBarChart` — horizontal bar chart (top 20 features) with dual view toggle (regression / ranker), animated bar staggering
3. `ModelTransparency` — glass card showing: target column, prediction column, ranker status, feature list with importances

**Command Palette:**
- `src/components/command-palette/CommandPalette.tsx`
- `src/components/command-palette/CommandItem.tsx`
- `src/components/command-palette/CommandGroup.tsx`
- `src/components/command-palette/commands.ts`

**Palette structure:**
1. Trigger: `Cmd+K` (or `Ctrl+K`) → opens `cmdk` dialog
2. Input: glass search input at top
3. Groups:
   - **Views** — Navigate to Overview, Map, Hotspots, Deployment, Intelligence, Timeline, Missions, Evidence (8 items)
   - **Hotspots** — Search results from `useHotspots(query)`, showing top 10 matching locations
   - **Actions** — Run Optimization, Toggle Sidebar, Toggle Map Mode (5 items)
   - **Filters** — Station: [list from overview], Clear Filters (dynamic)
4. Each `CommandItem` — icon + label + keyboard shortcut hint
5. Keyboard nav: ↑↓ to navigate, Enter to select, Escape to close
6. Accessible: `role="dialog"`, `aria-label="Command palette"`, focus trap active

**`commands.ts`** — Registry: `{ id, label, icon, shortcut, action }`. Actions call `viewStore`, `filterStore`, `uiStore`, or `useDeployment().optimize()`.

**Key connections:** Command palette actions write to Zustand stores which trigger view changes, filter changes, or API mutations. Palette searches hotspots via `useHotspots(query)`. Selecting a hotspot result → `viewStore.setView('hotspots')` + `viewStore.selectHex(h3)`.

---

### Part 10: Animations Polish + Accessibility Audit + Build Integration

**Framer Motion animations (defined per component):**

| Animation | Trigger | Duration | Easing | Component |
|---|---|---|---|---|
| Spring counter | Mount | 800ms | spring(1,80,10) | `MetricValue` |
| Slide-in panel | Open | 300ms | ease-out | `GlassPanel`, `HotspotDetail` |
| Fade+scale card | View enter | 250ms | ease-out | All view containers |
| Row stagger | Data load | 50ms stagger | ease-out | `HotspotTable`, `IntelCard` |
| Tooltip appear | Hover | 200ms | ease-out | `Tooltip`, `MapTooltip` |
| Button press | Tap | 100ms | spring | `Button`, `ActionIcon` |
| Hex hover glow | Hover | 150ms | ease-out | `H3HexLayer` (Deck.gl) |
| Bar chart grow | Mount | 600ms | ease-out | `FeatureBarChart`, `MarginalValueChart` |
| Criticality pulse | If critical | infinite 2s | ease-in-out | `CriticalityBadge` |
| Layout shift | Sidebar toggle | 300ms | ease-in-out | `AppShell` grid |
| Page transition | View switch | 200ms | ease-in | `AnimatePresence` exit |
| `prefers-reduced-motion` | — | **all 0ms** | — | Override via MotionConfig |

**Accessibility audit checklist:**
1. WCAG AAA contrast on all text/bg combinations
2. All glass backgrounds pass contrast check (text on glass must be readable)
3. `focus-visible` ring on every interactive element
4. Skip-link works (Tab → "Skip to main content" link visible)
5. ARIA: `role="navigation"`, `role="main"`, `role="complementary"`, `aria-live` on dynamic regions
6. Screen reader: toast notifications announced, map hex selection announced
7. All images/icons: `aria-label` or `aria-hidden="true"` for decorative
8. Form inputs: associated `<label>` with `htmlFor`
9. `prefers-reduced-motion` disables all Framer Motion animations (via `MotionConfig`)
10. Keyboard: full navigation without mouse; no keyboard traps

**Build integration:**
- Update `vercel.json` build command for Next.js: `"buildCommand": "cd frontend && pnpm install && pnpm build"`
- Update `frontend/.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:8501`
- Next.js `next.config.js` rewrites: `/api/:path*` → `http://localhost:8501/api/:path*` (dev proxy)
- Vercel: API requests route to FastAPI via `vercel.json` rewrites (already configured)
- `frontend/next.config.js` → `output: 'export'` if using static export, or keep SSR for API proxy
- Ensure `frontend/dist/` or `frontend/out/` is served by FastAPI `StaticFiles` mount

---

## 5. Cross-Cutting Concerns

### 5.1 State Flow Diagram

```
User Action (click/type/shortcut)
     │
     ▼
Zustand Store (viewStore / filterStore / mapStore / uiStore)
     │
     ├──► SWR Key Change (filters injected into key)
     │         │
     │         ▼
     │    API Request (GET /api/...)
     │         │
     │         ▼
     │    Component Re-render (via SWR hook)
     │
     └──► Direct Component Update (view, panel, sidebar)
              │
              ▼
         Framer Motion Animation
```

### 5.2 Filter Propagation

```
filterStore.setStation("Jayanagar")
     │
     ├──► useMapData key changes → refetch /api/map?station=Jayanagar
     ├──► useHotspots key changes → refetch /api/hotspots?station=Jayanagar
     ├──► useIntelligence key changes → refetch /api/intelligence?station=Jayanagar
     ├──► useTimeline key changes → refetch /api/timeline?station=Jayanagar
     └──► useMissions key changes → refetch /api/missions?station=Jayanagar
```

### 5.3 Hex Selection Flow

```
CommandMap hex click
     │
     ├──► viewStore.selectHex(h3_cell)
     │         │
     │         ├──► mapStore.flyTo(lat, lng) → Mapbox animateTo
     │         ├──► HotspotDetail opens (GlassPanel, fetches /api/hotspots/{h3})
     │         └──► HotspotRow highlights in table
     │
     └──► CommandPalette selecting a hotspot
               │
               ├──► viewStore.setView('hotspots')
               └──► viewStore.selectHex(h3)
```

### 5.4 Optimization Flow

```
BudgetSlider change (value: 50)
     │
     ▼
RunOptimize button click
     │
     ▼
POST /api/optimize { officer_budget: 50 }
     │
     ├──► sonner toast: "Optimizing..." → "Done"
     │
     ├──► SWR mutate('/api/deployment') → DeploymentConsole re-renders
     ├──► SWR mutate('/api/overview') → OverviewGrid updates metrics
     └──► SWR mutate('/api/map') → CommandMap H3 layer re-renders with new officer colors
```

### 5.5 Error & Loading States

| State | Visual | Component |
|---|---|---|
| Loading (first) | Skeleton with shimmer | Every data-dependent component |
| Loading (revalidate) | Existing content stays, SWR shows stale-while-revalidate | All views |
| Error | sonner toast + inline error message with retry button | All hooks |
| Empty | Illustrated empty state with action | HotspotTable, IntelFeed, MissionBoard |
| Offline | StatusBar shows red dot, data is stale from cache | StatusBar |

### 5.6 Responsive Breakpoints

| Viewport | Sidebar | Grid | Map | Detail |
|---|---|---|---|---|
| ≥1440px | 280px | 12-col | Full | 400px panel |
| 1024-1439px | 60px icons | 8-col | Full | 360px panel |
| 768-1023px | Bottom tab bar | 4-col | Full-screen | Bottom sheet |
| <768px | Bottom tab bar | 1-col | Full-screen | Modal overlay |

---
