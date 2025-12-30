'use client';

import { Suspense } from 'react';
import ActionBoard from '@/components/action-board';
import { ErrorBoundary } from '@/components/error-boundary';

function BoardSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
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

export default function BoardPage() {
  return (
    <ErrorBoundary>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <Suspense fallback={<BoardSkeleton />}>
            <ActionBoard />
          </Suspense>
        </div>
      </div>
    </ErrorBoundary>
  );
}