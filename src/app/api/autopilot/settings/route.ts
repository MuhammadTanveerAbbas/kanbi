import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: settings } = await supabase
      .from('autopilot_settings')
      .select('enabled, work_hours_start, work_hours_end, break_duration, max_daily_tasks, auto_reschedule, auto_prioritize, briefing_time')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({ settings: settings || {
      enabled: true,
      work_hours_start: '09:00',
      work_hours_end: '17:00',
      break_duration: 15,
      max_daily_tasks: 8,
      auto_reschedule: true,
      auto_prioritize: true,
      briefing_time: '08:00'
    }});
  } catch (error) {
    console.error('Fetch settings error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await request.json();

    const { data, error } = await supabase
      .from('autopilot_settings')
      .upsert({
        user_id: user.id,
        ...settings,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ settings: data });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
