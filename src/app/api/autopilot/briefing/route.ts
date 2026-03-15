import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  generateDailySchedule,
  generateMorningBriefing,
  detectBlockersAndAdjust,
  rescheduleOverflow
} from '@/lib/ai/autopilot-engine';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tasks } = await request.json();

    // Get autopilot settings
    const { data: settings } = await supabase
      .from('autopilot_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const defaultSettings = {
      work_hours_start: '09:00',
      work_hours_end: '17:00',
      break_duration: 15,
      max_daily_tasks: 8
    };

    const userSettings = settings || defaultSettings;

    // Get current workload health
    const { data: snapshot } = await supabase
      .from('workload_snapshots')
      .select('health_score')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    const healthScore = snapshot?.health_score || 75;

    // Generate schedule
    const schedule = generateDailySchedule(tasks, userSettings);
    const briefing = generateMorningBriefing(tasks, schedule, healthScore);
    const adjustments = detectBlockersAndAdjust(tasks, schedule);
    const overflow = rescheduleOverflow(tasks, schedule.map(s => s.task));

    // Save briefing
    const today = new Date().toISOString().split('T')[0];
    await supabase
      .from('morning_briefings')
      .upsert({
        user_id: user.id,
        date: today,
        summary: briefing.summary,
        priorities: briefing.priorities,
        schedule: briefing.schedule,
        warnings: briefing.warnings
      });

    // Save schedule
    await supabase.from('auto_schedule').delete().eq('user_id', user.id).eq('scheduled_date', today);
    
    for (const block of schedule) {
      await supabase.from('auto_schedule').insert({
        user_id: user.id,
        task_id: block.task.id,
        task_title: block.task.title,
        scheduled_date: today,
        time_block: `${block.start}-${block.end}`,
        priority: block.task.priority,
        estimated_duration: block.duration
      });
    }

    // Save adjustments
    for (const adj of adjustments) {
      await supabase.from('autopilot_adjustments').insert({
        user_id: user.id,
        adjustment_type: adj.type,
        task_id: adj.task,
        reason: adj.reason,
        new_value: { suggestion: adj.suggestion }
      });
    }

    return NextResponse.json({
      briefing,
      adjustments,
      overflow,
      schedule
    });
  } catch (error) {
    console.error('Briefing generation error:', error);
    return NextResponse.json({ error: 'Failed to generate briefing' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];

    const { data: briefing } = await supabase
      .from('morning_briefings')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    const { data: schedule } = await supabase
      .from('auto_schedule')
      .select('*')
      .eq('user_id', user.id)
      .eq('scheduled_date', today)
      .order('time_block', { ascending: true });

    const { data: adjustments } = await supabase
      .from('autopilot_adjustments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({ briefing, schedule, adjustments });
  } catch (error) {
    console.error('Fetch briefing error:', error);
    return NextResponse.json({ error: 'Failed to fetch briefing' }, { status: 500 });
  }
}
