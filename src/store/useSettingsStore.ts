import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  anthropicKey: string;
  stabilityKey: string;
  isSettingsOpen: boolean;
  setAnthropicKey: (key: string) => void;
  setStabilityKey: (key: string) => void;
  setIsSettingsOpen: (open: boolean) => void;
  hasApiKeys: () => boolean;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      anthropicKey: '',
      stabilityKey: '',
      isSettingsOpen: false,

      setAnthropicKey: (key) => set({ anthropicKey: key }),
      setStabilityKey: (key) => set({ stabilityKey: key }),
      setIsSettingsOpen: (open) => set({ isSettingsOpen: open }),

      hasApiKeys: () => {
        const state = get();
        return state.anthropicKey.length > 0;
      },
    }),
    {
      name: 'rhizome-settings',
      partialize: (state) => ({
        anthropicKey: state.anthropicKey,
        stabilityKey: state.stabilityKey,
      }),
    }
  )
);
