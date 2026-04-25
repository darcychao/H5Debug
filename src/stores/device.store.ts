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
}

interface DeviceState {
  devices: DeviceInfo[];
  activeDeviceId: string | null;
  loading: boolean;

  setDevices: (devices: DeviceInfo[]) => void;
  updateDevice: (device: Partial<DeviceInfo> & { id: string; type: 'adb' | 'hdc' }) => void;
  setActiveDeviceId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  fetchDevices: () => Promise<void>;
  connectDevice: (deviceId: string, type: 'adb' | 'hdc') => Promise<void>;
  disconnectDevice: (deviceId: string, type: 'adb' | 'hdc') => Promise<void>;
}

export const useDeviceStore = create<DeviceState>((set, get) => ({
  devices: [],
  activeDeviceId: null,
  loading: false,

  setDevices: (devices) => set({ devices }),

  updateDevice: (device) =>
    set((state) => ({
      devices: state.devices.map((d) =>
        d.id === device.id && d.type === device.type ? { ...d, ...device } : d,
      ),
    })),

  setActiveDeviceId: (id) => set({ activeDeviceId: id }),

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
}));
