'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Sparkles, 
  FileText, 
  CheckCircle, 
  Play, 
  Square,
  Download,
  Upload,
  Search
} from 'lucide-react';

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

function EmptyState({ title, description, icon, action, secondaryAction }: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4">
      <div className="mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
        {description}
      </p>
      <div className="space-y-2">
        {action && (
          <Button onClick={action.onClick}>
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button variant="outline" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}

// Main empty state - no tasks at all
export function NoTasksEmptyState({ onShowExample }: { onShowExample: () => void }) {
  return (
    <div className="text-center py-20 border-2 border-dashed rounded-lg transition-all" style={{backgroundColor: '#141414'}}>
      <div>
        <Sparkles className="mx-auto h-12 w-12 text-primary mb-4" />
      </div>
      <h3 className="text-lg font-medium mb-2">Ready to get organized?</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
        Paste your meeting notes, random ideas, or thoughts above and I'll turn them into tasks you can actually track.
      </p>
    </div>
  );
}

// Column empty states
export function ColumnEmptyState({ status }: { status: 'To Do' | 'In Progress' | 'Done' }) {
  const configs = {
    'To Do': {
      icon: <Square className="h-8 w-8 text-slate-500 opacity-50" />,
      title: 'No tasks yet',
      description: 'Drag tasks here or click "Add Something Here" to get started.'
    },
    'In Progress': {
      icon: <Play className="h-8 w-8 text-blue-500 opacity-50" />,
      title: 'Nothing in progress',
      description: 'Drag tasks here when you start working on them.'
    },
    'Done': {
      icon: <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />,
      title: 'Nothing finished yet',
      description: 'Completed tasks will appear here. You\'ve got this!'
    }
  };

  const config = configs[status];

  return (
    <div className="text-center py-8 rounded-lg bg-muted/30">
      {config.icon}
      <p className="text-sm text-muted-foreground mt-2">{config.description}</p>
    </div>
  );
}

// No search results
export function NoSearchResultsEmptyState({ searchTerm, onClearSearch }: { 
  searchTerm: string; 
  onClearSearch: () => void; 
}) {
  return (
    <EmptyState
      icon={<Search className="h-10 w-10 text-muted-foreground mx-auto" />}
      title="No tasks found"
      description={`No tasks match "${searchTerm}". Try a different search term or clear the search to see all tasks.`}
      action={{
        label: 'Clear Search',
        onClick: onClearSearch
      }}
    />
  );
}

// Import/Export empty states
export function NoDataToExportEmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="p-6">
        <EmptyState
          icon={<Download className="h-8 w-8 text-muted-foreground mx-auto" />}
          title="Nothing to export yet"
          description="Create some tasks first, then you can save them to a file for backup or sharing."
        />
      </CardContent>
    </Card>
  );
}

export function ImportPromptEmptyState({ onImport }: { onImport: () => void }) {
  return (
    <Card className="border-dashed">
      <CardContent className="p-6">
        <EmptyState
          icon={<Upload className="h-8 w-8 text-muted-foreground mx-auto" />}
          title="Import your tasks"
          description="Have tasks saved in a file? Import them to get back to work quickly."
          action={{
            label: 'Choose File',
            onClick: onImport
          }}
        />
      </CardContent>
    </Card>
  );
}

// Error recovery empty state
export function ErrorRecoveryEmptyState({ onRetry, onGoHome }: { 
  onRetry: () => void; 
  onGoHome: () => void; 
}) {
  return (
    <EmptyState
      icon={<FileText className="h-10 w-10 text-muted-foreground mx-auto" />}
      title="Something went wrong"
      description="Don't worry - your tasks are safe. Let's try to get you back on track."
      action={{
        label: 'Try Again',
        onClick: onRetry
      }}
      secondaryAction={{
        label: 'Go Home',
        onClick: onGoHome
      }}
    />
  );
}