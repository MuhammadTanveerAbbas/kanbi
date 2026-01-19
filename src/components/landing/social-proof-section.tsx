"use client";

import { motion } from "framer-motion";
import { Shield, Zap, Lock, Cloud } from "lucide-react";

const features = [
  { icon: <Shield className="h-4 w-4 text-primary" />, text: "Secure & Private" },
  { icon: <Zap className="h-4 w-4 text-primary" />, text: "Fast & Reliable" },
  { icon: <Lock className="h-4 w-4 text-primary" />, text: "Your Data Protected" },
  { icon: <Cloud className="h-4 w-4 text-primary" />, text: "Cloud Backup" },
];

export default function SocialProofSection() {
  return (
    <section className="w-full py-8 sm:py-12 bg-black border-y border-border/40 mb-12 sm:mb-0">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center items-center gap-6 sm:gap-8 md:gap-12"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.text}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-2"
            >
              {feature.icon}
              <span className="text-xs sm:text-sm text-muted-foreground">{feature.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
