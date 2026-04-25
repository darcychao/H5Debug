import { EventEmitter } from 'events';
import { CdpClient } from '../cdp/cdp-client';
import { TestStep } from './engine';

export class Recorder extends EventEmitter {
  private client: CdpClient | null = null;
  private recording = false;
  private steps: TestStep[] = [];

  async start(client: CdpClient): Promise<void> {
    this.client = client;
    this.recording = true;
    this.steps = [];

    await client.send('DOM.enable');
    await client.send('Page.enable');

    // Listen for user interactions by intercepting CDP events
    client.on('Input.dispatchMouseEvent', (params: any) => {
      if (!this.recording) return;
      this.recordClick(params);
    });

    client.on('Input.insertText', (params: any) => {
      if (!this.recording) return;
      this.recordInput(params);
    });

    this.emit('recording:started');
  }

  async stop(): Promise<TestStep[]> {
    this.recording = false;
    if (this.client) {
      try {
        await this.client.send('DOM.disable');
      } catch {
        // Ignore errors during cleanup
      }
      this.client = null;
    }
    this.emit('recording:stopped', this.steps);
    return this.steps;
  }

  isRecording(): boolean {
    return this.recording;
  }

  getSteps(): TestStep[] {
    return [...this.steps];
  }

  private async recordClick(params: any): Promise<void> {
    if (params.type !== 'mousePressed') return;

    const { x, y } = params;
    const selector = await this.getSelectorAtPoint(x, y);

    const step: TestStep = {
      id: crypto.randomUUID(),
      name: `Click at (${x}, ${y})`,
      description: `Click on element at position (${x}, ${y})`,
      type: 'click',
      selector: selector || undefined,
    };

    this.steps.push(step);
    this.emit('recording:step', step);
  }

  private async recordInput(params: any): Promise<void> {
    const { text } = params;
    if (!text) return;

    const step: TestStep = {
      id: crypto.randomUUID(),
      name: `Input: "${text}"`,
      description: `Type text: ${text}`,
      type: 'input',
      inputValue: text,
    };

    this.steps.push(step);
    this.emit('recording:step', step);
  }

  private async getSelectorAtPoint(x: number, y: number): Promise<string | null> {
    if (!this.client) return null;

    try {
      const result = await this.client.send('Runtime.evaluate', {
        expression: `(function() {
          const el = document.elementFromPoint(${x}, ${y});
          if (!el) return null;
          if (el.id) return '#' + el.id;
          if (el.className && typeof el.className === 'string') {
            const cls = el.className.split(/\\s+/).filter(Boolean)[0];
            if (cls) return el.tagName.toLowerCase() + '.' + cls;
          }
          return el.tagName.toLowerCase();
        })()`,
        returnByValue: true,
      });

      return (result as any)?.result?.value || null;
    } catch {
      return null;
    }
  }
}
