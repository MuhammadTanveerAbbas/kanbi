import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, rateLimitResponse, addRateLimitHeaders } from '@/lib/rate-limiter';
import { AuthError, DatabaseError } from '@/lib/errors/AppError';
import { logger } from '@/lib/logging/logger';
import { z } from 'zod';
import { sanitizeInput } from '@/lib/security';
import { getOrCreateDefaultBoard } from '@/lib/services/default-board';

const createTaskSchema = z.object({
  title: z.string().min(1).max(200).transform(s => sanitizeInput(s, 200)),
  priority: z.enum(['urgent', 'high', 'medium', 'low']).default('medium'),
  status: z.enum(['todo', 'wip', 'done']).default('todo'),
  label: z.string().max(50).default('General').transform(s => sanitizeInput(s, 50)),
  estimate: z.string().max(20).nullable().optional(),
  due_date: z.string().nullable().optional(),
});

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const err = new AuthError();
      return NextResponse.json(err.toJSON(), { status: 401 });
    }

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('id, title, priority, label, status, estimate, due_date, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      logger.error('Failed to fetch tasks', { userId: user.id, error: error.message });
      return NextResponse.json({ tasks: [] });
    }

    return NextResponse.json({ tasks: tasks || [] });
  } catch (error: any) {
    logger.error('Get tasks error', { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const limitResult = await rateLimit(request, { maxRequests: 30, windowMs: 60000 });
  if (!limitResult.success) return rateLimitResponse(limitResult.limit, limitResult.remaining, limitResult.reset);

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const err = new AuthError();
      return NextResponse.json(err.toJSON(), { status: 401 });
    }

    const body = await request.json();
    const parsed = createTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const boardId = await getOrCreateDefaultBoard(supabase, user.id);

    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...parsed.data, board_id: boardId, user_id: user.id })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create task', { userId: user.id, error: error.message });
      const dbErr = new DatabaseError('Failed to create task');
      return NextResponse.json(dbErr.toJSON(), { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    logger.error('Create task error', { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
