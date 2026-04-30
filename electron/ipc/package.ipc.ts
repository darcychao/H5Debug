import { ipcMain, dialog, BrowserWindow } from 'electron';
import { PackageManager } from '../services/package/package-manager';

export function registerPackageIpc(pkgManager: PackageManager) {
  ipcMain.handle('package:list', async (_event, deviceId: string, type: 'adb' | 'hdc') => {
    return pkgManager.listPackages(deviceId, type);
  });

  ipcMain.handle('package:install', async (_event, deviceId: string, type: 'adb' | 'hdc', packagePath: string) => {
    return pkgManager.install(deviceId, type, packagePath);
  });

  ipcMain.handle('package:uninstall', async (_event, deviceId: string, type: 'adb' | 'hdc', packageName: string) => {
    return pkgManager.uninstall(deviceId, type, packageName);
  });

  ipcMain.handle('package:clear', async (_event, deviceId: string, type: 'adb' | 'hdc', packageName: string) => {
    return pkgManager.clearCache(deviceId, type, packageName);
  });

  ipcMain.handle('package:upload', async (event, deviceId: string, type: 'adb' | 'hdc') => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const filters = type === 'adb'
      ? [{ name: 'APK Files', extensions: ['apk'] }, { name: 'All Files', extensions: ['*'] }]
      : [{ name: 'HAP Files', extensions: ['hap', 'app'] }, { name: 'All Files', extensions: ['*'] }];

    const result = await dialog.showOpenDialog(win!, {
      title: type === 'adb' ? 'Select APK to Install' : 'Select HAP to Install',
      properties: ['openFile'],
      filters,
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, cancelled: true };
    }

    const packagePath = result.filePaths[0];
    try {
      const output = await pkgManager.install(deviceId, type, packagePath);
      return { success: true, path: packagePath, output };
    } catch (err) {
      return { success: false, cancelled: false, error: String(err) };
    }
  });
}
