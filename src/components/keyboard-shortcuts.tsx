'use client';

import { useEffect } from 'react';
import { useTasksStore } from '@/hooks/use-tasks-store';

interface KeyboardShortcutsProps {
  onQuickAdd?: () => void;
  onFocusNotes?: () => void;
}

export default function KeyboardShortcuts({ onQuickAdd, onFocusNotes }: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl/Cmd + N: Quick add task
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        onQuickAdd?.();
      }

      // Ctrl/Cmd + /: Focus notes area
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        onFocusNotes?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onQuickAdd, onFocusNotes]);

  return null;
}