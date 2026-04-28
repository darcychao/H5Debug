import { ipcMain, BrowserWindow } from 'electron';
import { DeviceManager, DeviceInfo } from '../services/device/device-manager';
import { CdpPool } from '../services/cdp/cdp-pool';

let currentMainWindow: BrowserWindow | null = null;
let handlersRegistered = false;
let deviceManagerInstance: DeviceManager | null = null;
let cdpPoolInstance: CdpPool | null = null;

// Event forwarders
function forwardDeviceChanged(info: DeviceInfo) {
  if (currentMainWindow) {
    currentMainWindow.webContents.send('device:changed', info);
  }
}

function forwardDevicesRefreshed(devices: DeviceInfo[]) {
  if (currentMainWindow) {
    currentMainWindow.webContents.send('device:changed', devices);
  }
}

export function registerDeviceIpc(deviceManager: DeviceManager, cdpPool: CdpPool, mainWindow: BrowserWindow) {
  currentMainWindow = mainWindow;
  deviceManagerInstance = deviceManager;
  cdpPoolInstance = cdpPool;

  if (!handlersRegistered) {
    handlersRegistered = true;

    ipcMain.handle('device:list', async () => {
      return deviceManager.listDevices();
    });

    ipcMain.handle('device:connect', async (_event, deviceId: string, deviceType: 'adb' | 'hdc') => {
      console.log(`[device:connect] called with deviceId=${deviceId}, deviceType=${deviceType}`);
      const key = `${deviceType}:${deviceId}`;

      // Set up port forwarding for browser and WebView, then connect CDP
      const info = await deviceManager.connect(deviceId, deviceType);
      console.log(`[device:connect] port forwarding done, cdpPort=${info.cdpPort}, webviewPorts=${JSON.stringify(info.webviewPorts ?? {})}`);

      // Collect all ports to try: browser port + all WebView ports
      const allPorts: number[] = [];
      if (info.cdpPort) allPorts.push(info.cdpPort);
      if (info.webviewPorts) {
        allPorts.push(...Object.values(info.webviewPorts));
      }
      console.log(`[device:connect] trying CDP ports: ${allPorts.join(', ')}`);

      try {
        await cdpPool.connect(key, allPorts);
        console.log(`[device:connect] CDP connected for ${key}`);
      } catch (err) {
        console.error(`[device:connect] CDP connect failed:`, err);
        throw err;
      }
      info.status = 'connected';
      info.lastActiveAt = Date.now();
      deviceManager.emit('device:changed', info);
      return info;
    });

    ipcMain.handle('device:disconnect', async (_event, deviceId: string, deviceType: 'adb' | 'hdc') => {
      await deviceManager.disconnect(deviceId, deviceType);
      await cdpPool.disconnect(`${deviceType}:${deviceId}`);
    });

    // Debug: check CDP pool status
    ipcMain.handle('debug:cdpStatus', async () => {
      return {
        clientIds: cdpPool.getClientIds(),
        clients: Array.from(cdpPool.getClientIds()).map((id) => {
          const c = cdpPool.getClient(id);
          return { id, connected: c?.connected };
        }),
      };
    });

    // Debug: list available CDP targets from /json
    ipcMain.handle('debug:listProcesses', async (_event, deviceId: string, deviceType: 'adb' | 'hdc') => {
      const service = deviceType === 'adb' ? (deviceManager as any).adb : (deviceManager as any).hdc;
      try {
        const output = await service.shell(deviceId, "ps -A 2>/dev/null || ps");
        const lines = output.split('\n').filter((l: string) => l.trim());
        // Return first 20 lines for debugging
        return { processes: lines.slice(0, 20), total: lines.length };
      } catch (err: any) {
        return { error: err.message };
      }
    });

    // Debug: list unix sockets (for finding webview devtools sockets)
    ipcMain.handle('debug:listSockets', async (_event, deviceId: string, deviceType: 'adb' | 'hdc') => {
      const service = deviceType === 'adb' ? (deviceManager as any).adb : (deviceManager as any).hdc;
      try {
        const result = await service.listWebViewDevToolsSockets(deviceId);
        return result;
      } catch (err: any) {
        return { error: err.message };
      }
    });

    // Debug: list available CDP targets from /json on a given port
    ipcMain.handle('debug:listTargets', async (_event, port: number) => {
      const http = require('http');
      return new Promise((resolve) => {
        const req = http.get(`http://127.0.0.1:${port}/json`, (res: any) => {
          let data = '';
          res.on('data', (chunk: Buffer) => (data += chunk));
          res.on('end', () => {
            resolve({ statusCode: res.statusCode, raw: data.substring(0, 500), length: data.length });
          });
        });
        req.on('error', (err: any) => {
          resolve({ statusCode: 0, raw: '', length: 0, error: err.message });
        });
        req.setTimeout(5000, () => {
          req.destroy();
          resolve({ statusCode: 0, raw: '', length: 0, error: 'timeout' });
        });
      });
    });

    // Debug: list all running processes on device
    ipcMain.handle('debug:listAllProcesses', async (_event, deviceId: string, deviceType: 'adb' | 'hdc') => {
      const service = deviceType === 'adb' ? (deviceManager as any).adb : (deviceManager as any).hdc;
      try {
        const output = await service.shell(deviceId, "ps -A 2>/dev/null | head -50");
        const lines = output.split('\n').filter((l: string) => l.trim());
        return { count: lines.length, processes: lines.slice(0, 30) };
      } catch (err: any) {
        return { error: err.message };
      }
    });

    // Debug: test HTTP connectivity to a port via ADB shell
    ipcMain.handle('debug:queryJsonViaShell', async (_event, deviceId: string, deviceType: 'adb' | 'hdc', port: number) => {
      const service = deviceType === 'adb' ? (deviceManager as any).adb : (deviceManager as any).hdc;
      try {
        const output = await service.queryJsonViaShell(deviceId, port);
        return { port, raw: output };
      } catch (err: any) {
        return { port, error: err.message };
      }
    });

    // Push device changes to renderer
    deviceManager.on('device:changed', forwardDeviceChanged);
    deviceManager.on('devices:refreshed', forwardDevicesRefreshed);
  }
}
