import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single();

  return NextResponse.json({
    id: user.id,
    full_name: profile?.full_name || '',
    email: profile?.email || user.email || '',
    avatar_url: user.user_metadata?.avatar_url || null,
  });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { full_name } = await request.json();
  if (!full_name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  await supabase.from('profiles').upsert({ id: user.id, full_name: full_name.trim(), email: user.email });
  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Delete user data
  await Promise.allSettled([
    supabase.from('tasks').delete().eq('user_id', user.id),
    supabase.from('saved_generations').delete().eq('user_id', user.id),
    supabase.from('chat_messages').delete().eq('user_id', user.id),
    supabase.from('integrations').delete().eq('user_id', user.id),
    supabase.from('profiles').delete().eq('id', user.id),
  ]);

  // Delete the auth user via admin API (requires service role key)
  const { createClient: createAdmin } = await import('@supabase/supabase-js');
  const adminClient = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  await adminClient.auth.admin.deleteUser(user.id);

  await supabase.auth.signOut();
  return NextResponse.json({ success: true });
}
