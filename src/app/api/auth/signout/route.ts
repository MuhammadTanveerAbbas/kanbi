import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, rateLimitResponse, addRateLimitHeaders } from '@/lib/rate-limiter'

export async function POST(request: NextRequest) {
  const limitResult = await rateLimit(request, { maxRequests: 10, windowMs: 60000 });
  if (!limitResult.success) return rateLimitResponse(limitResult.limit, limitResult.remaining, limitResult.reset);

  const supabase = await createClient()
  await supabase.auth.signOut()
  const response = NextResponse.json({ success: true })
  return addRateLimitHeaders(response, limitResult.limit, limitResult.remaining, limitResult.reset);
}
