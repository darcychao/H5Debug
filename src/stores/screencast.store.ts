import { create } from 'zustand';

interface ScreencastState {
  deviceId: string | null;
  streaming: boolean;
  frameData: string | null;
  quality: number;
  maxFps: number;
  format: string;
  zoom: number;

  setDeviceId: (id: string | null) => void;
  setStreaming: (streaming: boolean) => void;
  setFrameData: (data: string | null) => void;
  setQuality: (q: number) => void;
  setMaxFps: (fps: number) => void;
  setFormat: (f: string) => void;
  setZoom: (z: number) => void;
}

export const useScreencastStore = create<ScreencastState>((set) => ({
  deviceId: null,
  streaming: false,
  frameData: null,
  quality: 80,
  maxFps: 30,
  format: 'jpeg',
  zoom: 1,

  setDeviceId: (id) => set({ deviceId: id }),
  setStreaming: (streaming) => set({ streaming }),
  setFrameData: (data) => {
    console.log('[screencastStore] setFrameData called, len=', data?.length, 'current frameData len=', useScreencastStore.getState().frameData?.length);
    set({ frameData: data });
  },
  setQuality: (q) => set({ quality: q }),
  setMaxFps: (fps) => set({ maxFps: fps }),
  setFormat: (f) => set({ format: f }),
  setZoom: (z) => set({ zoom: z }),
}));
