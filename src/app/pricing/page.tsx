"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Check, Zap, Shield, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const FREE_FEATURES = [
  "10 AI task extractions per day",
  "300 board uses per month",
  "Drag & drop Kanban board",
  "Priority levels & due dates",
  "Save & sync boards",
  "Basic task templates",
];

const PRO_FEATURES = [
  "50 AI task extractions per day",
  "Unlimited board uses",
  "AI Workload Health & Burnout Prevention",
  "AI Chat productivity coach",
  "AI Pattern Learning & Smart Insights",
  "PDF import & URL extraction",
  "Export boards as DOCX or PDF",
  "Morning briefings & Autopilot scheduling",
  "Cloud sync across all devices",
  "Priority email support (24h response)",
];

const FAQ = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from your billing settings at any time. You keep Pro access until the end of your billing period.",
  },
  {
    q: "What happens when I hit the free limit?",
    a: "You can still use the board and manage tasks manually. AI features pause until the next day or you upgrade.",
  },
  {
    q: "Is there an annual plan?",
    a: "Yes — $99/year saves you 31% compared to monthly billing. Contact us to switch.",
  },
  {
    q: "Do you offer refunds?",
    a: "We offer a 7-day money-back guarantee if you're not satisfied, no questions asked.",
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
    <div className="min-h-screen bg-black text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-bold tracking-tight text-white">
            KANBI
          </Link>
          <Link href="/sign-in">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white text-xs">
              Sign in
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="pt-32 pb-16 px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full mb-6">
            <Zap className="w-3 h-3" /> Simple, transparent pricing
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            Start free.{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Upgrade when ready.
            </span>
          </h1>
          <p className="text-base sm:text-lg text-gray-400 max-w-xl mx-auto">
            No hidden fees. No credit card required to start. Cancel anytime.
          </p>
        </motion.div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid md:grid-cols-2 gap-6 items-start">
          {/* Free */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="rounded-2xl border border-white/8 bg-white/[0.02] p-8"
          >
            <div className="mb-8">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Free</p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-5xl font-bold">$0</span>
                <span className="text-gray-500 text-sm">/forever</span>
              </div>
              <p className="text-sm text-gray-400">Perfect for trying out AI-powered task management.</p>
            </div>
            <Link href="/sign-up" className="block mb-8">
              <Button
                variant="outline"
                className="w-full h-11 border-white/10 bg-transparent text-white hover:bg-white/5 hover:border-white/20 text-sm font-medium"
              >
                Get started free
              </Button>
            </Link>
            <div className="space-y-3.5">
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
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-500/[0.07] to-violet-500/[0.04] p-8 relative overflow-hidden"
          >
            {/* Glow */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="mb-8 relative">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Pro</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-300 bg-indigo-500/15 border border-indigo-500/25 px-2 py-0.5 rounded-full">
                  <Star className="w-2.5 h-2.5" /> Most Popular
                </span>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-5xl font-bold">$9</span>
                <span className="text-gray-400 text-sm">/month</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">or $99/year — save 31%</p>
              <p className="text-sm text-gray-400">For professionals who need AI superpowers every day.</p>
            </div>

            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="mb-8 relative">
              <Button
                className="w-full h-11 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white border-0 text-sm font-semibold shadow-lg shadow-indigo-500/25"
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

            <div className="space-y-3.5 relative">
              {PRO_FEATURES.map((f) => (
                <div key={f} className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-300">{f}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-6 mt-12 text-xs text-gray-600"
        >
          {[
            { icon: <Shield className="w-3.5 h-3.5" />, text: "7-day money-back guarantee" },
            { icon: <Check className="w-3.5 h-3.5" />, text: "Cancel anytime" },
            { icon: <Zap className="w-3.5 h-3.5" />, text: "Instant access after upgrade" },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-1.5">
              {icon}
              <span>{text}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Comparison table */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-xl font-bold text-center mb-8 text-white"
        >
          Full comparison
        </motion.h2>
        <div className="rounded-2xl border border-white/8 overflow-hidden">
          <div className="grid grid-cols-3 bg-white/[0.03] border-b border-white/8 px-6 py-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Feature</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Free</span>
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider text-center">Pro</span>
          </div>
          {[
            ["AI extractions / day", "10", "50"],
            ["Board uses", "300 / month", "Unlimited"],
            ["Kanban board", "✓", "✓"],
            ["Save & sync boards", "✓", "✓"],
            ["Workload health scoring", "—", "✓"],
            ["Burnout prevention", "—", "✓"],
            ["AI Chat coach", "—", "✓"],
            ["PDF & URL import", "—", "✓"],
            ["Export DOCX / PDF", "—", "✓"],
            ["Autopilot scheduling", "—", "✓"],
            ["Google Calendar sync", "—", "✓"],
            ["Priority support", "—", "24h email"],
          ].map(([feature, free, pro], i) => (
            <div
              key={feature}
              className={`grid grid-cols-3 px-6 py-3.5 border-b border-white/5 last:border-0 ${i % 2 === 0 ? "" : "bg-white/[0.015]"}`}
            >
              <span className="text-sm text-gray-400">{feature}</span>
              <span className="text-sm text-gray-500 text-center">{free}</span>
              <span className={`text-sm text-center font-medium ${pro === "—" ? "text-gray-600" : "text-indigo-400"}`}>{pro}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-24">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-xl font-bold text-center mb-8 text-white"
        >
          Frequently asked questions
        </motion.h2>
        <div className="space-y-2">
          {FAQ.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-white/8 overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-sm font-medium text-white">{item.q}</span>
                <span className={`text-gray-500 transition-transform duration-200 ${openFaq === i ? "rotate-45" : ""}`}>+</span>
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4">
                  <p className="text-sm text-gray-400 leading-relaxed">{item.a}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-white/5 py-16 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to save 2 hours a day?</h2>
          <p className="text-gray-400 text-sm mb-8">Join thousands of professionals using Kanbi to stay on top of their work.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/sign-up">
              <Button className="h-11 px-8 bg-white text-black hover:bg-gray-100 font-semibold text-sm">
                Start for free
              </Button>
            </Link>
            <Button
              variant="outline"
              className="h-11 px-8 border-white/10 text-white hover:bg-white/5 text-sm"
              onClick={handleCheckout}
              disabled={loading}
            >
              Upgrade to Pro · $9/mo
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
