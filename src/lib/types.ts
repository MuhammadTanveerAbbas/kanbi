export type TaskStatus = 'To Do' | 'In Progress' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type Task = {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  tags?: string[];
  createdAt: string;
};

export const KANBAN_COLUMNS: TaskStatus[] = ['To Do', 'In Progress', 'Done'];
export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  Low: 'text-blue-500 bg-blue-500/10',
  Medium: 'text-yellow-500 bg-yellow-500/10',
  High: 'text-orange-500 bg-orange-500/10',
  Urgent: 'text-red-500 bg-red-500/10'
};

// AI Workload Types
export interface WorkloadAnalysis {
  healthScore: number;
  totalTasks: number;
  estimatedHours: number;
  capacityHours: number;
  overloadHours: number;
  taskBreakdown: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
  insights: string[];
  suggestions: string[];
  status: 'healthy' | 'busy' | 'overloaded' | 'critical';
}

export interface UserPattern {
  avgTasksPerDay: number;
  avgCompletionTime: Record<TaskPriority, number>;
  totalCompletions: number;
}

// Enhanced Task Extraction Types
export interface ExtractedTask {
  task: string;
  owner: string;
  deadline: string;
  priority?: string;
  confidence: number;
  isSubtask?: boolean;
  parentTask?: string;
  dependencies?: string[];
}

export interface TaskDuplicate {
  task1: string;
  task2: string;
  similarity: number;
}

export interface ExtractionMetadata {
  model: string;
  tokens: number;
  processingTime: number;
  fallbackUsed: boolean;
}

export interface TaskExtractionResult {
  tasks: ExtractedTask[];
  duplicates: TaskDuplicate[];
  qualityScore: number;
  extractionMetadata: ExtractionMetadata;
}

// Enhanced Workload Analysis Types
export interface BurnoutRisk {
  level: 'low' | 'moderate' | 'high' | 'critical';
  score: number;
  consecutiveOverloadDays: number;
  overloadHours: number;
}

export interface DeadlineCluster {
  date: string;
  taskCount: number;
  isHighRisk: boolean;
}

export interface EnhancedWorkloadAnalysis extends WorkloadAnalysis {
  burnoutRisk: BurnoutRisk;
  deadlineClusters: DeadlineCluster[];
  contextSwitchingCost: number;
  userCapacity: number;
}