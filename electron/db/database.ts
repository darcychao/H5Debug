import * as path from 'path';
import * as fs from 'fs';

// Network record types
export interface NetworkRecordRow {
  id: string;
  request_id: string;
  url: string;
  method: string;
  headers: string;
  post_data: string | null;
  resource_type: string;
  status: number;
  status_text: string;
  response_headers: string;
  response_body: string | null;
  timestamp: number;
}

// Console override types
export interface ConsoleOverrideRow {
  id: string;
  method_name: string;
  override_code: string;
  description: string;
  enabled: number;
  created_at: number;
}

// Plugin types
export interface PluginRow {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  enabled: number;
  installed_at: number;
}

type Database = any;
type SqlJsStatic = any;

const DB_VERSION = 1;

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
  console.log('[Database] Saved to disk:', getDbPath());
}

export async function initDatabase(): Promise<void> {
  if (dbInitialized) return;

  try {
    // Initialize sql.js - load safely
    if (!sql) {
      // Save original module/exports
      const originalModule = (global as any).module;
      const originalExports = (global as any).exports;

      try {
        // Try to load sql.js
        const initSqlJs = require('sql.js');

        // Locate WASM file relative to sql.js package in node_modules
        const sqlJsPath = require.resolve('sql.js');
        const sqlJsDir = path.dirname(sqlJsPath);

        sql = await initSqlJs({
          locateFile: (file: string) => {
            const resolved = path.join(sqlJsDir, file);
            if (fs.existsSync(resolved)) {
              return resolved;
            }
            return file;
          },
        });
      } finally {
        // Restore original
        if (originalModule !== undefined) {
          (global as any).module = originalModule;
        }
        if (originalExports !== undefined) {
          (global as any).exports = originalExports;
        }
      }
    }

    const dbPath = getDbPath();
    console.log('[Database] Opening database at:', dbPath);

    // Load existing database or create new
    let fileBuffer: Uint8Array | undefined;
    if (fs.existsSync(dbPath)) {
      fileBuffer = fs.readFileSync(dbPath);
      if (fileBuffer.length === 0) {
        console.warn('[Database] Database file is empty, creating new database');
        fileBuffer = undefined;
      } else {
        console.log('[Database] Loaded existing database, size:', fileBuffer.length);
      }
    }

    db = new sql.Database(fileBuffer);

    // Create tables and run migrations
    runMigrations();

    // Save initial state
    saveToDisk();

    dbInitialized = true;
    console.log('[Database] Initialized successfully');
  } catch (err) {
    console.error('[Database] Initialization failed:', err);
    // Reset state so retry is possible
    db = null;
    dbInitialized = false;
    throw err;
  }
}

function getTableColumns(tableName: string): string[] {
  if (!db) return [];
  try {
    const results = db.exec(`PRAGMA table_info(${tableName})`);
    if (results.length === 0) return [];
    return results[0].values.map((row: any[]) => row[1] as string);
  } catch {
    return [];
  }
}

function columnExists(tableName: string, columnName: string): boolean {
  return getTableColumns(tableName).includes(columnName);
}

function addColumnIfMissing(tableName: string, columnName: string, definition: string): void {
  if (!db) return;
  if (!columnExists(tableName, columnName)) {
    try {
      db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
      console.log(`[Database] Added column ${columnName} to ${tableName}`);
    } catch (err) {
      console.warn(`[Database] Failed to add column ${columnName} to ${tableName}:`, err);
    }
  }
}

function getDbVersion(): number {
  if (!db) return 0;
  try {
    const results = db.exec('PRAGMA user_version');
    if (results.length > 0 && results[0].values.length > 0) {
      return (results[0].values[0][0] as number) || 0;
    }
  } catch {
    // ignore
  }
  return 0;
}

function setDbVersion(version: number): void {
  if (!db) return;
  db.exec(`PRAGMA user_version = ${version}`);
}

function runMigrations(): void {
  if (!db) return;

  const currentVersion = getDbVersion();

  // Version 0: initial schema (or old database without version tracking)
  // Always run CREATE TABLE IF NOT EXISTS to ensure base tables exist
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

  // Migrations for databases created before schema changes
  // Example: addColumnIfMissing('testcase', 'new_column', 'TEXT DEFAULT NULL');

  // Ensure all expected columns exist (handles partial schemas from old versions)
  addColumnIfMissing('testcase', 'device_id', 'TEXT');
  addColumnIfMissing('testcase', 'steps', "TEXT NOT NULL DEFAULT '[]'");
  addColumnIfMissing('network_record', 'request_id', 'TEXT');
  addColumnIfMissing('network_record', 'status_text', "TEXT DEFAULT ''");
  addColumnIfMissing('network_record', 'response_body', 'TEXT');
  addColumnIfMissing('console_override', 'description', "TEXT DEFAULT ''");
  addColumnIfMissing('plugin', 'author', "TEXT DEFAULT ''");

  // Mark database as current version
  if (currentVersion < DB_VERSION) {
    setDbVersion(DB_VERSION);
    console.log(`[Database] Migrated from version ${currentVersion} to ${DB_VERSION}`);
  }
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

// Helper to run prepared statements (sql.js style)
function run(sql: string, params: any[] = []): void {
  if (!db) return;
  const stmt = db.prepare(sql);
  stmt.bind(params);
  stmt.step();
  stmt.free();
}

// Test case repository functions
export interface TestCaseRow {
  id: string;
  name: string;
  description: string;
  author: string;
  device_id: string | null;
  steps: string;
  created_at: number;
  updated_at: number;
}

export function getAllTestCases(): TestCaseRow[] {
  if (!db) {
    console.warn('[Database] getAllTestCases called but database not initialized');
    return [];
  }

  try {
    const results = db.exec('SELECT * FROM testcase ORDER BY updated_at DESC');
    if (results.length === 0) return [];
    return results[0].values.map((row: any[]) => ({
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
  if (!db) {
    console.warn('[Database] getTestCase called but database not initialized');
    return null;
  }

  try {
    const stmt = db.prepare('SELECT * FROM testcase WHERE id = ?');
    stmt.bind([id]);
    let row: TestCaseRow | null = null;
    if (stmt.step()) {
      const values = stmt.get();
      row = {
        id: values[0],
        name: values[1],
        description: values[2],
        author: values[3],
        device_id: values[4],
        steps: values[5],
        created_at: values[6],
        updated_at: values[7],
      };
    }
    stmt.free();
    return row;
  } catch (err) {
    console.error('[Database] getTestCase error:', err);
    return null;
  }
}

export function createTestCase(tc: TestCaseRow): void {
  if (!db) {
    console.warn('[Database] createTestCase called but database not initialized');
    return;
  }

  try {
    run(
      'INSERT INTO testcase (id, name, description, author, device_id, steps, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [tc.id, tc.name, tc.description, tc.author, tc.device_id, tc.steps, tc.created_at, tc.updated_at],
    );
    saveToDisk();
    console.log('[Database] Created test case:', tc.id);
  } catch (err) {
    console.error('[Database] createTestCase error:', err);
  }
}

export function updateTestCase(id: string, updates: Partial<TestCaseRow>): void {
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

    run(`UPDATE testcase SET ${fields.join(', ')} WHERE id = ?`, values);
    saveToDisk();
    console.log('[Database] Updated test case:', id);
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
    run('DELETE FROM testcase WHERE id = ?', [id]);
    saveToDisk();
    console.log('[Database] Deleted test case:', id);
  } catch (err) {
    console.error('[Database] deleteTestCase error:', err);
  }
}

// Network record functions
export function insertNetworkRecord(record: NetworkRecordRow): void {
  if (!db) {
    console.warn('[Database] insertNetworkRecord called but database not initialized');
    return;
  }

  try {
    run(
      `INSERT INTO network_record (id, request_id, url, method, headers, post_data, resource_type, status, status_text, response_headers, response_body, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [record.id, record.request_id, record.url, record.method, record.headers, record.post_data,
       record.resource_type, record.status, record.status_text, record.response_headers, record.response_body, record.timestamp],
    );
    saveToDisk();
  } catch (err) {
    console.error('[Database] insertNetworkRecord error:', err);
  }
}

export function getNetworkRecords(limit = 500): NetworkRecordRow[] {
  if (!db) {
    console.warn('[Database] getNetworkRecords called but database not initialized');
    return [];
  }

  try {
    // sql.js exec doesn't support parameters for LIMIT, use string safely
    const results = db.exec(`SELECT * FROM network_record ORDER BY timestamp DESC LIMIT ${limit}`);
    if (results.length === 0) return [];
    return results[0].values.map((row: any[]) => ({
      id: row[0] as string,
      request_id: row[1] as string,
      url: row[2] as string,
      method: row[3] as string,
      headers: row[4] as string,
      post_data: row[5] as string | null,
      resource_type: row[6] as string,
      status: row[7] as number,
      status_text: row[8] as string,
      response_headers: row[9] as string,
      response_body: row[10] as string | null,
      timestamp: row[11] as number,
    }));
  } catch (err) {
    console.error('[Database] getNetworkRecords error:', err);
    return [];
  }
}

export function clearNetworkRecords(): void {
  if (!db) {
    console.warn('[Database] clearNetworkRecords called but database not initialized');
    return;
  }

  try {
    run('DELETE FROM network_record');
    saveToDisk();
  } catch (err) {
    console.error('[Database] clearNetworkRecords error:', err);
  }
}

// Console override functions
export function getAllOverrides(): ConsoleOverrideRow[] {
  if (!db) {
    console.warn('[Database] getAllOverrides called but database not initialized');
    return [];
  }

  try {
    const results = db.exec('SELECT * FROM console_override ORDER BY created_at');
    if (results.length === 0) return [];
    return results[0].values.map((row: any[]) => ({
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
  if (!db) {
    console.warn('[Database] insertOverride called but database not initialized');
    return;
  }

  try {
    run(
      'INSERT INTO console_override (id, method_name, override_code, description, enabled, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [override.id, override.method_name, override.override_code, override.description, override.enabled, override.created_at],
    );
    saveToDisk();
  } catch (err) {
    console.error('[Database] insertOverride error:', err);
  }
}

export function updateOverride(id: string, updates: Partial<ConsoleOverrideRow>): void {
  if (!db) {
    console.warn('[Database] updateOverride called but database not initialized');
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
    values.push(id);

    run(`UPDATE console_override SET ${fields.join(', ')} WHERE id = ?`, values);
    saveToDisk();
  } catch (err) {
    console.error('[Database] updateOverride error:', err);
  }
}

export function deleteOverride(id: string): void {
  if (!db) {
    console.warn('[Database] deleteOverride called but database not initialized');
    return;
  }

  try {
    run('DELETE FROM console_override WHERE id = ?', [id]);
    saveToDisk();
  } catch (err) {
    console.error('[Database] deleteOverride error:', err);
  }
}

// Plugin functions
export function getAllPlugins(): PluginRow[] {
  if (!db) {
    console.warn('[Database] getAllPlugins called but database not initialized');
    return [];
  }

  try {
    const results = db.exec('SELECT * FROM plugin ORDER BY installed_at');
    if (results.length === 0) return [];
    return results[0].values.map((row: any[]) => ({
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
  if (!db) {
    console.warn('[Database] insertPlugin called but database not initialized');
    return;
  }

  try {
    run(
      'INSERT INTO plugin (id, name, version, description, author, enabled, installed_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [plugin.id, plugin.name, plugin.version, plugin.description, plugin.author, plugin.enabled, plugin.installed_at],
    );
    saveToDisk();
  } catch (err) {
    console.error('[Database] insertPlugin error:', err);
  }
}

export function updatePlugin(id: string, updates: Partial<PluginRow>): void {
  if (!db) {
    console.warn('[Database] updatePlugin called but database not initialized');
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
    values.push(id);

    run(`UPDATE plugin SET ${fields.join(', ')} WHERE id = ?`, values);
    saveToDisk();
  } catch (err) {
    console.error('[Database] updatePlugin error:', err);
  }
}

export function deletePlugin(id: string): void {
  if (!db) {
    console.warn('[Database] deletePlugin called but database not initialized');
    return;
  }

  try {
    run('DELETE FROM plugin WHERE id = ?', [id]);
    saveToDisk();
  } catch (err) {
    console.error('[Database] deletePlugin error:', err);
  }
}
