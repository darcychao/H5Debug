import initSqlJs, { Database } from 'sql.js';
import * as fs from 'fs';
import * as path from 'path';

let db: Database | null = null;
const DB_PATH = './data/h5debug.db';

export async function initDatabase(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs();

  // Load existing database or create new one
  let data: Buffer | null = null;
  if (fs.existsSync(DB_PATH)) {
    data = fs.readFileSync(DB_PATH);
  }

  db = data ? new SQL.Database(data) : new SQL.Database();

  // Run migrations
  runMigrations(db);

  // Enable WAL mode equivalent and auto-save
  db.run('PRAGMA journal_mode=WAL;');

  // Auto-save periodically
  setInterval(() => saveDatabase(), 5000);

  return db;
}

function runMigrations(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS testcase (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      author TEXT DEFAULT '',
      device_id TEXT,
      steps TEXT DEFAULT '[]',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  db.run(`
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

  db.run(`
    CREATE TABLE IF NOT EXISTS console_override (
      id TEXT PRIMARY KEY,
      method_name TEXT NOT NULL,
      override_code TEXT NOT NULL,
      description TEXT DEFAULT '',
      enabled INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL
    );
  `);

  db.run(`
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

export function getDatabase(): Database {
  if (!db) throw new Error('Database not initialized');
  return db;
}

export function saveDatabase(): void {
  if (!db) return;
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  } catch (err) {
    console.error('Failed to save database:', err);
  }
}

export function closeDatabase(): void {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
  }
}
