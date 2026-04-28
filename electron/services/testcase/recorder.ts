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

    try { await client.send('DOM.enable'); } catch {}
    try { await client.send('Page.enable'); } catch {}
    try { await client.send('Runtime.enable'); } catch {}

    // Inject recording script into the page
    await this.injectRecordingScript();

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

  private async injectRecordingScript(): Promise<void> {
    if (!this.client) return;

    try {
      // Add bindings to receive events from page
      await this.client.send('Runtime.addBinding', { name: '__h5debug_record_event' });

      // Listen for binding events
      this.client.on('Runtime.bindingCalled', async (params: any) => {
        if (!this.recording || params.name !== '__h5debug_record_event') return;
        try {
          const event = JSON.parse(params.payload);
          await this.handleRecordedEvent(event);
        } catch {}
      });

      // Inject script to listen to user interactions
      await this.client.send('Runtime.evaluate', {
        expression: `(function() {
          if (window.__h5debug_recording) return;
          window.__h5debug_recording = true;

          function getSelector(el) {
            if (!el) return '';
            if (el.id) return '#' + el.id;
            if (el.className && typeof el.className === 'string') {
              const cls = el.className.split(/\\s+/).filter(Boolean)[0];
              if (cls) return el.tagName.toLowerCase() + '.' + cls;
            }
            return el.tagName.toLowerCase();
          }

          function getText(el) {
            return el.textContent?.trim().slice(0, 50) || '';
          }

          document.addEventListener('click', function(e) {
            const el = e.target;
            const payload = JSON.stringify({
              type: 'click',
              x: e.clientX,
              y: e.clientY,
              selector: getSelector(el),
              text: getText(el),
              tagName: el.tagName?.toLowerCase() || ''
            });
            window.__h5debug_record_event?.(payload);
          }, true);

          document.addEventListener('input', function(e) {
            const el = e.target;
            const payload = JSON.stringify({
              type: 'input',
              value: el.value || '',
              selector: getSelector(el),
              tagName: el.tagName?.toLowerCase() || ''
            });
            window.__h5debug_record_event?.(payload);
          }, true);

          document.addEventListener('change', function(e) {
            const el = e.target;
            const payload = JSON.stringify({
              type: 'change',
              value: el.value || '',
              selector: getSelector(el),
              tagName: el.tagName?.toLowerCase() || ''
            });
            window.__h5debug_record_event?.(payload);
          }, true);

          console.log('[H5Debug] Recording script injected');
        })()`,
        returnByValue: true,
      });
    } catch (err) {
      console.error('[Recorder] Failed to inject script:', err);
    }
  }

  private async handleRecordedEvent(event: any): Promise<void> {
    if (!this.recording) return;

    if (event.type === 'click') {
      const step: TestStep = {
        id: crypto.randomUUID(),
        name: event.text ? `Click: "${event.text}"` : `Click ${event.tagName || 'element'}`,
        description: `Click on ${event.selector || 'element'} at (${event.x}, ${event.y})`,
        type: 'click',
        selector: event.selector || undefined,
      };
      this.steps.push(step);
      this.emit('recording:step', step);
    } else if (event.type === 'input' || event.type === 'change') {
      // Only record inputs that have actual content
      if (!event.value) return;

      // Avoid duplicate input events - wait for final value
      const lastStep = this.steps[this.steps.length - 1];
      if (lastStep?.type === 'input' && lastStep.selector === event.selector) {
        // Update existing input step
        lastStep.inputValue = event.value;
        lastStep.name = `Input: "${event.value.slice(0, 30)}${event.value.length > 30 ? '...' : ''}"`;
        this.emit('recording:step', lastStep);
      } else {
        const step: TestStep = {
          id: crypto.randomUUID(),
          name: `Input: "${event.value.slice(0, 30)}${event.value.length > 30 ? '...' : ''}"`,
          description: `Type text into ${event.selector || 'element'}`,
          type: 'input',
          selector: event.selector || undefined,
          inputValue: event.value,
        };
        this.steps.push(step);
        this.emit('recording:step', step);
      }
    }
  }
}
