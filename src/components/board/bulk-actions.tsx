'use client';

import { Button } from '@/components/ui/button';
import { Trash2, CheckCircle } from 'lucide-react';
import { useTasksStore } from '@/hooks/use-tasks-store';

export default function BulkActions() {
  const store = useTasksStore();
  const completedTasks = store.tasks.filter(task => task.status === 'Done');
  
  const handleClearCompleted = () => {
    if (confirm(`Delete ${completedTasks.length} completed tasks?`)) {
      completedTasks.forEach(task => store.deleteTask(task.id));
    }
  };

  if (completedTasks.length === 0) return null;

  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg mb-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <span>{completedTasks.length} completed tasks</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClearCompleted}
        className="text-red-600 hover:text-red-800"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Clear Completed
      </Button>
    </div>
  );
}
