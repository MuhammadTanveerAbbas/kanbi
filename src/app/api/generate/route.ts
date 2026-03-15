import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/ai-service';
import { createClient } from '@/lib/supabase/server';
import { usageService } from '@/lib/services/usage-service';
import { generateSchema } from '@/lib/validation/schemas';
import { ValidationError, AuthError, RateLimitError, ExternalServiceError } from '@/lib/errors/AppError';
import { logger } from '@/lib/logging/logger';
import { rateLimit, rateLimitResponse, addRateLimitHeaders } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const limitResult = await rateLimit(request, { maxRequests: 20, windowMs: 60000 });
  if (!limitResult.success) return rateLimitResponse(limitResult.limit, limitResult.remaining, limitResult.reset);

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new AuthError();
    }

    logger.info('Generate content request', { userId: user.id, requestId });

    // Check if user can use AI
    const canUse = await usageService.canUseAI(user.id);
    if (!canUse) {
      throw new RateLimitError('AI usage limit exceeded');
    }

    // Validate request body
    const body = await request.json();
    const validated = generateSchema.parse(body);

    const result = await AIService.generate(validated.input, {
      tone: validated.tone || 'professional',
      length: validated.length || 'medium',
      format: validated.format || 'text',
      model: 'groq',
    });

    // Track AI usage after successful generation
    await usageService.incrementAIUsage(user.id).catch((error) => {
      logger.error('Failed to track AI usage', { userId: user.id, requestId, error: error.message });
    });

    logger.info('Generate content success', { userId: user.id, requestId });

    const response = NextResponse.json({ output: result });
    return addRateLimitHeaders(response, limitResult.limit, limitResult.remaining, limitResult.reset);
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

    logger.error('Generation error', { requestId, error: error.message });
    return NextResponse.json(
      {
        error: error.message || 'Failed to generate content',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
        errorId: requestId,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
