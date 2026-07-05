import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

function createRatelimit(maxRequests: number, windowMs: number) {
  if (UPSTASH_URL && UPSTASH_TOKEN) {
    const redis = new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN });
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(maxRequests, windowMs < 60000 ? `${windowMs / 1000}s` : `${windowMs / 60000}m`),
      prefix: 'kanbi:rl',
    });
  }
  return null;
}

const localMap = new Map<string, { count: number; resetTime: number }>();

export function clearRateLimitMap() {
  localMap.clear();
}

export async function rateLimit(
  req: NextRequest,
  options: { maxRequests: number; windowMs: number } = { maxRequests: 20, windowMs: 60000 }
): Promise<{ success: boolean; remaining: number; limit: number; reset: number }> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'anonymous';

  const identifier = `${ip}:${req.nextUrl.pathname}`;
  const rl = createRatelimit(options.maxRequests, options.windowMs);

  if (rl) {
    const res = await rl.limit(identifier);
    return { success: res.success, remaining: res.remaining, limit: res.limit, reset: typeof res.reset === 'number' ? res.reset : Date.now() + options.windowMs };
  }

  const now = Date.now();
  const record = localMap.get(identifier);
  if (!record || now > record.resetTime) {
    const resetTime = now + options.windowMs;
    localMap.set(identifier, { count: 1, resetTime });
    return { success: true, remaining: options.maxRequests - 1, limit: options.maxRequests, reset: resetTime };
  }
  if (record.count >= options.maxRequests) {
    return { success: false, remaining: 0, limit: options.maxRequests, reset: record.resetTime };
  }
  record.count++;
  return { success: true, remaining: options.maxRequests - record.count, limit: options.maxRequests, reset: record.resetTime };
}

export function rateLimitResponse(limit: number = 20, remaining: number = 0, reset: number = Date.now() + 60000) {
  return NextResponse.json(
    { error: 'Too many requests. Please wait a minute and try again.' },
    {
      status: 429,
      headers: {
        'Retry-After': '60',
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': Math.floor(reset / 1000).toString(),
      },
    }
  );
}

export function addRateLimitHeaders(response: NextResponse, limit: number, remaining: number, reset: number): NextResponse {
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', Math.floor(reset / 1000).toString());
  return response;
}
