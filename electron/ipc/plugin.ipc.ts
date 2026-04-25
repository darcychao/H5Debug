import { ipcMain } from 'electron';
import { PluginManager } from '../services/plugin/plugin-manager';

export function registerPluginIpc(pluginManager: PluginManager) {
  ipcMain.handle('plugin:crud', async (_event, action: string, data: any) => {
    switch (action) {
      case 'list':
        return pluginManager.listPlugins();
      case 'enable':
        pluginManager.enable(data.id);
        return { success: true };
      case 'disable':
        pluginManager.disable(data.id);
        return { success: true };
      case 'uninstall':
        await pluginManager.uninstall(data.id);
        return { success: true };
      default:
        return { error: `Unknown action: ${action}` };
    }
  });
}
