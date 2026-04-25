import { create } from 'zustand';

export interface ConsoleEntry {
  id: string;
  type: 'input' | 'result' | 'error' | 'info' | 'warn';
  content: string;
  timestamp: number;
}

export interface MethodOverride {
  id: string;
  methodName: string;
  overrideCode: string;
  description: string;
  enabled: boolean;
  createdAt: number;
}

interface ConsoleState {
  entries: ConsoleEntry[];
  methodOverrides: MethodOverride[];
  history: string[];
  historyIndex: number;

  addEntry: (entry: ConsoleEntry) => void;
  clearEntries: () => void;
  addMethodOverride: (override: MethodOverride) => void;
  updateMethodOverride: (id: string, updates: Partial<MethodOverride>) => void;
  removeMethodOverride: (id: string) => void;
  addToHistory: (cmd: string) => void;
  setHistoryIndex: (idx: number) => void;
  executeExpression: (deviceId: string | null, expression: string) => Promise<void>;
}

export const useConsoleStore = create<ConsoleState>((set, get) => ({
  entries: [
    {
      id: 'init',
      type: 'info',
      content: 'Console ready. Connect a device to execute JS.',
      timestamp: Date.now(),
    },
  ],
  methodOverrides: [],
  history: [],
  historyIndex: -1,

  addEntry: (entry) =>
    set((state) => ({
      entries: [...state.entries, entry].slice(-500),
    })),

  clearEntries: () =>
    set({
      entries: [
        {
          id: 'cleared',
          type: 'info',
          content: 'Console cleared.',
          timestamp: Date.now(),
        },
      ],
    }),

  addMethodOverride: (override) =>
    set((state) => ({
      methodOverrides: [...state.methodOverrides, override],
    })),

  updateMethodOverride: (id, updates) =>
    set((state) => ({
      methodOverrides: state.methodOverrides.map((o) =>
        o.id === id ? { ...o, ...updates } : o,
      ),
    })),

  removeMethodOverride: (id) =>
    set((state) => ({
      methodOverrides: state.methodOverrides.filter((o) => o.id !== id),
    })),

  addToHistory: (cmd) =>
    set((state) => ({
      history: [...state.history, cmd].slice(-100),
      historyIndex: -1,
    })),

  setHistoryIndex: (idx) => set({ historyIndex: idx }),

  executeExpression: async (deviceId, expression) => {
    const { addEntry, addToHistory } = get();
    addEntry({
      id: crypto.randomUUID(),
      type: 'input',
      content: expression,
      timestamp: Date.now(),
    });
    addToHistory(expression);

    if (!deviceId || !window.electronAPI) {
      addEntry({
        id: crypto.randomUUID(),
        type: 'error',
        content: 'No device connected',
        timestamp: Date.now(),
      });
      return;
    }

    try {
      const result = await window.electronAPI.invoke('cdp:console:evaluate', deviceId, expression);
      addEntry({
        id: crypto.randomUUID(),
        type: 'result',
        content: typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result),
        timestamp: Date.now(),
      });
    } catch (err: any) {
      addEntry({
        id: crypto.randomUUID(),
        type: 'error',
        content: err.message || String(err),
        timestamp: Date.now(),
      });
    }
  },
}));
