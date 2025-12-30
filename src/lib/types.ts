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