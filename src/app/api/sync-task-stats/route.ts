import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logging/logger';
import { cacheManager, CACHE_KEYS } from '@/lib/cache/cache-manager';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let urgent = 0, high = 0, medium = 0, low = 0, total = 0, completed = 0;

        try {
            const body = await request.json();
            if (body && typeof body.total === 'number') {
                urgent = body.urgent || 0;
                high = body.high || 0;
                medium = body.medium || 0;
                low = body.low || 0;
                total = body.total || 0;
                completed = body.completed || 0;
            } else {
                throw new Error('no body counts');
            }
        } catch {
            const { data: tasks } = await supabase
                .from('tasks')
                .select('priority, status')
                .eq('user_id', user.id);

            if (tasks) {
                total = tasks.length;
                completed = tasks.filter(t => t.status === 'done').length;
                urgent = tasks.filter(t => t.priority === 'urgent').length;
                high = tasks.filter(t => t.priority === 'high').length;
                medium = tasks.filter(t => t.priority === 'medium').length;
                low = tasks.filter(t => t.priority === 'low').length;
            }
        }

        const today = new Date().toISOString().split('T')[0];

        const { error } = await supabase
            .from('task_stats')
            .upsert({
                user_id: user.id,
                date: today,
                urgent_count: urgent,
                high_count: high,
                medium_count: medium,
                low_count: low,
                total_count: total,
                completed_count: completed,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'user_id,date',
            });

        if (error) {
            logger.error('Error syncing task stats:', { message: error.message });
            return NextResponse.json({ error: 'Failed to sync stats' }, { status: 500 });
        }

        cacheManager.invalidate(CACHE_KEYS.TASK_STATS(user.id));

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('Sync task stats error:', { error });
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
