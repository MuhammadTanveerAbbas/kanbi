import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cacheManager, CACHE_KEYS } from '@/lib/cache/cache-manager';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { urgent, high, medium, low, total, completed } = body;

        const today = new Date().toISOString().split('T')[0];

        const { error } = await supabase
            .from('task_stats')
            .upsert({
                user_id: user.id,
                date: today,
                urgent_count: urgent || 0,
                high_count: high || 0,
                medium_count: medium || 0,
                low_count: low || 0,
                total_count: total || 0,
                completed_count: completed || 0,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'user_id,date',
            });

        if (error) {
            console.error('Error syncing task stats:', error);
            return NextResponse.json({ error: 'Failed to sync stats' }, { status: 500 });
        }

        cacheManager.invalidate(CACHE_KEYS.TASK_STATS(user.id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Sync task stats error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
