'use client';

import { Suspense } from 'react';
import ActionBoard from '@/components/action-board';
import { ErrorBoundary } from '@/components/error-boundary';
import { Skeleton } from '@/components/ui/skeleton';

function BoardSkeleton() {
  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <Skeleton className="h-8 w-32 mx-auto mb-4" />
        <Skeleton className="h-4 w-96 mx-auto" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="lg:col-span-1">
          <Skeleton className="h-64 w-full" />
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