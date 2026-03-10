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
    const limitParam = searchParams.get('limit');
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'desc';
    const favorite = searchParams.get('favorite');

    // Validate limit parameter
    let limit: number | undefined;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        return NextResponse.json(
          { error: 'Invalid limit parameter. Must be a number between 1 and 100.' },
          { status: 400 }
        );
      }
      limit = parsedLimit;
    }

    // Validate sort parameter
    const validSortFields = ['created_at', 'updated_at', 'title'];
    if (!validSortFields.includes(sort)) {
      return NextResponse.json(
        { error: 'Invalid sort parameter. Must be one of: created_at, updated_at, title' },
        { status: 400 }
      );
    }

    // Validate order parameter
    if (order !== 'asc' && order !== 'desc') {
      return NextResponse.json(
        { error: 'Invalid order parameter. Must be either "asc" or "desc"' },
        { status: 400 }
      );
    }

    // Build the query
    let query = supabase
      .from('saved_generations')
      .select('*')
      .eq('user_id', user.id);

    // Apply search filter with sanitization
    if (search) {
      const safeSearch = search.replace(/[^a-zA-Z0-9\s\-_]/g, '').trim().slice(0, 100);
      if (safeSearch.length > 0) {
        query = query.or(`title.ilike.%${safeSearch}%,input_text.ilike.%${safeSearch}%,output_text.ilike.%${safeSearch}%`);
      }
    }

    // Apply favorite filter
    if (favorite === 'true') {
      query = query.eq('is_favorite', true);
    } else if (favorite === 'false') {
      query = query.eq('is_favorite', false);
    }

    // Apply sorting
    query = query.order(sort, { ascending: order === 'asc' });

    // Apply limit if specified
    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Fetch saved boards error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch saved boards' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Saved API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}