import { NextResponse } from 'next/server'
import { checkSupabaseHealth } from '@/lib/supabase/health'
import { logger } from '@/lib/logging/logger'
import { getProvider } from '@/lib/ai/service'
import { describeModelState } from '@/lib/ai/model-registry'

/**
 * Health check.
 *
 * ## What the model layer reports
 *
 * The catalog size and whether discovery works, not a model name. A health
 * endpoint that asserted a specific model would itself become a stale
 * reference the first time the runtime changed its catalogue, and it would be
 * asserting something the runtime has not confirmed.
 *
 * The endpoint always returns 200. A deployment with no model runtime is a
 * supported configuration, not an outage: the board, the workload analysis, the
 * autopilot briefing, and the board-aware assistant answers all work without
 * inference. Reporting a non-200 would page someone for a state that is working
 * as designed.
 */
export async function GET() {
  const supabase = await checkSupabaseHealth()

  if (!supabase.ok) {
    logger.warn('Supabase health check failed', { error: supabase.error })
  }

  const provider = getProvider()
  const model = provider
    ? await describeModelState(provider)
    : { provider: 'none', models: 0, default: '', healthy: false }

  return NextResponse.json(
    {
      status: supabase.ok ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '3.2.0',
      dependencies: {
        supabase: supabase.ok ? 'ok' : 'unavailable',
        // Reported as a state rather than as a vendor, because it is a
        // configuration fact and not an identity.
        inference: model.healthy ? 'ok' : provider ? 'unreachable' : 'not_configured',
      },
      models: {
        provider: model.provider,
        // How many open-weight models the runtime currently offers. This is the
        // number that grows on its own when a model is published.
        available: model.models,
        discovery: model.healthy ? 'ok' : 'failed',
      },
    },
    { status: 200 },
  )
}
