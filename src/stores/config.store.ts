import { create } from 'zustand';

interface ConfigState {
  config: Record<string, unknown>;
  loading: boolean;

  setConfig: (config: Record<string, unknown>) => void;
  setLoading: (loading: boolean) => void;
  fetchConfig: () => Promise<void>;
  updateConfig: (key: string, value: unknown) => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: {},
  loading: false,

  setConfig: (config) => set({ config }),
  setLoading: (loading) => set({ loading }),

  fetchConfig: async () => {
    set({ loading: true });
    try {
      const config = (await window.electronAPI?.invoke('config:get')) as Record<string, unknown>;
      if (config) set({ config });
    } catch (err) {
      console.error('Failed to fetch config:', err);
    } finally {
      set({ loading: false });
    }
  },

  updateConfig: async (key, value) => {
    try {
      await window.electronAPI?.invoke('config:set', key, value);
      set((state) => ({
        config: { ...state.config, [key]: value },
      }));
    } catch (err) {
      console.error('Failed to update config:', err);
    }
  },
}));
