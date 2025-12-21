'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';

// App loading skeleton
export function AppLoadingSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 p-4">
      <div className="text-center">
        <Skeleton className="h-8 w-48 mx-auto mb-2" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Task generation loading
export function TaskGenerationLoading() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <div className="relative">
          <Sparkles className="h-8 w-8 text-primary mx-auto animate-pulse" />
          <Loader2 className="h-4 w-4 text-primary/60 absolute -top-1 -right-1 animate-spin" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Finding your tasks...</p>
          <p className="text-xs text-muted-foreground">This usually takes a few seconds</p>
        </div>
      </div>
    </div>
  );
}

// Board loading skeleton
export function BoardLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {['To Do', 'Working On', 'Finished'].map((column) => (
        <Card key={column}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 border rounded-lg">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
            <Skeleton className="h-10 w-full border-dashed" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Data operation loading
export function DataOperationLoading({ operation }: { operation: string }) {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{operation}...</span>
      </div>
    </div>
  );
}

// Page transition loading
export function PageTransitionLoading() {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 text-primary mx-auto animate-spin" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}