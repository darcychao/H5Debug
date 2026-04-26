import { EventEmitter } from 'events';
import { CdpClient } from './cdp-client';
import http from 'http';

export class CdpPool extends EventEmitter {
  private clients: Map<string, CdpClient> = new Map();

  constructor() {
    super();
  }

  async connect(deviceId: string, ports: number | number[], wsUrl?: string): Promise<CdpClient> {
    const portList = Array.isArray(ports) ? ports : [ports];
    console.log(`[CdpPool] connect(${deviceId}, ports=[${portList.join(', ')}]), wsUrl=${wsUrl ?? 'auto'}`);
    // Reuse existing connection
    const existing = this.clients.get(deviceId);
    if (existing && existing.connected) {
      console.log(`[CdpPool] reusing existing client for ${deviceId}`);
      return existing;
    }
    if (existing) {
      console.log(`[CdpPool] closing stale client for ${deviceId}`);
      await existing.close();
      this.clients.delete(deviceId);
    }

    const client = new CdpClient();

    // Use provided wsUrl or try each port to find a working CDP connection
    let resolvedUrl: string;
    if (wsUrl) {
      resolvedUrl = wsUrl;
    } else {
      resolvedUrl = await this.tryPorts(portList);
    }

    console.log(`[CdpPool] resolved wsUrl=${resolvedUrl} for ${deviceId}`);
    await client.connect(resolvedUrl);
    console.log(`[CdpPool] client connected for ${deviceId}`);

    // Forward client events to pool listeners
    client.on('event', (method: string, params: unknown) => {
      if (method === 'Page.screencastFrame') {
        console.log(`[CdpPool] forwarding Page.screencastFrame to IPC, params.data present=${!!(params as any)?.data}`);
      }
      this.emit('event', deviceId, method, params);
    });

    this.clients.set(deviceId, client);
    console.log(`[CdpPool] stored client for ${deviceId}, total clients:`, this.clients.size);
    return client;
  }

  /**
   * Try each port: first try /json discovery, then fall back to raw CDP connection.
   * Returns the first working WebSocket URL.
   */
  private async tryPorts(ports: number[]): Promise<string> {
    for (const port of ports) {
      console.log(`[CdpPool] trying port ${port}...`);
      // Try /json discovery first (works for browser DevTools)
      try {
        const url = await this.queryJson(port);
        if (url) {
          console.log(`[CdpPool] port ${port}: /json succeeded, using URL: ${url}`);
          return url;
        }
      } catch (err) {
        console.log(`[CdpPool] port ${port}: /json failed: ${(err as Error).message}`);
        // /json failed, try raw CDP connection
      }

      // /json didn't work - try raw CDP on this port
      try {
        const rawUrl = `ws://127.0.0.1:${port}/devtools/browser`;
        console.log(`[CdpPool] port ${port}: trying raw CDP: ${rawUrl}`);
        await this.testCdpConnection(rawUrl);
        console.log(`[CdpPool] port ${port}: raw CDP works! returning: ${rawUrl}`);
        return rawUrl;
      } catch (err) {
        console.log(`[CdpPool] port ${port}: raw CDP failed: ${(err as Error).message}`);
        // raw CDP also failed on this port
      }
    }
    throw new Error(`No CDP connection found on any port. Tried: ${ports.join(', ')}.`);
  }

  /**
   * Test if CDP commands work on a given WebSocket URL.
   * Sends HTTP upgrade + WebSocket frame to verify CDP is accessible.
   */
  private testCdpConnection(wsUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`[CdpPool] testCdpConnection: attempting ${wsUrl}`);
      const ws = new (require('ws'))(wsUrl);
      let resolved = false;
      const cleanup = () => {
        if (!resolved) {
          resolved = true;
          try { ws.close(); } catch {}
        }
      };
      const timeout = setTimeout(() => {
        console.log(`[CdpPool] testCdpConnection: TIMEOUT for ${wsUrl}`);
        cleanup();
        reject(new Error('CDP test timeout'));
      }, 5000);

      ws.on('open', () => {
        console.log(`[CdpPool] WebSocket open, sending Page.enable`);
        ws.send(JSON.stringify({ id: 1, method: 'Page.enable', params: {} }));
      });

      ws.on('message', (data: Buffer) => {
        try {
          const msg = JSON.parse(data.toString());
          console.log(`[CdpPool] CDP test received: id=${msg.id} method=${msg.method} result=${JSON.stringify(msg.result)?.substring(0, 100)}`);
          clearTimeout(timeout);
          resolved = true;
          ws.close();
          resolve();
        } catch (e) {
          console.log(`[CdpPool] CDP test parse error: ${e}`);
        }
      });

      ws.on('error', (err: Error) => {
        console.log(`[CdpPool] WebSocket error: ${err.message} for ${wsUrl}`);
        clearTimeout(timeout);
        if (!resolved) {
          resolved = true;
          reject(err);
        }
      });

      ws.on('close', (code: number, reason: Buffer) => {
        console.log(`[CdpPool] WebSocket closed: code=${code} reason=${reason.toString()} for ${wsUrl}`);
        clearTimeout(timeout);
        if (!resolved) {
          resolved = true;
          reject(new Error(`WebSocket closed: ${code} ${reason.toString()}`));
        }
      });

      ws.on('unexpected-response', (req: any, res: any) => {
        console.log(`[CdpPool] unexpected HTTP response: status=${res.statusCode} headers=${JSON.stringify(res.headers)}`);
      });
    });
  }

  getClient(deviceId: string): CdpClient | undefined {
    return this.clients.get(deviceId);
  }

  getClientIds(): string[] {
    return Array.from(this.clients.keys());
  }

  async disconnect(deviceId: string): Promise<void> {
    const client = this.clients.get(deviceId);
    if (client) {
      client.removeAllListeners();
      await client.close();
      this.clients.delete(deviceId);
    }
  }

  async disconnectAll(): Promise<void> {
    for (const [id] of this.clients) {
      await this.disconnect(id);
    }
  }

  private async discoverWsUrl(ports: number[]): Promise<string> {
    for (const port of ports) {
      try {
        const wsUrl = await this.queryJson(port);
        if (wsUrl) return wsUrl;
      } catch {
        // try next port
      }
    }
    // No page target found on any port
    throw new Error(`No CDP connection found on any port. Tried: ${ports.join(', ')}. Make sure Chrome/WebView has DevTools debugging enabled.`);
  }

  private queryJson(port: number): Promise<string> {
    return new Promise((resolve, reject) => {
      console.log(`[CdpPool] queryJson: attempting HTTP GET http://127.0.0.1:${port}/json`);
      const req = http.get(`http://127.0.0.1:${port}/json`, (res: any) => {
        let data = '';
        res.on('data', (chunk: Buffer) => (data += chunk));
        res.on('end', () => {
          console.log(`[CdpPool] port ${port}: HTTP ${res.statusCode}, body length=${data.length}, first 300 chars: ${data.substring(0, 300)}`);
          if (data.length === 0) {
            console.log(`[CdpPool] port ${port}: empty response from /json`);
            reject(new Error('empty'));
            return;
          }
          try {
            const targets = JSON.parse(data);
            if (!Array.isArray(targets) || targets.length === 0) {
              console.log(`[CdpPool] port ${port}: no CDP targets (empty array)`);
              reject(new Error('no targets'));
              return;
            }
            // Prefer page targets
            const pageTarget = targets.find((t: any) => t.webSocketDebuggerUrl?.includes('/devtools/page/'));
            if (pageTarget) {
              console.log(`[CdpPool] port ${port}: found PAGE target: ${JSON.stringify(pageTarget).substring(0, 200)}`);
              resolve(pageTarget.webSocketDebuggerUrl);
              return;
            }
            // Fall back to any target with a WS URL
            const anyTarget = targets.find((t: any) => t.webSocketDebuggerUrl);
            if (anyTarget) {
              console.log(`[CdpPool] port ${port}: no page target, using any: ${JSON.stringify(anyTarget).substring(0, 200)}`);
              resolve(anyTarget.webSocketDebuggerUrl);
              return;
            }
            // No targets with WS URL
            console.log(`[CdpPool] port ${port}: targets exist but none have webSocketDebuggerUrl. Targets: ${JSON.stringify(targets).substring(0, 300)}`);
            reject(new Error('no targets'));
          } catch (e) {
            console.log(`[CdpPool] port ${port}: parse error: ${e}, raw: ${data.substring(0, 100)}`);
            reject(new Error('parse error'));
          }
        });
      });
      req.on('error', (err: Error) => {
        console.log(`[CdpPool] port ${port}: connection error to /json: ${err.message}`);
        reject(err);
      });
      req.setTimeout(5000, () => {
        req.destroy();
        console.log(`[CdpPool] port ${port}: /json timeout`);
        reject(new Error('timeout'));
      });
    });
  }
}
