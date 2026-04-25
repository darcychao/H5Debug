import { ipcMain } from 'electron';

export function registerConsoleIpc() {
  ipcMain.handle('cdp:console:evaluate', async (_event, deviceId: string, expression: string) => {
    // Console evaluation is handled through CDP IPC
    return { result: null };
  });
}
