import storageConfig from '../config/storage.json';
import planConfig from '../config/plans.json';
import { snapshotOrderAttribution, recordConfirmedRevenue, recordConfirmedRefund } from './order-attribution';
import { createHash, randomUUID } from 'node:crypto';
import type { DatabaseSync } from './db-types';
import { PRODUCTS } from '../lib/catalog';
import type { Product } from '../lib/types';
import { getDb, transaction } from './db';
import { currentExecution } from './execution-context';
import { enqueueBillingRecovery, initializeBillingRecovery } from './billing-recovery';
import { canonicalizeBillingEnvelope } from './billing-canonical';
import {
  createCheckout,
  manageWaffoSubscription,
  resolveWebhookProduct,
  verifyWebhookEnvelope,
  waffoBusinessReceiptId,
  type CanonicalWaffoEvent,
  type WaffoHeaders,
  type WaffoAdapterOptions,
  type WaffoEnvironment,
  type VerifiedWaffoEnvelope,
  WaffoUnavailableError,
  WaffoWebhookError,
} from './waffo';

type Row = Record<string, unknown>;
type BillingMode = 'preview' | 'live';

const SUBSCRIPTION_EVENTS = new Set(['subscription.activated', 'subscription.renewed', 'subscription.recovered', 'subscription.payment_succeeded']);
const SUBSCRIPTION_STATE_EVENTS = new Set(['subscription.canceling', 'subscription.uncanceled', 'subscription.canceled', 'subscription.past_due', 'subscription.payment_failed']);
const PLAN_CHANGE_EVENTS = new Set(['subscription.plan_changed', 'subscription.plan_change_scheduled', 'subscription.plan_change_failed']);

function grantsEntitlement(eventType: string) {
  return eventType === 'order.completed' || SUBSCRIPTION_EVENTS.has(eventType);
}

export interface BillingCheckoutResult {
  localOrderId: string;
  product: Product;
  amount: number;
  currency: 'USD';
  mode: BillingMode;
  status: string;
  checkoutUrl: string | null;
  providerOrderId: string | null;
}

export type BillingEventStatus = 'processed' | 'duplicate' | 'pending_reconciliation' | 'ignored';

export interface BillingWebhookResult {
  status: BillingEventStatus;
  eventId: string;
  eventType: string;
  paymentKey?: string;
  localOrderId?: string;
  grantId?: string;
  reason?: string;
  event?: CanonicalWaffoEvent;
}

export interface SubscriptionActionResult {
  action: 'cancel' | 'resume' | 'switch';
  status: string;
  checkoutUrl?: string;
  subscription: Row | undefined;
}

export class BillingReconciliationError extends Error {
  readonly status = 202;
  readonly code = 'BILLING_PENDING_RECONCILIATION';
}

/** Proof captured only after the original raw request passed Waffo's
 * signature, replay-window, store, and environment checks. Recovery may use
 * this persisted proof after the delivery timestamp is old, but it may never
 * manufacture one for an arbitrary row. */
export interface BillingVerificationProof {
  accountId: string | null;
  storeId: string;
  environment: WaffoEnvironment;
  signatureTimestamp: string;
  rawBodySha256: string;
}

const BILLING_SCHEMA = `
  CREATE TABLE IF NOT EXISTS billing_events (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    dedupe_key TEXT NOT NULL UNIQUE,
    payment_key TEXT,
    provider_order_id TEXT,
    order_merchant_external_id TEXT,
    payment_id TEXT,
    user_id TEXT,
    product TEXT,
    currency TEXT,
    amount_cents INTEGER,
    state TEXT NOT NULL,
    paid_period_interval TEXT,
    paid_period_start TEXT,
    paid_period_end TEXT,
    raw_body TEXT NOT NULL,
    status TEXT NOT NULL,
    error TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(event_id, event_type)
  );
  CREATE INDEX IF NOT EXISTS billing_events_status_idx ON billing_events(status, created_at);
  CREATE INDEX IF NOT EXISTS billing_events_order_idx ON billing_events(order_merchant_external_id, created_at);
  CREATE TABLE IF NOT EXISTS billing_payments (
    id TEXT PRIMARY KEY,
    provider_payment_id TEXT,
    provider_order_id TEXT,
    order_merchant_external_id TEXT,
    user_id TEXT NOT NULL,
    product TEXT NOT NULL,
    currency TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    state TEXT NOT NULL,
    paid_period_interval TEXT,
    paid_period_start TEXT,
    paid_period_end TEXT,
    grant_id TEXT,
    refund_status TEXT,
    review_required INTEGER NOT NULL DEFAULT 0,
    last_event_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(provider_payment_id),
    UNIQUE(provider_order_id, paid_period_start)
  );
  CREATE INDEX IF NOT EXISTS billing_payments_user_idx ON billing_payments(user_id, created_at);
  CREATE INDEX IF NOT EXISTS billing_payments_order_idx ON billing_payments(order_merchant_external_id, created_at);
  CREATE TABLE IF NOT EXISTS billing_links (
    id TEXT PRIMARY KEY,
    local_order_id TEXT,
    provider_order_id TEXT,
    provider_payment_id TEXT,
    user_id TEXT NOT NULL,
    product TEXT,
    role TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS billing_links_local_idx ON billing_links(local_order_id, created_at);
  CREATE INDEX IF NOT EXISTS billing_links_provider_idx ON billing_links(provider_order_id, provider_payment_id, created_at);
  CREATE INDEX IF NOT EXISTS billing_links_user_idx ON billing_links(user_id, role, created_at);
`;

const BILLING_EVENT_MIGRATIONS = [
  'account_id TEXT',
  'provider_store_id TEXT',
  'provider_environment TEXT',
  'provider_event_timestamp TEXT',
  'signature_verified INTEGER NOT NULL DEFAULT 0',
  'signature_timestamp TEXT',
  'raw_body_sha256 TEXT',
] as const;

function ensureBillingEventColumns(db: DatabaseSync) {
  const columns = db.prepare('PRAGMA table_info(billing_events)').all() as Array<{name?: unknown}>;
  for (const declaration of BILLING_EVENT_MIGRATIONS) {
    const name = declaration.split(/\s+/, 1)[0];
    if (!columns.some((column) => String(column.name) === name)) db.exec(`ALTER TABLE billing_events ADD COLUMN ${declaration}`);
  }
}

function ensureBillingSchema(db = getDb()) {
  db.exec(BILLING_SCHEMA);
  ensureBillingEventColumns(db);
  // Preserve each signed receipt. Grants have their own payment/period key;
  // event deduplication must not discard complementary payment evidence.
  db.exec(`UPDATE billing_events SET dedupe_key='event:' || id
    WHERE dedupe_key LIKE 'grant:%'`);
  db.exec(`UPDATE billing_events SET provider_event_timestamp=json_extract(raw_body,'$.timestamp')
    WHERE provider_event_timestamp IS NULL AND json_valid(raw_body)`);
  initializeBillingRecovery(db);
}

function id() {
  return randomUUID();
}

function now() {
  return new Date();
}

function iso(value = now()) {
  return value.toISOString();
}

function rawBodySha256(rawBody: string) {
  return createHash('sha256').update(rawBody, 'utf8').digest('hex');
}

function accountIdFor(userId: string | null) {
  const executionAccount = asString(currentExecution()?.accountId);
  return executionAccount || userId;
}

function addDays(value: Date, days: number) {
  const result = new Date(value);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function eventDate(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : now();
}

function addMonths(value: Date, months: number, billingDay = value.getUTCDate()) {
  const result = new Date(value);
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(billingDay, lastDay));
  return result;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function asProduct(value: unknown): Product | null {
  return typeof value === 'string' && Object.hasOwn(PRODUCTS, value) ? value as Product : null;
}

function mode(): BillingMode {
  return process.env.APP_MODE === 'live' ? 'live' : 'preview';
}

function rowString(row: Row | undefined, key: string): string | null {
  return row ? asString(row[key]) : null;
}

function rowNumber(row: Row | undefined, key: string): number | null {
  if (!row) return null;
  const value = Number(row[key]);
  return Number.isFinite(value) ? value : null;
}

function validIdempotencyKey(value: string) {
  const key = value.trim();
  if (!key || key.length > 200) throw new Error('A non-empty idempotency key is required.');
  return key;
}

function isSubscription(product: Product) {
  return PRODUCTS[product].interval === 'monthly' || PRODUCTS[product].interval === 'yearly';
}

function subscriptionPlan(product: Product) {
  return product.startsWith('studio') ? 'studio' : 'creator';
}

function subscriptionInterval(product: Product) {
  return product.endsWith('yearly') ? 'yearly' : 'monthly';
}

function mapCheckout(row: Row): BillingCheckoutResult {
  const product = asProduct(row.product);
  if (!product) throw new Error('Billing order has an unsupported product.');
  return {
    localOrderId: String(row.id),
    product,
    amount: Number(row.amount),
    currency: 'USD',
    mode: String(row.mode) === 'live' ? 'live' : 'preview',
    status: String(row.status),
    checkoutUrl: row.checkout_url ? String(row.checkout_url) : null,
    providerOrderId: row.provider_order_id ? String(row.provider_order_id) : null,
  };
}

function returnUrl() {
  return process.env.WAFFO_RETURN_URL || `${process.env.APP_ORIGIN || 'http://127.0.0.1:3100'}/account/billing`;
}

/** Create a local pending order before contacting Waffo. Preview never calls
 * the provider and deliberately returns no fake external checkout URL. */
export async function createCheckoutForUser(userId: string, product: Product, idempotencyKey: string, analyticsAttribution?: unknown): Promise<BillingCheckoutResult> {
  const approvedProduct = asProduct(product);
  if (!approvedProduct) throw new Error('The requested product is not in the approved catalog.');
  if (!userId.trim()) throw new Error('A user ID is required before creating checkout.');
  const key = validIdempotencyKey(idempotencyKey);
  ensureBillingSchema();
  const existing = getDb().prepare('SELECT o.*, l.provider_order_id, l.provider_payment_id FROM orders o LEFT JOIN billing_links l ON l.local_order_id=o.id AND l.role=\'checkout\' WHERE o.user_id=? AND o.idempotency_key=? ORDER BY l.created_at DESC LIMIT 1').get(userId, key) as Row | undefined;
  if (existing) return mapCheckout(existing);

  const localOrderId = id();
  const createdAt = iso();
  const details = PRODUCTS[approvedProduct];
  let racedOrder: Row | undefined;
  transaction((db) => {
    ensureBillingSchema(db);
    racedOrder = db.prepare('SELECT id FROM orders WHERE user_id=? AND idempotency_key=?').get(userId, key) as Row | undefined;
    if (racedOrder) return;
    db.prepare(`INSERT INTO orders(id,user_id,product,amount,currency,status,created_at,mode,idempotency_key)
      VALUES(?,?,?,?,?,?,?,?,?)`).run(localOrderId, userId, approvedProduct, details.price, 'USD', 'checkout_pending', createdAt, mode(), key);
    db.prepare(`INSERT INTO billing_links(id,local_order_id,user_id,product,role,created_at)
      VALUES(?,?,?,?,?,?)`).run(id(), localOrderId, userId, approvedProduct, 'checkout', createdAt);
    snapshotOrderAttribution(db, userId, localOrderId, analyticsAttribution);
  });

  if (racedOrder) {
    const existingAfterRace = getDb().prepare('SELECT o.*, l.provider_order_id, l.provider_payment_id FROM orders o LEFT JOIN billing_links l ON l.local_order_id=o.id AND l.role=\'checkout\' WHERE o.id=? ORDER BY l.created_at DESC LIMIT 1').get(String(racedOrder.id)) as Row | undefined;
    if (existingAfterRace) return mapCheckout(existingAfterRace);
    throw new Error('The idempotent checkout order disappeared before it could be read.');
  }

  if (mode() === 'preview') {
    return {localOrderId, product: approvedProduct, amount: details.price, currency: 'USD', mode: 'preview', status: 'preview_pending', checkoutUrl: null, providerOrderId: null};
  }

  const user = getDb().prepare('SELECT email FROM users WHERE id=?').get(userId) as Row | undefined;
  const email = rowString(user, 'email');
  if (!email) {
    transaction((db) => db.prepare('UPDATE orders SET status=? WHERE id=?').run('checkout_failed', localOrderId));
    throw new Error('The billing user email is missing; checkout was not sent to Waffo.');
  }
  try {
    const checkout = await createCheckout({userId, email, orderId: localOrderId, product: approvedProduct, returnUrl: returnUrl()});
    transaction((db) => {
      db.prepare('UPDATE orders SET status=? WHERE id=?').run('checkout_created', localOrderId);
      db.prepare(`UPDATE billing_links SET provider_order_id=? WHERE local_order_id=? AND role='checkout'`).run(checkout.providerOrderId, localOrderId);
    });
    return {localOrderId, product: approvedProduct, amount: details.price, currency: 'USD', mode: 'live', status: 'checkout_created', checkoutUrl: checkout.checkoutUrl, providerOrderId: checkout.providerOrderId};
  } catch (error) {
    transaction((db) => db.prepare('UPDATE orders SET status=? WHERE id=?').run('checkout_failed', localOrderId));
    throw error;
  }
}

function metadataProduct(data: Record<string, unknown>): Product | null {
  const orderMetadata = data.orderMetadata && typeof data.orderMetadata === 'object' && !Array.isArray(data.orderMetadata) ? data.orderMetadata as Record<string, unknown> : {};
  const productMetadata = data.productMetadata && typeof data.productMetadata === 'object' && !Array.isArray(data.productMetadata) ? data.productMetadata as Record<string, unknown> : {};
  return asProduct(orderMetadata.siteProduct) || asProduct(productMetadata.siteProduct);
}

function metadataUserId(data: Record<string, unknown>): string | null {
  const orderMetadata = data.orderMetadata && typeof data.orderMetadata === 'object' && !Array.isArray(data.orderMetadata) ? data.orderMetadata as Record<string, unknown> : {};
  return asString(data.merchantProvidedBuyerIdentity) || asString(orderMetadata.siteUserId);
}

function envelopePeriod(envelope: VerifiedWaffoEnvelope) {
  const data = envelope.data;
  return {
    interval: asString(data.billingPeriod),
    start: asString(data.currentPeriodStart),
    end: asString(data.currentPeriodEnd),
  };
}

function receiptId(db: DatabaseSync, id: string, eventId: string, eventType: string, store: string, mode: string): string {
  const occupied = db.prepare('SELECT event_id,event_type FROM billing_events WHERE id=?').get(id) as Row | undefined;
  // Preserve historical IDs and raw receipts. Only disambiguate a reused
  // provider envelope ID when it identifies a different business event.
  return occupied && (occupied.event_id !== eventId || occupied.event_type !== eventType)
    ? waffoBusinessReceiptId(eventType, eventId, store, mode) : id;
}

function pendingEnvelope(db: DatabaseSync, envelope: VerifiedWaffoEnvelope, rawBody: string, reason: string): BillingWebhookResult {
  envelope = {...envelope, id: receiptId(db, envelope.id, envelope.eventId, envelope.eventType, envelope.storeId, envelope.mode)};
  const data = envelope.data;
  const orderId = asString(data.orderId);
  const orderRef = asString(data.orderMerchantExternalId);
  const paymentId = asString(data.paymentId);
  const product = metadataProduct(data);
  const userId = metadataUserId(data);
  const currency = asString(data.currency)?.toUpperCase() || null;
  const period = envelopePeriod(envelope);
  const paymentKey = paymentId ? `payment:${paymentId}` : period.start && orderRef ? `period:${orderRef}:${period.start}` : null;
  const eventKey = `event:${envelope.id}`;
  const accountId = accountIdFor(userId);
  const timestamp = iso();
  const existing = db.prepare('SELECT status FROM billing_events WHERE id=? OR dedupe_key=? OR (event_id=? AND event_type=?)').get(envelope.id, eventKey, envelope.eventId, envelope.eventType) as Row | undefined;
  if (!existing) {
    db.prepare(`INSERT INTO billing_events(id,event_id,event_type,dedupe_key,payment_key,provider_order_id,order_merchant_external_id,payment_id,user_id,product,currency,amount_cents,state,paid_period_interval,paid_period_start,paid_period_end,raw_body,status,error,created_at,updated_at,account_id,provider_store_id,provider_environment,provider_event_timestamp,signature_verified,signature_timestamp,raw_body_sha256)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(envelope.id, envelope.eventId, envelope.eventType, eventKey, paymentKey, orderId, orderRef, paymentId, userId, product, currency, null, envelope.eventType, period.interval, period.start, period.end, rawBody, 'pending_reconciliation', reason, timestamp, timestamp, accountId, envelope.storeId, envelope.mode, envelope.timestamp, envelope.signatureTimestamp ? 1 : 0, envelope.signatureTimestamp || null, rawBodySha256(rawBody));
  }
  if (accountId) enqueueBillingRecovery(db, accountId, envelope.id);
  return {status: 'pending_reconciliation', eventId: envelope.id, eventType: envelope.eventType, ...(paymentKey ? {paymentKey} : {}), reason};
}

/** Persist a signed event whose provider order/product lookup could not be
 * completed. This intentionally creates no billing_payments placeholder: a
 * product and account ledger row must never be guessed from old metadata. */
function pendingProviderProductLookup(db: DatabaseSync, envelope: VerifiedWaffoEnvelope, rawBody: string, reason: string): BillingWebhookResult {
  envelope = {...envelope, id: receiptId(db, envelope.id, envelope.eventId, envelope.eventType, envelope.storeId, envelope.mode)};
  const data = envelope.data;
  const orderId = asString(data.orderId);
  const orderRef = asString(data.orderMerchantExternalId);
  const paymentId = asString(data.paymentId);
  const currency = asString(data.currency)?.toUpperCase() || null;
  const period = envelopePeriod(envelope);
  const paymentKey = paymentId ? `payment:${paymentId}` : period.start && orderRef ? `period:${orderRef}:${period.start}` : null;
  const eventKey = `event:${envelope.id}`;
  const accountId = accountIdFor(metadataUserId(data));
  const timestamp = iso();
  const existing = db.prepare('SELECT id,status FROM billing_events WHERE id=? OR dedupe_key=? OR (event_id=? AND event_type=?)').get(envelope.id, eventKey, envelope.eventId, envelope.eventType) as Row | undefined;
  if (existing && String(existing.status) !== 'pending_reconciliation') {
    return {status: 'duplicate', eventId: envelope.id, eventType: envelope.eventType, reason: 'The signed event was already recorded and will not be re-applied.'};
  }
  if (existing) {
    db.prepare('UPDATE billing_events SET error=?,updated_at=? WHERE id=?')
      .run(reason, timestamp, String(existing.id));
  } else {
    db.prepare(`INSERT INTO billing_events(id,event_id,event_type,dedupe_key,payment_key,provider_order_id,order_merchant_external_id,payment_id,user_id,product,currency,amount_cents,state,paid_period_interval,paid_period_start,paid_period_end,raw_body,status,error,created_at,updated_at,account_id,provider_store_id,provider_environment,provider_event_timestamp,signature_verified,signature_timestamp,raw_body_sha256)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(envelope.id, envelope.eventId, envelope.eventType, eventKey, paymentKey, orderId, orderRef, paymentId, null, null, currency, null, envelope.eventType, period.interval, period.start, period.end, rawBody, 'pending_reconciliation', reason, timestamp, timestamp, accountId, envelope.storeId, envelope.mode, envelope.timestamp, envelope.signatureTimestamp ? 1 : 0, envelope.signatureTimestamp || null, rawBodySha256(rawBody));
  }
  if (accountId) enqueueBillingRecovery(db, accountId, existing ? String(existing.id) : envelope.id);
  return {status: 'pending_reconciliation', eventId: envelope.id, eventType: envelope.eventType, ...(paymentKey ? {paymentKey} : {}), reason};
}

function periodFor(event: CanonicalWaffoEvent): {interval: string; start: Date; end: Date} | null {
  const period = event.paidPeriod;
  if (!period?.start || !period.end) return null;
  const start = new Date(period.start);
  const end = new Date(period.end);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) return null;
  return {interval: (period.interval || '').toLowerCase() || 'unknown', start, end};
}

function paymentKeyFor(event: CanonicalWaffoEvent): string | null {
  if (isSubscription(event.product) && event.paidPeriod?.start) return `period:${event.orderMerchantExternalId}:${event.paidPeriod.start}`;
  return event.paymentId ? `payment:${event.paymentId}` : null;
}

function findPayment(db: DatabaseSync, event: CanonicalWaffoEvent, paymentKey: string | null): Row | undefined {
  if (event.paymentId) {
    const exact = db.prepare('SELECT * FROM billing_payments WHERE provider_payment_id=?').get(event.paymentId) as Row | undefined;
    if (exact) return exact;
    // A refund or periodless receipt cannot fall back to an unrelated payment
    // just because it shares the subscription order.
    if (event.eventType.startsWith('refund.') || !event.paidPeriod?.start) return undefined;
  }
  if (!event.paidPeriod?.start) return undefined;
  return db.prepare(`SELECT * FROM billing_payments
    WHERE provider_order_id=? AND order_merchant_external_id=? AND user_id=?
      AND paid_period_start=? AND (? IS NULL OR provider_payment_id IS NULL)
    ORDER BY created_at LIMIT 1`).get(event.orderId, event.orderMerchantExternalId, event.userId,
      event.paidPeriod.start, event.paymentId) as Row | undefined;
}

function upsertPayment(db: DatabaseSync, event: CanonicalWaffoEvent, paymentKey: string, state: string, period: ReturnType<typeof periodFor>): Row {
  const existing = findPayment(db, event, paymentKey);
  const current = iso();
  if (existing) {
    const existingState = String(existing.state);
    const amount = Number(existing.amount_cents) > 0 ? Number(existing.amount_cents) : event.amount;
    db.prepare(`UPDATE billing_payments SET provider_payment_id=COALESCE(provider_payment_id,?),provider_order_id=COALESCE(provider_order_id,?),order_merchant_external_id=COALESCE(order_merchant_external_id,?),user_id=?,product=?,currency=?,amount_cents=?,paid_period_interval=COALESCE(paid_period_interval,?),paid_period_start=COALESCE(paid_period_start,?),paid_period_end=COALESCE(paid_period_end,?),state=?,last_event_at=?,updated_at=? WHERE id=?`).run(event.paymentId, event.orderId, event.orderMerchantExternalId, event.userId, event.product, event.currency, amount, period?.interval || null, period ? iso(period.start) : null, period ? iso(period.end) : null, existingState.startsWith('refund') || existingState === 'refunded' || existingState === 'refunded_review' ? existingState : state, event.timestamp, current, String(existing.id));
    return db.prepare('SELECT * FROM billing_payments WHERE id=?').get(String(existing.id)) as Row;
  }
  db.prepare(`INSERT INTO billing_payments(id,provider_payment_id,provider_order_id,order_merchant_external_id,user_id,product,currency,amount_cents,state,paid_period_interval,paid_period_start,paid_period_end,refund_status,review_required,last_event_at,created_at,updated_at)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(paymentKey, event.paymentId, event.orderId, event.orderMerchantExternalId, event.userId, event.product, event.currency, event.amount, state, period?.interval || null, period ? iso(period.start) : null, period ? iso(period.end) : null, null, 0, event.timestamp, current, current);
  return db.prepare('SELECT * FROM billing_payments WHERE id=?').get(paymentKey) as Row;
}

function linkEvent(db: DatabaseSync, event: CanonicalWaffoEvent, role: string, localOrderId: string | null) {
  db.prepare(`INSERT INTO billing_links(id,local_order_id,provider_order_id,provider_payment_id,user_id,product,role,created_at)
    VALUES(?,?,?,?,?,?,?,?)`).run(id(), localOrderId, event.orderId, event.paymentId, event.userId, event.product, role, iso());
}

function markEvent(db: DatabaseSync, eventId: string, status: string, error: string | null) {
  db.prepare('UPDATE billing_events SET status=?,error=?,updated_at=? WHERE id=?').run(status, error, iso(), eventId);
  if (status === 'pending_reconciliation') {
    const row = db.prepare('SELECT account_id FROM billing_events WHERE id=?').get(eventId) as Row | undefined;
    const accountId = rowString(row, 'account_id');
    if (accountId) enqueueBillingRecovery(db, accountId, eventId);
  }
}

function insertCanonicalEvent(db: DatabaseSync, event: CanonicalWaffoEvent, rawBody: string, paymentKey: string | null, proof: BillingVerificationProof): Row | undefined {
  event.id = receiptId(db, event.id, event.eventId, event.eventType, event.store, event.env);
  let dedupeKey = `event:${event.id}`;
  const existing = db.prepare('SELECT * FROM billing_events WHERE id=? OR dedupe_key=? OR (event_id=? AND event_type=?)').get(event.id, dedupeKey, event.eventId, event.eventType) as Row | undefined;
  if (existing) {
    const existingAccount = rowString(existing, 'account_id');
    if (existingAccount && proof.accountId && existingAccount !== proof.accountId) return existing;
    // A previous provider-product lookup may have persisted only the signed
    // envelope. Once the lookup succeeds, hydrate that same row and continue
    // through the normal canonical/idempotent path.
    if (String(existing.status) === 'pending_reconciliation' && String(existing.event_id) === event.eventId && String(existing.event_type) === event.eventType) {
      if (String(existing.raw_body) !== rawBody) {
        // Waffo can redeliver the same business event under a new delivery ID.
        // Keep the initial signed receipt and proof immutable.
        const originalRaw = String(existing.raw_body);
        if (rawBodySha256(originalRaw) !== existing.raw_body_sha256) return existing;
        const original = JSON.parse(originalRaw) as Record<string, unknown>;
        const incoming = JSON.parse(rawBody) as Record<string, unknown>;
        delete original.id; delete incoming.id;
        if (JSON.stringify(original) !== JSON.stringify(incoming)) return existing;
        event.id = String(existing.id);
        dedupeKey = `event:${event.id}`;
        rawBody = originalRaw;
        proof = {...proof, signatureTimestamp: String(existing.signature_timestamp), rawBodySha256: String(existing.raw_body_sha256)};
      }
      const conflict = db.prepare('SELECT id FROM billing_events WHERE (id=? OR dedupe_key=?) AND id<>?').get(event.id, dedupeKey, String(existing.id)) as Row | undefined;
      if (conflict) return existing;
      const period = event.paidPeriod;
      db.prepare(`UPDATE billing_events SET id=?,event_id=?,event_type=?,dedupe_key=?,payment_key=?,provider_order_id=?,order_merchant_external_id=?,payment_id=?,user_id=?,product=?,currency=?,amount_cents=?,state=?,paid_period_interval=?,paid_period_start=?,paid_period_end=?,raw_body=?,status=?,error=?,updated_at=?,account_id=?,provider_store_id=?,provider_environment=?,signature_verified=?,signature_timestamp=?,raw_body_sha256=? WHERE id=?`)
        .run(event.id, event.eventId, event.eventType, dedupeKey, paymentKey, event.orderId, event.orderMerchantExternalId, event.paymentId, event.userId, event.product, event.currency, event.amount, event.state, period?.interval || null, period?.start || null, period?.end || null, rawBody, 'received', null, iso(), proof.accountId, proof.storeId, proof.environment, 1, proof.signatureTimestamp, proof.rawBodySha256, String(existing.id));
      db.prepare('UPDATE billing_events SET provider_event_timestamp=? WHERE id=?').run(event.timestamp, event.id);
      return undefined;
    }
    return existing;
  }
  const period = event.paidPeriod;
  db.prepare(`INSERT INTO billing_events(id,event_id,event_type,dedupe_key,payment_key,provider_order_id,order_merchant_external_id,payment_id,user_id,product,currency,amount_cents,state,paid_period_interval,paid_period_start,paid_period_end,raw_body,status,error,created_at,updated_at,account_id,provider_store_id,provider_environment,signature_verified,signature_timestamp,raw_body_sha256)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(event.id, event.eventId, event.eventType, dedupeKey, paymentKey, event.orderId, event.orderMerchantExternalId, event.paymentId, event.userId, event.product, event.currency, event.amount, event.state, period?.interval || null, period?.start || null, period?.end || null, rawBody, 'received', null, iso(), iso(), proof.accountId, proof.storeId, proof.environment, 1, proof.signatureTimestamp, proof.rawBodySha256);
  db.prepare('UPDATE billing_events SET provider_event_timestamp=? WHERE id=?').run(event.timestamp, event.id);
  return undefined;
}

function existingEventResult(row: Row, event: CanonicalWaffoEvent): BillingWebhookResult {
  return {status: row.status === 'pending_reconciliation' ? 'pending_reconciliation' : 'duplicate', eventId: event.id, eventType: event.eventType, ...(row.payment_key ? {paymentKey: String(row.payment_key)} : {}), ...(row.order_merchant_external_id ? {localOrderId: String(row.order_merchant_external_id)} : {}), reason: String(row.status || 'already processed'), event};
}

function localOrder(db: DatabaseSync, event: CanonicalWaffoEvent): Row | undefined {
  return db.prepare('SELECT * FROM orders WHERE id=?').get(event.orderMerchantExternalId) as Row | undefined;
}

function requiresInitialProductMatch(event: CanonicalWaffoEvent): boolean {
  return event.eventType === 'order.completed' || event.eventType === 'subscription.activated';
}

function grantOneTime(db: DatabaseSync, event: CanonicalWaffoEvent, paymentKey: string, payment: Row, order: Row): string {
  const source = `waffo:${paymentKey}:pack:grant`;
  const existing = db.prepare('SELECT id FROM grants WHERE user_id=? AND source=?').get(event.userId, source) as Row | undefined;
  if (existing) return String(existing.id);
  const grantId = id();
  const purchasedAt = new Date(event.timestamp);
  const createdAt = Number.isFinite(purchasedAt.getTime()) ? purchasedAt : now();
  // The existing ledger uses a required expiry column; paid text credits do not expire.
  const expiresAt = new Date('9999-12-31T23:59:59.999Z');
  const roleExpiresAt = createdAt;
  const credits = PRODUCTS.pack.credits;
  db.prepare(`INSERT INTO grants(id,user_id,source,remaining,amount,expires_at,created_at,period_start,period_end,role_expires_at)
    VALUES(?,?,?,?,?,?,?,?,?,?)`).run(grantId, event.userId, source, credits, credits, iso(expiresAt), iso(createdAt), iso(createdAt), iso(expiresAt), iso(roleExpiresAt));
  db.prepare(`INSERT INTO ledger(id,user_id,kind,amount,description,created_at,grant_id)
    VALUES(?,?,?,?,?,?,?)`).run(id(), event.userId, 'paid_grant', credits, 'Waffo credit pack', iso(createdAt), grantId);
  db.prepare('UPDATE billing_payments SET grant_id=?,state=?,updated_at=? WHERE id=?').run(grantId, 'succeeded', iso(), String(payment.id));
  db.prepare('UPDATE orders SET status=? WHERE id=?').run('paid', String(order.id));
  return grantId;
}

function grantSubscription(db: DatabaseSync, event: CanonicalWaffoEvent, paymentKey: string, payment: Row, order: Row, period: {interval: string; start: Date; end: Date}): string {
  const grantStart = period.start;
  const billingDay = grantStart.getUTCDate();
  const grantEnd = new Date(Math.min(addMonths(grantStart, 1, billingDay).getTime(), period.end.getTime()));
  const source = `waffo:${String(payment.id)}:grant:${iso(grantStart)}`;
  const existing = db.prepare('SELECT id FROM grants WHERE user_id=? AND source=?').get(event.userId, source) as Row | undefined;
  const grantId = existing ? String(existing.id) : id();
  if (!existing) {
    const credits = PRODUCTS[event.product].credits;
    db.prepare(`INSERT INTO grants(id,user_id,source,remaining,amount,expires_at,created_at,period_start,period_end)
      VALUES(?,?,?,?,?,?,?,?,?)`).run(grantId, event.userId, source, credits, credits, iso(grantEnd), iso(grantStart), iso(grantStart), iso(grantEnd));
    db.prepare(`INSERT INTO ledger(id,user_id,kind,amount,description,created_at,grant_id)
      VALUES(?,?,?,?,?,?,?)`).run(id(), event.userId, 'paid_grant', credits, `Waffo ${PRODUCTS[event.product].name} monthly grant`, iso(grantStart), grantId);
  }
  const existingSubscription = db.prepare('SELECT cancel_at_period_end FROM subscriptions WHERE user_id=?').get(event.userId) as Row | undefined;
  const cancelAtPeriodEnd = event.eventType === 'subscription.activated' ? 0 : Number(existingSubscription?.cancel_at_period_end || 0);
  db.prepare(`INSERT INTO subscriptions(user_id,plan,interval,status,period_end,cancel_at_period_end,next_plan,next_grant_at,product,recorded_payment_at,billing_day,funding_mode)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(user_id) DO UPDATE SET plan=excluded.plan,interval=excluded.interval,status='active',period_end=excluded.period_end,cancel_at_period_end=excluded.cancel_at_period_end,next_plan=NULL,next_grant_at=excluded.next_grant_at,product=excluded.product,recorded_payment_at=excluded.recorded_payment_at,billing_day=excluded.billing_day,funding_mode=excluded.funding_mode
    WHERE julianday(excluded.period_end)>=julianday(subscriptions.period_end)`).run(event.userId, subscriptionPlan(event.product), subscriptionInterval(event.product), 'active', iso(period.end), cancelAtPeriodEnd, null, iso(addMonths(grantStart, 1, billingDay)), event.product, iso(eventDate(event.timestamp)), billingDay, 'live');
  db.prepare('UPDATE billing_payments SET grant_id=?,state=?,updated_at=? WHERE id=?').run(grantId, 'succeeded', iso(), String(payment.id));
  db.prepare('UPDATE orders SET status=? WHERE id=?').run('paid', String(order.id));
  return grantId;
}

function refundPayment(db: DatabaseSync, event: CanonicalWaffoEvent, paymentKey: string | null, order: Row | undefined): {status: BillingEventStatus; grantId?: string; reason?: string} {
  const payment = findPayment(db, event, paymentKey);
  if (!payment) {
    if (event.paymentId) {
      const placeholderKey = paymentKey || `payment:${event.paymentId}`;
      db.prepare(`INSERT INTO billing_payments(id,provider_payment_id,provider_order_id,order_merchant_external_id,user_id,product,currency,amount_cents,state,refund_status,review_required,last_event_at,created_at,updated_at)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(placeholderKey, event.paymentId, event.orderId, event.orderMerchantExternalId, event.userId, event.product, event.currency, 0, 'refund_pending_reconciliation', event.state, 0, event.timestamp, iso(), iso());
    }
    return {status: 'pending_reconciliation', reason: 'The refund arrived before its original payment was recorded.'};
  }
  const refundState = event.state.toLowerCase();
  if (['refunded', 'refunded_review'].includes(String(payment.state))) {
    return {status: 'processed', reason: 'The completed refund remains final; no balance or status was changed.'};
  }
  if (event.eventType === 'refund.failed' || refundState === 'failed' || refundState === 'rejected') {
    db.prepare('UPDATE billing_payments SET state=?,refund_status=?,last_event_at=?,updated_at=? WHERE id=?').run('refund_failed', event.state, event.timestamp, iso(), String(payment.id));
    markOrderRefundState(db, order, 'paid');
    return {status: 'processed'};
  }
  if (event.eventType !== 'refund.succeeded' && !['succeeded', 'completed', 'success'].includes(refundState)) {
    db.prepare('UPDATE billing_payments SET state=?,refund_status=?,last_event_at=?,updated_at=? WHERE id=?').run('refund_pending_reconciliation', event.state, event.timestamp, iso(), String(payment.id));
    return {status: 'pending_reconciliation', reason: 'The provider has not confirmed a successful refund.'};
  }
  const originalAmount = Number(payment.amount_cents);
  if (!Number.isSafeInteger(originalAmount) || originalAmount <= 0 || event.amount !== originalAmount) {
    db.prepare('UPDATE billing_payments SET state=?,refund_status=?,last_event_at=?,updated_at=? WHERE id=?').run('refund_pending_reconciliation', event.state, event.timestamp, iso(), String(payment.id));
    return {status: 'pending_reconciliation', reason: 'Partial or unpriced refund requires reconciliation; entitlement was not blindly deducted.'};
  }
  const revoked = revokePaymentGrants(db, payment, event.userId);
  stopRefundedPaidPeriod(db, payment);
  const grantId = revoked.grantId;
  const review = revoked.review;
  db.prepare('UPDATE billing_payments SET state=?,refund_status=?,review_required=?,last_event_at=?,updated_at=? WHERE id=?').run(review ? 'refunded_review' : 'refunded', event.state, review ? 1 : 0, event.timestamp, iso(), String(payment.id));
  markOrderRefundState(db, order, 'refunded');
  recordConfirmedRefund(db, String(payment.id), event.timestamp);
  return {status: 'processed', ...(grantId ? {grantId} : {}), ...(review ? {reason: 'Refund succeeded after credits were used; payment is marked for review.'} : {})};
}

function markOrderRefundState(db: DatabaseSync, order: Row | undefined, status: string) {
  if (order) db.prepare('UPDATE orders SET status=? WHERE id=?').run(status, String(order.id));
}

function revokePaymentGrants(db: DatabaseSync, payment: Row, userId: string): {grantId: string | null; review: boolean} {
  const grantIds = new Set<string>();
  const firstGrantId = rowString(payment, 'grant_id');
  if (firstGrantId) {
    const first = db.prepare('SELECT id FROM grants WHERE id=? AND user_id=?').get(firstGrantId, userId) as Row | undefined;
    if (first) grantIds.add(String(first.id));
  }

  // Annual payments can own the first grant and later monthly grants. Use an
  // exact prefix comparison so a refunded payment cannot touch another
  // payment's period, and avoid LIKE wildcard semantics for provider IDs.
  const sourcePrefix = `waffo:${String(payment.id)}:grant:`;
  const monthly = db.prepare(`SELECT id FROM grants
    WHERE user_id=? AND substr(source,1,?)=?`).all(userId, sourcePrefix.length, sourcePrefix) as Row[];
  for (const grant of monthly) grantIds.add(String(grant.id));

  let review = false;
  let firstId = firstGrantId || null;
  for (const grantId of grantIds) {
    const row = db.prepare('SELECT id,remaining,amount,role_expires_at FROM grants WHERE id=? AND user_id=?').get(grantId, userId) as Row | undefined;
    if (!row) continue;
    if (!firstId) firstId = String(row.id);
    const remaining = Math.max(0, Number(row.remaining) || 0);
    const used = Math.max(0, Number(row.amount) - remaining);
    if (used > 0) review = true;
    db.prepare(`UPDATE grants
      SET remaining=0,role_expires_at=CASE WHEN role_expires_at IS NOT NULL THEN ? ELSE role_expires_at END
      WHERE id=? AND user_id=?`).run(iso(), grantId, userId);
    if (remaining <= 0) continue;
    db.prepare(`INSERT INTO ledger(id,user_id,kind,amount,description,created_at,grant_id)
      VALUES(?,?,?,?,?,?,?)`).run(id(), userId, 'refund_revoke', -remaining, 'Waffo full refund revoked remaining credits', iso(), grantId);
  }
  return {grantId: firstId, review};
}

function stopRefundedPaidPeriod(db: DatabaseSync, payment: Row) {
  const periodStart = rowString(payment, 'paid_period_start');
  const periodEnd = rowString(payment, 'paid_period_end');
  const userId = rowString(payment, 'user_id');
  const product = rowString(payment, 'product');
  if (!periodStart || !periodEnd || !userId || !product) return;
  const subscription = db.prepare('SELECT period_end,product FROM subscriptions WHERE user_id=?').get(userId) as Row | undefined;
  if (!subscription || String(subscription.product) !== product || String(subscription.period_end) !== periodEnd) return;

  // A later verified payment owns a newer period. Leave that subscription
  // active so an old-period refund cannot revoke newer paid access.
  const laterPayment = db.prepare(`SELECT 1 FROM billing_payments
    WHERE user_id=? AND product=? AND state='succeeded'
      AND paid_period_start IS NOT NULL AND paid_period_start>? LIMIT 1`).get(userId, product, periodStart) as Row | undefined;
  if (laterPayment) return;
  db.prepare(`UPDATE subscriptions
    SET status='refunded',cancel_at_period_end=1,next_grant_at=?
    WHERE user_id=? AND product=? AND period_end=?`).run(periodEnd, userId, product, periodEnd);
}

function processCanonical(db: DatabaseSync, event: CanonicalWaffoEvent, rawBody: string, proof: BillingVerificationProof): BillingWebhookResult {
  const paymentKey = paymentKeyFor(event);
  const duplicate = insertCanonicalEvent(db, event, rawBody, paymentKey, proof);
  if (duplicate) return existingEventResult(duplicate, event);
  const order = localOrder(db, event);
  const user = db.prepare('SELECT id FROM users WHERE id=?').get(event.userId) as Row | undefined;
  if (!order || String(order.user_id) !== event.userId || !user) {
    markEvent(db, event.id, 'pending_reconciliation', 'Local order or user does not match orderMerchantExternalId and signed buyer identity.');
    return {status: 'pending_reconciliation', eventId: event.id, eventType: event.eventType, ...(paymentKey ? {paymentKey} : {}), reason: 'Local order/user link is missing or mismatched.', event};
  }
  if (requiresInitialProductMatch(event) && String(order.product) !== event.product) {
    markEvent(db, event.id, 'pending_reconciliation', 'Provider order product does not match the local order product.');
    return {status: 'pending_reconciliation', eventId: event.id, eventType: event.eventType, ...(paymentKey ? {paymentKey} : {}), localOrderId: String(order.id), reason: 'Provider/local product mismatch; no entitlement was issued.', event};
  }
  // The original checkout amount stays historical after a plan change. The
  // current provider product and notification price were independently checked.
  const originalProduct = asProduct(order.product);
  const expectedOrderAmount = originalProduct ? PRODUCTS[originalProduct].price : NaN;
  if (String(order.currency || '').toUpperCase() !== event.currency || Number(order.amount) !== expectedOrderAmount) {
    markEvent(db, event.id, 'pending_reconciliation', 'Local order currency or amount does not match the approved product catalog.');
    return {status: 'pending_reconciliation', eventId: event.id, eventType: event.eventType, ...(paymentKey ? {paymentKey} : {}), localOrderId: String(order.id), reason: 'Local order currency/amount mismatch; no entitlement was issued.', event};
  }
  if (event.paymentId) {
    const existingPayment = db.prepare('SELECT * FROM billing_payments WHERE provider_payment_id=?').get(event.paymentId) as Row | undefined;
    if (existingPayment && [
      ['user_id', event.userId], ['provider_order_id', event.orderId],
      ['order_merchant_external_id', event.orderMerchantExternalId], ['currency', event.currency], ['product', event.product],
    ].some(([key, value]) => String(existingPayment[key]) !== value)) {
      markEvent(db, event.id, 'pending_reconciliation', 'The payment ID is already linked to a different order, buyer or product.');
      return {status: 'pending_reconciliation', eventId: event.id, eventType: event.eventType, reason: 'Payment ownership mismatch.', event};
    }
  }
  if (grantsEntitlement(event.eventType) && ['failed', 'pending', 'processing', 'canceled'].includes(event.state.toLowerCase())) {
    markEvent(db, event.id, 'pending_reconciliation', 'A success event contradicts the reported payment state; no entitlement issued.');
    return {status: 'pending_reconciliation', eventId: event.id, eventType: event.eventType, reason: 'Payment success evidence is contradictory.', event};
  }
  linkEvent(db, event, event.eventType.startsWith('refund.') ? 'refund' : event.eventType.startsWith('subscription.') ? 'subscription' : 'payment', String(order.id));

  if (SUBSCRIPTION_STATE_EVENTS.has(event.eventType) || PLAN_CHANGE_EVENTS.has(event.eventType)) {
    const latest = db.prepare(`SELECT MAX(julianday(COALESCE(provider_event_timestamp,json_extract(raw_body,'$.timestamp')))) AS occurred
      FROM billing_events WHERE provider_order_id=? AND status='processed' AND id<>?
      AND event_type LIKE 'subscription.%'`).get(event.orderId, event.id) as Row | undefined;
    const incoming = db.prepare('SELECT julianday(?) AS occurred').get(event.timestamp) as Row;
    if (latest?.occurred != null && Number(latest.occurred) > Number(incoming.occurred)) {
      markEvent(db, event.id, 'ignored', 'An older subscription notification cannot overwrite a newer verified state.');
      return {status: 'ignored', eventId: event.id, eventType: event.eventType, reason: 'Superseded subscription state.', event};
    }
    const sub = db.prepare('SELECT status FROM subscriptions WHERE user_id=?').get(event.userId) as Row | undefined;
    if (sub?.status === 'refunded' && ['subscription.uncanceled', 'subscription.plan_changed'].includes(event.eventType)) {
      markEvent(db, event.id, 'pending_reconciliation', 'A state-only notification cannot reactivate a refunded paid period.');
      return {status: 'pending_reconciliation', eventId: event.id, eventType: event.eventType, reason: 'A new verified payment is required after refund.', event};
    }
  }

  if (event.eventType.startsWith('refund.')) {
    const result = refundPayment(db, event, event.paymentId ? `payment:${event.paymentId}` : paymentKey, order);
    markEvent(db, event.id, result.status === 'processed' ? 'processed' : 'pending_reconciliation', result.reason || null);
    return {status: result.status, eventId: event.id, eventType: event.eventType, ...(paymentKey ? {paymentKey} : {}), localOrderId: String(order.id), ...(result.grantId ? {grantId: result.grantId} : {}), ...(result.reason ? {reason: result.reason} : {}), event};
  }

  const isPaidSubscriptionEvent = SUBSCRIPTION_EVENTS.has(event.eventType) || event.eventType === 'order.completed'
    || (event.eventType === 'subscription.plan_changed' && Boolean(event.paymentEvidenceEventId));
  if (isPaidSubscriptionEvent && isSubscription(event.product)) {
    const period = periodFor(event);
    if (!period) {
      markEvent(db, event.id, 'pending_reconciliation', 'Subscription payment event has no complete paidPeriod; no grant was issued.');
      return {status: 'pending_reconciliation', eventId: event.id, eventType: event.eventType, paymentKey: paymentKey || undefined, localOrderId: String(order.id), reason: 'paidPeriod is required for a subscription grant.', event};
    }
    if (!paymentKey) {
      markEvent(db, event.id, 'pending_reconciliation', 'Subscription event has neither payment ID nor paidPeriod key.');
      return {status: 'pending_reconciliation', eventId: event.id, eventType: event.eventType, localOrderId: String(order.id), reason: 'A payment/period idempotency key is required.', event};
    }
    const existingPeriod = db.prepare(`SELECT * FROM billing_payments WHERE id=? OR
      (provider_order_id=? AND order_merchant_external_id=? AND paid_period_start=?) LIMIT 1`)
      .get(paymentKey, event.orderId, event.orderMerchantExternalId, iso(period.start)) as Row | undefined;
    if (existingPeriod && ((existingPeriod.provider_payment_id && event.paymentId && existingPeriod.provider_payment_id !== event.paymentId)
        || existingPeriod.product !== event.product || existingPeriod.user_id !== event.userId
        || (existingPeriod.paid_period_end && existingPeriod.paid_period_end !== iso(period.end)))) {
      markEvent(db, event.id, 'pending_reconciliation', 'Conflicting payment or product evidence for an already recorded paid period.');
      return {status: 'pending_reconciliation', eventId: event.id, eventType: event.eventType, reason: 'The paid period has conflicting evidence; no duplicate grant was issued.', event};
    }
    const payment = upsertPayment(db, event, paymentKey, 'succeeded', period);
    if (['refunded', 'refunded_review', 'refund_pending_reconciliation'].includes(String(payment.state))) {
      markEvent(db, event.id, 'pending_reconciliation', 'Payment was already refunded or is under refund reconciliation; no entitlement was reactivated.');
      return {status: 'pending_reconciliation', eventId: event.id, eventType: event.eventType, paymentKey, localOrderId: String(order.id), reason: 'Out-of-order paid event cannot revive refunded entitlement.', event};
    }
    if (payment.grant_id) {
      markEvent(db, event.id, 'processed', null);
      return {status: 'duplicate', eventId: event.id, eventType: event.eventType, paymentKey, grantId: String(payment.grant_id), reason: 'This paid period already has its grant.', event};
    }
    const grantId = grantSubscription(db, event, paymentKey, payment, order, period);
    recordConfirmedRevenue(db, event, String(payment.id), String(order.id));
    markEvent(db, event.id, 'processed', null);
    return {status: 'processed', eventId: event.id, eventType: event.eventType, paymentKey, localOrderId: String(order.id), grantId, event};
  }

  if (event.eventType === 'order.completed' && event.product === 'pack') {
    const key = paymentKey || `payment:${event.id}`;
    const payment = upsertPayment(db, event, key, 'succeeded', null);
    if (['refunded', 'refunded_review', 'refund_pending_reconciliation'].includes(String(payment.state))) {
      markEvent(db, event.id, 'pending_reconciliation', 'Payment was already refunded or is under refund reconciliation; no entitlement was reactivated.');
      return {status: 'pending_reconciliation', eventId: event.id, eventType: event.eventType, paymentKey: key, localOrderId: String(order.id), reason: 'Out-of-order paid event cannot revive refunded entitlement.', event};
    }
    if (payment.grant_id) {
      markEvent(db, event.id, 'processed', null);
      return {status: 'duplicate', eventId: event.id, eventType: event.eventType, paymentKey: key, grantId: String(payment.grant_id), event};
    }
    const grantId = grantOneTime(db, event, String(payment.id), payment, order);
    recordConfirmedRevenue(db, event, String(payment.id), String(order.id));
    markEvent(db, event.id, 'processed', null);
    return {status: 'processed', eventId: event.id, eventType: event.eventType, paymentKey: key, localOrderId: String(order.id), grantId, event};
  }

  if (isSubscription(event.product) && (event.eventType === 'order.completed' || SUBSCRIPTION_EVENTS.has(event.eventType))) {
    const period = periodFor(event);
    if (!period) {
      markEvent(db, event.id, 'pending_reconciliation', 'The first subscription payment has no complete paidPeriod; no grant was issued.');
      return {status: 'pending_reconciliation', eventId: event.id, eventType: event.eventType, paymentKey: paymentKey || undefined, localOrderId: String(order.id), reason: 'paidPeriod is required for the first subscription grant.', event};
    }
  }

  if (event.eventType === 'subscription.canceling') {
    db.prepare('UPDATE subscriptions SET cancel_at_period_end=1,status=CASE WHEN status=\'active\' THEN status ELSE ? END WHERE user_id=?').run('canceling', event.userId);
    markEvent(db, event.id, 'processed', null);
    return {status: 'processed', eventId: event.id, eventType: event.eventType, localOrderId: String(order.id), event};
  }
  if (event.eventType === 'subscription.plan_change_scheduled') {
    db.prepare('UPDATE subscriptions SET next_plan=? WHERE user_id=?').run(event.product, event.userId);
    markEvent(db, event.id, 'processed', null);
    return {status: 'processed', eventId: event.id, eventType: event.eventType, localOrderId: String(order.id), event};
  }
  if (event.eventType === 'subscription.plan_changed') {
    const period = periodFor(event);
    if (!period) {
      markEvent(db, event.id, 'pending_reconciliation', 'The plan change notification has no complete paidPeriod.');
      return {status: 'pending_reconciliation', eventId: event.id, eventType: event.eventType, localOrderId: String(order.id), reason: 'paidPeriod is required to apply a plan change.', event};
    }
    const funded = db.prepare(`SELECT id FROM billing_payments WHERE user_id=? AND provider_order_id=?
      AND product=? AND paid_period_start=? AND paid_period_end=? AND state='succeeded' AND grant_id IS NOT NULL`)
      .get(event.userId, event.orderId, event.product, iso(period.start), iso(period.end));
    if (!funded) {
      markEvent(db, event.id, 'pending_reconciliation', 'The new plan has no matching verified payment for its period.');
      return {status: 'pending_reconciliation', eventId: event.id, eventType: event.eventType, reason: 'Verified payment is required to apply a new paid plan.', event};
    }
    db.prepare(`UPDATE subscriptions SET plan=?,interval=?,status='active',period_end=?,cancel_at_period_end=0,next_plan=NULL,next_grant_at=?,product=?,recorded_payment_at=? WHERE user_id=?`).run(subscriptionPlan(event.product), subscriptionInterval(event.product), iso(period.end), iso(addMonths(period.start, 1)), event.product, iso(eventDate(event.timestamp)), event.userId);
    markEvent(db, event.id, 'processed', null);
    return {status: 'processed', eventId: event.id, eventType: event.eventType, localOrderId: String(order.id), event};
  }
  if (event.eventType === 'subscription.plan_change_failed') {
    db.prepare('UPDATE subscriptions SET next_plan=NULL WHERE user_id=?').run(event.userId);
    markEvent(db, event.id, 'processed', null);
    return {status: 'processed', eventId: event.id, eventType: event.eventType, localOrderId: String(order.id), event};
  }
  if (event.eventType === 'subscription.uncanceled') {
    db.prepare('UPDATE subscriptions SET cancel_at_period_end=0,status=\'active\' WHERE user_id=?').run(event.userId);
    markEvent(db, event.id, 'processed', null);
    return {status: 'processed', eventId: event.id, eventType: event.eventType, localOrderId: String(order.id), event};
  }
  if (event.eventType === 'subscription.canceled') {
    db.prepare('UPDATE subscriptions SET status=\'canceled\',cancel_at_period_end=1 WHERE user_id=?').run(event.userId);
    markEvent(db, event.id, 'processed', null);
    return {status: 'processed', eventId: event.id, eventType: event.eventType, localOrderId: String(order.id), event};
  }
  if (event.eventType === 'subscription.past_due' || event.eventType === 'subscription.payment_failed') {
    db.prepare('UPDATE subscriptions SET status=\'past_due\' WHERE user_id=?').run(event.userId);
    markEvent(db, event.id, 'processed', null);
    return {status: 'processed', eventId: event.id, eventType: event.eventType, localOrderId: String(order.id), event};
  }
  markEvent(db, event.id, 'ignored', 'Signed event was recorded but does not change local entitlement.');
  return {status: 'ignored', eventId: event.id, eventType: event.eventType, localOrderId: String(order.id), reason: 'No entitlement-changing rule is defined for this event.', event};
}

/** Verify the raw request, persist every valid event, and apply entitlement
 * changes in one local transaction. Incomplete signed events remain pending. */
export async function handleWaffoWebhook(rawBody: string, headers: WaffoHeaders, options: WaffoAdapterOptions = {}): Promise<BillingWebhookResult> {
  ensureBillingSchema();
  const envelope = verifyWebhookEnvelope(rawBody, headers, options);
  let resolvedProduct: Product | undefined;
  let providerProductId: string | undefined;
  try {
    const resolution = await resolveWebhookProduct(envelope, options);
    if (resolution.status === 'unmapped') {
      return {status: 'ignored', eventId: envelope.id, eventType: envelope.eventType, reason: resolution.reason};
    }
    resolvedProduct = resolution.product;
    providerProductId = resolution.providerProductId;
  } catch (error) {
    // Existing preview fixtures intentionally have no merchant credentials or
    // network client. Keep that local-only path deterministic; live mode always
    // fails closed and persists the signed event for reconciliation.
    const localFixtureProduct = process.env.APP_MODE === 'preview' && !options.client && !asString((options.env || process.env).WAFFO_MERCHANT_ID) && !asString((options.env || process.env).WAFFO_PRIVATE_KEY) ? metadataProduct(envelope.data) : null;
    if (localFixtureProduct) {
      resolvedProduct = localFixtureProduct;
    } else if (error instanceof WaffoWebhookError && error.code === 'WAFFO_WEBHOOK_INCOMPLETE') {
      return transaction((db) => {
        ensureBillingSchema(db);
        return pendingProviderProductLookup(db, envelope, rawBody, error.message);
      });
    } else if (error instanceof WaffoUnavailableError) {
      return transaction((db) => {
        ensureBillingSchema(db);
        // Provider/library error text can contain response details. Keep the
        // durable event and API response bounded to a safe state reason; the
        // recovery runner will query the authoritative order again.
        return pendingProviderProductLookup(db, envelope, rawBody, 'Waffo provider state is temporarily unavailable; queued for reconciliation.');
      });
    } else {
      throw error;
    }
  }
  let event: CanonicalWaffoEvent;
  try {
    event = canonicalizeBillingEnvelope(envelope, accountIdFor(metadataUserId(envelope.data)), getDb(), {
      ...options,
      resolvedProduct,
      ...(providerProductId ? {providerProductId} : {}),
    });
  } catch (error) {
    if (error instanceof WaffoWebhookError && error.code === 'WAFFO_WEBHOOK_INCOMPLETE') {
      return transaction((db) => {
        ensureBillingSchema(db);
        return pendingEnvelope(db, envelope, rawBody, error.message);
      });
    }
    throw error;
  }
  return transaction((db) => {
    ensureBillingSchema(db);
    const result = processCanonical(db, event, rawBody, {
      accountId: accountIdFor(event.userId),
      storeId: envelope.storeId,
      environment: envelope.mode,
      signatureTimestamp: envelope.signatureTimestamp || '',
      rawBodySha256: rawBodySha256(rawBody),
    });
    completePairedReceipt(db, event, result.status);
    return result;
  });
}

/** Apply a canonical event reconstructed by billing-recovery.ts. The recovery
 * module has already checked the original proof hash and provider state; this
 * function keeps the final ledger mutation on the same idempotent transaction
 * as ordinary webhook delivery. */
export function processRecoveredWaffoEvent(event: CanonicalWaffoEvent, rawBody: string, proof: BillingVerificationProof): BillingWebhookResult {
  ensureBillingSchema();
  return transaction((db) => {
    const result = processCanonical(db, event, rawBody, proof);
    completePairedReceipt(db, event, result.status);
    return result;
  });
}

function completePairedReceipt(db: DatabaseSync, event: CanonicalWaffoEvent, status: BillingEventStatus) {
  if (!event.paymentEvidenceEventId || !['processed', 'duplicate'].includes(status)) return;
  const paid = db.prepare(`SELECT id FROM billing_payments WHERE provider_payment_id=? AND provider_order_id=?
    AND user_id=? AND product=? AND state='succeeded' AND grant_id IS NOT NULL`)
    .get(event.paymentId, event.orderId, event.userId, event.product);
  if (!paid) return;
  const receipt = db.prepare(`SELECT id FROM billing_events WHERE event_id=? AND event_type='subscription.payment_succeeded'
    AND user_id=? AND provider_order_id=? AND status='pending_reconciliation'`)
    .get(event.paymentEvidenceEventId, event.userId, event.orderId) as Row | undefined;
  if (!receipt) return;
  markEvent(db, String(receipt.id), 'processed', null);
  db.prepare(`UPDATE billing_recovery SET state='processed',last_error=NULL,lease_until=NULL,updated_at=? WHERE event_id=? AND account_id=?`)
    .run(iso(), String(receipt.id), accountIdFor(event.userId));
}

function providerOrderForUser(db: DatabaseSync, userId: string, product: Product): string | null {
  const row = db.prepare(`SELECT provider_order_id FROM billing_links
    WHERE user_id=? AND product=? AND provider_order_id IS NOT NULL
    ORDER BY CASE role WHEN 'subscription' THEN 0 WHEN 'payment' THEN 1 ELSE 2 END, created_at DESC LIMIT 1`).get(userId, product) as Row | undefined;
  return rowString(row, 'provider_order_id');
}

/** Cancel/resume/switch uses the installed SDK's verified order methods in
 * live mode. Local preview only updates the local intent and never calls it. */
export async function manageSubscription(userId: string, action: 'cancel' | 'resume' | 'switch', product?: Product): Promise<SubscriptionActionResult> {
  if (!['cancel', 'resume', 'switch'].includes(action)) throw new Error('Subscription action must be cancel, resume, or switch.');
  ensureBillingSchema();
  const db = getDb();
  const sub = db.prepare('SELECT * FROM subscriptions WHERE user_id=?').get(userId) as Row | undefined;
  if (!sub || !['active', 'canceling', 'past_due'].includes(String(sub.status))) throw new Error('There is no manageable active subscription.');
  const currentProduct = asProduct(sub.product);
  if (!currentProduct) throw new Error('The local subscription product is invalid.');
  if (action === 'switch') {
    if (!product || !isSubscription(product)) throw new Error('A monthly or yearly subscription product is required for switching.');
    if (product === currentProduct) throw new Error('The requested subscription is already active.');
  }
  const currentMode = mode();
  if (currentMode === 'preview') {
    transaction((database) => {
      if (action === 'cancel') database.prepare('UPDATE subscriptions SET cancel_at_period_end=1 WHERE user_id=?').run(userId);
      else if (action === 'resume') database.prepare('UPDATE subscriptions SET cancel_at_period_end=0,next_plan=NULL,status=\'active\' WHERE user_id=?').run(userId);
      else database.prepare('UPDATE subscriptions SET next_plan=? WHERE user_id=?').run(product || null, userId);
    });
    return {action, status: action === 'cancel' ? 'canceling' : action === 'resume' ? 'active' : 'pending', subscription: getDb().prepare('SELECT * FROM subscriptions WHERE user_id=?').get(userId) as Row};
  }
  const providerOrderId = providerOrderForUser(db, userId, currentProduct);
  if (!providerOrderId) throw new Error('The provider subscription order is not linked locally; subscription action is pending reconciliation.');
  const user = db.prepare('SELECT email FROM users WHERE id=?').get(userId) as Row | undefined;
  const email = rowString(user, 'email');
  if (!email) throw new Error('The billing user email is missing.');
  const provider = await manageWaffoSubscription({action, providerOrderId, userId, email, ...(product ? {product} : {}), returnUrl: returnUrl()});
  transaction((database) => {
    if (action === 'cancel') database.prepare('UPDATE subscriptions SET cancel_at_period_end=1 WHERE user_id=?').run(userId);
    else if (action === 'resume') database.prepare('UPDATE subscriptions SET cancel_at_period_end=0,next_plan=NULL,status=\'active\' WHERE user_id=?').run(userId);
    else database.prepare('UPDATE subscriptions SET next_plan=? WHERE user_id=?').run(product || null, userId);
  });
  return {action, status: provider.status, ...(provider.checkoutUrl ? {checkoutUrl: provider.checkoutUrl} : {}), subscription: getDb().prepare('SELECT * FROM subscriptions WHERE user_id=?').get(userId) as Row};
}

export function ensureBillingTables() {
  ensureBillingSchema();
}
