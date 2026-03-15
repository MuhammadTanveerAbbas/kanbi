'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileJson, FileSpreadsheet, FileText } from 'lucide-react';
import { Task } from '@/lib/types';
import { exportToJSON, exportToCSV, exportToMarkdown } from '@/lib/export-utils';

interface ExportButtonProps {
  tasks: Task[];
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export default function ExportButton({ tasks, variant = 'outline', size = 'default', className }: ExportButtonProps) {
  if (tasks.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => exportToJSON(tasks)}>
          <FileJson className="h-4 w-4 mr-2 text-blue-500" />
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportToCSV(tasks)}>
          <FileSpreadsheet className="h-4 w-4 mr-2 text-green-500" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportToMarkdown(tasks)}>
          <FileText className="h-4 w-4 mr-2 text-purple-500" />
          Export as Markdown
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
