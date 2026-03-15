import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { createSavedGenerationSchema } from '@/lib/validation/schemas';
import { ValidationError, AuthError, DatabaseError } from '@/lib/errors/AppError';
import { logger } from '@/lib/logging/logger';
import { cacheManager, CACHE_KEYS } from '@/lib/cache/cache-manager';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const supabase = await createServerClient();

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
      throw new AuthError();
    }

    logger.info('Create saved generation request', { userId, requestId });

    // Validate request body
    const body = await request.json();
    const validated = createSavedGenerationSchema.parse(body);

    // Generate title from input if not provided
    const generatedTitle = validated.title || validated.input_text.substring(0, 50) + (validated.input_text.length > 50 ? '...' : '');

    const { data, error } = await supabase
      .from('saved_generations')
      .insert({
        user_id: userId,
        input_text: validated.input_text,
        output_text: validated.output_text,
        tone: validated.tone || null,
        length: validated.length || null,
        format: validated.format || null,
        title: generatedTitle,
        is_favorite: false,
      })
      .select()
      .single();

    if (error) {
      logger.error('Database error saving generation', { userId, requestId, error: error.message });
      throw new DatabaseError('Failed to save generation');
    }

    logger.info('Create saved generation success', { userId, requestId, generationId: data.id });

    // Invalidate caches
    cacheManager.invalidate(CACHE_KEYS.USAGE(userId));
    cacheManager.invalidate(CACHE_KEYS.ANALYTICS(userId));

    return NextResponse.json(data);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      const validationError = new ValidationError(error.errors?.[0]?.message || 'Invalid request data');
      logger.error('Validation error', { requestId, errorId: validationError.errorId });
      return NextResponse.json(validationError.toJSON(), { status: validationError.statusCode });
    }

    if (error instanceof AuthError || error instanceof DatabaseError) {
      logger.error(error.message, { requestId, errorId: error.errorId });
      return NextResponse.json(error.toJSON(), { status: error.statusCode });
    }

    logger.error('Save generation error', { requestId, error: error.message });
    return NextResponse.json(
      {
        error: 'Failed to save generation',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
        errorId: requestId,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
