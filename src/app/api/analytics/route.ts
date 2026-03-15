import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { AnalyticsData } from '@/lib/dashboard-types';
import { cacheManager, CACHE_KEYS, CACHE_TTL } from '@/lib/cache/cache-manager';
import { rateLimit, rateLimitResponse, addRateLimitHeaders } from '@/lib/rate-limiter';

export async function GET(request: NextRequest) {
  const limitResult = await rateLimit(request, { maxRequests: 30, windowMs: 60000 });
  if (!limitResult.success) return rateLimitResponse(limitResult.limit, limitResult.remaining, limitResult.reset);
  try {
    const supabase = await createServerClient();

    // Get user from auth header or session
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id || null;
    }

    if (!userId) {
      const last30Days: AnalyticsData = [];
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        last30Days.push({
          date: date.toISOString().split('T')[0],
          count: 0,
        });
      }
      return NextResponse.json<AnalyticsData>(last30Days);
    }

    // Check cache
    const cacheKey = CACHE_KEYS.ANALYTICS(userId);
    const cached = cacheManager.get<AnalyticsData>(cacheKey);
    if (cached) return NextResponse.json<AnalyticsData>(cached);

    // Get last 30 days of data
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
      console.error('Analytics query error:', error);
    }

    // Group by date
    const dateMap = new Map<string, number>();
    const today = new Date();

    // Initialize all 30 days with 0
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dateMap.set(dateStr, 0);
    }

    // Count generations per day
    if (generations) {
      generations.forEach((gen) => {
        const dateStr = gen.created_at.split('T')[0];
        const current = dateMap.get(dateStr) || 0;
        dateMap.set(dateStr, current + 1);
      });
    }

    const result: AnalyticsData = Array.from(dateMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    cacheManager.set(cacheKey, result, CACHE_TTL.ANALYTICS);
    const res = NextResponse.json<AnalyticsData>(result);
    return addRateLimitHeaders(res, limitResult.limit, limitResult.remaining, limitResult.reset);
  } catch (error) {
    console.error('Analytics error:', error);
    // Return empty data on error
    const last30Days: AnalyticsData = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      last30Days.push({
        date: date.toISOString().split('T')[0],
        count: 0,
      });
    }
    return NextResponse.json<AnalyticsData>(last30Days);
  }
}
