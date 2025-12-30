'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';

export function AppLoadingSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 p-4">
      <div className="text-center space-y-4">
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

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

export function BoardLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {['To Do', 'Working On', 'Finished'].map((column) => (
        <Card key={column}>
          <CardHeader className="pb-3">
            <div className="h-5 w-20 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 border rounded-lg">
                <div className="h-4 w-full bg-muted rounded animate-pulse mb-2" />
                <div className="h-3 w-3/4 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

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