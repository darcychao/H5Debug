import { ipcMain } from 'electron';
import { ConfigManager } from '../services/config/config-manager';

export function registerConfigIpc(configManager: ConfigManager) {
  ipcMain.handle('config:get', async (_event, key?: string) => {
    if (key) return configManager.get(key);
    return configManager.getAll();
  });

  ipcMain.handle('config:set', async (_event, key: string, value: unknown) => {
    configManager.set(key, value);
  });
}
