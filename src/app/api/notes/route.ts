import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limiter';
import { AppError, AuthError, DatabaseError } from '@/lib/errors/AppError';
import { logger } from '@/lib/logging/logger';
import { NOTE_CONTENT_MAX, NOTE_TITLE_MAX } from '@/lib/constants';
import { fail, invalid, parseError, readJson } from '@/lib/server/api-response';

const NOTE_COLUMNS = 'id, user_id, title, content, folder, is_favorite, created_at, updated_at';

const createNoteSchema = z.object({
  title: z.string().trim().min(1).max(NOTE_TITLE_MAX),
  content: z.string().max(NOTE_CONTENT_MAX).optional(),
  folder: z.string().trim().max(120).nullable().optional(),
  is_favorite: z.boolean().optional(),
});

const updateNoteSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(NOTE_TITLE_MAX).optional(),
  content: z.string().max(NOTE_CONTENT_MAX).optional(),
  folder: z.string().trim().max(120).nullable().optional(),
  is_favorite: z.boolean().optional(),
});

const idSchema = z.object({ id: z.string().min(1) });

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return fail(new AuthError());

    const { data, error } = await supabase
      .from('notes')
      .select(NOTE_COLUMNS)
      .eq('user_id', user.id)
      .order('is_favorite', { ascending: false })
      .order('updated_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch notes', { userId: user.id, error: error.message });
      throw new DatabaseError('Failed to fetch notes');
    }

    return NextResponse.json({ ok: true, data: data ?? [] });
  } catch (error) {
    logger.error('Get notes failed', { error });
    return fail(error instanceof AppError ? error : new DatabaseError('Failed to fetch notes'));
  }
}

export async function POST(request: NextRequest) {
  const limit = await rateLimit(request, { maxRequests: 60, windowMs: 60_000 });
  if (!limit.success) return rateLimitResponse(limit.limit, limit.remaining, limit.reset);

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return fail(new AuthError());

    const body = await readJson(request);
    if (body === null) return invalid('Expected a JSON body');
    const parsed = createNoteSchema.safeParse(body);
    if (!parsed.success) return invalid(parseError(parsed.error));

    // The body never supplies user_id. A forged value is discarded here.
    const row = {
      title: parsed.data.title,
      content: parsed.data.content ?? '',
      folder: parsed.data.folder ?? null,
      is_favorite: parsed.data.is_favorite ?? false,
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from('notes')
      .insert(row)
      .select(NOTE_COLUMNS)
      .single();

    if (error || !data) {
      logger.error('Failed to create note', { userId: user.id, error: error?.message });
      throw new DatabaseError('Failed to create note');
    }

    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    logger.error('Create note failed', { error });
    return fail(error instanceof AppError ? error : new DatabaseError('Failed to create note'));
  }
}

export async function PATCH(request: NextRequest) {
  const limit = await rateLimit(request, { maxRequests: 60, windowMs: 60_000 });
  if (!limit.success) return rateLimitResponse(limit.limit, limit.remaining, limit.reset);

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return fail(new AuthError());

    const body = await readJson(request);
    if (body === null) return invalid('Expected a JSON body');
    const parsed = updateNoteSchema.safeParse(body);
    if (!parsed.success) return invalid(parseError(parsed.error));

    const patch: Record<string, unknown> = {};
    for (const key of ['title', 'content', 'folder', 'is_favorite'] as const) {
      if (parsed.data[key] !== undefined) patch[key] = parsed.data[key];
    }
    if (Object.keys(patch).length === 0) return invalid('Nothing to update');

    const { data, error } = await supabase
      .from('notes')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', parsed.data.id)
      .eq('user_id', user.id)
      .select(NOTE_COLUMNS)
      .single();

    if (error || !data) {
      logger.error('Failed to update note', { userId: user.id, error: error?.message });
      throw new DatabaseError('Failed to update note');
    }

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    logger.error('Update note failed', { error });
    return fail(error instanceof AppError ? error : new DatabaseError('Failed to update note'));
  }
}

export async function DELETE(request: NextRequest) {
  const limit = await rateLimit(request, { maxRequests: 60, windowMs: 60_000 });
  if (!limit.success) return rateLimitResponse(limit.limit, limit.remaining, limit.reset);

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return fail(new AuthError());

    const parsed = idSchema.safeParse({ id: request.nextUrl.searchParams.get('id') });
    if (!parsed.success) return invalid(parseError(parsed.error));

    // Remove the image objects first. The note row is the only place the paths
    // are recorded, so deleting it first would orphan files in the bucket.
    const { data: images } = await supabase
      .from('note_images')
      .select('storage_path')
      .eq('note_id', parsed.data.id)
      .eq('user_id', user.id);

    const paths = (images ?? [])
      .map((row) => (typeof row.storage_path === 'string' ? row.storage_path : ''))
      .filter((path) => path.length > 0);

    if (paths.length > 0) {
      const { error: storageError } = await supabase.storage.from('files').remove(paths);
      if (storageError) {
        logger.error('Failed to remove note images', { userId: user.id, error: storageError.message });
      }
    }

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', parsed.data.id)
      .eq('user_id', user.id);

    if (error) {
      logger.error('Failed to delete note', { userId: user.id, error: error.message });
      throw new DatabaseError('Failed to delete note');
    }

    return NextResponse.json({ ok: true, data: { id: parsed.data.id } });
  } catch (error) {
    logger.error('Delete note failed', { error });
    return fail(error instanceof AppError ? error : new DatabaseError('Failed to delete note'));
  }
}
