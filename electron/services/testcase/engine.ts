import { CdpPool } from '../cdp/cdp-pool';
import { StepExecutor } from './step-executor';

export interface TestStep {
  id: string;
  name: string;
  description: string;
  type: 'input' | 'click' | 'screenshot' | 'branch' | 'loop';
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

export class TestEngine {
  private cdpPool: CdpPool;

  constructor(cdpPool: CdpPool) {
    this.cdpPool = cdpPool;
  }

  async execute(testCase: TestCase, deviceId: string, startStepId?: string): Promise<TestReport> {
    const client = this.cdpPool.getClient(deviceId);
    if (!client) throw new Error(`No CDP client for device: ${deviceId}`);

    const executor = new StepExecutor(client, deviceId);
    const startTime = Date.now();
    const results: StepResult[] = [];

    // Find start index
    let startIdx = 0;
    if (startStepId) {
      startIdx = testCase.steps.findIndex((s) => s.id === startStepId);
      if (startIdx === -1) startIdx = 0;
    }

    // Enable required domains
    await client.send('Runtime.enable');
    try { await client.send('Page.enable'); } catch {}

    // Execute steps
    for (let i = startIdx; i < testCase.steps.length; i++) {
      const step = testCase.steps[i];

      // Handle loop steps by finding referenced steps
      if (step.type === 'loop' && step.loop) {
        for (let iteration = 0; iteration < step.loop.count; iteration++) {
          for (const stepId of step.loop.stepIds) {
            const refStep = testCase.steps.find((s) => s.id === stepId);
            if (refStep) {
              const result = await executor.executeStep(refStep);
              results.push(result);
              if (result.status === 'failed') break;
            }
          }
        }
        results.push({
          stepId: step.id,
          status: 'passed',
          duration: Date.now() - startTime,
        });
      } else {
        const result = await executor.executeStep(step);
        results.push(result);
      }
    }

    const passed = results.filter((r) => r.status === 'passed').length;
    const failed = results.filter((r) => r.status === 'failed').length;

    return {
      id: crypto.randomUUID(),
      testCaseId: testCase.id,
      testCaseName: testCase.name,
      author: testCase.author,
      deviceName: deviceId,
      executedAt: Date.now(),
      totalDuration: Date.now() - startTime,
      results,
      passed,
      failed,
      total: results.length,
    };
  }

  async executeBatch(
    assignments: Array<{ testCase: TestCase; deviceId: string }>,
  ): Promise<TestReport[]> {
    const promises = assignments.map(({ testCase, deviceId }) =>
      this.execute(testCase, deviceId),
    );
    return Promise.all(promises);
  }
}
