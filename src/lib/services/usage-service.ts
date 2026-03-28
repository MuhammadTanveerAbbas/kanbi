/**
 * Tracks and enforces per-user AI and board usage limits.
 * Limits differ by subscription plan (free vs. premium).
 */
import { createClient } from '@/lib/supabase/server';
import { cachingService } from './caching-service';

export interface UsageStats {
  boardsUsedToday: number;
  boardsUsedMonth: number;
  aiUsedToday: number;
  aiUsedMonth: number;
  totalBoards: number;
  totalAI: number;
}

export interface UsageLimits {
  dailyBoardLimit: number;
  monthlyBoardLimit: number;
  dailyAILimit: number;
  monthlyAILimit: number;
  plan: 'free' | 'premium';
}

const SUBSCRIPTION_LIMITS = {
  free: {
    dailyBoardLimit: 10,
    monthlyBoardLimit: 300,
    dailyAILimit: 10,
    monthlyAILimit: 300,
  },
  premium: {
    dailyBoardLimit: 50,
    monthlyBoardLimit: 1500,
    dailyAILimit: 50,
    monthlyAILimit: 1500,
  },
} as const;

class UsageService {
  private async getUserPlan(userId: string): Promise<'free' | 'premium'> {
    const cached = await cachingService.getCachedSubscription(userId);
    if (cached?.plan) {
      return cached.plan;
    }

    try {
      const supabase = await createClient();
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      const plan = subscription?.plan === 'premium' ? 'premium' : 'free';
      await cachingService.setCachedSubscription(userId, { plan, status: 'active' });
      return plan;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return 'free';
    }
  }

  async getUserLimits(userId: string): Promise<UsageLimits> {
    if (userId === 'anonymous' || !userId) {
      return {
        ...SUBSCRIPTION_LIMITS.free,
        plan: 'free',
      };
    }

    const plan = await this.getUserPlan(userId);
    const limits = SUBSCRIPTION_LIMITS[plan];

    return {
      ...limits,
      plan,
    };
  }

  async getUserUsage(userId: string, forceRefresh: boolean = false): Promise<UsageStats> {
    if (userId === 'anonymous' || !userId) {
      return {
        boardsUsedToday: 0,
        boardsUsedMonth: 0,
        aiUsedToday: 0,
        aiUsedMonth: 0,
        totalBoards: 0,
        totalAI: 0,
      };
    }

    if (forceRefresh) {
      await cachingService.invalidateUsageCache(userId);
    }

    if (!forceRefresh) {
      const cached = await cachingService.getCachedUsage(userId);
      if (cached) {
        return cached;
      }
    }

    try {
      const supabase = await createClient();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];

      // Get this month's date range
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
      const monthStartStr = monthStart.toISOString().split('T')[0];
      const monthEndStr = monthEnd.toISOString().split('T')[0];

      // Get today's usage - use maybeSingle to handle no rows gracefully
      const { data: todayUsage, error: todayError } = await supabase
        .from('usage_tracking')
        .select('boards_used_count, ai_used_count')
        .eq('user_id', userId)
        .eq('date', todayStr)
        .maybeSingle();

      if (todayError) {
        console.error('Error fetching today usage:', todayError);
      }

      // Get monthly usage
      const { data: monthUsage, error: monthError } = await supabase
        .from('usage_tracking')
        .select('boards_used_count, ai_used_count')
        .eq('user_id', userId)
        .gte('date', monthStartStr)
        .lte('date', monthEndStr);

      if (monthError) {
        console.error('Error fetching month usage:', monthError);
      }

      // Get total counts
      const { count: totalBoards } = await supabase
        .from('saved_generations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const boardsUsedToday = todayUsage?.boards_used_count || 0;
      const aiUsedToday = todayUsage?.ai_used_count || 0;
      const boardsUsedMonth = monthUsage?.reduce((sum, row) => sum + (row.boards_used_count || 0), 0) || 0;
      const aiUsedMonth = monthUsage?.reduce((sum, row) => sum + (row.ai_used_count || 0), 0) || 0;

      const stats: UsageStats = {
        boardsUsedToday,
        boardsUsedMonth,
        aiUsedToday,
        aiUsedMonth,
        totalBoards: totalBoards || 0,
        totalAI: aiUsedMonth,
      };

      await cachingService.setCachedUsage(userId, stats);
      return stats;
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      return {
        boardsUsedToday: 0,
        boardsUsedMonth: 0,
        aiUsedToday: 0,
        aiUsedMonth: 0,
        totalBoards: 0,
        totalAI: 0,
      };
    }
  }

  async incrementBoardUsage(userId: string): Promise<void> {
    try {
      const supabase = await createClient();
      const today = new Date().toISOString().split('T')[0];

      const { error } = await supabase.rpc('increment_board_usage', {
        p_user_id: userId,
        p_date: today,
      });

      if (error) {
        throw new Error(`Failed to increment board usage: ${error.message}`);
      }

      await cachingService.invalidateUsageCache(userId);
    } catch (error) {
      console.error('Error incrementing board usage:', error);
      // Non-fatal — don't block the save operation
    }
  }

  async incrementAIUsage(userId: string): Promise<void> {
    try {
      const supabase = await createClient();
      const today = new Date().toISOString().split('T')[0];

      const { error } = await supabase.rpc('increment_ai_usage', {
        p_user_id: userId,
        p_date: today,
      });

      if (error) {
        throw new Error(`Failed to increment AI usage: ${error.message}`);
      }

      await cachingService.invalidateUsageCache(userId);
    } catch (error) {
      console.error('Error incrementing AI usage:', error);
      // Non-fatal — don't block the AI operation
    }
  }

  async canCreateBoard(userId: string): Promise<boolean> {
    try {
      const limits = await this.getUserLimits(userId);
      const usage = await this.getUserUsage(userId);

      return usage.boardsUsedToday < limits.dailyBoardLimit &&
        usage.boardsUsedMonth < limits.monthlyBoardLimit;
    } catch (error) {
      console.error('Error checking board limit:', error);
      return true;
    }
  }

  async canUseAI(userId: string): Promise<boolean> {
    try {
      const limits = await this.getUserLimits(userId);
      const usage = await this.getUserUsage(userId);

      return usage.aiUsedToday < limits.dailyAILimit &&
        usage.aiUsedMonth < limits.monthlyAILimit;
    } catch (error) {
      console.error('Error checking AI limit:', error);
      return true;
    }
  }
}

export const usageService = new UsageService();
