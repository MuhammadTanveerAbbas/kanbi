"use client";

import { useTasksStore } from "@/hooks/use-tasks-store";
import TaskGenerator from "./ai/task-generator";
import KanbanBoard from "./board/kanban-board";
import ExportImport from "./board/export-import";
import Onboarding from "./onboarding";
import { NoTasksEmptyState } from "./empty-states";
import { AppLoadingSkeleton } from "./loading-states";
import { CheckCircle } from "lucide-react";
import { analytics } from "@/lib/analytics";
import { useEffect } from "react";

export default function Kanbi() {
  const store = useTasksStore();
  const hasTasks = store.tasks.length > 0;
  const completedTasks = store.tasks.filter(task => task.status === 'Done').length;

  // Track app usage
  useEffect(() => {
    analytics.track('app_loaded');
  }, []);

  const handleQuickAdd = () => {
    const title = prompt('What do you need to do?');
    if (title?.trim()) {
      store.addTask({ title: title.trim(), description: '' });
      analytics.trackTaskCreated(1);
    }
  };

  const handleFocusNotes = () => {
    const textarea = document.querySelector('textarea');
    textarea?.focus();
  };

  const handleShowExample = () => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (textarea) {
      textarea.value = `- Fix the login bug by Friday (urgent)
- Review marketing copy for homepage
- Schedule client call with John next week
- Update pricing page due Monday`;
      textarea.focus();
    }
  };

  // Show loading skeleton while initializing
  if (!store.isInitialized) {
    return <AppLoadingSkeleton />;
  }

  return (
    <>
      <Onboarding hasAnyTasks={hasTasks} />
      
      <div className="w-full max-w-7xl mx-auto space-y-6 p-1 sm:p-4">
        {/* Encouraging header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">What's On Your Mind?</h1>
          {hasTasks && (
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span>You have {store.tasks.length} things to do</span>
              {completedTasks > 0 && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    {completedTasks} finished ({Math.round((completedTasks / store.tasks.length) * 100)}%)
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Input section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2 space-y-4">
            <TaskGenerator addTask={store.addTask} />
          </div>
          <div className="lg:col-span-1">
            <ExportImport tasks={store.tasks} setTasks={store.setTasks} />
          </div>
        </div>

        {/* Board or empty state */}
        {hasTasks ? (
          <KanbanBoard store={store} />
        ) : (
          <NoTasksEmptyState onShowExample={handleShowExample} />
        )}

        {/* Celebration message */}
        {completedTasks > 0 && completedTasks === store.tasks.length && (
          <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">
              🎉 Nice work! You finished everything. Ready for more?
            </p>
          </div>
        )}

        {/* Save error warning */}
        {store.saveError && (
          <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-30">
            <div className="bg-destructive text-destructive-foreground p-3 rounded-lg text-sm">
              ⚠️ {store.saveError}
            </div>
          </div>
        )}
      </div>
    </>
  );
}