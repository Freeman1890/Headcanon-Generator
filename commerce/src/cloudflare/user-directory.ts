import { DurableObject } from 'cloudflare:workers';
import type { AdminUser, DirectorySnapshot, UserStats } from '../lib/admin-types';
import type { OrderSourceReport, SourceRevenueSummary } from '../lib/order-source-report-types';

type Indexed = { id: string; revision: number; email: string | null; name: string | null; registered_at: string | null; last_login_at: string | null; is_test: number; deleted: number };
const day = 86_400_000;
function validRevenue(value: unknown): value is SourceRevenueSummary {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<SourceRevenueSummary>;
  return typeof row.source === 'string' && row.source.length > 0 && row.source.length <= 256 &&
    typeof row.currency === 'string' && /^[A-Z]{3}$/.test(row.currency) &&
    [row.purchases, row.purchaseCents, row.renewals, row.renewalCents, row.refundedPayments]
      .every(number => Number.isSafeInteger(number) && (number as number) >= 0);
}
export function registrationWindow(time: number) {
  const today = new Date(time + 8 * 3_600_000).toISOString().slice(0, 10);
  const start = Date.parse(`${today}T00:00:00+08:00`);
  return { today, start, week: new Date(start - 6 * day).toISOString(), end: new Date(start + day).toISOString() };
}

/** Small, read-only operator index. Account ledgers and assets remain distributed. */
export class UserDirectory extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS directory (
      id TEXT PRIMARY KEY, revision INTEGER NOT NULL, email TEXT, name TEXT,
      registered_at TEXT, last_login_at TEXT, is_test INTEGER NOT NULL, deleted INTEGER NOT NULL
    ); CREATE INDEX IF NOT EXISTS directory_created ON directory(deleted,is_test,registered_at,id);
    CREATE TABLE IF NOT EXISTS imported_objects (id TEXT PRIMARY KEY, completed_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS revenue_coverage (account_id TEXT PRIMARY KEY);
    CREATE TABLE IF NOT EXISTS revenue_by_account (
      account_id TEXT NOT NULL, source TEXT NOT NULL, currency TEXT NOT NULL,
      purchases INTEGER NOT NULL, purchase_cents INTEGER NOT NULL,
      renewals INTEGER NOT NULL, renewal_cents INTEGER NOT NULL,
      refunded_payments INTEGER NOT NULL,
      PRIMARY KEY(account_id,source,currency)
    );`);
  }

  apply(snapshot: DirectorySnapshot) {
    if (!/^[a-f0-9]{64}$/.test(snapshot.accountId) || !Number.isSafeInteger(snapshot.revision) || snapshot.revision < 0) throw new Error('Invalid directory snapshot.');
    const u = snapshot.user;
    if (u && u.id !== snapshot.accountId) throw new Error('Account identity mismatch.');
    if (snapshot.revenue !== undefined && (!Array.isArray(snapshot.revenue) || !snapshot.revenue.every(validRevenue))) {
      throw new Error('Invalid account revenue summary.');
    }
    this.ctx.storage.transactionSync(() => {
      const previous = this.ctx.storage.sql.exec<{ revision: number }>('SELECT revision FROM directory WHERE id=?', snapshot.accountId).toArray()[0];
      if (previous && previous.revision >= snapshot.revision) return;
      this.ctx.storage.sql.exec(`INSERT INTO directory(id,revision,email,name,registered_at,last_login_at,is_test,deleted)
        VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET
        revision=excluded.revision,email=excluded.email,name=excluded.name,registered_at=excluded.registered_at,
        last_login_at=excluded.last_login_at,is_test=excluded.is_test,deleted=excluded.deleted`, snapshot.accountId, snapshot.revision,
        u?.email ?? null, u?.name ?? null, u?.registeredAt ?? null, u?.lastLoginAt ?? null, u?.isTest ? 1 : 0, u ? 0 : 1);
      if (!u || snapshot.revenue !== undefined) {
        this.ctx.storage.sql.exec('DELETE FROM revenue_by_account WHERE account_id=?', snapshot.accountId);
        this.ctx.storage.sql.exec('DELETE FROM revenue_coverage WHERE account_id=?', snapshot.accountId);
      }
      if (u && snapshot.revenue !== undefined) {
        this.ctx.storage.sql.exec('INSERT INTO revenue_coverage(account_id) VALUES(?)', snapshot.accountId);
        for (const row of snapshot.revenue) {
          this.ctx.storage.sql.exec(`INSERT INTO revenue_by_account(account_id,source,currency,purchases,purchase_cents,renewals,renewal_cents,refunded_payments)
            VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(account_id,source,currency) DO UPDATE SET
            purchases=purchases+excluded.purchases,purchase_cents=purchase_cents+excluded.purchase_cents,
            renewals=renewals+excluded.renewals,renewal_cents=renewal_cents+excluded.renewal_cents,
            refunded_payments=refunded_payments+excluded.refunded_payments`, snapshot.accountId,
            row.source, row.currency, row.purchases, row.purchaseCents, row.renewals, row.renewalCents, row.refundedPayments);
        }
      }
    });
  }

  /** Aggregates only directory-local summaries; no per-account RPC fan-out. */
  async revenueReport(): Promise<OrderSourceReport> {
    await this.backfillBatch();
    const coverage = this.ctx.storage.sql.exec<{ indexedAccounts: number; totalAccounts: number }>(`SELECT
      COUNT(c.account_id) AS indexedAccounts, COUNT(*) AS totalAccounts FROM directory AS d
      LEFT JOIN revenue_coverage AS c ON c.account_id=d.id WHERE d.deleted=0 AND d.is_test=0`).one();
    const sources = this.ctx.storage.sql.exec<{
      source: string; currency: string; purchases: number; purchaseCents: number;
      renewals: number; renewalCents: number; refundedPayments: number;
    }>(`SELECT r.source,r.currency,SUM(r.purchases) AS purchases,SUM(r.purchase_cents) AS purchaseCents,
      SUM(r.renewals) AS renewals,SUM(r.renewal_cents) AS renewalCents,
      SUM(r.refunded_payments) AS refundedPayments
      FROM revenue_by_account AS r JOIN directory AS d ON d.id=r.account_id
      WHERE d.deleted=0 AND d.is_test=0 GROUP BY r.source,r.currency
      ORDER BY purchaseCents DESC,renewalCents DESC,r.source,r.currency`).toArray();
    return { generatedAt: new Date().toISOString(), coverage, sources };
  }

  private historyIds(): string[] {
    const ids: unknown = JSON.parse(this.env.ADMIN_BACKFILL_IDS || '[]');
    if (!Array.isArray(ids) || ids.some(id => typeof id !== 'string' || !/^[a-f0-9]{64}$/.test(id))) throw new Error('Invalid history inventory.');
    return [...new Set(ids as string[])];
  }

  private async backfillBatch() {
    const ids = this.historyIds();
    const done = new Set(this.ctx.storage.sql.exec<{ id: string }>('SELECT id FROM imported_objects').toArray().map(row => row.id));
    // Bounded batches also run on refresh; failures cannot masquerade as an empty site.
    for (const id of ids.filter(id => !done.has(id)).slice(0, 20)) {
      const snapshot = await this.env.ACCOUNTS.get(this.env.ACCOUNTS.idFromString(id)).directorySnapshot();
      if (snapshot) this.apply(snapshot);
      this.ctx.storage.sql.exec('INSERT OR IGNORE INTO imported_objects VALUES (?,?)', id, new Date().toISOString());
    }
    const rows = this.ctx.storage.sql.exec<{ id: string; completed_at: string }>('SELECT id,completed_at FROM imported_objects').toArray().filter(row => ids.includes(row.id));
    return { complete: rows.length === ids.length, processed: rows.length,
      completedAt: rows.length === ids.length ? rows.map(row => row.completed_at).sort().at(-1) ?? new Date().toISOString() : null };
  }

  async users(options: { search: string; page: number; kind: 'real' | 'test' | 'all' }): Promise<UserStats> {
    const backfill = await this.backfillBatch();
    const search = options.search.trim().toLowerCase();
    const kindClause = options.kind === 'all' ? '' : ` AND is_test=${options.kind === 'test' ? 1 : 0}`;
    // instr is literal matching: % and _ never broaden a search.
    const where = `deleted=0${kindClause} AND (instr(lower(email),?)>0 OR instr(lower(name),?)>0)`;
    const total = this.ctx.storage.sql.exec<{ total: number }>(`SELECT COUNT(*) AS total FROM directory WHERE ${where}`, search, search).one().total;
    const pageSize = 25;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(options.page, totalPages);
    const rows = this.ctx.storage.sql.exec<Indexed>(`SELECT * FROM directory WHERE ${where} ORDER BY registered_at DESC,id DESC LIMIT ? OFFSET ?`, search, search, pageSize, (page - 1) * pageSize).toArray();
    const users: AdminUser[] = [];
    // Read current plan/credits directly, avoiding stale cached balances or unbounded fan-out.
    for (let start = 0; start < rows.length; start += 5) {
      const snapshots = await Promise.all(rows.slice(start, start + 5).map(row => this.env.ACCOUNTS.getByName(row.id).directorySnapshot()));
      for (const snapshot of snapshots) {
        if (snapshot) this.apply(snapshot);
        if (snapshot?.user) users.push(snapshot.user);
      }
    }
    const now = Date.now();
    const window = registrationWindow(now);
    const counts = this.ctx.storage.sql.exec<{ total: number; today: number; last7Days: number; testAccounts: number }>(`SELECT
      COALESCE(SUM(is_test=0),0) AS total,
      COALESCE(SUM(is_test=0 AND registered_at>=? AND registered_at<?),0) AS today,
      COALESCE(SUM(is_test=0 AND registered_at>=? AND registered_at<?),0) AS last7Days,
      COALESCE(SUM(is_test=1),0) AS testAccounts FROM directory WHERE deleted=0`,
      new Date(window.start).toISOString(), window.end, window.week, window.end).one();
    const grouped = this.ctx.storage.sql.exec<{ date: string; registrations: number }>(`SELECT date(registered_at,'+8 hours') AS date,COUNT(*) AS registrations FROM directory
      WHERE deleted=0 AND is_test=0 AND registered_at>=? AND registered_at<? GROUP BY date`, new Date(window.start - 13 * day).toISOString(), window.end).toArray();
    const trend = Array.from({ length: 14 }, (_, index) => {
      const date = new Date(window.start + 8 * 3_600_000 - (13 - index) * day).toISOString().slice(0, 10);
      return { date, registrations: grouped.find(row => row.date === date)?.registrations ?? 0 };
    });
    return { generatedAt: new Date(now).toISOString(), timeZone: 'Asia/Shanghai', counts, trend, users,
      pagination: { page, pageSize, total, totalPages }, backfill };
  }
}
