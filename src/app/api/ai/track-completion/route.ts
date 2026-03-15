import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { trackCompletionSchema } from '@/lib/validation/schemas';
import { ValidationError, AuthError, DatabaseError } from '@/lib/errors/AppError';
import { logger } from '@/lib/logging/logger';
import { rateLimit, rateLimitResponse, addRateLimitHeaders } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const limitResult = await rateLimit(request, { maxRequests: 50, windowMs: 60000 });
  if (!limitResult.success) return rateLimitResponse(limitResult.limit, limitResult.remaining, limitResult.reset);

  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new AuthError();
    }

    logger.info('Track completion request', { userId: user.id, requestId });

    // Validate request body
    const body = await request.json();
    const validated = trackCompletionSchema.parse(body);

    // Save task completion
    const { error: insertError } = await supabase
      .from('task_completions')
      .insert({
        user_id: user.id,
        task_title: validated.taskTitle,
        task_priority: validated.taskPriority,
        time_spent_minutes: validated.timeSpentMinutes,
        completed_at: new Date().toISOString(),
      });

    if (insertError) {
      logger.error('Database error saving completion', { userId: user.id, requestId, error: insertError.message });
      throw new DatabaseError('Failed to save completion');
    }

    logger.info('Track completion success', { userId: user.id, requestId });

    const response = NextResponse.json({ success: true });
    return addRateLimitHeaders(response, limitResult.limit, limitResult.remaining, limitResult.reset);
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

    logger.error('Track completion error', { requestId, error: error.message });
    return NextResponse.json(
      {
        error: 'Failed to track completion',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
        errorId: requestId,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
