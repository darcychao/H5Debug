import { CdpClient } from '../cdp/cdp-client';
import { TestStep, StepResult } from './engine';

export class StepExecutor {
  private client: CdpClient;
  private deviceId: string;

  constructor(client: CdpClient, deviceId: string) {
    this.client = client;
    this.deviceId = deviceId;
  }

  async executeStep(step: TestStep): Promise<StepResult> {
    const startTime = Date.now();

    try {
      switch (step.type) {
        case 'click':
          return await this.executeClick(step, startTime);
        case 'input':
          return await this.executeInput(step, startTime);
        case 'screenshot':
          return await this.executeScreenshot(step, startTime);
        case 'branch':
          return await this.executeBranch(step, startTime);
        case 'loop':
          return await this.executeLoop(step, startTime);
        default:
          return {
            stepId: step.id,
            status: 'skipped',
            duration: Date.now() - startTime,
            error: `Unknown step type: ${step.type}`,
          };
      }
    } catch (err: any) {
      return {
        stepId: step.id,
        status: 'failed',
        duration: Date.now() - startTime,
        error: err.message,
      };
    }
  }

  private async executeClick(step: TestStep, startTime: number): Promise<StepResult> {
    if (!step.selector) {
      return { stepId: step.id, status: 'failed', duration: Date.now() - startTime, error: 'No selector provided' };
    }

    // Find element and click it
    const clickResult = await this.client.send('Runtime.evaluate', {
      expression: `(function() {
        const el = document.querySelector('${step.selector.replace(/'/g, "\\'")}');
        if (el) { el.click(); return true; }
        return false;
      })()`,
      returnByValue: true,
    });

    const success = (clickResult as any)?.result?.value === true;
    return {
      stepId: step.id,
      status: success ? 'passed' : 'failed',
      duration: Date.now() - startTime,
      error: success ? undefined : `Element not found: ${step.selector}`,
    };
  }

  private async executeInput(step: TestStep, startTime: number): Promise<StepResult> {
    if (!step.selector) {
      return { stepId: step.id, status: 'failed', duration: Date.now() - startTime, error: 'No selector provided' };
    }

    const escapedSelector = step.selector.replace(/'/g, "\\'");
    const escapedValue = (step.inputValue || '').replace(/'/g, "\\'").replace(/\\/g, '\\\\');

    // Focus element and set value
    const inputResult = await this.client.send('Runtime.evaluate', {
      expression: `(function() {
        const el = document.querySelector('${escapedSelector}');
        if (!el) return { success: false, error: 'Element not found' };
        el.focus();
        el.value = '${escapedValue}';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return { success: true, value: el.value };
      })()`,
      returnByValue: true,
    });

    const result = (inputResult as any)?.result?.value;

    // Verify if verifyValue is set
    if (step.verifyValue && result?.success) {
      const verifyOk = result.value === step.verifyValue;
      return {
        stepId: step.id,
        status: verifyOk ? 'passed' : 'failed',
        duration: Date.now() - startTime,
        error: verifyOk ? undefined : `Verify failed: expected "${step.verifyValue}", got "${result.value}"`,
      };
    }

    return {
      stepId: step.id,
      status: result?.success ? 'passed' : 'failed',
      duration: Date.now() - startTime,
      error: result?.success ? undefined : result?.error || 'Input failed',
    };
  }

  private async executeScreenshot(step: TestStep, startTime: number): Promise<StepResult> {
    const result = await this.client.send('Page.captureScreenshot', { format: 'png' });
    return {
      stepId: step.id,
      status: 'passed',
      duration: Date.now() - startTime,
      screenshot: (result as any)?.data,
    };
  }

  private async executeBranch(step: TestStep, startTime: number): Promise<StepResult> {
    if (!step.condition) {
      return { stepId: step.id, status: 'skipped', duration: Date.now() - startTime, error: 'No condition provided' };
    }

    const escapedSelector = step.condition.selector.replace(/'/g, "\\'");
    const checkExpr = step.condition.type === 'elementExists'
      ? `!!document.querySelector('${escapedSelector}')`
      : `!document.querySelector('${escapedSelector}')`;

    const conditionResult = await this.client.send('Runtime.evaluate', {
      expression: checkExpr,
      returnByValue: true,
    });

    const conditionMet = (conditionResult as any)?.result?.value === true;

    if (conditionMet && step.children) {
      const childResults: StepResult[] = [];
      for (const child of step.children) {
        const result = await this.executeStep(child);
        childResults.push(result);
        if (result.status === 'failed') {
          return {
            stepId: step.id,
            status: 'failed',
            duration: Date.now() - startTime,
            error: `Branch child failed: ${result.error}`,
          };
        }
      }
    }

    return {
      stepId: step.id,
      status: 'passed',
      duration: Date.now() - startTime,
    };
  }

  private async executeLoop(step: TestStep, startTime: number): Promise<StepResult> {
    if (!step.loop || step.loop.count <= 0) {
      return { stepId: step.id, status: 'skipped', duration: Date.now() - startTime, error: 'Invalid loop config' };
    }

    // Loop execution would reference other steps by ID
    // This is a simplified version - the engine handles the full orchestration
    return {
      stepId: step.id,
      status: 'passed',
      duration: Date.now() - startTime,
    };
  }
}
