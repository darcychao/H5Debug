import { ipcMain } from 'electron';

export function registerPortProxyIpc() {
  ipcMain.handle('portproxy:crud', async (_event, action: string, data: any) => {
    // Port proxy rules are managed in renderer store for now
    // In production, these would be persisted to DB
    return { action, data };
  });
}
