"use client";

import { motion } from "framer-motion";
import { FileText, Rocket, Sparkles } from "lucide-react";

const steps = [
  {
    number: "1",
    icon: <FileText className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-primary" />,
    title: "Sign Up & Paste Notes",
    description:
      "Create your account and paste your messy notes, meeting minutes, or random thoughts into the board.",
  },
  {
    number: "2",
    icon: <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-primary" />,
    title: "AI Extracts Tasks",
    description:
      "Our AI intelligently parses your notes, extracts tasks, detects priorities and due dates automatically.",
  },
  {
    number: "3",
    icon: <Rocket className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-primary" />,
    title: "Organize & Track",
    description:
      "Drag tasks across your Kanban board, set priorities, track progress. Export anytime to backup or share.",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="w-full py-10 sm:py-14 md:py-18 lg:py-24 bg-black">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12 md:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-3 sm:mb-4 md:mb-6 px-2">
            How It Works
          </h2>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Three simple steps to transform your task management workflow.
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          {/* Desktop: Horizontal Timeline */}
          <div className="hidden md:flex items-start justify-between relative">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="flex-1 flex flex-col items-center relative z-10"
              >
                <div className="relative mb-4 sm:mb-6">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center text-xl sm:text-2xl md:text-3xl font-bold text-primary backdrop-blur-sm">
                    {step.number}
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-semibold mb-1.5 sm:mb-2 md:mb-3 text-center">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground text-center max-w-xs leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Mobile: Vertical Timeline */}
          <div className="md:hidden space-y-6 sm:space-y-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flex gap-3 sm:gap-4 md:gap-6 relative"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center text-lg sm:text-xl md:text-2xl font-bold text-primary backdrop-blur-sm">
                    {step.number}
                  </div>
                </div>
                <div className="flex-1 pt-0.5 sm:pt-1">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                    <div className="p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-primary/10 border border-primary/20">
                      {step.icon}
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
