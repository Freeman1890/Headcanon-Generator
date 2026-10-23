import {createHash} from 'node:crypto';
import type {DatabaseSync} from './db-types';
import {getDb, transaction} from './db';
import {PRODUCTS} from '../lib/catalog';
import type {Product} from '../lib/types';
import {canonicalizeBillingEnvelope} from './billing-canonical';
import {
  parsePersistedWebhookEnvelope,
  queryOrderStateById,
  resolveWebhookProduct,
  WaffoUnavailableError,
  WaffoWebhookError,
  type CanonicalWaffoEvent,
  type VerifiedWaffoEnvelope,
  type WaffoAdapterOptions,
  type WaffoOrderStateLookup,
  type WaffoPaymentLookup,
} from './waffo';

type Row = Record<string, unknown>;

export const BILLING_RECOVERY_BATCH_SIZE = 8;
export const BILLING_RECOVERY_MAX_ATTEMPTS = 12;
export const BILLING_RECOVERY_MAX_AGE_MS = 24 * 60 * 60 * 1_000;
export const BILLING_RECOVERY_LEASE_MS = 60 * 1_000;
export const BILLING_RECOVERY_MAX_BACKOFF_MS = 15 * 60 * 1_000;

export type BillingRecoveryState = 'queued' | 'processing' | 'processed' | 'manual_required';

export interface BillingRecoveryOptions extends WaffoAdapterOptions {
  /** Maximum number of queue entries claimed by this alarm tick. */
  batchSize?: number;
}

export interface BillingRecoverySummary {
  accountId: string;
  total: number;
  queued: number;
  processing: number;
  processed: number;
  manualRequired: number;
  due: number;
  nextAt: number | null;
  oldestPendingAt: string | null;
  lastError: string | null;
}

const RECOVERY_SCHEMA = `
  CREATE TABLE IF NOT EXISTS billing_recovery (
    account_id TEXT NOT NULL,
    event_id TEXT NOT NULL,
    state TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    next_at INTEGER NOT NULL,
    started_at INTEGER,
    lease_until INTEGER,
    last_error TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY(account_id, event_id)
  );
  CREATE INDEX IF NOT EXISTS billing_recovery_due_idx ON billing_recovery(state, next_at);
  CREATE INDEX IF NOT EXISTS billing_recovery_account_idx ON billing_recovery(account_id, state, next_at);
`;

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function nowIso(now = Date.now()) {
  return new Date(now).toISOString();
}

function currentTime(options?: BillingRecoveryOptions) {
  const value = options?.now?.() ?? Date.now();
  return Number.isFinite(value) ? value : Date.now();
}

function account(value: string) {
  const normalized = value.trim();
  if (!normalized) throw new Error('A billing recovery account ID is required.');
  return normalized;
}

function ensureRecoverySchema(db = getDb()) {
  db.exec(RECOVERY_SCHEMA);
}

/** Create the durable queue table. Safe to call on every cold start. */
export function initializeBillingRecovery(db = getDb()): void {
  ensureRecoverySchema(db);
}

/** Internal enqueue helper used by billing.ts while it already owns a SQL
 * transaction. It only queues an event; it never contacts Waffo. */
export function enqueueBillingRecovery(db: DatabaseSync, accountId: string, eventId: string, at = Date.now()): void {
  const normalizedAccount = account(accountId);
  const normalizedEvent = eventId.trim();
  if (!normalizedEvent) return;
  ensureRecoverySchema(db);
  const stamp = nowIso(at);
  db.prepare(`INSERT INTO billing_recovery(account_id,event_id,state,attempts,next_at,started_at,lease_until,last_error,created_at,updated_at)
    VALUES(?,?, 'queued', 0, ?, NULL, NULL, NULL, ?, ?)
    ON CONFLICT(account_id,event_id) DO UPDATE SET
      state=CASE WHEN billing_recovery.state IN ('processed','manual_required') THEN billing_recovery.state ELSE 'queued' END,
      next_at=CASE WHEN billing_recovery.state IN ('processed','manual_required') THEN billing_recovery.next_at ELSE MIN(billing_recovery.next_at, excluded.next_at) END,
      lease_until=NULL,
      updated_at=excluded.updated_at`).run(normalizedAccount, normalizedEvent, at, stamp, stamp);
}

/** Request a retry for an already persisted event. This function is a local
 * queue mutation only and intentionally has no provider or checkout call. */
export function requestBillingRetry(accountId: string, eventId: string, existingDb?: DatabaseSync): void {
  const normalizedAccount = account(accountId);
  const normalizedEvent = eventId.trim();
  if (!normalizedEvent) throw new Error('A billing event ID is required.');
  const apply = (db: DatabaseSync) => {
    ensureRecoverySchema(db);
    const event = db.prepare('SELECT * FROM billing_events WHERE id=? OR event_id=? ORDER BY CASE WHEN id=? THEN 0 ELSE 1 END LIMIT 1').get(normalizedEvent, normalizedEvent, normalizedEvent) as Row | undefined;
    if (!event) throw new Error('The billing event was not found.');
    if (String(event.account_id || '') !== normalizedAccount) throw new Error('The billing event belongs to a different account.');
    if (Number(event.signature_verified || 0) !== 1 || !asString(event.signature_timestamp) || !asString(event.raw_body_sha256)) {
      throw new Error('This event has no durable initial signature proof and cannot be replayed.');
    }
    if (String(event.status) === 'processed' || String(event.status) === 'ignored') return;
    const timestamp = Date.now();
    const stamp = nowIso(timestamp);
    db.prepare(`INSERT INTO billing_recovery(account_id,event_id,state,attempts,next_at,started_at,lease_until,last_error,created_at,updated_at)
      VALUES(?,?, 'queued', 0, ?, NULL, NULL, NULL, ?, ?)
      ON CONFLICT(account_id,event_id) DO UPDATE SET state='queued',attempts=0,next_at=excluded.next_at,started_at=NULL,lease_until=NULL,last_error=NULL,updated_at=excluded.updated_at`)
      .run(normalizedAccount, String(event.id), timestamp, stamp, stamp);
    db.prepare('UPDATE billing_events SET status=?,error=?,updated_at=? WHERE id=? AND status<>?').run('pending_reconciliation', null, stamp, String(event.id), 'processed');
  };
  if (existingDb) apply(existingDb);
  else transaction(apply);
}

function rowNumber(row: Row | undefined, key: string): number | null {
  if (!row) return null;
  if (row[key] === null || row[key] === undefined || row[key] === '') return null;
  const value = Number(row[key]);
  return Number.isFinite(value) ? value : null;
}

function rowString(row: Row | undefined, key: string): string | null {
  return row ? asString(row[key]) : null;
}

function providerUnavailableReason() {
  return 'Waffo provider state is temporarily unavailable; no entitlement was issued.';
}

function markManual(accountId: string, eventId: string, reason: string, now: number) {
  const stamp = nowIso(now);
  transaction((db) => {
    db.prepare(`UPDATE billing_recovery SET state='manual_required',lease_until=NULL,last_error=?,updated_at=?
      WHERE account_id=? AND event_id=?`).run(reason.slice(0, 1000), stamp, accountId, eventId);
    db.prepare('UPDATE billing_events SET error=?,updated_at=? WHERE id=?').run(reason.slice(0, 1000), stamp, eventId);
  });
}

function markProcessed(accountId: string, eventId: string, now: number) {
  const stamp = nowIso(now);
  transaction((db) => db.prepare(`UPDATE billing_recovery SET state='processed',lease_until=NULL,last_error=NULL,updated_at=?
    WHERE account_id=? AND event_id=?`).run(stamp, accountId, eventId));
}

function reschedule(accountId: string, eventId: string, row: Row, reason: string, now: number) {
  const attempts = Math.max(1, Number(row.attempts) || 1);
  const startedAt = Number(row.started_at) || now;
  const elapsed = Math.max(0, now - startedAt);
  if (attempts >= BILLING_RECOVERY_MAX_ATTEMPTS || elapsed >= BILLING_RECOVERY_MAX_AGE_MS) {
    markManual(accountId, eventId, `Automatic recovery stopped after bounded retries: ${reason}`, now);
    return;
  }
  const delay = Math.min(BILLING_RECOVERY_MAX_BACKOFF_MS, 5_000 * 2 ** Math.min(8, attempts - 1));
  const stamp = nowIso(now);
  transaction((db) => db.prepare(`UPDATE billing_recovery
    SET state='queued',next_at=?,lease_until=NULL,last_error=?,updated_at=?
    WHERE account_id=? AND event_id=?`).run(now + delay, reason.slice(0, 1000), stamp, accountId, eventId));
}

function hasProof(row: Row, rawBody: string) {
  const signatureVerified = Number(row.signature_verified || 0) === 1;
  const signatureTimestamp = rowString(row, 'signature_timestamp');
  const storedHash = rowString(row, 'raw_body_sha256');
  if (!signatureVerified || !signatureTimestamp || !/^\d+$/.test(signatureTimestamp) || !storedHash || !/^[0-9a-f]{64}$/i.test(storedHash)) return false;
  return createHash('sha256').update(rawBody, 'utf8').digest('hex').toLowerCase() === storedHash.toLowerCase();
}

function cents(value: unknown, currency: string): number | null {
  const text = asString(value);
  if (!text || !/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(text)) return null;
  const scale = currency === 'JPY' ? 0 : 2;
  const fraction = text.split('.')[1] || '';
  if (fraction.length > scale) return null;
  try {
    const [whole] = text.split('.');
    const result = Number(BigInt(whole) * BigInt(10 ** scale) + BigInt(fraction.padEnd(scale, '0') || '0'));
    return Number.isSafeInteger(result) ? result : null;
  } catch {
    return null;
  }
}

function paymentFor(state: WaffoOrderStateLookup, event: CanonicalWaffoEvent): WaffoPaymentLookup | null {
  const payments = state.payments || [];
  if (event.paymentId) {
    const byId = payments.find((payment) => payment.id === event.paymentId);
    // A signed payment ID that is absent from the authoritative order must
    // never fall through to another payment on the same order. This protects
    // refunds and renewals when payments arrive out of order.
    return byId || null;
  }
  const byOrder = payments.filter((payment) => payment.orderId === event.orderId || payment.orderMerchantExternalId === event.orderMerchantExternalId);
  return byOrder.length === 1 ? byOrder[0] : null;
}

function expectedOrderStatus(eventType: string): Set<string> | null {
  if (eventType === 'order.completed') return new Set(['completed']);
  if (eventType === 'subscription.activated' || eventType === 'subscription.renewed' || eventType === 'subscription.recovered' || eventType === 'subscription.plan_changed' || eventType === 'subscription.uncanceled') return new Set(['active']);
  if (eventType === 'subscription.canceling') return new Set(['canceling']);
  if (eventType === 'subscription.canceled') return new Set(['canceled', 'closed', 'expired']);
  if (eventType === 'subscription.past_due' || eventType === 'subscription.payment_failed') return new Set(['past_due']);
  if (eventType === 'subscription.plan_change_scheduled' || eventType === 'subscription.plan_change_failed') return new Set(['active', 'canceling', 'past_due']);
  return null;
}

function paymentEvent(eventType: string) {
  return eventType === 'order.completed' || eventType === 'subscription.payment_succeeded';
}

function validateProviderState(event: CanonicalWaffoEvent, state: WaffoOrderStateLookup, localOrder: Row, localUser: Row): string | null {
  if (!state.found || state.orderId !== event.orderId) return 'The provider order was not found or did not match the signed order ID.';
  if (!state.storeId || state.storeId !== event.store) return 'The provider order belongs to a different store.';
  if (state.testMode === null || (state.testMode ? 'test' : 'prod') !== event.env) return 'The provider order environment does not match the signed event.';
  const expectedKind = event.product === 'pack' ? 'onetime' : 'subscription';
  if (state.kind !== expectedKind) return 'The provider order type does not match the approved local product.';
  if (!state.productId || state.productId !== event.providerProductId) return 'The provider order product changed or is missing.';
  if (!state.currency || state.currency !== event.currency) return 'The provider order currency is missing or mismatched.';
  const localOrderProduct = typeof localOrder.product === 'string' && Object.hasOwn(PRODUCTS, localOrder.product) ? localOrder.product as Product : null;
  const expectedOrderAmount = localOrderProduct ? PRODUCTS[localOrderProduct].price : NaN;
  if (String(localOrder.currency || '').toUpperCase() !== event.currency || Number(localOrder.amount) !== expectedOrderAmount) return 'The local order amount or currency does not match the approved catalog.';
  if (state.buyerEmail === null || String(localUser.email || '').trim().toLowerCase() !== state.buyerEmail.trim().toLowerCase()) return 'The provider buyer identity does not match the local user.';

  const status = (state.status || '').toLowerCase();
  const statuses = expectedOrderStatus(event.eventType);
  if (statuses && !statuses.has(status)) return `The provider order status ${status || 'missing'} does not confirm ${event.eventType}.`;

  const period = event.paidPeriod;
  if (event.product !== 'pack' && !period?.start && paymentEvent(event.eventType)) return 'The signed subscription payment event has no period; no billing period may be guessed.';
  if (event.product !== 'pack' && period) {
    if (!state.currentPeriodStart || !state.currentPeriodEnd || state.currentPeriodStart !== period.start || state.currentPeriodEnd !== period.end) return 'The provider current billing period is missing or does not match the signed event.';
    if (state.billingPeriod && period.interval && state.billingPeriod.toLowerCase() !== period.interval.toLowerCase()) return 'The provider billing interval does not match the signed event.';
  }

  const payment = paymentFor(state, event);
  if (paymentEvent(event.eventType)) {
    if (!payment || String(payment.status || '').toLowerCase() !== 'succeeded') return 'The provider has not confirmed the matching payment as succeeded.';
  }
  if (event.eventType.startsWith('refund.')) {
    if (!payment || String(payment.refundStatus || '').toLowerCase() !== 'succeeded') return 'The provider has not confirmed the matching refund as succeeded.';
  }
  if (payment && payment.snapshotAmountDetails) {
    const details = payment.snapshotAmountDetails;
    const snapshotCurrency = asString(details.currency)?.toUpperCase();
    if (!snapshotCurrency || snapshotCurrency !== event.currency) return 'The provider payment currency is missing or mismatched.';
    const subtotal = cents(details.subtotal, event.currency);
    if (subtotal === null || subtotal !== PRODUCTS[event.product].price) return 'The provider payment amount does not match the approved product price.';
  } else if (paymentEvent(event.eventType)) {
    return 'The provider payment amount snapshot is missing.';
  }
  return null;
}

type RecoveryDecision = {kind: 'processed' | 'manual' | 'retry'; reason?: string; result?: {status: string}};

async function reconcileOne(accountId: string, row: Row, options: BillingRecoveryOptions): Promise<RecoveryDecision> {
  const eventId = String(row.recovery_event_id || row.id || '');
  const event = row;
  const persistedAccountId = rowString(event, 'persisted_account_id');
  if (persistedAccountId !== accountId) return {kind: 'manual', reason: 'The persisted billing event is not owned by this account.'};
  const rawBody = rowString(event, 'raw_body');
  if (!rawBody || !hasProof(event, rawBody)) return {kind: 'manual', reason: 'The event has no valid durable initial signature proof; stored JSON was not replayed.'};
  const storeId = rowString(event, 'provider_store_id');
  const environment = rowString(event, 'provider_environment');
  const signatureTimestamp = rowString(event, 'signature_timestamp');
  const expected = {
    id: String(event.id),
    timestamp: String(event.provider_event_timestamp || ''),
    eventType: String(event.event_type || ''),
    eventId: String(event.event_id || ''),
    storeId: storeId || '',
    mode: environment || '',
  } as VerifiedWaffoEnvelope;
  if (!expected.timestamp || !expected.eventType || !expected.eventId || !storeId || (environment !== 'test' && environment !== 'prod') || !signatureTimestamp) return {kind: 'manual', reason: 'The persisted event verification context is incomplete.'};
  let envelope: VerifiedWaffoEnvelope;
  try {
    envelope = {...parsePersistedWebhookEnvelope(rawBody, expected), signatureTimestamp};
  } catch (error) {
    return {kind: 'manual', reason: error instanceof Error ? error.message : 'The persisted webhook envelope is invalid.'};
  }

  let resolution;
  try {
    resolution = await resolveWebhookProduct(envelope, options);
  } catch (error) {
    if (error instanceof WaffoUnavailableError) return {kind: 'retry', reason: providerUnavailableReason()};
    if (error instanceof WaffoWebhookError) return {kind: 'manual', reason: error.message};
    return {kind: 'retry', reason: providerUnavailableReason()};
  }
  if (resolution.status !== 'matched') return {kind: 'manual', reason: resolution.reason};

  let state: WaffoOrderStateLookup;
  try {
    state = await queryOrderStateById(resolution.orderId, options);
  } catch (error) {
    if (error instanceof WaffoUnavailableError) return {kind: 'retry', reason: providerUnavailableReason()};
    return {kind: 'retry', reason: providerUnavailableReason()};
  }

  let canonical: CanonicalWaffoEvent;
  try {
    canonical = canonicalizeBillingEnvelope(envelope, accountId, getDb(), {...options, resolvedProduct: resolution.product, providerProductId: resolution.providerProductId});
  } catch (error) {
    if (error instanceof WaffoWebhookError) return {kind: 'manual', reason: error.message};
    return {kind: 'retry', reason: 'Waffo event canonicalization was temporarily unavailable.'};
  }
  const localOrder = getDb().prepare('SELECT * FROM orders WHERE id=?').get(canonical.orderMerchantExternalId) as Row | undefined;
  const localUser = localOrder ? getDb().prepare('SELECT * FROM users WHERE id=?').get(localOrder.user_id) as Row | undefined : undefined;
  const persistedUserId = rowString(event, 'user_id');
  if (!localOrder || !localUser || String(localOrder.user_id) !== canonical.userId || (persistedUserId !== null && persistedUserId !== canonical.userId)) return {kind: 'manual', reason: 'The signed provider order, local order, and user identity do not match.'};
  const providerError = validateProviderState(canonical, state, localOrder, localUser);
  if (providerError) return {kind: 'manual', reason: providerError};

  const billing = await import('./billing');
  const result = billing.processRecoveredWaffoEvent(canonical, rawBody, {
    accountId,
    storeId,
    environment: environment as 'test' | 'prod',
    signatureTimestamp,
    rawBodySha256: String(event.raw_body_sha256),
  });
  if (result.status === 'processed' || result.status === 'duplicate' || result.status === 'ignored') return {kind: 'processed', result};
  return {kind: 'manual', reason: result.reason || 'Local billing reconciliation still lacks entitlement evidence.'};
}

function claimDue(accountId: string, now: number, batchSize: number) {
  return transaction((db) => {
    ensureRecoverySchema(db);
    db.prepare(`UPDATE billing_recovery SET state='queued',lease_until=NULL,next_at=?,updated_at=?
      WHERE account_id=? AND state='processing' AND lease_until IS NOT NULL AND lease_until<=?`)
      .run(now, nowIso(now), accountId, now);
    const rows = db.prepare(`SELECT q.* FROM billing_recovery q
      WHERE q.account_id=? AND q.state='queued' AND q.next_at<=?
      ORDER BY q.next_at,q.created_at LIMIT ?`).all(accountId, now, Math.max(1, Math.min(BILLING_RECOVERY_BATCH_SIZE, batchSize))) as Row[];
    const claimed: Row[] = [];
    for (const row of rows) {
      const changed = db.prepare(`UPDATE billing_recovery SET state='processing',attempts=attempts+1,started_at=COALESCE(started_at,?),lease_until=?,updated_at=?
        WHERE account_id=? AND event_id=? AND state='queued' AND next_at<=?`).run(now, now + BILLING_RECOVERY_LEASE_MS, nowIso(now), accountId, String(row.event_id), now);
      if (Number(changed.changes) === 1) {
        const event = db.prepare('SELECT * FROM billing_events WHERE id=?').get(String(row.event_id)) as Row | undefined;
        claimed.push({...(event || {}), ...row, id: event?.id || String(row.event_id), event_id: event?.event_id || '', recovery_event_id: String(row.event_id), persisted_account_id: rowString(event, 'account_id'), account_id: accountId, attempts: Number(row.attempts || 0) + 1, started_at: Number(row.started_at || now)});
      }
    }
    return claimed;
  });
}

/** Process at most a bounded batch. Every provider call is read-only; only a
 * previously proven event can reach processRecoveredWaffoEvent. */
export async function runBillingRecovery(accountId: string, options: BillingRecoveryOptions = {}): Promise<void> {
  const normalizedAccount = account(accountId);
  initializeBillingRecovery();
  const now = currentTime(options);
  const rows = claimDue(normalizedAccount, now, options.batchSize || BILLING_RECOVERY_BATCH_SIZE);
  for (const row of rows) {
    const eventId = String(row.recovery_event_id || row.id || '');
    try {
      const result = await reconcileOne(normalizedAccount, row, options);
      if (result.kind === 'processed') markProcessed(normalizedAccount, eventId, currentTime(options));
      else if (result.kind === 'manual') markManual(normalizedAccount, eventId, result.reason || 'Manual billing reconciliation is required.', currentTime(options));
      else reschedule(normalizedAccount, eventId, row, result.reason || 'Provider state is temporarily unavailable.', currentTime(options));
    } catch {
      // Never persist an arbitrary provider/library exception. The queue
      // keeps only this bounded reason; details stay out of summaries and
      // owner-facing snapshots.
      reschedule(normalizedAccount, eventId, row, providerUnavailableReason(), currentTime(options));
    }
  }
}

export function nextBillingAlarm(): number | null {
  initializeBillingRecovery();
  const row = getDb().prepare(`SELECT MIN(CASE WHEN state='queued' THEN next_at ELSE lease_until END) AS next_at
    FROM billing_recovery WHERE state IN ('queued','processing')`).get() as Row | undefined;
  const next = rowNumber(row, 'next_at');
  if (next === null) return null;
  return Math.max(Date.now() + 1_000, next);
}

export function billingRecoverySummary(accountId: string): BillingRecoverySummary {
  const normalizedAccount = account(accountId);
  initializeBillingRecovery();
  const db = getDb();
  const counts = db.prepare(`SELECT state,COUNT(*) AS count FROM billing_recovery WHERE account_id=? GROUP BY state`).all(normalizedAccount) as Row[];
  const values = new Map(counts.map((row) => [String(row.state), Number(row.count) || 0]));
  const now = Date.now();
  const nextRow = db.prepare(`SELECT MIN(CASE WHEN state='queued' THEN next_at WHEN state='processing' THEN lease_until ELSE NULL END) AS next_at,
      MIN(CASE WHEN state IN ('queued','processing') THEN created_at ELSE NULL END) AS oldest,
      (SELECT last_error FROM billing_recovery WHERE account_id=? AND last_error IS NOT NULL ORDER BY updated_at DESC LIMIT 1) AS last_error
    FROM billing_recovery WHERE account_id=?`).get(normalizedAccount, normalizedAccount) as Row | undefined;
  const next = rowNumber(nextRow, 'next_at');
  const dueRow = db.prepare("SELECT COUNT(*) AS count FROM billing_recovery WHERE account_id=? AND state='queued' AND next_at<=?").get(normalizedAccount, now) as Row | undefined;
  return {
    accountId: normalizedAccount,
    total: [...values.values()].reduce((sum, value) => sum + value, 0),
    queued: values.get('queued') || 0,
    processing: values.get('processing') || 0,
    processed: values.get('processed') || 0,
    manualRequired: values.get('manual_required') || 0,
    due: Number(dueRow?.count || 0),
    nextAt: next,
    oldestPendingAt: rowString(nextRow, 'oldest'),
    lastError: rowString(nextRow, 'last_error'),
  };
}
