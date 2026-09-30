import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { DocxExporter } from '@/lib/export/docx-exporter';
import { PdfExporter } from '@/lib/export/pdf-exporter';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limiter';
import { logger } from '@/lib/logging/logger';
import { boardTaskSchema, MAX_TASKS_PER_BOARD } from '@/lib/validation/schemas';

const exportSchema = z.object({
  format: z.enum(['docx', 'pdf']),
});

/**
 * Builds a filename that is safe in a Content-Disposition header.
 * Everything outside the allowed set is replaced, and the result is capped so a
 * long board title cannot produce an overlong header value.
 */
function safeFilename(title: string, extension: string): string {
  const base = title.replace(/[^a-z0-9._-]/gi, '_').replace(/^[._-]+/, '').slice(0, 60);
  return `${base || 'board'}.${extension}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limit = await rateLimit(request, { maxRequests: 10, windowMs: 60_000 });
  if (!limit.success) {
    return rateLimitResponse(limit.limit, limit.remaining, limit.reset);
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const parsedBody = exportSchema.safeParse(await request.json().catch(() => null));
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Invalid format. Use docx or pdf' },
        { status: 400 }
      );
    }
    const { format } = parsedBody.data;

    // The query is scoped to the authenticated user explicitly rather than
    // relying on row level security alone, so ownership is enforced in the
    // application as well as the database.
    const { data: board, error } = await supabase
      .from('saved_generations')
      .select('id, title, content, created_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      logger.error('Export query failed', { userId: user.id, boardId: id, error: error.message });
      return NextResponse.json({ error: 'Failed to load board' }, { status: 500 });
    }

    if (!board) {
      // A board owned by someone else is reported the same way as one that does
      // not exist, so this endpoint cannot be used to probe for valid ids.
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    // Stored content is parsed and re-validated, because it was written by an
    // older version of the client and is not guaranteed to match the schema.
    let rawTasks: unknown;
    try {
      rawTasks = JSON.parse(board.content || '[]');
    } catch {
      return NextResponse.json({ error: 'Board content is unreadable' }, { status: 422 });
    }

    if (!Array.isArray(rawTasks)) {
      return NextResponse.json({ error: 'Board content is unreadable' }, { status: 422 });
    }

    const tasks = rawTasks
      .slice(0, MAX_TASKS_PER_BOARD)
      .map((task) => boardTaskSchema.safeParse(task))
      .filter((result) => result.success)
      .map((result) => result.data);

    const boardData = {
      title: board.title,
      tasks,
      createdAt: new Date(board.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      userName: user.email?.split('@')[0] || 'User',
    };

    const buffer =
      format === 'docx'
        ? await DocxExporter.export(boardData)
        : await PdfExporter.export(boardData);

    const contentType =
      format === 'docx'
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : 'application/pdf';

    const filename = safeFilename(board.title, format);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    // The internal message is not echoed, since it can contain database detail.
    logger.error('Export failed', { error: error instanceof Error ? error.message : 'unknown' });
    return NextResponse.json({ error: 'Failed to export board' }, { status: 500 });
  }
}
