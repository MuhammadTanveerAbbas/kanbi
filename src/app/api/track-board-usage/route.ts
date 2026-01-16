import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Call the increment_board_usage function
    const { error } = await supabase.rpc('increment_board_usage', {
      p_user_id: user.id,
      p_date: today,
    });

    if (error) {
      console.error('Error tracking board usage:', error);
      return NextResponse.json({ error: 'Failed to track usage' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track board usage error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
