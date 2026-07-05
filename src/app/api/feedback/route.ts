import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { feedbackSchema } from '@/lib/validation/schemas';
import { ValidationError, DatabaseError } from '@/lib/errors/AppError';
import { logger } from '@/lib/logging/logger';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const limitResult = await rateLimit(request, { maxRequests: 5, windowMs: 3600000 });
  if (!limitResult.success) return rateLimitResponse(limitResult.limit, limitResult.remaining, limitResult.reset);

  try {
    const supabase = await createClient();

    // Get user from auth header or session (optional for feedback)
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

    logger.info('Feedback request', { userId: userId || undefined, requestId });

    // Validate request body
    const body = await request.json();
    const validated = feedbackSchema.parse(body);

    const { data, error } = await supabase
      .from('feedback')
      .insert({
        user_id: userId,
        type: validated.type,
        message: validated.message,
      })
      .select()
      .single();

    if (error) {
      logger.error('Database error saving feedback', { userId: userId || undefined, requestId, error: error.message });
      throw new DatabaseError('Failed to submit feedback');
    }

    logger.info('Feedback success', { userId: userId || undefined, requestId, feedbackId: data.id });

    return NextResponse.json(data);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      const validationError = new ValidationError(error.errors?.[0]?.message || 'Invalid request data');
      logger.error('Validation error', { requestId, errorId: validationError.errorId });
      return NextResponse.json(validationError.toJSON(), { status: validationError.statusCode });
    }

    if (error instanceof DatabaseError) {
      logger.error(error.message, { requestId, errorId: error.errorId });
      return NextResponse.json(error.toJSON(), { status: error.statusCode });
    }

    logger.error('Submit feedback error', { requestId, error: error.message });
    return NextResponse.json(
      {
        error: 'Failed to submit feedback',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
        errorId: requestId,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
