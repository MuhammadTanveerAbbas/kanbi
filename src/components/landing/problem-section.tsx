"use client";

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Brain, Clock, TrendingUp } from "lucide-react";

const problems = [
  {
    icon: <Clock className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-primary" />,
    title: "Stop Wasting Time",
    description:
      "Spend hours manually organizing notes into tasks? Our AI extracts actionable items from your messy notes instantly, so you can focus on getting things done.",
  },
  {
    icon: <Brain className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-primary" />,
    title: "Overcome Organization Chaos",
    description:
      "Never lose track of what needs to be done. Transform scattered notes, meeting minutes, and random thoughts into a clear, organized Kanban board in seconds.",
  },
  {
    icon: <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-primary" />,
    title: "Scale Your Productivity",
    description:
      "Handle more tasks efficiently. Whether you have 5 items or 500, our Drag and drop Kanban board helps you prioritize, track progress, and stay organized.",
  },
];

export default function ProblemSection() {
  return (
    <section
      id="problem"
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
            The Task Management Challenge
          </h2>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Everyone struggles with organizing scattered notes. We built a solution that transforms chaos into clarity.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-6xl mx-auto">
          {problems.map((problem, index) => (
            <motion.div
              key={problem.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="h-full border-2 hover:border-primary/30 transition-all duration-300 bg-card/50 backdrop-blur-sm hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-2">
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <div className="flex flex-col items-start gap-3 sm:gap-4 md:gap-6">
                    <div className="p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-primary/10 border border-primary/20">
                      {problem.icon}
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold mb-1.5 sm:mb-2 md:mb-3">
                        {problem.title}
                      </h3>
                      <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
                        {problem.description}
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
