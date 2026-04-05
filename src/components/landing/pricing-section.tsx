"use client";

import { motion } from "framer-motion";
import { Check, Zap, Shield, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const FREE_FEATURES = [
  "10 AI task extractions per day",
  "300 board uses per month",
  "Drag & drop Kanban board",
  "Priority levels & due dates",
  "Save & sync boards",
];

const PRO_FEATURES = [
  "50 AI task extractions per day",
  "Unlimited board uses",
  "AI Workload Health & Burnout Prevention",
  "AI Chat productivity coach",
  "PDF import & URL extraction",
  "Export boards as DOCX or PDF",
  "Autopilot scheduling & morning briefings",
  "DOCX & PDF board export",
  "Priority email support (24h)",
];

export default function PricingSection() {
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
      if (data.url) window.location.href = data.url;
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="pricing" className="w-full py-10 sm:py-14 md:py-20 lg:py-24 bg-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-14"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-3 sm:mb-4 px-2">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Start free. Upgrade when you need more power. Cancel anytime.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto items-start">
          {/* Free */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="rounded-2xl border border-white/8 bg-white/[0.02] p-7 sm:p-8"
          >
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Free</p>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-4xl sm:text-5xl font-bold text-white">$0</span>
              <span className="text-gray-500 text-sm">/forever</span>
            </div>
            <p className="text-sm text-gray-400 mb-6">Perfect for trying out AI-powered task management.</p>
            <Link href="/sign-up" className="block mb-7">
              <Button variant="outline" className="w-full h-11 border-white/10 bg-transparent text-white hover:bg-white/5 text-sm font-medium">
                Get started free
              </Button>
            </Link>
            <div className="space-y-3">
              {FREE_FEATURES.map((f) => (
                <div key={f} className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-400">{f}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Pro */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="rounded-2xl border border-primary/30 bg-gradient-to-b from-primary/[0.07] to-violet-500/[0.04] p-7 sm:p-8 relative overflow-hidden"
          >
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center gap-2 mb-3 relative">
              <p className="text-xs font-semibold text-primary uppercase tracking-widest">Pro</p>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary/80 bg-primary/15 border border-primary/25 px-2 py-0.5 rounded-full">
                <Star className="w-2.5 h-2.5" /> Most Popular
              </span>
            </div>
            <div className="flex items-baseline gap-1 mb-1 relative">
              <span className="text-4xl sm:text-5xl font-bold text-white">$9</span>
              <span className="text-gray-400 text-sm">/month</span>
            </div>
            <p className="text-xs text-gray-500 mb-2">or $99/year kanbi save 31%</p>
            <p className="text-sm text-gray-400 mb-6">For professionals who need AI superpowers every day.</p>
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="mb-7 relative">
              <Button
                className="w-full h-11 bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-400 text-white border-0 text-sm font-semibold shadow-lg shadow-primary/25"
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Loading...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Zap className="w-4 h-4" /> Upgrade to Pro
                  </span>
                )}
              </Button>
            </motion.div>
            <div className="space-y-3 relative">
              {PRO_FEATURES.map((f) => (
                <div key={f} className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-300">{f}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-6 mt-10 text-xs text-gray-600"
        >
          {[
            { icon: <Shield className="w-3.5 h-3.5" />, text: "7-day money-back guarantee" },
            { icon: <Check className="w-3.5 h-3.5" />, text: "Cancel anytime" },
            { icon: <Zap className="w-3.5 h-3.5" />, text: "Instant access after upgrade" },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-1.5">
              {icon}<span>{text}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
