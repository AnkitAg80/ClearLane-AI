# Nebula Phase 5 — Canvas Power Mode

## What changed
- **`CanvasPage.tsx`** — rewritten to integrate DockPanel (Inspector + Layer Controls) and CanvasHud; added "After deployment" glass overlay strip at bottom center; reads `?h3=` from URL search params on mount to select hotspot

- **`DockPanel.tsx`** — fixed `handleDragEnd` signature (unused params removed); fixed `y` dependency analysis; fixed `info` unused var lint error

- **`CanvasHud.tsx`** — removed unused `mouseActive` state; fixed `useRef<number | undefined>(undefined)` to avoid TS strict-mode "Expected 1 argument" error; HUD auto-hides after 3s of inactivity via mousemove/touchstart listeners

- **`MapCanvas.tsx`** — fixed `useRef<number | undefined>(undefined)` same pattern; pulse animation ref now matches `clearTimeout` parameter type

## How it helps
- CanvasPage is now the command center: full-bleed MapLibre map + layer toggle HUD + draggable/dockable Inspector/Layer panels + "after deployment" status strip
- All three build and lint clean (0 errors)
