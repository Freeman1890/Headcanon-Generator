import {createHash} from 'node:crypto';
import type {DatabaseSync} from './db-types';
import {parsePersistedWebhookEnvelope, type VerifiedWaffoEnvelope} from './waffo';

const PAYMENT_EVENT = 'subscription.payment_succeeded';
const DOMAIN_EVENTS = new Set([
  'subscription.activated',
  'subscription.renewed',
  'subscription.recovered',
  'subscription.plan_changed',
]);
const BILLING_PERIODS = new Set(['weekly', 'monthly', 'quarterly', 'yearly']);
const MONEY = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;

type Row = Record<string, unknown>;

interface EventIdentity {
  orderId: string;
  orderMerchantExternalId: string;
  buyerId: string;
  currency: string;
}

export interface PaidSubscriptionPeriod {
  interval: string;
  start: string;
  end: string;
}

export interface SubscriptionPaymentReceipt {
  id: string;
  paymentStatus: 'succeeded';
  currency: string;
  amount?: string;
  chargedAmount?: string;
  listPrice?: Record<string, string | number>;
  taxAmount?: string;
  taxRate?: number;
  taxName?: string;
  paymentDate?: string;
  paymentMethod?: string;
}

export interface SubscriptionEvidence {
  period: PaidSubscriptionPeriod;
  payment: SubscriptionPaymentReceipt;
  /** The verified receipt envelope, including its original signed `data`. */
  paymentEnvelope: VerifiedWaffoEnvelope & {signatureTimestamp: string};
  /** Provider business event ID for the verified event on the other side. */
  companionEventId: string;
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function objectValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function positivePeriodNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : null;
}

function validSignatureTimestamp(value: unknown): value is string {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return false;
  const timestamp = Number(value);
  return Number.isSafeInteger(timestamp) && timestamp > 0;
}

function identityFor(envelope: VerifiedWaffoEnvelope): EventIdentity | null {
  const data = envelope.data;
  const orderId = stringValue(data.orderId);
  const orderMerchantExternalId = stringValue(data.orderMerchantExternalId);
  const directBuyer = stringValue(data.merchantProvidedBuyerIdentity);
  const orderMetadata = objectValue(data.orderMetadata);
  const metadataBuyer = stringValue(orderMetadata?.siteUserId);
  const currency = stringValue(data.currency)?.toUpperCase() || null;

  // A payload carrying two different merchant-side identities is internally
  // inconsistent; neither identity is safe to select by preference.
  if (directBuyer && metadataBuyer && directBuyer !== metadataBuyer) return null;
  const buyerId = directBuyer || metadataBuyer;
  if (!orderId || !orderMerchantExternalId || !buyerId || !currency || !/^[A-Z]{3}$/.test(currency)) return null;
  return {orderId, orderMerchantExternalId, buyerId, currency};
}

function sameIdentity(left: EventIdentity, right: EventIdentity): boolean {
  return left.orderId === right.orderId
    && left.orderMerchantExternalId === right.orderMerchantExternalId
    && left.buyerId === right.buyerId
    && left.currency === right.currency;
}

function normalizedMoney(value: unknown): string | null {
  if (typeof value !== 'string' || !MONEY.test(value)) return null;
  const [whole, fraction = ''] = value.split('.');
  const normalizedWhole = whole.replace(/^0+(?=\d)/, '');
  const normalizedFraction = fraction.replace(/0+$/, '');
  return normalizedFraction ? `${normalizedWhole}.${normalizedFraction}` : normalizedWhole;
}

function validIsoInstant(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const input = value.trim();
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
  const dateTimeWithZone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})$/i;
  if (!dateOnly.test(input) && !dateTimeWithZone.test(input)) return null;
  const milliseconds = Date.parse(input);
  if (!Number.isFinite(milliseconds)) return null;
  return new Date(milliseconds).toISOString();
}

function paidPeriod(envelope: VerifiedWaffoEnvelope): PaidSubscriptionPeriod | null {
  const interval = stringValue(envelope.data.billingPeriod)?.toLowerCase() || null;
  const start = validIsoInstant(envelope.data.currentPeriodStart);
  const end = validIsoInstant(envelope.data.currentPeriodEnd);
  if (!interval || !BILLING_PERIODS.has(interval) || !start || !end || Date.parse(end) <= Date.parse(start)) return null;
  return {interval, start, end};
}

function hasPeriodFields(envelope: VerifiedWaffoEnvelope): boolean {
  return ['billingPeriod', 'currentPeriodStart', 'currentPeriodEnd']
    .some((key) => envelope.data[key] !== undefined && envelope.data[key] !== null);
}

function samePeriod(left: PaidSubscriptionPeriod, right: PaidSubscriptionPeriod): boolean {
  return left.interval === right.interval && left.start === right.start && left.end === right.end;
}

function recordString(record: Row, key: string): string | null {
  return stringValue(record[key]);
}

function makeReceipt(envelope: VerifiedWaffoEnvelope): SubscriptionPaymentReceipt | null {
  if (envelope.eventType !== PAYMENT_EVENT || envelope.data.paymentStatus !== 'succeeded') return null;
  if (!positivePeriodNumber(envelope.data.periodNumber)) return null;

  const id = stringValue(envelope.data.paymentId);
  const amount = envelope.data.amount;
  const chargedAmount = envelope.data.chargedAmount;
  const amountNormalized = amount === undefined ? null : normalizedMoney(amount);
  const chargedNormalized = chargedAmount === undefined ? null : normalizedMoney(chargedAmount);
  if (!id || (amount !== undefined && amountNormalized === null) || (chargedAmount !== undefined && chargedNormalized === null)) return null;
  if (amountNormalized === null && chargedNormalized === null) return null;
  if (amountNormalized !== null && chargedNormalized !== null && amountNormalized !== chargedNormalized) return null;

  const receipt: SubscriptionPaymentReceipt = {
    id,
    paymentStatus: 'succeeded',
    currency: stringValue(envelope.data.currency)!.toUpperCase(),
  };
  if (typeof amount === 'string') receipt.amount = amount.trim();
  if (typeof chargedAmount === 'string') receipt.chargedAmount = chargedAmount.trim();

  const rawListPrice = envelope.data.listPrice;
  if (rawListPrice !== undefined) {
    const listPrice = objectValue(rawListPrice);
    if (!listPrice) return null;
    const selected: Record<string, string | number> = {};
    for (const key of ['total', 'subtotal', 'taxAmount']) {
      const value = listPrice[key];
      if (value !== undefined) {
        if (normalizedMoney(value) === null) return null;
        selected[key] = (value as string).trim();
      }
    }
    if (listPrice.taxRate !== undefined) {
      if (typeof listPrice.taxRate !== 'number' || !Number.isFinite(listPrice.taxRate)) return null;
      selected.taxRate = listPrice.taxRate;
    }
    if (listPrice.taxName !== undefined) {
      if (typeof listPrice.taxName !== 'string') return null;
      selected.taxName = listPrice.taxName;
    }
    receipt.listPrice = selected;
  }

  if (envelope.data.taxAmount !== undefined) {
    if (normalizedMoney(envelope.data.taxAmount) === null) return null;
    receipt.taxAmount = (envelope.data.taxAmount as string).trim();
  }
  if (envelope.data.taxRate !== undefined) {
    if (typeof envelope.data.taxRate !== 'number' || !Number.isFinite(envelope.data.taxRate)) return null;
    receipt.taxRate = envelope.data.taxRate;
  }
  if (envelope.data.taxName !== undefined) {
    if (typeof envelope.data.taxName !== 'string') return null;
    receipt.taxName = envelope.data.taxName;
  }
  const paymentDate = stringValue(envelope.data.paymentDate);
  const paymentMethod = stringValue(envelope.data.paymentMethod);
  if (paymentDate) receipt.paymentDate = paymentDate;
  if (paymentMethod) receipt.paymentMethod = paymentMethod;
  return receipt;
}

function receiptFingerprint(receipt: SubscriptionPaymentReceipt): string {
  return JSON.stringify(receipt);
}

function verifiedPersistedEnvelope(
  row: Row,
  accountId: string,
  storeId: string,
  mode: VerifiedWaffoEnvelope['mode'],
): (VerifiedWaffoEnvelope & {signatureTimestamp: string}) | null {
  if (Number(row.signature_verified) !== 1 || recordString(row, 'account_id') !== accountId) return null;
  const signatureTimestamp = recordString(row, 'signature_timestamp');
  const storedHash = recordString(row, 'raw_body_sha256');
  const rawBody = typeof row.raw_body === 'string' ? row.raw_body : null;
  const rowId = recordString(row, 'id');
  let timestamp = recordString(row, 'provider_event_timestamp');
  const eventType = recordString(row, 'event_type');
  const eventId = recordString(row, 'event_id');
  const rowStoreId = recordString(row, 'provider_store_id');
  const rowMode = recordString(row, 'provider_environment');
  if (!signatureTimestamp || !validSignatureTimestamp(signatureTimestamp)
    || !storedHash || !/^[0-9a-f]{64}$/i.test(storedHash)
    || !rawBody || !rowId || !eventType || !eventId
    || rowStoreId !== storeId || rowMode !== mode) return null;
  if (createHash('sha256').update(rawBody, 'utf8').digest('hex').toLowerCase() !== storedHash.toLowerCase()) return null;

  try {
    // Older verified rows may lack the denormalized timestamp column. The
    // matching hash binds this fallback to the original signed raw body.
    if (!timestamp) {
      const parsed = objectValue(JSON.parse(rawBody));
      timestamp = stringValue(parsed?.timestamp) || null;
    }
    if (!timestamp) return null;
    const envelope = parsePersistedWebhookEnvelope(rawBody, {
      id: rowId,
      timestamp,
      eventType,
      eventId,
      storeId,
      mode,
    });
    return {...envelope, signatureTimestamp};
  } catch {
    return null;
  }
}

function rowMatchesEnvelope(row: Row, envelope: VerifiedWaffoEnvelope, identity: EventIdentity): boolean {
  const eventIdentity = identityFor(envelope);
  if (!eventIdentity || !sameIdentity(identity, eventIdentity)) return false;

  const storedOrderId = recordString(row, 'provider_order_id');
  const storedOrderRef = recordString(row, 'order_merchant_external_id');
  if (storedOrderId !== identity.orderId || storedOrderRef !== identity.orderMerchantExternalId) return false;

  const storedUserId = recordString(row, 'user_id');
  if (storedUserId && storedUserId !== identity.buyerId) return false;
  const storedCurrency = recordString(row, 'currency');
  if (storedCurrency && storedCurrency.toUpperCase() !== identity.currency) return false;

  const storedPaymentId = recordString(row, 'payment_id');
  const envelopePaymentId = stringValue(envelope.data.paymentId);
  // The canonical row may be enriched with its companion receipt ID. That
  // denormalized fill-in is not part of the original signed domain payload.
  if (envelopePaymentId && storedPaymentId && storedPaymentId !== envelopePaymentId) return false;
  return true;
}

/**
 * Resolve a paid subscription period only when the current signed webhook and
 * its durably verified complementary webhook agree on the provider's positive
 * billing-period number and immutable order/buyer/currency identity. This is
 * deliberately read-only and takes the caller's DB handle so it cannot open
 * or migrate a database behind the caller's back.
 */
export function resolveSubscriptionEvidence(
  envelope: VerifiedWaffoEnvelope,
  accountId: string,
  db: DatabaseSync,
): SubscriptionEvidence | null {
  const account = stringValue(accountId);
  if (!account || !validSignatureTimestamp(envelope.signatureTimestamp)
    || !stringValue(envelope.id) || !stringValue(envelope.timestamp) || !stringValue(envelope.eventId)
    || !stringValue(envelope.storeId) || (envelope.mode !== 'test' && envelope.mode !== 'prod')) return null;

  const currentIsPayment = envelope.eventType === PAYMENT_EVENT;
  const currentIsDomain = DOMAIN_EVENTS.has(envelope.eventType);
  if (!currentIsPayment && !currentIsDomain) return null;
  const currentPeriodNumber = positivePeriodNumber(envelope.data.periodNumber);
  const identity = identityFor(envelope);
  if (!currentPeriodNumber || !identity) return null;

  const currentPeriod = currentIsDomain ? paidPeriod(envelope) : null;
  if (currentIsDomain && !currentPeriod) return null;
  const currentReceipt = currentIsPayment ? makeReceipt(envelope) : null;
  if (currentIsPayment && !currentReceipt) return null;
  if (currentIsPayment && hasPeriodFields(envelope) && !paidPeriod(envelope)) return null;

  const rows = db.prepare(`SELECT * FROM billing_events
    WHERE account_id=? AND provider_store_id=? AND provider_environment=?
      AND provider_order_id=? AND order_merchant_external_id=?
      AND event_type IN (?,?,?,?,?) AND signature_verified=1
      AND signature_timestamp IS NOT NULL AND raw_body_sha256 IS NOT NULL`)
    .all(account, envelope.storeId, envelope.mode, identity.orderId, identity.orderMerchantExternalId,
      PAYMENT_EVENT, ...DOMAIN_EVENTS) as Row[];

  const domainEvents: Array<{envelope: VerifiedWaffoEnvelope; period: PaidSubscriptionPeriod}> = [];
  const receipts: Array<{envelope: VerifiedWaffoEnvelope & {signatureTimestamp: string}; receipt: SubscriptionPaymentReceipt}> = [];

  if (currentIsDomain) domainEvents.push({envelope, period: currentPeriod!});
  if (currentIsPayment) receipts.push({envelope: envelope as VerifiedWaffoEnvelope & {signatureTimestamp: string}, receipt: currentReceipt!});

  for (const row of rows) {
    const persisted = verifiedPersistedEnvelope(row, account, envelope.storeId, envelope.mode);
    if (!persisted || !rowMatchesEnvelope(row, persisted, identity)) continue;
    if (positivePeriodNumber(persisted.data.periodNumber) !== currentPeriodNumber) continue;

    if (persisted.eventType === PAYMENT_EVENT) {
      const receipt = makeReceipt(persisted);
      if (receipt) receipts.push({envelope: persisted, receipt});
      continue;
    }
    if (DOMAIN_EVENTS.has(persisted.eventType)) {
      const period = paidPeriod(persisted);
      // A same-period domain event with missing or invalid boundaries is an
      // ambiguity; do not select another row and silently guess around it.
      if (!period) return null;
      domainEvents.push({envelope: persisted, period});
    }
  }

  if (domainEvents.length === 0 || receipts.length === 0) return null;

  const distinctPeriods = new Map(domainEvents.map((candidate) => [
    `${candidate.period.interval}\u0000${candidate.period.start}\u0000${candidate.period.end}`,
    candidate.period,
  ]));
  if (distinctPeriods.size !== 1) return null;
  const period = distinctPeriods.values().next().value as PaidSubscriptionPeriod | undefined;
  if (!period) return null;

  const distinctPayments = new Map<string, {envelope: VerifiedWaffoEnvelope & {signatureTimestamp: string}; receipt: SubscriptionPaymentReceipt; fingerprint: string}>();
  for (const candidate of receipts) {
    const fingerprint = receiptFingerprint(candidate.receipt);
    const existing = distinctPayments.get(candidate.receipt.id);
    if (existing && existing.fingerprint !== fingerprint) return null;
    if (!existing || candidate.envelope.eventId.localeCompare(existing.envelope.eventId) < 0) {
      distinctPayments.set(candidate.receipt.id, {...candidate, fingerprint});
    }
  }
  if (distinctPayments.size !== 1) return null;
  const paymentCandidate = distinctPayments.values().next().value as {envelope: VerifiedWaffoEnvelope & {signatureTimestamp: string}; receipt: SubscriptionPaymentReceipt} | undefined;
  if (!paymentCandidate) return null;

  const paymentId = paymentCandidate.receipt.id;
  for (const {envelope: domain} of domainEvents) {
    const domainPaymentId = domain.data.paymentId;
    if (domainPaymentId !== undefined && domainPaymentId !== null
      && (typeof domainPaymentId !== 'string' || !domainPaymentId.trim() || domainPaymentId.trim() !== paymentId)) return null;
  }
  for (const {envelope: receiptEnvelope} of receipts) {
    if (hasPeriodFields(receiptEnvelope)) {
      const receiptPeriod = paidPeriod(receiptEnvelope);
      if (!receiptPeriod || !samePeriod(receiptPeriod, period)) return null;
    }
  }

  const companionEventId = currentIsPayment
    ? domainEvents.map(({envelope: domain}) => domain.eventId).sort((a, b) => a.localeCompare(b))[0]
    : paymentCandidate.envelope.eventId;
  if (!companionEventId) return null;

  return {
    period,
    payment: paymentCandidate.receipt,
    paymentEnvelope: paymentCandidate.envelope,
    companionEventId,
  };
}
