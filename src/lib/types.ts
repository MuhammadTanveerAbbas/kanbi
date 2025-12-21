export type TaskStatus = 'To Do' | 'In Progress' | 'Done';

export type Task = {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  createdAt: string;
};

export const KANBAN_COLUMNS: TaskStatus[] = ['To Do', 'In Progress', 'Done'];