"use client";

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { CheckCircle2, Code, Shield, Zap } from "lucide-react";

const benefits = [
  {
    icon: <Shield className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />,
    title: "Secure & Private",
    description: "Your data is protected with industry-standard encryption. Supabase authentication ensures secure access.",
  },
  {
    icon: <Zap className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />,
    title: "Cloud Sync",
    description: "Access your boards from any device. All data synced securely to the cloud with Supabase.",
  },
  {
    icon: <Code className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />,
    title: "Open Source",
    description: "Full source code available on GitHub. Self-host, customize, or contribute. MIT licensed.",
  },
  {
    icon: <CheckCircle2 className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />,
    title: "AI powered",
    description: "Intelligent task extraction using Google Gemini and Groq AI. Automatically detect priorities and deadlines.",
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
            Why Choose KANBI
          </h2>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Built with privacy, simplicity, and transparency at its core.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 max-w-5xl mx-auto">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="h-full border-2 border-border hover:border-primary/30 transition-all duration-300 bg-card/50 backdrop-blur-sm hover:-translate-y-2 hover:shadow-lg hover:shadow-primary/10">
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl bg-primary/10 border border-primary/20 flex-shrink-0">
                      {benefit.icon}
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold mb-1.5 sm:mb-2">
                        {benefit.title}
                      </h3>
                      <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
                        {benefit.description}
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
