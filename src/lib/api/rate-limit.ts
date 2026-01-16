import { createClient } from '@/lib/supabase/server'
import type { UserSubscription } from './helpers'

const RATE_LIMITS = {
  free: 5,
  premium: 50,
} as const

export async function checkRateLimit(userId: string, subscription: UserSubscription | null): Promise<{
  allowed: boolean
  remaining: number
  limit: number
}> {
  const plan = subscription?.plan || 'free'
  const limit = RATE_LIMITS[plan]

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('usage_tracking')
    .select('generations_count')
    .eq('user_id', userId)
    .eq('date', today)
    .single()

  if (error && error.code !== 'PGRST116') {
    return { allowed: false, remaining: 0, limit }
  }

  const used = data?.generations_count || 0
  const remaining = Math.max(0, limit - used)

  return {
    allowed: remaining > 0,
    remaining,
    limit,
  }
}

export async function incrementUsage(userId: string): Promise<void> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { error } = await supabase.rpc('increment_generation_count', {
    p_user_id: userId,
    p_date: today,
  })

  if (error) {
    throw new Error(`Failed to increment usage: ${error.message}`)
  }
}

export async function getRemainingGenerations(userId: string, subscription: UserSubscription | null): Promise<number> {
  const result = await checkRateLimit(userId, subscription)
  return result.remaining
}
