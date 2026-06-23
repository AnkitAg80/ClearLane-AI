

# ClearLane AI — Frontend Rebuild Plan v1.0
### "Operation Prism" — A Pixel-Perfect, Infinite-Canvas Command Surface for Curbside Intelligence

> A complete, ground-up rebuild of the ClearLane AI web app into an award-winning, Linear-inspired, Swiss-design, dark-mode command surface with glassmorphism, conversational UI, infinite canvas, and rich data viz — wired 1:1 to the existing FastAPI backend.

---

## 0. Executive Summary

This document defines the complete frontend architecture, design system, file structure, component inventory, API mapping, animation choreography, accessibility plan, and build pipeline for the ClearLane AI rebuild. Every endpoint in `app.py` is mapped to a concrete UI surface. Every file connection is specified. Every function contract is documented. Nothing is left ambiguous.

**Stack:** React 18 + TypeScript 5 + Vite 5 + Tailwind 3.4 + Framer Motion 11 + TanStack Query 5 + Zustand 5 + Radix UI + cmdk + Visx + Recharts + MapLibre GL + Lenis + D3 + Lucide + shiki + react-aria.

**Backend contract:** All endpoints under `/api/*` (FastAPI, port 8501). CORS open. Returns JSON. See §6 for full mapping.

**Design ethos:** Linear × Vercel × Stripe × Arc × Notion × Figma × Raycast. Dark, dense, calm, fast, expressive.

---

## 1. Design Principles

| # | Principle | Implementation |
|---|---|---|
| P1 | **Zero Clutter** | Max 7 primary actions per screen. Progressive disclosure everywhere. |
| P2 | **Swiss Design** | 8px grid, strict typographic hierarchy, asymmetric balance, generous whitespace. |
| P3 | **Glassmorphism** | Layered frosted surfaces with `backdrop-blur`, 1px hairlines, depth via opacity not shadow-bloat. |
| P4 | **Microinteractions** | Every interactive element responds in <100ms with a visible state change. |
| P5 | **Fluid Motion** | Layout transitions use spring physics; route transitions use shared-layout animations. |
| P6 | **Linear-inspired** | Compact density, keyboard-first, ⌘K everywhere, breadcrumb-less navigation. |
| P7 | **Accessibility-first** | WCAG 2.2 AAA target. Full keyboard nav. Reduced-motion respect. ARIA live regions. |
| P8 | **Pixel-perfect** | 0.5px hairlines, subpixel text, snap-to-grid, optical alignment. |
| P9 | **Premium feel** | Tactile feedback, sound (optional), haptic-style spring easing. |
| P10 | **Infinite Canvas** | Map + timeline live on a pannable/zoomable surface; panels dock as overlays. |

---

## 2. Design System

### 2.1 Color Tokens (Dark, Swiss-restrained)

```
/* Background — near-black with subtle blue cast */
--bg-void:        #06070A;   /* app shell */
--bg-canvas:      #0A0C11;   /* main surface */
--bg-elevated:    #101218;   /* panels */
--bg-glass:       rgba(16, 18, 24, 0.55);  /* frosted */

/* Foreground */
--fg-primary:     #F4F6FB;
--fg-secondary:   #A8AEC0;
--fg-tertiary:    #6B7180;
--fg-quaternary:  #3F4452;

/* Hairlines */
--border-subtle:  rgba(255,255,255,0.06);
--border-default: rgba(255,255,255,0.10);
--border-strong:  rgba(255,255,255,0.18);

/* Accent — Linear-style indigo */
--accent:         #5E6AD2;
--accent-hover:   #7480E0;
--accent-pressed: #4A55B8;

/* Signal palette (data viz) */
--sig-critical:   #FF5C5C;   /* CII high / chronic */
--sig-warn:       #FFB347;   /* spreading */
--sig-watch:      #FFD966;   /* active */
--sig-calm:       #4ADE80;   /* resolving */
--sig-cold:       #38BDF8;   /* info */
--sig-violet:     #A78BFA;   /* highlight */
--sig-mute:       #2A2F3D;   /* off-state */

/* Status */
--success:        #4ADE80;
--warning:        #FBBF24;
--danger:         #F87171;
--info:           #60A5FA;
```

### 2.2 Typography

- **Display / UI:** Inter Variable (display optical size, `font-feature-settings: "ss01", "cv11"`)
- **Mono:** JetBrains Mono Variable (for H3 codes, metrics, code blocks)
- **Data:** Inter Tabular (`font-variant-numeric: tabular-nums`)
- Scale (modular 1.125, base 13px):

```
--text-2xs: 10px / 14px
--text-xs:  11px / 16px
--text-sm:  13px / 20px   ← body default
--text-md:  15px / 22px
--text-lg:  18px / 26px
--text-xl:  22px / 30px
--text-2xl: 28px / 36px
--text-3xl: 36px / 44px
--text-4xl: 48px / 56px
```

### 2.3 Spacing / Grid

- 4px base unit. Soft 8px grid. Component padding: 12 / 16 / 20 / 24.
- Radii: `--r-xs:4px`, `--r-sm:6px`, `--r-md:8px`, `--r-lg:12px`, `--r-xl:16px`, `--r-2xl:24px`, `--r-full:9999px`.
- Hairline `0.5px` borders rendered via `box-shadow: inset 0 0 0 0.5px var(--border-default)`.

### 2.4 Motion Tokens

```
--ease-spring:    cubic-bezier(0.16, 1, 0.3, 1)
--ease-out-soft:  cubic-bezier(0.22, 1, 0.36, 1)
--ease-in-out:    cubic-bezier(0.65, 0, 0.35, 1)
--dur-instant: 80ms
--dur-fast:    140ms
--dur-base:    220ms
--dur-slow:    360ms
--dur-page:    520ms
```

Spring presets (Framer Motion): `{ type: "spring", stiffness: 380, damping: 30 }` for UI; `{ stiffness: 220, damping: 26 }` for layout; `{ stiffness: 140, damping: 20 }` for hero.

### 2.5 Glass Spec

```css
.glass {
  background: var(--bg-glass);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 0.5px solid var(--border-default);
  box-shadow:
    inset 0 0.5px 0 rgba(255,255,255,0.06),
    0 1px 2px rgba(0,0,0,0.4),
    0 12px 40px rgba(0,0,0,0.5);
}
.glass-strong { background: rgba(10,12,17,0.78); backdrop-filter: blur(40px) saturate(200%); }
```

### 2.6 Iconography

- **Lucide React** (1.5px stroke, 16px default, optical-aligned).
- Custom hexagon glyph for H3; custom mission glyph for deployment cards.

---

## 3. Tech Stack & Versions

| Layer | Choice | Version |
|---|---|---|
| Framework | React | 18.3 |
| Language | TypeScript | 5.4 |
| Bundler | Vite | 5.2 |
| Styling | Tailwind CSS | 3.4 |
| Animation | Framer Motion | 11.2 |
| State (server) | TanStack Query | 5.40 |
| State (client) | Zustand | 5.0 |
| Router | React Router | 6.23 |
| Primitives | Radix UI | latest |
| Command palette | cmdk | 1.0 |
| Charts | Visx + Recharts + D3 | latest |
| Maps | MapLibre GL JS | 4.5 |
| Smooth scroll | Lenis | 1.1 |
| Tables | TanStack Table | 8.17 |
| Forms | React Hook Form + Zod | latest |
| Notifications | Sonner | 1.5 |
| Icons | lucide-react | latest |
| Date | date-fns | 3.6 |
| Markdown | react-markdown + shiki | latest |
| A11y | react-aria + react-aria-components | latest |
| Testing | Vitest + Playwright + Testing Library | latest |
| Lint | ESLint + Prettier + Biome | latest |

---

## 4. Information Architecture

```
ClearLane AI
├── Overview            ← /                  hero KPIs, map, mission preview
├── Canvas              ← /canvas            infinite map + docked panels
├── Hotspots            ← /hotspots          sortable table + detail drawer
├── Timeline            ← /timeline          horizon matrix (now/+60m/+3h/pattern)
├── Intelligence        ← /intelligence      lifecycle, capacity-theft, fingerprints
├── Deployment          ← /deployment        optimized vs reactive, ROI lift
├── Missions            ← /missions          mission cards queue
├── Evidence            ← /evidence          backtest, ROI, model, feature importance
├── Artifacts           ← /artifacts         file health monitor
└── Settings            ← /settings          (future) config, theme
```

**Global overlays (always reachable):**
- ⌘K Command Palette
- Conversational Assistant (bottom-right dock)
- Notification center (top-right bell)
- Officer-budget optimizer (modal, calls `/api/optimize`)

---

## 5. Complete File Structure

```
frontend/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── .eslintrc.cjs
├── .prettierrc
├── .env.example
├── README.md
├── public/
│   ├── favicon.svg
│   ├── fonts/                       # self-hosted Inter + JetBrains Mono
│   └── og-image.png
└── src/
    ├── main.tsx                     # React root, providers bootstrap
    ├── App.tsx                      # Router + layout shell
    ├── vite-env.d.ts
    │
    ├── app/
    │   ├── router.tsx               # route table, lazy imports
    │   ├── routes.ts                # route constants
    │   ├── providers.tsx            # QueryClient, Theme, Toast, Tooltip, Modals
    │   └── bootstrap.ts             # initial data prefetch on mount
    │
    ├── config/
    │   ├── env.ts                   # import.meta.env wrapping
    │   ├── api.ts                   # base URL, endpoints, query keys
    │   ├── constants.ts             # H3_RES, BBOX, LIMITS, SIGNALS
    │   ├── nav.ts                   # primary nav items
    │   └── theme.ts                 # CSS var injection
    │
    ├── types/
    │   ├── api.ts                   # all response DTOs (1:1 with backend)
    │   ├── hotspot.ts
    │   ├── map.ts
    │   ├── deployment.ts
    │   ├── intelligence.ts
    │   ├── timeline.ts
    │   ├── mission.ts
    │   ├── evidence.ts
    │   ├── artifacts.ts
    │   ├── overview.ts
    │   └── common.ts                # Option, Paginated, FilterState, etc.
    │
    ├── lib/
    │   ├── api/
    │   │   ├── client.ts            # fetch wrapper, error normalization
    │   │   ├── endpoints.ts         # typed endpoint functions
    │   │   ├── queryKeys.ts         # TanStack Query key factory
    │   │   └── hooks.ts             # generated useXQuery / useXMutation
    │   ├── h3/
    │   │   ├── h3ToGeo.ts           # h3-js wrapper
    │   │   ├── polygon.ts           # H3 → GeoJSON polygon
    │   │   └── color.ts             # CII → color interpolation
    │   ├── map/
    │   │   ├── layers.ts            # MapLibre layer specs
    │   │   ├── sources.ts           # GeoJSON source builders
    │   │   ├── camera.ts            # fitBounds, flyTo helpers
    │   │   └── style.json           # dark Swiss base style
    │   ├── format/
    │   │   ├── number.ts            # tabular, compact, percent
    │   │   ├── time.ts              # relative, horizon labels
    │   │   ├── hotspot.ts           # label fallbacks
    │   │   └── color.ts             # signal → hex
    │   ├── motion/
    │   │   ├── presets.ts           # spring/easing exports
    │   │   ├── variants.ts          # Framer variants
    │   │   └── gestures.ts          # drag, hover, press configs
    │   ├── a11y/
    │   │   ├── focusTrap.ts
    │   │   ├── liveRegion.ts
    │   │   └── shortcuts.ts         # global keymap
    │   ├── canvas/
    │   │   ├── usePanZoom.ts        # infinite canvas hook
    │   │   └── geometry.ts          # screen↔world transforms
    │   └── utils/
    │       ├── cn.ts                # clsx + twMerge
    │       ├── debounce.ts
    │       ├── download.ts
    │       └── id.ts
    │
    ├── stores/
    │   ├── useFilterStore.ts        # station, minSupport, query
    │   ├── useSelectionStore.ts     # selected h3, hovered h3
    │   ├── useCanvasStore.ts        # viewport, zoom, layer toggles
    │   ├── useCommandStore.ts       # palette open state, recents
    │   ├── useAssistantStore.ts     # chat state
    │   ├── useOptimizerStore.ts     # budget modal state
    │   └── usePrefsStore.ts         # theme, density, reduced motion
    │
    ├── hooks/
    │   ├── useHotspots.ts
    │   ├── useHotspotDetail.ts
    │   ├── useMapData.ts
    │   ├── useOverview.ts
    │   ├── useDeployment.ts
    │   ├── useIntelligence.ts
    │   ├── useTimeline.ts
    │   ├── useMissions.ts
    │   ├── useEvidence.ts
    │   ├── useArtifacts.ts
    │   ├── useOptimizeMutation.ts
    │   ├── useFilteredQuery.ts      # shared filter→query hook
    │   ├── useDebouncedValue.ts
    │   ├── useMediaQuery.ts
    │   ├── useReducedMotion.ts
    │   ├── useHotkey.ts
    │   ├── useKeyboardNav.ts
    │   └── useInfiniteCanvas.ts
    │
    ├── components/
    │   ├── ui/                      # atomic primitives
    │   │   ├── Button.tsx
    │   │   ├── IconButton.tsx
    │   │   ├── Badge.tsx
    │   │   ├── Tag.tsx
    │   │   ├── Tooltip.tsx
    │   │   ├── Kbd.tsx
    │   │   ├── Spinner.tsx
    │   │   ├── Skeleton.tsx
    │   │   ├── Divider.tsx
    │   │   ├── Avatar.tsx
    │   │   ├── Progress.tsx
    │   │   ├── Sparkline.tsx
    │   │   ├── Meter.tsx            # radial gauge
    │   │   ├── Stat.tsx             # KPI display
    │   │   ├── Card.tsx
    │   │   ├── Glass.tsx            # surface wrapper
    │   │   ├── Sheet.tsx            # bottom/side drawer (Radix Dialog)
    │   │   ├── Modal.tsx
    │   │   ├── Popover.tsx
    │   │   ├── Menu.tsx
    │   │   ├── Tabs.tsx
    │   │   ├── Segmented.tsx
    │   │   ├── Switch.tsx
    │   │   ├── Checkbox.tsx
    │   │   ├── Slider.tsx
    │   │   ├── Select.tsx
    │   │   ├── Combobox.tsx
    │   │   ├── TextField.tsx
    │   │   ├── SearchField.tsx
    │   │   ├── NumberStepper.tsx
    │   │   ├── Toast.tsx            # Sonner wrapper
    │   │   └── EmptyState.tsx
    │   │
    │   ├── layout/
    │   │   ├── AppShell.tsx         # root grid: rail + canvas + panels
    │   │   ├── Sidebar.tsx          # collapsible nav rail (Linear-style)
    │   │   ├── SidebarItem.tsx
    │   │   ├── TopBar.tsx           # breadcrumb-less context bar
    │   │   ├── CommandBar.tsx       # ⌘K trigger visible in topbar
    │   │   ├── StatusBar.tsx        # bottom strip: health, last sync, bbox
    │   │   ├── Background.tsx       # animated aurora/grid backdrop
    │   │   └── Dock.tsx             # floating bottom-left dock
    │   │
    │   ├── filters/
    │   │   ├── FilterBar.tsx        # station select, support slider, search
    │   │   ├── StationSelect.tsx
    │   │   ├── SupportSlider.tsx
    │   │   ├── SearchInput.tsx
    │   │   ├── FilterChips.tsx
    │   │   └── FilterSummary.tsx
    │   │
    │   ├── map/
    │   │   ├── MapCanvas.tsx        # MapLibre GL host
    │   │   ├── MapLayers.ts         # layer config
    │   │   ├── H3HexLayer.tsx       # custom H3 fill+extrude
    │   │   ├── MapLegend.tsx
    │   │   ├── MapControls.tsx      # zoom, layer toggle, reset
    │   │   ├── MapTooltip.tsx
    │   │   ├── MapProvider.tsx      # Mappls/Carto loader
    │   │   └── MiniMap.tsx          # overview inset
    │   │
    │   ├── hotspots/
    │   │   ├── HotspotTable.tsx
    │   │   ├── HotspotRow.tsx
    │   │   ├── HotspotDetailSheet.tsx
    │   │   ├── HotspotScorecards.tsx
    │   │   ├── HotspotSignals.tsx
    │   │   └── HotspotRankBadge.tsx
    │   │
    │   ├── timeline/
    │   │   ├── TimelineMatrix.tsx
    │   │   ├── TimelineRow.tsx
    │   │   ├── HorizonHeader.tsx
    │   │   ├── HorizonCell.tsx
    │   │   └── HorizonSparkline.tsx
    │   │
    │   ├── intelligence/
    │   │   ├── IntelligenceGrid.tsx
    │   │   ├── LifecycleBadge.tsx
    │   │   ├── CapacityTheftMeter.tsx
    │   │   ├── CriticalityCountdown.tsx
    │   │   ├── FingerprintCard.tsx
    │   │   └── OpportunityGapBar.tsx
    │   │
    │   ├── deployment/
    │   │   ├── DeploymentCompare.tsx
    │   │   ├── OfficerBudgetModal.tsx
    │   │   ├── ROILiftChart.tsx
    │   │   ├── PlanColumn.tsx
    │   │   └── DeploymentSummary.tsx
    │   │
    │   ├── missions/
    │   │   ├── MissionBoard.tsx
    │   │   ├── MissionCard.tsx
    │   │   └── MissionProgress.tsx
    │   │
    │   ├── evidence/
    │   │   ├── BacktestPanel.tsx
    │   │   ├── ROIPanel.tsx
    │   │   ├── ModelPanel.tsx
    │   │   ├── FeatureImportanceChart.tsx
    │   │   └── ArtifactTable.tsx
    │   │
    │   ├── viz/
    │   │   ├── AreaChart.tsx
    │   │   ├── BarChart.tsx
    │   │   ├── Heatmap.tsx
    │   │   ├── RadialGauge.tsx
    │   │   ├── DonutChart.tsx
    │   │   ├── SankeyLite.tsx
    │   │   ├── HorizonChart.tsx
    │   │   ├── Sparkline.tsx
    │   │   └── ChartContainer.tsx
    │   │
    │   ├── command/
    │   │   ├── CommandPalette.tsx   # cmdk root
    │   │   ├── CommandItem.tsx
    │   │   ├── CommandGroup.tsx
    │   │   └── commandRegistry.ts   # all commands w/ handlers
    │   │
    │   ├── assistant/
    │   │   ├── AssistantDock.tsx    # floating chat
    │   │   ├── AssistantThread.tsx
    │   │   ├── AssistantMessage.tsx
    │   │   ├── AssistantInput.tsx
    │   │   ├── AssistantSuggestions.tsx
    │   │   └── assistantEngine.ts   # intent parser + action dispatch
    │   │
    │   └── common/
    │       ├── PageHeader.tsx
    │       ├── SectionTitle.tsx
    │       ├── ErrorBoundary.tsx
    │       ├── QueryBoundary.tsx    # Suspense + ErrorUI
    │       ├── EmptyState.tsx
    │       ├── CopyButton.tsx
    │       └── KbdHint.tsx
    │
    ├── features/                    # one folder per route
    │   ├── overview/
    │   │   ├── OverviewPage.tsx
    │   │   ├── HeroStats.tsx
    │   │   ├── HighlightsRail.tsx
    │   │   ├── MapPreview.tsx
    │   │   └── MissionPreview.tsx
    │   ├── canvas/
    │   │   ├── CanvasPage.tsx
    │   │   ├── CanvasDock.tsx
    │   │   ├── CanvasPanels.tsx
    │   │   └── CanvasHud.tsx
    │   ├── hotspots/
    │   │   ├── HotspotsPage.tsx
    │   │   └── HotspotsPageHeader.tsx
    │   ├── timeline/
    │   │   └── TimelinePage.tsx
    │   ├── intelligence/
    │   │   └── IntelligencePage.tsx
    │   ├── deployment/
    │   │   └── DeploymentPage.tsx
    │   ├── missions/
    │   │   └── MissionsPage.tsx
    │   ├── evidence/
    │   │   └── EvidencePage.tsx
    │   └── artifacts/
    │       └── ArtifactsPage.tsx
    │
    └── styles/
        ├── globals.css             # tailwind + base + tokens
        ├── fonts.css
        ├── animations.css
        └── prose.css               # markdown styling
```

---

## 6. API → UI Mapping (Every Endpoint)

### 6.1 Endpoint Catalogue

| Method | Endpoint | UI Consumer(s) | Hook | Query Key |
|---|---|---|---|---|
| GET | `/api/health` | `StatusBar`, `ArtifactsPage` | `useHealth` | `['health']` |
| GET | `/api/config` | `MapProvider` | `useMapConfig` | `['config']` |
| GET | `/api/dashboard` | (legacy; deprecated) | — | — |
| GET | `/api/overview` | `OverviewPage`, `HeroStats`, `HighlightsRail`, `FilterBar` | `useOverview` | `['overview']` |
| GET | `/api/map?station&min_support&query&limit` | `MapCanvas`, `CanvasPage`, `OverviewPage.MapPreview` | `useMapData` | `['map', filters]` |
| GET | `/api/hotspots?...` | `HotspotsPage`, `HotspotTable` | `useHotspots` | `['hotspots', filters]` |
| GET | `/api/hotspots/{h3}` | `HotspotDetailSheet` | `useHotspotDetail` | `['hotspot', h3]` |
| GET | `/api/deployment` | `DeploymentPage`, `DeploymentCompare`, `ROILiftChart` | `useDeployment` | `['deployment']` |
| POST | `/api/optimize` | `OfficerBudgetModal` | `useOptimizeMutation` | (mutation) |
| GET | `/api/evidence` | `EvidencePage`, all panels | `useEvidence` | `['evidence']` |
| GET | `/api/artifacts` | `ArtifactsPage` | `useArtifacts` | `['artifacts']` |
| GET | `/api/feature_importance` | `FeatureImportanceChart` | `useFeatureImportance` | `['feature_importance']` |
| GET | `/api/intelligence?station&query&limit` | `IntelligencePage`, `IntelligenceGrid` | `useIntelligence` | `['intelligence', filters]` |
| GET | `/api/timeline?station&query&limit` | `TimelinePage`, `TimelineMatrix` | `useTimeline` | `['timeline', filters]` |
| GET | `/api/missions?station&query&limit` | `MissionsPage`, `MissionBoard`, `OverviewPage.MissionPreview` | `useMissions` | `['missions', filters]` |

### 6.2 Typed Client (`lib/api/endpoints.ts`)

```ts
export const api = {
  health:           ()                       => client.get<Health>('/api/health'),
  config:           ()                       => client.get<MapConfig>('/api/config'),
  overview:         ()                       => client.get<Overview>('/api/overview'),
  map:              (f: MapFilter)           => client.get<MapResponse>('/api/map', f),
  hotspots:         (f: HotspotFilter)       => client.get<HotspotList>('/api/hotspots', f),
  hotspotDetail:    (h3: string)             => client.get<HotspotDetail>(`/api/hotspots/${h3}`),
  deployment:       ()                       => client.get<DeploymentPayload>('/api/deployment'),
  optimize:         (b: OfficerBudget)       => client.post<OptimizeResult>('/api/optimize', b),
  evidence:         ()                       => client.get<Evidence>('/api/evidence'),
  artifacts:        ()                       => client.get<ArtifactList>('/api/artifacts'),
  featureImportance:()                       => client.get<FeatureImportance>('/api/feature_importance'),
  intelligence:     (f: IntelFilter)         => client.get<IntelligencePayload>('/api/intelligence', f),
  timeline:         (f: IntelFilter)         => client.get<TimelinePayload>('/api/timeline', f),
  missions:         (f: IntelFilter)         => client.get<MissionPayload>('/api/missions', f),
};
```

### 6.3 Filter → Query Connection

`useFilterStore` (Zustand) holds `{ station, minSupport, query }`. A `useFilteredQuery` hook subscribes to the store, debounces `query` (180ms), and exposes derived query keys.

Every filter-aware hook (`useMapData`, `useHotspots`, `useIntelligence`, `useTimeline`, `useMissions`) composes this hook so a single filter change cascades to all five queries atomically. TanStack Query's `placeholderData: keepPreviousData` ensures no flash.

### 6.4 Mutation Flow: `/api/optimize`

```
OfficerBudgetModal
  └─ useOptimizeMutation()
       ├─ mutationFn:  api.optimize({ officer_budget })
       ├─ onMutate:    setStatusBar('optimizing…'); disable modal
       ├─ onSuccess:   queryClient.invalidateQueries(['overview','map','hotspots',
       │                                              'deployment','intelligence',
       │                                              'timeline','missions'])
       │                sonner.success('Deployment re-optimized')
       │                close modal
       └─ onError:     sonner.error('Optimization failed: ' + msg)
```

After invalidation, all panels re-fetch in parallel and animate to new values via shared `key={revision}` layout transitions.

---

## 7. Type System (`src/types/api.ts`)

Mirrors backend 1:1. Highlights:

```ts
export interface Health {
  status: 'ready' | 'missing_artifacts';
  missing_count: number;
  processed_dir: string;
}

export interface MapConfig {
  provider: 'mappls' | 'carto';
  mappls: { enabled: boolean; sdk_url: string; sdk_urls: string[]; attribution: string };
  fallback: { provider: string; tile_url: string; attribution: string };
}

export interface OverviewSummary {
  officers_deployed: number;
  active_cells: number;
  expected_relief: number;
  forecast_pressure: number;
  lift_pct: number;
  deployment_score_top25_recall: number | null;
  mean_ndcg_at_25: number | null;
}

export interface Overview {
  summary: OverviewSummary;
  highlights: {
    lift_pct: number;
    optimized_relief: number | null;
    reactive_relief: number | null;
    deployment_score_top25_recall: number | null;
    deployment_score_ndcg_at_25: number | null;
  };
  filters: { stations: string[]; suggestions: SearchSuggestion[]; support: { min: number; max: number } };
  artifacts: ArtifactRow[];
  bbox: [number, number, number, number] | null;   // [west, south, east, north]
}

export interface MapRow {
  h3: string;
  label: string;
  top_location: string | null;
  top_junction: string | null;
  top_police_station: string | null;
  deployment_score: number;
  pred_next_3h_cii: number;
  rank_score: number;
  expected_relief: number;
  officers_assigned: number;
  forecast_cii: number;
  current_cii: number;
  current_violation_count: number;
  support_score: number;
  data_quality_score: number;
  remaining_next_3h_cii: number;
  metric_values: Record<MetricKey, number>;
  // + all original cii columns
  [k: string]: unknown;
}

export interface HotspotRow { /* subset of MapRow per HOTSPOT_COLUMNS */ }

export interface HotspotDetail {
  h3: string;
  title: string;
  station: string | null;
  location: string | null;
  junction: string | null;
  scorecards: Record<string, number | null>;
  signals: { name: string; value: number | null }[];
  raw: Record<string, unknown>;
}

export interface DeploymentPayload {
  totals: {
    optimized_relief: number | null;
    reactive_relief: number | null;
    lift_pct: number;
    optimized_officers: number;
    reactive_officers: number;
  };
  optimized: HotspotRow[];
  reactive: Record<string, unknown>[];
}

export interface IntelligenceRow extends HotspotRow {
  capacity_theft: number;
  lifecycle: 'active' | 'spreading' | 'chronic' | 'dormant' | 'resolving';
  criticality: { minutes_to_critical: number | null; severity: string };
  fingerprint: string;
  opportunity_gap: number;
  pred_next_1h_cii?: number;
  pred_next_1h_cii_proxy?: number;
  pred_next_2h_cii?: number;
  pred_next_2h_cii_proxy?: number;
  forecast_horizon_source: 'learned' | 'proxy_from_next_3h';
}

export interface TimelinePayload {
  horizons: ('now' | '+60m' | '+3h' | 'pattern')[];
  horizon_source: 'learned' | 'proxy_from_next_3h';
  rows: IntelligenceRow[];
}

export interface MissionCard {
  h3: string;
  label: string;
  // fields produced by build_mission_card in curb_intelligence.py
  [k: string]: unknown;
}

export interface Evidence {
  backtest: Record<string, number | null>;
  roi: Record<string, number | null>;
  model: { target_column: string; prediction_column: string; ranker_enabled: boolean; features: string[] };
  feature_importance: { regression: FeatureRow[]; ranker: FeatureRow[] };
  artifacts: ArtifactRow[];
}

export interface ArtifactRow { artifact: string; exists: boolean; path: string; size_mb: number; }
export interface SearchSuggestion { type: 'location'; label: string; value: string; station: string | null; junction: string | null; h3: string; secondary: string; }
```

---

## 8. Page Blueprints

### 8.1 Overview (`/`)

**Purpose:** 5-second situational awareness. Hero KPIs + map preview + top missions.

**Layout (12-col grid):**

```
┌──────────────────────────────────────────────────────────────────┐
│ TopBar: [Logo] [⌘K search] … [bell] [avatar]                      │
├──────────────┬───────────────────────────────────────────────────┤
│ Sidebar      │  Hero Stats (5 stat cards, glass, animated count) │
│  • Overview  │  ┌───┬───┬───┬───┬───┐                            │
│  • Canvas    │  │Off│Cel│Rel│Lft│NDCG                            │
│  • Hotspots  │  └───┴───┴───┴───┴───┘                            │
│  • Timeline  │  ┌────────────────────┬───────────────────────┐   │
│  • Intel     │  │ Map Preview (live)  │ Top Missions (5 cards)│   │
│  • Deploy    │  │  H3 hexes + legend  │ scroll-snap carousel  │   │
│  • Missions  │  │  click → /canvas    │ click → /missions     │   │
│  • Evidence  │  └────────────────────┴───────────────────────┘   │
│  • Artifacts │  ┌─────────────────────────────────────────────┐ │
│              │  │ Highlights Rail: lift%, recall, NDCG bars    │ │
│              │  └─────────────────────────────────────────────┘ │
├──────────────┴───────────────────────────────────────────────────┤
│ StatusBar: ●ready · 9 artifacts · bbox · last sync · v1.0         │
└──────────────────────────────────────────────────────────────────┘
```

**Data wiring:**
- `useOverview()` → `summary`, `highlights`, `filters`, `artifacts`, `bbox`
- `useMapData(default filters)` → first 80 rows for preview
- `useMissions(limit=5)` → top mission cards

**Microinteractions:**
- Stat cards count up on mount (spring easing, 1.2s).
- Map hexes fade in staggered (50ms each).
- Hovering a mission card lifts it 4px and reveals its CII delta sparkline.
- ⌘K focuses the global palette.

### 8.2 Canvas (`/canvas`) — Infinite Canvas Hero

**Purpose:** Single-screen operations theater. Pannable map + docked glass panels.

**Layout:**
- Full-bleed `MapCanvas` (MapLibre, dark Swiss style, H3 fill+extrude).
- Left dock (auto-collapse, hover-reveal): filters, layer toggles, legend.
- Right dock (resizable, 3 panes): Hotspot detail, Timeline sparkline, Mission strip.
- Bottom HUD: filter chips, officer-budget trigger, health pill.

**Infinite canvas mechanics:**
- Map zoom 9 → 16. Wheel + drag pan. ⌘+scroll = zoom. ⌥+drag = rotate.
- Panels are absolutely positioned, draggable, snappable to dock zones.
- `useInfiniteCanvas` hook manages viewport state in `useCanvasStore`.
- Persistence to `localStorage` (viewport, panel layout, layer toggles).

**Layers (MapLayers.ts):**
1. `h3-fill` — color = `ciiToColor(current_cii)`, opacity 0.55
2. `h3-extrude` — height = `deployment_score * 200`, color = accent gradient
3. `h3-stroke` — 0.5px hairline `border-default`
4. `officer-halo` — pulsing ring around cells with `officers_assigned > 0`
5. `predicted-burst` — animated dashed stroke on cells where `pred_next_3h_cii > current_cii * 1.3`
6. `label-text` — SymbolLayer showing `label` at zoom ≥ 12

**Map config wiring:**
- `useMapConfig()` reads `/api/config`. If `provider === 'mappls'` and `mappls.enabled`, dynamically inject the Mappls SDK script; else use Carto raster tiles via MapLibre `raster-source`.
- All hex polygons generated client-side from `h3` strings via `h3-js`'s `cellToBoundary`.

### 8.3 Hotspots (`/hotspots`)

**Purpose:** Dense, sortable, keyboard-navigable hotspot triage.

**Layout:**
- Left: `FilterBar` (station, support slider, search with typeahead using `overview.filters.suggestions`).
- Right: `HotspotTable` (TanStack Table, sticky header, virtualized rows via `@tanstack/react-virtual`).
- Click row → `HotspotDetailSheet` slides in from right (Radix Dialog + Framer shared-layout).
- Sheet shows: scorecards grid, signals list (radial gauges), raw JSON drawer, "View on Canvas" CTA.

**Columns (Swiss-ordered):** Rank · Label · Station · Deployment Score · Pred 3h CII · Forecast CII · Officers · Expected Relief · Support · Data Quality · H3 (mono).

**Keyboard:** ↑↓ navigate, Enter opens detail, `/` focuses search, `Esc` closes sheet, `c` opens "View on Canvas".

### 8.4 Timeline (`/timeline`)

**Purpose:** Horizon matrix — what's happening now / +60m / +3h / pattern.

**Layout:** Full-width matrix.
- Rows = hotspots (top 150 by `pred_next_3h_cii`).
- Columns = 4 horizons from `payload.horizons`.
- Each cell = `HorizonCell` with mini sparkline + colored value (signal palette).
- Row hover synchronizes with map (if `Canvas` open in another tab via BroadcastChannel).
- Sticky first column (label + station).
- `horizon_source` badge in header (learned vs proxy).

**Visuals:** Each cell uses a horizon chart (Visx `HorizonChart`-style) with three bands.

### 8.5 Intelligence (`/intelligence`)

**Purpose:** Tactical pattern view — lifecycle, capacity theft, criticality, fingerprints, opportunity gaps.

**Layout:** Masonry grid of cards.
- Card types: `LifecycleBadge` (active/spreading/chronic), `CapacityTheftMeter` (radial), `CriticalityCountdown` (live ticking), `FingerprintCard` (text + icon), `OpportunityGapBar` (horizontal bar).
- Sticky summary header: hotspots, critical, opportunity_gap_total.
- Filter-aware (station + query).

**Criticality countdown:** If `criticality.minutes_to_critical` is finite and < 180, render a live ticking `mm:ss` with pulsing red ring. Updates every 1s client-side from a baseline timestamp.

### 8.6 Deployment (`/deployment`)

**Purpose:** Show optimized vs reactive plans and ROI lift.

**Layout:**
- Top: `DeploymentSummary` (4 stat tiles: optimized officers, reactive officers, optimized relief, reactive relief).
- Center: `DeploymentCompare` — two columns (Optimized | Reactive) with synchronized scroll.
- Right rail: `ROILiftChart` (paired bar chart, lift% annotated).
- Sticky CTA: "Re-optimize" → opens `OfficerBudgetModal`.

**OfficerBudgetModal:**
- Glass modal, stepper (10 → 500), preset chips (50/100/150/200), live preview text.
- Submit calls `useOptimizeMutation`.
- On success: full query invalidation + animated counter deltas on all stat tiles (red→green if improved).

### 8.7 Missions (`/missions`)

**Purpose:** Actionable mission cards queue.

**Layout:** Kanban-style scroll-snap board grouped by lifecycle status.
- Each `MissionCard` is glass, with header (rank, label), body (objective, officer count, expected relief), footer (CII delta, time-to-critical).
- Hover reveals quick actions: "Open detail", "Pin to canvas", "Copy h3".
- Cards animate in with stagger (40ms) and spring.

### 8.8 Evidence (`/evidence`)

**Purpose:** Model transparency.

**Tabs:** Backtest · ROI · Model · Feature Importance · Artifacts.
- Backtest: metric grid + radar chart.
- ROI: lift bar + donut (optimized vs reactive relief split).
- Model: metadata table + features chip cloud.
- Feature Importance: dual horizontal bar chart (regression vs ranker), top-20 each, searchable.
- Artifacts: `ArtifactTable` with status icons, size, path, missing highlight.

### 8.9 Artifacts (`/artifacts`)

**Purpose:** Health monitor.

- Table of `ArtifactRow` with `exists` pill, `size_mb` bar, full `path` (mono, copyable).
- Aggregate status pill in `StatusBar`.
- Auto-refresh every 30s via `refetchInterval`.

---

## 9. Command Palette (`⌘K`)

Built with `cmdk` + Radix Dialog + Framer Motion.

**Commands registry (`commandRegistry.ts`):**

| Group | Command | Action |
|---|---|---|
| Navigation | Go to Overview | `navigate('/')` |
| Navigation | Go to Canvas | `navigate('/canvas')` |
| … | …all pages… | … |
| Filters | Filter by station… | opens station combobox |
| Filters | Set min support… | opens slider sub-palette |
| Filters | Clear filters | `useFilterStore.reset()` |
| Hotspots | Search hotspots | focused search → table |
| Hotspots | Open hotspot by H3… | text input → detail sheet |
| Actions | Re-optimize deployment | opens `OfficerBudgetModal` |
| Actions | Refresh all data | `queryClient.invalidateQueries()` |
| Actions | Export current view as JSON | download endpoint response |
| View | Toggle reduced motion | `usePrefsStore` toggle |
| View | Toggle density (compact/cozy) | `usePrefsStore` toggle |
| Help | Keyboard shortcuts | opens shortcuts modal |
| Help | About ClearLane AI | opens about modal |

**Behavior:**
- Fuzzy match via `fuse.js`. Recents tracked in `useCommandStore`.
- Each item has `kbd` hint, icon, group label.
- Arrow keys navigate, Enter executes, ⌘+Enter opens in new tab, Esc closes.
- ⌘K toggles globally via `useHotkey('mod+k')`.

---

## 10. Conversational UI (Assistant)

Floating dock bottom-right. Collapsible. Built on a deterministic intent engine (no LLM dependency required; optional later).

**`assistantEngine.ts`:**
```
parseUserMessage(text) → { intent, entities }
intents:
  - filter.station        "show me Indiranagar station"
  - filter.support        "only high-confidence cells"
  - search.hotspot        "where is MG Road"
  - navigate              "open timeline"
  - optimize              "redeploy 120 officers"
  - explain               "what is CII"
  - compare               "compare optimized vs reactive"
  - summarize             "give me a sitrep"
```

Each intent dispatches a typed action; the assistant replies with a templated natural-language summary that pulls live data from the relevant query cache. Example: "Summarize" → reads `useOverview().data` and renders:

> "9 of 12 artifacts healthy. 84 officers deployed across 31 active cells, expected relief 217.4. Lift vs reactive: +34.2%. Top mission: Brigade Road — 6 officers, 18.3 expected relief."

**UI:**
- `AssistantDock` (glass pill, expandable to 420×560).
- `AssistantThread` (message bubbles, markdown rendering).
- `AssistantSuggestions` (chips for common intents).
- `AssistantInput` (auto-growing textarea, ⌘L focuses globally).
- Voice button (Web Speech API, optional, progressive enhancement).

---

## 11. State Management

### 11.1 Server State — TanStack Query

```ts
// lib/api/queryKeys.ts
export const qk = {
  health:              ['health'] as const,
  config:              ['config'] as const,
  overview:            ['overview'] as const,
  map:                 (f) => ['map', f] as const,
  hotspots:            (f) => ['hotspots', f] as const,
  hotspot:             (h) => ['hotspot', h] as const,
  deployment:          ['deployment'] as const,
  evidence:            ['evidence'] as const,
  artifacts:           ['artifacts'] as const,
  featureImportance:   ['feature_importance'] as const,
  intelligence:        (f) => ['intelligence', f] as const,
  timeline:            (f) => ['timeline', f] as const,
  missions:            (f) => ['missions', f] as const,
};
```

Defaults: `staleTime: 60s`, `gcTime: 5m`, `retry: 2`, `refetchOnWindowFocus: true`, `placeholderData: keepPreviousData` for filtered queries.

### 11.2 Client State — Zustand

| Store | State | Actions |
|---|---|---|
| `useFilterStore` | `station, minSupport, query` | `setStation, setMinSupport, setQuery, reset` |
| `useSelectionStore` | `selectedH3, hoveredH3, multiSelect[]` | `select, hover, clear, toggleMulti` |
| `useCanvasStore` | `viewport, layers{...}, panelLayout` | `setViewport, toggleLayer, dockPanel` |
| `useCommandStore` | `open, recents[], query` | `open, close, addRecent` |
| `useAssistantStore` | `open, thread[], pending` | `send, clear, toggle` |
| `useOptimizerStore` | `open, budget, presets` | `open, close, setBudget, submit` |
| `usePrefsStore` | `density, reducedMotion, sound` | `toggle`, persisted to `localStorage` |

### 11.3 URL State

Filters mirror to URL search params (`?station=…&support=…&q=…`) for shareability. `useSearchParams` synced bidirectionally with `useFilterStore`.

---

## 12. Animation Choreography

### 12.1 Route Transitions

`AnimatePresence` mode="wait" wrapping `<Outlet>`. Each page declares `initial / animate / exit` variants:
- Initial: `{ opacity: 0, y: 8, filter: 'blur(8px)' }`
- Animate: `{ opacity: 1, y: 0, filter: 'blur(0px)' }` over 360ms spring.
- Exit: `{ opacity: 0, y: -8, filter: 'blur(8px)' }` over 180ms.

Shared-layout: hotspot row → detail sheet uses `layoutId={`hotspot-${h3}`}` for hero-card morph.

### 12.2 List Stagger

Every list/grid uses:
```ts
const container = { animate: { transition: { staggerChildren: 0.04 } } };
const item = { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 } };
```

### 12.3 Number Counters

Custom `useCountUp(target, { duration: 1.2, easing: spring })` hook. Renders tabular-nums. On `useOptimizeMutation` success, animates delta (red flash → green settle).

### 12.4 Map Choreography

- Hex fills fade in 0→0.55 opacity over 600ms staggered by 30ms.
- Officer halos: CSS keyframes pulse `box-shadow` 2s infinite.
- Predicted-burst: dashed stroke `stroke-dashoffset` animation 1.2s linear infinite.
- Camera `flyTo` on hotspot selection: 1200ms, ease `--ease-spring`.

### 12.5 Microinteractions Catalogue

| Element | Interaction | Feedback |
|---|---|---|
| Button | hover | bg shift +4% lum, 140ms |
| Button | press | scale 0.97, 80ms |
| IconButton | hover | glow ring expand |
| Table row | hover | bg `bg-elevated`, left accent bar grows 0→2px |
| Tab | activate | underline slides via `layoutId` |
| Chip | hover | border brightens, slight lift |
| Modal | open | backdrop blur 0→20px, content scale 0.96→1 |
| Toast | enter | slide up + spring |
| Stat card | hover | inner glow + 1px lift |
| Mission card | hover | reveal footer sparkline |

### 12.6 Reduced Motion

`useReducedMotion()` from Framer. When true:
- All `transition` durations → 0.
- Stagger children → instant.
- Map pulses → static.
- Route transitions → opacity only.

---

## 13. Accessibility Plan

### 13.1 Standards
- WCAG 2.2 AAA target on text contrast (foreground `#F4F6FB` on `#06070A` = 18.4:1 ✓).
- All interactive elements ≥ 44×44 px target.
- Full keyboard parity with mouse.

### 13.2 ARIA
- Landmarks: `<nav>` (sidebar), `<main>` (canvas), `<aside>` (panels), `<header>`, `<footer>` (status bar).
- `aria-live="polite"` region for filter result counts and optimization success.
- `aria-live="assertive"` for errors.
- `role="dialog"` + `aria-labelledby` on all modals/sheets.
- `role="status"` on stat cards with `aria-label` describing value + unit.

### 13.3 Keyboard Map

| Key | Action |
|---|---|
| `⌘K` / `Ctrl+K` | Open command palette |
| `⌘L` | Focus assistant |
| `/` | Focus search (in pages with search) |
| `g` then `o/c/h/t/i/d/m/e/a` | Go to Overview/Canvas/Hotspots/Timeline/Intelligence/Deployment/Missions/Evidence/Artifacts |
| `f` | Focus filter bar |
| `r` | Refresh data |
| `o` (on hotspot) | Optimize |
| `?` | Keyboard shortcuts modal |
| `Esc` | Close topmost overlay |

### 13.4 Screen Reader
- All charts have `aria-label` with summary ("Top hotspot: Brigade Road, deployment score 0.842, expected relief 18.3").
- Tables use `<th scope>` and `caption`.
- Map: alternative `aria-describedby` text panel listing top 5 hotspots.

### 13.5 Color & Contrast
- No color-only encoding. Every signal color has a glyph (▲ critical, ● spreading, ◆ active, ✓ resolving).
- `prefers-contrast: more` query bumps hairlines to 1px and removes glass blur.

---

## 14. Performance Plan

### 14.1 Bundle Budget
- Initial JS ≤ 220 KB gzip (excluding map SDK).
- Code-split per route via `React.lazy`.
- MapLibre loaded only on Canvas/Overview.
- Charts loaded only on pages that use them.

### 14.2 Data
- TanStack Query caching with smart `staleTime`.
- Virtualized tables (`react-virtual`) for >50 rows.
- Map: only render hexes in viewport; reuse GeoJSON source `setData` on filter changes (no full reload).
- Debounced search (180ms) to avoid thrash.

### 14.3 Render
- `memo` all leaf components.
- `useMemo`/`useCallback` for derived data.
- Avoid prop drilling via Zustand selectors.
- `will-change: transform` only during animations.

### 14.4 Perceived
- Skeletons on first load (glass shimmer).
- `keepPreviousData` on filtered queries — no blank state.
- Optimistic UI on optimize mutation (show new budget immediately, rollback on error).

### 14.5 Metrics
- Lighthouse target: 95+ all categories.
- Web Vitals: LCP < 1.5s, INP < 100ms, CLS < 0.05.

---

## 15. Component Contract Examples

### 15.1 `MapCanvas`

```tsx
interface MapCanvasProps {
  rows: MapRow[];
  bbox: [number, number, number, number] | null;
  selectedH3?: string;
  onSelectH3?: (h3: string | null) => void;
  layers?: Partial<{ fill: boolean; extrude: boolean; officers: boolean; predicted: boolean; labels: boolean }>;
  className?: string;
}
```

Internal flow:
1. On mount, calls `useMapConfig()` to resolve provider.
2. Initializes MapLibre map with `style.json`.
3. Builds GeoJSON `FeatureCollection` from `rows` via `h3.cellToBoundary`.
4. Sets sources/layers from `MapLayers`.
5. Subscribes to `useSelectionStore.hoveredH3` → `setHoverState`.
6. On click → `onSelectH3`.
7. On `rows` change → `source.setData` (no reload).
8. On `bbox` change (and no manual camera) → `camera.fitBounds`.

### 15.2 `HotspotDetailSheet`

```tsx
interface Props { h3: string | null; onClose: () => void; }
```
- Uses `useHotspotDetail(h3)` (enabled only when `h3` truthy).
- Renders `HotspotScorecards` (grid of `Stat` components from `scorecards`).
- Renders `HotspotSignals` (radial gauges from `signals[]`).
- Renders raw JSON in collapsible `<pre>` with shiki highlight.
- CTA: "View on Canvas" → navigates to `/canvas?h3=…`.

### 15.3 `OfficerBudgetModal`

```tsx
interface Props { open: boolean; onClose: () => void; }
```
- Local state `budget` initialized from `useOverview().summary.officers_deployed`.
- Presets: 50, 100, 150, 200, 250.
- Submit → `useOptimizeMutation().mutate({ officer_budget: budget })`.
- Disabled while pending. Error toast on failure.

---

## 16. Build & Dev Pipeline

### 16.1 `vite.config.ts` Highlights

```ts
export default defineConfig({
  plugins: [react(), tsconfigPaths(), tailwind(), { name:'svg-sprite' }],
  server: { port: 5173, proxy: { '/api': 'http://127.0.0.1:8501' } },
  build: { target: 'es2022', sourcemap: true, rollupOptions: { output: { manualChunks } } },
});
```

### 16.2 Scripts

```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "test": "vitest",
  "test:e2e": "playwright test",
  "lint": "biome check src",
  "format": "biome format src --write",
  "typecheck": "tsc --noEmit"
}
```

### 16.3 Production Serving
- `npm run build` outputs `frontend/dist`.
- FastAPI `app.py` mounts `dist` at `/` via `StaticFiles(html=True)`.
- Dev: Vite proxy → FastAPI on 8501.

---

## 17. Implementation Milestones

| # | Milestone | Deliverables | Est. Days |
|---|---|---|---|
| M0 | Scaffold | Vite + TS + Tailwind + tokens + ESLint + base layout | 1 |
| M1 | Design system | All `components/ui/*` primitives, glass, motion presets | 3 |
| M2 | API layer | `lib/api/*`, types, hooks, QueryClient, mock fixtures | 2 |
| M3 | App shell | Sidebar, TopBar, StatusBar, Background, routing, ⌘K | 2 |
| M4 | Overview | HeroStats, MapPreview, MissionPreview, HighlightsRail | 2 |
| M5 | Canvas | MapLibre, H3 layers, docked panels, infinite canvas | 4 |
| M6 | Hotspots | Table, virtualization, detail sheet, filters | 2 |
| M7 | Timeline | Horizon matrix, sparklines | 2 |
| M8 | Intelligence | Cards, lifecycle, capacity theft, criticality countdown | 2 |
| M9 | Deployment | Compare, ROI chart, optimize modal + mutation | 2 |
| M10 | Missions | Kanban board, mission cards | 1 |
| M11 | Evidence | Tabs, feature importance chart, artifacts | 2 |
| M12 | Assistant | Intent engine, dock, thread, suggestions | 3 |
| M13 | A11y pass | Full keyboard, ARIA, screen reader, reduced motion | 2 |
| M14 | Performance | Code-split, virtualize, bundle audit, Lighthouse | 2 |
| M15 | Polish | Microinteractions, sound, og image, empty states | 2 |
| M16 | Tests | Vitest unit + Playwright smoke | 2 |
| **Total** | | | **34** |

---

## 18. Inspiration & Differentiators

- **Linear** — sidebar rail, ⌘K, density, calm motion.
- **Vercel Dashboard** — stat cards, monochrome restraint, holographic accents.
- **Stripe Sigma** — data density, tabular precision.
- **Arc Browser** — spaces, command bar, fluid sheets.
- **Raycast** — command palette UX, recents, fuzzy.
- **Figma** — infinite canvas, panel docking.
- **Notion AI** — conversational assistant inline.
- **Apple Vision Pro** — glassmorphism depth, blur layering.

**Differentiators that make this stand out:**
1. **Infinite canvas + docked glass panels** — ops theater, not a dashboard.
2. **Conversational sitrep** — ask "what's the situation?" → live natural-language summary.
3. **Mission-card morphing** — shared-layout animation from table → detail.
4. **Live criticality countdowns** — seconds-to-critical ticking rings.
5. **Swiss-restrained data viz** — no chartjunk; tabular precision.
6. **Unified filter cascade** — one filter change re-flows 5 queries with no flash.
7. **Optimizer with animated lift delta** — feels like a quant terminal.
8. **Keyboard-first everywhere** — `g o` to jump, `/` to search, `o` to optimize.

---

## 19. Acceptance Criteria

The build is "done" when:

- [ ] Every `/api/*` endpoint is consumed by at least one UI surface.
- [ ] Every page is reachable via mouse, keyboard, and ⌘K.
- [ ] Filters cascade to map, hotspots, intelligence, timeline, missions atomically.
- [ ] Optimize mutation invalidates and animates all dependent queries.
- [ ] Lighthouse ≥ 95 on all four categories on `/`.
- [ ] WCAG 2.2 AAA contrast on all text.
- [ ] Reduced-motion mode disables all non-essential animation.
- [ ] No console errors in production build.
- [ ] All type contracts in `types/api.ts` match backend responses.
- [ ] Empty/loading/error states for every async surface.
- [ ] Pixel-perfect at 1440×900, 1920×1080, 2560×1440; responsive down to 768×1024 (tablet).

---

## 20. Risk Register

| Risk | Mitigation |
|---|---|
| Mappls SDK loads slowly | Async inject + Carto fallback via `/api/config` |
| Large map row counts (>1000) | Virtualize hex render; viewport culling |
| Optimize mutation slow | Optimistic UI + progress toast |
| Filter thrash | 180ms debounce + `keepPreviousData` |
| Backend schema drift | Zod runtime validation on responses → toast on mismatch |
| Accessibility regressions | `axe-core` in CI + Playwright a11y suite |

---

## 21. Out of Scope (v1)

- Multi-tenant auth (single-tenant for now).
- Real-time WebSocket push (polling via `refetchInterval` is sufficient).
- Custom theme builder (single dark theme).
- Mobile phone form factor (tablet+ only).
- Saved views / dashboards (v2).

---

### End of Plan — "Operation Prism"

*This document is the single source of truth. Every file, every connection, every function is specified. Implementation begins at M0.*

— v1.0 · ClearLane AI Frontend Guild