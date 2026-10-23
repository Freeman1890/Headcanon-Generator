import { getDb } from './db';
import { getSession, publicUser, reservedAmount } from './auth';
import { currentExecution } from './execution-context';

export function stateFor(userId: string | null, csrfToken?: string) {
  const flags = currentExecution()?.capabilities;
  const capabilities = { email: flags?.email ?? false, payments: flags?.payments ?? false, generation: flags?.generation ?? false };
  if (!userId) return { user: null, balance: 0, reserved: 0, capabilities, price: 990, packCredits: 100 };
  const row = getDb().prepare('SELECT COALESCE(SUM(remaining),0) AS balance FROM grants WHERE user_id=? AND expires_at>?').get(userId, new Date().toISOString());
  return { user: publicUser(userId), balance: Number(row?.balance || 0), reserved: reservedAmount(userId), capabilities,
    price: 990, packCredits: 100, ...(csrfToken ? { csrfToken } : {}) };
}

export function accountState(request: Request) {
  const session = getSession(request);
  return stateFor(session?.userId ?? null, session?.csrfToken);
}
