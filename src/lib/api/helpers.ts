import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

/** Returns the authenticated user for the current request, or null. */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}
