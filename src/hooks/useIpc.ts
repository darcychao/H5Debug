import { useCallback } from 'react';

export function useIpc() {
  const invoke = useCallback(async (channel: string, ...args: unknown[]) => {
    if (!window.electronAPI) {
      console.warn('electronAPI not available');
      return null;
    }
    return window.electronAPI.invoke(channel, ...args);
  }, []);

  const on = useCallback((channel: string, callback: (...args: unknown[]) => void) => {
    if (!window.electronAPI) {
      console.warn('electronAPI not available');
      return () => {};
    }
    return window.electronAPI.on(channel, callback);
  }, []);

  return { invoke, on };
}
