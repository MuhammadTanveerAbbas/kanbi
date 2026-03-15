import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { usageService } from '@/lib/services/usage-service';
import { saveBoardSchema } from '@/lib/validation/schemas';
import { ValidationError, AuthError, RateLimitError, DatabaseError } from '@/lib/errors/AppError';
import { logger } from '@/lib/logging/logger';

export async function POST(request: NextRequest) {
    const requestId = crypto.randomUUID();

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            throw new AuthError();
        }

        logger.info('Save board request', { userId: user.id, requestId });

        // Check if user can create a board
        const canCreate = await usageService.canCreateBoard(user.id);
        if (!canCreate) {
            throw new RateLimitError('Board usage limit exceeded');
        }

        // Validate request body
        const body = await request.json();
        const validated = saveBoardSchema.parse(body);

        // Save board to saved_generations table
        const { data, error } = await supabase
            .from('saved_generations')
            .insert({
                user_id: user.id,
                title: validated.title,
                content: JSON.stringify(validated.tasks),
                category: (body.category as string) || 'other',
                icon: (body.icon as string) || 'file',
                is_favorite: false,
            })
            .select()
            .single();

        if (error) {
            logger.error('Database error saving board', { userId: user.id, requestId, error: error.message });
            throw new DatabaseError('Failed to save board');
        }

        // Track board usage after successful save
        await usageService.incrementBoardUsage(user.id).catch((error) => {
            logger.error('Failed to track board usage', { userId: user.id, requestId, error: error.message });
        });

        logger.info('Save board success', { userId: user.id, requestId, boardId: data.id });

        return NextResponse.json(data);
    } catch (error: any) {
        if (error.name === 'ZodError') {
            const validationError = new ValidationError(error.errors?.[0]?.message || 'Invalid request data');
            logger.error('Validation error', { requestId, errorId: validationError.errorId });
            return NextResponse.json(validationError.toJSON(), { status: validationError.statusCode });
        }

        if (error instanceof RateLimitError || error instanceof AuthError || error instanceof DatabaseError) {
            logger.error(error.message, { requestId, errorId: error.errorId });
            return NextResponse.json(error.toJSON(), { status: error.statusCode });
        }

        logger.error('Save board error', { requestId, error: error.message });
        return NextResponse.json(
            {
                error: error.message || 'Failed to save board',
                code: 'INTERNAL_ERROR',
                statusCode: 500,
                errorId: requestId,
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}
