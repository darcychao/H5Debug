import { create } from 'zustand';

export interface PackageInfo {
  name: string;
}

interface PackageState {
  packages: PackageInfo[];
  filteredPackages: PackageInfo[];
  loading: boolean;
  error: string | null;
  filter: string;

  setPackages: (packages: PackageInfo[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilter: (filter: string) => void;
  fetchPackages: (deviceId: string, type: 'adb' | 'hdc') => Promise<void>;
  installPackage: (deviceId: string, type: 'adb' | 'hdc', path: string) => Promise<void>;
  uploadAndInstall: (deviceId: string, type: 'adb' | 'hdc') => Promise<{ success: boolean; cancelled?: boolean; error?: string }>;
  uninstallPackage: (deviceId: string, type: 'adb' | 'hdc', name: string) => Promise<void>;
  clearCache: (deviceId: string, type: 'adb' | 'hdc', name: string) => Promise<void>;
}

function applyFilter(packages: PackageInfo[], filter: string): PackageInfo[] {
  if (!filter.trim()) return packages;
  const lower = filter.toLowerCase();
  return packages.filter((p) => p.name.toLowerCase().includes(lower));
}

export const usePackageStore = create<PackageState>((set, get) => ({
  packages: [],
  filteredPackages: [],
  loading: false,
  error: null,
  filter: '',

  setPackages: (packages) => set({ packages, filteredPackages: applyFilter(packages, get().filter) }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setFilter: (filter) => set({ filter, filteredPackages: applyFilter(get().packages, filter) }),

  fetchPackages: async (deviceId, type) => {
    set({ loading: true, error: null });
    try {
      const packages = (await window.electronAPI?.invoke('package:list', deviceId, type)) as string[];
      if (packages) {
        const pkgList = packages.map((name) => ({ name }));
        set({ packages: pkgList, filteredPackages: applyFilter(pkgList, get().filter), error: null });
      }
    } catch (err) {
      console.error('Failed to fetch packages:', err);
      set({ error: String(err) });
    } finally {
      set({ loading: false });
    }
  },

  installPackage: async (deviceId, type, path) => {
    set({ loading: true, error: null });
    try {
      await window.electronAPI?.invoke('package:install', deviceId, type, path);
      await get().fetchPackages(deviceId, type);
    } catch (err) {
      console.error('Failed to install package:', err);
      set({ error: String(err) });
    } finally {
      set({ loading: false });
    }
  },

  uploadAndInstall: async (deviceId, type) => {
    set({ loading: true, error: null });
    try {
      const result = await window.electronAPI?.invoke('package:upload', deviceId, type) as {
        success: boolean;
        cancelled?: boolean;
        error?: string;
      };
      if (result?.success) {
        await get().fetchPackages(deviceId, type);
      } else if (!result?.cancelled) {
        set({ error: result?.error || 'Install failed' });
      }
      return result || { success: false };
    } catch (err) {
      console.error('Failed to upload package:', err);
      set({ error: String(err) });
      return { success: false, error: String(err) };
    } finally {
      set({ loading: false });
    }
  },

  uninstallPackage: async (deviceId, type, name) => {
    set({ loading: true, error: null });
    try {
      await window.electronAPI?.invoke('package:uninstall', deviceId, type, name);
      await get().fetchPackages(deviceId, type);
    } catch (err) {
      console.error('Failed to uninstall package:', err);
      set({ error: String(err) });
    } finally {
      set({ loading: false });
    }
  },

  clearCache: async (deviceId, type, name) => {
    set({ loading: true, error: null });
    try {
      await window.electronAPI?.invoke('package:clear', deviceId, type, name);
    } catch (err) {
      console.error('Failed to clear cache:', err);
      set({ error: String(err) });
    } finally {
      set({ loading: false });
    }
  },
}));
