import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAuthorizedCronRequest } from '@/lib/cron-auth'

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const { error } = await supabase.from('profiles').select('id').limit(1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() })
}
