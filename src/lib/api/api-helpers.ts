import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema } from 'zod';
import { AppError, ValidationError, AuthError } from '@/lib/errors/AppError';
import { logger } from '@/lib/logging/logger';
import { createClient } from '@/lib/supabase/server';

export async function withErrorHandling<T>(
  handler: (req: NextRequest, context: { user: any; requestId: string }) => Promise<T>
) {
  return async (req: NextRequest) => {
    const requestId = crypto.randomUUID();
    
    try {
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new AuthError();
      }

      const result = await handler(req, { user, requestId });
      return NextResponse.json(result);
    } catch (error) {
      if (error instanceof AppError) {
        logger.error(error.message, {
          requestId,
          code: error.code,
          errorId: error.errorId,
        });
        return NextResponse.json(error.toJSON(), { status: error.statusCode });
      }

      logger.error('Unexpected error', {
        requestId,
        error: error instanceof Error ? error.message : String(error),
      });

      return NextResponse.json(
        {
          error: 'Internal server error',
          code: 'INTERNAL_ERROR',
          statusCode: 500,
          errorId: requestId,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  };
}

export async function validateRequest<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): Promise<T> {
  try {
    const body = await req.json();
    return schema.parse(body);
  } catch (error: any) {
    throw new ValidationError(
      error.errors?.[0]?.message || 'Invalid request data'
    );
  }
}
