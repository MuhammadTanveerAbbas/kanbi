'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, GripVertical, CheckCircle, Play, Square, Calendar, Flag } from 'lucide-react';
import { Task, TaskStatus, TaskPriority, KANBAN_COLUMNS, PRIORITY_COLORS } from '@/lib/types';
import { useTasksStore } from '@/hooks/use-tasks-store';
import TaskFilters from './task-filters';
import BulkActions from './bulk-actions';

interface KanbanBoardProps {
  store: ReturnType<typeof useTasksStore>;
}

const columnConfig = {
  'To Do': { icon: Square, color: 'text-slate-500', label: 'To Do' },
  'In Progress': { icon: Play, color: 'text-blue-500', label: 'Working On' },
  'Done': { icon: CheckCircle, color: 'text-green-500', label: 'Finished' }
};

export default function KanbanBoard({ store }: KanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('Medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState<TaskStatus | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'All'>('All');

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (draggedTask) {
      try {
        store.moveTask(draggedTask, status);
      } catch (error) {
        setError('Could not move task');
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
        description: newTaskDescription.trim() || undefined,
        priority: newTaskPriority,
        dueDate: newTaskDueDate || undefined
      });
      if (addDialogOpen !== 'To Do') {
        store.moveTask(newTask.id, addDialogOpen);
      }
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskPriority('Medium');
      setNewTaskDueDate('');
      setAddDialogOpen(null);
    } catch (error) {
      setError('Could not add task');
    }
  };

  const handleEditTask = () => {
    if (!editingTask?.title.trim()) return;
    try {
      store.updateTask(editingTask.id, {
        title: editingTask.title.trim(),
        description: editingTask.description?.trim() || undefined,
        priority: editingTask.priority,
        dueDate: editingTask.dueDate
      });
      setEditingTask(null);
      setEditDialogOpen(false);
    } catch (error) {
      setError('Could not save changes');
    }
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return store.tasks.filter(task => {
      if (task.status !== status) return false;
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !task.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (priorityFilter !== 'All' && task.priority !== priorityFilter) return false;
      return true;
    });
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="space-y-4">
      <TaskFilters 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
      />
      <BulkActions />
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {KANBAN_COLUMNS.map((status) => {
          const tasks = getTasksByStatus(status);
          const isDragOver = dragOverColumn === status;
          const config = columnConfig[status];
          const Icon = config.icon;
          
          return (
            <Card key={status} className={`transition-all ${isDragOver ? 'ring-2 ring-primary shadow-lg' : ''}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${config.color}`} />
                    <span>{config.label}</span>
                  </div>
                  <span className="text-sm font-normal text-muted-foreground">{tasks.length}</span>
                </CardTitle>
              </CardHeader>
              
              <CardContent
                className="space-y-3 min-h-[300px]"
                onDragOver={(e) => handleDragOver(e, status)}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={(e) => handleDrop(e, status)}
              >
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className={`group p-3 bg-background border rounded-lg cursor-move hover:shadow-md transition-all ${draggedTask === task.id ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex-1 min-w-0 space-y-2">
                        <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
                        {task.description && <p className="text-xs text-muted-foreground leading-relaxed">{task.description}</p>}
                        <div className="flex flex-wrap gap-2">
                          {task.tags?.includes('ai-extracted') && (
                            <Badge variant="secondary" className="text-xs text-muted-foreground bg-primary/10">
                              ✨ Extracted by AI
                            </Badge>
                          )}
                          {task.priority && (
                            <Badge variant="secondary" className={`text-xs ${PRIORITY_COLORS[task.priority]}`}>
                              <Flag className="h-3 w-3 mr-1" />
                              {task.priority}
                            </Badge>
                          )}
                          {task.dueDate && (
                            <Badge variant="secondary" className={`text-xs ${isOverdue(task.dueDate) ? 'text-red-500 bg-red-500/10' : 'text-muted-foreground'}`}>
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(task.dueDate).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {status !== 'In Progress' && (
                          <Button variant="ghost" size="sm" onClick={() => store.moveTask(task.id, 'In Progress')} className="h-6 w-6 p-0 text-blue-600" title="Start">▶</Button>
                        )}
                        {status !== 'Done' && (
                          <Button variant="ghost" size="sm" onClick={() => store.moveTask(task.id, 'Done')} className="h-6 w-6 p-0 text-green-600" title="Done">✓</Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => { setEditingTask(task); setEditDialogOpen(true); }} className="h-6 w-6 p-0" title="Edit">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => store.deleteTask(task.id)} className="h-6 w-6 p-0 text-red-600" title="Delete">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {tasks.length === 0 && (
                  <div className="text-center py-8 rounded-lg bg-muted/50">
                    <Icon className={`h-6 w-6 mx-auto mb-2 ${config.color} opacity-50`} />
                    <p className="text-sm text-muted-foreground">
                      {searchQuery || priorityFilter !== 'All' ? 'No matching tasks' : status === 'Done' ? 'Nothing finished yet' : 'Drag tasks here'}
                    </p>
                  </div>
                )}
                
                <Dialog open={addDialogOpen === status} onOpenChange={(open) => setAddDialogOpen(open ? status : null)}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" className="w-full border-dashed border-2 h-10">
                      <Plus className="h-4 w-4 mr-2" />Add Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Create New Task</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <Input placeholder="Task title" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTask()} />
                      <Textarea placeholder="Description (optional)" value={newTaskDescription} onChange={(e) => setNewTaskDescription(e.target.value)} rows={2} />
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Priority</label>
                          <Select value={newTaskPriority} onValueChange={(v) => setNewTaskPriority(v as TaskPriority)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Low">Low</SelectItem>
                              <SelectItem value="Medium">Medium</SelectItem>
                              <SelectItem value="High">High</SelectItem>
                              <SelectItem value="Urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Due Date</label>
                          <Input type="date" value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} />
                        </div>
                      </div>
                      <Button onClick={handleAddTask} className="w-full" disabled={!newTaskTitle.trim()}>Add Task</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Task</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Task title" value={editingTask?.title || ''} onChange={(e) => setEditingTask(prev => prev ? { ...prev, title: e.target.value } : null)} />
            <Textarea placeholder="Description (optional)" value={editingTask?.description || ''} onChange={(e) => setEditingTask(prev => prev ? { ...prev, description: e.target.value } : null)} rows={2} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Priority</label>
                <Select value={editingTask?.priority || 'Medium'} onValueChange={(v) => setEditingTask(prev => prev ? { ...prev, priority: v as TaskPriority } : null)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Due Date</label>
                <Input type="date" value={editingTask?.dueDate || ''} onChange={(e) => setEditingTask(prev => prev ? { ...prev, dueDate: e.target.value } : null)} />
              </div>
            </div>
            <Button onClick={handleEditTask} className="w-full" disabled={!editingTask?.title.trim()}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
