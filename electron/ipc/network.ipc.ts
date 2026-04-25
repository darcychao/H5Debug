import { ipcMain, BrowserWindow } from 'electron';

export function registerNetworkIpc(mainWindow: BrowserWindow) {
  ipcMain.handle('cdp:network:enable', async (_event, deviceId: string, patterns?: Array<Record<string, string>>) => {
    // Network interception is handled through CDP IPC
    return { enabled: true };
  });
}
