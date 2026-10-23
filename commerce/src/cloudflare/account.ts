import { DurableObject } from 'cloudflare:workers';
import { withCloudDatabase, getDb } from '../server/db.cloud';
import { withAccountExecution } from '../server/execution-context';
import { ensureBillingTables, createCheckoutForUser, handleWaffoWebhook } from '../server/billing';
import { initializeBillingRecovery, runBillingRecovery, nextBillingAlarm } from '../server/billing-recovery';
import { authenticatedEmail, requireSession, requireMutation, requestEmailCode, verifyEmailCode, logout, bodyJson, HttpError, json, reservedAmount } from '../server/auth';
import { accountState } from '../server/account-state';
import { TEXT_SCHEMA, generateText, readGeneration, recoverInterruptedGenerations } from '../server/text-generation';
import { adminAccountInspection, type AdminAccountQueryOptions } from '../server/admin-account';
import { sourceRevenueSummary } from '../server/order-attribution';
import type { DirectorySnapshot } from '../lib/admin-types';

export class AccountState extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.blockConcurrencyWhile(async () => {
      withCloudDatabase(this.ctx.storage, () => { ensureBillingTables(); initializeBillingRecovery(); getDb().exec(TEXT_SCHEMA); });
      this.ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS directory_sync (id INTEGER PRIMARY KEY CHECK(id=1),revision INTEGER NOT NULL,dirty INTEGER NOT NULL); INSERT OR IGNORE INTO directory_sync VALUES(1,0,0);');
    });
  }
  private run<T>(accountId: string, callback: () => T): T {
    return withCloudDatabase(this.ctx.storage, () => withAccountExecution({ accountId,
      scheduleJobs: () => this.scheduleSoon(), capabilities: {
        email: this.env.AUTH_ENABLED === 'true', generation: this.env.GENERATION_ENABLED === 'true', payments: this.env.PAYMENTS_ENABLED === 'true',
      } }, callback));
  }
  private async scheduleSoon() {
    const previous = await this.ctx.storage.getAlarm();
    if (!previous || previous > Date.now() + 1000) await this.ctx.storage.setAlarm(Date.now() + 1000);
  }
  async directorySnapshot(): Promise<DirectorySnapshot | null> {
    const accountId = await this.ctx.storage.get<string>('accountId');
    if (!accountId) return null;
    return this.run(accountId, () => {
      const row = getDb().prepare("SELECT * FROM users WHERE id=? AND mode='live'").get(accountId);
      const balance = getDb().prepare('SELECT COALESCE(SUM(remaining),0) AS n FROM grants WHERE user_id=?').get(accountId);
      const last = getDb().prepare('SELECT MAX(used_at) AS at FROM email_codes').get();
      const revision = this.ctx.storage.sql.exec<{ revision: number }>('UPDATE directory_sync SET revision=revision+1 WHERE id=1 RETURNING revision').one().revision;
      return { accountId, revision, user: row ? { id: accountId, email: String(row.email), name: String(row.name),
        registeredAt: String(row.created_at), lastLoginAt: last?.at ? String(last.at) : null,
        balance: Number(balance?.n || 0), reserved: reservedAmount(accountId), plan: 'pack', isTest: /@(?:resend\.dev|preview\.local)$|\.test$/i.test(String(row.email)) } : null,
        revenue: sourceRevenueSummary(getDb(), accountId) };
    });
  }
  async isAdministrator(request: Request, accountId: string) {
    if (!this.env.ADMIN_EMAIL || !this.env.ACCOUNTS.idFromName(accountId).equals(this.ctx.id)) return false;
    return this.run(accountId, () => authenticatedEmail(request) === this.env.ADMIN_EMAIL.trim().toLowerCase());
  }
  async inspect(accountId: string, options: AdminAccountQueryOptions) {
    if (!this.env.ACCOUNTS.idFromName(accountId).equals(this.ctx.id)) return null;
    return this.run(accountId, () => adminAccountInspection(accountId, options));
  }
  private async syncDirectory() {
    const snapshot = await this.directorySnapshot();
    if (!snapshot) return;
    try {
      await this.env.USER_DIRECTORY.getByName('registered-users-v1').apply(snapshot);
      this.ctx.storage.sql.exec('UPDATE directory_sync SET dirty=0 WHERE id=1 AND revision=?', snapshot.revision);
    } catch { await this.scheduleSoon(); }
  }
  async handleRequest(request: Request, accountId: string): Promise<Response> {
    if (!/^[a-f0-9]{64}$/.test(accountId) || !this.env.ACCOUNTS.idFromName(accountId).equals(this.ctx.id)) return json({ error: 'Invalid account route.' }, 403);
    const recorded = await this.ctx.storage.get<string>('accountId');
    if (recorded && recorded !== accountId) return json({ error: 'Invalid account route.' }, 403);
    if (!recorded) await this.ctx.storage.put('accountId', accountId);
    const path = new URL(request.url).pathname;
    const mutation = request.method === 'POST';
    if (mutation) {
      await this.scheduleSoon();
      this.ctx.storage.sql.exec('UPDATE directory_sync SET dirty=1 WHERE id=1');
    }
    try {
      const response = await this.run(accountId, async () => {
        if (request.method === 'GET' && path === '/api/state') return json(accountState(request));
        if (request.method === 'GET' && path.startsWith('/api/generations/')) return readGeneration(request, path.split('/').pop() || '');
        if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
        if (path === '/api/auth/request') return requestEmailCode(request);
        if (path === '/api/auth/verify') return verifyEmailCode(request);
        if (path === '/api/auth/logout') return logout(request);
        if (path === '/api/generate') return generateText(request, () => this.scheduleSoon());
        if (path === '/api/checkout') {
          const session = requireSession(request); requireMutation(request, session);
          const body = await bodyJson(request);
          if (body.product !== 'pack' || typeof body.idempotencyKey !== 'string' || !/^[a-zA-Z0-9_-]{16,100}$/.test(body.idempotencyKey)) throw new HttpError(400, 'Choose the 100-credit pack.');
          return json(await createCheckoutForUser(session.userId, 'pack', body.idempotencyKey));
        }
        if (path === '/api/webhooks/waffo') {
          const result = await handleWaffoWebhook(await request.text(), request.headers);
          return json(result, result.status === 'pending_reconciliation' ? 202 : 200);
        }
        return json({ error: 'Not found.' }, 404);
      });
      if (mutation) await this.syncDirectory();
      return response;
    } catch (error) {
      if (error instanceof HttpError) return json({ error: error.message }, error.status);
      console.warn('Account operation could not be completed.');
      return json({ error: 'This request could not be completed. Please try again later.' }, 503);
    }
  }
  async alarm() {
    const accountId = await this.ctx.storage.get<string>('accountId');
    if (!accountId) return;
    await this.ctx.storage.setAlarm(Date.now() + 60_000);
    this.run(accountId, () => recoverInterruptedGenerations());
    try { await this.run(accountId, () => runBillingRecovery(accountId)); } catch { console.warn('Payment reconciliation deferred.'); }
    await this.syncDirectory();
    const nextBilling = this.run(accountId, () => nextBillingAlarm());
    const nextText = this.run(accountId, () => getDb().prepare("SELECT MIN(updated_at)+91000 AS at FROM text_generations WHERE status='processing'").get()?.at);
    const dirty = this.ctx.storage.sql.exec<{ dirty: number }>('SELECT dirty FROM directory_sync WHERE id=1').one().dirty;
    const next = Math.min(nextBilling ?? Infinity, nextText ? Number(nextText) : Infinity, dirty ? Date.now() + 60_000 : Infinity);
    if (Number.isFinite(next)) await this.ctx.storage.setAlarm(Math.max(Date.now() + 1000, next));
    else await this.ctx.storage.deleteAlarm();
  }
}
