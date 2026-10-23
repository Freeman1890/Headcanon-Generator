import { AsyncLocalStorage } from 'node:async_hooks';
import type {
  CloudDatabaseStorage,
  CloudSqlCursor,
  CloudSqlStorage,
  CloudSqlValue,
  DatabaseSync,
  PreparedStatement,
  StatementResult,
} from './db-types';
import { migrateDatabase } from './db-schema';

interface CloudDatabaseContext {
  storage: CloudDatabaseStorage;
  db: CloudDatabaseAdapter;
  transactionDepth: number;
}

const databaseContext = new AsyncLocalStorage<CloudDatabaseContext>();
const adapters = new WeakMap<object, CloudDatabaseAdapter>();
const initializedStorages = new WeakSet<object>();

function isNamedParameterObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value)
    && !(value instanceof ArrayBuffer) && !ArrayBuffer.isView(value));
}

function toCloudBinding(value: unknown): CloudSqlValue {
  if (value === null) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return Number.isNaN(value) ? null : value;
  if (typeof value === 'bigint') {
    const number = Number(value);
    if (!Number.isSafeInteger(number)) {
      throw new RangeError('Cloudflare SQLite bindings cannot represent an unsafe bigint exactly.');
    }
    return number;
  }
  if (value instanceof ArrayBuffer) return value;
  if (ArrayBuffer.isView(value)) {
    const bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    return bytes.slice().buffer;
  }
  throw new TypeError('Unsupported SQLite binding type.');
}

function normalizeResultValue(value: unknown): unknown {
  // Node's sqlite returns blobs as Uint8Array while SqlStorage exposes them as
  // ArrayBuffer. Preserve the shared DatabaseSync contract for callers.
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  return value;
}

function normalizeRow(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, normalizeResultValue(value)]));
}

function rowsFromCursor(cursor: CloudSqlCursor): Array<Record<string, unknown>> {
  return cursor.toArray().map(normalizeRow);
}

function firstRow(cursor: CloudSqlCursor): Record<string, unknown> | undefined {
  const result = cursor.next();
  return result.done ? undefined : normalizeRow(result.value);
}

/**
 * Convert Node-style named parameters into the positional placeholders
 * accepted by SqlStorage. Existing business queries use `?`, but supporting
 * named parameters keeps this adapter close to DatabaseSync semantics.
 */
function normalizeQueryParameters(query: string, parameters: any[]) {
  if (!parameters.length || !isNamedParameterObject(parameters[0])) {
    return { query, bindings: parameters.map(toCloudBinding) };
  }

  const named = parameters[0] as Record<string, unknown>;
  const anonymous = parameters.slice(1);
  const bindings: unknown[] = [];
  const used = new Set<string>();
  const rewritten = query.replace(/([:@$])([A-Za-z_][A-Za-z0-9_]*)/g, (token, prefix: string, name: string) => {
    const key = Object.hasOwn(named, token) ? token : Object.hasOwn(named, name) ? name : null;
    if (key === null) throw new Error(`Missing named SQLite binding: ${token}`);
    used.add(key);
    bindings.push(named[key]);
    return '?';
  });
  for (const key of Object.keys(named)) {
    if (!used.has(key)) throw new Error(`Unknown named SQLite binding: ${key}`);
  }
  // Mixed named/anonymous parameters are uncommon in this application. Keep
  // the Node ordering for the common trailing-anonymous form.
  bindings.push(...anonymous);
  return { query: rewritten, bindings: bindings.map(toCloudBinding) };
}

function scalarNumber(value: unknown, fallback: number): number | bigint {
  if (typeof value === 'bigint') return value;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

class CloudPreparedStatement implements PreparedStatement {
  constructor(private readonly sql: CloudSqlStorage, private readonly query: string) {}

  private execute(parameters: any[]) {
    const normalized = normalizeQueryParameters(this.query, parameters);
    return this.sql.exec(normalized.query, ...normalized.bindings);
  }

  get(...parameters: any[]): Record<string, unknown> | undefined {
    return firstRow(this.execute(parameters));
  }

  all(...parameters: any[]): Array<Record<string, unknown>> {
    return rowsFromCursor(this.execute(parameters));
  }

  run(...parameters: any[]): StatementResult {
    const cursor = this.execute(parameters);
    // `rowsWritten` is a billing counter and can include index writes. SQLite's
    // changes() reports the same row-change count as node:sqlite instead.
    const resultCursor = this.sql.exec('SELECT changes() AS changes, last_insert_rowid() AS lastInsertRowid');
    const result = firstRow(resultCursor);
    return {
      changes: scalarNumber(result?.changes, cursor.rowsWritten ?? 0),
      lastInsertRowid: scalarNumber(result?.lastInsertRowid, 0),
    };
  }
}

export class CloudDatabaseAdapter implements DatabaseSync {
  constructor(public readonly storage: CloudDatabaseStorage) {}

  exec(sql: string): void {
    this.storage.sql.exec(sql);
  }

  prepare(sql: string): PreparedStatement {
    return new CloudPreparedStatement(this.storage.sql, sql);
  }
}

function adapterFor(storage: CloudDatabaseStorage) {
  const existing = adapters.get(storage as object);
  if (existing) return existing;
  const adapter = new CloudDatabaseAdapter(storage);
  adapters.set(storage as object, adapter);
  return adapter;
}

function currentContext() {
  const context = databaseContext.getStore();
  if (!context) throw new Error('Cloud database context is not active. Use withCloudDatabase(storage, callback).');
  return context;
}

/**
 * Run a request or Durable Object method with one object's SQLite database as
 * the active synchronous database. AsyncLocalStorage keeps concurrent request
 * continuations from accidentally reading another account's object.
 */
export function withCloudDatabase<T>(storage: CloudDatabaseStorage, callback: () => T): T;
export function withCloudDatabase<T>(storage: CloudDatabaseStorage, callback: () => Promise<T>): Promise<T>;
export function withCloudDatabase<T>(storage: CloudDatabaseStorage, callback: () => T | Promise<T>): T | Promise<T> {
  const db = adapterFor(storage);
  if (!initializedStorages.has(storage as object)) {
    // SQLite-backed DOs expose this setting through the SQL API. Do this before
    // migration so all REFERENCES in the schema are enforced. Mark the object
    // initialized only after both steps succeed; a failed cold start can retry.
    db.exec('PRAGMA foreign_keys = ON');
    migrateDatabase(db, { recoverPreview: false });
    initializedStorages.add(storage as object);
  }
  return databaseContext.run({ storage, db, transactionDepth: 0 }, callback);
}

export function getDb(): DatabaseSync {
  return currentContext().db;
}

/**
 * Use the synchronous Durable Object transaction primitive. SQL BEGIN/COMMIT
 * are deliberately never sent to SqlStorage, which rejects transaction SQL.
 */
export function transaction<T>(fn: (db: DatabaseSync) => T): T {
  const context = currentContext();
  if (context.transactionDepth > 0) return fn(context.db);
  context.transactionDepth += 1;
  try {
    return context.storage.transactionSync(() => fn(context.db));
  } finally {
    context.transactionDepth -= 1;
  }
}
