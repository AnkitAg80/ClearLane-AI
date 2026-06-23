import { create } from 'zustand';

interface CommandState {
  open: boolean;
  query: string;
  recents: string[];
  setOpen: (open: boolean) => void;
  setQuery: (query: string) => void;
  addRecent: (command: string) => void;
}

export const useCommandStore = create<CommandState>((set) => ({
  open: false,
  query: '',
  recents: [],
  setOpen: (open) => set({ open }),
  setQuery: (query) => set({ query }),
  addRecent: (cmd) => set((state) => ({ 
    recents: [cmd, ...state.recents.filter(c => c !== cmd)].slice(0, 5) 
  })),
}));
