"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  Save,
  BarChart3,
  Shield,
  CreditCard,
  LayoutDashboard,
  Database,
  Zap,
  Crown,
} from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary" />,
    title: "AI-Powered Extraction",
    description:
      "Google Gemini & Groq AI intelligently parse your notes and extract tasks with priorities and due dates automatically.",
  },
  {
    icon: <Shield className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary" />,
    title: "Secure Authentication",
    description:
      "Supabase Auth provides secure login and signup. Your data is protected with industry-standard encryption.",
  },
  {
    icon: <LayoutDashboard className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary" />,
    title: "Complete Dashboard",
    description:
      "Full-featured dashboard with analytics, usage stats, saved boards, and settings management.",
  },
  {
    icon: <Database className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary" />,
    title: "Cloud Storage",
    description:
      "Supabase PostgreSQL database stores your boards securely. Access from any device, anytime.",
  },
  {
    icon: <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary" />,
    title: "Stripe Payments",
    description:
      "Integrated Stripe for premium subscriptions. Secure payment processing with subscription management.",
  },
  {
    icon: <Crown className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary" />,
    title: "Premium Plans",
    description:
      "Free tier with 10 boards/day. Premium unlocks unlimited AI generations and advanced features.",
  },
  {
    icon: <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary" />,
    title: "Analytics & Tracking",
    description:
      "Track your productivity with charts, usage statistics, and activity history over 30 days.",
  },
  {
    icon: <Save className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary" />,
    title: "Save & Export",
    description:
      "Save unlimited boards to your account. Export to JSON for backup or sharing with your team.",
  },
  {
    icon: <Zap className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary" />,
    title: "Lightning Fast",
    description:
      "Built with Next.js 15 and TypeScript. Instant task extraction with drag-and-drop Kanban board.",
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
            Complete Task Management Platform
          </h2>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            AI-powered extraction, secure authentication, cloud storage, premium plans, and full analytics dashboard.
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
