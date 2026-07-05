import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'
import { usageService } from '@/lib/services/usage-service'

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
  return usageService.canUseAI(userId)
    .then(canUse => ({ allowed: canUse, remaining: canUse ? 999 : 0 }))
    .catch(() => ({ allowed: false, remaining: 0 }))
}

export async function trackGeneration(userId: string): Promise<void> {
  await usageService.incrementAIUsage(userId)
}
