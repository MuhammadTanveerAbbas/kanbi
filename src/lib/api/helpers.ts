import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

export type SubscriptionPlan = 'free' | 'premium'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'

export interface UserSubscription {
  plan: SubscriptionPlan
  status: SubscriptionStatus
  stripe_subscription_id: string | null
  current_period_end: string | null
}

export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('subscriptions')
    .select('plan, status, stripe_subscription_id, current_period_end')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return null
  }

  return {
    plan: data.plan as SubscriptionPlan,
    status: data.status as SubscriptionStatus,
    stripe_subscription_id: data.stripe_subscription_id,
    current_period_end: data.current_period_end,
  }
}

export async function canUserGenerate(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const subscription = await getUserSubscription(userId)
  const plan = subscription?.plan || 'free'
  const limit = plan === 'premium' ? 50 : 5

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('usage_tracking')
    .select('generations_count')
    .eq('user_id', userId)
    .eq('date', today)
    .single()

  if (error && error.code !== 'PGRST116') {
    return { allowed: false, remaining: 0 }
  }

  const used = data?.generations_count || 0
  const remaining = Math.max(0, limit - used)

  return {
    allowed: remaining > 0,
    remaining,
  }
}

export async function trackGeneration(userId: string): Promise<void> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { error } = await supabase.rpc('increment_generation_count', {
    p_user_id: userId,
    p_date: today,
  })

  if (error) {
    throw new Error(`Failed to track generation: ${error.message}`)
  }
}
