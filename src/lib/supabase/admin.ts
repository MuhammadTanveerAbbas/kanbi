import { createClient } from '@supabase/supabase-js'
import { requireEnv } from '@/lib/env'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
