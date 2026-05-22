import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logging/logger';
import { AnalyticsData } from '@/lib/dashboard-types';
import { cacheManager, CACHE_KEYS, CACHE_TTL } from '@/lib/cache/cache-manager';
import { rateLimit, rateLimitResponse, addRateLimitHeaders } from '@/lib/rate-limiter';

export async function GET(request: NextRequest) {
  const limitResult = await rateLimit(request, { maxRequests: 30, windowMs: 60000 });
  if (!limitResult.success) return rateLimitResponse(limitResult.limit, limitResult.remaining, limitResult.reset);
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || null;

    if (!userId) {
      const empty: AnalyticsData = [];
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0] ?? '';
        empty.push({ date: dateStr, count: 0 });
      }
      return NextResponse.json<AnalyticsData>(empty);
    }

    const cacheKey = CACHE_KEYS.ANALYTICS(userId);
    const cached = cacheManager.get<AnalyticsData>(cacheKey);
    if (cached) return NextResponse.json<AnalyticsData>(cached);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const { data: generations, error } = await supabase
      .from('saved_generations')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true })
      .limit(1000);

    if (error) {
      logger.error('Analytics query error:', { message: error.message });
    }

    const dateMap = new Map<string, number>();
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0] ?? '';
      dateMap.set(dateKey, 0);
    }

    if (generations) {
      generations.forEach((gen) => {
        const dateStr = gen.created_at.split('T')[0] ?? '';
        dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
      });
    }

    const result: AnalyticsData = Array.from(dateMap.entries()).map(([date, count]) => ({ date, count }));

    cacheManager.set(cacheKey, result, CACHE_TTL.ANALYTICS);
    const res = NextResponse.json<AnalyticsData>(result);
    return addRateLimitHeaders(res, limitResult.limit, limitResult.remaining, limitResult.reset);
  } catch (error) {
    logger.error('Analytics error:', { error });
    const empty: AnalyticsData = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      empty.push({ date: date.toISOString().split('T')[0] ?? '', count: 0 });
    }
    return NextResponse.json<AnalyticsData>(empty);
  }
}
