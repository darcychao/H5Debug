import { getDatabase, saveDatabase } from './database';

export interface PluginRow {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  enabled: number;
  installed_at: number;
}

export function getAllPlugins(): PluginRow[] {
  const db = getDatabase();
  if (!db) {
    console.warn('[Database] getAllPlugins called but database not initialized');
    return [];
  }
  try {
    const results = db.exec('SELECT * FROM plugin ORDER BY installed_at');
    if (results.length === 0) return [];
    return results[0].values.map((row) => ({
      id: row[0] as string,
      name: row[1] as string,
      version: row[2] as string,
      description: row[3] as string,
      author: row[4] as string,
      enabled: row[5] as number,
      installed_at: row[6] as number,
    }));
  } catch (err) {
    console.error('[Database] getAllPlugins error:', err);
    return [];
  }
}

export function insertPlugin(plugin: PluginRow): void {
  const db = getDatabase();
  if (!db) {
    console.warn('[Database] insertPlugin called but database not initialized');
    return;
  }
  try {
    const stmt = db.prepare(
      'INSERT INTO plugin (id, name, version, description, author, enabled, installed_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    );
    stmt.bind([plugin.id, plugin.name, plugin.version, plugin.description, plugin.author, plugin.enabled, plugin.installed_at]);
    stmt.step();
    stmt.free();
    saveDatabase();
    console.log('[Database] Inserted plugin:', plugin.id);
  } catch (err) {
    console.error('[Database] insertPlugin error:', err);
  }
}

export function updatePlugin(id: string, updates: Partial<PluginRow>): void {
  const db = getDatabase();
  if (!db) {
    console.warn('[Database] updatePlugin called but database not initialized');
    return;
  }
  try {
    const fields: string[] = [];
    const values: unknown[] = [];

    for (const [key, value] of Object.entries(updates)) {
      if (key === 'id') continue;
      fields.push(`${key} = ?`);
      values.push(value);
    }

    if (fields.length === 0) return;
    values.push(id);

    const stmt = db.prepare(`UPDATE plugin SET ${fields.join(', ')} WHERE id = ?`);
    stmt.bind(values);
    stmt.step();
    stmt.free();
    saveDatabase();
    console.log('[Database] Updated plugin:', id);
  } catch (err) {
    console.error('[Database] updatePlugin error:', err);
  }
}

export function deletePlugin(id: string): void {
  const db = getDatabase();
  if (!db) {
    console.warn('[Database] deletePlugin called but database not initialized');
    return;
  }
  try {
    const stmt = db.prepare('DELETE FROM plugin WHERE id = ?');
    stmt.bind([id]);
    stmt.step();
    stmt.free();
    saveDatabase();
    console.log('[Database] Deleted plugin:', id);
  } catch (err) {
    console.error('[Database] deletePlugin error:', err);
  }
}
