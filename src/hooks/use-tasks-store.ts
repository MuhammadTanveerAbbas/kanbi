'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Task, TaskStatus, TaskPriority } from '@/lib/types';
import { analytics } from '@/lib/analytics';
import { createClient } from '@/lib/supabase/client';
import { RealtimeService } from '@/lib/services/realtime-service';
import { AUTO_SAVE_DELAY } from '@/lib/constants';

export function useTasksStore() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [currentBoardId, setCurrentBoardId] = useState<string | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();

  const autoSaveToSupabase = useCallback(async (currentTasks: Task[]) => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        if (!currentBoardId) return;

        const response = await fetch(`/api/boards/${currentBoardId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: JSON.stringify(currentTasks) }),
        });

        if (!response.ok) throw new Error('Auto-save failed');
        setSaveError(null);
      } catch (error) {
        console.error('Auto-save error:', error);
        setSaveError('Auto-save failed');
      }
    }, AUTO_SAVE_DELAY);
  }, [currentBoardId]);

  const syncTaskStats = useCallback(async (currentTasks: Task[]) => {
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
      console.error('Failed to sync stats:', error);
    }
  }, []);

  // Subscribe to Supabase Realtime for multi-tab sync
  useEffect(() => {
    if (typeof window === 'undefined' || !currentBoardId) return;

    const unsubscribe = RealtimeService.subscribeToBoardChanges((payload) => {
      if (payload.eventType === 'UPDATE' && payload.new.id === currentBoardId) {
        try {
          const updatedTasks = JSON.parse(payload.new.content || '[]');
          setTasks(updatedTasks);
        } catch (error) {
          console.error('Failed to parse real-time update:', error);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentBoardId]);

  // Load from localStorage on mount; Supabase is the source of truth for saved boards
  useEffect(() => {
    const loadTasks = () => {
      try {
        const storedBoardId = localStorage.getItem('kanbi-current-board-id');
        const storedTasks = localStorage.getItem('kanbi-tasks');
        
        if (storedBoardId) {
          setCurrentBoardId(storedBoardId);
        }
        
        if (storedTasks) {
          const parsedTasks = JSON.parse(storedTasks);
          if (Array.isArray(parsedTasks)) {
            setTasks(parsedTasks);
            analytics.track('tasks_loaded', { count: parsedTasks.length });
            syncTaskStats(parsedTasks);
          }
        }
      } catch (error) {
        console.error('Failed to load tasks:', error);
        analytics.trackError('Failed to load tasks from localStorage');
      }
      setIsInitialized(true);
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadTasks);
    } else {
      setTimeout(loadTasks, 0);
    }
  }, [syncTaskStats]);

  useEffect(() => {
    if (isInitialized && tasks.length > 0) {
      try {
        localStorage.setItem('kanbi-tasks', JSON.stringify(tasks));
        autoSaveToSupabase(tasks);
        syncTaskStats(tasks);
      } catch (error) {
        console.error('Failed to save tasks:', error);
        setSaveError('Unable to save changes');
        analytics.trackError('Failed to save tasks');
      }
    }
  }, [tasks, isInitialized, autoSaveToSupabase, syncTaskStats]);

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
