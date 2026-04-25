import { CdpClient } from './cdp-client';

export class RuntimeService {
  private client: CdpClient;

  constructor(client: CdpClient) {
    this.client = client;
  }

  async enable(): Promise<void> {
    await this.client.send('Runtime.enable');
  }

  async disable(): Promise<void> {
    await this.client.send('Runtime.disable');
  }

  async evaluate(expression: string, returnByValue = true): Promise<unknown> {
    const result = await this.client.send('Runtime.evaluate', {
      expression,
      returnByValue,
      awaitPromise: true,
    }) as { result?: { value: unknown; description?: string; type?: string }; exceptionDetails?: unknown };

    if (result.exceptionDetails) {
      throw new Error(`Runtime.evaluate error: ${JSON.stringify(result.exceptionDetails)}`);
    }

    return result.result?.value;
  }

  async callFunctionOn(functionDeclaration: string, executionContextId?: number, args?: unknown[]): Promise<unknown> {
    const params: Record<string, unknown> = {
      functionDeclaration,
      returnByValue: true,
    };
    if (executionContextId) {
      params.executionContextId = executionContextId;
    }
    if (args) {
      params.arguments = args;
    }

    const result = await this.client.send('Runtime.callFunctionOn', params) as { result?: { value: unknown }; exceptionDetails?: unknown };

    if (result.exceptionDetails) {
      throw new Error(`Runtime.callFunctionOn error: ${JSON.stringify(result.exceptionDetails)}`);
    }

    return result.result?.value;
  }

  onConsoleAPICalled(callback: (type: string, args: unknown[]) => void): () => void {
    const handler = (params: any) => {
      callback(params.type, params.args);
    };
    this.client.on('Runtime.consoleAPICalled', handler);
    return () => this.client.removeListener('Runtime.consoleAPICalled', handler);
  }
}
