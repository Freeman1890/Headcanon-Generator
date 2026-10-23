import { randomUUID } from 'node:crypto';
import { sanitizeAttributionInput, ATTRIBUTION_LIFETIME, type AttributionTouch, type AttributionInput } from '../lib/attribution-input';
import type { SourceRevenueSummary } from '../lib/order-source-report-types';
import type { DatabaseSync } from './db-types';
import type { CanonicalWaffoEvent } from './waffo';
import { ATTRIBUTION_SCHEMA } from './attribution-schema';

type Row = Record<string, unknown>;
const DAY = 86_400_000;
export function ensureAttributionTables(db: DatabaseSync) { db.exec(ATTRIBUTION_SCHEMA); }
function decode(value: unknown): AttributionTouch | null {
  if (typeof value !== 'string') return null;
  try { return JSON.parse(value) as AttributionTouch; } catch { return null; }
}
const encode = (value: AttributionTouch | null | undefined) => value ? JSON.stringify(value) : null;

/** This is optional analytics data, never an authority for price, identity or payment. */
export function updateUserAttribution(db: DatabaseSync, userId: string, value: unknown, now = Date.now()): AttributionInput {
  ensureAttributionTables(db);
  const input = sanitizeAttributionInput(value, now);
  const granted = input.consent === 'granted' && typeof input.consentExpiresAt === 'number';
  const explicitDenial = value !== null && typeof value === 'object' && 'consent' in value && value.consent === 'denied';
  if (!granted && !explicitDenial) return {consent:'denied' as const,first:null,last:null};
  const old = db.prepare('SELECT * FROM user_attribution WHERE user_id=?').get(userId);
  const existing = old?.consent === 1 && Number(old.consent_expires_at) > now;
  const oldFirst = existing ? decode(old.first_touch) : null;
  const oldLast = existing ? decode(old.last_touch) : null;
  const validOldFirst = oldFirst && oldFirst.at >= now - ATTRIBUTION_LIFETIME ? oldFirst : null;
  const validOldLast = oldLast && oldLast.at >= now - ATTRIBUTION_LIFETIME ? oldLast : null;
  const first = granted ? (validOldFirst && (!input.first || validOldFirst.at <= input.first.at) ? validOldFirst : input.first) : null;
  const last = granted ? (validOldLast && validOldLast.at > (input.last?.at || 0) ? validOldLast : input.last || validOldLast) : null;
  db.prepare(`INSERT INTO user_attribution(user_id,consent,consent_expires_at,first_touch,last_touch,updated_at)
    VALUES(?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET consent=excluded.consent,
    consent_expires_at=excluded.consent_expires_at,first_touch=excluded.first_touch,last_touch=excluded.last_touch,updated_at=excluded.updated_at`)
    .run(userId, granted ? 1 : 0, granted ? input.consentExpiresAt! : 0, encode(first), encode(last && last.at >= now - ATTRIBUTION_LIFETIME ? last : null), now);
  if (!granted) {
    db.prepare('UPDATE order_attribution SET ga_client_id=NULL,ga_session_id=NULL WHERE user_id=?').run(userId);
    db.prepare(`UPDATE ga_revenue_outbox SET status='consent_denied' WHERE status='queued'
      AND revenue_id IN (SELECT id FROM revenue_events WHERE user_id=?)`).run(userId);
    db.prepare("UPDATE revenue_events SET ga_status='consent_denied' WHERE user_id=? AND ga_status='queued'").run(userId);
  }
  return { ...input, consent: granted ? 'granted' as const : 'denied' as const, first, last };
}

export function snapshotOrderAttribution(db: DatabaseSync, userId: string, orderId: string, value: unknown, now = Date.now()) {
  const input = updateUserAttribution(db, userId, value, now);
  const granted = input.consent === 'granted';
  db.prepare(`INSERT OR IGNORE INTO order_attribution
    (order_id,user_id,consent,consent_expires_at,first_touch,last_touch,ga_client_id,ga_session_id) VALUES(?,?,?,?,?,?,?,?)`)
    .run(orderId,userId,granted ? 1 : 0,granted ? input.consentExpiresAt! : 0,
      granted ? encode(input.first) : null,granted ? encode(input.last) : null,
      granted ? input.gaClientId || null : null,granted ? input.gaSessionId || null : null);
}

/** Called only in the transaction that grants a verified Waffo payment. */
export function recordConfirmedRevenue(db: DatabaseSync, event: CanonicalWaffoEvent, paymentKey: string, orderId: string, now = Date.now()) {
  ensureAttributionTables(db);
  const order = db.prepare('SELECT o.mode,u.mode AS user_mode FROM orders o JOIN users u ON u.id=o.user_id WHERE o.id=? AND o.user_id=?').get(orderId,event.userId);
  if (order?.mode !== 'live' || order.user_mode !== 'live') return;
  const payment = db.prepare("SELECT * FROM billing_payments WHERE id=? AND user_id=? AND state='succeeded' AND grant_id IS NOT NULL").get(paymentKey,event.userId);
  if (!payment || !Number.isSafeInteger(Number(payment.amount_cents)) || Number(payment.amount_cents) <= 0) return;
  const a = db.prepare('SELECT * FROM order_attribution WHERE order_id=? AND user_id=?').get(orderId,event.userId);
  const user = db.prepare('SELECT * FROM user_attribution WHERE user_id=?').get(event.userId);
  const allowed = a?.consent === 1 && Number(a.consent_expires_at) > now && user?.consent === 1 && Number(user.consent_expires_at) > now;
  const previous = payment.paid_period_start && db.prepare(`SELECT 1 FROM billing_payments WHERE provider_order_id=? AND user_id=?
    AND paid_period_start<? AND grant_id IS NOT NULL LIMIT 1`).get(payment.provider_order_id,event.userId,payment.paid_period_start);
  const kind = event.eventType === 'subscription.renewed' || previous ? 'renewal' : 'purchase';
  const status = allowed && a.ga_client_id ? 'queued' : 'not_eligible';
  const id = randomUUID();
  const inserted = db.prepare(`INSERT OR IGNORE INTO revenue_events
    (id,user_id,order_id,payment_key,product,amount_cents,currency,kind,occurred_at,first_source,last_source,ga_status)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`).run(id,event.userId,orderId,paymentKey,payment.product,payment.amount_cents,payment.currency,kind,
      event.timestamp,allowed ? decode(a.first_touch)?.source || 'unknown' : 'unknown',allowed ? decode(a.last_touch)?.source || 'unknown' : 'unknown',status);
  // A delayed first-period receipt can arrive after a later paid period.
  db.prepare(`UPDATE revenue_events SET kind='renewal' WHERE user_id=? AND order_id=? AND kind='purchase'
    AND EXISTS(SELECT 1 FROM billing_payments p JOIN billing_payments earlier
      ON earlier.provider_order_id=p.provider_order_id AND earlier.user_id=p.user_id
      AND earlier.paid_period_start<p.paid_period_start AND earlier.grant_id IS NOT NULL
      WHERE p.id=revenue_events.payment_key)`).run(event.userId,orderId);
  if (Number(inserted.changes) && status === 'queued') db.prepare(`INSERT INTO ga_revenue_outbox
    (id,revenue_id,event_name,occurred_at,status,next_attempt_at) VALUES(?,?,'purchase',?,'queued',?)`).run(randomUUID(),id,event.timestamp,now);
}

export function recordConfirmedRefund(db: DatabaseSync, paymentKey: string, occurredAt: string, now = Date.now()) {
  ensureAttributionTables(db);
  const revenue = db.prepare('SELECT id,refunded,ga_status FROM revenue_events WHERE payment_key=?').get(paymentKey);
  if (!revenue || revenue.refunded) return;
  db.prepare('UPDATE revenue_events SET refunded=1 WHERE id=?').run(revenue.id);
  // Send the refund after its purchase, preserving the same opaque transaction ID.
  if (['queued','sent'].includes(String(revenue.ga_status))) db.prepare(`INSERT OR IGNORE INTO ga_revenue_outbox
    (id,revenue_id,event_name,occurred_at,status,next_attempt_at) VALUES(?,?,'refund',?,'queued',?)`).run(randomUUID(),revenue.id,occurredAt,now);
}

/** Historical records are authoritative receipts, but have no inferred visitor source and are never uploaded to GA. */
export function backfillUnknownRevenue(db: DatabaseSync, userId: string) {
  ensureAttributionTables(db);
  db.prepare(`INSERT OR IGNORE INTO revenue_events
    (id,user_id,order_id,payment_key,product,amount_cents,currency,kind,occurred_at,first_source,last_source,refunded,ga_status)
    SELECT 'historical:'||p.id,p.user_id,o.id,p.id,p.product,p.amount_cents,p.currency,
      CASE WHEN EXISTS(SELECT 1 FROM billing_payments prior WHERE prior.user_id=p.user_id
        AND prior.provider_order_id=p.provider_order_id AND prior.paid_period_start<p.paid_period_start AND prior.grant_id IS NOT NULL)
        THEN 'renewal' ELSE 'purchase' END,
      p.created_at,'unknown','unknown',CASE WHEN p.state IN ('refunded','refunded_review') THEN 1 ELSE 0 END,'historical'
    FROM billing_payments p JOIN orders o ON o.id=p.order_merchant_external_id AND o.user_id=p.user_id
    JOIN users u ON u.id=p.user_id WHERE p.user_id=? AND p.grant_id IS NOT NULL AND p.amount_cents>0
      AND o.mode='live' AND u.mode='live' AND p.state IN ('succeeded','refunded','refunded_review','refund_failed','refund_pending_reconciliation')`).run(userId);
}

export function sourceRevenueSummary(db: DatabaseSync, userId: string): SourceRevenueSummary[] {
  backfillUnknownRevenue(db,userId);
  return db.prepare(`SELECT last_source AS source,currency,
    SUM(CASE WHEN kind='purchase' THEN 1 ELSE 0 END) AS purchases,
    SUM(CASE WHEN kind='purchase' THEN amount_cents ELSE 0 END) AS purchaseCents,
    SUM(CASE WHEN kind='renewal' THEN 1 ELSE 0 END) AS renewals,
    SUM(CASE WHEN kind='renewal' THEN amount_cents ELSE 0 END) AS renewalCents,
    SUM(refunded) AS refundedPayments FROM revenue_events WHERE user_id=? GROUP BY last_source,currency`).all(userId) as unknown as SourceRevenueSummary[];
}

export type GaRevenueConfig = { measurementId?: string; apiSecret?: string; fetcher?: typeof fetch; now?: number };
export function nextRevenueAlarm(db: DatabaseSync): number | null {
  const row = db.prepare("SELECT MIN(next_attempt_at) AS due FROM ga_revenue_outbox WHERE status='queued'").get();
  return row?.due == null ? null : Number(row.due);
}

/** Bounded outbox delivery runs in the account alarm, never in the checkout/webhook response. */
export async function drainRevenueOutbox(db: DatabaseSync, config: GaRevenueConfig = {}) {
  const now = config.now ?? Date.now();
  const measurementId = config.measurementId || process.env.GA4_MEASUREMENT_ID;
  const secret = config.apiSecret || process.env.GA4_API_SECRET;
  const rows = db.prepare(`SELECT q.*,r.user_id,r.order_id,r.amount_cents,r.currency,r.product,r.kind,r.ga_status,
    r.first_source,r.last_source,a.ga_client_id,a.ga_session_id,a.consent_expires_at,
    u.consent,u.consent_expires_at AS current_expiry
    FROM ga_revenue_outbox q JOIN revenue_events r ON r.id=q.revenue_id
    LEFT JOIN order_attribution a ON a.order_id=r.order_id LEFT JOIN user_attribution u ON u.user_id=r.user_id
    WHERE q.status='queued' AND q.next_attempt_at<=? ORDER BY CASE q.event_name WHEN 'purchase' THEN 0 ELSE 1 END,q.occurred_at LIMIT 3`).all(now);
  for (const row of rows) {
    const finish = (status: string) => {
      db.prepare('UPDATE ga_revenue_outbox SET status=? WHERE id=?').run(status,row.id);
      if (row.event_name === 'purchase') db.prepare('UPDATE revenue_events SET ga_status=? WHERE id=?').run(status,row.revenue_id);
    };
    const occurred = Date.parse(String(row.occurred_at));
    if (row.consent !== 1 || Number(row.current_expiry) <= now || Number(row.consent_expires_at) <= now || !row.ga_client_id) { finish('consent_denied'); continue; }
    if (!Number.isFinite(occurred) || occurred < now - 3*DAY || occurred > now + 60_000) { finish('expired'); continue; }
    if (row.event_name === 'refund') {
      const purchase = db.prepare('SELECT ga_status FROM revenue_events WHERE id=?').get(row.revenue_id);
      if (purchase?.ga_status !== 'sent') {
        if (purchase?.ga_status !== 'queued') finish('purchase_not_sent');
        else db.prepare('UPDATE ga_revenue_outbox SET next_attempt_at=? WHERE id=?').run(now+60_000,row.id);
        continue;
      }
    }
    if (!secret || !measurementId || !/^G-[A-Z0-9]+$/.test(measurementId)) {
      db.prepare('UPDATE ga_revenue_outbox SET next_attempt_at=? WHERE id=?').run(now+6*60*60_000,row.id);
      continue;
    }
    // A past checkout session is not a new visit on automatic renewal.
    const session = Number(row.ga_session_id);
    const recentSession = Number.isSafeInteger(session) && session > 0 && session*1000 <= occurred && occurred-session*1000 < DAY && now-session*1000 < DAY;
    const payload = {
      client_id: String(row.ga_client_id), timestamp_micros: occurred*1000,
      consent: { ad_user_data: 'DENIED', ad_personalization: 'DENIED' },
      events: [{name: row.event_name,params: {
        transaction_id: row.revenue_id, currency: row.currency, value: Number(row.amount_cents)/100,
        purchase_type: row.kind, order_first_source: row.first_source, order_last_source: row.last_source,
        ...(recentSession && row.kind !== 'renewal' ? {session_id: session} : {}),
        items: [{item_id: row.product,item_name: row.product,price: Number(row.amount_cents)/100,quantity: 1}],
      }}],
    };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(),3000);
    try {
      const response = await (config.fetcher || fetch)(`https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(secret)}`,
        {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
      if (!response.ok) throw new Error('Analytics delivery deferred.');
      // HTTP acknowledgement does not prove GA reporting/ingestion. Report this distinction in release evidence.
      finish('sent');
    } catch {
      // Unlike purchase transaction IDs, refund retries have no guaranteed GA deduplication.
      if (row.event_name === 'refund') { finish('delivery_uncertain'); continue; }
      const attempts = Number(row.attempts)+1;
      if (attempts >= 8) finish('delivery_failed');
      else db.prepare('UPDATE ga_revenue_outbox SET attempts=?,next_attempt_at=? WHERE id=?')
        .run(attempts,now+Math.min(6*60*60_000,60_000*2**attempts),row.id);
    } finally { clearTimeout(timer); }
  }
}
