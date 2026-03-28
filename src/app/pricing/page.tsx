"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out AI powered task management",
    features: [
      "10 AI extractions per day",
      "300 board uses per month",
      "Smart task extraction with AI",
      "Drag and drop Kanban board",
      "Priority levels & due dates",
      "Save & sync boards",
    ],
    cta: "Get Started",
    href: "/sign-up",
  },
  {
    name: "Premium",
    price: "$9",
    period: "month",
    description: "For professionals who need AI superpowers",
    features: [
      "50 boards per day",
      "50 AI extractions per day",
      "AI Workload Health & Burnout Prevention",
      "AI Chat Assistant for productivity coaching",
      "AI Pattern Learning & Smart Insights",
      "PDF import & URL extraction",
      "Export boards as DOCX or PDF",
      "Cloud sync across devices",
      "Priority email support (24h)",
    ],
    cta: "Upgrade",
    href: "/api/stripe/checkout",
    popular: true,
    annual: "or $99/year (save 31%)",
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="pt-16 sm:pt-20 px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-3 text-white"
          >
            Simple Pricing
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-base sm:text-lg text-gray-400"
          >
            Start free, upgrade when you need more
          </motion.p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid md:grid-cols-2 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="flex"
            >
              <div
                className={`w-full p-8 border transition-all duration-300 ${
                  plan.popular
                    ? "border-white bg-white/5"
                    : "border-gray-800 bg-transparent hover:border-gray-700"
                }`}
              >
                {/* Header */}
                <div className="mb-8">
                  {plan.popular && (
                    <div className="text-xs font-semibold text-white mb-3 uppercase tracking-wider">
                      Most Popular
                    </div>
                  )}
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {plan.name}
                  </h2>
                  <p className="text-sm text-gray-400 mb-6">
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-bold text-white">
                        {plan.price}
                      </span>
                      <span className="text-gray-400">/{plan.period}</span>
                    </div>
                    {(plan as any).annual && (
                      <p className="text-xs text-gray-500 mt-2">
                        {(plan as any).annual}
                      </p>
                    )}
                  </div>

                  {/* CTA Button */}
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Button
                      className={`w-full h-11 font-medium text-sm transition-all duration-300 ${
                        plan.popular
                          ? "bg-white text-black hover:bg-gray-100 border-0"
                          : "bg-transparent border border-gray-700 text-white hover:border-gray-600"
                      }`}
                      onClick={plan.popular ? handleCheckout : undefined}
                      asChild={!plan.popular}
                      disabled={loading}
                    >
                      {plan.popular ? (
                        <span>{loading ? "Loading..." : plan.cta}</span>
                      ) : (
                        <Link href={plan.href}>{plan.cta}</Link>
                      )}
                    </Button>
                  </motion.div>
                </div>

                {/* Features */}
                <div className="space-y-4 border-t border-gray-800 pt-8">
                  {plan.features.map((feature, idx) => (
                    <motion.div
                      key={feature}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + idx * 0.03 }}
                      className="flex items-start gap-3"
                    >
                      <Check className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-300">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
