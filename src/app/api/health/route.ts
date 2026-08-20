import { NextResponse } from 'next/server'
import { checkSupabaseHealth } from '@/lib/supabase/health'
import { logger } from '@/lib/logging/logger'

export async function GET() {
  const supabase = await checkSupabaseHealth()

  if (!supabase.ok) {
    logger.warn('Supabase health check failed', { error: supabase.error })
  }

  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '3.1.0',
      dependencies: {
        supabase: supabase.ok ? 'ok' : 'unavailable',
      },
    },
    { status: 200 }
  )
}
