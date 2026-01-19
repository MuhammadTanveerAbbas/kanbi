"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, LayoutDashboard } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

type HeroSectionProps = {
  setIsLoading: (isLoading: boolean) => void;
};

export default function HeroSection({ setIsLoading }: HeroSectionProps) {
  const router = useRouter();
  const { user } = useAuth();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      router.push(user ? "/dashboard" : "/sign-up");
    }, 100);
  };

  return (
    <section className="w-full relative overflow-hidden min-h-[60vh] sm:min-h-screen flex items-start justify-center bg-black pt-16 sm:pt-0 sm:items-center pb-0 sm:pb-0">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-black" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_110%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(100,100,100,0.15),transparent_50%)]" />

      {/* Floating orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl"
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
        animate={{
          x: [0, -30, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="container mx-auto text-center px-4 sm:px-6 relative z-10 sm:-mt-16 md:-mt-24 lg:-mt-32 mb-12 sm:mb-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border border-primary/30 mb-6 backdrop-blur-sm shadow-lg shadow-primary/10">
            <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
            <span className="text-xs font-semibold bg-gradient-to-r from-gray-200 to-gray-400 bg-clip-text text-transparent">
              AI Powered Task Management • Tracking
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            <span className="block text-white mb-2">Transform Notes Into</span>
            <span className="block bg-gradient-to-r from-gray-200 via-gray-400 to-gray-600 bg-clip-text text-transparent">
              Organized Kanban Boards
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-sm xs:text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed px-2">
            Complete SaaS platform with AI task extraction, secure
            authentication, cloud storage, Stripe payments, and analytics
            dashboard.{" "}
            <span className="text-white font-semibold block sm:inline">
              Start free, upgrade anytime.
            </span>
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                onClick={handleClick}
                className="w-full sm:w-auto text-base md:text-lg px-8 py-6 min-h-[48px] shadow-2xl hover:shadow-primary/50 transition-all duration-300 rounded-xl font-semibold group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center">
                  {user ? (
                    <>
                      <LayoutDashboard className="mr-2 h-5 w-5" />
                      Go to Dashboard
                    </>
                  ) : (
                    <>
                      Try It Free Now
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/10 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="lg"
                asChild
                className="w-full sm:w-auto text-base md:text-lg px-8 py-6 min-h-[48px] rounded-xl font-semibold border-2 hover:bg-primary/10"
              >
                <a href="#features">See Features</a>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
