import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WorkloadAnalyzer } from '@/lib/ai/workload-analyzer';
import { analyzeWorkloadSchema } from '@/lib/validation/schemas';
import { ValidationError, AuthError, DatabaseError } from '@/lib/errors/AppError';
import { logger } from '@/lib/logging/logger';
import { rateLimit, rateLimitResponse, addRateLimitHeaders } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const limitResult = await rateLimit(request, { maxRequests: 20, windowMs: 60000 });
  if (!limitResult.success) return rateLimitResponse(limitResult.limit, limitResult.remaining, limitResult.reset);

  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new AuthError();
    }

    logger.info('Analyze workload request', { userId: user.id, requestId });

    const body = await request.json();
    const validated = analyzeWorkloadSchema.parse(body);

    const userPattern = await fetchUserPattern(supabase, user.id);
    const consecutiveOverloadDays = await fetchConsecutiveOverloadDays(supabase, user.id);

    // Analyze workload with user capacity
    const analysis = WorkloadAnalyzer.analyzeWorkload(
      validated.tasks,
      userPattern,
      validated.userCapacity || 6,
      consecutiveOverloadDays
    );

    await saveWorkloadSnapshot(supabase, user.id, analysis);

    if (analysis.status !== 'healthy' && analysis.suggestions.length > 0) {
      await saveInsight(supabase, user.id, analysis);
    }

    logger.info('Analyze workload success', {
      userId: user.id,
      requestId,
      healthScore: analysis.healthScore,
      burnoutRisk: analysis.burnoutRisk.level,
    });

    const response = NextResponse.json(analysis);
    return addRateLimitHeaders(response, limitResult.limit, limitResult.remaining, limitResult.reset);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      const validationError = new ValidationError(error.errors?.[0]?.message || 'Invalid request data');
      logger.error('Validation error', { requestId, errorId: validationError.errorId });
      return NextResponse.json(validationError.toJSON(), { status: validationError.statusCode });
    }

    if (error instanceof AuthError) {
      logger.warn('Auth error', { requestId, errorId: error.errorId });
      return NextResponse.json(error.toJSON(), { status: error.statusCode });
    }

    logger.error('Workload analysis error', { requestId, error: error.message });
    return NextResponse.json(
      {
        error: 'Failed to analyze workload',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
        errorId: requestId,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/** Counts consecutive days where health_score < 50 to feed burnout risk calculation. */
async function fetchConsecutiveOverloadDays(supabase: any, userId: string): Promise<number> {
  try {
    const { data } = await supabase
      .from('workload_snapshots')
      .select('date, health_score')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(30);

    if (!data || data.length === 0) return 0;

    let consecutive = 0;
    for (const snapshot of data) {
      if (snapshot.health_score < 50) {
        consecutive++;
      } else {
        break;
      }
    }

    return consecutive;
  } catch (error) {
    logger.error('Error fetching consecutive overload days', { userId, error });
    return 0;
  }
}

/** Builds a UserPattern from the last 30 days of task completions for personalized time estimates. */
async function fetchUserPattern(supabase: any, userId: string) {
  try {
    // Get total completions
    const { count: totalCompletions } = await supabase
      .from('task_completions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (!totalCompletions || totalCompletions === 0) {
      return undefined;
    }

    // Get daily average
    const { data: dailyAvg } = await supabase.rpc('get_daily_task_average', {
      p_user_id: userId,
    });

    // Get average completion times by priority
    const { data: completions } = await supabase
      .from('task_completions')
      .select('task_priority, time_spent_minutes')
      .eq('user_id', userId)
      .gte('completed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const avgCompletionTimes: Record<string, number> = {};
    if (completions && completions.length > 0) {
      const grouped = completions.reduce((acc: any, curr: any) => {
        if (!acc[curr.task_priority]) acc[curr.task_priority] = [];
        acc[curr.task_priority].push(curr.time_spent_minutes);
        return acc;
      }, {});

      Object.keys(grouped).forEach(priority => {
        const times = grouped[priority];
        avgCompletionTimes[priority] = Math.round(
          times.reduce((sum: number, t: number) => sum + t, 0) / times.length
        );
      });
    }

    return WorkloadAnalyzer.parseUserPattern({
      avgTasksPerDay: dailyAvg || 0,
      avgCompletionTimes,
      totalCompletions,
    });
  } catch (error) {
    logger.error('Error fetching user pattern', { userId, error });
    return undefined;
  }
}

async function saveWorkloadSnapshot(supabase: any, userId: string, analysis: any) {
  try {
    await supabase
      .from('workload_snapshots')
      .upsert({
        user_id: userId,
        date: new Date().toISOString().split('T')[0],
        total_tasks: analysis.totalTasks,
        urgent_tasks: analysis.taskBreakdown.urgent,
        high_tasks: analysis.taskBreakdown.high,
        medium_tasks: analysis.taskBreakdown.medium,
        low_tasks: analysis.taskBreakdown.low,
        estimated_hours: analysis.estimatedHours,
        health_score: analysis.healthScore,
      }, {
        onConflict: 'user_id,date',
      });
  } catch (error) {
    logger.error('Error saving workload snapshot', { userId, error });
  }
}

async function saveInsight(supabase: any, userId: string, analysis: any) {
  try {
    const message = analysis.suggestions[0];
    
    await supabase
      .from('ai_insights')
      .insert({
        user_id: userId,
        insight_type: analysis.status === 'critical' ? 'warning' : 'suggestion',
        message,
        metadata: {
          health_score: analysis.healthScore,
          total_tasks: analysis.totalTasks,
          estimated_hours: analysis.estimatedHours,
          burnout_risk: analysis.burnoutRisk.level,
        },
      });
  } catch (error) {
    logger.error('Error saving insight', { userId, error });
  }
}
