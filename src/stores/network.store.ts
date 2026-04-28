import { create } from 'zustand';

export interface NetworkRequest {
  id: string;
  requestId: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  postData?: string;
  resourceType: string;
  timestamp: number;
}

export interface NetworkResponse {
  id: string;
  requestId: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body?: string;
  timestamp: number;
}

export interface InterceptRule {
  id: string;
  name: string;
  urlPattern: string;
  action: 'block' | 'modify' | 'mock';
  modifications?: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    postData?: string;
  };
  mockResponse?: {
    statusCode: number;
    headers?: Record<string, string>;
    body: string;
  };
  enabled: boolean;
}

interface NetworkState {
  requests: NetworkRequest[];
  responses: Map<string, NetworkResponse>;
  interceptRules: InterceptRule[];
  interceptEnabled: boolean;
  selectedRequestId: string | null;
  filterText: string;

  addRequest: (req: NetworkRequest) => void;
  addResponse: (res: NetworkResponse) => void;
  setInterceptRules: (rules: InterceptRule[]) => void;
  addInterceptRule: (rule: InterceptRule) => void;
  updateInterceptRule: (id: string, updates: Partial<InterceptRule>) => void;
  removeInterceptRule: (id: string) => void;
  setInterceptEnabled: (enabled: boolean) => void;
  setSelectedRequestId: (id: string | null) => void;
  setFilterText: (text: string) => void;
  clearRequests: () => void;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  requests: [],
  responses: new Map(),
  interceptRules: [],
  interceptEnabled: false,
  selectedRequestId: null,
  filterText: '',

  addRequest: (req) =>
    set((state) => {
      if (!req || !req.id) return state;
      return {
        requests: [...state.requests, req].slice(-5000), // max 5000 records
      };
    }),

  addResponse: (res) =>
    set((state) => {
      if (!res || !res.requestId) return state;
      const newResponses = new Map(state.responses);
      newResponses.set(res.requestId, res);
      return { responses: newResponses };
    }),

  setInterceptRules: (rules) => set({ interceptRules: rules }),

  addInterceptRule: (rule) =>
    set((state) => ({
      interceptRules: [...state.interceptRules, rule],
    })),

  updateInterceptRule: (id, updates) =>
    set((state) => ({
      interceptRules: state.interceptRules.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    })),

  removeInterceptRule: (id) =>
    set((state) => ({
      interceptRules: state.interceptRules.filter((r) => r.id !== id),
    })),

  setInterceptEnabled: (enabled) => set({ interceptEnabled: enabled }),

  setSelectedRequestId: (id) => set({ selectedRequestId: id }),

  setFilterText: (text) => set({ filterText: text }),

  clearRequests: () => set({ requests: [], responses: new Map() }),
}));
