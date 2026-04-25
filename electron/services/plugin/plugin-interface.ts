import { CdpClient } from '../cdp/cdp-client';
import { DeviceInfo } from '../device/device-manager';
import { TestStep } from '../testcase/engine';

export interface StepResult {
  stepId: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  screenshot?: string;
  error?: string;
}

export interface PluginContext {
  cdpClient: CdpClient;
  deviceInfo: DeviceInfo;
  logger: {
    info: (msg: string) => void;
    warn: (msg: string) => void;
    error: (msg: string) => void;
  };
  getConfig<T>(key: string): T;
  setConfig(key: string, value: unknown): void;
}

export interface H5DebugPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;

  install(context: PluginContext): void;
  uninstall(): void;

  hooks: {
    beforeStepExecute?(step: TestStep, context: PluginContext): Promise<TestStep | null>;
    afterStepExecute?(step: TestStep, result: StepResult, context: PluginContext): Promise<void>;
    onInputIntercept?(step: TestStep, inputValue: string): Promise<string>;
  };
}
