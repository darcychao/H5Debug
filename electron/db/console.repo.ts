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
}

export function insertOverride(override: ConsoleOverrideRow): void {
  const db = getDatabase();
  db.run(
    'INSERT INTO console_override (id, method_name, override_code, description, enabled, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [override.id, override.method_name, override.override_code, override.description, override.enabled, override.created_at],
  );
  saveDatabase();
}

export function updateOverride(id: string, updates: Partial<ConsoleOverrideRow>): void {
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
  db.run(`UPDATE console_override SET ${fields.join(', ')} WHERE id = ?`, values);
  saveDatabase();
}

export function deleteOverride(id: string): void {
  const db = getDatabase();
  db.run('DELETE FROM console_override WHERE id = ?', [id]);
  saveDatabase();
}
