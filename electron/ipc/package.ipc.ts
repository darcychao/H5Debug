import { ipcMain } from 'electron';
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
}
