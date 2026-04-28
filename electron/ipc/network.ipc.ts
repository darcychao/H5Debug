import { ipcMain, BrowserWindow } from 'electron';
import { CdpPool } from '../services/cdp/cdp-pool';
import { InterceptRule } from '../services/cdp/network';

let currentMainWindow: BrowserWindow | null = null;
let handlersRegistered = false;
let cdpPoolInstance: CdpPool | null = null;

// Event forwarders (will be attached once)
function forwardNetworkRequest(deviceId: string, request: any) {
  if (currentMainWindow) {
    currentMainWindow.webContents.send('cdp:network:request', { deviceId, request });
  }
}

function forwardNetworkResponse(deviceId: string, response: any) {
  if (currentMainWindow) {
    currentMainWindow.webContents.send('cdp:network:response', { deviceId, response });
  }
}

function forwardNetworkResponseBody(deviceId: string, response: any) {
  if (currentMainWindow) {
    currentMainWindow.webContents.send('cdp:network:response-body', { deviceId, response });
  }
}

function forwardNetworkEvent(deviceId: string, event: any) {
  if (currentMainWindow) {
    currentMainWindow.webContents.send('cdp:network:event', { deviceId, event });
  }
}

export function registerNetworkIpc(cdpPool: CdpPool, mainWindow: BrowserWindow) {
  currentMainWindow = mainWindow;
  cdpPoolInstance = cdpPool;

  // Register ipcMain.handle handlers only once
  if (!handlersRegistered) {
    handlersRegistered = true;

    // Forward network events to renderer
    cdpPool.on('network-request', forwardNetworkRequest);
    cdpPool.on('network-response', forwardNetworkResponse);
    cdpPool.on('network-response-body', forwardNetworkResponseBody);
    cdpPool.on('network-event', forwardNetworkEvent);

    // Enable/disable network intercept
    ipcMain.handle('network:intercept:set-enabled', async (_event, enabled: boolean) => {
      try {
        await cdpPool.setInterceptEnabled(enabled);
        console.log('[network.ipc] Network intercept set to:', enabled);
        return { success: true };
      } catch (e) {
        console.error('[network.ipc] Failed to set intercept enabled:', e);
        return { success: false, error: String(e) };
      }
    });

    // Get current intercept status
    ipcMain.handle('network:intercept:get-enabled', async () => {
      return cdpPool.isInterceptEnabled();
    });

    // Set intercept rules
    ipcMain.handle('network:intercept:set-rules', async (_event, rules: InterceptRule[]) => {
      try {
        await cdpPool.setInterceptRules(rules);
        console.log('[network.ipc] Intercept rules updated, count:', rules.length);
        return { success: true };
      } catch (e) {
        console.error('[network.ipc] Failed to set intercept rules:', e);
        return { success: false, error: String(e) };
      }
    });

    // Get intercept rules
    ipcMain.handle('network:intercept:get-rules', async () => {
      return cdpPool.getInterceptRules();
    });

    // Legacy CDP network enable for backward compatibility
    ipcMain.handle('cdp:network:enable', async (_event, deviceId: string, patterns?: Array<Record<string, string>>) => {
      try {
        const networkService = cdpPool.getNetworkService(deviceId);
        if (networkService) {
          await networkService.enableIntercept(patterns as any);
          return { enabled: true };
        } else {
          // Fall back to global setting
          if (patterns) {
            // If patterns are provided, treat them as rules
            const rules: InterceptRule[] = patterns.map((p, i) => ({
              id: String(i),
              name: `Rule ${i + 1}`,
              urlPattern: p.urlPattern || '*',
              action: 'modify' as const,
              enabled: true,
            }));
            await cdpPool.setInterceptRules(rules);
          }
          await cdpPool.setInterceptEnabled(true);
          return { enabled: true };
        }
      } catch (e) {
        console.error('[network.ipc] cdp:network:enable failed:', e);
        return { enabled: false, error: String(e) };
      }
    });
  }
}
