"use client";

import { Card, CardContent } from "@/components/ui/card";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const faqs = [
  {
    question: "How accurate is the AI task extraction?",
    answer:
      "Kanbi uses Groq's llama-3.3-70b model, achieving 95%+ accuracy on structured notes and emails. The AI is specifically prompted for productivity workflows kanbi it understands phrases like 'follow up with', 'deadline is', and 'action item'. You can always edit extracted tasks before saving.",
  },
  {
    question: "Is my data private and secure?",
    answer:
      "Yes. All your boards and tasks are stored with row-level security (RLS) in Supabase kanbi meaning only you can access your data. We never sell or share your data with third parties. You can delete everything from Settings at any time.",
  },
  {
    question: "How does email and task parsing work?",
    answer:
      "Paste any email, meeting notes, or PDF text into Kanbi. The AI reads the full content, identifies every action item, assigns priorities, estimates time, and detects deadlines kanbi even ones buried in casual language. It works with any format, no templates required.",
  },
  {
    question: "Does Kanbi integrate with other tools?",
    answer:
      "Yes. Kanbi syncs with Google Calendar (push your AI schedule in one click), exports boards as DOCX or PDF for client handoffs, and supports URL import to extract tasks from web pages. More integrations are on the roadmap.",
  },
  {
    question: "Is there a free plan? What are the limits?",
    answer:
      "The free plan is free forever kanbi no credit card required. You get 10 AI task extractions per day and 300 board uses per month, which is enough for real daily use. Pro ($9/month) unlocks 50 extractions/day, unlimited board uses, PDF import, AI Chat, and more.",
  },
  {
    question: "How is Kanbi different from Asana or Monday.com?",
    answer:
      "Asana and Monday are great for teams but require you to manually create every task. Kanbi is built for individual freelancers and uses AI to do the heavy lifting kanbi paste your notes and your board is ready in seconds. It also includes burnout prevention and an AI coach, which traditional tools don't offer.",
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="w-full py-10 sm:py-14 md:py-18 lg:py-24 bg-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12 md:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-3 sm:mb-4 md:mb-6 px-2">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Everything you need to know about KANBI
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border-2 border-border hover:border-primary/40 transition-all duration-300 bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-0">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full text-left p-4 sm:p-6 flex items-center justify-between hover:bg-primary/5 transition-colors group"
                  >
                    <span className="text-sm sm:text-base font-medium pr-4">
                      {faq.question}
                    </span>
                    <motion.div
                      animate={{ rotate: openIndex === index ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {openIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-border/50">
                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-4">
                            {faq.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
