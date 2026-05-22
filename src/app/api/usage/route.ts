import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logging/logger';
import { UsageStats } from '@/lib/dashboard-types';
import { usageService } from '@/lib/services/usage-service';
import { cacheManager, CACHE_KEYS, CACHE_TTL } from '@/lib/cache/cache-manager';
import { rateLimit, rateLimitResponse, addRateLimitHeaders } from '@/lib/rate-limiter';
import { USAGE_LIMITS } from '@/lib/constants';

export async function GET(request: NextRequest) {
  const limitResult = await rateLimit(request, { maxRequests: 30, windowMs: 60000 });
  if (!limitResult.success) return rateLimitResponse(limitResult.limit, limitResult.remaining, limitResult.reset);
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || null;

    if (!userId) {
      const limits = await usageService.getUserLimits('anonymous');
      return NextResponse.json<UsageStats>({
        totalGenerations: 0, todayCount: 0, todayLimit: limits.dailyAILimit,
        monthCount: 0, monthLimit: limits.monthlyAILimit,
        boardsUsedToday: 0, boardsUsedMonth: 0, boardsTodayLimit: limits.dailyBoardLimit,
        boardsMonthLimit: limits.monthlyBoardLimit,
        aiUsedToday: 0, aiUsedMonth: 0, aiTodayLimit: limits.dailyAILimit,
        aiMonthLimit: limits.monthlyAILimit, plan: 'free',
      });
    }

    const cacheKey = CACHE_KEYS.USAGE(userId);
    const searchParams = request.nextUrl.searchParams;
    const forceRefresh = !!searchParams.get('t');

    if (!forceRefresh) {
      const cached = cacheManager.get<UsageStats>(cacheKey);
      if (cached) return NextResponse.json<UsageStats>(cached);
    }

    const [usage, limits] = await Promise.all([
      usageService.getUserUsage(userId, forceRefresh),
      usageService.getUserLimits(userId),
    ]);

    const { count: totalCount } = await supabase
      .from('saved_generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const response: UsageStats = {
      totalGenerations: totalCount || 0,
      todayCount: usage.aiUsedToday, todayLimit: limits.dailyAILimit,
      monthCount: usage.aiUsedMonth, monthLimit: limits.monthlyAILimit,
      boardsUsedToday: usage.boardsUsedToday, boardsUsedMonth: usage.boardsUsedMonth,
      boardsTodayLimit: limits.dailyBoardLimit, boardsMonthLimit: limits.monthlyBoardLimit,
      aiUsedToday: usage.aiUsedToday, aiUsedMonth: usage.aiUsedMonth,
      aiTodayLimit: limits.dailyAILimit, aiMonthLimit: limits.monthlyAILimit,
      plan: limits.plan,
    };

    cacheManager.set(cacheKey, response, CACHE_TTL.USAGE);
    const res = NextResponse.json<UsageStats>(response);
    return addRateLimitHeaders(res, limitResult.limit, limitResult.remaining, limitResult.reset);
  } catch (error) {
    logger.error('Usage stats error:', { error });
    return NextResponse.json<UsageStats>(
      { totalGenerations: 0, todayCount: 0, todayLimit: USAGE_LIMITS.FREE.DAILY_AI,
        monthCount: 0, monthLimit: USAGE_LIMITS.FREE.MONTHLY_AI,
        boardsUsedToday: 0, boardsUsedMonth: 0, boardsTodayLimit: USAGE_LIMITS.FREE.DAILY_BOARDS,
        boardsMonthLimit: USAGE_LIMITS.FREE.MONTHLY_BOARDS,
        aiUsedToday: 0, aiUsedMonth: 0, aiTodayLimit: USAGE_LIMITS.FREE.DAILY_AI,
        aiMonthLimit: USAGE_LIMITS.FREE.MONTHLY_AI, plan: 'free' },
      { status: 200 }
    );
  }
}
