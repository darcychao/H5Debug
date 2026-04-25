export async function invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T | null> {
  if (!window.electronAPI) {
    console.warn('electronAPI not available');
    return null;
  }
  return window.electronAPI.invoke(channel, ...args) as Promise<T>;
}

export function on(channel: string, callback: (...args: unknown[]) => void): () => void {
  if (!window.electronAPI) {
    console.warn('electronAPI not available');
    return () => {};
  }
  return window.electronAPI.on(channel, callback);
}
