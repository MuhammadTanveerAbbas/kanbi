import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

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
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'desc';
    const favorite = searchParams.get('favorite');

    let query = supabase
      .from('saved_generations')
      .select('*')
      .eq('user_id', userId);

    if (search) {
      query = query.or(`title.ilike.%${search}%,input_text.ilike.%${search}%,output_text.ilike.%${search}%`);
    }

    if (favorite === 'true') {
      query = query.eq('is_favorite', true);
    }

    query = query.order(sort, { ascending: order === 'asc' });

    const { data, error } = await query;

    if (error) {
      console.error('Fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch saved generations' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('List saved generations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved generations' },
      { status: 500 }
    );
  }
}
