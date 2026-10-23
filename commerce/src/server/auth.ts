// Extracted from the starter's email/session/credit implementation. See source-manifest.json.
import { updateUserAttribution } from './order-attribution';
import siteConfig from '../config/site.json';
import planConfig from '../config/plans.json';
import { createHash, createHmac, randomBytes, randomInt, randomUUID, timingSafeEqual } from 'node:crypto';
import type { Database as DatabaseSync } from './db-types';
import { currentExecution } from './execution-context';
import { getDb, transaction } from './db';
import { stateFor } from './account-state';
type Row = Record<string, unknown>;

const SESSION_COOKIE = `${siteConfig.slug}_session`;

let previewSessionSecret: string | undefined;

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function appMode(): 'preview' | 'live' {
  if (process.env.APP_MODE === 'live' || process.env.APP_MODE === 'preview') return process.env.APP_MODE;
  throw new HttpError(503, 'APP_MODE must be explicitly configured as preview or live.');
}

function now() {
  return new Date();
}

function iso(value = now()) {
  return value.toISOString();
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function getOrigin() {
  return process.env.APP_ORIGIN || 'http://127.0.0.1:3100';
}

function sessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (appMode() === 'live') throw new HttpError(503, 'Account authentication is not configured.');
  return previewSessionSecret ??= randomBytes(32).toString('base64url');
}

function hash(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function sign(value: string) {
  return createHmac('sha256', sessionSecret()).update(value).digest('base64url');
}

function constantTimeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function id() {
  return randomUUID();
}

function json(value: unknown, status = 200, extra: HeadersInit = {}) {
  const headers = new Headers(extra);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Cache-Control', 'no-store');
  return new Response(JSON.stringify(value), { status, headers });
}

function withCookie(response: Response, cookie: string) {
  response.headers.append('Set-Cookie', cookie);
  return response;
}

function sessionCookie(sessionId: string, maxAge = 60 * 60 * 24 * 30) {
  const secure = appMode() === 'live' ? '; Secure' : '';
  return `${SESSION_COOKIE}=${sessionId}.${sign(sessionId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function clearSessionCookie() {
  const secure = appMode() === 'live' ? '; Secure' : '';
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

function readCookie(request: Request, name: string) {
  const raw = request.headers.get('cookie') || '';
  for (const part of raw.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return undefined;
}

type Session = { id: string; userId: string; csrfToken: string; role: string };

function csrfTokenForSession(sessionId: string) {
  return createHmac('sha256', sessionSecret()).update(`csrf:${sessionId}`).digest('base64url');
}

function getSession(request: Request): Session | null {
  const value = readCookie(request, SESSION_COOKIE);
  if (!value) return null;
  const dot = value.lastIndexOf('.');
  if (dot < 1) return null;
  const sessionId = value.slice(0, dot);
  if (!constantTimeEqual(value.slice(dot + 1), sign(sessionId))) return null;
  const row = getDb().prepare(`
    SELECT s.id, s.user_id, s.csrf_hash, s.expires_at, u.role
    FROM sessions s JOIN users u ON u.id=s.user_id
    WHERE s.id=?
  `).get(sessionId) as Row | undefined;
  if (!row || String(row.expires_at) <= iso()) return null;
  const csrfToken = csrfTokenForSession(sessionId);
  if (!constantTimeEqual(hash(csrfToken), String(row.csrf_hash))) return null;
  return {
    id: String(row.id),
    userId: String(row.user_id),
    csrfToken,
    role: String(row.role || 'user'),
  };
}

function requireSession(request: Request) {
  const session = getSession(request);
  if (!session) throw new HttpError(401, 'Sign in is required.');
  return session;
}

function requireOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin || origin !== getOrigin()) throw new HttpError(403, 'A same-origin request is required.');
}

function requireMutation(request: Request, session?: Session) {
  requireOrigin(request);
  if (session) {
    const token = request.headers.get('x-csrf-token');
    if (!token || !constantTimeEqual(token, session.csrfToken)) throw new HttpError(403, 'The CSRF token is missing or invalid.');
  }
}

function userRow(userId: string) {
  return getDb().prepare('SELECT id,email,name,mode,role,created_at FROM users WHERE id=?').get(userId) as Row | undefined;
}

function publicUser(userId: string) {
  const user = userRow(userId);
  if (!user) throw new HttpError(401, 'The signed-in account no longer exists.');
  return { id: String(user.id), email: String(user.email), name: String(user.name) };
}

function authenticatedEmail(request: Request, mutation = false): string | null {
  const session = getSession(request);
  if (!session) return null;
  if (mutation) {
    try { requireMutation(request, session); }
    catch { return null; }
  }
  const row = userRow(session.userId);
  return row?.mode === 'live' ? String(row.email).trim().toLowerCase() : null;
}

function normalizeEmail(value: unknown) {
  if (typeof value !== 'string') throw new HttpError(400, 'A valid email address is required.');
  const email = value.trim().toLowerCase();
  if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'A valid email address is required.');
  return email;
}

async function bodyJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const value = await request.json() as unknown;
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('object expected');
    return value as Record<string, unknown>;
  } catch {
    throw new HttpError(400, 'Request JSON is invalid.');
  }
}

function reservedAmount(userId: string) {
  const row = getDb().prepare(`SELECT COALESCE(SUM(amount),0) AS amount FROM reservations WHERE user_id=? AND status='reserved'`).get(userId) as Row;
  return Number(row.amount || 0);
}

function createSession(userId: string) {
  const accountId = currentExecution()?.accountId;
  const sessionId = accountId ? `${accountId}.${id()}` : id();
  // The raw token is derived from the signed session id. Only its hash is
  // persisted, while GET /state can reproduce the same token after refresh.
  const csrfToken = csrfTokenForSession(sessionId);
  transaction((db) => db.prepare('INSERT INTO sessions(id,user_id,csrf_hash,created_at,expires_at) VALUES(?,?,?,?,?)').run(sessionId, userId, hash(csrfToken), iso(), iso(addDays(now(), planConfig.entitlements.free.days))));
  return { sessionId, csrfToken };
}

async function requestEmailCode(request: Request) {
  requireMutation(request);
  const email = normalizeEmail((await bodyJson(request)).email);
  if (appMode() !== 'live' || !process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    throw new HttpError(503, 'Email sign-in is unavailable. Configure APP_MODE=live, RESEND_API_KEY, and EMAIL_FROM, or use preview demo sign-in.');
  }
  const recent = getDb().prepare(`SELECT COUNT(*) AS count FROM email_codes WHERE email=? AND created_at>?`).get(email, iso(new Date(Date.now() - 10 * 60 * 1000))) as Row;
  if (Number(recent.count || 0) >= 5) throw new HttpError(429, 'Too many sign-in emails were requested. Wait 10 minutes and try again.');
  const code = String(randomInt(100000, 1000000));
  transaction((db) => db.prepare('INSERT INTO email_codes(id,email,code_hash,expires_at,created_at) VALUES(?,?,?,?,?)').run(id(), email, hash(code), iso(new Date(Date.now() + 10 * 60_000)), iso()));
  const response = await fetch('https://api.resend.com/emails', { method: 'POST', signal: AbortSignal.timeout(15_000), headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [email], subject: `Your ${siteConfig.brand} sign-in code`, html: `<p>Your sign-in code is <strong>${code}</strong>. It expires in 10 minutes.</p>` }) });
  if (!response.ok) throw new HttpError(503, 'The configured email provider rejected the sign-in email. Check Resend configuration.');
  return json({ ok: true });
}

async function verifyEmailCode(request: Request) {
  requireMutation(request);
  const body = await bodyJson(request);
  const email = normalizeEmail(body.email);
  const code = typeof body.code === 'string' ? body.code.trim() : '';
  if (!/^\d{6}$/.test(code)) throw new HttpError(400, 'A six-digit sign-in code is required.');
  const row = getDb().prepare(`SELECT * FROM email_codes WHERE email=? ORDER BY created_at DESC,rowid DESC LIMIT 1`).get(email) as Row | undefined;
  if (!row || row.used_at || String(row.expires_at) <= iso() || Number(row.attempts) >= 5 || !constantTimeEqual(String(row.code_hash), hash(code))) {
    if (row) transaction((db) => db.prepare('UPDATE email_codes SET attempts=attempts+1 WHERE id=?').run(String(row.id)));
    throw new HttpError(401, 'The sign-in code is invalid or expired.');
  }
  transaction((db) => db.prepare('UPDATE email_codes SET used_at=? WHERE id=?').run(iso(), String(row.id)));
  const existing = getDb().prepare("SELECT id FROM users WHERE email=? AND mode='live'").get(email) as Row | undefined;
  const previewExisting = getDb().prepare("SELECT id FROM users WHERE email=? AND mode='preview'").get(email) as Row | undefined;
  if (!existing && previewExisting) throw new HttpError(409, 'This email belongs to a preview account. Use a different email for live sign-in.');
  const userId = existing ? String(existing.id) : currentExecution()?.accountId || id();
  if (!existing) transaction((db) => {
    db.prepare('INSERT INTO users(id,email,name,mode,created_at) VALUES(?,?,?,?,?)').run(userId, email, email.split('@')[0].slice(0, 64), 'live', iso());
  });
  transaction((db) => updateUserAttribution(db,userId,body.analyticsAttribution));
  const session = createSession(userId);
  return withCookie(json(stateFor(userId, session.csrfToken)), sessionCookie(session.sessionId));
}

function logout(request: Request) {
  const session = getSession(request);
  requireMutation(request, session || undefined);
  if (session) transaction((db) => db.prepare('DELETE FROM sessions WHERE id=?').run(session.id));
  return withCookie(json({ ok: true }), clearSessionCookie());
}

function reserveChildCredits(db: DatabaseSync, userId: string, jobId: string, childId: string, amount: number) {
  let need = amount;
  const grants = db.prepare(`SELECT * FROM grants WHERE user_id=? AND remaining>0 AND expires_at>? ORDER BY expires_at,created_at,id`).all(userId, iso()) as Row[];
  for (const grant of grants) {
    if (need <= 0) break;
    const take = Math.min(need, Number(grant.remaining));
    db.prepare('UPDATE grants SET remaining=remaining-? WHERE id=? AND remaining>=?').run(take, String(grant.id), take);
    db.prepare('INSERT INTO reservations(id,user_id,job_id,child_id,grant_id,amount,status,created_at) VALUES(?,?,?,?,?,?,?,?)').run(id(), userId, jobId, childId, String(grant.id), take, 'reserved', iso());
    need -= take;
  }
  if (need > 0) throw new HttpError(402, `Not enough credits. This operation requires ${amount} credit${amount === 1 ? '' : 's'}.`);
}
export { HttpError, appMode, now, iso, addDays, getOrigin, sessionSecret, hash, sign, constantTimeEqual, id, json, withCookie, sessionCookie, clearSessionCookie, readCookie, csrfTokenForSession, getSession, requireSession, requireOrigin, requireMutation, userRow, publicUser, authenticatedEmail, normalizeEmail, bodyJson, createSession, requestEmailCode, verifyEmailCode, logout, reserveChildCredits, reservedAmount };
