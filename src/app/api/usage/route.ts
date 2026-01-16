import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { UsageStats } from '@/lib/dashboard-types';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

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

    // Get subscription to determine limits
    let plan: 'free' | 'premium' = 'free';
    if (userId) {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (subscription?.plan === 'premium') {
        plan = 'premium';
      }
    }

    const todayLimit = plan === 'premium' ? 50 : 10;
    const monthLimit = plan === 'premium' ? 1500 : 300;

    if (!userId) {
      // Return default stats for unauthenticated users
      return NextResponse.json<UsageStats>({
        totalGenerations: 0,
        todayCount: 0,
        todayLimit,
        monthCount: 0,
        monthLimit,
        boardsUsedToday: 0,
        boardsUsedMonth: 0,
      });
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get this month's date range
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    // Count generations
    const { count: todayCount } = await supabase
      .from('saved_generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    const { count: monthCount } = await supabase
      .from('saved_generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', monthStart.toISOString())
      .lte('created_at', monthEnd.toISOString());

    const { count: totalCount } = await supabase
      .from('saved_generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get board usage from usage_tracking table
    const { data: usageData } = await supabase
      .from('usage_tracking')
      .select('boards_used_count')
      .eq('user_id', userId)
      .eq('date', today.toISOString().split('T')[0])
      .single();

    const { data: monthUsageData } = await supabase
      .from('usage_tracking')
      .select('boards_used_count')
      .eq('user_id', userId)
      .gte('date', monthStart.toISOString().split('T')[0])
      .lte('date', monthEnd.toISOString().split('T')[0]);

    const boardsUsedToday = usageData?.boards_used_count || 0;
    const boardsUsedMonth = monthUsageData?.reduce((sum, row) => sum + (row.boards_used_count || 0), 0) || 0;

    return NextResponse.json<UsageStats>({
      totalGenerations: totalCount || 0,
      todayCount: todayCount || 0,
      todayLimit,
      monthCount: monthCount || 0,
      monthLimit,
      boardsUsedToday,
      boardsUsedMonth,
    });
  } catch (error) {
    console.error('Usage stats error:', error);
    return NextResponse.json<UsageStats>(
      {
        totalGenerations: 0,
        todayCount: 0,
        todayLimit: 10,
        monthCount: 0,
        monthLimit: 300,
        boardsUsedToday: 0,
        boardsUsedMonth: 0,
      },
      { status: 200 }
    );
  }
}
