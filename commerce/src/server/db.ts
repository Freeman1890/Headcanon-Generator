import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DatabaseSync as NodeDatabaseSync } from 'node:sqlite';
import { migrateDatabase } from './db-schema';
import type { DatabaseSync } from './db-types';

let activePath: string | undefined;
let activeDb: NodeDatabaseSync | undefined;

export function databasePath() {
  return process.env.APP_DB_PATH || join(process.env.APP_DATA_DIR || join(process.cwd(), '.data'), 'app.sqlite');
}

export function getDb(): DatabaseSync {
  const filename = databasePath();
  if (activeDb && activePath === filename) return activeDb;
  if (activeDb) {
    try { activeDb.close(); } catch { /* a test may have already closed it */ }
  }
  mkdirSync(dirname(filename), { recursive: true });
  const db = new NodeDatabaseSync(filename, { enableForeignKeyConstraints: true, timeout: 5000 });
  activeDb = db;
  activePath = filename;
  db.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  migrateDatabase(db, { recoverPreview: process.env.APP_MODE !== 'live' });
  return db;
}

export function resetDbForTests() {
  if (activeDb) {
    try { activeDb.close(); } catch { /* noop */ }
  }
  activeDb = undefined;
  activePath = undefined;
}

export function transaction<T>(fn: (db: DatabaseSync) => T): T {
  const db = getDb();
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn(db);
    db.exec('COMMIT');
    return result;
  } catch (error) {
    try { db.exec('ROLLBACK'); } catch { /* preserve the original error */ }
    throw error;
  }
}

export { migrateDatabase } from './db-schema';
