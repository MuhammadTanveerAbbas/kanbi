import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Alias for /api/saved - redirects to the main saved boards endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '5';

    const { data, error } = await supabase
      .from('saved_generations')
      .select('id, title, created_at, is_favorite, category, icon')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit, 10));

    if (error) {
      console.error('Fetch saved generations error:', error);
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Saved generations API error:', error);
    return NextResponse.json([], { status: 200 });
  }
}
