'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const faqs = [
  {
    question: "What is KANBI?",
    answer: "KANBI is a complete SaaS platform that transforms notes into organized Kanban boards using AI. It includes authentication, cloud storage, premium subscriptions, and analytics."
  },
  {
    question: "Do I need to create an account?",
    answer: "Yes, you need to sign up for an account to use KANBI. This allows you to save your boards securely in the cloud and access them from any device."
  },
  {
    question: "Is my data safe?",
    answer: "Yes. Your data is stored securely in Supabase PostgreSQL database with industry-standard encryption. We use Supabase Auth for secure authentication."
  },
  {
    question: "What's included in the free plan?",
    answer: "The free plan includes 10 board uses per day (300 per month), AI task extraction, Kanban board, priorities, due dates, and save/export features."
  },
  {
    question: "What does Premium offer?",
    answer: "Premium ($20/month) includes unlimited board uses, unlimited AI generations, advanced AI features, cloud sync, unlimited saved boards, and priority support."
  },
  {
    question: "Can I export my tasks?",
    answer: "Yes! You can export your tasks as JSON files for backup or sharing with your team."
  },
  {
    question: "How does the AI work?",
    answer: "KANBI uses Google Gemini and Groq AI to intelligently parse your notes and extract tasks with priorities and due dates automatically."
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