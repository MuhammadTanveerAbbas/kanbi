import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

export function clearRateLimitMap() {
  rateLimitMap.clear();
}

export async function rateLimit(
  req: NextRequest,
  options: { maxRequests: number; windowMs: number } = { maxRequests: 20, windowMs: 60000 }
): Promise<{ success: boolean; remaining: number; limit: number; reset: number }> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || req.headers.get('x-real-ip') 
    || 'anonymous';
  
  // Try to get userId from session
  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id || null;
  } catch {
    // Ignore auth errors for rate limiting
  }
  
  const now = Date.now();
  const key = userId ? `user:${userId}:${req.nextUrl.pathname}` : `ip:${ip}:${req.nextUrl.pathname}`;
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    const resetTime = now + options.windowMs;
    rateLimitMap.set(key, { count: 1, resetTime });
    return { 
      success: true, 
      remaining: options.maxRequests - 1,
      limit: options.maxRequests,
      reset: resetTime
    };
  }

  if (record.count >= options.maxRequests) {
    return { 
      success: false, 
      remaining: 0,
      limit: options.maxRequests,
      reset: record.resetTime
    };
  }

  record.count++;
  return { 
    success: true, 
    remaining: options.maxRequests - record.count,
    limit: options.maxRequests,
    reset: record.resetTime
  };
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
      }
    }
  );
}

export function addRateLimitHeaders(response: NextResponse, limit: number, remaining: number, reset: number): NextResponse {
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', Math.floor(reset / 1000).toString());
  return response;
}
