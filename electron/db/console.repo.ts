import { getDatabase, saveDatabase } from './database';

export interface ConsoleOverrideRow {
  id: string;
  method_name: string;
  override_code: string;
  description: string;
  enabled: number;
  created_at: number;
}

export function getAllOverrides(): ConsoleOverrideRow[] {
  const db = getDatabase();
  if (!db) {
    console.warn('[Database] getAllOverrides called but database not initialized');
    return [];
  }
  try {
    const results = db.exec('SELECT * FROM console_override ORDER BY created_at');
    if (results.length === 0) return [];
    return results[0].values.map((row) => ({
      id: row[0] as string,
      method_name: row[1] as string,
      override_code: row[2] as string,
      description: row[3] as string,
      enabled: row[4] as number,
      created_at: row[5] as number,
    }));
  } catch (err) {
    console.error('[Database] getAllOverrides error:', err);
    return [];
  }
}

export function insertOverride(override: ConsoleOverrideRow): void {
  const db = getDatabase();
  if (!db) {
    console.warn('[Database] insertOverride called but database not initialized');
    return;
  }
  try {
    const stmt = db.prepare(
      'INSERT INTO console_override (id, method_name, override_code, description, enabled, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    );
    stmt.bind([override.id, override.method_name, override.override_code, override.description, override.enabled, override.created_at]);
    stmt.step();
    stmt.free();
    saveDatabase();
    console.log('[Database] Inserted override:', override.id);
  } catch (err) {
    console.error('[Database] insertOverride error:', err);
  }
}

export function updateOverride(id: string, updates: Partial<ConsoleOverrideRow>): void {
  const db = getDatabase();
  if (!db) {
    console.warn('[Database] updateOverride called but database not initialized');
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

    const stmt = db.prepare(`UPDATE console_override SET ${fields.join(', ')} WHERE id = ?`);
    stmt.bind(values);
    stmt.step();
    stmt.free();
    saveDatabase();
    console.log('[Database] Updated override:', id);
  } catch (err) {
    console.error('[Database] updateOverride error:', err);
  }
}

export function deleteOverride(id: string): void {
  const db = getDatabase();
  if (!db) {
    console.warn('[Database] deleteOverride called but database not initialized');
    return;
  }
  try {
    const stmt = db.prepare('DELETE FROM console_override WHERE id = ?');
    stmt.bind([id]);
    stmt.step();
    stmt.free();
    saveDatabase();
    console.log('[Database] Deleted override:', id);
  } catch (err) {
    console.error('[Database] deleteOverride error:', err);
  }
}
