import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limiter';
import { AppError, AuthError, DatabaseError } from '@/lib/errors/AppError';
import { logger } from '@/lib/logging/logger';
import { IMAGE_MAX_BYTES } from '@/lib/constants';
import { imageExtension, validateImage } from '@/lib/server/image-validation';
import { fail, invalid, notFound, parseError, payloadTooLarge } from '@/lib/server/api-response';

const IMAGE_COLUMNS = 'id, user_id, note_id, storage_path, file_name, mime_type, size_bytes, created_at';
const SIGNED_URL_TTL_SECONDS = 60 * 60;

const noteIdSchema = z.object({ noteId: z.string().min(1) });
const idSchema = z.object({ id: z.string().min(1) });

/** A short lived private URL. The bucket stays private, so nothing is public. */
async function signedUrl(supabase: Awaited<ReturnType<typeof createClient>>, path: string) {
  const { data } = await supabase.storage.from('files').createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  return data?.signedUrl ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return fail(new AuthError());

    const noteId = request.nextUrl.searchParams.get('noteId');
    let query = supabase
      .from('note_images')
      .select(IMAGE_COLUMNS)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (noteId) query = query.eq('note_id', noteId);

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to fetch note images', { userId: user.id, error: error.message });
      throw new DatabaseError('Failed to fetch note images');
    }

    const rows = await Promise.all(
      (data ?? []).map(async (row) => ({
        ...row,
        url: typeof row.storage_path === 'string' ? await signedUrl(supabase, row.storage_path) : null,
      }))
    );

    return NextResponse.json({ ok: true, data: rows });
  } catch (error) {
    logger.error('Get note images failed', { error });
    return fail(error instanceof AppError ? error : new DatabaseError('Failed to fetch note images'));
  }
}

export async function POST(request: NextRequest) {
  const limit = await rateLimit(request, { maxRequests: 60, windowMs: 60_000 });
  if (!limit.success) return rateLimitResponse(limit.limit, limit.remaining, limit.reset);

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return fail(new AuthError());

    const form = await request.formData();
    const noteId = form.get('noteId');
    const file = form.get('file');

    if (typeof noteId !== 'string' || !file || typeof file === 'string') {
      return invalid('Expected a note id and a file');
    }

    const parsed = noteIdSchema.safeParse({ noteId });
    if (!parsed.success) return invalid(parseError(parsed.error));

    const validation = validateImage(file);
    if (!validation.ok) {
      if (validation.code === 'IMAGE_TOO_LARGE') {
        return payloadTooLarge(`Images must be ${IMAGE_MAX_BYTES / (1024 * 1024)} MB or smaller`);
      }
      return invalid('Only JPEG, PNG, WebP and GIF images are accepted');
    }
    if (file.size <= 0) return invalid('The file is empty');

    // The first path segment is the owner id, which is what the storage policy
    // checks. The note id groups a note's images, and a random name avoids
    // collisions between two files with the same original name.
    const path = `${user.id}/notes/${parsed.data.noteId}/${crypto.randomUUID()}.${imageExtension(file.type)}`;

    const { error: uploadError } = await supabase.storage
      .from('files')
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      logger.error('Failed to upload note image', { userId: user.id, error: uploadError.message });
      throw new DatabaseError('Failed to upload the image');
    }

    const row = {
      user_id: user.id,
      note_id: parsed.data.noteId,
      storage_path: path,
      file_name: file.name.slice(0, 255),
      mime_type: file.type,
      size_bytes: file.size,
    };

    const { data, error } = await supabase
      .from('note_images')
      .insert(row)
      .select(IMAGE_COLUMNS)
      .single();

    if (error || !data) {
      // Do not leave an orphan object behind when the row is rejected, which is
      // what happens when the note does not belong to this user.
      await supabase.storage.from('files').remove([path]);
      logger.error('Failed to record note image', { userId: user.id, error: error?.message });
      throw new DatabaseError('Failed to save the image');
    }

    return NextResponse.json(
      { ok: true, data: { ...data, url: await signedUrl(supabase, path) } },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Upload note image failed', { error });
    return fail(error instanceof AppError ? error : new DatabaseError('Failed to upload the image'));
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

    const { data: row } = await supabase
      .from('note_images')
      .select('id, storage_path')
      .eq('id', parsed.data.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!row || typeof row.storage_path !== 'string') return notFound('Image not found');

    const { error: storageError } = await supabase.storage.from('files').remove([row.storage_path]);
    if (storageError) {
      logger.error('Failed to remove image object', { userId: user.id, error: storageError.message });
    }

    const { error } = await supabase
      .from('note_images')
      .delete()
      .eq('id', parsed.data.id)
      .eq('user_id', user.id);

    if (error) {
      logger.error('Failed to delete note image', { userId: user.id, error: error.message });
      throw new DatabaseError('Failed to delete the image');
    }

    return NextResponse.json({ ok: true, data: { id: parsed.data.id } });
  } catch (error) {
    logger.error('Delete note image failed', { error });
    return fail(error instanceof AppError ? error : new DatabaseError('Failed to delete the image'));
  }
}
