'use client';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';
import { TaskPriority } from '@/lib/types';

interface TaskFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  priorityFilter: TaskPriority | 'All';
  setPriorityFilter: (priority: TaskPriority | 'All') => void;
}

export default function TaskFilters({ 
  searchQuery, 
  setSearchQuery, 
  priorityFilter, 
  setPriorityFilter 
}: TaskFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as TaskPriority | 'All')}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <Filter className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Filter by priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All Priorities</SelectItem>
          <SelectItem value="Urgent">Urgent</SelectItem>
          <SelectItem value="High">High</SelectItem>
          <SelectItem value="Medium">Medium</SelectItem>
          <SelectItem value="Low">Low</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
