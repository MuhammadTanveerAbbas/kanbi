"use client";

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  Bot,
  FileText,
  Target,
  Clipboard,
  BarChart3,
  Lock,
} from "lucide-react";

const features = [
  {
    icon: (
      <Bot className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary" />
    ),
    title: "AI that saves you 2 hours per day",
    description:
      "Stop manually creating tasks. AI extracts action items, assigns priorities, and detects deadlines from your messy notes in seconds. What took 30 minutes now takes 10 seconds.",
  },
  {
    icon: (
      <FileText className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary" />
    ),
    title: "Works with everything you use",
    description:
      "Paste text, upload PDFs, forward emails, or drop URLs. AI reads them all and extracts tasks instantly. No copy-pasting between 5 different tools.",
  },
  {
    icon: (
      <Target className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary" />
    ),
    title: "AI prevents burnout before it happens",
    description:
      "Real-time workload health scoring analyzes your task load and warns you when you're overcommitted. Get smart suggestions to rebalance work before you crash.",
  },
  {
    icon: (
      <Clipboard className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary" />
    ),
    title: "AI Chat that knows your work",
    description:
      "Talk to an AI productivity coach that understands your tasks, deadlines, and patterns. Get instant help prioritizing, planning, and staying on track.",
  },
  {
    icon: (
      <BarChart3 className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary" />
    ),
    title: "AI learns your productivity patterns",
    description:
      "Track completion trends, identify bottlenecks, and get personalized insights. AI learns when you're most productive and suggests optimal task scheduling.",
  },
  {
    icon: (
      <Lock className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary" />
    ),
    title: "Export and own your data",
    description:
      "Export to DOCX or PDF. Your data, your way, always secure with enterprise-grade encryption.",
  },
];

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="w-full py-10 sm:py-14 md:py-18 lg:py-24 bg-black"
    >
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12 md:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-3 sm:mb-4 md:mb-6 px-2">
            AI That Actually Saves You Time
          </h2>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Stop wasting hours on task management. Let AI do the heavy lifting while you focus on getting work done.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="h-full border-2 hover:border-primary/30 transition-all duration-300 bg-card/50 backdrop-blur-sm hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-2 group">
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <div className="flex flex-col items-start gap-3 sm:gap-4 md:gap-6">
                    <div className="p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-primary/10 border border-primary/20 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-1.5 sm:mb-2 md:mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
