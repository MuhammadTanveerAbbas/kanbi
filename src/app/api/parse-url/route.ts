import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { usageService } from '@/lib/services/usage-service';
import { AIService } from '@/lib/ai-service';
import { logger } from '@/lib/logging/logger';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limiter';
import { FETCH_TIMEOUT } from '@/lib/constants';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cheerio = require('cheerio') as { load: (html: string) => (sel: string | unknown) => { remove: () => void; text: () => string; attr: (n: string) => string | undefined; each: (fn: (i: number, el: unknown) => void) => void } };

const MAX_TEXT_LENGTH = 4000;

// SSRF protection: block private/internal IP ranges
const BLOCKED_HOSTNAMES = [
  'localhost', '127.0.0.1', '0.0.0.0', '::1',
  '10.', '172.16.', '172.17.', '172.18.', '172.19.',
  '172.20.', '172.21.', '172.22.', '172.23.', '172.24.',
  '172.25.', '172.26.', '172.27.', '172.28.', '172.29.',
  '172.30.', '172.31.', '192.168.',
  '169.254.', '100.', // CGNAT range — block for safety
];

function isBlockedHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return BLOCKED_HOSTNAMES.some(blocked => lower === blocked || lower.startsWith(blocked));
}

function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    if (isBlockedHost(u.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const limit = await rateLimit(request, { maxRequests: 15, windowMs: 60000 });
  if (!limit.success) return rateLimitResponse(limit.limit, limit.remaining, limit.reset);

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const canUse = await usageService.canUseAI(user.id);
    if (!canUse) {
      return NextResponse.json(
        { error: 'AI usage limit exceeded', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const url = typeof body?.url === 'string' ? body.url.trim() : '';

    if (!url) {
      return NextResponse.json(
        { error: 'url is required' },
        { status: 400 }
      );
    }

    if (!isValidUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KanbiBot/1.0)' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT)
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch page: ${res.status}` },
        { status: 502 }
      );
    }

    const contentLength = res.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Response too large' },
        { status: 413 }
      );
    }

    const html = await res.text();
    if (html.length > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Response too large' },
        { status: 413 }
      );
    }
    const $ = cheerio.load(html);

    $('script, style, nav, footer, [role="navigation"], [role="banner"], iframe, noscript, .ad, .ads').remove();

    const title = ($('title').text() || '').trim() || $('meta[property="og:title"]').attr('content') || '';
    const desc = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
    const parts: string[] = [];
    if (title) parts.push(title);
    if (desc) parts.push(desc);
    $('h1, h2, h3, h4, h5, h6').each((i: number, el: unknown) => {
      const t = ($(el).text() || '').trim();
      if (t) parts.push(t);
    });
    $('p, li').each((i: number, el: unknown) => {
      const t = ($(el).text() || '').trim();
      if (t) parts.push(t);
    });

    let text = parts.join('\n').replace(/\s+/g, ' ').trim();
    if (text.length > MAX_TEXT_LENGTH) text = text.slice(0, MAX_TEXT_LENGTH);

    if (!text) {
      return NextResponse.json(
        { error: 'No readable content found on this page' },
        { status: 422 }
      );
    }

    const tasks = await AIService.parseTasksFromWebPage(text);

    await usageService.incrementAIUsage(user.id).catch((err) => {
      logger.error('Failed to track AI usage:', { error: err });
    });

    return NextResponse.json({
      tasks,
      pageTitle: title || undefined,
    });
  } catch (error: unknown) {
    logger.error('Parse URL error:', { error });
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'URL took too long to load. Try a different URL.' },
        { status: 408 }
      );
    }
    const message = error instanceof Error ? error.message : 'Failed to extract tasks from URL';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
