/**
 * The small synchronous database surface used by the server modules.
 *
 * Node's `DatabaseSync` and the Cloudflare SQLite Durable Object adapter both
 * implement this shape. Keeping this type structural means the business code
 * can keep using synchronous SQL while the storage owner changes.
 */
export interface PreparedStatement {
  get(...parameters: any[]): Record<string, unknown> | undefined;
  all(...parameters: any[]): Array<Record<string, unknown>>;
  run(...parameters: any[]): StatementResult;
}

export interface StatementResult {
  changes: number | bigint;
  lastInsertRowid: number | bigint;
}

export interface DatabaseSync {
  exec(sql: string): void;
  prepare(sql: string): PreparedStatement;
}

/** Compatibility alias for modules that use the shorter structural name. */
export type Database = DatabaseSync;

/** Values accepted by the Workers SQLite SQL API. */
export type CloudSqlValue = ArrayBuffer | string | number | null;

export interface CloudSqlCursor {
  next(): { done?: false; value: Record<string, unknown> } | { done: true; value?: never };
  toArray(): Array<Record<string, unknown>>;
  rowsWritten?: number;
  [Symbol.iterator](): Iterator<Record<string, unknown>>;
}

export interface CloudSqlStorage {
  exec(query: string, ...bindings: any[]): CloudSqlCursor;
}

/** The part of DurableObjectStorage required by the database adapter. */
export interface CloudDatabaseStorage {
  sql: CloudSqlStorage;
  transactionSync<T>(closure: () => T): T;
}
