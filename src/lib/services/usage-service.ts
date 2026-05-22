import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { USAGE_LIMITS } from '@/lib/constants'
import { logger } from '@/lib/logging/logger'

export interface UserUsage {
  aiUsedToday: number
  aiUsedMonth: number
  boardsUsedToday: number
  boardsUsedMonth: number
}

export interface UserLimits {
  plan: 'free' | 'premium'
  dailyAILimit: number
  monthlyAILimit: number
  dailyBoardLimit: number
  monthlyBoardLimit: number
}

class UsageService {
  async getUserLimits(userId: string | null): Promise<UserLimits> {
    if (!userId) {
      return {
        plan: 'free',
        dailyAILimit: USAGE_LIMITS.FREE.DAILY_AI,
        monthlyAILimit: USAGE_LIMITS.FREE.MONTHLY_AI,
        dailyBoardLimit: USAGE_LIMITS.FREE.DAILY_BOARDS,
        monthlyBoardLimit: USAGE_LIMITS.FREE.MONTHLY_BOARDS,
      }
    }

    try {
      const supabase = await createClient()
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('plan')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      if (error && error.code !== 'PGRST116') {
        logger.error('Error fetching subscription:', { message: error.message })
      }

      const plan = subscription?.plan === 'premium' ? 'premium' : 'free'
      const limits = USAGE_LIMITS[plan.toUpperCase() as 'FREE' | 'PREMIUM']

      return {
        plan,
        dailyAILimit: limits.DAILY_AI,
        monthlyAILimit: limits.MONTHLY_AI,
        dailyBoardLimit: limits.DAILY_BOARDS,
        monthlyBoardLimit: limits.MONTHLY_BOARDS,
      }
    } catch (error) {
      logger.error('Error fetching subscription:', { error })
      return {
        plan: 'free',
        dailyAILimit: USAGE_LIMITS.FREE.DAILY_AI,
        monthlyAILimit: USAGE_LIMITS.FREE.MONTHLY_AI,
        dailyBoardLimit: USAGE_LIMITS.FREE.DAILY_BOARDS,
        monthlyBoardLimit: USAGE_LIMITS.FREE.MONTHLY_BOARDS,
      }
    }
  }

  async getTodayUsage(userId: string): Promise<UserUsage> {
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]

    try {
      const { data: todayUsage, error: todayError } = await supabase
        .from('usage_tracking')
        .select('generations_count, boards_used_count, ai_used_count')
        .eq('user_id', userId)
        .eq('date', today)
        .single()

      if (todayError && todayError.code !== 'PGRST116') {
        logger.error('Error fetching today usage:', { message: todayError.message })
      }

      return {
        aiUsedToday: todayUsage?.ai_used_count || 0,
        aiUsedMonth: 0,
        boardsUsedToday: todayUsage?.boards_used_count || 0,
        boardsUsedMonth: 0,
      }
    } catch (error) {
      logger.error('Error fetching today usage:', { error })
      return { aiUsedToday: 0, aiUsedMonth: 0, boardsUsedToday: 0, boardsUsedMonth: 0 }
    }
  }

  async getMonthUsage(userId: string): Promise<{ aiUsedMonth: number; boardsUsedMonth: number }> {
    const supabase = await createClient()

    try {
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

      const { data: monthUsage, error: monthError } = await supabase
        .from('usage_tracking')
        .select('ai_used_count, boards_used_count')
        .eq('user_id', userId)
        .gte('date', monthStart)

      if (monthError && monthError.code !== 'PGRST116') {
        logger.error('Error fetching month usage:', { message: monthError.message })
      }

      const aiUsedMonth = monthUsage?.reduce((sum, row) => sum + (row.ai_used_count || 0), 0) ?? 0
      const boardsUsedMonth = monthUsage?.reduce((sum, row) => sum + (row.boards_used_count || 0), 0) ?? 0

      return { aiUsedMonth, boardsUsedMonth }
    } catch (error) {
      logger.error('Error fetching month usage:', { error })
      return { aiUsedMonth: 0, boardsUsedMonth: 0 }
    }
  }

  async getUserUsage(userId: string, _forceRefresh = false): Promise<UserUsage> {
    const [today, month] = await Promise.all([
      this.getTodayUsage(userId),
      this.getMonthUsage(userId),
    ])

    return {
      ...today,
      ...month,
    }
  }

  async canUseAI(userId: string): Promise<boolean> {
    const limits = await this.getUserLimits(userId)
    const usage = await this.getUserUsage(userId)

    return usage.aiUsedToday < limits.dailyAILimit && usage.aiUsedMonth < limits.monthlyAILimit
  }

  async canCreateBoard(userId: string): Promise<boolean> {
    const limits = await this.getUserLimits(userId)
    const usage = await this.getUserUsage(userId)

    return usage.boardsUsedToday < limits.dailyBoardLimit
  }

  async incrementBoardUsage(userId: string): Promise<void> {
    try {
      const supabase = await createClient()
      const today = new Date().toISOString().split('T')[0]

      const { error } = await supabase.rpc('increment_board_usage', {
        p_user_id: userId,
        p_date: today,
      })

      if (error) {
        logger.error('Error incrementing board usage:', { message: error.message })
      }
    } catch (error) {
      logger.error('Error incrementing board usage:', { error })
    }
  }

  async incrementAIUsage(userId: string): Promise<void> {
    try {
      const supabase = await createClient()
      const today = new Date().toISOString().split('T')[0]

      const { error } = await supabase.rpc('increment_ai_usage', {
        p_user_id: userId,
        p_date: today,
      })

      if (error) {
        logger.error('Error incrementing AI usage:', { message: error.message })
      }
    } catch (error) {
      logger.error('Error incrementing AI usage:', { error })
    }
  }

  async checkBoardLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
    const supabase = await createClient()

    try {
      const limits = await this.getUserLimits(userId)
      const today = new Date().toISOString().split('T')[0]

      const { data } = await supabase
        .from('usage_tracking')
        .select('boards_used_count')
        .eq('user_id', userId)
        .eq('date', today)
        .single()

      const used = data?.boards_used_count || 0
      const remaining = Math.max(0, limits.dailyBoardLimit - used)

      return { allowed: remaining > 0, remaining }
    } catch (error) {
      logger.error('Error checking board limit:', { error })
      return { allowed: true, remaining: 0 }
    }
  }

  async checkAILimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
    const supabase = await createClient()

    try {
      const limits = await this.getUserLimits(userId)
      const today = new Date().toISOString().split('T')[0]

      const { data } = await supabase
        .from('usage_tracking')
        .select('ai_used_count')
        .eq('user_id', userId)
        .eq('date', today)
        .single()

      const used = data?.ai_used_count || 0
      const remaining = Math.max(0, limits.dailyAILimit - used)

      return { allowed: remaining > 0, remaining }
    } catch (error) {
      logger.error('Error checking AI limit:', { error })
      return { allowed: true, remaining: 0 }
    }
  }
}

export const usageService = new UsageService()
