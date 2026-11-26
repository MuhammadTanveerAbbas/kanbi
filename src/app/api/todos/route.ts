import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limiter';
import { AppError, AuthError, DatabaseError, ValidationError } from '@/lib/errors/AppError';
import { logger } from '@/lib/logging/logger';
import { TODO_TITLE_MAX } from '@/lib/constants';

const TODO_COLUMNS = 'id, user_id, list_id, title, note, done, priority, due_date, position, created_at, updated_at';
const PRIORITIES = ['urgent', 'high', 'medium', 'low'] as const;

const createTodoSchema = z.object({
  title: z.string().trim().min(1).max(TODO_TITLE_MAX),
  list_id: z.string().min(1),
  note: z.string().nullable().optional(),
  done: z.boolean().optional(),
  priority: z.enum(PRIORITIES).optional(),
  due_date: z.string().nullable().optional(),
  position: z.number().int().optional(),
});

const updateTodoSchema = z.object({
  id: z.string().min(1),
  done: z.boolean().optional(),
  title: z.string().trim().min(1).max(TODO_TITLE_MAX).optional(),
  priority: z.enum(PRIORITIES).optional(),
  due_date: z.string().nullable().optional(),
  position: z.number().int().optional(),
  list_id: z.string().min(1).optional(),
});

const idSchema = z.object({ id: z.string().min(1) });

/** One controlled error shape for every failure path in this route. */
function fail(error: AppError) {
  return NextResponse.json(
    {
      ok: false,
      error: { message: error.message, code: error.code },
      code: error.code,
      statusCode: error.statusCode,
      errorId: error.errorId,
    },
    { status: error.statusCode }
  );
}

function invalid(message: string) {
  return fail(new ValidationError(message));
}

function parseError(error: z.ZodError): string {
  return error.errors[0]?.message ?? 'Invalid input';
}

async function readJson(request: NextRequest): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return fail(new AuthError());

    const { data, error } = await supabase
      .from('todos')
      .select(TODO_COLUMNS)
      .eq('user_id', user.id)
      .order('position', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch todos', { userId: user.id, error: error.message });
      throw new DatabaseError('Failed to fetch todos');
    }

    return NextResponse.json({ ok: true, data: data ?? [] });
  } catch (error) {
    logger.error('Get todos failed', { error });
    return fail(error instanceof AppError ? error : new DatabaseError('Failed to fetch todos'));
  }
}

export async function POST(request: NextRequest) {
  const limit = await rateLimit(request, { maxRequests: 120, windowMs: 60_000 });
  if (!limit.success) return rateLimitResponse(limit.limit, limit.remaining, limit.reset);

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return fail(new AuthError());

    const body = await readJson(request);
    if (body === null) return invalid('Expected a JSON body');
    const parsed = createTodoSchema.safeParse(body);
    if (!parsed.success) return invalid(parseError(parsed.error));

    // The body never supplies user_id. The row is built from validated fields
    // plus the session id, so a forged user_id in the request is discarded.
    const row = {
      title: parsed.data.title,
      list_id: parsed.data.list_id,
      note: parsed.data.note ?? null,
      done: parsed.data.done ?? false,
      priority: parsed.data.priority ?? 'medium',
      due_date: parsed.data.due_date ?? null,
      position: parsed.data.position ?? 0,
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from('todos')
      .insert(row)
      .select(TODO_COLUMNS)
      .single();

    if (error || !data) {
      logger.error('Failed to create todo', { userId: user.id, error: error?.message });
      throw new DatabaseError('Failed to create todo');
    }

    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    logger.error('Create todo failed', { error });
    return fail(error instanceof AppError ? error : new DatabaseError('Failed to create todo'));
  }
}

export async function PATCH(request: NextRequest) {
  const limit = await rateLimit(request, { maxRequests: 120, windowMs: 60_000 });
  if (!limit.success) return rateLimitResponse(limit.limit, limit.remaining, limit.reset);

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return fail(new AuthError());

    const body = await readJson(request);
    if (body === null) return invalid('Expected a JSON body');
    const parsed = updateTodoSchema.safeParse(body);
    if (!parsed.success) return invalid(parseError(parsed.error));

    const patch: Record<string, unknown> = {};
    for (const key of ['done', 'title', 'priority', 'due_date', 'position', 'list_id'] as const) {
      if (parsed.data[key] !== undefined) patch[key] = parsed.data[key];
    }

    const { data, error } = await supabase
      .from('todos')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', parsed.data.id)
      .eq('user_id', user.id)
      .select(TODO_COLUMNS)
      .single();

    if (error || !data) {
      logger.error('Failed to update todo', { userId: user.id, error: error?.message });
      throw new DatabaseError('Failed to update todo');
    }

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    logger.error('Update todo failed', { error });
    return fail(error instanceof AppError ? error : new DatabaseError('Failed to update todo'));
  }
}

export async function DELETE(request: NextRequest) {
  const limit = await rateLimit(request, { maxRequests: 120, windowMs: 60_000 });
  if (!limit.success) return rateLimitResponse(limit.limit, limit.remaining, limit.reset);

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return fail(new AuthError());

    const parsed = idSchema.safeParse({ id: request.nextUrl.searchParams.get('id') });
    if (!parsed.success) return invalid(parseError(parsed.error));

    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', parsed.data.id)
      .eq('user_id', user.id);

    if (error) {
      logger.error('Failed to delete todo', { userId: user.id, error: error.message });
      throw new DatabaseError('Failed to delete todo');
    }

    return NextResponse.json({ ok: true, data: { id: parsed.data.id } });
  } catch (error) {
    logger.error('Delete todo failed', { error });
    return fail(error instanceof AppError ? error : new DatabaseError('Failed to delete todo'));
  }
}
