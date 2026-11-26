import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limiter';
import { AppError, AuthError, DatabaseError, ValidationError } from '@/lib/errors/AppError';
import { logger } from '@/lib/logging/logger';
import { TODO_TITLE_MAX } from '@/lib/constants';

const LIST_COLUMNS = 'id, user_id, name, color, created_at, updated_at';
const DEFAULT_COLOR = '#6b7280';

const createListSchema = z.object({
  name: z.string().trim().min(1).max(TODO_TITLE_MAX),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

const updateListSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(TODO_TITLE_MAX).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
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
      .from('todo_lists')
      .select(LIST_COLUMNS)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Failed to fetch todo lists', { userId: user.id, error: error.message });
      throw new DatabaseError('Failed to fetch todo lists');
    }

    return NextResponse.json({ ok: true, data: data ?? [] });
  } catch (error) {
    logger.error('Get todo lists failed', { error });
    return fail(error instanceof AppError ? error : new DatabaseError('Failed to fetch todo lists'));
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
    const parsed = createListSchema.safeParse(body);
    if (!parsed.success) return invalid(parseError(parsed.error));

    const row = {
      name: parsed.data.name,
      color: parsed.data.color ?? DEFAULT_COLOR,
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from('todo_lists')
      .insert(row)
      .select(LIST_COLUMNS)
      .single();

    if (error || !data) {
      logger.error('Failed to create todo list', { userId: user.id, error: error?.message });
      throw new DatabaseError('Failed to create todo list');
    }

    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    logger.error('Create todo list failed', { error });
    return fail(error instanceof AppError ? error : new DatabaseError('Failed to create todo list'));
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
    const parsed = updateListSchema.safeParse(body);
    if (!parsed.success) return invalid(parseError(parsed.error));

    const patch: Record<string, unknown> = {};
    for (const key of ['name', 'color'] as const) {
      if (parsed.data[key] !== undefined) patch[key] = parsed.data[key];
    }

    const { data, error } = await supabase
      .from('todo_lists')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', parsed.data.id)
      .eq('user_id', user.id)
      .select(LIST_COLUMNS)
      .single();

    if (error || !data) {
      logger.error('Failed to update todo list', { userId: user.id, error: error?.message });
      throw new DatabaseError('Failed to update todo list');
    }

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    logger.error('Update todo list failed', { error });
    return fail(error instanceof AppError ? error : new DatabaseError('Failed to update todo list'));
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
      .from('todo_lists')
      .delete()
      .eq('id', parsed.data.id)
      .eq('user_id', user.id);

    if (error) {
      logger.error('Failed to delete todo list', { userId: user.id, error: error.message });
      throw new DatabaseError('Failed to delete todo list');
    }

    return NextResponse.json({ ok: true, data: { id: parsed.data.id } });
  } catch (error) {
    logger.error('Delete todo list failed', { error });
    return fail(error instanceof AppError ? error : new DatabaseError('Failed to delete todo list'));
  }
}
