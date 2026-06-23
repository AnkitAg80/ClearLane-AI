import { create } from 'zustand';

interface OptimizerState {
  open: boolean;
  budget: number;
  presets: number[];
  setOpen: (open: boolean) => void;
  openOptimizer: () => void;
  closeOptimizer: () => void;
  setBudget: (budget: number) => void;
}

export const useOptimizerStore = create<OptimizerState>((set) => ({
  open: false,
  budget: 100,
  presets: [50, 100, 250, 500, 1000],
  setOpen: (open) => set({ open }),
  openOptimizer: () => set({ open: true }),
  closeOptimizer: () => set({ open: false }),
  setBudget: (budget) => set({ budget: Number.isFinite(budget) ? Math.max(0, Math.floor(budget)) : 0 }),
}));
