import { ipcMain, BrowserWindow } from 'electron';
import { CdpPool } from '../services/cdp/cdp-pool';

export function registerCdpIpc(cdpPool: CdpPool, mainWindow: BrowserWindow) {
  ipcMain.handle('cdp:screencast:start', async (_event, deviceId: string, options?: Record<string, unknown>) => {
    const client = cdpPool.getClient(deviceId);
    if (!client) throw new Error(`No CDP client for device: ${deviceId}`);
    return client.send('Page.startScreencast', options || { format: 'jpeg', quality: 80, maxWidth: 720, maxHeight: 1280 });
  });

  ipcMain.handle('cdp:screencast:stop', async (_event, deviceId: string) => {
    const client = cdpPool.getClient(deviceId);
    if (!client) throw new Error(`No CDP client for device: ${deviceId}`);
    return client.send('Page.stopScreencast');
  });

  ipcMain.handle('cdp:input:click', async (_event, deviceId: string, x: number, y: number) => {
    const client = cdpPool.getClient(deviceId);
    if (!client) throw new Error(`No CDP client for device: ${deviceId}`);
    await client.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await client.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  });

  ipcMain.handle('cdp:input:type', async (_event, deviceId: string, text: string) => {
    const client = cdpPool.getClient(deviceId);
    if (!client) throw new Error(`No CDP client for device: ${deviceId}`);
    return client.send('Input.insertText', { text });
  });

  ipcMain.handle('cdp:input:scroll', async (_event, deviceId: string, x: number, y: number, deltaX: number, deltaY: number) => {
    const client = cdpPool.getClient(deviceId);
    if (!client) throw new Error(`No CDP client for device: ${deviceId}`);
    return client.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x, y, deltaX, deltaY });
  });

  ipcMain.handle('cdp:network:enable', async (_event, deviceId: string, patterns?: Array<Record<string, string>>) => {
    const client = cdpPool.getClient(deviceId);
    if (!client) throw new Error(`No CDP client for device: ${deviceId}`);
    return client.send('Fetch.enable', { patterns: patterns || [{ urlPattern: '*' }] });
  });

  ipcMain.handle('cdp:console:evaluate', async (_event, deviceId: string, expression: string) => {
    const client = cdpPool.getClient(deviceId);
    if (!client) throw new Error(`No CDP client for device: ${deviceId}`);
    return client.send('Runtime.evaluate', { expression, returnByValue: true });
  });

  ipcMain.handle('cdp:dom:getDocument', async (_event, deviceId: string, depth?: number) => {
    const client = cdpPool.getClient(deviceId);
    if (!client) throw new Error(`No CDP client for device: ${deviceId}`);
    return client.send('DOM.getDocument', { depth: depth ?? -1 });
  });

  // Forward CDP events to renderer
  cdpPool.on('event', (deviceId: string, method: string, params: unknown) => {
    if (method === 'Page.screencastFrame') {
      mainWindow.webContents.send('cdp:screencast:frame', { deviceId, params });
    }
    if (method === 'Fetch.requestPaused') {
      mainWindow.webContents.send('cdp:network:request', { deviceId, params });
    }
  });
}
