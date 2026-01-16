import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { input_text, output_text, tone, length, format, title } = body;

    if (!input_text || !output_text) {
      return NextResponse.json(
        { error: 'Input and output text are required' },
        { status: 400 }
      );
    }

    // Generate title from input if not provided
    const generatedTitle = title || input_text.substring(0, 50) + (input_text.length > 50 ? '...' : '');

    const { data, error } = await supabase
      .from('saved_generations')
      .insert({
        user_id: userId,
        input_text,
        output_text,
        tone: tone || null,
        length: length || null,
        format: format || null,
        title: generatedTitle,
        is_favorite: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Save error:', error);
      return NextResponse.json(
        { error: 'Failed to save generation' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Save generation error:', error);
    return NextResponse.json(
      { error: 'Failed to save generation' },
      { status: 500 }
    );
  }
}
