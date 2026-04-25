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
}

export function insertPlugin(plugin: PluginRow): void {
  const db = getDatabase();
  db.run(
    'INSERT INTO plugin (id, name, version, description, author, enabled, installed_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [plugin.id, plugin.name, plugin.version, plugin.description, plugin.author, plugin.enabled, plugin.installed_at],
  );
  saveDatabase();
}

export function updatePlugin(id: string, updates: Partial<PluginRow>): void {
  const db = getDatabase();
  const fields: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(updates)) {
    if (key === 'id') continue;
    fields.push(`${key} = ?`);
    values.push(value);
  }

  if (fields.length === 0) return;
  values.push(id);
  db.run(`UPDATE plugin SET ${fields.join(', ')} WHERE id = ?`, values);
  saveDatabase();
}

export function deletePlugin(id: string): void {
  const db = getDatabase();
  db.run('DELETE FROM plugin WHERE id = ?', [id]);
  saveDatabase();
}
