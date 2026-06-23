import { create } from 'zustand';
import type { SearchSuggestion } from '../types/api';

interface FilterState {
  station: string | null;
  minSupport: number;
  query: string;
  selectedH3: string | null;
  selectedSuggestion: SearchSuggestion | null;
  setStation: (station: string | null) => void;
  setMinSupport: (min: number) => void;
  setQuery: (query: string) => void;
  setSelectedH3: (h3: string | null) => void;
  setSelectedSuggestion: (suggestion: SearchSuggestion | null) => void;
  hydrateFromUrl: (filters: { station?: string | null; minSupport?: number; query?: string; h3?: string | null }) => void;
  submitSearch: () => void;
  reset: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  station: null,
  minSupport: 0,
  query: '',
  selectedH3: null,
  selectedSuggestion: null,
  setStation: (station) => set({ station, selectedH3: null, selectedSuggestion: null }),
  setMinSupport: (minSupport) => set({ minSupport, selectedH3: null, selectedSuggestion: null }),
  setQuery: (query) => set({ query, selectedH3: null, selectedSuggestion: null }),
  setSelectedH3: (selectedH3) => set({ selectedH3, selectedSuggestion: null }),
  setSelectedSuggestion: (selectedSuggestion) => set({
    selectedSuggestion,
    selectedH3: selectedSuggestion?.h3 || null,
    query: selectedSuggestion?.value || '',
    station: selectedSuggestion?.station || null,
  }),
  hydrateFromUrl: ({ station, minSupport, query, h3 }) => set({
    station: station || null,
    minSupport: Number.isFinite(minSupport) ? Number(minSupport) : 0,
    query: query || '',
    selectedH3: h3 || null,
    selectedSuggestion: null,
  }),
  submitSearch: () => set((state) => ({
    selectedH3: state.selectedSuggestion?.h3 || null,
  })),
  reset: () => set({ station: null, minSupport: 0, query: '', selectedH3: null, selectedSuggestion: null }),
}));
