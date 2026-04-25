import { create } from 'zustand';

interface PluginInfo {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  description: string;
}

interface PluginState {
  plugins: PluginInfo[];
  loading: boolean;

  setPlugins: (plugins: PluginInfo[]) => void;
  setLoading: (loading: boolean) => void;
  fetchPlugins: () => Promise<void>;
  togglePlugin: (id: string, enabled: boolean) => Promise<void>;
  uninstallPlugin: (id: string) => Promise<void>;
}

export const usePluginStore = create<PluginState>((set) => ({
  plugins: [],
  loading: false,

  setPlugins: (plugins) => set({ plugins }),
  setLoading: (loading) => set({ loading }),

  fetchPlugins: async () => {
    set({ loading: true });
    try {
      const plugins = (await window.electronAPI?.invoke('plugin:crud', 'list', {})) as PluginInfo[];
      if (plugins) set({ plugins });
    } catch (err) {
      console.error('Failed to fetch plugins:', err);
    } finally {
      set({ loading: false });
    }
  },

  togglePlugin: async (id, enabled) => {
    try {
      await window.electronAPI?.invoke('plugin:crud', enabled ? 'enable' : 'disable', { id });
      set((state) => ({
        plugins: state.plugins.map((p) => (p.id === id ? { ...p, enabled } : p)),
      }));
    } catch (err) {
      console.error('Failed to toggle plugin:', err);
    }
  },

  uninstallPlugin: async (id) => {
    try {
      await window.electronAPI?.invoke('plugin:crud', 'uninstall', { id });
      set((state) => ({
        plugins: state.plugins.filter((p) => p.id !== id),
      }));
    } catch (err) {
      console.error('Failed to uninstall plugin:', err);
    }
  },
}));
