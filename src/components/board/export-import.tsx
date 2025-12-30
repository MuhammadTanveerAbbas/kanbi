'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, CheckCircle, AlertCircle, BarChart3, Target, Clock } from 'lucide-react';
import { Task } from '@/lib/types';

interface TaskStatsProps {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
}

export default function TaskStats({ tasks, setTasks }: TaskStatsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const todoTasks = tasks.filter(t => t.status === 'To Do');
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress');
  const doneTasks = tasks.filter(t => t.status === 'Done');
  const completionRate = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setError('Need a .json file');
      setTimeout(() => setError(null), 3000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedTasks = JSON.parse(content);
        
        if (!Array.isArray(importedTasks)) throw new Error('Invalid file');
        
        const isValid = importedTasks.every(task => 
          task.id && task.title && task.status && 
          ['To Do', 'In Progress', 'Done'].includes(task.status)
        );
        
        if (!isValid) throw new Error('Invalid tasks');
        
        if (tasks.length > 0 && !confirm(`Replace ${tasks.length} tasks with ${importedTasks.length} from file?`)) {
          return;
        }
        
        setTasks(importedTasks);
        setSuccess(`Loaded ${importedTasks.length} tasks`);
        setTimeout(() => setSuccess(null), 3000);
      } catch (error) {
        setError('Invalid file');
        setTimeout(() => setError(null), 3000);
      }
    };
    
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {success && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              Completion
            </span>
            <span className="font-medium">{completionRate}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${completionRate}%` }} />
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded border">
            <div className="text-lg font-bold">{todoTasks.length}</div>
            <div className="text-xs text-muted-foreground">To Do</div>
          </div>
          <div className="p-2 rounded border">
            <div className="text-lg font-bold">{inProgressTasks.length}</div>
            <div className="text-xs text-muted-foreground">Working</div>
          </div>
          <div className="p-2 rounded border">
            <div className="text-lg font-bold">{doneTasks.length}</div>
            <div className="text-xs text-muted-foreground">Done</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Button 
            onClick={() => {
              if (doneTasks.length > 0) {
                setTasks(tasks.filter(t => t.status !== 'Done'));
                setSuccess(`Removed ${doneTasks.length} tasks`);
                setTimeout(() => setSuccess(null), 3000);
              }
            }}
            variant="outline" 
            className="w-full"
            disabled={doneTasks.length === 0}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Clear Done ({doneTasks.length})
          </Button>
          
          <Button 
            onClick={() => {
              if (confirm(`Delete all ${tasks.length} tasks?`)) {
                setTasks([]);
              }
            }}
            variant="outline" 
            className="w-full text-red-600"
            disabled={tasks.length === 0}
          >
            Clear All
          </Button>
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            Import Tasks
          </Button>
        </div>
        
        {tasks.length > 0 && (
          <div className="text-center p-2 bg-muted/50 rounded text-xs text-muted-foreground">
            <Clock className="h-3 w-3 inline mr-1" />
            {tasks.length} tasks • {new Date().toLocaleDateString()}
          </div>
        )}
        
        <Input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}