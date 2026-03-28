import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VALID_PRIORITIES = new Set(['urgent', 'high', 'medium', 'low']);
const VALID_STATUSES = new Set(['todo', 'wip', 'done']);

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('id, title, priority, label, status, estimate, due_date, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      return NextResponse.json({ tasks: [] });
    }

    return NextResponse.json({ tasks: tasks || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const sanitized = {
      user_id: user.id,
      title: String(body.title).trim().slice(0, 200),
      priority: VALID_PRIORITIES.has(body.priority) ? body.priority : 'medium',
      status: VALID_STATUSES.has(body.status) ? body.status : 'todo',
      label: body.label ? String(body.label).trim().slice(0, 50) : 'General',
      estimate: body.estimate ? String(body.estimate).trim().slice(0, 20) : null,
      due_date: body.due_date ?? null,
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert(sanitized)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
