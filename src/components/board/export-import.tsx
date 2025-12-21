'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Download, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { Task } from '@/lib/types';

interface ExportImportProps {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
}

export default function ExportImport({ tasks, setTasks }: ExportImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [pendingImport, setPendingImport] = useState<Task[] | null>(null);

  const exportTasks = () => {
    try {
      if (tasks.length === 0) {
        setError('You don\'t have any tasks to save yet');
        setTimeout(() => setError(null), 3000);
        return;
      }

      const dataStr = JSON.stringify(tasks, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `my-tasks-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setSuccess(`Saved ${tasks.length} tasks to your computer`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Couldn\'t save your tasks. Try again?');
      setTimeout(() => setError(null), 3000);
    }
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
        <CardHeader className="pb-6">
          <CardTitle className="text-lg">Save Your Work</CardTitle>
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
          
          <div className="space-y-3">
            <Button 
              onClick={exportTasks} 
              variant="outline" 
              className="w-full"
              disabled={tasks.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Save to Computer
            </Button>
            
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              variant="outline" 
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              Load from File
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
              <p className="text-sm font-medium">{tasks.length} tasks saved locally</p>
              <p className="text-xs text-muted-foreground mt-1">
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
            Export as JSON file or clear workspace
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