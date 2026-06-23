# ClearLane AI UI Restart Plan

## Purpose

This document is the implementation contract for rebuilding the ClearLane AI frontend from scratch. The goal is to create a premium, accessibility-first, dark command-center web app with glassmorphism, fluid microinteractions, command palette workflows, conversational UI, rich data visualization, and an infinite-canvas intelligence layer while preserving the existing backend API contracts.

The current workspace has the `frontend/` directory deleted, while backend routes, README references, and source regression tests still expect a React/Vite frontend. This plan treats the frontend as a clean rebuild and uses the existing backend as the stable data boundary.

## Non-Negotiable Constraints

The frontend restart must preserve the semantic meaning of all backend payloads. Any backend changes must be explicitly justified and approved before implementation.

The UI must be built step by step. Each coherent implementation part must be completed, reported, and paused for explicit approval before the next part begins.

After each major implementation change, a structured Markdown file named `readme{change_short_form}.md` must be created in the relevant workspace. It must explain what changed, where it changed, why it helps, and what should happen next.

The UI must avoid clutter, decorative noise, emoji icons, inaccessible motion, and fake or simulated data. Any approximated or proxy values from the backend must be visibly labeled as such.

## Current Repository Findings

The backend entry point is `app/app.py`. It serves FastAPI routes and mounts `frontend/dist` when a built frontend exists.

The dashboard payload builder is `app/dashboard_service.py`. It defines the shape of overview, map, hotspot, deployment, evidence, intelligence, timeline, and mission payloads.

The `frontend/` folder is currently absent from the working tree, but git status shows deleted frontend files. Tests still reference frontend paths, so the rebuild must either recreate those paths or intentionally update tests.

The README describes the intended stack as Vite React served by FastAPI. The restart should keep that deployment model unless explicitly changed.

## Backend API Contract

The rebuilt frontend must connect to these routes:

| Frontend Helper | Backend Route | Primary Use |
|---|---|---|
| `getOverview()` | `/api/overview` | KPI cards, filters, search suggestions, artifact status |
| `getConfig()` | `/api/config` | Mappls configuration and fallback map settings |
| `getMapRows(filters)` | `/api/map` | H3 command map rows and metric values |
| `getHotspots(filters)` | `/api/hotspots` | hotspot lists, search results, table rows |
| `getHotspotDetail(h3)` | `/api/hotspots/{h3_cell}` | selected hotspot detail, scorecards, signals |
| `getDeployment()` | `/api/deployment` | optimized vs reactive deployment comparison |
| `getEvidence()` | `/api/evidence` | model trust, ROI, backtest, feature importance |
| `getIntelligence(filters)` | `/api/intelligence` | lifecycle, capacity theft, opportunity gap |
| `getTimeline(filters)` | `/api/timeline` | temporal twin and horizon forecast views |
| `getMissions(filters)` | `/api/missions` | operational mission cards |
| `optimizeDeployment(budget)` | `/api/optimize` | officer allocation optimization |

## Design Direction

The product should feel like a professional command-center application rather than a marketing site. It should be dense, calm, fast, and premium.

The visual language combines Swiss layout discipline, Linear-inspired navigation, dark glass surfaces, precise typography, and restrained cinematic motion. The background should be dark type, with layered panels and high-contrast operational data. Glassmorphism must be used as a functional hierarchy tool, not as decoration.

Primary qualities:

- Dark command background with readable street/map contrast.
- Frosted glass panels with subtle borders and depth.
- Crisp spatial hierarchy and 8px-or-less card radii unless the element is modal/canvas-specific.
- Fira Code for numbers, IDs, command labels, and technical metrics.
- Fira Sans or an equivalent neutral sans for body and controls.
- Lucide icons only.
- No visible instructional filler text that explains obvious UI behavior.
- Smooth 150-300ms transitions.
- Reduced-motion compliance.

## Design Tokens

Create the design token layer in `frontend/src/styles/tokens.css`.

Core token groups:

| Group | Tokens |
|---|---|
| Color | background, surface, glass, border, text, muted text, danger, warning, success, info, action |
| Typography | font body, font mono, size scale, line heights, weights |
| Spacing | 4, 8, 12, 16, 20, 24, 32, 40 |
| Radius | 4, 6, 8, 12 for modals or canvas overlays only |
| Shadow | panel, floating, focus, map overlay |
| Motion | fast 150ms, base 220ms, slow 300ms, standard easing, exit easing |
| Z-index | base, map, sticky, drawer, command palette, modal, toast |

Accessibility token requirements:

- Focus ring must be visible on dark surfaces.
- Text contrast must meet WCAG AA minimum, with AAA for primary operational text where feasible.
- Color must not be the only state indicator.
- Motion tokens must be disabled or shortened under `prefers-reduced-motion`.

## Frontend File Tree

The rebuilt frontend should use this structure:

```text
frontend/
  package.json
  package-lock.json
  index.html
  vite.config.js
  eslint.config.js
  public/
    favicon.svg
    icons.svg
  src/
    main.jsx
    App.jsx
    api.js
    styles/
      tokens.css
      base.css
      layout.css
      motion.css
      components.css
    state/
      useAsyncResource.js
      useCommandFilters.js
      useDashboardData.js
      useHotspotSelection.js
    utils/
      format.js
      metrics.js
      accessibility.js
      map.js
    components/
      command/
        CommandShell.jsx
        CommandPalette.jsx
        CommandSearch.jsx
        CommandToolbar.jsx
      shell/
        AppShell.jsx
        NavRail.jsx
        TopBar.jsx
        StatusDock.jsx
      map/
        CommandMap.jsx
        MapLegend.jsx
        MapTooltip.jsx
        MapProviderBadge.jsx
      canvas/
        InfiniteCanvas.jsx
        CanvasNode.jsx
        CanvasControls.jsx
        HotspotGraph.jsx
      assistant/
        ConversationalPanel.jsx
        MessageBubble.jsx
        QueryComposer.jsx
      charts/
        ForecastBandChart.jsx
        ReliefComparisonChart.jsx
        FeatureImportanceChart.jsx
        CapacityTheftChart.jsx
        MissionValueSparkline.jsx
      primitives/
        Button.jsx
        IconButton.jsx
        Panel.jsx
        MetricCard.jsx
        DataTable.jsx
        Drawer.jsx
        Tabs.jsx
        SegmentedControl.jsx
        Skeleton.jsx
        EmptyState.jsx
        ErrorState.jsx
      views/
        OverviewView.jsx
        CommandCenterView.jsx
        IntelligenceCanvasView.jsx
        TemporalTwinView.jsx
        MissionsView.jsx
        DeploymentView.jsx
        EvidenceView.jsx
        DatasetInsights.jsx
      BudgetCard.jsx
      CommandMap.jsx
      DeploymentConsole.jsx
      HotspotDetail.jsx
      Toolbar.jsx
      IntelligenceView.jsx
      MissionsView.jsx
      TemporalTwinView.jsx
      DatasetInsights.jsx
```

The compatibility files at `frontend/src/components/*.jsx` should either be wrappers around the new modules or first-class components, depending on which approach keeps tests cleanest.

## Component Connections

### `App.jsx`

Responsibilities:

- Initialize global app shell.
- Load static dashboard payloads through `useDashboardData`.
- Maintain active view state.
- Mount command palette.
- Pass shared filters and selected hotspot state into views.

Connections:

- Calls `useDashboardData`.
- Calls `useCommandFilters`.
- Renders `AppShell`.
- Renders one active view at a time.
- Provides command registry to `CommandPalette`.

### `api.js`

Responsibilities:

- Wrap all FastAPI calls.
- Normalize query parameters.
- Throw readable errors.
- Keep route strings centralized.

Required exports:

- `getOverview`
- `getConfig`
- `getMapRows`
- `getHotspots`
- `getHotspotDetail`
- `getDeployment`
- `getEvidence`
- `getIntelligence`
- `getTimeline`
- `getMissions`
- `optimizeDeployment`

### `useDashboardData.js`

Responsibilities:

- Load `/api/overview`, `/api/config`, `/api/deployment`, and `/api/evidence`.
- Expose `loading`, `refreshing`, `error`, and `refresh`.
- Refresh after deployment optimization.

Connections:

- Used by `App.jsx`.
- Feeds `OverviewView`, `DeploymentView`, `EvidenceView`, `CommandCenterView`, and `NavRail`.

### `useCommandFilters.js`

Responsibilities:

- Own `station`, `query`, `metricMode`, `minSupport`, and `limit`.
- Provide normalized filter object for API calls.
- Keep command palette and toolbar in sync.

Connections:

- Used by `CommandCenterView`, `MissionsView`, `TemporalTwinView`, and `IntelligenceCanvasView`.

### `CommandShell.jsx`

Responsibilities:

- Compose command map, toolbar, hotspot drawer, and metric strip.
- Load filtered map and hotspot rows.
- Pass `appConfig` into `CommandMap` as `mapConfig`.

Connections:

- Calls `getMapRows(filters)`.
- Calls `getHotspots(filters)`.
- Calls `getHotspotDetail(selectedH3)`.
- Receives `appConfig` from `useDashboardData`.

### `CommandMap.jsx`

Responsibilities:

- Render street-readable basemap.
- Attempt Mappls first when configured.
- Fall back to CARTO Voyager tiles.
- Render H3 hotspots as flat translucent overlays.
- Support metric modes including `remaining_next_3h_cii`.

Connections:

- Props: `rows`, `bbox`, `selectedH3`, `onSelect`, `metricMode`, `mapConfig`.
- Uses Deck.gl `TileLayer`, `BitmapLayer`, and `H3HexagonLayer`.
- Uses `metric_values` from backend rows.

Required behavior:

- `extruded: false`.
- Transparent Deck.gl canvas.
- Mappls badge when Mappls works.
- Fallback badge when CARTO is used.
- Keyboard-accessible alternative list in nearby panel for map items.

### `CommandPalette.jsx`

Responsibilities:

- Open via `Ctrl+K` and `Cmd+K`.
- Search commands, views, locations, metric modes, and selected hotspot actions.
- Provide keyboard navigation and escape-to-close.

Connections:

- Uses view registry from `App.jsx`.
- Uses `overview.filters.suggestions`.
- Uses active hotspot rows.
- Can set `activeView`, `query`, `metricMode`, and `selectedH3`.

Command groups:

- Navigation.
- Hotspots.
- Map metrics.
- Deployment actions.
- Evidence and model views.
- Accessibility toggles.

### `ConversationalPanel.jsx`

Responsibilities:

- Provide a chat-like operational query surface.
- Start local-only against loaded data unless LLM integration is explicitly approved.
- Answer questions such as top hotspots, current selected cell details, why a mission is urgent, or what changed after optimization.

Connections:

- Reads overview, deployment, evidence, intelligence, timeline, and mission payloads already loaded by views.
- Does not invent data.
- Labels missing data clearly.

Future extension:

- Can later connect to an LLM endpoint, but the first rebuild should keep it deterministic unless approved.

### `InfiniteCanvas.jsx`

Responsibilities:

- Provide a zoomable, pannable intelligence workspace.
- Display selected hotspot as a central node.
- Attach nodes for forecast, capacity theft, mission card, evidence, deployment, and model confidence.

Connections:

- Uses selected hotspot detail from `/api/hotspots/{h3}`.
- Uses intelligence rows from `/api/intelligence`.
- Uses timeline rows from `/api/timeline`.
- Uses mission rows from `/api/missions`.

Interaction requirements:

- Pan and zoom controls.
- Keyboard-accessible node list fallback.
- Reduced-motion support.
- No uncontrolled infinite animation.

## Views

### Overview View

Purpose:

- Give immediate operational situational awareness.

Data:

- `/api/overview`
- `/api/deployment`
- `/api/evidence`

Modules:

- `MetricCard`
- `ReliefComparisonChart`
- `FeatureImportanceChart`
- `StatusDock`

### Command Center View

Purpose:

- Primary map-first operations view.

Data:

- `/api/config`
- `/api/map`
- `/api/hotspots`
- `/api/hotspots/{h3_cell}`

Modules:

- `CommandShell`
- `CommandMap`
- `CommandToolbar`
- `HotspotDetail`
- `MapLegend`

### Intelligence Canvas View

Purpose:

- Infinite-canvas reasoning surface for a selected hotspot or station.

Data:

- `/api/intelligence`
- `/api/timeline`
- `/api/missions`
- `/api/hotspots/{h3_cell}`

Modules:

- `InfiniteCanvas`
- `CanvasNode`
- `HotspotGraph`
- `CapacityTheftChart`
- `MissionValueSparkline`

### Temporal Twin View

Purpose:

- Show now, +60m, +3h, and pattern-level congestion risk.

Data:

- `/api/timeline`

Modules:

- `ForecastBandChart`
- `DataTable`
- `SegmentedControl`
- `ErrorState`

Required labels:

- Show `horizon_source`.
- If horizon is derived from proxy columns, label it as proxy.

### Missions View

Purpose:

- Turn model outputs into operator-readable mission cards.

Data:

- `/api/missions`

Modules:

- `MissionValueSparkline`
- `CapacityTheftChart`
- `DataTable`
- `Drawer`

Required labels:

- Mission type.
- Lifecycle.
- Criticality.
- Officers required.
- Expected relief.
- Opportunity gap.

### Deployment View

Purpose:

- Optimize and compare enforcement allocations.

Data:

- `/api/deployment`
- `/api/optimize`
- `/api/overview`

Modules:

- `DeploymentConsole`
- `BudgetCard`
- `ReliefComparisonChart`
- `MetricCard`

Required behavior:

- Dynamic slider range.
- No fake marginal benefit curve.
- No unwired strategy buttons.
- Label relief as CII reduction units.

### Evidence View

Purpose:

- Build trust in the model and data pipeline.

Data:

- `/api/evidence`

Modules:

- `FeatureImportanceChart`
- `DatasetInsights`
- `DataTable`
- `StatusDock`

Required labels:

- Backtest metrics.
- ROI metrics.
- Ranker enabled status.
- Artifact readiness.
- Feature importance source.

## Data Visualization Plan

| Data Need | Visualization | Source |
|---|---|---|
| H3 hotspot geography | Flat translucent H3 overlay | `/api/map` |
| Forecast trend | Line chart with forecast/proxy labels | `/api/timeline` |
| Optimized vs reactive relief | Horizontal grouped bars | `/api/deployment` |
| Feature importance | Ranked horizontal bars | `/api/evidence` |
| Capacity theft | Compact lane/capacity visual | `/api/intelligence`, `/api/missions` |
| Mission marginal officer value | Small bar sparkline | `/api/missions` |
| Artifact readiness | Status dock / table | `/api/overview`, `/api/evidence` |

All visualizations must have accessible labels, legends, and non-color-only distinctions.

## Motion Plan

Motion must feel fluid but operational.

Use Framer Motion for:

- Page transitions.
- Command palette open/close.
- Drawer transitions.
- Canvas node entry.
- Selected hotspot detail transitions.

Use CSS transitions for:

- Buttons.
- Segmented controls.
- Table row hover.
- Focus rings.
- Panel elevation.

Avoid:

- Infinite decorative loops.
- Slow transitions over 500ms.
- Motion that moves large content unexpectedly.
- Hover-only critical interactions.

## Accessibility Plan

Accessibility is part of the base architecture, not a final pass.

Requirements:

- Every input has a real label.
- Every button has visible text or an `aria-label`.
- Command palette supports arrow keys, enter, escape, and focus return.
- Dialogs and drawers manage focus.
- Map interactions have a list/table fallback.
- Charts have legends and adjacent data summaries.
- `prefers-reduced-motion` is respected globally.
- Text never overlaps or clips at 375px, 768px, 1024px, and 1440px widths.
- No color-only indicators.

## Test Plan

Initial verification:

```powershell
rtk python -m pytest tests/test_dashboard_service.py tests/test_intelligence_api_source.py -q
```

Frontend source-regression verification:

```powershell
rtk python -m pytest tests/test_command_map_source.py tests/test_command_center_source.py tests/test_deployment_console_source.py tests/test_hotspot_detail_source.py tests/test_frontend_config_source.py tests/test_frontend_resilience_source.py -q
```

Frontend build verification:

```powershell
rtk powershell -NoProfile -Command "Set-Location frontend; npm run build"
```

Full non-live verification:

```powershell
rtk python -m pytest -q --ignore=tests/test_mappls_live.py
```

Manual browser verification:

- Start backend.
- Open `http://127.0.0.1:8501`.
- Verify map renders.
- Verify command palette keyboard flow.
- Verify filters update map and hotspot rows.
- Verify selected hotspot drawer updates.
- Verify optimization refreshes dependent data.
- Verify reduced-motion mode.
- Verify responsive layouts at 375px, 768px, 1024px, and 1440px.

## Implementation Phases

### Phase 1: Frontend Scaffold

Create the Vite React skeleton, base CSS, design tokens, API client, and placeholder app shell.

Deliverables:

- `frontend/package.json`
- `frontend/index.html`
- `frontend/vite.config.js`
- `frontend/src/main.jsx`
- `frontend/src/App.jsx`
- `frontend/src/api.js`
- base style files
- `readmefrontend_scaffold.md`

Pause for approval after this phase.

### Phase 2: App Shell And Navigation

Implement the Linear-inspired dark glass shell, nav rail, top status area, view registry, loading states, and error states.

Deliverables:

- `AppShell`
- `NavRail`
- `TopBar`
- `StatusDock`
- `useDashboardData`
- `readmeapp_shell.md`

Pause for approval after this phase.

### Phase 3: Command Center Core

Implement filters, command toolbar, map rows loading, hotspot rows loading, selected hotspot state, and the Deck.gl map.

Deliverables:

- `CommandShell`
- `CommandToolbar`
- `CommandMap`
- `MapLegend`
- `MapTooltip`
- `HotspotDetail`
- compatibility wrappers
- `readmecommand_center.md`

Pause for approval after this phase.

### Phase 4: Command Palette

Implement global command palette with navigation, hotspot search, metric mode changes, and selected hotspot actions.

Deliverables:

- `CommandPalette`
- command registry
- keyboard navigation
- focus handling
- `readmecommand_palette.md`

Pause for approval after this phase.

### Phase 5: Deployment And Evidence Views

Implement deployment optimizer, comparison charts, model evidence, artifact readiness, and feature importance.

Deliverables:

- `DeploymentView`
- `DeploymentConsole`
- `BudgetCard`
- `EvidenceView`
- `FeatureImportanceChart`
- `ReliefComparisonChart`
- `readmedeployment_evidence.md`

Pause for approval after this phase.

### Phase 6: Intelligence, Temporal Twin, And Missions

Implement advanced operational views using intelligence, timeline, and mission APIs.

Deliverables:

- `IntelligenceView`
- `TemporalTwinView`
- `MissionsView`
- `DatasetInsights`
- `ForecastBandChart`
- `CapacityTheftChart`
- `MissionValueSparkline`
- `readmeintelligence_views.md`

Pause for approval after this phase.

### Phase 7: Infinite Canvas

Implement the zoomable intelligence canvas for selected hotspot reasoning.

Deliverables:

- `InfiniteCanvas`
- `CanvasNode`
- `CanvasControls`
- `HotspotGraph`
- keyboard fallback list
- `readmeinfinite_canvas.md`

Pause for approval after this phase.

### Phase 8: Conversational UI

Implement local deterministic conversational interface against loaded dashboard data.

Deliverables:

- `ConversationalPanel`
- `MessageBubble`
- `QueryComposer`
- local query handlers
- missing-data responses
- `readmeconversational_ui.md`

Pause for approval after this phase.

### Phase 9: Polish, Accessibility, And Verification

Run source tests, build, responsive checks, motion checks, and final cleanup.

Deliverables:

- test updates if needed
- final CSS polish
- accessibility fixes
- build verification
- `readmeui_verification.md`

Pause for final approval after this phase.

## Open Questions

1. Should the deleted `frontend/` directory be treated as intentional, meaning the rebuild starts from a clean slate?

2. Should the conversational UI be local-only in the first version, or should it include a real LLM/API integration?

3. Should the infinite canvas be the primary screen or a dedicated Intelligence Canvas tab?

4. Should the app keep the ClearLane AI name and current command-center framing?

5. Should this plan become the formal UI spec under `docs/UI_RESTART_PLAN.md`, or should a separate `docs/UI-SPEC.md` be created from it?

