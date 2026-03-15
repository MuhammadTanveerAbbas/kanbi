"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { motion } from "framer-motion";
import { Check, Crown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out AI-powered task management",
    features: [
      "10 AI extractions per day",
      "300 board uses per month",
      "Smart task extraction with AI",
      "Drag and drop Kanban board",
      "Priority levels & due dates",
      "Save & sync boards",
      "Export to JSON, CSV, Markdown",
    ],
    cta: "Get Started Free",
    href: "/board",
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
      "Google Calendar, Gmail, Slack, Notion, Todoist sync",
      "PDF, Notion, Gmail & URL extraction",
      "Cloud sync across devices",
      "Unlimited saved boards",
      "Export to JSON, CSV, Markdown",
      "Priority email support (24h)",
      "API access (coming soon)",
    ],
    cta: "Upgrade to Premium",
    href: "/api/checkout/create-session",
    popular: true,
    annual: "or $99/year (save 31%)",
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout/create-session", {
        method: "POST",
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
    <div className="min-h-screen bg-black text-white pt-20 sm:pt-24">
      <div className="relative overflow-hidden py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-7xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-gray-200 via-gray-400 to-gray-600 bg-clip-text text-transparent"
          >
            Simple, Transparent Pricing
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto"
          >
            Start free, upgrade when you need more power
          </motion.p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Free Tier Limits Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-12 p-6 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20"
        >
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-3">Start Free - No Credit Card Required</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <div className="p-4 rounded-lg bg-black/30 border border-primary/10">
                <div className="text-3xl font-bold text-primary mb-1">10</div>
                <div className="text-sm text-gray-400">AI extractions/day</div>
              </div>
              <div className="p-4 rounded-lg bg-black/30 border border-primary/10">
                <div className="text-3xl font-bold text-primary mb-1">300</div>
                <div className="text-sm text-gray-400">Board uses/month</div>
              </div>
              <div className="p-4 rounded-lg bg-black/30 border border-primary/10">
                <div className="text-3xl font-bold text-primary mb-1">∞</div>
                <div className="text-sm text-gray-400">Saved boards</div>
              </div>
            </div>
            <p className="text-sm text-gray-400 mt-4">Perfect for freelancers and small projects. Upgrade anytime for unlimited power.</p>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card
                className={`h-full border-2 transition-all duration-300 ${
                  plan.popular
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <CardHeader className="text-center pb-8">
                  {plan.popular && (
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Crown className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium text-primary">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <CardTitle className="text-3xl font-bold mb-2">
                    {plan.name}
                  </CardTitle>
                  <div className="flex items-baseline justify-center gap-2 mb-2">
                    <span className="text-5xl font-bold">{plan.price}</span>
                    <span className="text-gray-400">/{plan.period}</span>
                  </div>
                  {(plan as any).annual && (
                    <p className="text-xs text-gray-400 mb-2">
                      {(plan as any).annual}
                    </p>
                  )}
                  <CardDescription className="text-gray-300">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full min-h-[48px]"
                    variant={plan.popular ? "default" : "outline"}
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
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
