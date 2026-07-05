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

export function checkCsrfOrigin(request: NextRequest): boolean {
  if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') {
    return true;
  }

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // Allow server-to-server calls (webhooks, cron) with no browser origin
  if (!origin && !referer) return true;

  const allowed = collectAllowedOrigins(request);

  if (origin) {
    try {
      const originUrl = new URL(origin);
      return isSameSiteRequest(request, originUrl) || matchesAllowedOrigin(originUrl, allowed);
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
