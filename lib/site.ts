/**
 * Production site URL for sitemap, robots.txt, canonical URLs.
 * Cloudflare deployment: set NEXT_PUBLIC_SITE_URL in env or uses fallback.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://headcanongenerator.run");
