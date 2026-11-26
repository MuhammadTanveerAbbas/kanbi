import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limiter';
import { AppError, AuthError, DatabaseError, ExternalServiceError } from '@/lib/errors/AppError';
import { logger } from '@/lib/logging/logger';
import { DOCX_MAX_BYTES, NOTE_CONTENT_MAX, NOTE_TITLE_MAX } from '@/lib/constants';
import { fail, invalid, payloadTooLarge } from '@/lib/server/api-response';

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/**
 * The extracted text is stored as plain text, so angle brackets have no meaning
 * and are removed rather than escaped. That keeps the editor honest and means a
 * document cannot smuggle markup into the note content.
 */
function toPlainText(value: string): string {
  return value.replace(/[<>]/g, '').replace(/\r\n/g, '\n').trim();
}

function titleFromName(name: string): string {
  const base = name.replace(/\.docx$/i, '').trim();
  return (base.length > 0 ? base : 'Imported note').slice(0, NOTE_TITLE_MAX);
}

export async function POST(request: NextRequest) {
  const limit = await rateLimit(request, { maxRequests: 60, windowMs: 60_000 });
  if (!limit.success) return rateLimitResponse(limit.limit, limit.remaining, limit.reset);

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return fail(new AuthError());

    const form = await request.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string') return invalid('Expected a DOCX file');

    const looksLikeDocx = file.type === DOCX_MIME || /\.docx$/i.test(file.name);
    if (!looksLikeDocx) return invalid('Only .docx files are supported');

    if (file.size > DOCX_MAX_BYTES) {
      return payloadTooLarge(`Documents must be ${DOCX_MAX_BYTES / (1024 * 1024)} MB or smaller`);
    }
    if (file.size <= 0) return invalid('The file is empty');

    let extracted: { value: string };
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      extracted = await mammoth.extractRawText({ buffer });
    } catch (parseError) {
      logger.error('Failed to read DOCX', { userId: user.id, error: String(parseError) });
      throw new ExternalServiceError('Could not read that document');
    }

    const content = toPlainText(extracted.value ?? '').slice(0, NOTE_CONTENT_MAX);
    if (content.length === 0) return invalid('That document has no readable text');

    const row = {
      title: titleFromName(file.name),
      content,
      folder: 'Imported',
      is_favorite: false,
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from('notes')
      .insert(row)
      .select('id, user_id, title, content, folder, is_favorite, created_at, updated_at')
      .single();

    if (error || !data) {
      logger.error('Failed to save imported note', { userId: user.id, error: error?.message });
      throw new DatabaseError('Failed to save the imported note');
    }

    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    logger.error('Import DOCX failed', { error });
    return fail(error instanceof AppError ? error : new DatabaseError('Failed to import the document'));
  }
}
