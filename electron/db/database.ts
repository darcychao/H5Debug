import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

let db: Database.Database | null = null;
let dbInitialized = false;

// Get data directory
function getDataDir(): string {
  try {
    const electron = require('electron');
    if (electron.app) {
      return path.join(electron.app.getPath('userData'), 'data');
    }
  } catch (e) {
    // Fallback
  }
  return path.join(process.cwd(), 'data');
}

function getDbPath(): string {
  const dataDir = getDataDir();
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'h5debug.db');
}

export async function initDatabase(): Promise<void> {
  if (dbInitialized) return;

  const dbPath = getDbPath();
  console.log('[Database] Opening database at:', dbPath);

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');

  // Create tables
  runMigrations();

  dbInitialized = true;
}

function runMigrations(): void {
  if (!db) return;

  // Test cases table
  db.exec(`
    CREATE TABLE IF NOT EXISTS testcase (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      author TEXT NOT NULL DEFAULT '',
      device_id TEXT,
      steps TEXT NOT NULL DEFAULT '[]',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  // Network records table (optional)
  db.exec(`
    CREATE TABLE IF NOT EXISTS network_record (
      id TEXT PRIMARY KEY,
      request_id TEXT,
      url TEXT NOT NULL,
      method TEXT NOT NULL,
      headers TEXT DEFAULT '{}',
      post_data TEXT,
      resource_type TEXT DEFAULT '',
      status INTEGER DEFAULT 0,
      status_text TEXT DEFAULT '',
      response_headers TEXT DEFAULT '{}',
      response_body TEXT,
      timestamp INTEGER NOT NULL
    );
  `);

  // Console overrides table (optional)
  db.exec(`
    CREATE TABLE IF NOT EXISTS console_override (
      id TEXT PRIMARY KEY,
      method_name TEXT NOT NULL,
      override_code TEXT NOT NULL,
      description TEXT DEFAULT '',
      enabled INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL
    );
  `);

  // Plugins table (optional)
  db.exec(`
    CREATE TABLE IF NOT EXISTS plugin (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      version TEXT DEFAULT '1.0.0',
      description TEXT DEFAULT '',
      author TEXT DEFAULT '',
      enabled INTEGER DEFAULT 1,
      installed_at INTEGER NOT NULL
    );
  `);
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export function saveDatabase(): void {
  // better-sqlite3 WAL mode automatically persists
}

export function closeDatabase(): void {
  if (db) {
    db.pragma('analysis_limit = 0');
    db.close();
    db = null;
    dbInitialized = false;
  }
}

// Test case repository functions
export function getAllTestCases(): any[] {
  if (!db) initDatabase();

  const stmt = db.prepare('SELECT * FROM testcase ORDER BY updated_at DESC');
  return stmt.all();
}

export function getTestCase(id: string): any | null {
  if (!db) initDatabase();

  const stmt = db.prepare('SELECT * FROM testcase WHERE id = ?');
  return stmt.get(id) || null;
}

export function createTestCase(tc: any): void {
  if (!db) initDatabase();

  const stmt = db.prepare(`
    INSERT INTO testcase (id, name, description, author, device_id, steps, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    tc.id,
    tc.name,
    tc.description,
    tc.author,
    tc.device_id,
    tc.steps,
    tc.created_at,
    tc.updated_at
  );
}

export function updateTestCase(id: string, updates: any): void {
  if (!db) initDatabase();

  const fields: string[] = [];
  const values: any[] = [];

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
  stmt.run(...values);
}

export function deleteTestCase(id: string): void {
  if (!db) initDatabase();

  const stmt = db.prepare('DELETE FROM testcase WHERE id = ?');
  stmt.run(id);
}
