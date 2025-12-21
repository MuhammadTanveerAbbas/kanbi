'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, Users, Zap, Shield, CheckCircle, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState, useEffect } from 'react';

type FinalCtaSectionProps = {
  setIsLoading: (isLoading: boolean) => void;
};

const faqs = [
  {
    q: "Is this really free?",
    a: "Yes, the basic Kanban features are completely free forever. AI features require the Pro plan."
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
    a: "Yes, basic Kanban features work offline. AI task extraction requires internet connection."
  },
  {
    q: "Can I export my tasks?",
    a: "Yes, you can export all your tasks as a JSON file anytime for backup or sharing."
  },
  {
    q: "How does the AI task extraction work?",
    a: "Paste your notes and our AI identifies actionable tasks, deadlines, and priorities automatically."
  },
  {
    q: "What happens if I clear my browser data?",
    a: "You'll lose all your tasks since they're stored locally. Export regularly as backup."
  },
  {
    q: "Can teams collaborate in real-time?",
    a: "You can share exported task files, but there's no real-time collaboration features currently."
  }
];

export default function FinalCtaSection({ setIsLoading }: FinalCtaSectionProps) {
  const router = useRouter();
  const [openItems, setOpenItems] = useState<number[]>([]);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
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
    <section className="w-full py-12 sm:py-24 relative overflow-hidden bg-black">
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
          <h3 className="text-2xl font-bold mb-8 text-center">Common Questions</h3>
          {mounted && (
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div key={index} className="border rounded-lg">
                  <Collapsible open={openItems.includes(index)} onOpenChange={() => toggleItem(index)}>
                    <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors rounded-lg">
                      <span className="font-medium text-left">{faq.q}</span>
                      <ChevronDown className={`h-4 w-4 transition-transform flex-shrink-0 ml-4 ${openItems.includes(index) ? 'rotate-180' : ''}`} />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4 text-sm text-muted-foreground border-t">
                      <div className="pt-3 text-left leading-relaxed">
                        {faq.a}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
