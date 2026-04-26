/**
 * Screencast bridge - manages frame data at module level, independent of React component lifecycle.
 * This ensures frames keep accumulating even when ScreenView unmounts (tab switches).
 */

interface FrameState {
  latestFrame: string | null;
  frameCount: number;
  drawnCount: number;
  listenerReady: boolean;
}

const state: FrameState = {
  latestFrame: null,
  frameCount: 0,
  drawnCount: 0,
  listenerReady: false,
};

// Frame callbacks registered by consumers (ScreenView)
type FrameCallback = () => void;
const callbacks: Set<FrameCallback> = new Set();

function notify() {
  callbacks.forEach((cb) => cb());
}

/**
 * Initialize the IPC listener. Safe to call multiple times.
 */
function init() {
  if (!window.electronAPI) {
    setTimeout(init, 100);
    return;
  }
  if (state.listenerReady) return;

  window.electronAPI.on('cdp:screencast:frame', (args: any) => {
    const data = args?.params?.data;
    console.log('[bridge:recv]', state.frameCount, 'hasData=', !!data, 'dataLen=', data?.length || 0, 'vis=', document.visibilityState);
    if (data) {
      state.latestFrame = data;
      state.frameCount++;
      console.log('[bridge:recv] stored, total frames=', state.frameCount);
      notify();
    } else {
      if (state.frameCount === 0) console.log('[bridge] frame event but no data');
    }
  });
  state.listenerReady = true;
}

init();

export const screencastBridge = {
  subscribe(cb: FrameCallback): () => void {
    callbacks.add(cb);
    return () => callbacks.delete(cb);
  },

  getCounts(): { frameCount: number; drawnCount: number } {
    return { frameCount: state.frameCount, drawnCount: state.drawnCount };
  },

  getLatestFrame(): string | null {
    return state.latestFrame;
  },

  markDrawn(count: number) {
    state.drawnCount = count;
  },

  reset() {
    state.latestFrame = null;
    state.frameCount = 0;
    state.drawnCount = 0;
  },

  isReady() {
    return state.listenerReady;
  },
};
