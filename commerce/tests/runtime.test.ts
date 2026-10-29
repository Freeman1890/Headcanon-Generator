import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createHash, createVerify, generateKeyPairSync, sign } from 'node:crypto';
import { Miniflare, Response, convertV4MiniflareOptions } from 'miniflare';

test('real Worker: email login, paid pack, five results, replay, failure, isolation and restart', { timeout: 120_000 }, async () => {
  const directory = await mkdtemp(join(tmpdir(), 'headcanon-paid-test-'));
  const keys = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const store = 'STO_0000000000000000000000';
  const product = 'PROD_PACK000000000000000000';
  const bindings = {
    APP_MODE: 'live', APP_ORIGIN: 'https://site.test', AUTH_ENABLED: 'true', GENERATION_ENABLED: 'true', PAYMENTS_ENABLED: 'true',
    SESSION_SECRET: 'synthetic-session-secret-only', ACCOUNT_ROUTING_SECRET: 'synthetic-routing-secret-only',
    KIE_API_KEY: 'synthetic-kie-secret-only', KIE_MODEL: 'deepseek-v4-1-flash', RESEND_API_KEY: 'synthetic-mail-secret-only', EMAIL_FROM: 'Headcanon <test@site.test>',
    ADMIN_EMAIL: 'owner@site.test', ADMIN_BACKFILL_IDS: '[]',
    WAFFO_ENVIRONMENT: 'test', WAFFO_ENDPOINT: 'https://waffo.test', WAFFO_STORE_ID: store,
    WAFFO_MERCHANT_ID: 'MER_0000000000000000000000', WAFFO_PRICE_PACK: '990', WAFFO_PRODUCT_PACK: product,
    WAFFO_PRIVATE_KEY: keys.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
    WAFFO_WEBHOOK_TEST_PUBLIC_KEY: keys.publicKey.export({ type: 'spki', format: 'pem' }).toString(),
    WAFFO_RETURN_URL: 'https://site.test/?payment=return',
  };
  let code = '';
  let generationCalls = 0;
  let checkoutCalls = 0;
  let providerFailure = false;
  let providerBusyResponses = 0;
  let lastGenerationPrompt = '';
  const egressErrors: string[] = [];
  const five = Array.from({ length: 5 }, (_, index) => `Mira keeps notebook number ${index + 1} by the door. She writes down one small thing before leaving each morning.`);
  const outboundService = async (request: Request) => {
    try {
      const url = new URL(request.url);
      const raw = await request.text();
      if (url.origin === 'https://api.resend.com') {
        assert.equal(request.headers.get('authorization'), 'Bearer synthetic-mail-secret-only');
        code = JSON.parse(raw).html.match(/\b\d{6}\b/)[0];
        return Response.json({ id: 'local-email' });
      }
      if (url.origin === 'https://api.kie.ai') {
        generationCalls++;
        lastGenerationPrompt = JSON.parse(raw).input;
        assert.equal(JSON.parse(raw).text.format.schema.properties.headcanons.items.maxLength, 800);
        assert.equal(url.pathname, '/openai/v1/responses');
        assert.equal(JSON.parse(raw).model, 'deepseek-v4-1-flash');
        assert.equal(JSON.parse(raw).reasoning.effort, 'none');
        assert.equal(request.headers.get('authorization'), 'Bearer synthetic-kie-secret-only');
        if (providerFailure) return Response.json({ code: 500, msg: 'Local simulated provider failure' });
        if (providerBusyResponses > 0) { providerBusyResponses--; return Response.json({ code: 503, msg: 'Service Unavailable' }); }
        const fixture = lastGenerationPrompt.includes('ORIGINAL fictional dialogue snippets')
          ? Array.from({ length: 5 }, (_, index) => `Mira: Where is notebook ${index + 1}?\nJo: Somewhere safe.\nMira: The fridge is not a filing cabinet.`)
          : lastGenerationPrompt.includes('compact fanfiction plot outlines')
          ? Array.from({ length: 5 }, (_, index) => `Mira wants to return parcel ${index + 1}. A closed road prevents the delivery. Jo finds a different route that requires admitting a mistake. They return the parcel together and tell the owner what happened.`)
          : lastGenerationPrompt.includes('scene premises in English')
          ? Array.from({ length: 5 }, (_, index) => `Mira and Jo reach platform ${index + 1} after the final train. Mira has one working phone but calling for help means admitting where they went. Jo must decide whether to ask about the missed calls.`)
          : five;
        return Response.json({ output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify({ headcanons: fixture }) }] }], status: 'completed', usage: { input_tokens: 200, output_tokens: 300 }, credits_consumed: 0.08 });
      }
      assert.equal(url.origin, 'https://waffo.test', 'All test egress must be locally handled.');
      const verifier = createVerify('RSA-SHA256');
      verifier.update(`POST\n${url.pathname}\n${request.headers.get('X-Timestamp')}\n${createHash('sha256').update(raw).digest('base64')}`);
      assert.equal(verifier.verify(keys.publicKey, request.headers.get('X-Signature')!, 'base64'), true);
      const body = JSON.parse(raw);
      if (url.pathname === '/v1/graphql') return Response.json({ data: { onetimeOrder: { id: 'ORD_headcanon', store: { id: store }, testMode: true, onetimeProduct: { id: product } }, subscriptionOrder: null } });
      if (url.pathname === '/v1/actions/auth/issue-session-token') return Response.json({ data: { token: 'local-buyer-token' } });
      assert.equal(url.pathname, '/v1/actions/checkout/create-session');
      assert.equal(body.priceSnapshot.amount, '9.90');
      assert.equal(body.productId, product);
      checkoutCalls++;
      return Response.json({ data: { sessionId: 'local-session', checkoutUrl: 'https://pancake.waffo.ai/local-checkout' } });
    } catch (error) { egressErrors.push(error instanceof Error ? error.message : String(error)); throw error; }
  };
  const start = async () => {
    const worker = new Miniflare(convertV4MiniflareOptions({
      name: 'headcanon-paid-fixture', modulesRoot: resolve('dist'), modules: [{ type: 'ESModule', path: resolve('dist/worker.mjs') }],
      compatibilityDate: '2026-09-21', compatibilityFlags: ['nodejs_compat'], bindings,
      durableObjects: { ACCOUNTS: { className: 'AccountState', useSQLite: true }, USER_DIRECTORY: { className: 'UserDirectory', useSQLite: true } },
      resourcePersistencePath: join(directory, 'state'),
      ratelimits: { AUTH_LIMITER: { simple: { limit: 100, period: 60 }, namespace_id: '1011' } },
      outboundService,
    }));
    try { await worker.ready; } catch (error) { await worker.dispose(); throw error; }
    return worker;
  };
  let worker: Miniflare | undefined;
  try {
    worker = await start();
    const request = (path: string, body?: unknown, headers: Record<string, string> = {}) => worker!.dispatchFetch(`https://site.test${path}`, { method: body === undefined ? 'GET' : 'POST', headers: { Origin: 'https://site.test', 'Content-Type': 'application/json', ...headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    assert.equal((await request('/api/generate', { characterName: 'Mira' })).status, 401);
    assert.equal((await request('/api/auth/request', { email: 'creator@site.test' }, { Origin: 'https://evil.test' })).status, 403);
    assert.equal((await request('/api/auth/request', { email: 'creator@site.test' })).status, 200);
    const login = await request('/api/auth/verify', { email: 'creator@site.test', code });
    assert.equal(login.status, 200, await login.clone().text());
    const state = await login.json() as { user: { id: string }; csrfToken: string; balance: number };
    assert.equal(state.balance, 0, 'No free starter grant.');
    const cookie = login.headers.get('set-cookie')!.split(';')[0];
    const auth = { Cookie: cookie, 'x-csrf-token': state.csrfToken };
    const firstKey = 'first_generation_key_0001';
    assert.equal((await request('/api/generate', { characterName: 'Mira', mode: 'oc' }, { ...auth, 'idempotency-key': firstKey })).status, 402);
    assert.equal(generationCalls, 0);
    assert.equal((await request('/api/checkout', { product: 'creator-monthly', idempotencyKey: 'checkout_key_00001' }, auth)).status, 400);
    const checkout = await request('/api/checkout', { product: 'pack', idempotencyKey: 'checkout_key_00001' }, auth);
    assert.equal(checkout.status, 200, await checkout.clone().text());
    const order = await checkout.json() as { localOrderId: string; checkoutUrl: string };
    assert.match(order.checkoutUrl, /^https:\/\/pancake\.waffo\.ai\//);
    const stateBefore = await (await request('/api/state', undefined, auth)).json() as { balance: number };
    assert.equal(stateBefore.balance, 0, 'Opening checkout does not grant credits.');
    bindings.PAYMENTS_ENABLED = 'false';
    await worker.dispose(); worker = await start();
    const pausedState = await (await request('/api/state', undefined, auth)).json() as { capabilities: { payments: boolean; generation: boolean; email: boolean } };
    assert.deepEqual(pausedState.capabilities, { email: true, generation: true, payments: false });
    const guestState = await (await request('/api/state')).json() as { capabilities: { payments: boolean } };
    assert.equal(guestState.capabilities.payments, false);
    for (const idempotencyKey of ['checkout_key_00001', 'paused_new_checkout_0001']) {
      assert.equal((await request('/api/checkout', { product: 'pack', idempotencyKey }, auth)).status, 503);
    }
    assert.equal(checkoutCalls, 1, 'Pausing purchases blocks both new and replayed checkout requests before provider calls.');
    const paidBody = JSON.stringify({ id: 'delivery-paid', eventId: 'event-paid', eventType: 'order.completed', timestamp: new Date().toISOString(), storeId: store, mode: 'test',
      data: { orderId: 'ORD_headcanon', orderMerchantExternalId: order.localOrderId, merchantProvidedBuyerIdentity: state.user.id,
        currency: 'USD', chargedAmount: '9.90', paymentId: 'PAY_headcanon', paymentStatus: 'succeeded', orderStatus: 'completed',
        orderMetadata: { siteProduct: 'pack', siteUserId: state.user.id } } });
    const timestamp = String(Date.now());
    const signature = sign('RSA-SHA256', Buffer.from(`${timestamp}.${paidBody}`), keys.privateKey).toString('base64');
    const webhook = (raw = paidBody) => worker!.dispatchFetch('https://site.test/api/webhooks/waffo', { method: 'POST', headers: { 'X-Waffo-Signature': `t=${timestamp},v1=${signature}` }, body: raw });
    assert.notEqual((await webhook(paidBody.replace('9.90', '99.90'))).status, 200);
    const paid = await webhook();
    assert.equal(paid.status, 200, await paid.clone().text());
    assert.equal((await paid.json() as { status: string }).status, 'processed', 'An existing order can still be fulfilled while new purchases are paused.');
    assert.equal((await (await request('/api/state', undefined, auth)).json() as { balance: number }).balance, 100);
    assert.equal((await (await webhook()).json() as { status: string }).status, 'duplicate');
    const invalidOptions = await request('/api/generate', { characterName: 'Mira', tone: 'unsupported' }, { ...auth, 'idempotency-key': 'invalid_options_key_001' });
    assert.equal(invalidOptions.status, 400);
    assert.equal(generationCalls, 0, 'Invalid choices must not call the provider.');
    assert.equal((await (await request('/api/state', undefined, auth)).json() as { balance: number }).balance, 100);
    const input = { characterName: 'Mira', secondCharacter: 'Jo', mode: 'relationship', relationshipKind: 'friendship', tone: 'fluff', scenario: 'Waiting out the rain after training' };
    const generated = await request('/api/generate', input, { ...auth, 'idempotency-key': firstKey });
    assert.equal(generated.status, 200, await generated.clone().text());
    assert.equal((await generated.json() as { headcanons: string[] }).headcanons.length, 5);
    assert.equal((await request('/api/generate', input, { ...auth, 'idempotency-key': firstKey })).status, 200);
    assert.equal(generationCalls, 1);
    assert.match(lastGenerationPrompt, /strictly platonic/);
    assert.match(lastGenerationPrompt, /warm, low-stakes fluff tone/);
    assert.match(lastGenerationPrompt, /Waiting out the rain after training/);
    assert.equal((await request('/api/generate', { ...input, characterName: 'Different' }, { ...auth, 'idempotency-key': firstKey })).status, 409);
    providerFailure = true;
    assert.equal((await request('/api/generate', input, { ...auth, 'idempotency-key': 'failed_generation_key_01' })).status, 502);
    assert.equal((await (await request('/api/state', undefined, auth)).json() as { balance: number }).balance, 99);
    assert.equal((await request('/api/generate', input, { ...auth, 'x-csrf-token': 'wrong', 'idempotency-key': 'bad_csrf_generation_001' })).status, 403);
    assert.equal((await request(`/api/generations/${firstKey}`)).status, 401);
    assert.equal((await request('/api/auth/request', { email: 'other@site.test' })).status, 200);
    const other = await request('/api/auth/verify', { email: 'other@site.test', code });
    const otherCookie = other.headers.get('set-cookie')!.split(';')[0];
    assert.equal((await request(`/api/generations/${firstKey}`, undefined, { Cookie: otherCookie })).status, 404);
    assert.equal((await request('/api/admin/users', undefined, auth)).status, 403);
    await worker.dispose(); worker = await start();
    const persisted = await request('/api/state', undefined, auth);
    assert.equal((await persisted.json() as { balance: number }).balance, 99);
    assert.equal((await request('/api/generate', input, { ...auth, 'idempotency-key': firstKey })).status, 200);
    await request('/api/checkout', { product: 'pack', idempotencyKey: 'checkout_key_00001' }, auth);
    assert.equal(checkoutCalls, 1);
    assert.equal(generationCalls, 2);
    const signedEvent = async (eventType: string, eventId: string, data: Record<string, unknown>) => {
      const envelope = JSON.parse(paidBody);
      envelope.eventType = eventType; envelope.eventId = eventId; envelope.id = eventId;
      envelope.data = { ...envelope.data, ...data };
      const raw = JSON.stringify(envelope);
      const stamp = String(Date.now());
      const sig = sign('RSA-SHA256', Buffer.from(`${stamp}.${raw}`), keys.privateKey).toString('base64');
      return worker!.dispatchFetch('https://site.test/api/webhooks/waffo', { method: 'POST', headers: { 'X-Waffo-Signature': `t=${stamp},v1=${sig}` }, body: raw });
    };
    const failedRefund = await signedEvent('refund.failed', 'refund-failed', { refundStatus: 'failed', refundedAmount: '9.90' });
    assert.equal(failedRefund.status, 200, await failedRefund.clone().text());
    providerFailure = false;
    const concurrentKey = 'concurrent_generation_001';
    const first = request('/api/generate', input, { ...auth, 'idempotency-key': concurrentKey });
    const repeated = request('/api/generate', input, { ...auth, 'idempotency-key': concurrentKey });
    const responses = await Promise.all([first, repeated]);
    assert.ok(responses.every(response => [200, 202].includes(response.status)));
    assert.equal(generationCalls, 3, 'Concurrent replay must call the model once.');
    assert.equal((await (await request('/api/state', undefined, auth)).json() as { balance: number }).balance, 98, 'Failed refund must not block paid credits.');
    for (const [index, kind] of ['scenario', 'dialogue', 'plot'].entries()) {
      const key = `writing_tool_${kind}_000001`;
      const body = { ...input, kind };
      const response = await request('/api/generate', body, { ...auth, 'idempotency-key': key });
      assert.equal(response.status, 200, await response.clone().text());
      const data = await response.json() as { kind: string; headcanons: string[]; shareUrl?: string };
      assert.equal(data.kind, kind); assert.equal(data.headcanons.length, 5);
      assert.match(data.headcanons[0], kind === 'dialogue' ? /Mira:.*\nJo:/ : kind === 'plot' ? /Mira wants to return/ : /reach platform/);
      assert.equal(data.shareUrl, undefined, 'Do not mislabel dialogue or plots as headcanon share pages.');
      assert.match(lastGenerationPrompt, new RegExp(kind === 'scenario' ? 'scene premises' : kind === 'dialogue' ? 'fictional dialogue snippets' : 'plot outlines'));
      assert.equal((await request('/api/generate', body, { ...auth, 'idempotency-key': key })).status, 200);
      assert.equal(generationCalls, 4 + index, 'Each tool replays without a second provider call.');
      assert.equal((await request('/api/generate', { ...body, kind: kind === 'plot' ? 'scenario' : 'plot' }, { ...auth, 'idempotency-key': key })).status, 409);
      assert.equal((await (await request('/api/state', undefined, auth)).json() as { balance: number }).balance, 97 - index);
    }
    assert.equal((await request('/api/generate', { ...input, kind: 'bad' }, { ...auth, 'idempotency-key': 'invalid_writing_tool_0001' })).status, 400);
    assert.equal(generationCalls, 6);
    providerBusyResponses = 1;
    const retryHeaders = { ...auth, 'idempotency-key': 'busy_then_success_000001' };
    const retryInput = { ...input, kind: 'scenario' };
    assert.equal((await request('/api/generate', retryInput, retryHeaders)).status, 200);
    assert.equal(generationCalls, 8, 'One automatic retry remains inside one paid generation.');
    assert.equal((await (await request('/api/state', undefined, auth)).json() as { balance: number }).balance, 94);
    assert.equal((await request('/api/generate', retryInput, retryHeaders)).status, 200);
    assert.equal(generationCalls, 8, 'Replaying the successful generation cannot retry the provider again.');
    providerBusyResponses = 2;
    const busyHeaders = { ...auth, 'idempotency-key': 'busy_twice_failure_000001' };
    assert.equal((await request('/api/generate', retryInput, busyHeaders)).status, 502);
    assert.equal(generationCalls, 10);
    assert.equal((await (await request('/api/state', undefined, auth)).json() as { balance: number }).balance, 94, 'Repeated provider failure returns the reserved credit.');
    assert.equal((await request('/api/generate', retryInput, busyHeaders)).status, 502);
    assert.equal(generationCalls, 10, 'A failed generation replay must not spend more provider requests.');
    const refunded = await signedEvent('refund.succeeded', 'refund-succeeded', { refundStatus: 'succeeded', refundedAmount: '9.90' });
    assert.equal(refunded.status, 200, await refunded.clone().text());
    assert.equal((await (await request('/api/state', undefined, auth)).json() as { balance: number }).balance, 0);
    await signedEvent('order.completed', 'late-payment', {});
    assert.equal((await (await request('/api/state', undefined, auth)).json() as { balance: number }).balance, 0, 'Late paid events cannot revive refunded credits.');
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    if (worker) await worker.dispose();
    assert.deepEqual(egressErrors, [], 'No unexpected network calls or invalid SDK requests.');
    await rm(directory, { recursive: true, force: true });
  }
});
