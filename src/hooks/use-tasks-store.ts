'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Task, TaskStatus, TaskPriority } from '@/lib/types';
import { analytics } from '@/lib/analytics';

export function useTasksStore() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync task stats to Supabase (debounced)
  const syncToSupabase = useCallback((currentTasks: Task[]) => {
    // Clear any pending sync
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Debounce sync to avoid too many API calls
    syncTimeoutRef.current = setTimeout(async () => {
      try {
        const stats = {
          urgent: currentTasks.filter(t => t.priority === 'Urgent').length,
          high: currentTasks.filter(t => t.priority === 'High').length,
          medium: currentTasks.filter(t => t.priority === 'Medium').length,
          low: currentTasks.filter(t => t.priority === 'Low').length,
          total: currentTasks.length,
          completed: currentTasks.filter(t => t.status === 'Done').length,
        };

        await fetch('/api/sync-task-stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(stats),
        });
      } catch (error) {
        console.error('Failed to sync stats to Supabase:', error);
      }
    }, 500);
  }, []);

  // Load tasks from localStorage on mount
  useEffect(() => {
    const loadTasks = () => {
      try {
        const storedTasks = localStorage.getItem('kanbi-tasks');
        if (storedTasks) {
          const parsedTasks = JSON.parse(storedTasks);
          // Validate task structure
          if (Array.isArray(parsedTasks)) {
            setTasks(parsedTasks);
            analytics.track('tasks_loaded', { count: parsedTasks.length });
            // Sync initial stats
            syncToSupabase(parsedTasks);
          }
        }
      } catch (error) {
        console.error('Failed to load tasks:', error);
        analytics.trackError('Failed to load tasks from localStorage');
        // Don't show error to user for loading - just start fresh
      }
      setIsInitialized(true);
    };

    // Use requestIdleCallback for better performance
    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadTasks);
    } else {
      setTimeout(loadTasks, 0);
    }
  }, [syncToSupabase]);

  // Save tasks to localStorage when tasks change
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem('kanbi-tasks', JSON.stringify(tasks));
        setSaveError(null);
        // Sync to Supabase
        syncToSupabase(tasks);
      } catch (error) {
        console.error('Failed to save tasks:', error);
        setSaveError('Unable to save changes. Storage may be full.');
        analytics.trackError('Failed to save tasks to localStorage');
      }
    }
  }, [tasks, isInitialized, syncToSupabase]);

  const addTask = useCallback((task: Omit<Task, 'id' | 'status' | 'createdAt'>) => {
    try {
      const newTask: Task = {
        ...task,
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: 'To Do',
        createdAt: new Date().toISOString(),
      };
      setTasks(prev => [newTask, ...prev]);
      analytics.trackTaskCreated(1);
      return newTask;
    } catch (error) {
      console.error('Failed to add task:', error);
      analytics.trackError('Failed to add task');
      throw new Error('Failed to add task');
    }
  }, []);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    try {
      setTasks(prev =>
        prev.map(task => {
          if (task.id === taskId) {
            const updatedTask = { ...task, ...updates };

            // Track completion
            if (updates.status === 'Done' && task.status !== 'Done') {
              analytics.trackTaskCompleted();
            }

            return updatedTask;
          }
          return task;
        })
      );
    } catch (error) {
      console.error('Failed to update task:', error);
      analytics.trackError('Failed to update task');
      throw new Error('Failed to update task');
    }
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    try {
      setTasks(prev => prev.filter(task => task.id !== taskId));
      analytics.track('task_deleted');
    } catch (error) {
      console.error('Failed to delete task:', error);
      analytics.trackError('Failed to delete task');
      throw new Error('Failed to delete task');
    }
  }, []);

  const moveTask = useCallback((taskId: string, newStatus: TaskStatus) => {
    try {
      updateTask(taskId, { status: newStatus });
      analytics.track('task_moved', { to: newStatus });
    } catch (error) {
      console.error('Failed to move task:', error);
      analytics.trackError('Failed to move task');
      throw new Error('Failed to move task');
    }
  }, [updateTask]);

  return {
    tasks,
    setTasks,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    isInitialized,
    saveError,
  };
}
