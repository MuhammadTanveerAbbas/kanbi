import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/ai-service';
import { createClient } from '@/lib/supabase/server';
import { usageService } from '@/lib/services/usage-service';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limiter';
import { parseTasksSchema } from '@/lib/validation/schemas';
import { ValidationError, AuthError, RateLimitError, ExternalServiceError } from '@/lib/errors/AppError';
import { logger } from '@/lib/logging/logger';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const limit = await rateLimit(request, { maxRequests: 20, windowMs: 60000 });
  if (!limit.success) {
    logger.warn('Rate limit exceeded', { requestId });
    return rateLimitResponse(limit.limit, limit.remaining, limit.reset);
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new AuthError();
    }

    logger.info('Parse tasks request', { userId: user.id, requestId });

    // Validate request body
    const body = await request.json();
    const validated = parseTasksSchema.parse(body);

    // Check if user can use AI
    const canUse = await usageService.canUseAI(user.id);
    if (!canUse) {
      throw new RateLimitError('AI usage limit exceeded');
    }

    // Parse tasks with enhanced extraction
    const result = await AIService.parseTasks(validated.notes);

    // Track AI usage after successful parsing
    await usageService.incrementAIUsage(user.id).catch((error) => {
      logger.error('Failed to track AI usage', { userId: user.id, requestId, error: error.message });
    });

    logger.info('Parse tasks success', {
      userId: user.id,
      requestId,
      tasksCount: result.tasks.length,
      duplicatesCount: result.duplicates.length,
      qualityScore: result.qualityScore,
    });

    return NextResponse.json(result);

  } catch (error: any) {
    if (error.name === 'ZodError') {
      const validationError = new ValidationError(error.errors?.[0]?.message || 'Invalid request data');
      logger.error('Validation error', { requestId, errorId: validationError.errorId });
      return NextResponse.json(validationError.toJSON(), { status: validationError.statusCode });
    }

    if (error instanceof RateLimitError || error instanceof AuthError) {
      logger.warn(error.message, { requestId, errorId: error.errorId });
      return NextResponse.json(error.toJSON(), { status: error.statusCode });
    }

    if (error.message?.includes('API key not configured')) {
      const serviceError = new ExternalServiceError('AI service unavailable');
      logger.error('AI service error', { requestId, errorId: serviceError.errorId });
      return NextResponse.json(serviceError.toJSON(), { status: serviceError.statusCode });
    }

    logger.error('Parse tasks error', { requestId, error: error.message });
    return NextResponse.json(
      {
        error: error.message || 'AI parsing failed',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
        errorId: requestId,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
