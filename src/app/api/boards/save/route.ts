import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { usageService } from '@/lib/services/usage-service';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user can create a board
        const canCreate = await usageService.canCreateBoard(user.id);
        if (!canCreate) {
            return NextResponse.json(
                {
                    error: 'Board usage limit exceeded',
                    code: 'RATE_LIMIT_EXCEEDED'
                },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { title, tasks, category, icon } = body;

        if (!title || !tasks) {
            return NextResponse.json(
                { error: 'Title and tasks are required' },
                { status: 400 }
            );
        }

        // Save board to saved_generations table
        // content stores the full tasks JSON
        const { data, error } = await supabase
            .from('saved_generations')
            .insert({
                user_id: user.id,
                title: title,
                content: JSON.stringify(tasks),
                category: category || 'other',
                icon: icon || 'file',
                is_favorite: false,
            })
            .select()
            .single();

        if (error) {
            console.error('Save board error:', error);
            return NextResponse.json(
                { error: 'Failed to save board: ' + error.message },
                { status: 500 }
            );
        }

        // Track board usage after successful save
        await usageService.incrementBoardUsage(user.id).catch((error) => {
            console.error('Failed to track board usage:', error);
            // Don't fail the request if tracking fails
        });

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Save board error:', error);

        // Handle rate limit errors
        if (error.message?.includes('limit exceeded')) {
            return NextResponse.json(
                { error: 'Board usage limit exceeded', code: 'RATE_LIMIT_EXCEEDED' },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Failed to save board' },
            { status: 500 }
        );
    }
}
