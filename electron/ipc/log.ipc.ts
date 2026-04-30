import { ipcMain, BrowserWindow } from 'electron';
import { DeviceManager } from '../services/device/device-manager';
import { LogService } from '../services/cdp/log';
import { CdpPool } from '../services/cdp/cdp-pool';

let currentMainWindow: BrowserWindow | null = null;
let handlersRegistered = false;
let cdpPoolInstance: CdpPool | null = null;
const logServices: Map<string, LogService> = new Map();

// Capture main process console.log and send to renderer
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;

function forwardToRenderer(level: string, ...args: unknown[]) {
  if (currentMainWindow) {
    const content = args.map(a => {
      if (typeof a === 'object') {
        try { return JSON.stringify(a); } catch { return String(a); }
      }
      return String(a);
    }).join(' ');

    currentMainWindow.webContents.send('log:stream', {
      source: 'device',
      level: level === 'error' ? 'ERROR' : level === 'warn' ? 'WARNING' : level === 'info' ? 'INFO' : 'DEBUG',
      content,
      timestamp: Date.now(),
    });
  }
}

// Override console methods to capture output
console.log = (...args: unknown[]) => {
  originalConsoleLog.apply(console, args);
  forwardToRenderer('log', ...args);
};
console.error = (...args: unknown[]) => {
  originalConsoleError.apply(console, args);
  forwardToRenderer('error', ...args);
};
console.warn = (...args: unknown[]) => {
  originalConsoleWarn.apply(console, args);
  forwardToRenderer('warn', ...args);
};
console.info = (...args: unknown[]) => {
  originalConsoleInfo.apply(console, args);
  forwardToRenderer('info', ...args);
};

export function registerLogIpc(deviceManager: DeviceManager, cdpPool: CdpPool, mainWindow: BrowserWindow) {
  currentMainWindow = mainWindow;
  cdpPoolInstance = cdpPool;

  if (!handlersRegistered) {
    handlersRegistered = true;

    ipcMain.handle('log:stream', async (_event, deviceId: string) => {
      // Enable Log domain for the device if not already enabled
      const client = cdpPool.getClient(deviceId);
      if (!client) {
        return { enabled: false, error: 'CDP client not connected' };
      }

      let logService = logServices.get(deviceId);
      if (!logService) {
        logService = new LogService(client);
        logServices.set(deviceId, logService);
      }

      try {
        await logService.enable();
        logService.onEntryAdded((entry) => {
          if (currentMainWindow) {
            currentMainWindow.webContents.send('log:stream', {
              source: 'cdp',
              level: entry.level,
              content: entry.text,
              timestamp: entry.timestamp,
              url: entry.url,
              lineNumber: entry.lineNumber,
            });
          }
        });
        return { enabled: true };
      } catch (err) {
        return { enabled: false, error: String(err) };
      }
    });

    ipcMain.handle('log:disable', async (_event, deviceId: string) => {
      const logService = logServices.get(deviceId);
      if (logService) {
        await logService.disable();
        logServices.delete(deviceId);
      }
      return { success: true };
    });

    // Forward CDP log events to renderer - auto-enable Log domain when client connects
    cdpPool.on('event', (deviceId: string, method: string, params: unknown) => {
      if (method === 'Log.entryAdded' && currentMainWindow) {
        const entry = (params as any)?.entry;
        if (entry) {
          currentMainWindow.webContents.send('log:stream', {
            source: 'cdp',
            level: entry.level,
            content: entry.text,
            timestamp: entry.timestamp,
            url: entry.url,
            lineNumber: entry.lineNumber,
          });
        }
      }
    });

    // Auto-enable Log domain for newly connected clients
    cdpPool.on('client-connected', (deviceId: string) => {
      const client = cdpPool.getClient(deviceId);
      if (client) {
        const logService = new LogService(client);
        // Also enable Page domain to ensure console events are captured
        client.send('Page.enable').catch(() => {});
        logService.enable()
          .then(() => {
            logService.onEntryAdded((entry) => {
              if (currentMainWindow) {
                currentMainWindow.webContents.send('log:stream', {
                  source: 'cdp',
                  level: entry.level,
                  content: entry.text,
                  timestamp: entry.timestamp,
                  url: entry.url,
                  lineNumber: entry.lineNumber,
                });
              }
            });
          })
          .catch(() => {});
      }
    });
  }
}
