import { AsyncLocalStorage } from 'node:async_hooks';
import type { AcceptanceRunConfig } from './acceptance-access';

export interface AccountExecution {
  accountId: string;
  scheduleJobs: () => Promise<void>;
  capabilities?: { email: boolean; generation: boolean; payments: boolean };
  acceptance?: AcceptanceRunConfig | null;
}
const execution = new AsyncLocalStorage<AccountExecution>();
export const currentExecution = () => execution.getStore();
export function withAccountExecution<T>(value: AccountExecution, callback: () => T): T {
  return execution.run(value, callback);
}
