"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type HeroSectionProps = {
  setIsLoading: (isLoading: boolean) => void;
};

export default function HeroSection({ setIsLoading }: HeroSectionProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const isLoggedIn = false; // TODO: Replace with actual auth check
    setTimeout(() => {
      router.push(isLoggedIn ? "/dashboard" : "/sign-up");
    }, 100);
  };

  return (
    <section className="w-full relative overflow-hidden min-h-screen flex items-center justify-center bg-black pt-16">
      {/* Background gradient mesh */}
      <div className="absolute inset-0 bg-black" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(100,100,100,0.1),transparent_50%)]" />

      <div className="container mx-auto text-center px-4 sm:px-6 relative z-10 -mt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/50 border border-gray-700 mb-6 backdrop-blur-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50" />
            <span className="text-xs font-semibold text-gray-300">
              AI • Auth • Dashboard • Payments
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            <span className="block text-white mb-2">Transform Notes Into</span>
            <span className="block bg-gradient-to-r from-gray-200 via-gray-400 to-gray-600 bg-clip-text text-transparent">
              Organized Kanban Boards
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            Complete SaaS platform with AI task extraction, secure authentication, cloud storage, 
            Stripe payments, and analytics dashboard. <span className="text-white font-semibold">Start free, upgrade anytime.</span>
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              onClick={handleClick}
              className="w-full sm:w-auto text-base md:text-lg px-8 py-6 shadow-2xl hover:shadow-xl transition-all duration-300 rounded-xl font-semibold"
            >
              Try It Free Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="w-full sm:w-auto text-base md:text-lg px-8 py-6 rounded-xl font-semibold"
            >
              <a href="#features">See Features</a>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
