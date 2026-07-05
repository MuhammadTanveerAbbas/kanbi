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

        const { data: tasks } = await supabase
            .from('tasks')
            .select('priority, status')
            .eq('user_id', user.id);

        const total = tasks?.length ?? 0;
        const completed = tasks?.filter(t => t.status === 'done').length ?? 0;
        const urgent = tasks?.filter(t => t.priority === 'urgent').length ?? 0;
        const high = tasks?.filter(t => t.priority === 'high').length ?? 0;
        const medium = tasks?.filter(t => t.priority === 'medium').length ?? 0;
        const low = tasks?.filter(t => t.priority === 'low').length ?? 0;

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
