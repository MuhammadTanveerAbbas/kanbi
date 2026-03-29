"use client";

import { motion } from "framer-motion";
import { Zap, Shield, BarChart3, Download } from "lucide-react";

const stats = [
  {
    icon: <Zap className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary" />,
    value: "< 2s",
    label: "AI extraction speed",
  },
  {
    icon: <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary" />,
    value: "2h+",
    label: "Saved per day",
  },
  {
    icon: <Shield className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary" />,
    value: "RLS",
    label: "Row-level security",
  },
  {
    icon: <Download className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary" />,
    value: "Free",
    label: "Plan forever",
  },
];

export default function StatsSection() {
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
            Built for real productivity
          </h2>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Groq AI, Supabase, and Stripe kanbi production-grade infrastructure under the hood.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 max-w-5xl mx-auto">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="flex justify-center mb-2 sm:mb-3 md:mb-4">
                <motion.div
                  className="p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-primary/10 border border-primary/20"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {stat.icon}
                </motion.div>
              </div>
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-1 sm:mb-1.5 md:mb-2 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground px-1">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
