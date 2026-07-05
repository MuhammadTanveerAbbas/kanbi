import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAuthorizedCronRequest } from '@/lib/cron-auth'
import { logger } from '@/lib/logging/logger'

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  const { error: cleanupError } = await admin.rpc('cleanup_old_ai_data')
  if (cleanupError) {
    logger.error('Cleanup cron failed', { error: cleanupError.message })
    return NextResponse.json({ error: cleanupError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, timestamp: new Date().toISOString() })
}
