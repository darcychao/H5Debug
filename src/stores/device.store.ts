import { create } from 'zustand';

export interface DeviceInfo {
  id: string;
  type: 'adb' | 'hdc';
  model: string;
  osVersion: string;
  screenWidth: number;
  screenHeight: number;
  cdpPort: number;
  status: 'connected' | 'disconnected' | 'connecting';
  lastActiveAt: number;
  webviewPorts?: Record<string, number>;
}

export interface CdpTarget {
  id: string;
  type: string;
  title: string;
  url: string;
  webSocketDebuggerUrl: string;
  port: number;
}

interface DeviceState {
  devices: DeviceInfo[];
  activeDeviceId: string | null;
  loading: boolean;
  targets: CdpTarget[];
  activeTargetId: string | null;

  setDevices: (devices: DeviceInfo[]) => void;
  updateDevice: (device: Partial<DeviceInfo> & { id: string; type: 'adb' | 'hdc' }) => void;
  setActiveDeviceId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  fetchDevices: () => Promise<void>;
  connectDevice: (deviceId: string, type: 'adb' | 'hdc') => Promise<void>;
  disconnectDevice: (deviceId: string, type: 'adb' | 'hdc') => Promise<void>;
  fetchTargets: (deviceId: string) => Promise<void>;
  selectTarget: (deviceId: string, targetId: string, wsUrl: string) => Promise<void>;
  setActiveTargetId: (id: string | null) => void;
}

export const useDeviceStore = create<DeviceState>((set, get) => ({
  devices: [],
  activeDeviceId: null,
  loading: false,
  targets: [],
  activeTargetId: null,

  setDevices: (devices) => set({ devices }),

  updateDevice: (device) =>
    set((state) => ({
      devices: state.devices.map((d) =>
        d.id === device.id && d.type === device.type ? { ...d, ...device } : d,
      ),
    })),

  setActiveDeviceId: (id) => set({ activeDeviceId: id, targets: [], activeTargetId: null }),

  setLoading: (loading) => set({ loading }),

  fetchDevices: async () => {
    set({ loading: true });
    try {
      const devices = (await window.electronAPI?.invoke('device:list')) as DeviceInfo[];
      if (devices) set({ devices });
    } catch (err) {
      console.error('Failed to fetch devices:', err);
    } finally {
      set({ loading: false });
    }
  },

  connectDevice: async (deviceId, type) => {
    try {
      const info = (await window.electronAPI?.invoke('device:connect', deviceId, type)) as DeviceInfo;
      if (info) {
        get().updateDevice(info);
      }
    } catch (err) {
      console.error('Failed to connect device:', err);
    }
  },

  disconnectDevice: async (deviceId, type) => {
    try {
      await window.electronAPI?.invoke('device:disconnect', deviceId, type);
    } catch (err) {
      console.error('Failed to disconnect device:', err);
    }
  },

  fetchTargets: async (deviceId) => {
    try {
      const targets = (await window.electronAPI?.invoke('cdp:listTargets', deviceId)) as CdpTarget[];
      set({ targets: targets || [] });
    } catch (err) {
      console.error('Failed to fetch targets:', err);
      set({ targets: [] });
    }
  },

  selectTarget: async (deviceId, targetId, wsUrl) => {
    try {
      set({ activeTargetId: targetId });
      await window.electronAPI?.invoke('cdp:selectTarget', deviceId, wsUrl);
    } catch (err) {
      console.error('Failed to select target:', err);
    }
  },

  setActiveTargetId: (id) => set({ activeTargetId: id }),
}));
