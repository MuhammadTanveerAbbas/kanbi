import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limiter';

export async function GET(request: NextRequest) {
  const limit = rateLimit(request, { maxRequests: 30, windowMs: 60000 });
  if (!limit.success) return rateLimitResponse();

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

    // Sanitize search input to prevent SQL injection
    if (search) {
      const safeSearch = search.replace(/[^a-zA-Z0-9\s\-_]/g, '').trim().slice(0, 100);
      if (safeSearch.length > 0) {
        query = query.or(`title.ilike.%${safeSearch}%,input_text.ilike.%${safeSearch}%,output_text.ilike.%${safeSearch}%`);
      }
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
