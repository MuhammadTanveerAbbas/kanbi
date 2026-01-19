import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { usageService } from '@/lib/services/usage-service';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use usage service to track board usage
    await usageService.incrementBoardUsage(user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track board usage error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
