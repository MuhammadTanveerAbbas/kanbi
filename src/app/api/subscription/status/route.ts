import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SubscriptionStatus } from '@/lib/dashboard-types';
import { rateLimit, rateLimitResponse, addRateLimitHeaders } from '@/lib/rate-limiter';

export async function GET(request: NextRequest) {
  const limitResult = await rateLimit(request, { maxRequests: 30, windowMs: 60000 });
  if (!limitResult.success) return rateLimitResponse(limitResult.limit, limitResult.remaining, limitResult.reset);
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || null;

    if (!userId) {
      const response = NextResponse.json<SubscriptionStatus>({
        plan: 'free',
        status: 'active',
      });
      return addRateLimitHeaders(response, limitResult.limit, limitResult.remaining, limitResult.reset);
    }

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
      const response = NextResponse.json<SubscriptionStatus>({
        plan: 'premium',
        status: subscription.status || 'active',
        currentPeriodEnd: subscription.current_period_end,
      });
      return addRateLimitHeaders(response, limitResult.limit, limitResult.remaining, limitResult.reset);
    }

    const response = NextResponse.json<SubscriptionStatus>({
      plan: 'free',
      status: 'active',
    });
    return addRateLimitHeaders(response, limitResult.limit, limitResult.remaining, limitResult.reset);
  } catch (error) {
    console.error('Subscription status error:', error);
    return NextResponse.json<SubscriptionStatus>(
      { plan: 'free', status: 'active' },
      { status: 200 }
    );
  }
}
