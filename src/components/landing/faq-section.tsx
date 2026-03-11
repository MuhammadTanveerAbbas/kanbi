"use client";

import { Card, CardContent } from "@/components/ui/card";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const faqs = [
  {
    question: "Do I need to change how I take notes?",
    answer:
      "No. Kanbi reads whatever you have bullet points, paragraphs, messy stream of consciousness. It's built for real meeting notes, not structured templates.",
  },
  {
    question: "What if my notes are confidential client information?",
    answer:
      "Your data is stored with row level security in Supabase. Nobody else can access your boards. You can delete everything from settings at any time.",
  },
  {
    question: "How accurate is the AI task extraction?",
    answer:
      "95%+ on structured notes. The AI is specifically prompted for consultant workflows, it understands phrases like 'follow up with', 'client needs', 'deadline is', and 'action item'.",
  },
  {
    question: "What's the difference between Free and Pro?",
    answer:
      "Free gives you 10 AI extractions per day enough to test with real client work. Premium ($12/month) gives you 50/day plus PDF upload, Notion import, Gmail extraction, and URL crawling.",
  },
  {
    question: "Can I export my tasks to other tools?",
    answer:
      "Yes. Export any board as JSON. CSV export and direct integrations with Notion and Linear are on the roadmap.",
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
