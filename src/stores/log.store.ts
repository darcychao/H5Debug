import { create } from 'zustand';

export interface LogEntry {
  id: string;
  source: 'device' | 'cdp' | 'app';
  level: 'ERROR' | 'WARNING' | 'INFO' | 'DEBUG';
  content: string;
  timestamp: number;
}

interface LogState {
  entries: LogEntry[];
  filterLevel: string;
  filterSource: string;
  filterText: string;

  addEntry: (entry: LogEntry) => void;
  clearEntries: () => void;
  setFilterLevel: (level: string) => void;
  setFilterSource: (source: string) => void;
  setFilterText: (text: string) => void;
}

export const useLogStore = create<LogState>((set) => ({
  entries: [
    {
      id: 'init',
      source: 'app',
      level: 'INFO',
      content: 'Log stream ready. Connect a device to see logs.',
      timestamp: Date.now(),
    },
  ],
  filterLevel: 'all',
  filterSource: 'all',
  filterText: '',

  addEntry: (entry) =>
    set((state) => ({
      entries: [...state.entries, entry].slice(-10000),
    })),

  clearEntries: () => set({ entries: [] }),
  setFilterLevel: (level) => set({ filterLevel: level }),
  setFilterSource: (source) => set({ filterSource: source }),
  setFilterText: (text) => set({ filterText: text }),
}));
