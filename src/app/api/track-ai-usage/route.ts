import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { usageService } from '@/lib/services/usage-service';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user can use AI
    const canUse = await usageService.canUseAI(user.id);
    if (!canUse) {
      return NextResponse.json(
        {
          error: 'AI usage limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED'
        },
        { status: 429 }
      );
    }

    // Increment AI usage
    await usageService.incrementAIUsage(user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track AI usage error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
