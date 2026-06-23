import { create } from 'zustand';

interface SelectionState {
  selectedH3: string | null;
  hoveredH3: string | null;
  multiSelect: string[];
  select: (h3: string | null) => void;
  hover: (h3: string | null) => void;
  clear: () => void;
  toggleMulti: (h3: string) => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedH3: null,
  hoveredH3: null,
  multiSelect: [],
  select: (selectedH3) => set({ selectedH3 }),
  hover: (hoveredH3) => set({ hoveredH3 }),
  clear: () => set({ selectedH3: null, hoveredH3: null, multiSelect: [] }),
  toggleMulti: (h3) => set((state) => ({
    multiSelect: state.multiSelect.includes(h3) 
      ? state.multiSelect.filter(id => id !== h3) 
      : [...state.multiSelect, h3]
  })),
}));
