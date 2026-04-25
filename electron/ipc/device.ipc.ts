import { ipcMain, BrowserWindow } from 'electron';
import { DeviceManager, DeviceInfo } from '../services/device/device-manager';

export function registerDeviceIpc(deviceManager: DeviceManager, mainWindow: BrowserWindow) {
  ipcMain.handle('device:list', async () => {
    return deviceManager.listDevices();
  });

  ipcMain.handle('device:connect', async (_event, deviceId: string, deviceType: 'adb' | 'hdc') => {
    return deviceManager.connect(deviceId, deviceType);
  });

  ipcMain.handle('device:disconnect', async (_event, deviceId: string, deviceType: 'adb' | 'hdc') => {
    await deviceManager.disconnect(deviceId, deviceType);
  });

  // Push device changes to renderer
  deviceManager.on('device:changed', (info: DeviceInfo) => {
    mainWindow.webContents.send('device:changed', info);
  });

  deviceManager.on('devices:refreshed', (devices: DeviceInfo[]) => {
    mainWindow.webContents.send('device:changed', devices);
  });
}
