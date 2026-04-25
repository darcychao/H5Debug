/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
    on: (channel: string, callback: (...args: unknown[]) => void) => () => void;
  };
}
