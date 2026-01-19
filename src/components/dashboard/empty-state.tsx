import { Button } from '@/components/ui/button';
import { FileQuestion, Plus } from 'lucide-react';
import Link from 'next/link';

export function EmptyState({ 
  title, 
  description, 
  action, 
  actionLabel 
}: { 
  title: string; 
  description: string; 
  action?: string; 
  actionLabel?: string; 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <FileQuestion className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">{description}</p>
      {action && actionLabel && (
        <Button asChild>
          <Link href={action}>
            <Plus className="h-4 w-4 mr-2" />
            {actionLabel}
          </Link>
        </Button>
      )}
    </div>
  );
}
