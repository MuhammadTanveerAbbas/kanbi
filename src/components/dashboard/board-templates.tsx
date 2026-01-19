'use client';

import { Card, CardContent } from '@/components/ui/card';
import { CheckSquare, Calendar, Rocket, FileText, Zap } from 'lucide-react';

const templates = [
  {
    id: 'daily',
    name: 'Daily Tasks',
    icon: CheckSquare,
    description: 'Organize your daily to-dos',
    tasks: [
      { title: 'Morning routine', status: 'todo', priority: 'medium' },
      { title: 'Check emails', status: 'todo', priority: 'high' },
      { title: 'Team standup', status: 'todo', priority: 'high' },
    ]
  },
  {
    id: 'sprint',
    name: 'Sprint Planning',
    icon: Rocket,
    description: 'Plan your development sprint',
    tasks: [
      { title: 'Sprint planning meeting', status: 'todo', priority: 'high' },
      { title: 'Define user stories', status: 'todo', priority: 'high' },
      { title: 'Estimate tasks', status: 'todo', priority: 'medium' },
    ]
  },
  {
    id: 'meeting',
    name: 'Meeting Notes',
    icon: FileText,
    description: 'Capture meeting action items',
    tasks: [
      { title: 'Review agenda', status: 'todo', priority: 'medium' },
      { title: 'Take notes', status: 'in-progress', priority: 'high' },
      { title: 'Share summary', status: 'todo', priority: 'medium' },
    ]
  },
  {
    id: 'project',
    name: 'Project Roadmap',
    icon: Calendar,
    description: 'Plan project milestones',
    tasks: [
      { title: 'Define project scope', status: 'done', priority: 'high' },
      { title: 'Set milestones', status: 'in-progress', priority: 'high' },
      { title: 'Assign resources', status: 'todo', priority: 'medium' },
    ]
  },
  {
    id: 'quick',
    name: 'Quick Start',
    icon: Zap,
    description: 'Empty board to start fresh',
    tasks: []
  },
  {
    id: 'weekly',
    name: 'Weekly Planning',
    icon: Calendar,
    description: 'Plan your week ahead',
    tasks: [
      { title: 'Review last week\'s accomplishments', status: 'todo', priority: 'high' },
      { title: 'Set weekly goals', status: 'todo', priority: 'urgent' },
      { title: 'Schedule important meetings', status: 'todo', priority: 'high' },
      { title: 'Block focus time for deep work', status: 'todo', priority: 'medium' },
      { title: 'Plan personal tasks', status: 'todo', priority: 'low' },
      { title: 'Prepare for Monday standup', status: 'todo', priority: 'medium' },
    ]
  },
];

export default function BoardTemplates({ onSelect }: { onSelect: (template: any) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => {
        const Icon = template.icon;
        return (
          <Card
            key={template.id}
            className="cursor-pointer hover:border-primary/50 transition-all hover:-translate-y-1"
            onClick={() => onSelect(template)}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{template.name}</h3>
                  <p className="text-xs text-muted-foreground">{template.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {template.tasks.length} tasks
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export { templates };
