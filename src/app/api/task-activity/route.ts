import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data } = await supabase
    .from('task_stats')
    .select('date, total_count')
    .eq('user_id', user.id)
    .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('date', { ascending: true });

  const activityData = (data || []).map(d => ({
    label: new Date(d.date).getDate().toString(),
    value: d.total_count || 0,
  }));

  return NextResponse.json(activityData);
}
