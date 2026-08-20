import { createAdminClient } from '@/lib/supabase/admin'

const HEALTH_TIMEOUT_MS = 5000

export interface SupabaseHealthResult {
  ok: boolean
  latencyMs: number
  error?: string
}

function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Supabase health check timed out')), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      }
    )
  })
}

/**
 * Lightweight read-only Supabase connectivity check.
 * Uses a safe existing resource (profiles) and never writes data.
 */
export async function checkSupabaseHealth(): Promise<SupabaseHealthResult> {
  const started = Date.now()

  try {
    const supabase = createAdminClient()
    const query = supabase.from('profiles').select('id').limit(1)
    const { error } = await withTimeout(Promise.resolve(query), HEALTH_TIMEOUT_MS)

    return {
      ok: !error,
      latencyMs: Date.now() - started,
      error: error ? error.message : undefined,
    }
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message : 'Supabase is unavailable',
    }
  }
}