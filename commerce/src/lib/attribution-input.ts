import siteConfig from '../config/site.json';
import analyticsConfig from '../config/analytics.json';

/** Consent-scoped, deliberately small order-source data. Never store a URL or search query. */
export type AttributionTouch = {
  source: string;
  medium: string;
  campaign: string | null;
  landingPath: string;
  at: number;
};

export type AttributionInput = {
  consent: 'granted' | 'denied';
  consentExpiresAt?: number;
  first?: AttributionTouch | null;
  last?: AttributionTouch | null;
  gaClientId?: string | null;
  gaSessionId?: string | null;
};

export const ATTRIBUTION_KEY = `${siteConfig.slug}.order-attribution.v1`;
export const ATTRIBUTION_LIFETIME = 90 * 24 * 60 * 60 * 1000;
export const ATTRIBUTION_ORIGIN = siteConfig.origin;
export const PUBLIC_LANDING_PATHS = analyticsConfig.publicPaths;

export const publicPaths = new Set<string>(PUBLIC_LANDING_PATHS);
export const knownSources = new Set([
  'google', 'bing', 'yahoo', 'duckduckgo', 'baidu', 'yandex',
  'chatgpt', 'openai', 'perplexity', 'claude', 'gemini',
  'reddit', 'x', 'twitter', 'facebook', 'instagram', 'linkedin',
  'youtube', 'tiktok', 'pinterest', 'newsletter', 'email',
]);
const media = new Set([
  'organic', 'referral', 'social', 'email', 'cpc', 'ppc', 'paid',
  'paid_social', 'display', 'affiliate', 'newsletter', 'unknown',
]);
export const ignoredReferrers = [new URL(siteConfig.origin).hostname, ...analyticsConfig.ignoredReferrers];
export function denied(): AttributionInput { return { consent: 'denied' }; }
export function plain(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
export function hostMatches(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}
export function safeSlug(value: unknown, max: number): string | null {
  if (typeof value !== 'string' || value.length < 1 || value.length > max) return null;
  const slug = value.toLowerCase();
  return /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/.test(slug) ? slug : null;
}
export function safeHostname(value: string): string | null {
  if (value.length > 100 || value.includes('..') || value.includes('xn--')) return null;
  const labels = value.split('.');
  if (labels.length < 2 || !/^[a-z]{2,24}$/.test(labels.at(-1) || '')) return null;
  if (labels.some((label) => label.length > 63 || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label))) return null;
  return value;
}
export function safeSource(value: unknown): string | null {
  const slug = safeSlug(value, 100);
  if (!slug) return null;
  if (knownSources.has(slug)) return slug;
  const host = safeHostname(slug);
  return host && !ignoredReferrers.some((domain) => hostMatches(host, domain)) ? host : null;
}
export function safeMedium(value: unknown): string | null {
  const medium = safeSlug(value, 20);
  return medium && media.has(medium) ? medium : null;
}
export function safeCampaign(value: unknown): string | null | undefined {
  if (value === null || value === undefined) return null;
  return safeSlug(value, 64) ?? undefined;
}
function touch(value: unknown, now: number): AttributionTouch | null {
  if (!plain(value)) return null;
  const source = safeSource(value.source);
  const medium = safeMedium(value.medium);
  const campaign = safeCampaign(value.campaign);
  if (!source || !medium || campaign === undefined || !publicPaths.has(value.landingPath as string)
    || !Number.isSafeInteger(value.at) || (value.at as number) > now
    || (value.at as number) < now - ATTRIBUTION_LIFETIME) return null;
  return {
    source, medium, campaign,
    landingPath: value.landingPath as string,
    at: value.at as number,
  };
}

/** Server-safe boundary. Malformed consent or source records fail closed. */
export function sanitizeAttributionInput(value: unknown, now = Date.now()): AttributionInput {
  if (!plain(value) || value.consent !== 'granted') return denied();
  if (value.consentExpiresAt !== undefined && (!Number.isSafeInteger(value.consentExpiresAt)
    || (value.consentExpiresAt as number) <= now
    || (value.consentExpiresAt as number) > now + 180 * 24 * 60 * 60 * 1000)) return denied();
  const hasFirst = value.first !== undefined && value.first !== null;
  const hasLast = value.last !== undefined && value.last !== null;
  if (hasFirst !== hasLast) return denied();
  const first = hasFirst ? touch(value.first, now) : null;
  const last = hasLast ? touch(value.last, now) : null;
  if ((hasFirst && (!first || !last)) || (first && last && first.at > last.at)) return denied();
  const gaClientId = value.gaClientId == null ? null : value.gaClientId;
  const gaSessionId = value.gaSessionId == null ? null : value.gaSessionId;
  if (gaClientId !== null && (typeof gaClientId !== 'string' || gaClientId.length > 80
    || !/^\d{1,20}\.\d{1,20}$/.test(gaClientId))) return denied();
  if (gaSessionId !== null && (typeof gaSessionId !== 'string' || gaSessionId.length > 20
    || !/^\d{1,20}$/.test(gaSessionId))) return denied();
  return {
    consent: 'granted',
    ...(value.consentExpiresAt !== undefined ? { consentExpiresAt: value.consentExpiresAt as number } : {}),
    first, last,
    gaClientId, gaSessionId,
  };
}
