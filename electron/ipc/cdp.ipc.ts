import { ipcMain, BrowserWindow } from 'electron';
import { CdpPool } from '../services/cdp/cdp-pool';

export function registerCdpIpc(cdpPool: CdpPool, mainWindow: BrowserWindow) {
  ipcMain.handle('cdp:screencast:start', async (_event, deviceId: string, options?: Record<string, unknown>) => {
    console.log(`[cdp:screencast:start] deviceId=${deviceId}, pool size=${cdpPool.getClientIds().length}, ids=${JSON.stringify(cdpPool.getClientIds())}`);
    let client = cdpPool.getClient(deviceId);

    // If client doesn't exist or is disconnected, try to reconnect
    if (!client || !client.connected) {
      console.log(`[cdp:screencast:start] client missing or disconnected, attempting reconnect...`);
      try {
        const deviceManager = (global as any).__deviceManager;
        const info = deviceManager?.getDevice(deviceId);
        if (!info || info.cdpPort === 0) {
          throw new Error(`请先在设备列表中点击 "连接" 按钮连接设备 (Device not connected. Click "Connect" in the device list first.)`);
        }
        const allPorts: number[] = [];
        if (info.cdpPort) allPorts.push(info.cdpPort);
        if (info.webviewPorts) allPorts.push(...Object.values(info.webviewPorts));
        console.log(`[cdp:screencast:start] reconnecting with ports: ${allPorts.join(',')}`);
        client = await cdpPool.connect(deviceId, allPorts);
        console.log(`[cdp:screencast:start] reconnect succeeded, connected=${client?.connected}`);
      } catch (err) {
        console.error(`[cdp:screencast:start] reconnect failed:`, err);
        throw err;
      }
    }

    if (!client || !client.connected) {
      throw new Error(`设备连接失败，请重新连接设备 (CDP connection failed. Please reconnect the device.)`);
    }

    console.log(`[cdp:screencast:start] client connected=${client.connected}, calling Page.enable...`);
    try {
      const enableResult = await client.send('Page.enable');
      console.log(`[cdp:screencast:start] Page.enable result:`, JSON.stringify(enableResult)?.substring(0, 100));
    } catch (e) {
      console.error(`[cdp:screencast:start] Page.enable FAILED:`, e);
      throw e;
    }
    console.log(`[cdp:screencast:start] calling Page.startScreencast with options:`, options || { format: 'jpeg', quality: 80, maxWidth: 720, maxHeight: 1280 });
    try {
      const result = await client.send('Page.startScreencast', options || { format: 'jpeg', quality: 80, maxWidth: 720, maxHeight: 1280 });
      console.log(`[cdp:screencast:start] Page.startScreencast SUCCESS, result:`, JSON.stringify(result)?.substring(0, 100));
      return result;
    } catch (e) {
      console.error(`[cdp:screencast:start] Page.startScreencast FAILED:`, e);
      throw e;
    }
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
      const p = params as { data?: string; metadata?: unknown; sessionId?: string };
      console.log(`[cdp:screencast:frame] deviceId=${deviceId}, hasData=${!!p?.data}, dataLen=${p?.data?.length}, sessionId=${p?.sessionId}`);
      mainWindow.webContents.send('cdp:screencast:frame', { deviceId, params });
    }
    if (method === 'Fetch.requestPaused') {
      mainWindow.webContents.send('cdp:network:request', { deviceId, params });
    }
  });
}
