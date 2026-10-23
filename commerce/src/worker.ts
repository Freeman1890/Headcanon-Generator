import { accountForEmail, accountFromSession, boundedRequest } from './cloudflare/routing';
import { verifyWebhookEnvelope, resolveWebhookProduct, WaffoWebhookError } from './server/waffo';
import { ADMIN_ACCOUNT_TABS, type AdminAccountTab } from './server/admin-account';
export { AccountState } from './cloudflare/account';
export { UserDirectory } from './cloudflare/user-directory';

const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex, nofollow' } });
export default {
  async fetch(original: Request, env: Env): Promise<Response> {
    const path = new URL(original.url).pathname.replace(/\/$/, '');
    const flags = { email: env.AUTH_ENABLED === 'true', generation: env.GENERATION_ENABLED === 'true', payments: env.PAYMENTS_ENABLED === 'true' };
    if (path === '/api/state' && !accountFromSession(original, env.SESSION_SECRET || '')) return json({ user: null, balance: 0, reserved: 0, capabilities: flags, price: 990, packCredits: 100 });
    if (!env.SESSION_SECRET || !env.ACCOUNT_ROUTING_SECRET) return json({ error: 'The account service is not configured.' }, 503);
    if (!['GET', 'POST'].includes(original.method)) return json({ error: 'Method not allowed.' }, 405);
    let request: Request;
    try { request = await boundedRequest(original, 64 * 1024); } catch { return json({ error: 'Request is too large.' }, 413); }
    let accountId = accountFromSession(request, env.SESSION_SECRET);
    if (path === '/api/auth/request' || path === '/api/auth/verify') {
      if (!flags.email) return json({ error: 'Email sign-in is temporarily unavailable.' }, 503);
      if (request.method !== 'POST' || request.headers.get('origin') !== env.APP_ORIGIN) return json({ error: 'A same-origin POST is required.' }, 403);
      if (!(await env.AUTH_LIMITER.limit({ key: request.headers.get('CF-Connecting-IP') || 'local' })).success) return json({ error: 'Too many sign-in attempts. Please wait a minute.' }, 429);
      try {
        const body = await request.clone().json() as { email?: unknown };
        if (typeof body.email !== 'string') throw new Error();
        accountId = accountForEmail(body.email, env.ACCOUNT_ROUTING_SECRET);
      } catch { return json({ error: 'Enter a valid email address.' }, 400); }
    } else if (path === '/api/webhooks/waffo') {
      if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
      try {
        const envelope = verifyWebhookEnvelope(await request.clone().text(), request.headers);
        const resolution = await resolveWebhookProduct(envelope);
        if (resolution.status === 'unmapped') return json({ status: 'ignored' });
        const metadata = envelope.data.orderMetadata;
        const user = envelope.data.merchantProvidedBuyerIdentity || (metadata && typeof metadata === 'object' ? (metadata as Record<string, unknown>).siteUserId : undefined);
        if (typeof user !== 'string' || !/^[a-f0-9]{64}$/.test(user)) return json({ error: 'Payment account could not be resolved. Retry later.' }, 503);
        accountId = user;
      } catch (error) { return json({ error: 'Payment verification could not be completed.' }, error instanceof WaffoWebhookError ? error.status : 503); }
    } else if (path.startsWith('/api/admin/')) {
      if (!accountId || request.method !== 'GET' || !env.ADMIN_EMAIL) return json({ error: 'Administrator access is required.' }, 403);
      if (!(await env.ACCOUNTS.getByName(accountId).isAdministrator(new Request(request.url, { headers: request.headers }), accountId))) return json({ error: 'Administrator access is required.' }, 403);
      const params = new URL(request.url).searchParams;
      const page = Number(params.get('page') || 1);
      const search = params.get('search') || '';
      if (!Number.isSafeInteger(page) || page < 1 || page > 100000 || search.length > 320) return json({ error: 'Invalid query.' }, 400);
      if (path === '/api/admin/users') return json(await env.USER_DIRECTORY.getByName('registered-users-v1').users({ page, search, kind: 'all' }));
      const match = /^\/api\/admin\/users\/([a-f0-9]{64})$/.exec(path);
      const tab = params.get('tab') || 'orders';
      if (!match || !ADMIN_ACCOUNT_TABS.includes(tab as AdminAccountTab)) return json({ error: 'Not found.' }, 404);
      return json(await env.ACCOUNTS.getByName(match[1]).inspect(match[1], { page, pageSize: 10, search, tab: tab as AdminAccountTab }));
    } else if (path === '/api/generate' && !flags.generation || path === '/api/checkout' && !flags.payments) {
      return json({ error: 'This service is temporarily unavailable.' }, 503);
    } else if (!['/api/state', '/api/auth/logout', '/api/checkout', '/api/generate'].includes(path) && !/^\/api\/generations\/[a-zA-Z0-9_-]{16,100}$/.test(path)) {
      return json({ error: 'Not found.' }, 404);
    }
    if (!accountId) return json({ error: 'Sign in to continue.' }, 401);
    const response = await env.ACCOUNTS.getByName(accountId).handleRequest(request, accountId);
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'no-store');
    headers.set('X-Robots-Tag', 'noindex, nofollow');
    return new Response(response.body, { status: response.status, headers });
  },
};
