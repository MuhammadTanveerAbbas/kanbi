import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { z } from 'zod';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limiter';

const UpdateBoardSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().max(50000).optional(),
  is_favorite: z.boolean().optional(),
  category: z.enum(['other', 'meeting', 'project', 'daily', 'sprint', 'quick']).optional(),
  icon: z.string().max(50).optional(),
  input_text: z.string().max(50000).optional(),
  output_text: z.string().max(50000).optional(),
});

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limit = rateLimit(request, { maxRequests: 30, windowMs: 60000 });
  if (!limit.success) return rateLimitResponse();

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

    const { id } = await params;

    const { error } = await supabase
      .from('saved_generations')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete generation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete generation error:', error);
    return NextResponse.json(
      { error: 'Failed to delete generation' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limit = rateLimit(request, { maxRequests: 30, windowMs: 60000 });
  if (!limit.success) return rateLimitResponse();

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

    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validation = UpdateBoardSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid fields', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('saved_generations')
      .update(body)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json(
        { error: 'Failed to update generation' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Update generation error:', error);
    return NextResponse.json(
      { error: 'Failed to update generation' },
      { status: 500 }
    );
  }
}
