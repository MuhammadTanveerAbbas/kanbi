import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'desc';
    const favorite = searchParams.get('favorite');

    let query = supabase
      .from('saved_generations')
      .select('*')
      .eq('user_id', user.id);

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
