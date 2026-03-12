"use client";

import { useTasksStore } from "@/hooks/use-tasks-store";
import TaskGenerator from "./ai/task-generator";
import KanbanBoard from "./board/kanban-board";
import ExportImport from "./board/export-import";
import SaveBoardButton from "./board/save-board-button";
import Onboarding from "./onboarding";
import { NoTasksEmptyState } from "./empty-states";
import { AppLoadingSkeleton } from "./loading-states";
import { CheckCircle, AlertCircle, AlertTriangle } from "lucide-react";
import { analytics } from "@/lib/analytics";
import { useEffect, useRef, useState } from "react";
import { UsageStats } from "@/lib/dashboard-types";

export default function Kanbi() {
  const store = useTasksStore();
  const hasTasks = store.tasks.length > 0;
  const completedTasks = store.tasks.filter(task => task.status === 'Done').length;
  const hasTrackedUsage = useRef(false);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [limitExceeded, setLimitExceeded] = useState(false);

  // Track app usage and board usage
  useEffect(() => {
    analytics.track('app_loaded');

    // Track board usage once per session
    if (!hasTrackedUsage.current) {
      hasTrackedUsage.current = true;
      fetch('/api/track-board-usage', { method: 'POST' }).catch(console.error);
    }

    // Fetch usage stats to check limits
    const fetchUsage = async () => {
      try {
        const response = await fetch('/api/usage');
        if (response.ok) {
          const data = await response.json();
          setUsage(data);
          // Check if daily board limit is exceeded
          if (data.boardsUsedToday >= data.boardsTodayLimit) {
            setLimitExceeded(true);
          }
        }
      } catch (error) {
        console.error('Failed to fetch usage stats:', error);
      }
    };

    fetchUsage();
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

      <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6 p-2 sm:p-3 md:p-4">
        {/* Limit Exceeded Warning */}
        {limitExceeded && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-500 mb-1">Daily Board Limit Reached</h3>
              <p className="text-sm text-red-400">
                You have reached your daily limit of {usage?.boardsTodayLimit} boards. You can create {Math.max(0, (usage?.boardsMonthLimit || 300) - (usage?.boardsUsedMonth || 0))} more boards this month. Upgrade to Premium for higher limits or try again tomorrow.
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center space-y-2 sm:space-y-3 py-3 sm:py-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent px-2">
            Transform Notes Into Action
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-400 max-w-2xl mx-auto px-2">
            Paste your messy notes below and let AI organize them into a Kanban board
          </p>
          {hasTasks && (
            <div className="flex items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400 pt-1.5 sm:pt-2 flex-wrap">
              <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-[#1a1a1a] border border-[#262626] rounded-full">
                {store.tasks.length} tasks
              </span>
              {completedTasks > 0 && (
                <span className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  {completedTasks} done ({Math.round((completedTasks / store.tasks.length) * 100)}%)
                </span>
              )}
              <SaveBoardButton tasks={store.tasks} />
            </div>
          )}
        </div>

        {/* Input section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch">
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
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
          <div className="text-center p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl">
            <p className="text-lg font-semibold text-green-400 mb-2">
              Amazing! You've completed everything!
            </p>
            <p className="text-sm text-gray-400">
              Ready to tackle more? Add new tasks above.
            </p>
          </div>
        )}

        {/* Save error warning */}
        {store.saveError && (
          <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-30">
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm backdrop-blur-sm">
              <p className="font-semibold mb-1 flex items-center gap-2"><AlertCircle className="h-4 w-4" /> Save Error</p>
              <p className="text-xs text-gray-400">{store.saveError}</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
