import { ipcMain, BrowserWindow } from 'electron';
import { DeviceManager } from '../services/device/device-manager';

let handlersRegistered = false;

export function registerLogIpc(deviceManager: DeviceManager, mainWindow: BrowserWindow) {
  if (!handlersRegistered) {
    handlersRegistered = true;
    ipcMain.handle('log:stream', async (_event, deviceId: string) => {
      // This would set up log stream from device
      // For now, we push logs via CDP Log domain
      return { enabled: true };
    });
  }
}
