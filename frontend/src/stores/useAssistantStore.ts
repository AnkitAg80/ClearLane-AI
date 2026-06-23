import { create } from 'zustand';

export interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AssistantState {
  open: boolean;
  thread: AssistantMessage[];
  pending: boolean;
  toggle: () => void;
  setOpen: (open: boolean) => void;
  send: (msg: AssistantMessage) => void;
  clear: () => void;
}

export const useAssistantStore = create<AssistantState>((set) => ({
  open: false,
  thread: [],
  pending: false,
  toggle: () => set((state) => ({ open: !state.open })),
  setOpen: (open) => set({ open }),
  send: (msg) => set((state) => ({ thread: [...state.thread, msg] })),
  clear: () => set({ thread: [] }),
}));
