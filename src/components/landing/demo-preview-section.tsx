"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Circle, Clock } from "lucide-react";

export default function DemoPreviewSection() {
  return (
    <section className="w-full py-10 sm:py-14 md:py-18 lg:py-24 bg-gradient-to-b from-black via-primary/5 to-black">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12 md:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-3 sm:mb-4 md:mb-6 px-2">
            See It In Action
          </h2>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Paste a client email. Get a full Kanban board in under 2 seconds.
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {/* To Do */}
              <Card className="p-4 bg-card/50 backdrop-blur-sm border-2">
                <div className="flex items-center gap-2 mb-4">
                  <Circle className="h-4 w-4 text-gray-400" />
                  <h3 className="font-semibold text-sm sm:text-base">To Do</h3>
                  <span className="ml-auto text-xs text-muted-foreground">3</span>
                </div>
                <div className="space-y-3">
                  {[
                    { title: "Send revised proposal to Acme", priority: "High" },
                    { title: "Update onboarding deck", priority: "Medium" },
                    { title: "Review Q2 analytics report", priority: "Low" },
                  ].map((task, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="p-3 bg-background rounded-lg border hover:border-primary/50 transition-colors cursor-pointer"
                    >
                      <p className="text-xs sm:text-sm font-medium mb-1">{task.title}</p>
                      <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded ${
                        task.priority === "High" ? "bg-red-500/20 text-red-400" :
                        task.priority === "Medium" ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-green-500/20 text-green-400"
                      }`}>
                        {task.priority}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </Card>

              {/* In Progress */}
              <Card className="p-4 bg-card/50 backdrop-blur-sm border-2 border-primary/30">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm sm:text-base">In Progress</h3>
                  <span className="ml-auto text-xs text-muted-foreground">2</span>
                </div>
                <div className="space-y-3">
                  {[
                    { title: "Client dashboard integration", priority: "High" },
                    { title: "Fintech case study writeup", priority: "High" },
                  ].map((task, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: (i + 3) * 0.1 }}
                      className="p-3 bg-background rounded-lg border border-primary/50 hover:border-primary transition-colors cursor-pointer"
                    >
                      <p className="text-xs sm:text-sm font-medium mb-1">{task.title}</p>
                      <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">
                        {task.priority}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </Card>

              {/* Done */}
              <Card className="p-4 bg-card/50 backdrop-blur-sm border-2">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <h3 className="font-semibold text-sm sm:text-base">Done</h3>
                  <span className="ml-auto text-xs text-muted-foreground">2</span>
                </div>
                <div className="space-y-3">
                  {[
                    { title: "Kick-off call with Acme team" },
                    { title: "Set up project tracking board" },
                  ].map((task, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: (i + 5) * 0.1 }}
                      className="p-3 bg-background rounded-lg border opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <p className="text-xs sm:text-sm font-medium mb-1 line-through">{task.title}</p>
                      <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                        Completed
                      </span>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 blur-3xl -z-10" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
