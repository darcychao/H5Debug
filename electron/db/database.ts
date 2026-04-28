import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import * as path from 'path';
import * as fs from 'fs';

let sql: SqlJsStatic | null = null;
let db: Database | null = null;
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

// Save database to disk
function saveToDisk(): void {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(getDbPath(), buffer);
}

export async function initDatabase(): Promise<void> {
  if (dbInitialized) return;

  try {
    // Initialize sql.js
    if (!sql) {
      sql = await initSqlJs({
        locateFile: (file) => path.join(__dirname, '../node_modules/sql.js/dist', file),
      });
    }

    const dbPath = getDbPath();
    console.log('[Database] Opening database at:', dbPath);

    // Load existing database or create new
    let fileBuffer: Uint8Array | undefined;
    if (fs.existsSync(dbPath)) {
      fileBuffer = fs.readFileSync(dbPath);
    }

    db = new sql.Database(fileBuffer);

    // Create tables
    runMigrations();

    // Save initial state
    saveToDisk();

    dbInitialized = true;
  } catch (err) {
    console.error('[Database] Initialization failed:', err);
    // Don't rethrow - allow app to continue without database functionality
  }
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

export function getDatabase(): Database | null {
  return db;
}

export function saveDatabase(): void {
  if (db) {
    saveToDisk();
  }
}

export function closeDatabase(): void {
  if (db) {
    saveToDisk();
    db.close();
    db = null;
    dbInitialized = false;
  }
}

// Test case repository functions
export function getAllTestCases(): any[] {
  if (!db) {
    console.warn('[Database] getAllTestCases called but database not initialized');
    return [];
  }

  try {
    const stmt = db.prepare('SELECT * FROM testcase ORDER BY updated_at DESC');
    const rows: any[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  } catch (err) {
    console.error('[Database] getAllTestCases error:', err);
    return [];
  }
}

export function getTestCase(id: string): any | null {
  if (!db) {
    console.warn('[Database] getTestCase called but database not initialized');
    return null;
  }

  try {
    const stmt = db.prepare('SELECT * FROM testcase WHERE id = ?');
    stmt.bind([id]);
    let row: any = null;
    if (stmt.step()) {
      row = stmt.getAsObject();
    }
    stmt.free();
    return row;
  } catch (err) {
    console.error('[Database] getTestCase error:', err);
    return null;
  }
}

export function createTestCase(tc: any): void {
  if (!db) {
    console.warn('[Database] createTestCase called but database not initialized');
    return;
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO testcase (id, name, description, author, device_id, steps, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run([
      tc.id,
      tc.name,
      tc.description,
      tc.author,
      tc.device_id,
      tc.steps,
      tc.created_at,
      tc.updated_at,
    ]);
    stmt.free();
    saveToDisk();
  } catch (err) {
    console.error('[Database] createTestCase error:', err);
  }
}

export function updateTestCase(id: string, updates: any): void {
  if (!db) {
    console.warn('[Database] updateTestCase called but database not initialized');
    return;
  }

  try {
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
    stmt.run(values);
    stmt.free();
    saveToDisk();
  } catch (err) {
    console.error('[Database] updateTestCase error:', err);
  }
}

export function deleteTestCase(id: string): void {
  if (!db) {
    console.warn('[Database] deleteTestCase called but database not initialized');
    return;
  }

  try {
    const stmt = db.prepare('DELETE FROM testcase WHERE id = ?');
    stmt.run([id]);
    stmt.free();
    saveToDisk();
  } catch (err) {
    console.error('[Database] deleteTestCase error:', err);
  }
}
