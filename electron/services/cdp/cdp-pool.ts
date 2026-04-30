import { EventEmitter } from 'events';
import { CdpClient } from './cdp-client';
import { NetworkService, InterceptRule } from './network';
import http from 'http';

export class CdpPool extends EventEmitter {
  private clients: Map<string, CdpClient> = new Map();
  private networkServices: Map<string, NetworkService> = new Map();
  private globalInterceptRules: InterceptRule[] = [];
  private globalInterceptEnabled: boolean = false;

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

    // Create network service for this client
    const networkService = new NetworkService(client);
    this.networkServices.set(deviceId, networkService);

    // Forward network events
    networkService.on('request', (request) => {
      this.emit('network-request', deviceId, request);
    });
    networkService.on('response', (response) => {
      this.emit('network-response', deviceId, response);
    });
    networkService.on('response-body', (response) => {
      this.emit('network-response-body', deviceId, response);
    });
    networkService.on('request-blocked', (request, rule) => {
      this.emit('network-event', deviceId, { type: 'blocked', request, rule });
    });
    networkService.on('request-modified', (request, rule) => {
      this.emit('network-event', deviceId, { type: 'modified', request, rule });
    });
    networkService.on('request-mocked', (request, rule) => {
      this.emit('network-event', deviceId, { type: 'mocked', request, rule });
    });

    // Apply global settings to new network service
    if (this.globalInterceptEnabled) {
      networkService.setInterceptRules(this.globalInterceptRules);
      networkService.enableIntercept().catch((e) => {
        console.log('[CdpPool] Failed to enable intercept for new client:', e);
      });
    }

    this.clients.set(deviceId, client);
    console.log(`[CdpPool] stored client for ${deviceId}, total clients:`, this.clients.size);
    this.emit('client-connected', deviceId);
    return client;
  }

  async setInterceptEnabled(enabled: boolean): Promise<void> {
    this.globalInterceptEnabled = enabled;
    for (const [deviceId, networkService] of this.networkServices) {
      if (enabled) {
        networkService.setInterceptRules(this.globalInterceptRules);
        await networkService.enableIntercept().catch((e) => {
          console.log('[CdpPool] Failed to enable intercept for', deviceId, e);
        });
      } else {
        await networkService.disableIntercept().catch((e) => {
          console.log('[CdpPool] Failed to disable intercept for', deviceId, e);
        });
      }
    }
  }

  async setInterceptRules(rules: InterceptRule[]): Promise<void> {
    this.globalInterceptRules = rules;
    for (const networkService of this.networkServices.values()) {
      networkService.setInterceptRules(rules);
      if (this.globalInterceptEnabled) {
        // Refresh the intercept with new rules
        await networkService.disableIntercept().catch(() => {});
        await networkService.enableIntercept().catch((e) => {
          console.log('[CdpPool] Failed to re-enable intercept with new rules:', e);
        });
      }
    }
  }

  getInterceptRules(): InterceptRule[] {
    return [...this.globalInterceptRules];
  }

  isInterceptEnabled(): boolean {
    return this.globalInterceptEnabled;
  }

  getNetworkService(deviceId: string): NetworkService | undefined {
    return this.networkServices.get(deviceId);
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
   * Uses Target.getTargets (browser-safe) to discover page targets.
   * Returns a page-level WebSocket URL if found, otherwise the original URL.
   */
  private testCdpConnection(wsUrl: string): Promise<string> {
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
        console.log(`[CdpPool] WebSocket open, sending Target.getTargets`);
        ws.send(JSON.stringify({ id: 1, method: 'Target.getTargets', params: {} }));
      });

      ws.on('message', (data: Buffer) => {
        try {
          const msg = JSON.parse(data.toString());
          console.log(`[CdpPool] CDP test received: id=${msg.id} method=${msg.method} result=${JSON.stringify(msg.result)?.substring(0, 200)}`);
          clearTimeout(timeout);
          resolved = true;
          ws.close();

          if (msg.error) {
            console.log(`[CdpPool] Target.getTargets error: ${msg.error.message}, falling back to ${wsUrl}`);
            resolve(wsUrl);
            return;
          }

          // Discover page targets from browser connection
          const targetInfos = (msg.result as any)?.targetInfos;
          if (Array.isArray(targetInfos)) {
            const pageTarget = targetInfos.find((t: any) => t.type === 'page' && t.targetId);
            if (pageTarget) {
              // Prefer webSocketDebuggerUrl if available
              if (pageTarget.webSocketDebuggerUrl) {
                console.log(`[CdpPool] Found page target, using: ${pageTarget.webSocketDebuggerUrl}`);
                resolve(pageTarget.webSocketDebuggerUrl);
                return;
              }
              // Construct page target URL from browser URL
              const portMatch = wsUrl.match(/:(\d+)\//);
              const port = portMatch ? portMatch[1] : '';
              const pageUrl = `ws://127.0.0.1:${port}/devtools/page/${pageTarget.targetId}`;
              console.log(`[CdpPool] Found page target via Target.getTargets, using: ${pageUrl}`);
              resolve(pageUrl);
              return;
            }
          }

          console.log(`[CdpPool] No page targets found, falling back to ${wsUrl}`);
          resolve(wsUrl);
        } catch (e) {
          console.log(`[CdpPool] CDP test parse error: ${e}`);
          resolve(wsUrl);
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

  /**
   * List all available CDP targets across the given ports.
   * Returns an array of target descriptors with their port of origin.
   */
  async listTargets(ports: number[]): Promise<Array<{ port: number; id: string; type: string; title: string; url: string; webSocketDebuggerUrl: string }>> {
    const allTargets: Array<{ port: number; id: string; type: string; title: string; url: string; webSocketDebuggerUrl: string }> = [];
    for (const port of ports) {
      try {
        const targets = await this.queryAllTargets(port);
        for (const t of targets) {
          allTargets.push({ port, ...t });
        }
      } catch {
        // skip unreachable ports
      }
    }
    return allTargets;
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
      this.networkServices.delete(deviceId);
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

  private queryAllTargets(port: number): Promise<Array<{ id: string; type: string; title: string; url: string; webSocketDebuggerUrl: string }>> {
    return new Promise((resolve) => {
      const req = http.get(`http://127.0.0.1:${port}/json`, (res: any) => {
        let data = '';
        res.on('data', (chunk: Buffer) => (data += chunk));
        res.on('end', () => {
          if (!data) { resolve([]); return; }
          try {
            const targets = JSON.parse(data);
            if (!Array.isArray(targets)) { resolve([]); return; }
            const result = targets
              .filter((t: any) => t.webSocketDebuggerUrl)
              .map((t: any) => ({
                id: t.id || '',
                type: t.type || 'page',
                title: t.title || '',
                url: t.url || '',
                webSocketDebuggerUrl: t.webSocketDebuggerUrl,
              }));
            resolve(result);
          } catch {
            resolve([]);
          }
        });
      });
      req.on('error', () => resolve([]));
      req.setTimeout(5000, () => { req.destroy(); resolve([]); });
    });
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
