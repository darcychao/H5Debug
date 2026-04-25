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
}

export function getTestCase(id: string): TestCaseRow | null {
  const db = getDatabase();
  const results = db.exec('SELECT * FROM testcase WHERE id = ?', [id]);
  if (results.length === 0 || results[0].values.length === 0) return null;
  const row = results[0].values[0];
  return {
    id: row[0] as string,
    name: row[1] as string,
    description: row[2] as string,
    author: row[3] as string,
    device_id: row[4] as string | null,
    steps: row[5] as string,
    created_at: row[6] as number,
    updated_at: row[7] as number,
  };
}

export function createTestCase(tc: TestCaseRow): void {
  const db = getDatabase();
  db.run(
    'INSERT INTO testcase (id, name, description, author, device_id, steps, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [tc.id, tc.name, tc.description, tc.author, tc.device_id, tc.steps, tc.created_at, tc.updated_at],
  );
  saveDatabase();
}

export function updateTestCase(id: string, updates: Partial<TestCaseRow>): void {
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
  db.run(`UPDATE testcase SET ${fields.join(', ')} WHERE id = ?`, values);
  saveDatabase();
}

export function deleteTestCase(id: string): void {
  const db = getDatabase();
  db.run('DELETE FROM testcase WHERE id = ?', [id]);
  saveDatabase();
}
