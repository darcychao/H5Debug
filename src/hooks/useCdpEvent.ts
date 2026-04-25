import { useEffect, useRef } from 'react';

export function useCdpEvent(channel: string, callback: (...args: unknown[]) => void) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!window.electronAPI) return;

    const handler = (...args: unknown[]) => callbackRef.current(...args);
    const unsubscribe = window.electronAPI.on(channel, handler);
    return unsubscribe;
  }, [channel]);
}
