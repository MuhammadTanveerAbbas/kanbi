import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: integrations } = await supabase
      .from('integrations')
      .select('provider, connected_at')
      .eq('user_id', user.id);

    const connected = (integrations || []).reduce((acc, integration) => {
      acc[integration.provider] = true;
      return acc;
    }, {} as Record<string, boolean>);

    return NextResponse.json({ connected });
  } catch (error) {
    console.error('Integration status error:', error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}
