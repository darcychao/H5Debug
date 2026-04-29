import { getDatabase, saveDatabase } from './database';

export interface TestCaseRow {
  id: string;
  name: string;
  description: string;
  author: string;
  device_id: string | null;
  steps: string; // JSON
  created_at: number;
  updated_at: number;
}

export function getAllTestCases(): TestCaseRow[] {
  const db = getDatabase();
  try {
    const results = db.exec('SELECT * FROM testcase ORDER BY updated_at DESC');
    if (results.length === 0) return [];
    return results[0].values.map((row) => ({
      id: row[0] as string,
      name: row[1] as string,
      description: row[2] as string,
      author: row[3] as string,
      device_id: row[4] as string | null,
      steps: row[5] as string,
      created_at: row[6] as number,
      updated_at: row[7] as number,
    }));
  } catch (err) {
    console.error('[Database] getAllTestCases error:', err);
    return [];
  }
}

export function getTestCase(id: string): TestCaseRow | null {
  const db = getDatabase();
  try {
    const stmt = db.prepare('SELECT * FROM testcase WHERE id = ?');
    stmt.bind([id]);
    if (!stmt.step()) {
      stmt.free();
      return null;
    }
    const values = stmt.get();
    stmt.free();
    return {
      id: values[0] as string,
      name: values[1] as string,
      description: values[2] as string,
      author: values[3] as string,
      device_id: values[4] as string | null,
      steps: values[5] as string,
      created_at: values[6] as number,
      updated_at: values[7] as number,
    };
  } catch (err) {
    console.error('[Database] getTestCase error:', err);
    return null;
  }
}

export function createTestCase(tc: TestCaseRow): void {
  const db = getDatabase();
  if (!db) {
    console.warn('[Database] createTestCase called but database not initialized');
    return;
  }
  try {
    const stmt = db.prepare(
      'INSERT INTO testcase (id, name, description, author, device_id, steps, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    );
    stmt.bind([tc.id, tc.name, tc.description, tc.author, tc.device_id, tc.steps, tc.created_at, tc.updated_at]);
    stmt.step();
    stmt.free();
    saveDatabase();
    console.log('[Database] Created test case:', tc.id);
  } catch (err) {
    console.error('[Database] createTestCase error:', err);
  }
}

export function updateTestCase(id: string, updates: Partial<TestCaseRow>): void {
  const db = getDatabase();
  if (!db) {
    console.warn('[Database] updateTestCase called but database not initialized');
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

    // Always update updated_at
    fields.push('updated_at = ?');
    values.push(Date.now());
    values.push(id);

    const stmt = db.prepare(`UPDATE testcase SET ${fields.join(', ')} WHERE id = ?`);
    stmt.bind(values);
    stmt.step();
    stmt.free();
    saveDatabase();
    console.log('[Database] Updated test case:', id);
  } catch (err) {
    console.error('[Database] updateTestCase error:', err);
  }
}

export function deleteTestCase(id: string): void {
  const db = getDatabase();
  if (!db) {
    console.warn('[Database] deleteTestCase called but database not initialized');
    return;
  }
  try {
    const stmt = db.prepare('DELETE FROM testcase WHERE id = ?');
    stmt.bind([id]);
    stmt.step();
    stmt.free();
    saveDatabase();
    console.log('[Database] Deleted test case:', id);
  } catch (err) {
    console.error('[Database] deleteTestCase error:', err);
  }
}
