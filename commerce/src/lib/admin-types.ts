import type { SourceRevenueSummary } from './order-source-report-types';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  registeredAt: string;
  lastLoginAt: string | null;
  plan: string;
  balance: number;
  reserved: number;
  isTest: boolean;
}

export interface DirectorySnapshot {
  accountId: string;
  revision: number;
  user: AdminUser | null;
  /** Undefined on an older producer; [] means this account was indexed with no confirmed payments. */
  revenue?: SourceRevenueSummary[];
}

export interface UserStats {
  generatedAt: string;
  timeZone: 'Asia/Shanghai';
  counts: { total: number; today: number; last7Days: number; testAccounts: number };
  trend: Array<{ date: string; registrations: number }>;
  users: AdminUser[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
  backfill: { complete: boolean; processed: number; completedAt: string | null };
}
