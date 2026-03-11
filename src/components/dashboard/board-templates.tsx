'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckSquare, Calendar, Rocket, FileText, Zap, HelpCircle, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
    ],
    howToUse: 'Paste your daily tasks or notes here. Our AI will automatically extract and organize them into a Kanban board. Drag tasks between columns (To Do, In Progress, Done) to track your progress throughout the day.'
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
    ],
    howToUse: 'Enter your sprint requirements and user stories. The AI will parse them and create organized tasks. Use priorities to highlight critical items. Move tasks through columns as your team progresses through the sprint.'
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
    ],
    howToUse: 'Paste your meeting notes or transcript. AI will extract action items and decisions. Assign priorities to urgent items. Track who owns each task and move them to Done when completed.'
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
    ],
    howToUse: 'Input your project goals and phases. The AI will break them into manageable milestones and tasks. Use the board to visualize project timeline and dependencies. Save your roadmap for future reference.'
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
    ],
    howToUse: 'Plan your entire week by pasting your goals and commitments. AI organizes them by priority and category. Review daily, update progress, and adjust as needed. Save your plan to track weekly achievements.'
  },
];

export default function BoardTemplates({ onSelect }: { onSelect: (template: any) => void }) {
  const [selectedHelp, setSelectedHelp] = useState<string | null>(null);
  const helpTemplate = templates.find(t => t.id === selectedHelp);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {templates.map((template) => {
          const Icon = template.icon;
          return (
            <Card
              key={template.id}
              className="cursor-pointer hover:border-primary/50 transition-all hover:-translate-y-1 relative group"
              onClick={() => onSelect(template)}
            >
              <CardContent className="p-2 sm:p-4">
                <div className="flex flex-col items-center gap-1.5 sm:gap-2 text-center">
                  <div className="p-1.5 sm:p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <Icon className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[10px] sm:text-sm mb-0.5 sm:mb-1 line-clamp-2">{template.name}</h3>
                    <p className="text-[9px] sm:text-xs text-muted-foreground hidden sm:block line-clamp-2">{template.description}</p>
                    <p className="text-[9px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                      {template.tasks.length} tasks
                    </p>
                  </div>
                </div>
              </CardContent>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedHelp(template.id);
                }}
                className="absolute top-1 right-1 p-1 rounded-full bg-primary/10 hover:bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Show me how"
              >
                <HelpCircle className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              </button>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!selectedHelp} onOpenChange={() => setSelectedHelp(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              How to use {helpTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {helpTemplate?.howToUse}
            </p>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
              <p className="text-xs font-semibold text-primary">Quick Steps:</p>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• Paste your notes or content</li>
                <li>• AI automatically extracts tasks</li>
                <li>• Drag tasks to organize</li>
                <li>• Save your board</li>
              </ul>
            </div>
            <button
              onClick={() => {
                setSelectedHelp(null);
                onSelect(helpTemplate);
              }}
              className="w-full bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Start with {helpTemplate?.name}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { templates };
