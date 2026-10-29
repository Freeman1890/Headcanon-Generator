import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { createCheckout, resolveWebhookProduct, verifyWebhookEnvelope, type WaffoCheckoutClient } from '../src/server/waffo';

test('checkout uses the independent store product and a stable provider idempotency key', async () => {
  const calls: Array<{ params: Record<string, unknown>; key?: string }> = [];
  const client: WaffoCheckoutClient = { checkout: { authenticated: { async create(params, options) {
    calls.push({ params, key: options?.idempotencyKey });
    return { sessionId: 'session-test', checkoutUrl: 'https://pancake.waffo.ai/test' };
  } } } };
  const env = { WAFFO_ENVIRONMENT: 'test', WAFFO_STORE_ID: 'STO_new', WAFFO_PRODUCT_PACK: 'PROD_new', WAFFO_PRICE_PACK: '990', WAFFO_TAX_CATEGORY: 'digital_goods', WAFFO_MERCHANT_ID: 'MER_test', WAFFO_PRIVATE_KEY: 'synthetic-key' };
  const input = { userId: 'buyer', email: 'buyer@site.test', orderId: 'local-order', product: 'pack' as const, returnUrl: 'https://site.test/' };
  await createCheckout(input, { env, client });
  await createCheckout(input, { env, client });
  await createCheckout({ ...input, orderId: 'different-order' }, { env, client });
  assert.equal(calls[0].params.productId, 'PROD_new');
  assert.equal(calls[0].key, calls[1].key);
  assert.notEqual(calls[0].key, calls[2].key);
  assert.deepEqual(calls[0].params.priceSnapshot, { amount: '9.90', taxCategory: 'digital_goods' });
});

test('legacy receipts retain strict signature, environment, store and product boundaries', async () => {
  const keys = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const env = { WAFFO_ENVIRONMENT: 'test', WAFFO_STORE_ID: 'STO_new', WAFFO_PRODUCT_PACK: 'PROD_new', WAFFO_LEGACY_STORE_ID: 'STO_old', WAFFO_LEGACY_PRODUCT_PACK: 'PROD_old', WAFFO_PRICE_PACK: '990', WAFFO_MERCHANT_ID: 'MER_test', WAFFO_PRIVATE_KEY: 'synthetic-key', WAFFO_WEBHOOK_TEST_PUBLIC_KEY: keys.publicKey.export({ type: 'spki', format: 'pem' }).toString() };
  const event = { id: 'delivery', eventId: 'event', eventType: 'order.completed', timestamp: new Date().toISOString(), storeId: 'STO_old', mode: 'test', data: { orderId: 'ORD_old' } };
  const body = JSON.stringify(event);
  const timestamp = String(Date.now());
  const headers = { 'x-waffo-signature': `t=${timestamp},v1=${sign('RSA-SHA256', Buffer.from(`${timestamp}.${body}`), keys.privateKey).toString('base64')}` };
  const envelope = verifyWebhookEnvelope(body, headers, { env });
  let providerProduct = 'PROD_old';
  const client: WaffoCheckoutClient = { checkout: { authenticated: { async create() { throw new Error('Unexpected checkout'); } } }, graphql: { async query<T>() {
    return { data: { onetimeOrder: { id: 'ORD_old', store: { id: 'STO_old' }, testMode: true, onetimeProduct: { id: providerProduct } }, subscriptionOrder: null } as T };
  } } };
  assert.equal((await resolveWebhookProduct(envelope, { env, client })).status, 'matched');
  providerProduct = 'PROD_unrelated';
  assert.equal((await resolveWebhookProduct(envelope, { env, client })).status, 'unmapped');
  assert.throws(() => verifyWebhookEnvelope(body.replace('STO_old', 'STO_other'), headers, { env }));
  assert.throws(() => verifyWebhookEnvelope(body, headers, { env: { ...env, WAFFO_ENVIRONMENT: 'prod', WAFFO_WEBHOOK_PROD_PUBLIC_KEY: env.WAFFO_WEBHOOK_TEST_PUBLIC_KEY } }));
  assert.throws(() => verifyWebhookEnvelope(body, headers, { env: { ...env, WAFFO_LEGACY_STORE_ID: '' } }));
});
