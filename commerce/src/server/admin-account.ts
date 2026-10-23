import type { DatabaseSync } from './db-types';
import { getDb } from './db';

/**
 * The operator inspector is deliberately account-local.  The caller reaches
 * this module through an AccountState binding RPC after the owner session has
 * been checked by the edge router; this module never accepts a user supplied
 * account id as an authentication decision.
 */

export const ADMIN_ACCOUNT_TABS = [
  'orders',
  'subscription',
  'credits',
  'tasks',
  'tickets',
  'moderation',
  'usage',
] as const;

export type AdminAccountTab = (typeof ADMIN_ACCOUNT_TABS)[number];

export interface AdminAccountIdentity {
  id: string;
  email: string;
  name: string;
  registeredAt: string;
}

export interface AdminAccountPage {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AdminAccountOrder {
  id: string;
  product: string;
  amount: number;
  currency: string;
  status: string;
  mode: string;
  createdAt: string;
  attribution?: OrderAttributionView | null;
  payments?: OrderPaymentSummary[] | null;
  settlement: {
    state: string;
    refundStatus: string | null;
    reviewRequired: boolean;
    periodStart: string | null;
    periodEnd: string | null;
    updatedAt: string | null;
  } | null;
}

export interface SourceTouchView {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  landingPath: string | null;
}

export interface OrderAttributionView {
  first: SourceTouchView | null;
  last: SourceTouchView | null;
}

export interface OrderPaymentSummary {
  currency: string;
  purchases: number;
  purchaseCents: number;
  renewals: number;
  renewalCents: number;
  refundedPayments: number;
}

export interface AdminAccountSubscription {
  plan: string;
  interval: string;
  status: string;
  periodEnd: string;
  cancelAtPeriodEnd: boolean;
  nextPlan: string | null;
  nextGrantAt: string | null;
  product: string;
  recordedPaymentAt: string;
  fundingMode: string;
  providerState: string | null;
  providerRefundStatus: string | null;
  providerReviewRequired: boolean;
  providerUpdatedAt: string | null;
}

export interface AdminAccountCredit {
  id: string;
  kind: string;
  amount: number;
  description: string;
  createdAt: string;
  grantRemaining: number | null;
  grantAmount: number | null;
  grantExpiresAt: string | null;
  sourceKind: string | null;
}

export interface AdminAccountTaskChild {
  id: string;
  label: string;
  status: string;
  hasError: boolean;
}

export interface AdminAccountTask {
  id: string;
  operation: string;
  status: string;
  cost: number;
  createdAt: string;
  children: AdminAccountTaskChild[];
}

export interface AdminAccountTicket {
  id: string;
  type: string;
  message: string;
  orderId: string | null;
  status: string;
  createdAt: string;
}

export interface AdminAccountModeration {
  userId: string;
  jobId: string;
  childId: string;
  phase: string;
  operation: string;
  provider: string;
  model: string;
  decision: string;
  categories: string[];
  reason: string;
  durationMs: number;
  createdAt: string;
}

export interface AdminAccountUsage {
  provider: string;
  jobId: string;
  childId: string;
  model: string;
  state: string;
  creditsConsumed: number | null;
  durationMs: number | null;
  elapsedMs: number | null;
  firstObservedAt: string;
  lastObservedAt: string;
}

export type AdminAccountItem =
  | AdminAccountOrder
  | AdminAccountSubscription
  | AdminAccountCredit
  | AdminAccountTask
  | AdminAccountTicket
  | AdminAccountModeration
  | AdminAccountUsage;

export interface AdminAccountInspection {
  account: AdminAccountIdentity;
  tab: AdminAccountTab;
  pagination: AdminAccountPage;
  items: AdminAccountItem[];
  subscription: AdminAccountSubscription | null;
}

interface Row extends Record<string, unknown> {}

export interface AdminAccountQueryOptions {
  tab: AdminAccountTab;
  page: number;
  pageSize: number;
  search: string;
}

function rowString(row: Row | undefined, key: string): string | null {
  const value = row?.[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function rowNumber(row: Row | undefined, key: string): number | null {
  if (!row) return null;
  const raw = row[key];
  if (raw === null || raw === undefined || raw === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function hasTable(db: DatabaseSync, table: string) {
  return Boolean(
    db.prepare("SELECT 1 AS present FROM sqlite_master WHERE type='table' AND name=?")
      .get(table),
  );
}

function pageOf(total: number, requestedPage: number, requestedPageSize: number) {
  const pageSize = Math.max(1, Math.min(25, Math.trunc(requestedPageSize)));
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, Math.trunc(requestedPage)), totalPages);
  return {
    page,
    pageSize,
    total,
    totalPages,
    offset: (page - 1) * pageSize,
  };
}

function searchClause(search: string, columns: string[]) {
  if (!search) return { sql: '1=1', values: [] as string[] };
  const sql = columns.map((column) => `instr(lower(${column}), lower(?)) > 0`).join(' OR ');
  return { sql: `(${sql})`, values: columns.map(() => search) };
}

function sourceKind(source: string | null) {
  if (!source) return null;
  if (source.startsWith('waffo:')) return 'waffo';
  if (source.startsWith('preview:')) return 'preview';
  if (source.startsWith('free:')) return 'free';
  return 'internal';
}

function categories(value: unknown): string[] {
  if (typeof value !== 'string') return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string').slice(0, 32)
      : [];
  } catch {
    return [];
  }
}

function latestWaffoPayment(db: DatabaseSync, userId: string, orderId?: string, product?: string) {
  if (!hasTable(db, 'billing_payments')) return undefined;
  const fields = `SELECT state,refund_status,review_required,paid_period_start,paid_period_end,
    COALESCE(last_event_at,updated_at,created_at) AS updated_at
    FROM billing_payments WHERE user_id=?`;
  let row: Row | undefined;
  if (orderId && product) {
    row = db.prepare(`${fields} AND order_merchant_external_id=? AND product=?
      ORDER BY COALESCE(last_event_at,updated_at,created_at) DESC,id DESC LIMIT 1`).get(userId, orderId, product) as Row | undefined;
  } else if (orderId) {
    row = db.prepare(`${fields} AND order_merchant_external_id=?
      ORDER BY COALESCE(last_event_at,updated_at,created_at) DESC,id DESC LIMIT 1`).get(userId, orderId) as Row | undefined;
  } else if (product) {
    row = db.prepare(`${fields} AND product=?
      ORDER BY COALESCE(last_event_at,updated_at,created_at) DESC,id DESC LIMIT 1`).get(userId, product) as Row | undefined;
  } else {
    row = db.prepare(`${fields}
      ORDER BY COALESCE(last_event_at,updated_at,created_at) DESC,id DESC LIMIT 1`).get(userId) as Row | undefined;
  }
  if (!row) return undefined;
  return {
    state: String(row.state || 'unknown'),
    refundStatus: rowString(row, 'refund_status'),
    reviewRequired: Number(row.review_required || 0) === 1,
    periodStart: rowString(row, 'paid_period_start'),
    periodEnd: rowString(row, 'paid_period_end'),
    updatedAt: rowString(row, 'updated_at'),
  };
}

function publicTouch(value: unknown): SourceTouchView | null {
  if (typeof value !== 'string') return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const touch = parsed as Record<string, unknown>;
    const safe = (key: keyof SourceTouchView) => typeof touch[key] === 'string' && touch[key] !== ''
      ? String(touch[key]) : null;
    return { source: safe('source'), medium: safe('medium'), campaign: safe('campaign'), landingPath: safe('landingPath') };
  } catch {
    return null;
  }
}

function orderAttribution(db: DatabaseSync, accountId: string, orderId: string): OrderAttributionView | null {
  if (!hasTable(db, 'order_attribution')) return null;
  // Select only consent and the two touch records; never return GA identifiers or raw JSON.
  const row = db.prepare(`SELECT consent,first_touch,last_touch FROM order_attribution
    WHERE order_id=? AND user_id=?`).get(orderId, accountId) as Row | undefined;
  if (!row || Number(row.consent) !== 1) return null;
  return { first: publicTouch(row.first_touch), last: publicTouch(row.last_touch) };
}

function orderPayments(db: DatabaseSync, accountId: string, orderId: string): OrderPaymentSummary[] | null {
  if (!hasTable(db, 'revenue_events')) return null;
  const rows = db.prepare(`SELECT currency,
    SUM(CASE WHEN kind='purchase' THEN 1 ELSE 0 END) AS purchases,
    SUM(CASE WHEN kind='purchase' THEN amount_cents ELSE 0 END) AS purchase_cents,
    SUM(CASE WHEN kind='renewal' THEN 1 ELSE 0 END) AS renewals,
    SUM(CASE WHEN kind='renewal' THEN amount_cents ELSE 0 END) AS renewal_cents,
    SUM(CASE WHEN refunded=1 THEN 1 ELSE 0 END) AS refunded_payments
    FROM revenue_events WHERE user_id=? AND order_id=? AND kind IN ('purchase','renewal')
    GROUP BY currency ORDER BY currency`).all(accountId, orderId) as Row[];
  return rows.map(row => ({
    currency: String(row.currency),
    purchases: Number(row.purchases),
    purchaseCents: Number(row.purchase_cents),
    renewals: Number(row.renewals),
    renewalCents: Number(row.renewal_cents),
    refundedPayments: Number(row.refunded_payments),
  }));
}

function identityFor(db: DatabaseSync, accountId: string): AdminAccountIdentity | null {
  const row = db.prepare(`SELECT id,email,name,created_at,mode FROM users WHERE id=?`).get(accountId) as Row | undefined;
  if (!row || String(row.mode) !== 'live') return null;
  return {
    id: String(row.id),
    email: String(row.email),
    name: String(row.name),
    registeredAt: String(row.created_at),
  };
}

function queryOrders(db: DatabaseSync, accountId: string, options: AdminAccountQueryOptions) {
  const clause = searchClause(options.search, ['id', 'product', 'status']);
  const base = `FROM orders WHERE user_id=? AND ${clause.sql}`;
  const total = Number((db.prepare(`SELECT COUNT(*) AS total ${base}`).get(accountId, ...clause.values) as Row).total || 0);
  const page = pageOf(total, options.page, options.pageSize);
  const rows = db.prepare(`SELECT id,product,amount,currency,status,mode,created_at ${base}
    ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?`).all(accountId, ...clause.values, page.pageSize, page.offset) as Row[];
  const items: AdminAccountOrder[] = rows.map((row) => {
    const settlement = latestWaffoPayment(db, accountId, String(row.id));
    return {
      id: String(row.id),
      product: String(row.product),
      amount: Number(row.amount),
      currency: String(row.currency),
      status: String(row.status),
      mode: String(row.mode),
      createdAt: String(row.created_at),
      attribution: orderAttribution(db, accountId, String(row.id)),
      payments: orderPayments(db, accountId, String(row.id)),
      settlement: settlement
        ? {
            state: settlement.state,
            refundStatus: settlement.refundStatus,
            reviewRequired: settlement.reviewRequired,
            periodStart: settlement.periodStart,
            periodEnd: settlement.periodEnd,
            updatedAt: settlement.updatedAt,
          }
        : null,
    };
  });
  return { page, items };
}

function querySubscription(db: DatabaseSync, accountId: string, options: AdminAccountQueryOptions) {
  const row = db.prepare(`SELECT plan,interval,status,period_end,cancel_at_period_end,next_plan,
    next_grant_at,product,recorded_payment_at,funding_mode
    FROM subscriptions WHERE user_id=?`).get(accountId) as Row | undefined;
  const item = row
    ? (() => {
        const provider = latestWaffoPayment(db, accountId, undefined, String(row.product));
        return {
          plan: String(row.plan),
          interval: String(row.interval),
          status: String(row.status),
          periodEnd: String(row.period_end),
          cancelAtPeriodEnd: Number(row.cancel_at_period_end || 0) === 1,
          nextPlan: rowString(row, 'next_plan'),
          nextGrantAt: rowString(row, 'next_grant_at'),
          product: String(row.product),
          recordedPaymentAt: String(row.recorded_payment_at),
          fundingMode: String(row.funding_mode || 'unknown'),
          providerState: provider?.state ?? null,
          providerRefundStatus: provider?.refundStatus ?? null,
          providerReviewRequired: provider?.reviewRequired ?? false,
          providerUpdatedAt: provider?.updatedAt ?? null,
        } satisfies AdminAccountSubscription;
      })()
    : null;
  const matches = !item || !options.search
    ? Boolean(item)
    : [item.plan, item.interval, item.status, item.product, item.fundingMode]
        .some((value) => value.toLowerCase().includes(options.search.toLowerCase()));
  const total = matches ? 1 : 0;
  const page = pageOf(total, options.page, options.pageSize);
  return { page, items: item && matches ? [item] : [], subscription: item && matches ? item : null };
}

function queryCredits(db: DatabaseSync, accountId: string, options: AdminAccountQueryOptions) {
  const clause = searchClause(options.search, ['l.id', 'l.kind', 'l.description']);
  const base = `FROM ledger l WHERE l.user_id=? AND ${clause.sql}`;
  const total = Number((db.prepare(`SELECT COUNT(*) AS total ${base}`).get(accountId, ...clause.values) as Row).total || 0);
  const page = pageOf(total, options.page, options.pageSize);
  const rows = db.prepare(`SELECT l.id,l.kind,l.amount,l.description,l.created_at,
    g.remaining AS grant_remaining,g.amount AS grant_amount,g.expires_at AS grant_expires_at,g.source AS grant_source
    ${base.replace('FROM ledger l', 'FROM ledger l LEFT JOIN grants g ON g.id=l.grant_id')}
    ORDER BY l.created_at DESC,l.id DESC LIMIT ? OFFSET ?`).all(accountId, ...clause.values, page.pageSize, page.offset) as Row[];
  const items: AdminAccountCredit[] = rows.map((row) => ({
    id: String(row.id),
    kind: String(row.kind),
    amount: Number(row.amount),
    description: String(row.description),
    createdAt: String(row.created_at),
    grantRemaining: rowNumber(row, 'grant_remaining'),
    grantAmount: rowNumber(row, 'grant_amount'),
    grantExpiresAt: rowString(row, 'grant_expires_at'),
    // Waffo payment IDs are embedded in live grant source strings; expose only
    // a coarse provenance label to keep provider identifiers private.
    sourceKind: sourceKind(rowString(row, 'grant_source')),
  }));
  return { page, items };
}

function queryTasks(db: DatabaseSync, accountId: string, options: AdminAccountQueryOptions) {
  if (hasTable(db, 'text_generations')) {
    const clause = searchClause(options.search, ['id', 'status']);
    const base = `FROM text_generations WHERE user_id=? AND ${clause.sql}`;
    const total = Number((db.prepare(`SELECT COUNT(*) AS total ${base}`).get(accountId, ...clause.values) as Row).total || 0);
    const page = pageOf(total, options.page, options.pageSize);
    const rows = db.prepare(`SELECT id,status,created_at,error ${base} ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?`)
      .all(accountId, ...clause.values, page.pageSize, page.offset) as Row[];
    return { page, items: rows.map(row => ({ id: String(row.id), operation: 'headcanon', status: String(row.status),
      cost: row.status === 'succeeded' ? 1 : 0, createdAt: new Date(Number(row.created_at)).toISOString(),
      children: [{ id: String(row.id), label: 'Five headcanon ideas', status: String(row.status), hasError: Boolean(row.error) }],
    } satisfies AdminAccountTask)) };
  }
  const clause = searchClause(options.search, ['id', 'operation', 'status']);
  const base = `FROM jobs WHERE user_id=? AND ${clause.sql}`;
  const total = Number((db.prepare(`SELECT COUNT(*) AS total ${base}`).get(accountId, ...clause.values) as Row).total || 0);
  const page = pageOf(total, options.page, options.pageSize);
  const rows = db.prepare(`SELECT id,operation,status,cost,created_at ${base}
    ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?`).all(accountId, ...clause.values, page.pageSize, page.offset) as Row[];
  const items: AdminAccountTask[] = rows.map((row) => {
    const children = db.prepare(`SELECT id,label,status,error FROM job_children WHERE job_id=? ORDER BY position,id`)
      .all(String(row.id)) as Row[];
    return {
      id: String(row.id),
      operation: String(row.operation),
      status: String(row.status),
      cost: Number(row.cost),
      createdAt: String(row.created_at),
      children: children.map((child) => ({
        id: String(child.id),
        label: String(child.label),
        status: String(child.status),
        // Child errors can contain provider responses; report presence only.
        hasError: typeof child.error === 'string' && child.error.length > 0,
      })),
    };
  });
  return { page, items };
}

function queryTickets(db: DatabaseSync, accountId: string, options: AdminAccountQueryOptions) {
  const clause = searchClause(options.search, ['id', 'type', 'status', 'message']);
  const base = `FROM support_tickets WHERE user_id=? AND ${clause.sql}`;
  const total = Number((db.prepare(`SELECT COUNT(*) AS total ${base}`).get(accountId, ...clause.values) as Row).total || 0);
  const page = pageOf(total, options.page, options.pageSize);
  const rows = db.prepare(`SELECT id,type,message,order_id,status,created_at ${base}
    ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?`).all(accountId, ...clause.values, page.pageSize, page.offset) as Row[];
  const items: AdminAccountTicket[] = rows.map((row) => ({
    id: String(row.id),
    type: String(row.type),
    message: String(row.message),
    orderId: rowString(row, 'order_id'),
    status: String(row.status),
    createdAt: String(row.created_at),
  }));
  return { page, items };
}

function queryModeration(db: DatabaseSync, accountId: string, options: AdminAccountQueryOptions) {
  if (!hasTable(db, 'moderation_events')) {
    return { page: pageOf(0, options.page, options.pageSize), items: [] as AdminAccountModeration[] };
  }
  const clause = searchClause(options.search, ['job_id', 'child_id', 'phase', 'operation', 'provider', 'model', 'decision', 'reason']);
  const base = `FROM moderation_events WHERE user_id=? AND ${clause.sql}`;
  const total = Number((db.prepare(`SELECT COUNT(*) AS total ${base}`).get(accountId, ...clause.values) as Row).total || 0);
  const page = pageOf(total, options.page, options.pageSize);
  const rows = db.prepare(`SELECT user_id,job_id,child_id,phase,operation,provider,model,decision,categories,reason,duration_ms,created_at ${base}
    ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?`).all(accountId, ...clause.values, page.pageSize, page.offset) as Row[];
  const items: AdminAccountModeration[] = rows.map((row) => ({
    userId: String(row.user_id),
    jobId: String(row.job_id),
    childId: String(row.child_id),
    phase: String(row.phase),
    operation: String(row.operation),
    provider: String(row.provider),
    model: String(row.model),
    decision: String(row.decision),
    categories: categories(row.categories),
    reason: String(row.reason),
    durationMs: Number(row.duration_ms),
    createdAt: String(row.created_at),
  }));
  return { page, items };
}

function queryUsage(db: DatabaseSync, accountId: string, options: AdminAccountQueryOptions) {
  if (hasTable(db, 'text_generations')) {
    const clause = searchClause(options.search, ['id', 'status']);
    const base = `FROM text_generations WHERE user_id=? AND ${clause.sql}`;
    const total = Number((db.prepare(`SELECT COUNT(*) AS total ${base}`).get(accountId, ...clause.values) as Row).total || 0);
    const page = pageOf(total, options.page, options.pageSize);
    const rows = db.prepare(`SELECT id,status,provider_credits,created_at,updated_at ${base} ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?`)
      .all(accountId, ...clause.values, page.pageSize, page.offset) as Row[];
    return { page, items: rows.map(row => ({ provider: 'kie', jobId: String(row.id), childId: String(row.id), model: 'gemini-3-8-flash',
      state: String(row.status), creditsConsumed: rowNumber(row, 'provider_credits'),
      durationMs: Number(row.updated_at) - Number(row.created_at), elapsedMs: Number(row.updated_at) - Number(row.created_at),
      firstObservedAt: new Date(Number(row.created_at)).toISOString(), lastObservedAt: new Date(Number(row.updated_at)).toISOString(),
    } satisfies AdminAccountUsage)) };
  }
  if (!hasTable(db, 'provider_usage')) {
    return { page: pageOf(0, options.page, options.pageSize), items: [] as AdminAccountUsage[] };
  }
  const hasElapsed = db.prepare('PRAGMA table_info(provider_usage)').all().some(column => column.name === 'elapsed_ms');
  const clause = searchClause(options.search, ['job_id', 'child_id', 'model', 'state']);
  const base = `FROM provider_usage WHERE user_id=? AND ${clause.sql}`;
  const total = Number((db.prepare(`SELECT COUNT(*) AS total ${base}`).get(accountId, ...clause.values) as Row).total || 0);
  const page = pageOf(total, options.page, options.pageSize);
  const rows = db.prepare(`SELECT provider,job_id,child_id,model,state,credits_consumed,duration_ms,${hasElapsed ? 'elapsed_ms' : 'NULL AS elapsed_ms'},first_observed_at,last_observed_at ${base}
    ORDER BY last_observed_at DESC,provider,job_id,child_id LIMIT ? OFFSET ?`).all(accountId, ...clause.values, page.pageSize, page.offset) as Row[];
  const items: AdminAccountUsage[] = rows.map((row) => ({
    provider: String(row.provider),
    jobId: String(row.job_id),
    childId: String(row.child_id),
    model: String(row.model),
    state: String(row.state),
    creditsConsumed: rowNumber(row, 'credits_consumed'),
    durationMs: rowNumber(row, 'duration_ms'),
    elapsedMs: rowNumber(row, 'elapsed_ms'),
    firstObservedAt: String(row.first_observed_at),
    lastObservedAt: String(row.last_observed_at),
  }));
  return { page, items };
}

/** Query one account without creating schema objects or touching its ledger. */
export function adminAccountInspection(accountId: string, options: AdminAccountQueryOptions): AdminAccountInspection | null {
  const db = getDb();
  const account = identityFor(db, accountId);
  if (!account) return null;
  if (options.tab === 'orders') {
    const result = queryOrders(db, accountId, options);
    return { account, tab: options.tab, pagination: result.page, items: result.items, subscription: null };
  }
  if (options.tab === 'subscription') {
    const result = querySubscription(db, accountId, options);
    return { account, tab: options.tab, pagination: result.page, items: result.items, subscription: result.subscription };
  }
  if (options.tab === 'credits') {
    const result = queryCredits(db, accountId, options);
    return { account, tab: options.tab, pagination: result.page, items: result.items, subscription: null };
  }
  if (options.tab === 'tasks') {
    const result = queryTasks(db, accountId, options);
    return { account, tab: options.tab, pagination: result.page, items: result.items, subscription: null };
  }
  if (options.tab === 'tickets') {
    const result = queryTickets(db, accountId, options);
    return { account, tab: options.tab, pagination: result.page, items: result.items, subscription: null };
  }
  if (options.tab === 'moderation') {
    const result = queryModeration(db, accountId, options);
    return { account, tab: options.tab, pagination: result.page, items: result.items, subscription: null };
  }
  const result = queryUsage(db, accountId, options);
  return { account, tab: options.tab, pagination: result.page, items: result.items, subscription: null };
}
