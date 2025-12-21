'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, Users, Zap, Shield, CheckCircle, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';

type FinalCtaSectionProps = {
  setIsLoading: (isLoading: boolean) => void;
};

const faqs = [
  {
    q: "Is this really free?",
    a: "Yes, basic features are completely free forever. AI features require a paid plan."
  },
  {
    q: "Do I need to create an account?",
    a: "No. You can start using it immediately without any signup or registration."
  },
  {
    q: "Where is my data stored?",
    a: "Everything stays in your browser's local storage. We don't store anything on our servers."
  },
  {
    q: "Does it work offline?",
    a: "Basic Kanban features work offline. AI task extraction requires internet connection."
  },
  {
    q: "Can I export my tasks?",
    a: "Yes, you can export all your tasks as a JSON file anytime."
  },
  {
    q: "Is this a real product or just a demo?",
    a: "This is a portfolio project demonstrating web development skills. It works fully but isn't a commercial service."
  },
  {
    q: "What AI service do you use?",
    a: "We use Google's Gemini API for task extraction from notes."
  },
  {
    q: "Can teams use this together?",
    a: "You can share exported task files, but there's no real-time collaboration features."
  },
  {
    q: "What happens if I clear my browser data?",
    a: "You'll lose all your tasks since they're stored locally. Export regularly as backup."
  },
  {
    q: "Who built this?",
    a: "Muhammad Tanveer Abbas created this as a portfolio project to showcase development skills."
  }
];

export default function FinalCtaSection({ setIsLoading }: FinalCtaSectionProps) {
  const router = useRouter();
  const [openItems, setOpenItems] = useState<number[]>([]);
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsLoading(true);
    requestAnimationFrame(() => {
      router.push('/board');
    });
  };

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <section className="w-full py-12 sm:py-24 relative overflow-hidden">
      <div className="container mx-auto text-center max-w-5xl px-4 relative">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4 sm:mb-6">
          <Users className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-primary">Open Source & Free</span>
        </div>

        {/* Heading */}
        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground font-headline">
          Turn Ideas Into Action
        </h2>
        
        {/* Description */}
        <p className="mt-4 text-sm sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          For founders, teams, and creators who want results, not just plans. Transform notes into tasks in seconds.
        </p>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-6 sm:mt-10 max-w-3xl mx-auto">
          <div className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-lg bg-card border">
            <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            <p className="text-xs sm:text-sm font-medium">No signup required</p>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-lg bg-card border">
            <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            <p className="text-xs sm:text-sm font-medium">Completely free</p>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-lg bg-card border">
            <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            <p className="text-xs sm:text-sm font-medium">Data stays private</p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6 sm:mt-10">
          <Button size="lg" onClick={handleClick} className="text-sm sm:text-base px-6 py-5 sm:px-8 sm:py-6 shadow-lg hover:shadow-xl transition-all">
            Start Building Now
            <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>

        {/* Social proof */}
        <p className="mt-4 sm:mt-6 text-xs sm:text-sm text-muted-foreground">
          Try it now - no commitment, no signup required
        </p>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold mb-8">Frequently Asked Questions</h3>
          <div className="space-y-2">
            {faqs.map((faq, index) => (
              <Collapsible key={index} open={openItems.includes(index)} onOpenChange={() => toggleItem(index)}>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border p-4 text-left hover:bg-muted/50 transition-colors">
                  <span className="font-medium">{faq.q}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${openItems.includes(index) ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4 text-sm text-muted-foreground">
                  {faq.a}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
