import { create } from 'zustand';

export interface TestStep {
  id: string;
  name: string;
  description: string;
  type: StepType;
  selector?: string;
  inputValue?: string;
  verifyValue?: string;
  children?: TestStep[];
  condition?: {
    type: 'elementExists' | 'elementNotExists';
    selector: string;
  };
  loop?: {
    stepIds: string[];
    count: number;
  };
}

export type StepType = 'input' | 'click' | 'screenshot' | 'branch' | 'loop';

export interface TestCase {
  id: string;
  name: string;
  description: string;
  author: string;
  deviceId?: string;
  steps: TestStep[];
  createdAt: number;
  updatedAt: number;
}

export interface StepResult {
  stepId: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  screenshot?: string;
  error?: string;
}

export interface TestReport {
  id: string;
  testCaseId: string;
  testCaseName: string;
  author: string;
  deviceName: string;
  executedAt: number;
  totalDuration: number;
  results: StepResult[];
  passed: number;
  failed: number;
  total: number;
}

interface TestcaseState {
  testCases: TestCase[];
  currentCase: TestCase | null;
  reports: TestReport[];
  executing: boolean;
  currentResults: StepResult[];
  loaded: boolean;

  loadTestCases: () => Promise<void>;
  setTestCases: (cases: TestCase[]) => void;
  setCurrentCase: (tc: TestCase | null) => void;
  addTestCase: (tc: TestCase) => Promise<void>;
  updateTestCase: (id: string, updates: Partial<TestCase>) => Promise<void>;
  deleteTestCase: (id: string) => Promise<void>;
  addStep: (caseId: string, step: TestStep) => Promise<void>;
  updateStep: (caseId: string, stepId: string, updates: Partial<TestStep>) => Promise<void>;
  deleteStep: (caseId: string, stepId: string) => Promise<void>;
  setExecuting: (executing: boolean) => void;
  addResult: (result: StepResult) => void;
  clearResults: () => void;
  addReport: (report: TestReport) => void;
}

export const useTestcaseStore = create<TestcaseState>((set, get) => ({
  testCases: [],
  currentCase: null,
  reports: [],
  executing: false,
  currentResults: [],
  loaded: false,

  loadTestCases: async () => {
    if (!window.electronAPI) return;
    try {
      const cases = await window.electronAPI.invoke('testcase:list');
      set({ testCases: cases, loaded: true });
    } catch (e) {
      console.error('Failed to load test cases:', e);
    }
  },

  setTestCases: (cases) => set({ testCases: cases }),
  setCurrentCase: (tc) => set({ currentCase: tc }),

  addTestCase: async (tc) => {
    set((state) => ({ testCases: [...state.testCases, tc] }));
    if (window.electronAPI) {
      await window.electronAPI.invoke('testcase:create', tc);
    }
  },

  updateTestCase: async (id, updates) => {
    set((state) => ({
      testCases: state.testCases.map((tc) => (tc.id === id ? { ...tc, ...updates, updatedAt: Date.now() } : tc)),
      currentCase: state.currentCase?.id === id ? { ...state.currentCase, ...updates, updatedAt: Date.now() } : state.currentCase,
    }));

    if (window.electronAPI) {
      const state = get();
      const currentCase = state.testCases.find((tc) => tc.id === id);
      if (currentCase) {
        await window.electronAPI.invoke('testcase:update', id, { ...updates, updatedAt: Date.now() });
      }
    }
  },

  deleteTestCase: async (id) => {
    set((state) => ({
      testCases: state.testCases.filter((tc) => tc.id !== id),
      currentCase: state.currentCase?.id === id ? null : state.currentCase,
    }));
    if (window.electronAPI) {
      await window.electronAPI.invoke('testcase:delete', id);
    }
  },

  addStep: async (caseId, step) => {
    set((state) => ({
      testCases: state.testCases.map((tc) =>
        tc.id === caseId ? { ...tc, steps: [...tc.steps, step], updatedAt: Date.now() } : tc,
      ),
      currentCase: state.currentCase?.id === caseId
        ? { ...state.currentCase, steps: [...state.currentCase.steps, step], updatedAt: Date.now() }
        : state.currentCase,
    }));

    if (window.electronAPI) {
      const state = get();
      const currentCase = state.testCases.find((tc) => tc.id === caseId);
      if (currentCase) {
        await window.electronAPI.invoke('testcase:update', caseId, { steps: currentCase.steps, updatedAt: Date.now() });
      }
    }
  },

  updateStep: async (caseId, stepId, updates) => {
    set((state) => ({
      testCases: state.testCases.map((tc) =>
        tc.id === caseId
          ? {
              ...tc,
              steps: tc.steps.map((s) => (s.id === stepId ? { ...s, ...updates } : s)),
              updatedAt: Date.now(),
            }
          : tc,
      ),
      currentCase: state.currentCase?.id === caseId
        ? {
            ...state.currentCase,
            steps: state.currentCase.steps.map((s) => (s.id === stepId ? { ...s, ...updates } : s)),
            updatedAt: Date.now(),
          }
        : state.currentCase,
    }));

    if (window.electronAPI) {
      const state = get();
      const currentCase = state.testCases.find((tc) => tc.id === caseId);
      if (currentCase) {
        await window.electronAPI.invoke('testcase:update', caseId, { steps: currentCase.steps, updatedAt: Date.now() });
      }
    }
  },

  deleteStep: async (caseId, stepId) => {
    set((state) => ({
      testCases: state.testCases.map((tc) =>
        tc.id === caseId
          ? { ...tc, steps: tc.steps.filter((s) => s.id !== stepId), updatedAt: Date.now() }
          : tc,
      ),
      currentCase: state.currentCase?.id === caseId
        ? { ...state.currentCase, steps: state.currentCase.steps.filter((s) => s.id !== stepId), updatedAt: Date.now() }
        : state.currentCase,
    }));

    if (window.electronAPI) {
      const state = get();
      const currentCase = state.testCases.find((tc) => tc.id === caseId);
      if (currentCase) {
        await window.electronAPI.invoke('testcase:update', caseId, { steps: currentCase.steps, updatedAt: Date.now() });
      }
    }
  },

  setExecuting: (executing) => set({ executing }),
  addResult: (result) =>
    set((state) => ({ currentResults: [...state.currentResults, result] })),
  clearResults: () => set({ currentResults: [] }),

  addReport: (report) =>
    set((state) => ({ reports: [...state.reports, report] })),
}));
