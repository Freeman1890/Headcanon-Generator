import { ATTRIBUTION_SCHEMA } from './attribution-schema';
import type { DatabaseSync } from './db-types';

/** Core tables shared by local Node SQLite and SQLite-backed Durable Objects. */
export const CORE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    mode TEXT NOT NULL DEFAULT 'preview',
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    csrf_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
  CREATE TABLE IF NOT EXISTS email_codes (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    attempts INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS email_codes_lookup_idx ON email_codes(email, created_at DESC);
  CREATE TABLE IF NOT EXISTS grants (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source TEXT NOT NULL,
    remaining INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    period_start TEXT,
    period_end TEXT
  );
  CREATE INDEX IF NOT EXISTS grants_fefo_idx ON grants(user_id, expires_at, created_at);
  CREATE TABLE IF NOT EXISTS ledger (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    amount INTEGER NOT NULL,
    description TEXT NOT NULL,
    created_at TEXT NOT NULL,
    grant_id TEXT REFERENCES grants(id)
  );
  CREATE INDEX IF NOT EXISTS ledger_user_idx ON ledger(user_id, created_at DESC);
  CREATE TABLE IF NOT EXISTS reservations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id TEXT NOT NULL,
    child_id TEXT NOT NULL,
    grant_id TEXT NOT NULL REFERENCES grants(id),
    amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'reserved',
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS reservations_job_idx ON reservations(job_id, child_id, status);
  CREATE TABLE IF NOT EXISTS characters (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    reference_url TEXT NOT NULL,
    style TEXT NOT NULL,
    created_at TEXT NOT NULL,
    asset_id TEXT,
    read_only INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS characters_user_idx ON characters(user_id, created_at);
  CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    path TEXT NOT NULL,
    style TEXT NOT NULL,
    prompt TEXT NOT NULL,
    operation TEXT NOT NULL,
    character_id TEXT REFERENCES characters(id) ON DELETE SET NULL,
    parent_id TEXT REFERENCES assets(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    watermarked INTEGER NOT NULL DEFAULT 1,
    mode TEXT NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    name TEXT
  );
  CREATE INDEX IF NOT EXISTS assets_user_idx ON assets(user_id, created_at DESC);
  CREATE TABLE IF NOT EXISTS uploads (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    mime TEXT NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    bytes INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    operation TEXT NOT NULL,
    status TEXT NOT NULL,
    cost INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    idempotency_key TEXT NOT NULL,
    reference_url TEXT NOT NULL,
    style TEXT NOT NULL,
    prompt TEXT NOT NULL,
    framing TEXT NOT NULL,
    ratio TEXT NOT NULL,
    character_id TEXT,
    parent_asset_id TEXT,
    UNIQUE(user_id, idempotency_key)
  );
  CREATE INDEX IF NOT EXISTS jobs_user_idx ON jobs(user_id, created_at DESC);
  CREATE TABLE IF NOT EXISTS job_children (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    status TEXT NOT NULL,
    asset_id TEXT,
    error TEXT,
    position INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS job_children_job_idx ON job_children(job_id, position);
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product TEXT NOT NULL,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    mode TEXT NOT NULL,
    idempotency_key TEXT,
    UNIQUE(user_id, idempotency_key)
  );
  CREATE TABLE IF NOT EXISTS subscriptions (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL,
    interval TEXT NOT NULL,
    status TEXT NOT NULL,
    period_end TEXT NOT NULL,
    cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
    next_plan TEXT,
    next_grant_at TEXT,
    product TEXT NOT NULL,
    recorded_payment_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS support_tickets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    order_id TEXT,
    created_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open'
  );
  CREATE INDEX IF NOT EXISTS support_user_idx ON support_tickets(user_id, created_at DESC);
`;

export interface MigrationOptions {
  /**
   * Local preview historically re-queues interrupted work. Cloud databases
   * must leave provider work untouched, so this is opt-in rather than inferred
   * from APP_MODE.
   */
  recoverPreview?: boolean;
}

const MIGRATABLE_COLUMNS = {
  characters: ['read_only_until TEXT'],
  grants: ['role_expires_at TEXT'],
  jobs: [
    'provider_request_id TEXT',
    'provider_endpoint TEXT',
    'provider_status_url TEXT',
    'provider_response_url TEXT',
    'provider_status TEXT',
    'stuck_at TEXT',
  ],
  job_children: [
    'provider_request_id TEXT',
    'provider_endpoint TEXT',
    'provider_status_url TEXT',
    'provider_response_url TEXT',
  ],
  subscriptions: ['billing_day INTEGER', 'funding_mode TEXT'],
} as const;

type MigratableTable = keyof typeof MIGRATABLE_COLUMNS;

function ensureColumn(db: DatabaseSync, table: MigratableTable, declaration: string) {
  const column = declaration.split(/\s+/, 1)[0];
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name?: unknown }>;
  if (!columns.some((item) => String(item.name) === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${declaration}`);
  }
}

/**
 * Apply the core schema and additive columns to either database backend.
 *
 * The schema is intentionally idempotent. `recoverPreview` is explicit so a
 * Cloudflare object cannot accidentally import the local preview queue repair
 * behavior merely because APP_MODE happens to be preview during a test.
 */
export function migrateDatabase(db: DatabaseSync, options: MigrationOptions = {}) {
  db.exec(CORE_SCHEMA);
  db.exec(ATTRIBUTION_SCHEMA);
  for (const table of Object.keys(MIGRATABLE_COLUMNS) as MigratableTable[]) {
    for (const declaration of MIGRATABLE_COLUMNS[table]) ensureColumn(db, table, declaration);
  }

  if (options.recoverPreview === true) {
    db.exec(`
      UPDATE job_children
      SET status='queued'
      WHERE status='processing'
        AND job_id IN (SELECT id FROM jobs WHERE provider_request_id IS NULL);
      UPDATE jobs
      SET status='queued'
      WHERE status='processing' AND provider_request_id IS NULL;
    `);
  }
}
