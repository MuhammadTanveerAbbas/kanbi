import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UsageStats } from '@/lib/dashboard-types';
import { usageService } from '@/lib/services/usage-service';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

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
      // Return default stats for unauthenticated users
      const limits = await usageService.getUserLimits('anonymous');
      return NextResponse.json<UsageStats>({
        totalGenerations: 0,
        todayCount: 0,
        todayLimit: limits.dailyAILimit,
        monthCount: 0,
        monthLimit: limits.monthlyAILimit,
        boardsUsedToday: 0,
        boardsUsedMonth: 0,
        boardsTodayLimit: limits.dailyBoardLimit,
        boardsMonthLimit: limits.monthlyBoardLimit,
        aiUsedToday: 0,
        aiUsedMonth: 0,
        aiTodayLimit: limits.dailyAILimit,
        aiMonthLimit: limits.monthlyAILimit,
        plan: 'free',
      });
    }

    // Check for cache-busting parameter and invalidate cache if needed
    const searchParams = request.nextUrl.searchParams;
    const forceRefresh = !!searchParams.get('t');

    // Use usage service to get stats and limits (with force refresh if requested)
    const [usage, limits] = await Promise.all([
      usageService.getUserUsage(userId, forceRefresh),
      usageService.getUserLimits(userId),
    ]);

    // Get total generations count for backward compatibility
    const { count: totalCount } = await supabase
      .from('saved_generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const response: UsageStats = {
      totalGenerations: totalCount || 0,
      todayCount: usage.aiUsedToday, // AI usage today
      todayLimit: limits.dailyAILimit,
      monthCount: usage.aiUsedMonth, // AI usage this month
      monthLimit: limits.monthlyAILimit,
      boardsUsedToday: usage.boardsUsedToday,
      boardsUsedMonth: usage.boardsUsedMonth,
      boardsTodayLimit: limits.dailyBoardLimit,
      boardsMonthLimit: limits.monthlyBoardLimit,
      aiUsedToday: usage.aiUsedToday,
      aiUsedMonth: usage.aiUsedMonth,
      aiTodayLimit: limits.dailyAILimit,
      aiMonthLimit: limits.monthlyAILimit,
      plan: limits.plan,
    };

    console.log('Usage API response:', JSON.stringify(response, null, 2));
    return NextResponse.json<UsageStats>(response);
  } catch (error) {
    console.error('Usage stats error:', error);
    // Return default stats on error
    return NextResponse.json<UsageStats>(
      {
        totalGenerations: 0,
        todayCount: 0,
        todayLimit: 10,
        monthCount: 0,
        monthLimit: 300,
        boardsUsedToday: 0,
        boardsUsedMonth: 0,
        boardsTodayLimit: 10,
        boardsMonthLimit: 300,
        aiUsedToday: 0,
        aiUsedMonth: 0,
        aiTodayLimit: 10,
        aiMonthLimit: 300,
        plan: 'free',
      },
      { status: 200 }
    );
  }
}
