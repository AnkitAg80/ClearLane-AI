import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DockLocation = 'left-rail' | 'right-rail' | 'bottom-rail' | 'floating';
export type PanelId = 'inspector' | 'layers' | 'legend' | 'search';

interface Viewport {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

interface PanelState {
  id: PanelId;
  location: DockLocation;
  position: { x: number; y: number };
  minimized: boolean;
}

interface CanvasState {
  viewport: Viewport;
  layers: {
    fill: boolean;
    extrude: boolean;
    officers: boolean;
    predicted: boolean;
    labels: boolean;
  };
  panels: Record<PanelId, PanelState>;
  hudVisible: boolean;
  selectedH3Pulse: boolean;
  setViewport: (viewport: Partial<Viewport>) => void;
  toggleLayer: (layer: keyof CanvasState['layers']) => void;
  dockPanel: (id: PanelId, location: DockLocation) => void;
  movePanel: (id: PanelId, position: { x: number; y: number }) => void;
  togglePanel: (id: PanelId) => void;
  setHudVisible: (visible: boolean) => void;
  setSelectedH3Pulse: (pulse: boolean) => void;
}

const DEFAULT_PANELS: Record<PanelId, PanelState> = {
  inspector: { id: 'inspector', location: 'right-rail', position: { x: 0, y: 0 }, minimized: false },
  layers: { id: 'layers', location: 'left-rail', position: { x: 0, y: 0 }, minimized: false },
  legend: { id: 'legend', location: 'bottom-rail', position: { x: 0, y: 0 }, minimized: true },
  search: { id: 'search', location: 'floating', position: { x: 40, y: 40 }, minimized: true },
};

function mergeCanvasState(persisted: unknown, current: CanvasState): CanvasState {
  const persistedState = persisted as Partial<CanvasState> | undefined;
  if (!persistedState) return current;
  return {
    ...current,
    ...persistedState,
    viewport: {
      ...current.viewport,
      ...persistedState.viewport,
    },
    layers: {
      ...current.layers,
      ...persistedState.layers,
    },
    panels: {
      ...current.panels,
      ...persistedState.panels,
    },
  };
}

export const useCanvasStore = create<CanvasState>()(
  persist(
    (set) => ({
      viewport: { longitude: 0, latitude: 0, zoom: 12, pitch: 45, bearing: 0 },
      layers: {
        fill: true,
        extrude: true,
        officers: true,
        predicted: true,
        labels: true,
      },
      panels: DEFAULT_PANELS,
      hudVisible: true,
      selectedH3Pulse: false,
      setViewport: (vp) => set((state) => ({ viewport: { ...state.viewport, ...vp } })),
      toggleLayer: (layer) => set((state) => ({ layers: { ...state.layers, [layer]: !state.layers[layer] } })),
      dockPanel: (id, location) => set((state) => ({
        panels: {
          ...state.panels,
          [id]: { ...state.panels[id], location, minimized: false },
        },
      })),
      movePanel: (id, position) => set((state) => ({
        panels: {
          ...state.panels,
          [id]: { ...state.panels[id], position },
        },
      })),
      togglePanel: (id) => set((state) => ({
        panels: {
          ...state.panels,
          [id]: { ...state.panels[id], minimized: !state.panels[id].minimized },
        },
      })),
      setHudVisible: (hudVisible) => set({ hudVisible }),
      setSelectedH3Pulse: (selectedH3Pulse) => set({ selectedH3Pulse }),
    }),
    {
      name: 'canvas-storage',
      merge: mergeCanvasState,
    }
  )
);
