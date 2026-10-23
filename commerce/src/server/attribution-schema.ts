export const ATTRIBUTION_SCHEMA = `
CREATE TABLE IF NOT EXISTS user_attribution (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  consent INTEGER NOT NULL, consent_expires_at INTEGER NOT NULL,
  first_touch TEXT, last_touch TEXT, updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS order_attribution (
  order_id TEXT PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent INTEGER NOT NULL, consent_expires_at INTEGER NOT NULL,
  first_touch TEXT, last_touch TEXT, ga_client_id TEXT, ga_session_id TEXT
);
CREATE TABLE IF NOT EXISTS revenue_events (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  payment_key TEXT NOT NULL UNIQUE, product TEXT NOT NULL,
  amount_cents INTEGER NOT NULL, currency TEXT NOT NULL, kind TEXT NOT NULL,
  occurred_at TEXT NOT NULL, first_source TEXT NOT NULL, last_source TEXT NOT NULL,
  refunded INTEGER NOT NULL DEFAULT 0, ga_status TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS revenue_user_idx ON revenue_events(user_id,occurred_at);
CREATE TABLE IF NOT EXISTS ga_revenue_outbox (
  id TEXT PRIMARY KEY, revenue_id TEXT NOT NULL REFERENCES revenue_events(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL, occurred_at TEXT NOT NULL,
  status TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, next_attempt_at INTEGER NOT NULL,
  UNIQUE(revenue_id,event_name)
);
CREATE INDEX IF NOT EXISTS ga_revenue_due_idx ON ga_revenue_outbox(status,next_attempt_at);
`;
