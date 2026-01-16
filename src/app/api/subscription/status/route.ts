import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { SubscriptionStatus } from '@/lib/dashboard-types';

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
      // Try to get from session cookie
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id || null;
    }

    if (!userId) {
      // Return free plan for unauthenticated users
      return NextResponse.json<SubscriptionStatus>({
        plan: 'free',
        status: 'active',
      });
    }

    // Check subscription in database
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Subscription query error:', error);
    }

    if (subscription && subscription.plan === 'premium') {
      return NextResponse.json<SubscriptionStatus>({
        plan: 'premium',
        status: subscription.status || 'active',
        currentPeriodEnd: subscription.current_period_end,
      });
    }

    return NextResponse.json<SubscriptionStatus>({
      plan: 'free',
      status: 'active',
    });
  } catch (error) {
    console.error('Subscription status error:', error);
    return NextResponse.json<SubscriptionStatus>(
      { plan: 'free', status: 'active' },
      { status: 200 }
    );
  }
}
