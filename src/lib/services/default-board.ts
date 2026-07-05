import type { SupabaseClient } from '@supabase/supabase-js';

/** Returns the user's primary board, creating "My Board" if none exists. */
export async function getOrCreateDefaultBoard(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const { data: existing } = await supabase
    .from('boards')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data: created, error } = await supabase
    .from('boards')
    .insert({ user_id: userId, name: 'My Board', folder: 'General' })
    .select('id')
    .single();

  if (error || !created?.id) {
    throw new Error(error?.message ?? 'Failed to create default board');
  }

  return created.id;
}
