import { CdpClient } from './cdp-client';

export class InputService {
  private client: CdpClient;

  constructor(client: CdpClient) {
    this.client = client;
  }

  async click(x: number, y: number): Promise<void> {
    await this.client.send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x,
      y,
      button: 'left',
      clickCount: 1,
    });
    await this.client.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x,
      y,
      button: 'left',
      clickCount: 1,
    });
  }

  async type(text: string): Promise<void> {
    for (const char of text) {
      await this.client.send('Input.dispatchKeyEvent', {
        type: 'keyDown',
        text: char,
      });
      await this.client.send('Input.dispatchKeyEvent', {
        type: 'keyUp',
        text: char,
      });
    }
  }

  async insertText(text: string): Promise<void> {
    await this.client.send('Input.insertText', { text });
  }

  async scroll(x: number, y: number, deltaX: number, deltaY: number): Promise<void> {
    await this.client.send('Input.dispatchMouseEvent', {
      type: 'mouseWheel',
      x,
      y,
      deltaX,
      deltaY,
    });
  }

  async pinch(scale: number): Promise<void> {
    // Simulate pinch with touch events
    const centerX = 360;
    const centerY = 640;
    const distance = 100 * scale;

    await this.client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [
        { x: centerX - distance, y: centerY, id: 0 },
        { x: centerX + distance, y: centerY, id: 1 },
      ],
    });

    const steps = 5;
    for (let i = 1; i <= steps; i++) {
      const progress = i / steps;
      const d = distance * (1 - progress * (1 - scale));
      await this.client.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [
          { x: centerX - d, y: centerY, id: 0 },
          { x: centerX + d, y: centerY, id: 1 },
        ],
      });
    }

    await this.client.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
  }
}
