import { Task, TaskPriority, BurnoutRisk, DeadlineCluster, EnhancedWorkloadAnalysis, UserPattern } from '@/lib/types';

// Default time estimates (in minutes) by priority
const DEFAULT_TIME_ESTIMATES: Record<TaskPriority, number> = {
  Urgent: 120,  // 2 hours
  High: 90,     // 1.5 hours
  Medium: 60,   // 1 hour
  Low: 30,      // 30 mins
};

// Context switching cost per task (in minutes)
const CONTEXT_SWITCHING_COST = 15;

// Default daily capacity in hours
const DAILY_CAPACITY_HOURS = 6;

/**
 * Analyze user's current workload and generate insights
 */
export class WorkloadAnalyzer {
  /**
   * Calculate workload health score (0-100)
   * 100 = perfect workload
   * 80-99 = healthy
   * 50-79 = busy
   * 25-49 = overloaded
   * 0-24 = critical
   */
  static calculateHealthScore(
    estimatedHours: number,
    capacityHours: number = DAILY_CAPACITY_HOURS
  ): number {
    if (estimatedHours === 0) return 100;
    
    const ratio = estimatedHours / capacityHours;
    
    if (ratio <= 0.7) return 100; // Under 70% capacity = perfect
    if (ratio <= 1.0) return Math.round(100 - (ratio - 0.7) * 100); // 70-100% = 100-70 score
    if (ratio <= 1.5) return Math.round(70 - (ratio - 1.0) * 80); // 100-150% = 70-30 score
    if (ratio <= 2.0) return Math.round(30 - (ratio - 1.5) * 40); // 150-200% = 30-10 score
    
    return Math.max(0, Math.round(10 - (ratio - 2.0) * 10)); // 200%+ = 10-0 score
  }

  /**
   * Estimate time for a single task based on priority and user history
   */
  static estimateTaskTime(
    priority: TaskPriority,
    userPattern?: UserPattern
  ): number {
    if (userPattern?.avgCompletionTime[priority]) {
      return userPattern.avgCompletionTime[priority];
    }
    return DEFAULT_TIME_ESTIMATES[priority];
  }

  /**
   * Analyze current workload with enhanced features
   */
  static analyzeWorkload(
    tasks: Task[],
    userPattern?: UserPattern,
    userCapacity: number = 6,
    consecutiveOverloadDays: number = 0
  ): EnhancedWorkloadAnalysis {
    // Count tasks by priority
    const taskBreakdown = {
      urgent: tasks.filter(t => t.priority === 'Urgent').length,
      high: tasks.filter(t => t.priority === 'High').length,
      medium: tasks.filter(t => t.priority === 'Medium').length,
      low: tasks.filter(t => t.priority === 'Low').length,
    };

    // Calculate estimated hours
    let estimatedMinutes = 0;
    tasks.forEach(task => {
      const priority = task.priority || 'Medium';
      estimatedMinutes += this.estimateTaskTime(priority, userPattern);
    });
    
    // Add context switching cost
    const contextSwitchingCost = tasks.length > 1 ? (tasks.length - 1) * CONTEXT_SWITCHING_COST : 0;
    estimatedMinutes += contextSwitchingCost;
    const estimatedHours = Math.round((estimatedMinutes / 60) * 10) / 10;

    // Calculate health score
    const healthScore = this.calculateHealthScore(estimatedHours, userCapacity);
    const overloadHours = Math.max(0, estimatedHours - userCapacity);

    // Determine status
    let status: EnhancedWorkloadAnalysis['status'];
    if (healthScore >= 80) status = 'healthy';
    else if (healthScore >= 50) status = 'busy';
    else if (healthScore >= 25) status = 'overloaded';
    else status = 'critical';

    // Calculate burnout risk
    const burnoutRisk = this.calculateBurnoutRisk(consecutiveOverloadDays, overloadHours);

    // Detect deadline clustering
    const deadlineClusters = this.detectDeadlineClusters(tasks);

    // Generate insights
    const insights = this.generateInsights(
      tasks.length,
      estimatedHours,
      taskBreakdown,
      userPattern
    );

    // Generate suggestions
    const suggestions = this.generateSuggestions(
      status,
      overloadHours,
      taskBreakdown,
      tasks.length
    );

    return {
      healthScore,
      totalTasks: tasks.length,
      estimatedHours,
      capacityHours: userCapacity,
      overloadHours,
      taskBreakdown,
      insights,
      suggestions,
      status,
      burnoutRisk,
      deadlineClusters,
      contextSwitchingCost: Math.round((contextSwitchingCost / 60) * 10) / 10,
      userCapacity,
    };
  }

  /**
   * Calculate burnout risk based on consecutive overload days and overload hours
   */
  static calculateBurnoutRisk(consecutiveOverloadDays: number, overloadHours: number): BurnoutRisk {
    const score = (consecutiveOverloadDays * 0.3) + (overloadHours * 0.1);
    
    let level: BurnoutRisk['level'];
    if (score < 0.5) level = 'low';
    else if (score < 1.5) level = 'moderate';
    else if (score < 3.0) level = 'high';
    else level = 'critical';

    return {
      level,
      score: Math.round(score * 100) / 100,
      consecutiveOverloadDays,
      overloadHours,
    };
  }

  /**
   * Detect deadline clustering (≥2 tasks same day = high risk)
   */
  static detectDeadlineClusters(tasks: Task[]): DeadlineCluster[] {
    const dateMap = new Map<string, number>();
    
    tasks.forEach(task => {
      if (task.dueDate) {
        const date = task.dueDate.split('T')[0];
        dateMap.set(date, (dateMap.get(date) || 0) + 1);
      }
    });

    const clusters: DeadlineCluster[] = [];
    dateMap.forEach((count, date) => {
      if (count >= 2) {
        clusters.push({
          date,
          taskCount: count,
          isHighRisk: count >= 3,
        });
      }
    });

    return clusters.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Generate insights based on workload data
   */
  private static generateInsights(
    totalTasks: number,
    estimatedHours: number,
    taskBreakdown: EnhancedWorkloadAnalysis['taskBreakdown'],
    userPattern?: UserPattern
  ): string[] {
    const insights: string[] = [];

    // Task count insight
    if (userPattern?.avgTasksPerDay) {
      const diff = totalTasks - userPattern.avgTasksPerDay;
      if (diff > 3) {
        insights.push(`You have ${Math.round(diff)} more tasks than your daily average`);
      } else if (diff < -2) {
        insights.push(`Lighter day! ${Math.abs(Math.round(diff))} fewer tasks than usual`);
      } else {
        insights.push(`Normal workload: ${totalTasks} tasks (avg: ${Math.round(userPattern.avgTasksPerDay)})`);
      }
    } else {
      insights.push(`You have ${totalTasks} tasks today`);
    }

    // Time estimate insight
    insights.push(`Estimated time: ${estimatedHours} hours`);

    // Priority distribution insight
    if (taskBreakdown.urgent > 0) {
      insights.push(`${taskBreakdown.urgent} urgent task${taskBreakdown.urgent > 1 ? 's' : ''} need immediate attention`);
    }

    // Experience insight
    if (userPattern?.totalCompletions) {
      if (userPattern.totalCompletions < 10) {
        insights.push(`Building your profile... ${userPattern.totalCompletions} tasks completed`);
      } else if (userPattern.totalCompletions < 50) {
        insights.push(`Learning your patterns... ${userPattern.totalCompletions} tasks tracked`);
      }
    }

    return insights;
  }

  /**
   * Generate actionable suggestions
   */
  private static generateSuggestions(
    status: EnhancedWorkloadAnalysis['status'],
    overloadHours: number,
    taskBreakdown: EnhancedWorkloadAnalysis['taskBreakdown'],
    totalTasks: number
  ): string[] {
    const suggestions: string[] = [];

    if (status === 'critical') {
      suggestions.push(`⚠️ Critical overload! You're ${Math.round(overloadHours)}h over capacity`);
      suggestions.push(`Move ${Math.ceil(totalTasks * 0.5)} tasks to tomorrow or next week`);
      suggestions.push('Focus only on urgent tasks today');
    } else if (status === 'overloaded') {
      suggestions.push(`You're overcommitted by ${Math.round(overloadHours)} hours`);
      const tasksToMove = Math.ceil(overloadHours / 1.5);
      suggestions.push(`Consider moving ${tasksToMove} tasks to tomorrow`);
      if (taskBreakdown.low > 0) {
        suggestions.push(`Defer ${taskBreakdown.low} low-priority task${taskBreakdown.low > 1 ? 's' : ''}`);
      }
    } else if (status === 'busy') {
      suggestions.push('You have a full day ahead');
      if (taskBreakdown.urgent > 2) {
        suggestions.push('Start with urgent tasks first');
      } else {
        suggestions.push('Tackle high-priority tasks in the morning');
      }
    } else {
      suggestions.push('✅ You\'re on track! Good workload balance');
      if (totalTasks === 0) {
        suggestions.push('Add your tasks to get started');
      }
    }

    return suggestions;
  }

  /**
   * Get time estimate badge text for UI
   */
  static getTimeEstimateBadge(
    priority: TaskPriority,
    userPattern?: UserPattern
  ): string {
    const minutes = this.estimateTaskTime(priority, userPattern);
    const hours = minutes / 60;
    
    if (hours >= 1) {
      return `~${Math.round(hours * 10) / 10}h`;
    }
    return `~${minutes}m`;
  }

  /**
   * Parse user pattern from database results
   */
  static parseUserPattern(data: {
    avgTasksPerDay?: number;
    avgCompletionTimes?: Record<string, number>;
    totalCompletions?: number;
  }): UserPattern | undefined {
    if (!data.totalCompletions) return undefined;

    return {
      avgTasksPerDay: data.avgTasksPerDay || 0,
      avgCompletionTime: {
        Urgent: data.avgCompletionTimes?.['Urgent'] || DEFAULT_TIME_ESTIMATES.Urgent,
        High: data.avgCompletionTimes?.['High'] || DEFAULT_TIME_ESTIMATES.High,
        Medium: data.avgCompletionTimes?.['Medium'] || DEFAULT_TIME_ESTIMATES.Medium,
        Low: data.avgCompletionTimes?.['Low'] || DEFAULT_TIME_ESTIMATES.Low,
      },
      totalCompletions: data.totalCompletions,
    };
  }
}
