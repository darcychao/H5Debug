import { create } from 'zustand';

interface PackageInfo {
  name: string;
  installed: boolean;
}

interface PackageState {
  packages: PackageInfo[];
  loading: boolean;

  setPackages: (packages: PackageInfo[]) => void;
  setLoading: (loading: boolean) => void;
  fetchPackages: (deviceId: string, type: 'adb' | 'hdc') => Promise<void>;
  installPackage: (deviceId: string, type: 'adb' | 'hdc', path: string) => Promise<void>;
  uninstallPackage: (deviceId: string, type: 'adb' | 'hdc', name: string) => Promise<void>;
  clearCache: (deviceId: string, type: 'adb' | 'hdc', name: string) => Promise<void>;
}

export const usePackageStore = create<PackageState>((set) => ({
  packages: [],
  loading: false,

  setPackages: (packages) => set({ packages }),
  setLoading: (loading) => set({ loading }),

  fetchPackages: async (deviceId, type) => {
    set({ loading: true });
    try {
      const packages = (await window.electronAPI?.invoke('package:list', deviceId, type)) as string[];
      if (packages) {
        set({
          packages: packages.map((name) => ({ name, installed: true })),
        });
      }
    } catch (err) {
      console.error('Failed to fetch packages:', err);
    } finally {
      set({ loading: false });
    }
  },

  installPackage: async (deviceId, type, path) => {
    try {
      await window.electronAPI?.invoke('package:install', deviceId, type, path);
    } catch (err) {
      console.error('Failed to install package:', err);
    }
  },

  uninstallPackage: async (deviceId, type, name) => {
    try {
      await window.electronAPI?.invoke('package:uninstall', deviceId, type, name);
    } catch (err) {
      console.error('Failed to uninstall package:', err);
    }
  },

  clearCache: async (deviceId, type, name) => {
    try {
      await window.electronAPI?.invoke('package:clear', deviceId, type, name);
    } catch (err) {
      console.error('Failed to clear cache:', err);
    }
  },
}));
