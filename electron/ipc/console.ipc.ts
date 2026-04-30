import { ipcMain } from 'electron';
import {
  getAllOverrides,
  insertOverride,
  updateOverride,
  deleteOverride,
  ConsoleOverrideRow,
} from '../db/database';

export function registerConsoleIpc() {
  ipcMain.handle('console:override:list', async () => {
    const rows = getAllOverrides();
    return rows.map((row) => ({
      id: row.id,
      methodName: row.method_name,
      overrideCode: row.override_code,
      description: row.description,
      enabled: Boolean(row.enabled),
      createdAt: row.created_at,
    }));
  });

  ipcMain.handle('console:override:create', async (_event, override: any) => {
    insertOverride({
      id: override.id,
      method_name: override.methodName,
      override_code: override.overrideCode,
      description: override.description,
      enabled: override.enabled ? 1 : 0,
      created_at: override.createdAt,
    });
    return { success: true };
  });

  ipcMain.handle('console:override:update', async (_event, id: string, updates: any) => {
    const dbUpdates: Partial<ConsoleOverrideRow> = {};
    if (updates.methodName !== undefined) dbUpdates.method_name = updates.methodName;
    if (updates.overrideCode !== undefined) dbUpdates.override_code = updates.overrideCode;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.enabled !== undefined) dbUpdates.enabled = updates.enabled ? 1 : 0;

    if (Object.keys(dbUpdates).length > 0) {
      updateOverride(id, dbUpdates);
    }
    return { success: true };
  });

  ipcMain.handle('console:override:delete', async (_event, id: string) => {
    deleteOverride(id);
    return { success: true };
  });
}
