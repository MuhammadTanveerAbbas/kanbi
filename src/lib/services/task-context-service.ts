import { createClient } from '@/lib/supabase/client';

export interface TaskCompletion {
  id: string;
  user_id: string;
  task_title: string;
  task_priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  time_spent_minutes: number;
  completed_at: string;
}

export interface WorkloadSnapshot {
  id: string;
  user_id: string;
  date: string;
  total_tasks: number;
  urgent_tasks: number;
  high_tasks: number;
  medium_tasks: number;
  low_tasks: number;
  estimated_hours: number;
  health_score: number;
}

export interface AIInsight {
  id: string;
  user_id: string;
  insight_type: 'workload' | 'pattern' | 'suggestion' | 'warning';
  message: string;
  metadata: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export class TaskContextService {
  private static supabase = createClient();

  static async trackCompletion(
    taskTitle: string,
    priority: 'Low' | 'Medium' | 'High' | 'Urgent',
    timeSpentMinutes: number = 60
  ): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await this.supabase
      .from('task_completions')
      .insert({
        user_id: user.id,
        task_title: taskTitle,
        task_priority: priority,
        time_spent_minutes: timeSpentMinutes,
      });

    if (error) throw error;
  }

  static async getAverageCompletionTime(priority: string): Promise<number> {
    const { data, error } = await this.supabase
      .rpc('get_avg_completion_time', { p_priority: priority });

    if (error) throw error;
    return data || 60;
  }

  static async getDailyTaskAverage(): Promise<number> {
    const { data, error } = await this.supabase.rpc('get_daily_task_average');
    if (error) throw error;
    return data || 0;
  }

  static async calculateWorkloadHealth(tasks: any[]): Promise<{
    healthScore: number;
    estimatedHours: number;
    isOverloaded: boolean;
    warnings: string[];
  }> {
    const priorityWeights = { Urgent: 2, High: 1.5, Medium: 1, Low: 0.5 };
    
    let totalHours = 0;
    const warnings: string[] = [];
    
    for (const task of tasks) {
      const avgTime = await this.getAverageCompletionTime(task.priority);
      totalHours += (avgTime / 60) * (priorityWeights[task.priority as keyof typeof priorityWeights] || 1);
    }

    const urgentCount = tasks.filter(t => t.priority === 'Urgent').length;
    const highCount = tasks.filter(t => t.priority === 'High').length;
    
    let healthScore = 100;
    
    if (totalHours > 8) {
      healthScore -= Math.min(30, (totalHours - 8) * 5);
      warnings.push(`Estimated ${totalHours.toFixed(1)} hours of work (>8 hours)`);
    }
    
    if (urgentCount > 3) {
      healthScore -= 20;
      warnings.push(`${urgentCount} urgent tasks (high stress)`);
    }
    
    if (urgentCount + highCount > 8) {
      healthScore -= 15;
      warnings.push(`${urgentCount + highCount} high-priority tasks`);
    }

    const isOverloaded = healthScore < 60;
    
    return {
      healthScore: Math.max(0, Math.round(healthScore)),
      estimatedHours: Math.round(totalHours * 10) / 10,
      isOverloaded,
      warnings,
    };
  }

  static async saveWorkloadSnapshot(
    tasks: any[],
    healthScore: number,
    estimatedHours: number
  ): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const counts = {
      urgent: tasks.filter(t => t.priority === 'Urgent').length,
      high: tasks.filter(t => t.priority === 'High').length,
      medium: tasks.filter(t => t.priority === 'Medium').length,
      low: tasks.filter(t => t.priority === 'Low').length,
    };

    const { error } = await this.supabase
      .from('workload_snapshots')
      .upsert({
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        total_tasks: tasks.length,
        urgent_tasks: counts.urgent,
        high_tasks: counts.high,
        medium_tasks: counts.medium,
        low_tasks: counts.low,
        estimated_hours: estimatedHours,
        health_score: healthScore,
      });

    if (error) throw error;
  }

  static async createInsight(
    type: 'workload' | 'pattern' | 'suggestion' | 'warning',
    message: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await this.supabase
      .from('ai_insights')
      .insert({
        user_id: user.id,
        insight_type: type,
        message,
        metadata,
      });

    if (error) throw error;
  }

  static async getUnreadInsights(): Promise<AIInsight[]> {
    const { data, error } = await this.supabase
      .from('ai_insights')
      .select('*')
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
  }

  static async markInsightAsRead(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('ai_insights')
      .update({ is_read: true })
      .eq('id', id);

    if (error) throw error;
  }

  static async getRecentCompletions(limit: number = 30): Promise<TaskCompletion[]> {
    const { data, error } = await this.supabase
      .from('task_completions')
      .select('*')
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  static async getWorkloadHistory(days: number = 7): Promise<WorkloadSnapshot[]> {
    const { data, error } = await this.supabase
      .from('workload_snapshots')
      .select('*')
      .gte('date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}
