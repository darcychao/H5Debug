import { EventEmitter } from 'events';
import WebSocket from 'ws';

interface CdpMessage {
  id: number;
  method?: string;
  params?: Record<string, unknown>;
  result?: unknown;
  error?: { code: number; message: string };
}

export class CdpClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private msgId = 0;
  private pending: Map<number, { resolve: (value: unknown) => void; reject: (err: Error) => void }> = new Map();
  private _connected = false;

  get connected(): boolean {
    return this._connected;
  }

  async connect(wsUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`[CdpClient] connecting to ${wsUrl}`);
      const timeout = setTimeout(() => {
        reject(new Error(`CDP connection timeout: ${wsUrl}`));
      }, 10000);

      this.ws = new WebSocket(wsUrl);

      this.ws.on('open', () => {
        clearTimeout(timeout);
        console.log(`[CdpClient] connected to ${wsUrl}`);
        this._connected = true;
        this.emit('connected');
        resolve();
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          const msg = JSON.parse(data.toString()) as CdpMessage;
          this.handleMessage(msg);
        } catch (err) {
          console.error('Failed to parse CDP message:', err);
        }
      });

      this.ws.on('close', () => {
        clearTimeout(timeout);
        console.log(`[CdpClient] disconnected from ${wsUrl}`);
        this._connected = false;
        this.emit('disconnected');
        this.rejectAll(new Error('WebSocket closed'));
      });

      this.ws.on('error', (err) => {
        clearTimeout(timeout);
        console.error(`[CdpClient] error:`, err.message);
        this._connected = false;
        this.emit('error', err);
        reject(err);
      });
    });
  }

  async send(method: string, params?: Record<string, unknown>): Promise<unknown> {
    if (!this.ws || !this._connected) {
      throw new Error('CDP client not connected');
    }

    const id = ++this.msgId;
    const msg: CdpMessage = { id, method, params };

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws!.send(JSON.stringify(msg));

      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`CDP command timeout: ${method}`));
        }
      }, 30000);
    });
  }

  on(event: string, handler: (...args: unknown[]) => void): this {
    return super.on(event, handler);
  }

  private handleMessage(msg: CdpMessage) {
    // Response to a command
    if (msg.id && this.pending.has(msg.id)) {
      const { resolve, reject } = this.pending.get(msg.id)!;
      this.pending.delete(msg.id);
      if (msg.error) {
        reject(new Error(`CDP error ${msg.error.code}: ${msg.error.message}`));
      } else {
        resolve(msg.result);
      }
      return;
    }

    // CDP event
    if (msg.method) {
      this.emit('event', msg.method, msg.params);
      this.emit(msg.method, msg.params);
    }
  }

  private rejectAll(err: Error) {
    for (const { reject } of this.pending.values()) {
      reject(err);
    }
    this.pending.clear();
  }

  async close(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this._connected = false;
    }
  }
}
