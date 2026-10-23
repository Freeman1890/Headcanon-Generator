import siteConfig from '../config/site.json';
const cookieName = `${siteConfig.slug}_session=`;
import { createHmac, timingSafeEqual } from 'node:crypto';

export function accountForEmail(email: string, routingSecret: string) {
  const normalized = email.trim().toLowerCase();
  if (normalized.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error('A valid email address is required.');
  if (!routingSecret) throw new Error('Account routing is not configured.');
  return createHmac('sha256', routingSecret).update(`account:${normalized}`).digest('hex');
}

export function accountFromSession(request: Request, sessionSecret: string) {
  if (!sessionSecret) return null;
  const cookie = (request.headers.get('cookie') || '').split(';').map(part => part.trim()).find(part => part.startsWith(cookieName))?.slice(cookieName.length);
  if (!cookie) return null;
  const match = /^([a-f0-9]{64})\.([a-f0-9-]{36})\.([A-Za-z0-9_-]{43})$/.exec(cookie);
  if (!match) return null;
  const expected = createHmac('sha256', sessionSecret).update(`${match[1]}.${match[2]}`).digest();
  const signature = Buffer.from(match[3], 'base64url');
  return expected.length === signature.length && timingSafeEqual(expected, signature) ? match[1] : null;
}

export async function boundedRequest(request: Request, maximum: number) {
  if (Number(request.headers.get('content-length') || 0) > maximum) throw new Error('Request is too large.');
  if (!request.body) return request;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maximum) { await reader.cancel(); throw new Error('Request is too large.'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return new Request(request.url, { method: request.method, headers: request.headers, body: bytes });
}
