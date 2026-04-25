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

  setTestCases: (cases: TestCase[]) => void;
  setCurrentCase: (tc: TestCase | null) => void;
  addTestCase: (tc: TestCase) => void;
  updateTestCase: (id: string, updates: Partial<TestCase>) => void;
  deleteTestCase: (id: string) => void;
  addStep: (caseId: string, step: TestStep) => void;
  updateStep: (caseId: string, stepId: string, updates: Partial<TestStep>) => void;
  deleteStep: (caseId: string, stepId: string) => void;
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

  setTestCases: (cases) => set({ testCases: cases }),
  setCurrentCase: (tc) => set({ currentCase: tc }),

  addTestCase: (tc) =>
    set((state) => ({ testCases: [...state.testCases, tc] })),

  updateTestCase: (id, updates) =>
    set((state) => ({
      testCases: state.testCases.map((tc) => (tc.id === id ? { ...tc, ...updates, updatedAt: Date.now() } : tc)),
    })),

  deleteTestCase: (id) =>
    set((state) => ({
      testCases: state.testCases.filter((tc) => tc.id !== id),
    })),

  addStep: (caseId, step) =>
    set((state) => ({
      testCases: state.testCases.map((tc) =>
        tc.id === caseId ? { ...tc, steps: [...tc.steps, step], updatedAt: Date.now() } : tc,
      ),
    })),

  updateStep: (caseId, stepId, updates) =>
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
    })),

  deleteStep: (caseId, stepId) =>
    set((state) => ({
      testCases: state.testCases.map((tc) =>
        tc.id === caseId
          ? { ...tc, steps: tc.steps.filter((s) => s.id !== stepId), updatedAt: Date.now() }
          : tc,
      ),
    })),

  setExecuting: (executing) => set({ executing }),
  addResult: (result) =>
    set((state) => ({ currentResults: [...state.currentResults, result] })),
  clearResults: () => set({ currentResults: [] }),

  addReport: (report) =>
    set((state) => ({ reports: [...state.reports, report] })),
}));
