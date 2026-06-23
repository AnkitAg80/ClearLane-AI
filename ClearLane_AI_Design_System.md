# ClearLane AI — Frontend Design System & Implementation Plan
## Version: 2.0 | Theme: Obsidian Command

---

## 1. Design Audit & Inspiration Extraction

### 1.1 8bit.ai — Cinematic Enterprise AI
**URL:** https://www.8bit.ai/

**Extracted Patterns:**
- **Atmosphere:** Pitch-black canvas (`#030303`) with subtle volumetric light streaks and scan-line textures
- **Typography:** Ultra-thin geometric sans-serif (Space Grotesk / Inter) with massive scale contrast (Display 72px vs Body 13px)
- **Motion:** Slow, cinematic parallax; elements fade in with `cubic-bezier(0.16, 1, 0.3, 1)` (Expo Out)
- **Layout:** Extreme minimalism — single focal point per viewport, generous negative space
- **Effect:** CRT-like subtle noise overlay (`opacity: 0.03`) for texture
- **CTA:** Ghost buttons with 1px borders, no fill, glow on hover

**Application to ClearLane:**
- Use as the **Landing/Auth screen** aesthetic — "Intelligent Traffic Enforcement" as hero tagline
- Noise texture overlay on the dashboard for premium tactile feel
- Hero metric cards ("Officers Deployed", "Expected Relief") use 8bit's massive scale contrast

---

### 1.2 OrbitAI — Linear-Inspired Productivity Command Center
**URL:** https://orbitaix.webflow.io/

**Extracted Patterns:**
- **Layout:** Collapsible sidebar (240px) + infinite canvas main area
- **Glassmorphism:** `background: rgba(18, 18, 23, 0.7); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.06)`
- **Cards:** Rounded-2xl (`16px`), subtle inner shadow, no heavy borders
- **Command Palette:** `Cmd+K` global search with fuzzy matching, spotlight effect
- **Microinteractions:** 
  - Sidebar items: `translateX(4px)` + `opacity` shift on hover (150ms)
  - Cards: `scale(1.01)` + `box-shadow` lift on hover (200ms, `cubic-bezier(0.25, 0.46, 0.45, 0.94)`)
  - Toggle switches: Elastic spring animation
- **Data Density:** Inline sparklines, pill badges, status dots, progress rings
- **Personalization:** Dynamic greeting based on time-of-day, user avatar with status ring

**Application to ClearLane:**
- Primary dashboard layout — sidebar + main canvas
- Global command palette for searching hotspots, stations, junctions
- Card system for deployment metrics, hotspot lists, map controls
- Real-time status indicators for data freshness

---

### 1.3 CreativeMarketing — Crypto-Grade Data Visualization
**URL:** https://creativemarketing.peachweb.io/

**Extracted Patterns:**
- **Color System:** Deep navy (`#0B0F19`) base with electric blue (`#3B82F6`) and hot coral (`#F97316`) accents
- **3D Elements:** Glass orbs with environment mapping, floating in negative space
- **Charts:** Gradient area charts, glowing line strokes, donut charts with inner glow
- **Tables:** Dark row striping, hover state with `background: rgba(59, 130, 246, 0.08)`, monospace numerals
- **Transitions:** Page transitions use `clip-path` reveal animations
- **Grid:** Bento-box grid layout (`grid-template-columns: repeat(12, 1fr)`), asymmetric card sizing

**Application to ClearLane:**
- **Map Visualization:** H3 hexagon layer with 3D extrusion, gradient elevation based on CII score
- **Charts:** Forecast timeline with gradient area fill, backtest metrics with glowing gauges
- **Hotspot Table:** Bento-grid cards instead of traditional rows, each card a "mission briefing"
- **Feature Importance:** Horizontal bar chart with gradient fills, glowing top features

---

### 1.4 CosmoQ — Gradient Glass & Warm Enterprise
**URL:** https://cosmoq.framer.website/ (via Framer Marketplace preview)

**Extracted Patterns:**
- **Glass Cards:** Heavy blur (`40px`), subtle warm gradient behind cards (`radial-gradient(circle at 30% 20%, rgba(249, 115, 22, 0.15), transparent 60%)`)
- **Typography:** Editorial serif (Playfair Display) for headings paired with clean sans (Inter) for UI — creates tension
- **Depth:** Multi-layer parallax — background gradient orbs, mid-layer cards, foreground text
- **Buttons:** Pill-shaped (`border-radius: 9999px`), gradient borders using `border-image` or pseudo-elements
- **Spacing:** "Breathable" layout — 80px section padding, 24px card padding

**Application to ClearLane:**
- **Intelligence Cards:** Warm gradient orbs behind lifecycle classification cards (Active/Spreading/Chronic)
- **Mission Briefings:** Editorial serif for location names, sans for metrics
- **Hero Section:** Gradient orb behind the map visualization
- **CTA Buttons:** Pill-shaped "Optimize Deployment" with gradient border animation

---

## 2. Design System Specification

### 2.1 Color Palette — "Obsidian Command"

```css
/* === CORE === */
--obsidian-950: #030305;       /* Deepest background */
--obsidian-900: #0A0A0F;       /* Base canvas */
--obsidian-800: #12121A;       /* Card background */
--obsidian-700: #1A1A25;       /* Elevated surface */
--obsidian-600: #232330;       /* Hover state */
--obsidian-500: #2E2E3E;       /* Border / Divider */
--obsidian-400: #4A4A5E;       /* Muted text */
--obsidian-300: #8A8AA3;       /* Secondary text */
--obsidian-200: #B8B8D1;       /* Primary text */
--obsidian-100: #F0F0F5;       /* Headings / White */

/* === ACCENT — Traffic Signal System === */
--signal-red:     #FF4D4D;      /* Critical hotspots, alerts */
--signal-amber:   #FFB020;      /* Warning, medium priority */
--signal-green:   #00D084;      /* Optimized, success, relief */
--signal-blue:    #3B82F6;      /* Active deployment, info */
--signal-purple:  #8B5CF6;      /* AI predictions, rank scores */
--signal-cyan:    #06B6D4;      /* Forecast, timeline */

/* === GRADIENTS === */
--gradient-hero: radial-gradient(ellipse at 50% 0%, rgba(59, 130, 246, 0.15) 0%, transparent 50%);
--gradient-card: linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%);
--gradient-glow-red: radial-gradient(circle, rgba(255, 77, 77, 0.4) 0%, transparent 70%);
--gradient-glow-green: radial-gradient(circle, rgba(0, 208, 132, 0.4) 0%, transparent 70%);
--gradient-border: linear-gradient(135deg, rgba(59,130,246,0.5), rgba(139,92,246,0.3), rgba(6,182,212,0.5));

/* === SEMANTIC === */
--bg-canvas: var(--obsidian-900);
--bg-card: rgba(18, 18, 26, 0.6);
--bg-card-solid: var(--obsidian-800);
--bg-elevated: rgba(26, 26, 37, 0.8);
--border-subtle: rgba(255, 255, 255, 0.06);
--border-glow: rgba(59, 130, 246, 0.3);
--text-primary: var(--obsidian-100);
--text-secondary: var(--obsidian-300);
--text-muted: var(--obsidian-400);
--text-inverse: var(--obsidian-950);
```

### 2.2 Typography — "Swiss Precision"

```css
/* === FONT STACK === */
--font-display: 'Space Grotesk', 'Inter', system-ui, sans-serif;  /* Headings, numbers */
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; /* UI text */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;              /* Metrics, codes */

/* === SCALE === */
--text-2xs: 11px;   /* Captions, badges */
--text-xs: 12px;    /* Table cells, labels */
--text-sm: 13px;    /* Body small, sidebar */
--text-base: 14px;  /* Body, buttons */
--text-md: 15px;    /* Card titles */
--text-lg: 18px;    /* Section headers */
--text-xl: 24px;    /* Metric values */
--text-2xl: 32px;   /* Hero metrics */
--text-3xl: 48px;   /* Display numbers */
--text-4xl: 64px;   /* Hero titles */

/* === WEIGHTS === */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* === LINE HEIGHTS === */
--leading-tight: 1.1;   /* Headings */
--leading-snug: 1.25;  /* Subheadings */
--leading-normal: 1.5; /* Body */
--leading-relaxed: 1.65; /* Long text */
```

### 2.3 Spacing & Layout — "Grid Logic"

```css
/* === SPACING SCALE (8px base) === */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;

/* === LAYOUT === */
--sidebar-width: 256px;
--sidebar-collapsed: 72px;
--header-height: 64px;
--command-palette-height: 56px;
--canvas-padding: 24px;
--card-radius: 16px;      /* 2xl */
--card-radius-sm: 12px;   /* xl */
--card-radius-lg: 24px;   /* 3xl for hero cards */
--button-radius: 10px;    /* Default buttons */
--pill-radius: 9999px;    /* Pill buttons */

/* === Z-INDEX === */
--z-base: 0;
--z-dropdown: 100;
--z-sticky: 200;
--z-modal: 300;
--z-command: 400;
--z-toast: 500;
--z-tooltip: 600;
```

### 2.4 Shadows & Elevation

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);
--shadow-glow-blue: 0 0 20px rgba(59, 130, 246, 0.15);
--shadow-glow-red: 0 0 20px rgba(255, 77, 77, 0.15);
--shadow-glow-green: 0 0 20px rgba(0, 208, 132, 0.15);
--shadow-inner: inset 0 1px 0 rgba(255, 255, 255, 0.05);
```

### 2.5 Animation Tokens — "Fluid Physics"

```css
/* === EASINGS === */
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
--ease-out-back: cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-in-out-sine: cubic-bezier(0.37, 0, 0.63, 1);
--ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);

/* === DURATIONS === */
--duration-instant: 80ms;
--duration-fast: 150ms;
--duration-normal: 250ms;
--duration-slow: 400ms;
--duration-slower: 600ms;
--duration-page: 800ms;

/* === KEYFRAME PRESETS === */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(-12px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 5px currentColor; }
  50% { box-shadow: 0 0 20px currentColor, 0 0 40px currentColor; }
}
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
```

---

## 3. Component Architecture

### 3.1 Atomic Design Hierarchy

```
📦 Design System
├── 🧬 Atoms
│   ├── Button (variants: primary, ghost, danger, pill, icon)
│   ├── Badge (variants: status, metric, priority, lifecycle)
│   ├── Input (text, search, number, select)
│   ├── Toggle (switch, checkbox, radio)
│   ├── Tooltip (hover, click, contextual)
│   ├── Icon (Lucide icons, 16/20/24px, stroke-width 1.5)
│   ├── Skeleton (shimmer loading states)
│   ├── Divider (horizontal, vertical, gradient)
│   └── Progress (linear, circular, segmented)
│
├── 🔗 Molecules
│   ├── MetricCard (label + value + sparkline + delta)
│   ├── HotspotCard (location + score + status + mini-map)
│   ├── SearchBar (input + icon + shortcuts + suggestions)
│   ├── FilterChip (label + remove + active state)
│   ├── StatusDot (color + pulse + label)
│   ├── TimelineItem (time + event + connector)
│   ├── FeatureBar (name + value + gradient bar)
│   └── MissionCard (location + officers + relief + action)
│
├── 🦠 Organisms
│   ├── Sidebar (navigation + collapse + user + status)
│   ├── CommandPalette (modal + search + fuzzy + actions)
│   ├── MapCanvas (deck.gl + controls + legend + layers)
│   ├── HotspotGrid (bento layout + cards + virtual scroll)
│   ├── DeploymentTable (sortable + filterable + expandable)
│   ├── TimelineChart (recharts + brush + annotations)
│   ├── IntelligencePanel (signals + lifecycle + fingerprint)
│   ├── EvidencePanel (metrics + model + features + artifacts)
│   └── OptimizeModal (slider + preview + confirm + toast)
│
├── 🧩 Templates
│   ├── DashboardLayout (sidebar + header + canvas + overlays)
│   ├── SplitPaneLayout (resizable panels, map + detail)
│   ├── ModalLayout (overlay + container + close + animations)
│   └── EmptyState (illustration + message + action)
│
└── 📄 Pages
    ├── Overview (hero metrics + map preview + recent activity)
    ├── MapView (full-screen map + layer controls + hotspot list)
    ├── Hotspots (grid + filters + detail drawer + actions)
    ├── Deployment (optimized vs reactive + comparison + adjust)
    ├── Intelligence (lifecycle + criticality + opportunity gap)
    ├── Timeline (forecast horizons + historical + predictions)
    ├── Missions (mission cards + assignment + tracking)
    ├── Evidence (backtest + ROI + model + features + artifacts)
    └── Settings (theme + preferences + data sources)
```

### 3.2 Key Component Specifications

#### GlassCard Component
```tsx
interface GlassCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'glow' | 'critical' | 'success';
  padding?: 'sm' | 'md' | 'lg' | 'none';
  radius?: 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  animate?: 'fadeIn' | 'scaleIn' | 'slideIn' | 'none';
  delay?: number; // stagger delay in ms
  className?: string;
}

// CSS Implementation
.glass-card {
  background: var(--bg-card);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--border-subtle);
  border-radius: var(--card-radius);
  box-shadow: var(--shadow-md), var(--shadow-inner);
  transition: transform var(--duration-fast) var(--ease-out-quart),
              box-shadow var(--duration-fast) var(--ease-out-quart),
              border-color var(--duration-fast) var(--ease-out-quart);
}

.glass-card:hover {
  transform: translateY(-2px) scale(1.005);
  box-shadow: var(--shadow-lg), var(--shadow-glow-blue);
  border-color: var(--border-glow);
}

.glass-card--critical {
  border-color: rgba(255, 77, 77, 0.3);
  background: linear-gradient(180deg, rgba(255, 77, 77, 0.08) 0%, rgba(18, 18, 26, 0.6) 100%);
}

.glass-card--critical:hover {
  box-shadow: var(--shadow-lg), var(--shadow-glow-red);
  border-color: rgba(255, 77, 77, 0.5);
}
```

#### MetricCard Component
```tsx
interface MetricCardProps {
  label: string;
  value: string | number;
  previousValue?: string | number;
  delta?: number; // percentage change
  sparklineData?: number[]; // last 7-12 points
  format?: 'number' | 'percentage' | 'currency' | 'time';
  status?: 'neutral' | 'positive' | 'negative' | 'warning';
  icon?: LucideIcon;
  size?: 'sm' | 'md' | 'lg' | 'hero';
}

// Layout: Icon (top-right) | Label (top-left) | Value (center, large) | Sparkline (bottom) | Delta (bottom-right)
// Animation: Count-up on value change, sparkline draws on mount
```

#### CommandPalette Component
```tsx
interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: CommandItem) => void;
  commands: CommandItem[];
  recentCommands?: CommandItem[];
}

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  shortcut?: string;
  section: 'Navigation' | 'Actions' | 'Hotspots' | 'Stations' | 'Recent';
  action: () => void;
  keywords: string[]; // for fuzzy search
}

// Visual: Centered modal, 640px max-width, glass background, spotlight border
// Animation: Backdrop fades in (200ms), container scales from 0.95 (300ms, spring)
// Search: Debounced 150ms, fuzzy matching with highlight
// Navigation: Arrow keys + Enter, Escape to close, Cmd+K to open
```

#### MapCanvas Component
```tsx
interface MapCanvasProps {
  data: MapRow[];
  viewState: ViewState;
  onViewStateChange: (vs: ViewState) => void;
  selectedH3?: string;
  onSelectH3: (h3: string) => void;
  layerConfig: {
    showHexagons: boolean;
    showOfficers: boolean;
    showHeatmap: boolean;
    colorBy: 'cii' | 'deployment_score' | 'officers_assigned' | 'expected_relief';
  };
  bbox?: BoundingBox;
}

// Deck.gl Layers:
// 1. H3HexagonLayer — extruded, color-coded by metric, pickable
// 2. ScatterplotLayer — officer locations (blue dots with pulse)
// 3. TextLayer — hotspot labels at high zoom
// 4. HeatmapLayer — CII density (optional)
// 5. PathLayer — connecting officers to hotspots (animated dashed lines)

// Controls: Zoom, pitch, bearing, layer toggles, color legend, fullscreen
// Interactions: Hover tooltip (GlassTooltip), Click -> flyTo + open detail drawer
// Transitions: Fly-to animation 800ms ease-out-expo
```

#### HotspotCard (Bento Style)
```tsx
interface HotspotCardProps {
  h3: string;
  label: string;
  station: string;
  location: string;
  junction?: string;
  deploymentScore: number;
  predCii: number;
  officersAssigned: number;
  expectedRelief: number;
  forecastCii: number;
  currentCii: number;
  lifecycle: 'active' | 'spreading' | 'chronic' | 'dormant' | 'resolved';
  criticality: number; // minutes to critical
  supportScore: number;
  dataQualityScore: number;
  onClick: () => void;
  onOptimize: () => void;
}

// Layout (Bento internal grid):
// ┌─────────────────┬────────┐
// │ Location Name   │ Score  │
// │ Station · Junction      │
// ├────────┬────────┼────────┤
// │ CII Now│ CII +3h│ Officers│
// │  12.4  │  18.2  │   3     │
// ├────────┴────────┴────────┤
// │ [Lifecycle Badge] [Relief] │
// └────────────────────────────┘

// Lifecycle colors:
// active: signal-red with pulse animation
// spreading: signal-amber with slow pulse
// chronic: signal-purple static
// dormant: obsidian-400 muted
// resolved: signal-green with checkmark
```

---

## 4. State Management & Data Flow

### 4.1 Global Store (Zustand)

```typescript
// store/index.ts
interface AppState {
  // === UI STATE ===
  sidebarCollapsed: boolean;
  theme: 'dark' | 'system';
  commandPaletteOpen: boolean;
  activePage: PageRoute;

  // === DATA STATE ===
  artifacts: Artifacts | null;
  artifactStatus: ArtifactStatus[] | null;
  overview: OverviewPayload | null;
  mapData: MapRow[] | null;
  hotspots: HotspotRow[] | null;
  selectedHotspot: string | null;
  deployment: DeploymentPayload | null;
  evidence: EvidencePayload | null;
  intelligence: IntelligencePayload | null;
  timeline: TimelinePayload | null;
  missions: MissionPayload | null;
  featureImportance: FeatureImportancePayload | null;

  // === FILTER STATE ===
  filters: {
    station: string | null;
    minSupport: number;
    query: string | null;
    timeRange: '1h' | '3h' | '6h' | '12h' | '24h';
  };

  // === MAP STATE ===
  mapViewState: {
    longitude: number;
    latitude: number;
    zoom: number;
    pitch: number;
    bearing: number;
  };
  mapLayerConfig: MapLayerConfig;

  // === OPTIMIZATION STATE ===
  officerBudget: number;
  isOptimizing: boolean;
  optimizationPreview: DeploymentPlan | null;

  // === ACTIONS ===
  toggleSidebar: () => void;
  setPage: (page: PageRoute) => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  setFilter: (key: string, value: any) => void;
  selectHotspot: (h3: string | null) => void;
  setOfficerBudget: (budget: number) => void;
  runOptimization: () => Promise<void>;
  refreshData: () => Promise<void>;
  setMapViewState: (vs: Partial<ViewState>) => void;
  setMapLayerConfig: (config: Partial<MapLayerConfig>) => void;
}

// Middleware: persist (localStorage), devtools, immer
```

### 4.2 API Client Layer

```typescript
// lib/api.ts
class ClearLaneAPI {
  baseURL: string = '/api';

  // Health & Config
  async getHealth(): Promise<HealthResponse>;
  async getConfig(): Promise<ConfigResponse>;

  // Overview
  async getOverview(): Promise<OverviewPayload>;

  // Map
  async getMapData(params: MapParams): Promise<MapResponse>;

  // Hotspots
  async getHotspots(params: HotspotParams): Promise<HotspotResponse>;
  async getHotspotDetail(h3: string): Promise<HotspotDetail>;

  // Deployment
  async getDeployment(): Promise<DeploymentPayload>;
  async optimizeDeployment(budget: number): Promise<OptimizeResponse>;

  // Evidence
  async getEvidence(): Promise<EvidencePayload>;
  async getArtifacts(): Promise<ArtifactResponse>;
  async getFeatureImportance(): Promise<FeatureImportanceResponse>;

  // Intelligence & Timeline
  async getIntelligence(params: IntelligenceParams): Promise<IntelligencePayload>;
  async getTimeline(params: TimelineParams): Promise<TimelinePayload>;
  async getMissions(params: MissionParams): Promise<MissionPayload>;
}

// React Query Integration:
// - useOverview() -> useQuery(['overview'], api.getOverview)
// - useMapData(filters) -> useQuery(['map', filters], () => api.getMapData(filters))
// - useOptimize() -> useMutation(api.optimizeDeployment, { onSuccess: invalidateQueries })
// - Stale time: 30s for real-time data, 5m for static data
// - Refetch interval: 60s for active deployments
```

### 4.3 Real-time Updates

```typescript
// hooks/useRealtime.ts
// Polling strategy with exponential backoff for /api/health
// When health.status === 'ready', trigger full refresh
// When new optimization completes, show toast + auto-refresh

// hooks/useKeyboardShortcuts.ts
// Cmd+K: Command Palette
// Cmd+1-9: Navigate pages
// Cmd+B: Toggle sidebar
// Cmd+F: Focus search
// Esc: Close modals/drawers
// Shift+?: Show shortcuts help
```

---

## 5. Page Specifications

### 5.1 Overview Page — "Command Center"

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Header (64px) │ Search │ Time │ User │ Status │           │
├───────────────┴───────────────────────────────────────────┤
│ Sidebar │ Main Canvas (fluid, full-width)                  │
│ (256px) │                                                │
│         │ ┌──────────────────────────────────────────┐   │
│  Nav    │ │ HERO METRICS (4-column bento)            │   │
│  Icons  │ │ ┌────────┐┌────────┐┌────────┐┌────────┐│   │
│  +      │ │ │Officers││ Active ││ Relief ││ Forecast││   │
│  Labels │ │ │  142   ││  28    ││ 847.2  ││ 1,240  ││   │
│         │ │ │  +12%  ││  +3    ││  +15%  ││  -8%   ││   │
│         │ │ └────────┘└────────┘└────────┘└────────┘│   │
│         │ └──────────────────────────────────────────┘   │
│         │                                                │
│         │ ┌────────────────────┐ ┌───────────────────┐ │
│         │ │ MINI MAP (60%)      │ │ TOP HOTSPOTS (40%)│ │
│         │ │                    │ │ ┌───────────────┐   │ │
│         │ │  [Deck.gl          │ │ │ Hotspot 1     │   │ │
│         │ │   preview with     │ │ │ Hotspot 2     │   │ │
│         │ │   hexagon layer]   │ │ │ Hotspot 3     │   │ │
│         │ │                    │ │ │ ...           │   │ │
│         │ │  [Expand →]        │ │ └───────────────┘   │ │
│         │ └────────────────────┘ └───────────────────┘ │
│         │                                                │
│         │ ┌──────────────────────────────────────────┐   │
│         │ │ DEPLOYMENT EFFICIENCY (sparkline + ROI)  │   │
│         │ └──────────────────────────────────────────┘   │
│         │                                                │
│         │ ┌────────────────────┐ ┌───────────────────┐   │
│         │ │ MODEL EVIDENCE     │ │ ARTIFACT STATUS   │   │
│         │ │ (Backtest metrics) │ │ (Health indicators)│   │
│         │ └────────────────────┘ └───────────────────┘   │
│         │                                                │
└─────────┴────────────────────────────────────────────────┘
```

**Interactions:**
- Hero metrics: Count-up animation on load, sparkline draws left-to-right (600ms)
- Mini Map: Click "Expand →" transitions to full MapView with shared element transition (FLIP)
- Top Hotspots: Cards stack with 80ms stagger, hover reveals quick-actions (optimize, detail)
- ROI Card: Circular progress gauge with gradient stroke, animates from 0 to value
- Artifact Status: Pulse dot for each artifact, green = ready, amber = stale, red = missing

---

### 5.2 Map View — "Infinite Canvas"

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Header (64px) [Compact — back button + breadcrumbs]         │
├─────────────────────────────────────────────────────────────┤
│ Sidebar │ Full-Viewport Map (Deck.gl)                       │
│ (72px   │                                                     │
│ collapsed│ ┌──────────────────────────────────────────────┐   │
│ icons)  │ │                                              │   │
│         │ │           [H3 Hexagon Layer]                 │   │
│         │ │                                              │   │
│         │ │    🔴 High CII      🟡 Medium      🟢 Low   │   │
│         │ │                                              │   │
│         │ │    [Officer dots with pulse rings]         │   │
│         │ │                                              │   │
│         │ └──────────────────────────────────────────────┘   │
│         │                                                     │
│         │ ┌──────────────┐ ┌──────────────┐ ┌─────────────┐  │
│         │ │ Layer Controls│ │ Color Legend │ │ Stats Panel │  │
│         │ │ (Glass)       │ │ (Glass)      │ │ (Glass)     │  │
│         │ └──────────────┘ └──────────────┘ └─────────────┘  │
│         │                                                     │
│         │ ┌──────────────────────────────────────────────┐   │
│         │ │ Hotspot Drawer (slides from right)          │   │
│         │ │ ┌────────────────────────────────────────┐   │   │
│         │ │ │ [H3] Location Name                     │   │   │
│         │ │ │ Station · Junction                      │   │   │
│         │ │ │ ┌────────┐┌────────┐┌────────┐┌──────┐│   │   │
│         │ │ │ │ CII    ││ Forecast││ Officers││ Relief││   │   │
│         │ │ │ │ 14.2   ││  22.5   ││   4     ││ 8.3   ││   │   │
│         │ │ │ └────────┘└────────┘└────────┘└──────┘│   │   │
│         │ │ │ [Signals] [Lifecycle] [Timeline]       │   │   │
│         │ │ │ [Optimize Officers] [View Mission]       │   │   │
│         │ │ └────────────────────────────────────────┘   │   │
│         │ └──────────────────────────────────────────────┘   │
└─────────┴─────────────────────────────────────────────────────┘
```

**Interactions:**
- Map: Drag to pan, scroll to zoom, right-click to rotate pitch/bearing
- Hexagon hover: Tooltip with GlassCard showing location + current CII + forecast
- Hexagon click: Fly-to animation (800ms), slide out detail drawer
- Layer controls: Toggle switches with spring animation, instant layer visibility change
- Color legend: Gradient bar with draggable threshold handles (for custom filtering)
- Stats panel: Floating glass card showing viewport statistics (visible cells, avg CII, officer count)
- Hotspot Drawer: Swipe to dismiss (mobile), 400ms slide animation with backdrop blur
- Officer dots: Pulse ring animation (CSS `animation: pulse 2s infinite`)

---

### 5.3 Hotspots Page — "Bento Grid"

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Header + Filters (Station dropdown, Support slider, Search)   │
├─────────────────────────────────────────────────────────────┤
│ Sidebar │ Bento Grid (CSS Grid: repeat(auto-fill, minmax(320px, 1fr))│
│         │                                                     │
│         │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │
│         │ │ HotspotCard │ │ HotspotCard │ │ HotspotCard │    │
│         │ │ (Large)     │ │ (Medium)    │ │ (Medium)    │    │
│         │ └─────────────┘ └─────────────┘ └─────────────┘    │
│         │ ┌─────────────┐ ┌─────────────────────────────┐    │
│         │ │ HotspotCard │ │ HotspotCard (Wide)          │    │
│         │ │ (Small)     │ │ Critical — Spreading        │    │
│         │ └─────────────┘ └─────────────────────────────┘    │
│         │                                                     │
│         │ [Load More] / [Virtual Scroll]                      │
│         │                                                     │
└─────────┴─────────────────────────────────────────────────────┘
```

**Interactions:**
- Filter changes: Grid re-layouts with `layoutId` shared element transitions (Framer Motion)
- Card hover: `scale(1.02)`, shadow lift, border glow based on lifecycle color
- Card click: Expand to full detail modal (scale from card position to center — FLIP animation)
- Quick actions (hover reveal): "Assign Officers" (pill button), "View on Map" (icon button)
- Sort: Drag header pills to reorder (deployment score, CII, relief, etc.)
- Virtual scroll: React-window for 250+ items, smooth 60fps
- Search: Real-time filter with 150ms debounce, highlight matching text

---

### 5.4 Deployment Page — "Split Comparison"

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Header + Officer Budget Slider (100 → 500, step 10)           │
│ [Optimize] button with gradient glow                          │
├─────────────────────────────────────────────────────────────┤
│ Sidebar │ ┌────────────────────┐ ┌────────────────────┐     │
│         │ │ OPTIMIZED (AI)     │ │ REACTIVE (Baseline)│     │
│         │ │ ┌────────────────┐ │ │ ┌────────────────┐ │     │
│         │ │ │ Total Relief   │ │ │ │ Total Relief   │ │     │
│         │ │ │ 847.2  (+23%)  │ │ │ │ 687.1          │ │     │
│         │ │ └────────────────┘ │ │ └────────────────┘ │     │
│         │ │ ┌────────────────┐ │ │ ┌────────────────┐ │     │
│         │ │ │ Officers: 142  │ │ │ │ Officers: 142  │ │     │
│         │ │ │ Active Cells: 28│ │ │ │ Active Cells: 35│     │
│         │ │ └────────────────┘ │ │ └────────────────┘ │     │
│         │ │                    │ │                    │     │
│         │ │ [Table/List]       │ │ [Table/List]       │     │
│         │ │ Sorted by relief   │ │ Sorted by violation│     │
│         │ └────────────────────┘ └────────────────────┘     │
│         │                                                     │
│         │ ┌─────────────────────────────────────────────────┐ │
│         │ │ LIFT ANALYSIS (Difference visualization)        │ │
│         │ │ Bar chart: Optimized vs Reactive per cell       │ │
│         │ └─────────────────────────────────────────────────┘ │
└─────────┴─────────────────────────────────────────────────────┘
```

**Interactions:**
- Budget slider: Real-time preview of expected relief (debounced 300ms)
- Optimize button: Loading state with shimmer gradient, then success toast + confetti
- Comparison tables: Synced scroll (scroll one, other follows) — use `scrollTop` sync
- Lift bars: Gradient from red (reactive better) to green (optimized better), hover shows exact delta
- Cell click: Cross-highlight in both tables (same row highlighted in opposite table)
- Export: CSV download with glass dropdown menu

---

### 5.5 Intelligence Page — "Signal Dashboard"

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Header + Summary Chips (Total: 142 | Critical: 28 | Gap: 1,240)│
├─────────────────────────────────────────────────────────────┤
│ Sidebar │ Signal Grid                                        │
│         │                                                     │
│         │ ┌──────────────────────────────────────────────┐   │
│         │ │ [Capacity Theft] [Lifecycle] [Criticality]   │   │
│         │ │ [Fingerprint] [Opportunity Gap]              │   │
│         │ └──────────────────────────────────────────────┘   │
│         │                                                     │
│         │ ┌──────────────────────────────────────────────┐   │
│         │ │ Intelligence Cards (per hotspot)             │   │
│         │ │ ┌──────────────────────────────────────────┐ │   │
│         │ │ │ Location        │ Lifecycle Badge        │ │   │
│         │ │ │ ┌─────────────┐│ ┌─────────────┐        │ │   │
│         │ │ │ │ Capacity    ││ │ Time to     │        │ │   │
│         │ │ │ │ Theft: 0.35 ││ │ Critical:   │        │ │   │
│         │ │ │ │             ││ │ 45 min      │        │ │   │
│         │ │ │ └─────────────┘│ └─────────────┘        │ │   │
│         │ │ │ [Opportunity Gap: 12.4] [Fingerprint]    │ │   │
│         │ │ └──────────────────────────────────────────┘ │   │
│         │ └──────────────────────────────────────────────┘   │
└─────────┴─────────────────────────────────────────────────────┘
```

**Interactions:**
- Lifecycle badges: Animated pulse for active/spreading, static for chronic/dormant
- Capacity theft: Circular gauge with color gradient (0=green, 1=red)
- Criticality: Countdown timer that decrements every minute (real-time feel)
- Fingerprint: Mini radar chart (5 axes) showing hotspot characteristics
- Opportunity gap: Horizontal bar with target line, animated fill
- Filter by lifecycle: Pill toggle buttons with active state glow

---

### 5.6 Timeline Page — "Forecast Horizon"

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Header + Horizon Selector (Now | +60m | +3h | Pattern)       │
├─────────────────────────────────────────────────────────────┤
│ Sidebar │ Timeline Visualization                             │
│         │                                                     │
│         │ ┌──────────────────────────────────────────────┐   │
│         │ │ [Recharts AreaChart with gradient fill]      │   │
│         │ │ X: Time (now → +3h)                          │   │
│         │ │ Y: CII                                       │   │
│         │ │ Lines: Current (solid) | Forecast (dashed)   │   │
│         │ │ Brush: Select time range                     │   │
│         │ └──────────────────────────────────────────────┘   │
│         │                                                     │
│         │ ┌──────────────────────────────────────────────┐   │
│         │ │ Hotspot Timeline Cards                       │   │
│         │ │ ┌──────────────────────────────────────────┐ │   │
│         │ │ │ Location │ Now │ +1h │ +2h │ +3h │ Pattern│ │   │
│         │ │ │ MG Road  │ 12.4│ 15.2│ 18.1│ 22.5│  ▓▓▓ │ │   │
│         │ │ │ Jayanagar│ 8.1 │ 9.3 │ 11.2│ 14.8│  ▓▓░ │ │   │
│         │ │ └──────────────────────────────────────────┘ │   │
│         │ └──────────────────────────────────────────────┘   │
└─────────┴─────────────────────────────────────────────────────┘
```

**Interactions:**
- Horizon selector: Tab switch with sliding indicator (Framer Motion `layoutId`)
- Area chart: Gradient fill under forecast line, confidence band (lighter shade)
- Brush: Drag to zoom, double-click to reset
- Timeline cards: Sparkline mini-chart per row, hover shows exact values tooltip
- Pattern view: Heatmap grid (hours × days) showing historical patterns
- Annotations: Click on chart to add annotation (for incident marking)

---

### 5.7 Missions Page — "Mission Control"

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Header + Mission Stats (Active: 12 | Completed: 45 | Avg: 8.2m)│
├─────────────────────────────────────────────────────────────┤
│ Sidebar │ Mission Cards (Kanban-style columns)               │
│         │                                                     │
│         │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │
│         │ │ PENDING     │ │ ACTIVE      │ │ COMPLETED   │    │
│         │ │ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │    │
│         │ │ │Mission 1│ │ │ │Mission 2│ │ │ │Mission 3│ │    │
│         │ │ │ [Drag]  │ │ │ │ [Timer] │ │ │ │ [Check] │ │    │
│         │ │ └─────────┘ │ │ └─────────┘ │ │ └─────────┘ │    │
│         │ └─────────────┘ └─────────────┘ └─────────────┘    │
│         │                                                     │
│         │ [Create Mission] button (bottom-right FAB)          │
└─────────┴─────────────────────────────────────────────────────┘
```

**Interactions:**
- Kanban drag-and-drop: React-beautiful-dnd or @dnd-kit
- Mission cards: Flip animation on status change
- Timer: Real-time countdown for active missions
- FAB: Hover expands to show "Quick Assign" and "Auto-Schedule"
- Mission detail: Click to open modal with full briefing, map snippet, officer list

---

### 5.8 Evidence Page — "Model Transparency"

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Header + Model Metadata (Target: target_next_3h_cii | Ranker: Enabled)│
├─────────────────────────────────────────────────────────────┤
│ Sidebar │ Evidence Panels                                    │
│         │                                                     │
│         │ ┌──────────────────────────────────────────────┐   │
│         │ │ BACKTEST METRICS (Glass Cards)               │   │
│         │ │ ┌────────┐┌────────┐┌────────┐┌────────┐   │   │
│         │ │ │Recall  ││ NDCG   ││ RMSE   ││ MAE    │   │   │
│         │ │ │ 0.82   ││ 0.74   ││ 2.14   ││ 1.68   │   │   │
│         │ │ └────────┘└────────┘└────────┘└────────┘   │   │
│         │ └──────────────────────────────────────────────┘   │
│         │                                                     │
│         │ ┌────────────────────┐ ┌────────────────────┐     │
│         │ │ ROI METRICS        │ │ ARTIFACT STATUS      │     │
│         │ │ Lift: 23%          │ │ [9/9 Ready]          │     │
│         │ │ Optimized: 847.2   │ │ [Green dots]         │     │
│         │ │ Reactive: 687.1    │ │ [Last updated: 2m]   │     │
│         │ └────────────────────┘ └────────────────────┘     │
│         │                                                     │
│         │ ┌──────────────────────────────────────────────┐   │
│         │ │ FEATURE IMPORTANCE (Horizontal Bar Chart)    │   │
│         │ │ Regression + Ranker side-by-side               │   │
│         │ │ Gradient bars, top 10 features               │   │
│         │ └──────────────────────────────────────────────┘   │
│         │                                                     │
│         │ ┌──────────────────────────────────────────────┐   │
│         │ │ MODEL METADATA (JSON Tree, collapsible)      │   │
│         │ │ Features list, hyperparameters, timestamps   │   │
│         │ └──────────────────────────────────────────────┘   │
└─────────┴─────────────────────────────────────────────────────┘
```

**Interactions:**
- Metric cards: Hover reveals tooltip with definition and formula
- Feature importance bars: Hover shows exact importance value + description
- Toggle: Switch between regression and ranker views (animated bar reordering)
- Artifact status: Click to refresh individual artifact, loading spinner during refresh
- JSON tree: Syntax highlighting with obsidian theme, collapsible nodes

---

## 6. Animation & Interaction Specifications

### 6.1 Page Transitions

```typescript
// Using Framer Motion AnimatePresence + layoutId
const pageVariants = {
  initial: { opacity: 0, y: 8, scale: 0.995 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.995 }
};

const pageTransition = {
  duration: 0.35,
  ease: [0.16, 1, 0.3, 1] // Expo Out
};

// Implementation: Wrap each page in motion.div with variants
// Stagger children: Each section delays by 0.05s
```

### 6.2 Card Entrance Animations

```typescript
const cardContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 }
  }
};

const cardItem = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: { 
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
  }
};

// Usage: Card grids animate in with staggered cascade
```

### 6.3 Hover Microinteractions

```css
/* Card hover lift */
.card-hover {
  transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              box-shadow 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.card-hover:hover {
  transform: translateY(-3px) scale(1.01);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(59, 130, 246, 0.2);
}

/* Button press */
.btn-press:active {
  transform: scale(0.97);
  transition: transform 0.08s ease-out;
}

/* Sidebar item hover */
.nav-item {
  transition: background 0.15s, color 0.15s, padding-left 0.2s;
}
.nav-item:hover {
  background: rgba(59, 130, 246, 0.08);
  padding-left: 4px; /* subtle indent */
}

/* Glow border on focus */
.focus-glow:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5), 0 0 0 4px rgba(59, 130, 246, 0.1);
}
```

### 6.4 Loading States

```typescript
// Skeleton shimmer
const shimmer = `
  background: linear-gradient(90deg, 
    var(--obsidian-800) 25%, 
    var(--obsidian-700) 50%, 
    var(--obsidian-800) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
`;

// Spinner (for buttons)
// SVG circle with stroke-dasharray animation, 24px, signal-blue

// Progress bar (for optimization)
// Gradient fill with glow, percentage text overlay, smooth width transition
```

### 6.5 Toast Notifications

```typescript
interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

// Visual: Glass card, left border accent (4px), icon, title, description, close button
// Animation: Slide in from right (300ms, spring), auto-dismiss with progress bar
// Position: Bottom-right, stacked with 8px gap, max 5 visible
```

---

## 7. Accessibility & UX Standards

### 7.1 WCAG 2.1 AA Compliance

```
✓ Color Contrast: All text meets 4.5:1 ratio (obsidian-100 on obsidian-900 = 15.8:1)
✓ Focus Indicators: 2px solid signal-blue outline with 2px offset on all interactive elements
✓ Keyboard Navigation: Full tab order, arrow keys for lists, Enter/Space for activation
✓ Screen Reader: ARIA labels on all icons, live regions for status updates, skip links
✓ Reduced Motion: @media (prefers-reduced-motion) disables animations, instant transitions
✓ Color Independence: Never rely on color alone — icons + text labels for all status indicators
✓ Text Scaling: All layouts fluid up to 200% zoom without horizontal scroll
✓ Touch Targets: Minimum 44×44px for all buttons on mobile
```

### 7.2 Responsive Breakpoints

```css
/* Mobile First */
--bp-sm: 640px;   /* Large phones */
--bp-md: 768px;   /* Tablets */
--bp-lg: 1024px;  /* Small laptops */
--bp-xl: 1280px;  /* Desktops */
--bp-2xl: 1536px; /* Large monitors */

/* Layout shifts:
   < 768px: Sidebar becomes bottom nav, cards stack 1-col, map fullscreen modal
   768-1024px: Sidebar collapses to icons, cards 2-col, split panes stack
   1024-1280px: Sidebar full, cards 3-col, split panes side-by-side
   > 1280px: Sidebar full, cards 4-col, generous padding, bento asymmetry
*/
```

### 7.3 Dark Mode (Default)

```css
/* The entire app is dark-first. No light mode planned (police ops are 24/7). */
/* But respect system preference for subtle adjustments: */
@media (prefers-color-scheme: light) {
  /* Only for marketing landing page — not dashboard */
}
```

---

## 8. File Structure & Connections

### 8.1 Project Structure

```
clearlane-frontend/
├── public/
│   ├── fonts/
│   │   ├── Inter-Variable.woff2
│   │   ├── SpaceGrotesk-Variable.woff2
│   │   └── JetBrainsMono-Variable.woff2
│   ├── icons/
│   │   └── favicon.svg
│   └── manifest.json
│
├── src/
│   ├── main.tsx                    # Entry point, React 18 createRoot
│   ├── App.tsx                     # Router, providers, global layout
│   ├── index.css                   # Tailwind directives, CSS variables, keyframes
│   │
│   ├── api/                        # Backend connection layer
│   │   ├── client.ts               # Axios/fetch instance with interceptors
│   │   ├── endpoints.ts            # All API endpoint definitions
│   │   ├── types.ts                # DTOs matching backend schemas
│   │   └── hooks.ts                # React Query hooks (useOverview, useMapData, etc.)
│   │
│   ├── store/                      # Zustand global state
│   │   ├── index.ts                # Main store with slices
│   │   ├── slices/
│   │   │   ├── uiSlice.ts          # Sidebar, theme, command palette, page
│   │   │   ├── dataSlice.ts        # API data cache
│   │   │   ├── filterSlice.ts      # Global filters
│   │   │   ├── mapSlice.ts         # Map viewState + layerConfig
│   │   │   └── optimizeSlice.ts    # Officer budget + optimization state
│   │   └── middleware/
│   │       ├── persist.ts          # localStorage sync
│   │       └── logger.ts           # Dev-only action logger
│   │
│   ├── components/                 # Atomic design structure
│   │   ├── atoms/
│   │   │   ├── Button.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Toggle.tsx
│   │   │   ├── Tooltip.tsx
│   │   │   ├── Icon.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Divider.tsx
│   │   │   └── Progress.tsx
│   │   │
│   │   ├── molecules/
│   │   │   ├── MetricCard.tsx
│   │   │   ├── HotspotCard.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── FilterChip.tsx
│   │   │   ├── StatusDot.tsx
│   │   │   ├── TimelineItem.tsx
│   │   │   ├── FeatureBar.tsx
│   │   │   └── MissionCard.tsx
│   │   │
│   │   ├── organisms/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── CommandPalette.tsx
│   │   │   ├── MapCanvas.tsx
│   │   │   ├── HotspotGrid.tsx
│   │   │   ├── DeploymentTable.tsx
│   │   │   ├── TimelineChart.tsx
│   │   │   ├── IntelligencePanel.tsx
│   │   │   ├── EvidencePanel.tsx
│   │   │   └── OptimizeModal.tsx
│   │   │
│   │   ├── templates/
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── SplitPaneLayout.tsx
│   │   │   ├── ModalLayout.tsx
│   │   │   └── EmptyState.tsx
│   │   │
│   │   └── pages/
│   │       ├── OverviewPage.tsx
│   │       ├── MapPage.tsx
│   │       ├── HotspotsPage.tsx
│   │       ├── DeploymentPage.tsx
│   │       ├── IntelligencePage.tsx
│   │       ├── TimelinePage.tsx
│   │       ├── MissionsPage.tsx
│   │       ├── EvidencePage.tsx
│   │       └── SettingsPage.tsx
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── useRealtime.ts          # Polling + refresh logic
│   │   ├── useKeyboardShortcuts.ts # Global shortcut handler
│   │   ├── useMapInteractions.ts   # Deck.gl event handlers
│   │   ├── useDebounce.ts          # Input debouncing
│   │   ├── useMediaQuery.ts        # Responsive breakpoints
│   │   ├── useToast.ts             # Toast notification system
│   │   └── useAnimation.ts         # Framer Motion helpers
│   │
│   ├── lib/                        # Utilities
│   │   ├── utils.ts                # cn() helper (clsx + tailwind-merge)
│   │   ├── formatters.ts           # Number, percentage, date formatters
│   │   ├── colors.ts               # Color interpolation for maps/charts
│   │   ├── constants.ts            # App constants (routes, limits, etc.)
│   │   └── animations.ts           # Shared animation variants
│   │
│   ├── types/                      # TypeScript types
│   │   ├── index.ts                # Re-exports
│   │   ├── api.ts                  # API response types
│   │   ├── map.ts                  # Map/deck.gl types
│   │   └── ui.ts                   # Component prop types
│   │
│   └── styles/                     # Additional styles
│       └── glassmorphism.css       # Glass card utilities beyond Tailwind
│
├── index.html
├── vite.config.ts                  # Vite + React + TS + SWC
├── tailwind.config.ts              # Custom theme extending colors/spacing
├── tsconfig.json
├── tsconfig.app.json
├── package.json
└── README.md                       # This file
```

### 8.2 Backend ↔ Frontend Connection Map

```
┌─────────────────┐         ┌─────────────────────────────────────────┐
│   FastAPI       │         │           React Frontend                │
│   Backend       │         │                                         │
├─────────────────┤         ├─────────────────────────────────────────┤
│                 │         │                                         │
│ GET /api/health │◄──────►│ store.uiSlice → HealthIndicator         │
│                 │  30s    │ (Green/Red pulse dot in header)         │
│                 │  poll   │                                         │
├─────────────────┤         ├─────────────────────────────────────────┤
│                 │         │                                         │
│ GET /api/config │◄──────►│ store.uiSlice → MapProviderConfig       │
│                 │  init   │ (Mappls SDK URLs or Carto fallback)     │
│                 │         │                                         │
├─────────────────┤         ├─────────────────────────────────────────┤
│                 │         │                                         │
│ GET /api/       │◄──────►│ OverviewPage → MetricCard × 4           │
│ overview        │  60s    │           → MiniMapCanvas               │
│                 │  poll   │           → HotspotList                 │
│                 │         │           → ROICard                     │
│                 │         │           → ArtifactStatusGrid          │
├─────────────────┤         ├─────────────────────────────────────────┤
│                 │         │                                         │
│ GET /api/map    │◄──────►│ MapPage → MapCanvas (Deck.gl)           │
│ ?station=       │  query  │         → LayerControlPanel             │
│ &min_support=   │         │         → Legend                        │
│ &query=         │         │         → StatsPanel                    │
│ &limit=         │         │         → HotspotDetailDrawer           │
├─────────────────┤         ├─────────────────────────────────────────┤
│                 │         │                                         │
│ GET /api/       │◄──────►│ HotspotsPage → HotspotGrid (Bento)      │
│ hotspots        │  query  │            → FilterBar                  │
│ ?station=       │         │            → SearchSuggestions          │
│ &min_support=   │         │                                         │
│ &query=         │         │                                         │
│ &limit=         │         │                                         │
├─────────────────┤         ├─────────────────────────────────────────┤
│                 │         │                                         │
│ GET /api/       │◄──────►│ HotspotDetail (Modal/Drawer)            │
│ hotspots/{h3}   │  click  │ → Scorecards                            │
│                 │         │ → SignalsList                           │
│                 │         │ → RawDataCollapsible                    │
├─────────────────┤         ├─────────────────────────────────────────┤
│                 │         │                                         │
│ GET /api/       │◄──────►│ DeploymentPage → SplitComparison        │
│ deployment      │  60s    │              → OptimizedTable           │
│                 │  poll   │              → ReactiveTable            │
│                 │         │              → LiftAnalysisChart        │
├─────────────────┤         ├─────────────────────────────────────────┤
│                 │         │                                         │
│ POST /api/      │◄──────►│ OptimizeModal → BudgetSlider            │
│ optimize        │  action │             → PreviewMetrics            │
│ {officer_budget}│         │             → ConfirmButton             │
│                 │         │ → Triggers:                             │
│                 │         │   1. Loading toast (shimmer)            │
│                 │         │   2. Success toast + confetti           │
│                 │         │   3. Invalidate all queries             │
│                 │         │   4. Auto-refresh deployment data       │
├─────────────────┤         ├─────────────────────────────────────────┤
│                 │         │                                         │
│ GET /api/       │◄──────►│ EvidencePage → BacktestMetricsGrid      │
│ evidence        │  5m     │            → ROIMetricsCard             │
│                 │  poll   │            → ModelMetadataTree          │
│                 │         │            → FeatureImportanceChart     │
├─────────────────┤         ├─────────────────────────────────────────┤
│                 │         │                                         │
│ GET /api/       │◄──────►│ EvidencePage → ArtifactStatusTable      │
│ artifacts       │  30s    │ (File existence, size, path)            │
│                 │         │                                         │
├─────────────────┤         ├─────────────────────────────────────────┤
│                 │         │                                         │
│ GET /api/       │◄──────►│ EvidencePage → FeatureImportanceBars    │
│ feature_import  │         │ (Regression + Ranker toggle)            │
│ ance            │         │                                         │
├─────────────────┤         ├─────────────────────────────────────────┤
│                 │         │                                         │
│ GET /api/       │◄──────►│ IntelligencePage → SignalCards          │
│ intelligence    │  query  │                  → LifecycleGrid          │
│ ?station=       │         │                  → CriticalityTimers    │
│ &query=         │         │                  → OpportunityGapBars   │
│ &limit=         │         │                                         │
├─────────────────┤         ├─────────────────────────────────────────┤
│                 │         │                                         │
│ GET /api/       │◄──────►│ TimelinePage → AreaChart (Recharts)     │
│ timeline        │  query  │            → HorizonSelector            │
│ ?station=       │         │            → HotspotTimelineTable       │
│ &query=         │         │            → PatternHeatmap             │
│ &limit=         │         │                                         │
├─────────────────┤         ├─────────────────────────────────────────┤
│                 │         │                                         │
│ GET /api/       │◄──────►│ MissionsPage → KanbanBoard              │
│ missions        │  query  │            → MissionCards               │
│ ?station=       │         │            → MissionDetailModal         │
│ &query=         │         │            → CreateMissionFAB           │
│ &limit=         │         │                                         │
└─────────────────┘         └─────────────────────────────────────────┘
```

### 8.3 Data Flow Diagram

```
User Action
    │
    ▼
┌──────────────┐
│  UI Event    │ (click, hover, scroll, keypress)
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐
│  Zustand     │◄───►│  Local State │ (component-level ephemeral)
│  Store       │     │  (useState)    │
└──────┬───────┘     └──────────────┘
       │
       ▼
┌──────────────┐
│ React Query  │ (cache, dedup, background refetch)
│  Cache Layer │
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐
│  Axios/Fetch │◄───►│  API Client  │ (interceptors, auth, retry)
│  Request     │     │  (lib/api)   │
└──────┬───────┘     └──────────────┘
       │
       ▼
┌──────────────┐
│  FastAPI     │ (app.py endpoints)
│  Backend     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Python      │ (dashboard_service.py, app_utils.py)
│  Business    │
│  Logic       │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Parquet/JSON│ (data/processed/)
│  Data Files  │
└──────────────┘
       │
       ▼
┌──────────────┐
│  Response    │ (JSON payload)
│  (DTO)       │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  React Query │ (update cache, trigger re-render)
│  onSuccess   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Zustand     │ (update global state if needed)
│  Store       │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Framer      │ (animate layout changes)
│  Motion      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  DOM Update  │ (pixel-perfect render)
│  (React 18)  │
└──────────────┘
```

---

## 9. Technology Stack

### 9.1 Core Dependencies

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.23.0",
    "@tanstack/react-query": "^5.40.0",
    "zustand": "^4.5.0",
    "framer-motion": "^11.2.0",
    "lucide-react": "^0.378.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.3.0",
    "recharts": "^2.12.0",
    "deck.gl": "^9.0.0",
    "@deck.gl/react": "^9.0.0",
    "@deck.gl/geo-layers": "^9.0.0",
    "@deck.gl/core": "^9.0.0",
    "maplibre-gl": "^4.0.0",
    "react-map-gl": "^7.1.0",
    "cmdk": "^1.0.0",
    "sonner": "^1.4.0",
    "date-fns": "^3.6.0",
    "react-window": "^1.8.10",
    "react-virtuoso": "^4.7.0"
  },
  "devDependencies": {
    "vite": "^5.2.0",
    "@vitejs/plugin-react-swc": "^3.6.0",
    "typescript": "^5.4.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/react-window": "^1.8.8",
    "eslint": "^8.57.0",
    "prettier": "^3.2.0",
    "prettier-plugin-tailwindcss": "^0.5.0"
  }
}
```

### 9.2 Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#030305',
          900: '#0A0A0F',
          800: '#12121A',
          700: '#1A1A25',
          600: '#232330',
          500: '#2E2E3E',
          400: '#4A4A5E',
          300: '#8A8AA3',
          200: '#B8B8D1',
          100: '#F0F0F5',
        },
        signal: {
          red: '#FF4D4D',
          amber: '#FFB020',
          green: '#00D084',
          blue: '#3B82F6',
          purple: '#8B5CF6',
          cyan: '#06B6D4',
        },
      },
      fontFamily: {
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['11px', { lineHeight: '14px' }],
      },
      borderRadius: {
        '4xl': '28px',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.15)',
        'glow-red': '0 0 20px rgba(255, 77, 77, 0.15)',
        'glow-green': '0 0 20px rgba(0, 208, 132, 0.15)',
      },
      backdropBlur: {
        'glass': '20px',
      },
      transitionTimingFunction: {
        'expo-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px currentColor' },
          '50%': { boxShadow: '0 0 20px currentColor, 0 0 40px currentColor' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms')({ strategy: 'class' }),
  ],
} satisfies Config;
```

---

## 10. Implementation Roadmap

### Phase 1: Foundation
- [ ] Scaffold Vite + React + TypeScript project
- [ ] Configure Tailwind with custom theme (colors, fonts, shadows)
- [ ] Set up Zustand store with all slices
- [ ] Set up React Query with API client
- [ ] Create atomic components (Button, Badge, Input, Card, Tooltip)
- [ ] Implement CSS variables and glassmorphism utilities
- [ ] Set up font loading (Inter, Space Grotesk, JetBrains Mono)
- [ ] Create DashboardLayout (Sidebar + Header + Canvas)

### Phase 2: Core Pages 
- [ ] OverviewPage with hero metrics + mini map + hotspot list
- [ ] MapPage with Deck.gl integration + layer controls + detail drawer
- [ ] HotspotsPage with bento grid + filters + search
- [ ] DeploymentPage with split comparison + budget slider + optimize flow
- [ ] Connect all pages to backend endpoints
- [ ] Implement loading states and error boundaries

### Phase 3: Advanced Features 
- [ ] CommandPalette (Cmd+K) with fuzzy search
- [ ] IntelligencePage with signal cards + lifecycle visualization
- [ ] TimelinePage with Recharts + horizon selector
- [ ] MissionsPage with kanban board + drag-and-drop
- [ ] EvidencePage with feature importance + model metadata
- [ ] Real-time polling + auto-refresh logic
- [ ] Toast notification system

### Phase 4: Polish & Performance
- [ ] Page transitions (Framer Motion)
- [ ] Card entrance animations with stagger
- [ ] Hover microinteractions (lift, glow, scale)
- [ ] Map fly-to animations and transitions
- [ ] Virtual scrolling for large lists
- [ ] Keyboard shortcuts + accessibility audit
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Performance optimization (lazy loading, code splitting)
- [ ] Final visual polish (noise texture, gradient orbs, CRT subtle effects)

### Phase 5: Launch 
- [ ] End-to-end testing with real backend data
- [ ] Build and deploy to static hosting (or integrate with FastAPI static files)
- [ ] Documentation and handoff
- [ ] Feedback iteration

---

## 11. Quality Checklist

### Visual Design
- [ ] Every card uses glassmorphism (blur + subtle border + inner shadow)
- [ ] Dark background is consistent (#0A0A0F base)
- [ ] Accent colors follow traffic signal system (red/amber/green/blue/purple/cyan)
- [ ] Typography hierarchy is clear (Space Grotesk for numbers, Inter for UI)
- [ ] Spacing follows 8px grid system
- [ ] No clutter — maximum 3 focal points per viewport
- [ ] Gradient orbs behind hero elements for depth

### Interactions
- [ ] Every interactive element has hover state
- [ ] Every action has loading state
- [ ] Every state change has toast notification
- [ ] Page transitions are smooth (300-400ms)
- [ ] Cards animate in with stagger on load
- [ ] Map interactions are fluid (60fps)
- [ ] Command palette opens in <100ms

### Accessibility
- [ ] All colors meet WCAG AA contrast
- [ ] All interactive elements have focus indicators
- [ ] Keyboard navigation works throughout
- [ ] Screen reader labels on all icons
- [ ] Reduced motion respected
- [ ] Touch targets minimum 44px

### Performance
- [ ] Initial load < 2s (code split by route)
- [ ] Map renders at 60fps
- [ ] Lists virtualize after 50 items
- [ ] Images optimized (WebP, lazy loaded)
- [ ] No layout shift on data load (skeleton states)

---

## 12. Appendix: Backend Data Schema Reference

### 12.1 Key API Response Types

```typescript
// Overview
interface OverviewPayload {
  summary: {
    officers_deployed: number;
    active_cells: number;
    expected_relief: number;
    forecast_pressure: number;
    lift_pct: number;
    deployment_score_top25_recall: number | null;
    mean_ndcg_at_25: number | null;
  };
  highlights: {
    lift_pct: number;
    optimized_relief: number | null;
    reactive_relief: number | null;
    deployment_score_top25_recall: number | null;
    deployment_score_ndcg_at_25: number | null;
  };
  filters: {
    stations: string[];
    suggestions: SearchSuggestion[];
    support: { min: number; max: number };
  };
  artifacts: ArtifactRecord[];
  bbox?: BoundingBox;
}

// Map
interface MapRow {
  h3: string;
  map_label: string;
  metric_values: {
    deployment_score: number;
    pred_next_3h_cii: number;
    remaining_next_3h_cii: number;
    cii: number;
    current_cii: number;
    officers_assigned: number;
    expected_relief: number;
    forecast_cii: number;
    support_score: number;
    data_quality_score: number;
  };
  // Plus other fields from merge
}

// Hotspot Detail
interface HotspotDetail {
  h3: string;
  title: string;
  station: string | null;
  location: string | null;
  junction: string | null;
  scorecards: Record<string, number | null>;
  signals: Array<{ name: string; value: number | null }>;
  raw: Record<string, any>;
}

// Deployment
interface DeploymentPayload {
  totals: {
    optimized_relief: number | null;
    reactive_relief: number | null;
    lift_pct: number;
    optimized_officers: number;
    reactive_officers: number;
  };
  optimized: HotspotRow[];
  reactive: HotspotRow[];
}

// Evidence
interface EvidencePayload {
  backtest: Record<string, number | null>;
  roi: Record<string, number | null>;
  model: {
    target_column: string | null;
    prediction_column: string | null;
    ranker_enabled: boolean;
    features: string[];
  };
  feature_importance: {
    regression: FeatureImportanceRow[];
    ranker: FeatureImportanceRow[];
  };
  artifacts: ArtifactRecord[];
}

// Intelligence
interface IntelligencePayload {
  rows: IntelligenceRow[];
  summary: {
    hotspots: number;
    critical: number;
    opportunity_gap_total: number;
  };
}

// Timeline
interface TimelinePayload {
  horizons: string[];
  horizon_source: string;
  rows: TimelineRow[];
}

// Mission
interface MissionPayload {
  rows: MissionCard[];
}
```

### 12.2 Backend Endpoint Quick Reference

| Endpoint | Method | Purpose | Frontend Consumer |
|----------|--------|---------|-------------------|
| `/api/health` | GET | System status | Header status indicator |
| `/api/config` | GET | Map SDK config | MapCanvas initialization |
| `/api/overview` | GET | Dashboard summary | OverviewPage |
| `/api/map` | GET | Map visualization data | MapPage |
| `/api/hotspots` | GET | Hotspot list | HotspotsPage |
| `/api/hotspots/{h3}` | GET | Single hotspot detail | HotspotDetail modal/drawer |
| `/api/deployment` | GET | Optimized vs reactive | DeploymentPage |
| `/api/optimize` | POST | Re-run optimization | OptimizeModal |
| `/api/evidence` | GET | Model evidence | EvidencePage |
| `/api/artifacts` | GET | Artifact status | EvidencePage |
| `/api/feature_importance` | GET | Feature rankings | EvidencePage |
| `/api/intelligence` | GET | AI intelligence | IntelligencePage |
| `/api/timeline` | GET | Forecast timeline | TimelinePage |
| `/api/missions` | GET | Mission cards | MissionsPage |

---

## 13. Design Principles Summary

1. **Obsidian Command**: The interface is a dark, focused command center. No distractions. Every pixel serves the mission of traffic enforcement optimization.

2. **Glass & Light**: Cards float on glass surfaces. Light glows from within data — red for danger, green for success, blue for AI intelligence.

3. **Swiss Precision**: Grid-aligned, mathematically spaced, typographically rigorous. Numbers are large and authoritative. Labels are small and deferential.

4. **Fluid Physics**: Every interaction has weight and momentum. Nothing snaps — it flows. Cards lift, menus slide, maps glide.

5. **Zero Clutter**: If it doesn't help an officer deploy more effectively, it's not on screen. Progressive disclosure keeps complexity hidden until needed.

6. **Accessibility First**: Beautiful for all. High contrast, keyboard navigable, screen reader friendly, motion respectful.

7. **Real-Time Feel**: Data lives. Pulse dots, countdown timers, live charts, auto-refreshing metrics. The dashboard breathes.

8. **Mission Context**: Every number is contextualized. Not just "CII: 14.2" but "CII: 14.2 — Critical in 45 minutes. Assign 4 officers."

---