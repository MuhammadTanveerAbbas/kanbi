'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Edit, Trash2, GripVertical, CheckCircle, Play, Square } from 'lucide-react';
import { Task, TaskStatus, KANBAN_COLUMNS } from '@/lib/types';
import { useTasksStore } from '@/hooks/use-tasks-store';

interface KanbanBoardProps {
  store: ReturnType<typeof useTasksStore>;
}

const columnConfig = {
  'To Do': { icon: Square, color: 'text-slate-500', bg: 'bg-slate-50', label: 'To Do' },
  'In Progress': { icon: Play, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Working On' },
  'Done': { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', label: 'Finished' }
};

export default function KanbanBoard({ store }: KanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState<TaskStatus | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (draggedTask) {
      try {
        store.moveTask(draggedTask, status);
      } catch (error) {
        setError('Oops, couldn\'t move that. Try again?');
        setTimeout(() => setError(null), 3000);
      }
      setDraggedTask(null);
    }
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim() || !addDialogOpen) return;

    try {
      const newTask = store.addTask({
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || undefined
      });
      
      if (addDialogOpen !== 'To Do') {
        store.moveTask(newTask.id, addDialogOpen);
      }
      
      setNewTaskTitle('');
      setNewTaskDescription('');
      setAddDialogOpen(null);
    } catch (error) {
      setError('Couldn\'t add that task. Try again?');
    }
  };

  const handleEditTask = () => {
    if (!editingTask?.title.trim()) return;

    try {
      store.updateTask(editingTask.id, {
        title: editingTask.title.trim(),
        description: editingTask.description?.trim() || undefined
      });
      setEditingTask(null);
      setEditDialogOpen(false);
    } catch (error) {
      setError('Couldn\'t save your changes. Try again?');
    }
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return store.tasks.filter(task => task.status === status);
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {KANBAN_COLUMNS.map((status) => {
          const tasks = getTasksByStatus(status);
          const isDragOver = dragOverColumn === status;
          const config = columnConfig[status];
          const Icon = config.icon;
          
          return (
            <Card 
              key={status} 
              className={`transition-all ${isDragOver ? 'ring-2 ring-primary shadow-lg' : ''}`}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${config.color}`} />
                    <span>{config.label}</span>
                  </div>
                  <span className="text-sm font-normal text-muted-foreground">
                    {tasks.length}
                  </span>
                </CardTitle>
              </CardHeader>
              
              <CardContent
                className="space-y-3 min-h-[300px]"
                onDragOver={(e) => handleDragOver(e, status)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, status)}
              >
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className={`group p-3 bg-background border rounded-lg cursor-move hover:shadow-md transition-all ${
                      draggedTask === task.id ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {task.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Quick actions with friendly tooltips */}
                        {status !== 'In Progress' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => store.moveTask(task.id, 'In Progress')}
                            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                            title="Start working on this"
                          >
                            ▶
                          </Button>
                        )}
                        {status !== 'Done' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => store.moveTask(task.id, 'Done')}
                            className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
                            title="Mark as finished"
                          >
                            ✓
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingTask(task);
                            setEditDialogOpen(true);
                          }}
                          className="h-6 w-6 p-0"
                          title="Edit this task"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => store.deleteTask(task.id)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                          title="Delete this task"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {tasks.length === 0 && (
                  <div className={`text-center py-8 rounded-lg bg-muted/50`}>
                    <Icon className={`h-6 w-6 mx-auto mb-2 ${config.color} opacity-50`} />
                    <p className="text-sm text-muted-foreground">
                      {status === 'Done' ? 'Nothing finished yet' : 'Drag tasks here'}
                    </p>
                  </div>
                )}
                
                {/* Add task button */}
                <Dialog open={addDialogOpen === status} onOpenChange={(open) => setAddDialogOpen(open ? status : null)}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" className="w-full border-dashed border-2 h-10">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Something Here
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>What do you need to do?</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="What's the task?"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                      />
                      <Textarea
                        placeholder="Any extra details? (optional)"
                        value={newTaskDescription}
                        onChange={(e) => setNewTaskDescription(e.target.value)}
                        rows={2}
                      />
                      <Button 
                        onClick={handleAddTask}
                        className="w-full"
                        disabled={!newTaskTitle.trim()}
                      >
                        Add This Task
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change This Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="What's the task?"
              value={editingTask?.title || ''}
              onChange={(e) => setEditingTask(prev => 
                prev ? { ...prev, title: e.target.value } : null
              )}
              onKeyDown={(e) => e.key === 'Enter' && handleEditTask()}
            />
            <Textarea
              placeholder="Any extra details? (optional)"
              value={editingTask?.description || ''}
              onChange={(e) => setEditingTask(prev => 
                prev ? { ...prev, description: e.target.value } : null
              )}
              rows={2}
            />
            <Button 
              onClick={handleEditTask}
              className="w-full"
              disabled={!editingTask?.title.trim()}
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}