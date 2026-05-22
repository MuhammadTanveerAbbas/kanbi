import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logging/logger'

export async function GET() {
  const checks: Record<string, string> = {}
  let allHealthy = true

  try {
    const adminClient = createAdminClient()
    const { error } = await adminClient.from('profiles').select('id', { count: 'exact', head: true })
    if (error) {
      checks.database = `unhealthy: ${error.message}`
      allHealthy = false
    } else {
      checks.database = 'connected'
    }
  } catch (err) {
    checks.database = 'unhealthy: connection failed'
    allHealthy = false
  }

  const status = allHealthy ? 'healthy' : 'degraded'

  if (!allHealthy) {
    logger.warn('Health check degraded', { checks })
  }

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '3.1.0',
      checks,
    },
    { status: allHealthy ? 200 : 503 }
  )
}
