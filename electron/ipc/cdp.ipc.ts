import { ipcMain, BrowserWindow } from 'electron';
import { CdpPool } from '../services/cdp/cdp-pool';

let currentMainWindow: BrowserWindow | null = null;
let handlersRegistered = false;
let cdpPoolInstance: CdpPool | null = null;

function forwardCdpEvent(deviceId: string, method: string, params: unknown) {
  if (!currentMainWindow) return;

  if (method === 'Page.screencastFrame') {
    const p = params as { data?: string; metadata?: unknown; sessionId?: string };
    try {
      currentMainWindow.webContents.send('cdp:screencast:frame', { deviceId, params });
    } catch (e) {
      // Window might be closing
    }
    // Ack the frame (still ack even if send failed — Chrome needs the ack either way)
    if (cdpPoolInstance) {
      const client = cdpPoolInstance.getClient(deviceId);
      if (client?.connected && p.sessionId !== undefined) {
        client.send('Page.screencastFrameAck', { sessionId: p.sessionId }).catch(() => {});
      }
    }
  }
  if (method === 'Fetch.requestPaused') {
    currentMainWindow.webContents.send('cdp:network:request', { deviceId, params });
  }
}

export function registerCdpIpc(cdpPool: CdpPool, mainWindow: BrowserWindow) {
  currentMainWindow = mainWindow;
  cdpPoolInstance = cdpPool;

  if (!handlersRegistered) {
    handlersRegistered = true;

    async function getOrReconnect(deviceId: string) {
      let client = cdpPool.getClient(deviceId);
      if (client?.connected) return client;

      const deviceManager = (global as any).__deviceManager;
      const info = deviceManager?.getDevice(deviceId);
      if (!info || info.cdpPort === 0) {
        throw new Error(`设备未连接，请先点击"连接" (Device not connected)`);
      }
      const allPorts: number[] = [];
      if (info.cdpPort) allPorts.push(info.cdpPort);
      if (info.webviewPorts) allPorts.push(...Object.values(info.webviewPorts));
      return cdpPool.connect(deviceId, allPorts);
    }

    // Send with auto-reconnect: if send fails because disconnected, reconnect and retry once
    async function sendWithReconnect(deviceId: string, method: string, params?: Record<string, unknown>) {
      const MAX_RETRIES = 2;
      let lastError: Error | null = null;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          const client = await getOrReconnect(deviceId);
          return await client.send(method, params);
        } catch (err: any) {
          lastError = err;
          const msg = err?.message || String(err);
          // Only retry if it's a connection error
          if (msg.includes('not connected') || msg.includes('closed') || msg.includes('timeout')) {
            console.log(`[cdp] ${method} failed (attempt ${attempt + 1}), reconnecting: ${msg}`);
            // Force reconnect on next attempt by clearing stale client
            cdpPool.disconnect(deviceId).catch(() => {});
            continue;
          }
          // Other errors (e.g. invalid CDP command) - don't retry
          throw err;
        }
      }
      throw lastError;
    }

    ipcMain.handle('cdp:screencast:start', async (_event, deviceId: string, options?: Record<string, unknown>) => {
      try {
        const client = await getOrReconnect(deviceId);
        // Page.enable is optional — not supported on browser/service-worker targets (e.g. Android WebView)
        try { await client.send('Page.enable'); } catch {}
        return await client.send('Page.startScreencast', options || { format: 'jpeg', quality: 80, maxWidth: 720, maxHeight: 1280 });
      } catch (err: any) {
        console.error('[cdp:screencast:start] failed:', err.message);
        throw new Error(`连接失败: ${err.message}`);
      }
    });

    ipcMain.handle('cdp:screencast:stop', async (_event, deviceId: string) => {
      try {
        return await sendWithReconnect(deviceId, 'Page.stopScreencast');
      } catch {
        return null;
      }
    });

    ipcMain.handle('cdp:input:click', async (_event, deviceId: string, x: number, y: number) => {
      try {
        await sendWithReconnect(deviceId, 'Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
        return await sendWithReconnect(deviceId, 'Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
      } catch {
        return null;
      }
    });

    ipcMain.handle('cdp:input:type', async (_event, deviceId: string, text: string) => {
      return sendWithReconnect(deviceId, 'Input.insertText', { text });
    });

    ipcMain.handle('cdp:input:scroll', async (_event, deviceId: string, x: number, y: number, deltaX: number, deltaY: number) => {
      // Scroll fails silently - no point showing error for a missed scroll frame
      try {
        return await sendWithReconnect(deviceId, 'Input.dispatchMouseEvent', { type: 'mouseWheel', x, y, deltaX, deltaY });
      } catch {
        return null;
      }
    });

    ipcMain.handle('cdp:console:evaluate', async (_event, deviceId: string, expression: string) => {
      return sendWithReconnect(deviceId, 'Runtime.evaluate', { expression, returnByValue: true });
    });

    ipcMain.handle('cdp:dom:getDocument', async (_event, deviceId: string, depth?: number) => {
      return sendWithReconnect(deviceId, 'DOM.getDocument', { depth: depth ?? -1 });
    });

    ipcMain.handle('cdp:dom:querySelector', async (_event, deviceId: string, nodeId: number, selector: string) => {
      return sendWithReconnect(deviceId, 'DOM.querySelector', { nodeId, selector });
    });

    ipcMain.handle('cdp:dom:getAttributes', async (_event, deviceId: string, nodeId: number) => {
      return sendWithReconnect(deviceId, 'DOM.getAttributes', { nodeId });
    });

    ipcMain.handle('cdp:dom:resolveNode', async (_event, deviceId: string, nodeId: number) => {
      return sendWithReconnect(deviceId, 'DOM.resolveNode', { nodeId });
    });

    ipcMain.handle('cdp:dom:getElements', async (_event, deviceId: string) => {
      // Use Runtime.evaluate to get DOM elements via JavaScript (more reliable than CDP DOM)
      return sendWithReconnect(deviceId, 'Runtime.evaluate', {
        expression: `(()=>{
          const els = [];
          const seen = new Set();
          const walk = (node) => {
            if (!node || node.nodeType !== 1) return;
            const tag = node.tagName?.toLowerCase();
            if (!tag || tag === 'script' || tag === 'style' || tag === 'noscript' || tag === 'svg') return;

            const rect = node.getBoundingClientRect?.();
            if (rect && (rect.width === 0 || rect.height === 0)) return;

            const path = [];
            let n = node;
            while (n && n !== document.body) {
              const t = n.tagName?.toLowerCase();
              if (t) {
                if (n.id) path.unshift('#' + n.id);
                else {
                  let cls = '';
                  if (n.className && typeof n.className === 'string') {
                    const cs = n.className.split(/\\s+/).filter(Boolean);
                    if (cs[0]) cls = '.' + cs[0];
                  }
                  path.unshift(t + cls);
                }
              }
              n = n.parentElement;
            }

            const uniqueKey = path.join('>') || tag;
            if (seen.has(uniqueKey)) return;
            seen.add(uniqueKey);

            els.push({
              tagName: node.tagName,
              id: node.id || '',
              className: (typeof node.className === 'string') ? node.className : '',
              text: (node.textContent || '').trim().slice(0, 100),
              hasId: !!node.id,
              hasClass: !!(node.className && typeof node.className === 'string' && node.className.trim()),
              path: path.join(' > ')
            });

            for (let child of node.children) {
              walk(child);
            }
          };
          walk(document.body);
          return els.slice(0, 2000);
        })()`,
        returnByValue: true,
      });
    });

    // List all available CDP targets for a device
    ipcMain.handle('cdp:listTargets', async (_event, deviceId: string) => {
      const deviceManager = (global as any).__deviceManager;
      const info = deviceManager?.getDevice(deviceId);
      if (!info) return [];
      const allPorts: number[] = [];
      if (info.cdpPort) allPorts.push(info.cdpPort);
      if (info.webviewPorts) allPorts.push(...Object.values(info.webviewPorts));
      return cdpPool.listTargets(allPorts);
    });

    // Switch to a specific CDP target by its webSocketDebuggerUrl
    ipcMain.handle('cdp:selectTarget', async (_event, deviceId: string, wsUrl: string) => {
      console.log(`[cdp:selectTarget] switching ${deviceId} to ${wsUrl}`);
      // Stop screencast on current target before switching
      try { await sendWithReconnect(deviceId, 'Page.stopScreencast'); } catch {}
      // Disconnect and reconnect to the specified target
      await cdpPool.disconnect(deviceId);
      return cdpPool.connect(deviceId, [], wsUrl);
    });

    // Forward CDP events to renderer
    cdpPool.on('event', forwardCdpEvent);
  }
}
