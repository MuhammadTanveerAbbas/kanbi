'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, Loader2, WifiOff, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import { Task } from '@/lib/types';

interface TaskGeneratorProps {
  addTask: (task: Omit<Task, 'id' | 'status' | 'createdAt'>) => void;
}

export default function TaskGenerator({ addTask }: TaskGeneratorProps) {
  const [notes, setNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const parseTasksIntelligently = (text: string) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 2);
    const tasks: Array<{title: string, description: string}> = [];
    
    lines.forEach(line => {
      if (line.match(/^(meeting|notes?|agenda|discussion):/i)) return;
      if (line.match(/^#+\s/)) return;
      
      let cleanLine = line.replace(/^[-•*]\s*/, '').trim();
      
      const dueDateMatch = cleanLine.match(/(by|due|deadline)\s+(\w+day|\d+\/\d+|\w+\s+\d+)/i);
      const priorityMatch = cleanLine.match(/(urgent|asap|high priority|important)/i);
      
      cleanLine = cleanLine.replace(/(by|due|deadline)\s+\w+day?/gi, '').trim();
      cleanLine = cleanLine.replace(/(urgent|asap|high priority|important)/gi, '').trim();
      
      if (cleanLine && (cleanLine.includes(' ') || cleanLine.length > 8)) {
        let description = '';
        if (dueDateMatch) description += `Due: ${dueDateMatch[2]}. `;
        if (priorityMatch) description += 'High priority.';
        
        tasks.push({
          title: cleanLine,
          description: description.trim()
        });
      }
    });
    
    return tasks;
  };

  const generateTasks = async () => {
    if (!notes.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    setSuccess(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const parsedTasks = parseTasksIntelligently(notes);
      
      if (parsedTasks.length === 0) {
        throw new Error('I couldn\'t find any tasks. Try writing what you need to do.');
      }
      
      parsedTasks.forEach(task => {
        addTask(task);
      });
      
      setNotes('');
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong. Try again?');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
    if (error) setError(null);
  };

  const insertExample = () => {
    setNotes(`- Fix the login bug by Friday
- Review marketing copy
- Call John about the project
- Update pricing page`);
  };

  return (
    <Card className="h-full">
      <CardContent className="p-6 space-y-6 flex flex-col justify-between h-full">
        {/* Simple header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Add Your Tasks</h2>
            {!isOnline && <WifiOff className="h-4 w-4 text-muted-foreground" />}
          </div>
          {!notes && (
            <Button variant="ghost" size="sm" className="px-2 sm:px-3" onClick={insertExample}>
              <span className="hidden sm:inline">Show Me How</span>
              <HelpCircle className="sm:hidden h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Clear input */}
        <Textarea
          placeholder="What's on your mind?

- Fix login bug
- Review copy
- Call John"
          value={notes}
          onChange={handleInputChange}
          rows={5}
          className="resize-none min-h-[120px] sm:min-h-[140px] sm:placeholder:text-sm placeholder:text-xs"
        />

        {/* Human status messages */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Clear action */}
        <Button 
          onClick={generateTasks}
          disabled={!notes.trim() || isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Finding Your Tasks...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Turn This Into Tasks
            </>
          )}
        </Button>

        {/* Simple help */}
        <p className="text-xs text-muted-foreground text-center">
          Works without internet • Finds deadlines when possible • Your data stays private
        </p>
      </CardContent>
    </Card>
  );
}