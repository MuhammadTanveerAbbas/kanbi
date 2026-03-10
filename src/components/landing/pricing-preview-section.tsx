"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowRight, Check, Crown } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Try it out — no credit card needed",
    features: [
      "10 AI generations per day",
      "Basic task extraction",
      "Drag and drop Kanban board",
      "Priority levels & due dates",
      "Export/Import JSON",
    ],
    cta: "Get Started Free",
    href: "/board",
  },
  {
    name: "Premium",
    price: "$12",
    period: "month",
    description: "For freelance consultants",
    features: [
      "50 AI extractions per day",
      "PDF, Notion, Gmail & URL extraction",
      "Cloud sync across devices",
      "Unlimited saved generations",
      "Email support within 24h",
    ],
    cta: "Upgrade to Premium",
    href: "/pricing",
    popular: true,
  },
];

export default function PricingPreviewSection() {
  return (
    <section
      id="pricing"
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
            Simple, Transparent Pricing
          </h2>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Start free, upgrade when you need more power
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card
                className={`h-full border-2 transition-all duration-300 hover:-translate-y-2 ${
                  plan.popular
                    ? "border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30"
                    : "border-[#262626] bg-gradient-to-br from-[#1a1a1a] to-[#141414] hover:border-[#3a3a3a] hover:shadow-xl"
                }`}
              >
                <CardHeader className="text-center pb-3 sm:pb-4 md:pb-6">
                  {plan.popular && (
                    <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
                      <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      <span className="text-[10px] sm:text-xs md:text-sm font-medium text-primary">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold mb-1.5 sm:mb-2">
                    {plan.name}
                  </CardTitle>
                  <div className="flex items-baseline justify-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                    <span className="text-3xl sm:text-4xl md:text-5xl font-bold">
                      {plan.price}
                    </span>
                    <span className="text-gray-400 text-xs sm:text-sm md:text-base">
                      /{plan.period}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm md:text-base text-gray-300">
                    {plan.description}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 md:space-y-6">
                  <ul className="space-y-2 sm:space-y-3 md:space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 sm:gap-3">
                        <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-sm md:text-base">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className="w-full min-h-[40px] sm:min-h-[44px] md:min-h-[48px] text-sm sm:text-base"
                    variant={plan.popular ? "default" : "outline"}
                  >
                    <Link href={plan.href}>{plan.cta}</Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full text-xs sm:text-sm text-gray-400 hover:text-primary"
                  >
                    <Link href="/pricing" className="flex items-center justify-center gap-1">
                      View Full Pricing <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
