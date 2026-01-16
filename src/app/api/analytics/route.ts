import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { AnalyticsData } from '@/lib/dashboard-types';

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

    if (!userId) {
      // Return empty data for unauthenticated users
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

    // Get last 30 days of data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const { data: generations, error } = await supabase
      .from('saved_generations')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

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

    // Convert to array format
    const result: AnalyticsData = Array.from(dateMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    return NextResponse.json<AnalyticsData>(result);
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
