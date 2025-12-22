'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Upload, CheckCircle, AlertCircle, BarChart3, Target, Clock, Archive } from 'lucide-react';
import { Task } from '@/lib/types';

interface TaskStatsProps {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
}

export default function TaskStats({ tasks, setTasks }: TaskStatsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [pendingImport, setPendingImport] = useState<Task[] | null>(null);

  const todoTasks = tasks.filter(t => t.status === 'To Do');
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress');
  const doneTasks = tasks.filter(t => t.status === 'Done');
  
  const completionRate = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;
  const activeRate = tasks.length > 0 ? Math.round((inProgressTasks.length / tasks.length) * 100) : 0;
  
  const getProductivityMessage = () => {
    if (tasks.length === 0) return "Start adding tasks to see your progress!";
    if (completionRate >= 80) return "🎉 Excellent progress! You're crushing it!";
    if (completionRate >= 60) return "💪 Great work! Keep the momentum going!";
    if (completionRate >= 40) return "📈 Good progress! You're on the right track!";
    if (completionRate >= 20) return "🚀 Getting started! Every task counts!";
    return "💡 Ready to tackle some tasks? You've got this!";
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setError('That file won\'t work. I need a .json file.');
      setTimeout(() => setError(null), 3000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedTasks = JSON.parse(content);
        
        if (!Array.isArray(importedTasks)) {
          throw new Error('This doesn\'t look like a task file');
        }
        
        const isValid = importedTasks.every(task => 
          task.id && task.title && task.status && 
          ['To Do', 'In Progress', 'Done'].includes(task.status)
        );
        
        if (!isValid) {
          throw new Error('This file has tasks I can\'t understand');
        }
        
        if (tasks.length > 0) {
          setPendingImport(importedTasks);
          setShowImportConfirm(true);
        } else {
          setTasks(importedTasks);
          setSuccess(`Loaded ${importedTasks.length} tasks from your file`);
          setTimeout(() => setSuccess(null), 3000);
        }
        
      } catch (error) {
        setError('Something\'s wrong with that file. Try a different one?');
        setTimeout(() => setError(null), 3000);
      }
    };
    
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const confirmImport = () => {
    if (pendingImport) {
      setTasks(pendingImport);
      setSuccess(`Loaded ${pendingImport.length} tasks from your file`);
      setTimeout(() => setSuccess(null), 3000);
      setPendingImport(null);
    }
    setShowImportConfirm(false);
  };

  return (
    <>
      <Card className="h-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 flex flex-col justify-between flex-1">
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
          
          <div className="space-y-4">
            {/* Completion Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  Completion Rate
                </span>
                <span className="font-medium">{completionRate}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>
            
            {/* Task Breakdown */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded border border-muted-foreground/20" style={{backgroundColor: '#141414'}}>
                <div className="text-lg font-bold text-muted-foreground">{todoTasks.length}</div>
                <div className="text-xs text-muted-foreground">To Do</div>
              </div>
              <div className="p-2 rounded border border-muted-foreground/20" style={{backgroundColor: '#141414'}}>
                <div className="text-lg font-bold text-muted-foreground">{inProgressTasks.length}</div>
                <div className="text-xs text-muted-foreground">In Progress</div>
              </div>
              <div className="p-2 rounded border border-muted-foreground/20" style={{backgroundColor: '#141414'}}>
                <div className="text-lg font-bold text-muted-foreground">{doneTasks.length}</div>
                <div className="text-xs text-muted-foreground">Done</div>
              </div>
            </div>
            
            {/* Productivity Message */}
            <div className="text-center p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm font-medium text-primary">{getProductivityMessage()}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={() => {
                const completedTasks = tasks.filter(t => t.status === 'Done');
                if (completedTasks.length > 0) {
                  const updatedTasks = tasks.filter(t => t.status !== 'Done');
                  setTasks(updatedTasks);
                  setSuccess(`Removed ${completedTasks.length} completed tasks!`);
                  setTimeout(() => setSuccess(null), 3000);
                } else {
                  setError('No completed tasks to remove');
                  setTimeout(() => setError(null), 3000);
                }
              }}
              variant="outline" 
              className="w-full"
              disabled={doneTasks.length === 0}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Clear Completed ({doneTasks.length})
            </Button>
            
            <Button 
              onClick={() => setTasks([])} 
              variant="outline" 
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
              disabled={tasks.length === 0}
            >
              Clear All Tasks
            </Button>
          </div>
          
          {tasks.length > 0 && (
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">{tasks.length} total tasks</p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          )}
          
          <Input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <p className="text-xs text-muted-foreground text-center">
            Keep your workspace clean and organized
          </p>
        </CardContent>
      </Card>

      <AlertDialog open={showImportConfirm} onOpenChange={setShowImportConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace what you have now?</AlertDialogTitle>
            <AlertDialogDescription>
              You have {tasks.length} tasks right now. This file has {pendingImport?.length} tasks.
              <br /><br />
              If you continue, I'll replace everything you have with what's in the file. You can't undo this.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Never mind</AlertDialogCancel>
            <AlertDialogAction onClick={confirmImport}>
              Yes, replace everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}