"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  FileText,
  CheckCircle,
  Play,
  Square,
  Download,
  Upload,
  Search,
} from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

function EmptyState({
  title,
  description,
  icon,
  action,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4">
      <div className="mb-6 flex justify-center">{icon}</div>
      <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
        {description}
      </p>
      <div className="flex flex-col gap-3 justify-center">
        {action && (
          <Button onClick={action.onClick} className="w-full sm:w-auto">
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button
            variant="outline"
            onClick={secondaryAction.onClick}
            className="w-full sm:w-auto"
          >
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}

// Main empty state - no tasks at all
export function NoTasksEmptyState({
  onShowExample,
}: {
  onShowExample: () => void;
}) {
  return (
    <div className="text-center py-16 px-4 border border-border rounded-lg bg-card/50 backdrop-blur-sm transition-all duration-300 hover:bg-card/70">
      <div className="mb-6 flex justify-center">
        <div className="p-3 rounded-lg bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Ready to get organized?
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
        Create your first task or import existing ones to get started.
      </p>
      <Button onClick={onShowExample} className="gap-2">
        <Sparkles className="h-4 w-4" />
        Show Example
      </Button>
    </div>
  );
}

// Column empty states
export function ColumnEmptyState({
  status,
}: {
  status: "To Do" | "In Progress" | "Done";
}) {
  const configs = {
    "To Do": {
      icon: (
        <div className="p-2 rounded-lg bg-muted/50 w-fit mx-auto mb-3">
          <Square className="h-6 w-6 text-muted-foreground" />
        </div>
      ),
      title: "No tasks yet",
      description:
        'Drag tasks here or click "Add Something Here" to get started.',
    },
    "In Progress": {
      icon: (
        <div className="p-2 rounded-lg bg-blue-500/10 w-fit mx-auto mb-3">
          <Play className="h-6 w-6 text-blue-400" />
        </div>
      ),
      title: "Nothing in progress",
      description: "Drag tasks here when you start working on them.",
    },
    Done: {
      icon: (
        <div className="p-2 rounded-lg bg-green-500/10 w-fit mx-auto mb-3">
          <CheckCircle className="h-6 w-6 text-green-400" />
        </div>
      ),
      title: "Nothing finished yet",
      description: "Completed tasks will appear here. You've got this!",
    },
  };

  const config = configs[status];

  return (
    <div className="text-center py-8 px-4 rounded-lg bg-muted/20 border border-border/50 transition-colors duration-200">
      {config.icon}
      <h4 className="text-sm font-medium text-foreground mb-1">
        {config.title}
      </h4>
      <p className="text-xs text-muted-foreground">{config.description}</p>
    </div>
  );
}

// No search results
export function NoSearchResultsEmptyState({
  searchTerm,
  onClearSearch,
}: {
  searchTerm: string;
  onClearSearch: () => void;
}) {
  return (
    <EmptyState
      icon={
        <div className="p-3 rounded-lg bg-muted/50">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
      }
      title="No tasks found"
      description={`No tasks match "${searchTerm}". Try a different search term or clear the search to see all tasks.`}
      action={{
        label: "Clear Search",
        onClick: onClearSearch,
      }}
    />
  );
}

// Import/Export empty states
export function NoDataToExportEmptyState() {
  return (
    <Card className="border-dashed border-border/50 bg-card/50">
      <CardContent className="p-8">
        <EmptyState
          icon={
            <div className="p-3 rounded-lg bg-muted/50">
              <Download className="h-8 w-8 text-muted-foreground" />
            </div>
          }
          title="Nothing to export yet"
          description="Create some tasks first, then you can save them to a file for backup or sharing."
        />
      </CardContent>
    </Card>
  );
}

export function ImportPromptEmptyState({ onImport }: { onImport: () => void }) {
  return (
    <Card className="border-dashed border-border/50 bg-card/50">
      <CardContent className="p-8">
        <EmptyState
          icon={
            <div className="p-3 rounded-lg bg-muted/50">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
          }
          title="Import your tasks"
          description="Have tasks saved in a file? Import them to get back to work quickly."
          action={{
            label: "Choose File",
            onClick: onImport,
          }}
        />
      </CardContent>
    </Card>
  );
}

// Error recovery empty state
export function ErrorRecoveryEmptyState({
  onRetry,
  onGoHome,
}: {
  onRetry: () => void;
  onGoHome: () => void;
}) {
  return (
    <EmptyState
      icon={
        <div className="p-3 rounded-lg bg-destructive/10">
          <FileText className="h-8 w-8 text-destructive" />
        </div>
      }
      title="Something went wrong"
      description="Don't worry - your tasks are safe. Let's try to get you back on track."
      action={{
        label: "Try Again",
        onClick: onRetry,
      }}
      secondaryAction={{
        label: "Go Home",
        onClick: onGoHome,
      }}
    />
  );
}
