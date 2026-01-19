import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('task_stats')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json({
      urgent: 0,
      high: 0,
      medium: 0,
      low: 0,
      total: 0,
      completed: 0,
    });
  }

  return NextResponse.json({
    urgent: data.urgent_count,
    high: data.high_count,
    medium: data.medium_count,
    low: data.low_count,
    total: data.total_count,
    completed: data.completed_count,
  });
}
