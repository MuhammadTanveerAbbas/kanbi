"use client";

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

const testimonials = [
  {
    quote: "I used to spend 15 minutes after every discovery call turning my notes into tasks. Now I paste them into Kanbi and it's done before I even close the call window.",
    name: "Alex R.",
    role: "UX Consultant, 6 years freelancing",
    initials: "AR",
  },
  {
    quote: "The Gmail extraction is the feature I didn't know I needed. Client emails full of requests — I paste the thread and get a clean task list in seconds.",
    name: "Sarah M.",
    role: "Marketing Consultant",
    initials: "SM",
  },
  {
    quote: "Finally a tool that doesn't require me to change how I work. My notes stay in Notion. I just paste the link.",
    name: "James T.",
    role: "Strategy Consultant",
    initials: "JT",
  },
];

export default function TestimonialsSection() {
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
            What consultants say
          </h2>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Real feedback from people who turn client calls into action lists.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-5xl mx-auto">
          {testimonials.map((t, index) => (
            <motion.div
              key={t.initials}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="h-full border-2 border-border hover:border-primary/30 transition-all duration-300 bg-card/50 backdrop-blur-sm hover:-translate-y-2 hover:shadow-lg hover:shadow-primary/10">
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4 italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-sm font-semibold text-primary">
                      {t.initials}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
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
