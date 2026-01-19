'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ArrowRight, ArrowLeft, Sparkles, LayoutDashboard, Move, Save, BarChart } from 'lucide-react';

const steps = [
  {
    icon: Sparkles,
    title: 'Welcome to KANBI',
    description: 'Transform your messy notes into organized Kanban boards with AI. Let\'s take a quick tour!',
  },
  {
    icon: LayoutDashboard,
    title: 'Create Your First Board',
    description: 'Click "Open Kanban Board" to start. Paste your notes and let AI extract tasks automatically.',
  },
  {
    icon: Move,
    title: 'Organize with Drag & Drop',
    description: 'Move tasks between To Do, In Progress, and Done columns. Set priorities and due dates.',
  },
  {
    icon: Save,
    title: 'Save & Access Anywhere',
    description: 'Save boards to the cloud and access them from any device. Export as JSON anytime.',
  },
  {
    icon: BarChart,
    title: 'Track Your Progress',
    description: 'View analytics, usage stats, and completion rates right here on your dashboard.',
  },
];

export default function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    if (!hasSeenTour) {
      setTimeout(() => setOpen(true), 1000);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem('hasSeenTour', 'true');
    setOpen(false);
  };

  const Icon = steps[step].icon;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        localStorage.setItem('hasSeenTour', 'true');
      }
      setOpen(isOpen);
    }}>
      <DialogContent className="max-w-[280px] sm:max-w-md [&>button]:!hidden">
        <DialogTitle className="sr-only">{steps[step].title}</DialogTitle>
        <button 
          onClick={() => {
            localStorage.setItem('hasSeenTour', 'true');
            setOpen(false);
          }} 
          className="absolute right-2 top-2 z-50 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="h-3 w-3" />
        </button>
        <div className="space-y-3 sm:space-y-6 pt-3 sm:pt-6">
          <div className="text-center space-y-1 sm:space-y-2">
            <div className="flex justify-center mb-2">
              <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h2 className="text-base sm:text-2xl font-bold">{steps[step].title}</h2>
            <p className="text-[10px] sm:text-base text-muted-foreground leading-tight">{steps[step].description}</p>
          </div>
          <div className="flex gap-1 justify-center">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 w-1 sm:h-2 sm:w-2 rounded-full transition-all ${
                  i === step ? 'bg-primary w-4 sm:w-8' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <div className="flex gap-1.5 sm:gap-2">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1 h-8 sm:h-10 text-[10px] sm:text-sm px-2">
                <ArrowLeft className="h-2.5 w-2.5 sm:h-4 sm:w-4 mr-0.5 sm:mr-2" />
                Back
              </Button>
            )}
            {step < steps.length - 1 ? (
              <Button onClick={() => setStep(step + 1)} className="flex-1 h-8 sm:h-10 text-[10px] sm:text-sm px-2">
                Next
                <ArrowRight className="h-2.5 w-2.5 sm:h-4 sm:w-4 ml-0.5 sm:ml-2" />
              </Button>
            ) : (
              <Button onClick={handleComplete} className="flex-1 h-8 sm:h-10 text-[10px] sm:text-sm px-2">
                Get Started
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
