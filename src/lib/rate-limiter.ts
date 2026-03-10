import { NextRequest } from 'next/server';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  req: NextRequest,
  options: { maxRequests: number; windowMs: number } = { maxRequests: 20, windowMs: 60000 }
): { success: boolean; remaining: number } {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || req.headers.get('x-real-ip') 
    || 'anonymous';
  
  const now = Date.now();
  const key = `${ip}:${req.nextUrl.pathname}`;
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + options.windowMs });
    return { success: true, remaining: options.maxRequests - 1 };
  }

  if (record.count >= options.maxRequests) {
    return { success: false, remaining: 0 };
  }

  record.count++;
  return { success: true, remaining: options.maxRequests - record.count };
}

export function rateLimitResponse() {
  return Response.json(
    { error: 'Too many requests. Please wait a minute and try again.' },
    { 
      status: 429,
      headers: { 'Retry-After': '60' }
    }
  );
}
