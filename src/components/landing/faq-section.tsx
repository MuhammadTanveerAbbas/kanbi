'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const faqs = [
  {
    question: "Is KANBI really free?",
    answer: "Yes! KANBI is completely free and open source. All features work without any payment or subscription. It's built as a portfolio project to showcase modern web development."
  },
  {
    question: "Do I need to create an account?",
    answer: "No account needed! Just visit the app and start organizing your tasks immediately. Your data is stored locally in your browser."
  },
  {
    question: "Is my data safe and private?",
    answer: "Absolutely. Your data never leaves your device - everything is stored locally in your browser. No servers, no tracking, no data collection."
  },
  {
    question: "Can I use it offline?",
    answer: "Yes! Once loaded, KANBI works completely offline. Your tasks are saved locally and will be there when you return."
  },
  {
    question: "What devices does it work on?",
    answer: "KANBI works on all modern devices - desktop, tablet, and mobile. It's built with responsive design for the best experience everywhere."
  },
  {
    question: "Can I export my tasks?",
    answer: "Yes! You can export your tasks as JSON files for backup or to move between devices. Import functionality is also available."
  },
  {
    question: "How does the AI task parsing work?",
    answer: "KANBI uses Google AI (Gemini) to intelligently extract tasks from your notes. Add your GOOGLE_GENKIT_API_KEY to enable AI features, or use the built-in smart parsing that works offline."
  },
  {
    question: "Can I collaborate with my team?",
    answer: "KANBI is designed for individual use and small teams sharing the same device. For team collaboration, you can export/import task boards between team members."
  }
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="w-full py-12 sm:py-24 bg-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about KANBI
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index} className="border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="p-0">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full text-left p-4 sm:p-6 flex items-center justify-between hover:bg-primary/5 transition-colors"
                >
                  <span className="text-sm sm:text-base font-medium pr-4">
                    {faq.question}
                  </span>
                  {openIndex === index ? (
                    <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
                {openIndex === index && (
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}