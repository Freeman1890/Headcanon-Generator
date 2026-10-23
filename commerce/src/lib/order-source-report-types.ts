/** Confirmed payment totals, grouped by the last effective source at checkout. Renewals retain their original order source. Amounts are gross cents. */
export interface SourceRevenueSummary {
  source: string;
  currency: string;
  purchases: number;
  purchaseCents: number;
  renewals: number;
  renewalCents: number;
  refundedPayments: number;
}

export interface OrderSourceReport {
  generatedAt: string;
  sources: SourceRevenueSummary[];
  coverage: { indexedAccounts: number; totalAccounts: number };
}
