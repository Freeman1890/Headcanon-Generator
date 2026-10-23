import type {DatabaseSync} from './db-types';
import {resolveSubscriptionEvidence} from './billing-period-evidence';
import {canonicalizeWebhookEvent, WaffoWebhookError, type CanonicalWaffoEvent, type VerifiedWaffoEnvelope, type WaffoAdapterOptions} from './waffo';

/** Join verified evidence in memory. Never rewrite either signed raw receipt. */
export function canonicalizeBillingEnvelope(envelope: VerifiedWaffoEnvelope, accountId: string | null, db: DatabaseSync, options: WaffoAdapterOptions = {}): CanonicalWaffoEvent {
  if (envelope.eventType.startsWith('subscription.') && envelope.data.periodNumber === 0
      && ['subscription.payment_succeeded', 'subscription.activated', 'subscription.renewed', 'subscription.recovered'].includes(envelope.eventType)) {
    throw new WaffoWebhookError('Period zero is authorization, not a paid billing period.', 422, 'WAFFO_WEBHOOK_INCOMPLETE');
  }
  const canonical = canonicalizeWebhookEvent(envelope, options);
  const evidence = accountId ? resolveSubscriptionEvidence(envelope, accountId, db) : null;
  if (!evidence) return canonical;
  const receipt = canonicalizeWebhookEvent(evidence.paymentEnvelope, options);
  return {...canonical, paymentId: receipt.paymentId, amount: receipt.amount,
    paidPeriod: evidence.period, paymentEvidenceEventId: evidence.companionEventId};
}
