import { NextRequest } from 'next/server';

const EXTRA_ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  'https://kanbi.app',
  'https://kanbi.vercel.app',
  'https://kanbi-actionboard.vercel.app',
].filter(Boolean) as string[];

function collectAllowedOrigins(request: NextRequest): Set<string> {
  const allowed = new Set<string>();

  for (const value of EXTRA_ALLOWED_ORIGINS) {
    try {
      allowed.add(new URL(value).origin);
    } catch {
      allowed.add(value);
    }
  }

  const host = request.headers.get('host');
  if (host) {
    allowed.add(`http://${host}`);
    allowed.add(`https://${host}`);
  }

  return allowed;
}

function matchesAllowedOrigin(origin: URL, allowed: Set<string>): boolean {
  return allowed.has(origin.origin);
}

function isSameSiteRequest(request: NextRequest, url: URL): boolean {
  const host = request.headers.get('host');
  return !!host && url.host === host;
}

/**
 * API paths that are legitimately called without a browser origin. Each one
 * authenticates the caller by its own means (a webhook signature, a bearer
 * token), so the origin check does not apply to them.
 */
const SERVER_TO_SERVER_PATHS = [
  '/api/webhooks/',
  '/api/cron/',
  '/api/keep-alive',
];

function isServerToServerPath(pathname: string): boolean {
  return SERVER_TO_SERVER_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path)
  );
}

export function checkCsrfOrigin(request: NextRequest): boolean {
  if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') {
    return true;
  }

  const { pathname } = request.nextUrl;
  if (isServerToServerPath(pathname)) {
    return true;
  }

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // A state-changing browser request always carries an Origin header in every
  // currently supported browser. When it is absent, treat the request as
  // cross-site rather than allowing it, so a forged form POST that suppresses
  // both headers is rejected instead of admitted.
  if (!origin && !referer) {
    return false;
  }

  const allowed = collectAllowedOrigins(request);

  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (isSameSiteRequest(request, originUrl)) return true;
      if (matchesAllowedOrigin(originUrl, allowed)) return true;

      // An explicit same-site fetch from our own origin is trustworthy even when
      // the Host header differs, which happens behind a proxy or preview domain.
      const fetchSite = request.headers.get('sec-fetch-site');
      if (fetchSite === 'same-origin' || fetchSite === 'none') return true;

      return false;
    } catch {
      return false;
    }
  }

  if (referer) {
    try {
      const refererUrl = new URL(referer);
      return isSameSiteRequest(request, refererUrl) || matchesAllowedOrigin(refererUrl, allowed);
    } catch {
      return false;
    }
  }

  return false;
}

export function sanitizeInput(input: string, maxLength = 8000): string {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
    .slice(0, maxLength);
}
