import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PrefsState {
  density: 'compact' | 'cozy';
  reducedMotion: boolean;
  sound: boolean;
  toggleDensity: () => void;
  toggleMotion: () => void;
  toggleSound: () => void;
}

export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({
      density: 'compact',
      reducedMotion: false,
      sound: false,
      toggleDensity: () => set((state) => ({ density: state.density === 'compact' ? 'cozy' : 'compact' })),
      toggleMotion: () => set((state) => ({ reducedMotion: !state.reducedMotion })),
      toggleSound: () => set((state) => ({ sound: !state.sound })),
    }),
    { name: 'prefs-storage' }
  )
);
