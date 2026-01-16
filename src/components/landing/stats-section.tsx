"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { FileText, Users, Heart, Clock } from "lucide-react";

const stats = [
  {
    icon: <FileText className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary" />,
    value: "AI",
    label: "Task Extraction",
    suffix: "",
  },
  {
    icon: <Users className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary" />,
    value: "Cloud",
    label: "Sync & Storage",
    suffix: "",
  },
  {
    icon: <Heart className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary" />,
    value: "Stripe",
    label: "Secure Payments",
    suffix: "",
  },
  {
    icon: <Clock className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary" />,
    value: "Free",
    label: "Plan Available",
    suffix: "",
  },
];

function CountUp({ end, duration = 2, suffix = "" }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [isInView, end, duration]);

  return (
    <span ref={ref}>
      {count}{suffix}
    </span>
  );
}

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
            Built for Productivity
          </h2>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Complete SaaS platform with powerful features to organize your tasks.
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
                <div className="p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-primary/10 border border-primary/20">
                  {stat.icon}
                </div>
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
