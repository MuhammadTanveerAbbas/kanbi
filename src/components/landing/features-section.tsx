"use client";

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  Bot,
  FileText,
  Target,
  Clipboard,
  BarChart3,
  Calendar,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: (
      <Bot className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary" />
    ),
    title: "AI task extraction in under 2 seconds",
    description:
      "Stop manually creating tasks. Paste any notes, email, or PDF and Groq AI extracts every action item, assigns priorities, and detects deadlines instantly.",
  },
  {
    icon: (
      <FileText className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary" />
    ),
    title: "Works with text, PDFs, emails, and URLs",
    description:
      "Paste text, upload a PDF, or drop a URL. Kanbi reads them all and extracts tasks in one step. No copy-pasting between tools.",
  },
  {
    icon: (
      <Target className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary" />
    ),
    title: "Real-time workload health scoring",
    description:
      "AI analyzes your task load and calculates a live health score. When you're overcommitted, it flags burnout risk and suggests which tasks to defer.",
  },
  {
    icon: (
      <Clipboard className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary" />
    ),
    title: "AI Chat with full board context",
    description:
      "Ask your AI coach anything about your tasks. It reads your live board, helps you prioritize, and can create or move tasks directly via conversation.",
  },
  {
    icon: (
      <BarChart3 className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary" />
    ),
    title: "Completion tracking and task insights",
    description:
      "Track your task completion history over time. See priority breakdowns, spot bottlenecks, and understand where your time actually goes.",
  },
  {
    icon: (
      <Calendar className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary" />
    ),
    title: "Google Calendar sync and board export",
    description:
      "Push tasks with due dates to Google Calendar in one click. Export any saved board as a DOCX or PDF for client handoffs.",
  },
  {
    icon: (
      <Zap className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary" />
    ),
    title: "Autopilot: AI-generated daily schedule",
    description:
      "Autopilot reads your board and generates a time-blocked daily schedule with a morning briefing, blocker detection, and overflow rescheduling kanbi all saved automatically.",
  },
  {
    icon: (
      <Bot className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary" />
    ),
    title: "Save, search, and favorite your boards",
    description:
      "Every board you generate can be saved to your library. Search by title or content, mark favorites, and reload any past board instantly.",
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
              transition={{ duration: 0.6, delay: index * 0.08 }}
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
