'use client';

import { useState, useRef } from 'react';
import { Suspense } from 'react';
import ActionBoard from '@/components/action-board';
import { ErrorBoundary } from '@/components/error-boundary';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import BoardTemplates from '@/components/dashboard/board-templates';
import { Task, TaskStatus, TaskPriority } from '@/lib/types';

function BoardSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="text-center space-y-4">
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin" />
          <div className="absolute inset-2 border-2 border-transparent border-t-primary/60 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.6s' }} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-primary">Loading Your Board</h2>
          <p className="text-sm text-muted-foreground">Preparing your tasks...</p>
        </div>
      </div>
    </div>
  );
}

// Map template status and priority to proper types
const statusMap: Record<string, TaskStatus> = {
  'todo': 'To Do',
  'in-progress': 'In Progress',
  'done': 'Done',
};

const priorityMap: Record<string, TaskPriority> = {
  'low': 'Low',
  'medium': 'Medium',
  'high': 'High',
  'urgent': 'Urgent',
};

export default function DashboardBoardPage() {
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateTasks, setTemplateTasks] = useState<Task[] | null>(null);

  const handleTemplateSelect = (template: any) => {
    // Convert template tasks to proper Task objects
    const tasks: Task[] = template.tasks.map((t: any, index: number) => ({
      id: `task-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
      title: t.title,
      description: t.description || '',
      status: statusMap[t.status] || 'To Do',
      priority: priorityMap[t.priority] || 'Medium',
      createdAt: new Date().toISOString(),
    }));

    // Store tasks in localStorage to be picked up by the board
    localStorage.setItem('kanbi-tasks', JSON.stringify(tasks));

    // Force a page reload to load the new tasks
    window.location.reload();

    setShowTemplates(false);
  };

  return (
    <ErrorBoundary>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Kanban Board</h1>
          <Button onClick={() => setShowTemplates(true)} variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Use Template
          </Button>
        </div>

        <Suspense fallback={<BoardSkeleton />}>
          <ActionBoard />
        </Suspense>

        <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Choose a Template</DialogTitle>
            </DialogHeader>
            <BoardTemplates onSelect={handleTemplateSelect} />
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  );
}

