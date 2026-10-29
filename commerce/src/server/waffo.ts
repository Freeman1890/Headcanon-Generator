import {createHash, createVerify} from 'node:crypto';
import {PRODUCTS} from '../lib/catalog';
import type {Product} from '../lib/types';

export type WaffoEnvironment = 'test' | 'prod';

/** Waffo may reuse the envelope id (an order ID) across lifecycle events. */
export function waffoBusinessReceiptId(eventType: string, eventId: string, storeId: string, mode: string): string {
  return `waffo-event:${createHash('sha256').update(JSON.stringify([mode, storeId, eventType, eventId])).digest('hex')}`;
}

export interface CreateCheckoutInput {
  userId: string;
  email: string;
  orderId: string;
  product: Product;
  returnUrl: string;
}

export interface CheckoutResult {
  checkoutUrl: string;
  /** Waffo returns a hosted session ID at checkout creation time. The order ID arrives in webhook data. */
  providerOrderId: string;
}

export interface PaidPeriod {
  interval: string | null;
  start: string | null;
  end: string | null;
}

export interface CanonicalWaffoEvent {
  id: string;
  paymentId: string | null;
  product: Product;
  currency: string;
  amount: number;
  userId: string;
  store: string;
  env: WaffoEnvironment;
  state: string;
  paidPeriod: PaidPeriod | null;
  /** Internal link to complementary durably verified payment/period evidence. */
  paymentEvidenceEventId?: string;
  /** The merchant-owned local order reference sent to Waffo. `orderId` is the provider order ID. */
  orderMerchantExternalId: string;
  orderId: string;
  eventType: string;
  eventId: string;
  /** The provider's authoritative product ID used to derive `product`. */
  providerProductId?: string;
  storeName?: string;
  timestamp: string;
}

/**
 * A signed and store/environment-checked envelope. The provider may send a
 * validly signed event whose business fields are incomplete; callers can
 * persist this envelope for reconciliation without granting entitlement.
 */
export interface VerifiedWaffoEnvelope {
  id: string;
  timestamp: string;
  eventType: string;
  eventId: string;
  storeId: string;
  storeName?: string;
  mode: WaffoEnvironment;
  /** Timestamp from the original X-Waffo-Signature header. This is retained
   * as proof metadata so a durable reconciliation may outlive the replay
   * window without pretending that a later request was freshly signed. */
  signatureTimestamp?: string;
  data: Record<string, unknown>;
}

export type HeaderValue = string | string[] | undefined;
export type WaffoHeaders = Headers | {get(name: string): string | null} | Record<string, HeaderValue>;

export interface WaffoCheckoutClient {
  checkout: {
    authenticated: {
      create(params: Record<string, unknown>, options?: {idempotencyKey: string}): Promise<Record<string, unknown>>;
      createPlanChange?(params: Record<string, unknown>): Promise<Record<string, unknown>>;
    };
  };
  orders?: {
    cancelSubscription(params: Record<string, unknown>): Promise<Record<string, unknown>>;
  };
  auth?: {
    issueSessionToken(params: Record<string, unknown>): Promise<Record<string, unknown>>;
  };
  customer?: (token: string) => {
    reactivateSubscription(params: Record<string, unknown>): Promise<Record<string, unknown>>;
  };
  graphql?: {
    query<T = unknown>(params: {query: string; variables?: Record<string, unknown>}): Promise<WaffoGraphqlResult<T>>;
  };
}

export interface WaffoGraphqlResult<T> {
  data: T | null;
  errors?: Array<{message?: string; layer?: string}>;
  warnings?: Array<{message?: string; layer?: string}>;
}

export interface WaffoAdapterOptions {
  /** Server environment values. Defaults to process.env. */
  env?: NodeJS.ProcessEnv;
  /** Inject the official client or a test double. No client is created until checkout/query is needed. */
  client?: WaffoCheckoutClient;
  /** Clock returning epoch milliseconds. Used by local replay-protection tests. */
  now?: () => number;
  /** Per-call key override for local key rotation or fixtures. */
  publicKey?: string;
  /** Provider product resolved from an order lookup. Only the billing path sets this. */
  resolvedProduct?: Product;
  /** Provider product ID returned by the authoritative order lookup. */
  providerProductId?: string;
}

export interface WaffoConfig {
  environment: WaffoEnvironment;
  endpoint: string;
  storeId: string;
  merchantId?: string;
  privateKey?: string;
  webhookPublicKey?: string;
  currency: string;
  taxCategory: string;
  productIds: Partial<Record<Product, string>>;
  prices: Partial<Record<Product, number>>;
}

export class WaffoUnavailableError extends Error {
  readonly status = 503;
  readonly code = 'WAFFO_UNAVAILABLE';
}

export class WaffoWebhookError extends Error {
  constructor(message: string, public readonly status = 401, public readonly code = 'WAFFO_WEBHOOK_INVALID') {
    super(message);
  }
}

const ALL_PRODUCTS: Product[] = ['pack'];
const PRODUCT_ENV_NAMES: Record<Product, {id: string; price: string}> = {
  pack: {id: 'WAFFO_PRODUCT_PACK', price: 'WAFFO_PRICE_PACK'},
  'creator-monthly': {id: 'WAFFO_PRODUCT_CREATOR_MONTHLY', price: 'WAFFO_PRICE_CREATOR_MONTHLY'},
  'creator-yearly': {id: 'WAFFO_PRODUCT_CREATOR_YEARLY', price: 'WAFFO_PRICE_CREATOR_YEARLY'},
  'studio-monthly': {id: 'WAFFO_PRODUCT_STUDIO_MONTHLY', price: 'WAFFO_PRICE_STUDIO_MONTHLY'},
  'studio-yearly': {id: 'WAFFO_PRODUCT_STUDIO_YEARLY', price: 'WAFFO_PRICE_STUDIO_YEARLY'},
};
const TAX_CATEGORIES = new Set(['digital_goods', 'saas', 'software', 'ebook', 'online_course', 'consulting', 'professional_service']);

function environmentForStore(env: NodeJS.ProcessEnv, storeId: string): NodeJS.ProcessEnv {
  if (storeId === env.WAFFO_STORE_ID) return env;
  if (storeId && storeId === env.WAFFO_LEGACY_STORE_ID && env.WAFFO_LEGACY_PRODUCT_PACK) {
    return {...env, WAFFO_STORE_ID: storeId, WAFFO_PRODUCT_PACK: env.WAFFO_LEGACY_PRODUCT_PACK};
  }
  throw new WaffoWebhookError('Webhook store does not match this site.');
}

function objectRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function requireString(value: unknown, name: string): string {
  const result = stringValue(value);
  if (!result) throw new WaffoUnavailableError(`${name} is not configured.`);
  return result;
}

function readEnvironment(env: NodeJS.ProcessEnv): WaffoEnvironment {
  const value = env.WAFFO_ENVIRONMENT;
  if (value !== 'test' && value !== 'prod') throw new WaffoUnavailableError('WAFFO_ENVIRONMENT must be explicitly set to test or prod.');
  return value;
}

function validateUrl(value: string, name: string, environment: WaffoEnvironment, allowLocalHttp = false): string {
  let url: URL;
  try { url = new URL(value); } catch { throw new WaffoUnavailableError(`${name} must be a valid URL.`); }
  const localHttp = allowLocalHttp && url.protocol === 'http:' && /^(localhost|127\.0\.0\.1|::1)$/i.test(url.hostname);
  if (url.protocol !== 'https:' && !localHttp) throw new WaffoUnavailableError(`${name} must use HTTPS.`);
  if (environment === 'prod' && url.protocol !== 'https:') throw new WaffoUnavailableError(`${name} must use HTTPS in prod.`);
  return url.toString();
}

function parsePrice(value: string, product: Product): number {
  if (!/^\d+$/.test(value)) throw new WaffoUnavailableError(`${PRODUCT_ENV_NAMES[product].price} must be an integer number of cents.`);
  const cents = Number(value);
  if (!Number.isSafeInteger(cents) || cents <= 0) throw new WaffoUnavailableError(`${PRODUCT_ENV_NAMES[product].price} is outside the supported amount range.`);
  const catalogPrice = PRODUCTS[product].price;
  if (cents !== catalogPrice) throw new WaffoUnavailableError(`${PRODUCT_ENV_NAMES[product].price} does not match the shared catalog price for ${product}.`);
  return cents;
}

function configuredPublicKey(env: NodeJS.ProcessEnv, environment: WaffoEnvironment): string | undefined {
  return stringValue(environment === 'test' ? env.WAFFO_WEBHOOK_TEST_PUBLIC_KEY : env.WAFFO_WEBHOOK_PROD_PUBLIC_KEY) || stringValue(env.WAFFO_WEBHOOK_PUBLIC_KEY);
}

export function loadWaffoConfig(env: NodeJS.ProcessEnv = process.env, options: {requireCredentials?: boolean; requireWebhookKey?: boolean; requireMappings?: boolean} = {}): WaffoConfig {
  const environment = readEnvironment(env);
  const storeId = requireString(env.WAFFO_STORE_ID, 'WAFFO_STORE_ID');
  const endpoint = validateUrl(env.WAFFO_ENDPOINT || env.WAFFO_BASE_URL || 'https://api.waffo.ai', 'WAFFO_ENDPOINT', environment, environment === 'test');
  const currency = (env.WAFFO_CURRENCY || 'USD').trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new WaffoUnavailableError('WAFFO_CURRENCY must be a three-letter ISO currency code.');
  const taxCategory = (env.WAFFO_TAX_CATEGORY || 'software').trim();
  if (!TAX_CATEGORIES.has(taxCategory)) throw new WaffoUnavailableError('WAFFO_TAX_CATEGORY is not a supported Waffo tax category.');

  const requireCredentials = options.requireCredentials ?? false;
  const merchantId = stringValue(env.WAFFO_MERCHANT_ID);
  const privateKey = stringValue(env.WAFFO_PRIVATE_KEY);
  if (requireCredentials && !merchantId) throw new WaffoUnavailableError('WAFFO_MERCHANT_ID is not configured.');
  if (requireCredentials && !privateKey) throw new WaffoUnavailableError('WAFFO_PRIVATE_KEY is not configured. The current official SDK uses a merchant ID and RSA private key, not a lone WAFFO_API_KEY.');
  const webhookPublicKey = configuredPublicKey(env, environment);
  if (options.requireWebhookKey && !webhookPublicKey) throw new WaffoUnavailableError(`A Waffo ${environment} webhook public key is not configured.`);

  const productIds: Partial<Record<Product, string>> = {};
  const prices: Partial<Record<Product, number>> = {};
  for (const product of ALL_PRODUCTS) {
    const names = PRODUCT_ENV_NAMES[product];
    const productId = stringValue(env[names.id]);
    const price = stringValue(env[names.price]);
    if (productId) productIds[product] = productId;
    if (price) prices[product] = parsePrice(price, product);
    if (options.requireMappings && !productId) throw new WaffoUnavailableError(`${names.id} is not configured.`);
    if (options.requireMappings && !price) throw new WaffoUnavailableError(`${names.price} is not configured.`);
  }

  return {environment, endpoint, storeId, ...(merchantId ? {merchantId} : {}), ...(privateKey ? {privateKey} : {}), ...(webhookPublicKey ? {webhookPublicKey} : {}), currency, taxCategory, productIds, prices};
}

function normalizePublicKey(value: string): string {
  const normalized = value.replace(/\\n/g, '\n').replace(/\r\n/g, '\n').trim();
  if (normalized.includes('BEGIN PUBLIC KEY') || normalized.includes('BEGIN RSA PUBLIC KEY')) return normalized;
  const wrapped = normalized.replace(/\s+/g, '').match(/.{1,64}/g)?.join('\n');
  if (!wrapped) throw new WaffoUnavailableError('The configured Waffo webhook public key is empty.');
  return `-----BEGIN PUBLIC KEY-----\n${wrapped}\n-----END PUBLIC KEY-----`;
}

function parseSignatureHeader(value: string | undefined): {timestamp: string; signature: string} {
  if (!value) throw new WaffoWebhookError('Missing X-Waffo-Signature header.');
  let timestamp = '';
  let signature = '';
  for (const part of value.split(',')) {
    const equal = part.indexOf('=');
    if (equal === -1) continue;
    const key = part.slice(0, equal).trim();
    const item = part.slice(equal + 1).trim();
    if (key === 't') timestamp = item;
    if (key === 'v1') signature = item;
  }
  if (!timestamp || !signature) throw new WaffoWebhookError('Malformed X-Waffo-Signature header.');
  if (!/^\d+$/.test(timestamp)) throw new WaffoWebhookError('Invalid timestamp in X-Waffo-Signature header.');
  return {timestamp, signature};
}

function headerValue(headers: WaffoHeaders, name: string): string | undefined {
  if (headers && typeof (headers as {get?: unknown}).get === 'function') return stringValue((headers as {get(name: string): string | null}).get(name)) || stringValue((headers as {get(name: string): string | null}).get(name.toLowerCase()));
  for (const [key, value] of Object.entries(headers || {})) {
    if (key.toLowerCase() !== name.toLowerCase()) continue;
    return Array.isArray(value) ? value[0] : value;
  }
  return undefined;
}

function verifyRawSignature(rawBody: string, signatureHeader: string | undefined, publicKey: string, now: () => number): string {
  const {timestamp, signature} = parseSignatureHeader(signatureHeader);
  const timestampMs = Number(timestamp);
  const age = now() - timestampMs;
  if (age > 45 * 60 * 1000 || age < -60 * 1000) throw new WaffoWebhookError('Webhook timestamp outside the Waffo replay window.');
  const verifier = createVerify('RSA-SHA256');
  verifier.update(`${timestamp}.${rawBody}`, 'utf8');
  verifier.end();
  let valid = false;
  try { valid = verifier.verify(normalizePublicKey(publicKey), signature, 'base64'); } catch { valid = false; }
  if (!valid) throw new WaffoWebhookError('Invalid Waffo webhook signature.');
  return timestamp;
}

/** Signature-only boundary for isolated receipt capture, without catalog or
 * merchant credentials. Business delivery must still verify the full event. */
export function verifyWebhookSignature(rawBody: string, headers: WaffoHeaders, publicKey: string, now = () => Date.now()): string {
  return verifyRawSignature(rawBody, headerValue(headers, 'x-waffo-signature'), publicKey, now);
}

function parseMoney(value: unknown, currency: string): number {
  const text = stringValue(value);
  if (!text || !/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(text)) throw new WaffoWebhookError('Webhook amount is missing or not a canonical decimal.', 422, 'WAFFO_WEBHOOK_INCOMPLETE');
  const [whole, fraction = ''] = text.split('.');
  if (currency === 'USD' && fraction.length > 2) throw new WaffoWebhookError('Webhook USD amount has more than two decimal places.', 422, 'WAFFO_WEBHOOK_INCOMPLETE');
  const scale = currency === 'JPY' ? 0 : 2;
  if (fraction.length > scale) throw new WaffoWebhookError(`Webhook ${currency} amount has unsupported precision.`, 422, 'WAFFO_WEBHOOK_INCOMPLETE');
  const result = Number(BigInt(whole) * BigInt(10 ** scale) + BigInt((fraction || '').padEnd(scale, '0') || '0'));
  if (!Number.isSafeInteger(result)) throw new WaffoWebhookError('Webhook amount is outside the supported range.', 422, 'WAFFO_WEBHOOK_INCOMPLETE');
  return result;
}

function eventAmount(eventType: string, data: Record<string, unknown>, currency: string): number {
  const planPrice = objectRecord(data.planPrice);
  const source = eventType.startsWith('refund.') ? data.refundedAmount ?? data.amount : eventType.startsWith('subscription.') && eventType !== 'subscription.payment_succeeded' ? planPrice.total ?? data.amount : data.chargedAmount ?? data.amount;
  return parseMoney(source, currency);
}

/** Waffo's configured price amount is tax-exclusive. When the provider sends
 * the authoritative breakdown, compare the catalog against `subtotal` and
 * retain `chargedAmount` as the actual payment amount for the ledger. A
 * subtotal is never treated as tax-inclusive. */
function eventPriceBasis(eventType: string, data: Record<string, unknown>, currency: string, actualAmount: number): number {
  const breakdown = eventType.startsWith('refund.') ? objectRecord(data.originalPayment)
    : eventType === 'order.completed' || eventType === 'subscription.payment_succeeded' ? objectRecord(data.listPrice)
      : objectRecord(data.planPrice);
  if (breakdown.subtotal !== undefined) return parseMoney(breakdown.subtotal, currency);
  return actualAmount;
}

function eventProduct(data: Record<string, unknown>): Product {
  const orderMetadata = objectRecord(data.orderMetadata);
  const productMetadata = objectRecord(data.productMetadata);
  const value = stringValue(orderMetadata.siteProduct) || stringValue(productMetadata.siteProduct);
  if (!value || !Object.hasOwn(PRODUCTS, value)) throw new WaffoWebhookError('Webhook does not contain trusted local product metadata. Query the provider order before granting entitlement.', 422, 'WAFFO_WEBHOOK_INCOMPLETE');
  return value as Product;
}

function eventUserId(data: Record<string, unknown>): string {
  const orderMetadata = objectRecord(data.orderMetadata);
  if (stringValue(data.merchantProvidedBuyerIdentity) && stringValue(orderMetadata.siteUserId)
      && stringValue(data.merchantProvidedBuyerIdentity) !== stringValue(orderMetadata.siteUserId)) {
    throw new WaffoWebhookError('Webhook buyer identities conflict.', 422, 'WAFFO_WEBHOOK_INCOMPLETE');
  }
  const userId = stringValue(data.merchantProvidedBuyerIdentity) || stringValue(orderMetadata.siteUserId);
  if (!userId) throw new WaffoWebhookError('Webhook does not contain the merchant-provided user identity.', 422, 'WAFFO_WEBHOOK_INCOMPLETE');
  return userId;
}

function eventPaymentId(eventType: string, eventId: string, data: Record<string, unknown>): string | null {
  const paymentId = stringValue(data.paymentId);
  if (paymentId) return paymentId;
  if (eventType === 'order.completed' || eventType === 'subscription.payment_succeeded') return eventId;
  return null;
}

function canonicalizeEvent(event: Record<string, unknown>, config: WaffoConfig, options: WaffoAdapterOptions = {}): CanonicalWaffoEvent {
  const data = objectRecord(event.data);
  const id = requireEventString(event.id, 'event.id');
  const timestamp = requireEventString(event.timestamp, 'event.timestamp');
  const eventType = requireEventString(event.eventType, 'event.eventType');
  const eventId = requireEventString(event.eventId, 'event.eventId');
  const store = requireEventString(event.storeId, 'event.storeId');
  const mode = requireEventString(event.mode, 'event.mode');
  if (mode !== config.environment) throw new WaffoWebhookError('Webhook environment does not match the configured Waffo environment.');
  if (store !== config.storeId) throw new WaffoWebhookError('Webhook store does not match the configured Waffo store.');
  const currency = requireEventString(data.currency, 'data.currency').toUpperCase();
  if (currency !== config.currency) throw new WaffoWebhookError('Webhook currency does not match the configured currency.');
  const product = options.resolvedProduct || eventProduct(data);
  const amount = eventAmount(eventType, data, currency);
  const expectedPrice = config.prices[product];
  if (expectedPrice !== undefined && !eventType.startsWith('refund.') && eventPriceBasis(eventType, data, currency, amount) !== expectedPrice) throw new WaffoWebhookError('Webhook amount does not match the server-side product price map.', 422, 'WAFFO_WEBHOOK_PRICE_MISMATCH');
  const orderId = requireEventString(data.orderId, 'data.orderId');
  const orderMerchantExternalId = requireEventString(data.orderMerchantExternalId, 'data.orderMerchantExternalId');
  const userId = eventUserId(data);
  const paymentId = eventPaymentId(eventType, eventId, data);
  const period = data.currentPeriodStart || data.currentPeriodEnd || data.billingPeriod ? {interval: stringValue(data.billingPeriod) || null, start: stringValue(data.currentPeriodStart) || null, end: stringValue(data.currentPeriodEnd) || null} : null;
  return {
    id,
    paymentId,
    product,
    currency,
    amount,
    userId,
    store,
    env: mode,
    state: stringValue(data.paymentStatus) || stringValue(data.refundStatus) || stringValue(data.orderStatus) || eventType,
    paidPeriod: period,
    orderMerchantExternalId,
    orderId,
    eventType,
    eventId,
    ...(stringValue(options.providerProductId) ? {providerProductId: stringValue(options.providerProductId)} : {}),
    ...(stringValue(event.storeName) ? {storeName: stringValue(event.storeName)} : {}),
    timestamp,
  };
}

function requireEventString(value: unknown, name: string): string {
  const result = stringValue(value);
  if (!result) throw new WaffoWebhookError(`Webhook field ${name} is missing.`, 422, 'WAFFO_WEBHOOK_INCOMPLETE');
  return result;
}

export function verifyWebhook(rawBody: string, headers: WaffoHeaders, options: WaffoAdapterOptions = {}): CanonicalWaffoEvent {
  const envelope = verifyWebhookEnvelope(rawBody, headers, options);
  return canonicalizeWebhookEvent(envelope, options);
}

/** Verify only the signed provider envelope so incomplete business fields can
 * be retained for reconciliation instead of being acknowledged as a grant. */
export function verifyWebhookEnvelope(rawBody: string, headers: WaffoHeaders, options: WaffoAdapterOptions = {}): VerifiedWaffoEnvelope {
  if (typeof rawBody !== 'string') throw new WaffoWebhookError('Webhook body must be the unparsed request text.', 400, 'WAFFO_WEBHOOK_RAW_BODY_REQUIRED');
  const config = loadWaffoConfig(options.env || process.env, {requireWebhookKey: true, requireMappings: true});
  const signatureTimestamp = verifyRawSignature(rawBody, headerValue(headers, 'x-waffo-signature'), options.publicKey || config.webhookPublicKey!, options.now || (() => Date.now()));
  let event: Record<string, unknown>;
  try {
    const parsed = JSON.parse(rawBody) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('object expected');
    event = parsed as Record<string, unknown>;
  } catch {
    throw new WaffoWebhookError('Verified Waffo webhook body is not valid JSON.', 422, 'WAFFO_WEBHOOK_INCOMPLETE');
  }
  const id = requireEventString(event.id, 'event.id');
  const timestamp = requireEventString(event.timestamp, 'event.timestamp');
  const eventType = requireEventString(event.eventType, 'event.eventType');
  const eventId = requireEventString(event.eventId, 'event.eventId');
  const storeId = requireEventString(event.storeId, 'event.storeId');
  const mode = requireEventString(event.mode, 'event.mode');
  if (mode !== config.environment) throw new WaffoWebhookError('Webhook environment does not match the configured Waffo environment.');
  environmentForStore(options.env || process.env, storeId);
  return {
    id,
    timestamp,
    eventType,
    eventId,
    storeId,
    mode: mode as WaffoEnvironment,
    signatureTimestamp,
    ...(stringValue(event.storeName) ? {storeName: stringValue(event.storeName)} : {}),
    data: objectRecord(event.data),
  };
}

/**
 * Parse a webhook body whose signature was verified and durably recorded by
 * the initial request. This intentionally does not verify the RSA signature
 * or replay timestamp: a recovery may run after Waffo's delivery window. The
 * caller must first compare the stored body hash and proof fields, then pass
 * the expected envelope identity. Keeping this helper separate from
 * verifyWebhook makes the trust boundary explicit and prevents arbitrary
 * stored JSON from becoming a trusted webhook by itself.
 */
export function parsePersistedWebhookEnvelope(
  rawBody: string,
  expected: Pick<VerifiedWaffoEnvelope, 'id' | 'timestamp' | 'eventType' | 'eventId' | 'storeId' | 'mode'>,
): VerifiedWaffoEnvelope {
  if (typeof rawBody !== 'string') throw new WaffoWebhookError('Persisted webhook body must be text.', 422, 'WAFFO_WEBHOOK_INCOMPLETE');
  let event: Record<string, unknown>;
  try {
    const parsed = JSON.parse(rawBody) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('object expected');
    event = parsed as Record<string, unknown>;
  } catch {
    throw new WaffoWebhookError('Persisted webhook body is not valid JSON.', 422, 'WAFFO_WEBHOOK_INCOMPLETE');
  }
  const id = requireEventString(event.id, 'event.id');
  const timestamp = requireEventString(event.timestamp, 'event.timestamp');
  const eventType = requireEventString(event.eventType, 'event.eventType');
  const eventId = requireEventString(event.eventId, 'event.eventId');
  const storeId = requireEventString(event.storeId, 'event.storeId');
  const mode = requireEventString(event.mode, 'event.mode');
  const receiptIdMatches = id === expected.id || expected.id === waffoBusinessReceiptId(eventType, eventId, storeId, mode);
  const same = receiptIdMatches && timestamp === expected.timestamp && eventType === expected.eventType
    && eventId === expected.eventId && storeId === expected.storeId && mode === expected.mode;
  if (!same) throw new WaffoWebhookError('Persisted webhook body does not match its initial verification proof.', 422, 'WAFFO_WEBHOOK_INCOMPLETE');
  return {
    id,
    timestamp,
    eventType,
    eventId,
    storeId,
    mode: mode as WaffoEnvironment,
    ...(stringValue(event.storeName) ? {storeName: stringValue(event.storeName)} : {}),
    data: objectRecord(event.data),
  };
}

/** Canonicalize an envelope after its signature has already been verified. */
export function canonicalizeWebhookEvent(envelope: VerifiedWaffoEnvelope, options: WaffoAdapterOptions = {}): CanonicalWaffoEvent {
  const config = loadWaffoConfig(environmentForStore(options.env || process.env, envelope.storeId), {requireMappings: true});
  return canonicalizeEvent(envelope as unknown as Record<string, unknown>, config, options);
}

async function officialClient(config: WaffoConfig): Promise<WaffoCheckoutClient> {
  if (!config.merchantId || !config.privateKey) throw new WaffoUnavailableError('Waffo merchant credentials are not configured.');
  let module: {WaffoPancake?: new (config: Record<string, unknown>) => WaffoCheckoutClient};
  // Keep a literal import so esbuild includes the SDK in the Worker bundle.
  // A Function-based import only works where node_modules exists at runtime.
  try { module = await import('@waffo/pancake-ts') as unknown as typeof module; } catch { throw new WaffoUnavailableError('The payment service could not be loaded. Please try again later.'); }
  if (typeof module.WaffoPancake !== 'function') throw new WaffoUnavailableError('The installed Waffo SDK does not expose WaffoPancake.');
  return new module.WaffoPancake({merchantId: config.merchantId, privateKey: config.privateKey, baseUrl: config.endpoint, environment: config.environment, ...(config.webhookPublicKey ? {webhookPublicKey: config.webhookPublicKey} : {})});
}

function unwrapResult(value: Record<string, unknown>): Record<string, unknown> {
  const data = objectRecord(value.data);
  return Object.keys(data).length && !value.checkoutUrl ? data : value;
}

function checkoutUrl(value: unknown): string {
  const result = stringValue(value);
  if (!result) throw new WaffoUnavailableError('Waffo did not return a checkout URL.');
  let url: URL;
  try { url = new URL(result); } catch { throw new WaffoUnavailableError('Waffo returned an invalid checkout URL.'); }
  if (url.protocol !== 'https:') throw new WaffoUnavailableError('Waffo returned a checkout URL that is not HTTPS.');
  return url.toString();
}

export async function createCheckout(input: CreateCheckoutInput, options: WaffoAdapterOptions = {}): Promise<CheckoutResult> {
  const config = loadWaffoConfig(options.env || process.env, {requireCredentials: true, requireMappings: true});
  if (!input.userId.trim() || !input.orderId.trim()) throw new WaffoUnavailableError('A stable user ID and order ID are required before creating checkout.');
  if (!/^\S+@\S+\.\S+$/.test(input.email.trim())) throw new WaffoUnavailableError('A valid customer email is required before creating checkout.');
  if (!Object.hasOwn(PRODUCTS, input.product)) throw new WaffoUnavailableError('The requested product is not in the approved catalog.');
  const productId = config.productIds[input.product];
  const price = config.prices[input.product];
  if (!productId || price === undefined) throw new WaffoUnavailableError(`Waffo mapping is incomplete for ${input.product}.`);
  const returnUrl = validateUrl(input.returnUrl, 'returnUrl', config.environment, config.environment === 'test');
  const client = options.client || await officialClient(config);
  const rawResult = await client.checkout.authenticated.create({
    productId,
    currency: config.currency,
    buyerIdentity: input.userId,
    buyerEmail: input.email.trim(),
    successUrl: returnUrl,
    orderMerchantExternalId: input.orderId,
    metadata: {siteProduct: input.product, siteUserId: input.userId, siteOrderId: input.orderId},
    priceSnapshot: {amount: (price / 100).toFixed(2), taxCategory: config.taxCategory},
  }, {idempotencyKey: `headcanon_checkout_${createHash('sha256').update(JSON.stringify([config.environment, config.storeId, input.orderId])).digest('hex')}`});
  const result = unwrapResult(rawResult);
  const providerOrderId = stringValue(result.providerOrderId) || stringValue(result.orderId) || stringValue(result.sessionId);
  if (!providerOrderId) throw new WaffoUnavailableError('Waffo checkout did not return a provider session or order ID.');
  return {checkoutUrl: checkoutUrl(result.checkoutUrl), providerOrderId};
}

export interface WaffoPaymentLookup {
  id?: string;
  orderId?: string;
  status?: string;
  refundStatus?: string;
  orderMerchantExternalId?: string;
  snapshotAmountDetails?: Record<string, unknown>;
}

export type WaffoOrderProductKind = 'onetime' | 'subscription';

export interface WaffoOrderProductLookup {
  orderId: string;
  found: boolean;
  productId: string | null;
  kind: WaffoOrderProductKind | null;
  storeId: string | null;
  testMode: boolean | null;
}

/** Provider-owned order state used by durable reconciliation. These fields
 * mirror the documented GraphQL order-detail fields; nullable values are kept
 * nullable so a missing provider fact cannot be mistaken for a default. */
export interface WaffoOrderStateLookup extends WaffoOrderProductLookup {
  status: string | null;
  buyerEmail: string | null;
  currency: string | null;
  billingPeriod: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  payments: WaffoPaymentLookup[];
}

export type WaffoProductResolution =
  | {status: 'matched'; orderId: string; providerProductId: string; product: Product; kind: WaffoOrderProductKind}
  | {status: 'unmapped'; orderId: string; providerProductId: string | null; product: null; kind: WaffoOrderProductKind | null; reason: string};

interface WaffoOrderProductNode {
  id?: unknown;
  store?: {id?: unknown} | null;
  buyerEmail?: unknown;
  currency?: unknown;
  status?: unknown;
  testMode?: unknown;
  billingPeriod?: unknown;
  currentPeriodStart?: unknown;
  currentPeriodEnd?: unknown;
  onetimeProduct?: {id?: unknown} | null;
  subscriptionProduct?: {id?: unknown} | null;
  payments?: Array<{
    id?: unknown;
    orderId?: unknown;
    status?: unknown;
    refundStatus?: unknown;
    orderMerchantExternalId?: unknown;
    snapshotAmountDetails?: Record<string, unknown> | null;
  }> | null;
}

interface WaffoOrderProductQuery {
  onetimeOrder?: WaffoOrderProductNode | null;
  subscriptionOrder?: WaffoOrderProductNode | null;
}

/** Read the provider's current product for an order. The webhook payload does
 * not expose a product ID, so billing must use this authoritative order detail
 * query instead of treating merchant metadata as a product decision. */
export async function queryOrderProductById(orderId: string, options: WaffoAdapterOptions = {}): Promise<WaffoOrderProductLookup> {
  const normalizedOrderId = stringValue(orderId);
  if (!normalizedOrderId) throw new WaffoUnavailableError('A provider order ID is required for product lookup.');
  const config = loadWaffoConfig(options.env || process.env, {requireCredentials: true});
  const client = options.client || await officialClient(config);
  if (!client.graphql) throw new WaffoUnavailableError('The configured Waffo client does not expose GraphQL lookup.');
  let response: WaffoGraphqlResult<WaffoOrderProductQuery>;
  try {
    response = await client.graphql.query<WaffoOrderProductQuery>({
      query: `query ($id: String!) {
        onetimeOrder(id: $id) {
          id
          store { id }
          testMode
          onetimeProduct { id }
        }
        subscriptionOrder(id: $id) {
          id
          store { id }
          testMode
          subscriptionProduct { id }
        }
      }`,
      variables: {id: normalizedOrderId},
    });
  } catch (error) {
    if (error instanceof WaffoUnavailableError) throw error;
    throw new WaffoUnavailableError(error instanceof Error ? `Waffo provider order lookup failed: ${error.message}` : 'Waffo provider order lookup failed.');
  }
  if (!response || typeof response !== 'object' || response.errors?.length || !response.data || typeof response.data !== 'object' || Array.isArray(response.data)) throw new WaffoUnavailableError(response?.errors?.map(error => error.message).filter(Boolean).join('; ') || 'Waffo provider order lookup returned no data.');
  const oneTime = response.data.onetimeOrder || null;
  const subscription = response.data.subscriptionOrder || null;
  if (oneTime && subscription) throw new WaffoUnavailableError('Waffo returned both one-time and subscription orders for the same provider order ID.');
  if (!oneTime && !subscription) return {orderId: normalizedOrderId, found: false, productId: null, kind: null, storeId: null, testMode: null};
  const kind: WaffoOrderProductKind = oneTime ? 'onetime' : 'subscription';
  const node = oneTime || subscription!;
  const product = oneTime ? node.onetimeProduct : node.subscriptionProduct;
  const returnedOrderId = stringValue(node.id);
  if (!returnedOrderId || returnedOrderId !== normalizedOrderId) throw new WaffoUnavailableError('Waffo returned an order node that does not match the webhook order ID.');
  const testMode = typeof node.testMode === 'boolean' ? node.testMode : null;
  return {orderId: normalizedOrderId, found: true, productId: stringValue(product?.id) || null, kind, storeId: stringValue(node.store?.id) || null, testMode};
}

/**
 * Read current provider order/payment state for reconciliation. This is a
 * read-only GraphQL query and never creates or retries a checkout. The query
 * deliberately requests period, status, buyer, currency, and payment
 * snapshot data together so a recovery can fail closed when any fact needed
 * for entitlement matching is absent.
 */
export async function queryOrderStateById(orderId: string, options: WaffoAdapterOptions = {}): Promise<WaffoOrderStateLookup> {
  const normalizedOrderId = stringValue(orderId);
  if (!normalizedOrderId) throw new WaffoUnavailableError('A provider order ID is required for state lookup.');
  const config = loadWaffoConfig(options.env || process.env, {requireCredentials: true});
  const client = options.client || await officialClient(config);
  if (!client.graphql) throw new WaffoUnavailableError('The configured Waffo client does not expose GraphQL lookup.');
  let response: WaffoGraphqlResult<WaffoOrderProductQuery>;
  try {
    response = await client.graphql.query<WaffoOrderProductQuery>({
      query: `query ($id: String!) {
        onetimeOrder(id: $id) {
          id buyerEmail currency status testMode
          store { id }
          onetimeProduct { id }
          payments { id orderId status refundStatus orderMerchantExternalId snapshotAmountDetails { currency subtotal taxAmount total taxCategory phase } }
        }
        subscriptionOrder(id: $id) {
          id buyerEmail currency status testMode billingPeriod currentPeriodStart currentPeriodEnd
          store { id }
          subscriptionProduct { id }
          payments { id orderId status refundStatus orderMerchantExternalId snapshotAmountDetails { currency subtotal taxAmount total taxCategory phase } }
        }
      }`,
      variables: {id: normalizedOrderId},
    });
  } catch (error) {
    if (error instanceof WaffoUnavailableError) throw error;
    throw new WaffoUnavailableError(error instanceof Error ? `Waffo provider order state lookup failed: ${error.message}` : 'Waffo provider order state lookup failed.');
  }
  if (!response || typeof response !== 'object' || response.errors?.length || !response.data || typeof response.data !== 'object' || Array.isArray(response.data)) {
    throw new WaffoUnavailableError(response?.errors?.map(error => error.message).filter(Boolean).join('; ') || 'Waffo provider order state lookup returned no data.');
  }
  const oneTime = response.data.onetimeOrder || null;
  const subscription = response.data.subscriptionOrder || null;
  if (oneTime && subscription) throw new WaffoUnavailableError('Waffo returned both one-time and subscription orders for the same provider order ID.');
  if (!oneTime && !subscription) return {
    orderId: normalizedOrderId, found: false, productId: null, kind: null, storeId: null, testMode: null,
    status: null, buyerEmail: null, currency: null, billingPeriod: null, currentPeriodStart: null, currentPeriodEnd: null, payments: [],
  };
  const kind: WaffoOrderProductKind = oneTime ? 'onetime' : 'subscription';
  const node = oneTime || subscription!;
  const product = oneTime ? node.onetimeProduct : node.subscriptionProduct;
  const returnedOrderId = stringValue(node.id);
  if (!returnedOrderId || returnedOrderId !== normalizedOrderId) throw new WaffoUnavailableError('Waffo returned an order node that does not match the requested order ID.');
  const testMode = typeof node.testMode === 'boolean' ? node.testMode : null;
  const payments = Array.isArray(node.payments) ? node.payments.map((payment) => ({
    ...(stringValue(payment.id) ? {id: stringValue(payment.id)} : {}),
    ...(stringValue(payment.orderId) ? {orderId: stringValue(payment.orderId)} : {}),
    ...(stringValue(payment.status) ? {status: stringValue(payment.status)} : {}),
    ...(stringValue(payment.refundStatus) ? {refundStatus: stringValue(payment.refundStatus)} : {}),
    ...(stringValue(payment.orderMerchantExternalId) ? {orderMerchantExternalId: stringValue(payment.orderMerchantExternalId)} : {}),
    ...(payment.snapshotAmountDetails && typeof payment.snapshotAmountDetails === 'object' && !Array.isArray(payment.snapshotAmountDetails) ? {snapshotAmountDetails: payment.snapshotAmountDetails} : {}),
  })) : [];
  return {
    orderId: normalizedOrderId,
    found: true,
    productId: stringValue(product?.id) || null,
    kind,
    storeId: stringValue(node.store?.id) || null,
    testMode,
    status: stringValue(node.status) || null,
    buyerEmail: stringValue(node.buyerEmail) || null,
    currency: stringValue(node.currency)?.toUpperCase() || null,
    billingPeriod: stringValue(node.billingPeriod) || null,
    currentPeriodStart: stringValue(node.currentPeriodStart) || null,
    currentPeriodEnd: stringValue(node.currentPeriodEnd) || null,
    payments,
  };
}

/** Resolve the provider product ID to the server's approved local catalog. A
 * successful lookup for a different product is intentionally distinguishable
 * from a provider/API failure: it is safe to ignore without touching a local
 * account ledger, while failures remain eligible for reconciliation. */
export async function resolveWebhookProduct(envelope: VerifiedWaffoEnvelope, options: WaffoAdapterOptions = {}): Promise<WaffoProductResolution> {
  const orderId = stringValue(envelope.data.orderId);
  if (!orderId) throw new WaffoWebhookError('Webhook field data.orderId is missing.', 422, 'WAFFO_WEBHOOK_INCOMPLETE');
  const config = loadWaffoConfig(environmentForStore(options.env || process.env, envelope.storeId), {requireCredentials: true, requireMappings: true});
  const lookup = await queryOrderProductById(orderId, options);
  if (!lookup.found) throw new WaffoUnavailableError('The provider order was not found while resolving its current product.');
  if (!lookup.productId || !lookup.kind) throw new WaffoUnavailableError('The provider order exists but its current product is missing.');
  if (!lookup.storeId) throw new WaffoUnavailableError('The provider order response did not include its store ID.');
  if (lookup.storeId !== config.storeId) return {status: 'unmapped', orderId, providerProductId: lookup.productId, product: null, kind: lookup.kind, reason: 'The provider order belongs to a different store.'};
  if (lookup.testMode === null) throw new WaffoUnavailableError('The provider order response did not include its test/prod environment flag.');
  if ((lookup.testMode ? 'test' : 'prod') !== config.environment) return {status: 'unmapped', orderId, providerProductId: lookup.productId, product: null, kind: lookup.kind, reason: 'The provider order environment does not match the signed webhook.'};
  const matches = ALL_PRODUCTS.filter(product => config.productIds[product] === lookup.productId);
  if (matches.length > 1) throw new WaffoUnavailableError('The configured Waffo product map contains duplicate provider product IDs.');
  const product = matches[0];
  if (!product) return {status: 'unmapped', orderId, providerProductId: lookup.productId, product: null, kind: lookup.kind, reason: 'The provider order product is not configured for this site.'};
  const expectedKind: WaffoOrderProductKind = product === 'pack' ? 'onetime' : 'subscription';
  if (lookup.kind !== expectedKind) return {status: 'unmapped', orderId, providerProductId: lookup.productId, product: null, kind: lookup.kind, reason: 'The provider product type does not match the configured this site product.'};
  return {status: 'matched', orderId, providerProductId: lookup.productId, product, kind: lookup.kind};
}

export async function queryPaymentByOrderRef(orderMerchantExternalId: string, options: WaffoAdapterOptions = {}): Promise<WaffoPaymentLookup[]> {
  const config = loadWaffoConfig(options.env || process.env, {requireCredentials: true});
  if (!orderMerchantExternalId.trim()) throw new WaffoUnavailableError('An order merchant reference is required for provider lookup.');
  const client = options.client || await officialClient(config);
  if (!client.graphql) throw new WaffoUnavailableError('The configured Waffo client does not expose GraphQL lookup.');
  const response = await client.graphql.query<{payments?: WaffoPaymentLookup[]}>({
    query: `query ($ref: String!) {
      payments(filter: { orderMerchantExternalId: { eq: $ref } }) {
        id orderId status orderMerchantExternalId
        snapshotAmountDetails { currency subtotal taxAmount total taxCategory phase }
      }
    }`,
    variables: {ref: orderMerchantExternalId.trim()},
  });
  if (response.errors?.length || !response.data) throw new WaffoUnavailableError(response.errors?.map(error => error.message).filter(Boolean).join('; ') || 'Waffo provider lookup returned no data.');
  return Array.isArray(response.data.payments) ? response.data.payments : [];
}

export const queryPayment = queryPaymentByOrderRef;

export interface WaffoSubscriptionActionInput {
  action: 'cancel' | 'resume' | 'switch';
  providerOrderId: string;
  userId: string;
  email: string;
  product?: Product;
  returnUrl: string;
}

export interface WaffoSubscriptionActionResult {
  providerOrderId: string;
  status: string;
  checkoutUrl?: string;
}

/** Invoke only subscription methods exposed by the installed official SDK. */
export async function manageWaffoSubscription(input: WaffoSubscriptionActionInput, options: WaffoAdapterOptions = {}): Promise<WaffoSubscriptionActionResult> {
  const config = loadWaffoConfig(options.env || process.env, {requireCredentials: true, requireMappings: true});
  if (!input.providerOrderId.trim() || !input.userId.trim()) throw new WaffoUnavailableError('A provider subscription order and local user ID are required.');
  const client = options.client || await officialClient(config);
  if (input.action === 'cancel') {
    if (!client.orders?.cancelSubscription) throw new WaffoUnavailableError('The installed Waffo SDK does not expose orders.cancelSubscription; cancellation remains disabled.');
    const result = await client.orders.cancelSubscription({orderId: input.providerOrderId});
    return {providerOrderId: input.providerOrderId, status: stringValue(result.status) || 'canceling'};
  }
  if (input.action === 'resume') {
    if (!client.auth?.issueSessionToken || !client.customer) throw new WaffoUnavailableError('The installed Waffo SDK does not expose customer reactivation; resume remains disabled.');
    const tokenResult = await client.auth.issueSessionToken({storeId: config.storeId, buyerIdentity: input.userId});
    const token = stringValue(tokenResult.token);
    if (!token) throw new WaffoUnavailableError('Waffo did not return a customer session token for subscription resume.');
    const result = await client.customer(token).reactivateSubscription({orderId: input.providerOrderId});
    return {providerOrderId: input.providerOrderId, status: stringValue(result.status) || 'active'};
  }
  if (!input.product || input.product === 'pack') throw new WaffoUnavailableError('A subscription product is required for plan switching.');
  const productId = config.productIds[input.product];
  if (!productId) throw new WaffoUnavailableError(`Waffo mapping is incomplete for ${input.product}.`);
  const returnUrl = validateUrl(input.returnUrl, 'returnUrl', config.environment, config.environment === 'test');
  if (!client.checkout.authenticated.createPlanChange) throw new WaffoUnavailableError('The installed Waffo SDK does not expose authenticated plan changes; switching remains disabled.');
  const result = await client.checkout.authenticated.createPlanChange({
    originOrderId: input.providerOrderId,
    productId,
    currency: config.currency,
    buyerIdentity: input.userId,
    successUrl: returnUrl,
  });
  return {providerOrderId: input.providerOrderId, status: 'pending', checkoutUrl: checkoutUrl(unwrapResult(result).checkoutUrl)};
}
