import { CdpClient } from './cdp-client';

export class CdpPool {
  private clients: Map<string, CdpClient> = new Map();

  async connect(deviceId: string, port: number): Promise<CdpClient> {
    // Reuse existing connection
    const existing = this.clients.get(deviceId);
    if (existing && existing.connected) return existing;
    if (existing) {
      await existing.close();
      this.clients.delete(deviceId);
    }

    const client = new CdpClient();

    // Discover the correct WebSocket URL from the DevTools JSON endpoint
    const wsUrl = await this.discoverWsUrl(port);
    await client.connect(wsUrl);

    this.clients.set(deviceId, client);
    return client;
  }

  getClient(deviceId: string): CdpClient | undefined {
    return this.clients.get(deviceId);
  }

  async disconnect(deviceId: string): Promise<void> {
    const client = this.clients.get(deviceId);
    if (client) {
      await client.close();
      this.clients.delete(deviceId);
    }
  }

  async disconnectAll(): Promise<void> {
    for (const [id] of this.clients) {
      await this.disconnect(id);
    }
  }

  private async discoverWsUrl(port: number): Promise<string> {
    const http = require('http');
    return new Promise((resolve, reject) => {
      http
        .get(`http://127.0.0.1:${port}/json`, (res: any) => {
          let data = '';
          res.on('data', (chunk: Buffer) => (data += chunk));
          res.on('end', () => {
            try {
              const targets = JSON.parse(data);
              if (targets.length > 0 && targets[0].webSocketDebuggerUrl) {
                resolve(targets[0].webSocketDebuggerUrl);
              } else {
                // Fallback to direct WebSocket URL
                resolve(`ws://127.0.0.1:${port}/devtools/browser`);
              }
            } catch {
              resolve(`ws://127.0.0.1:${port}/devtools/browser`);
            }
          });
        })
        .on('error', () => {
          // Fallback
          resolve(`ws://127.0.0.1:${port}/devtools/browser`);
        });
    });
  }
}
