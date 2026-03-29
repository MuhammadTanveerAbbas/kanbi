"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

type FinalCtaSectionProps = {
  setIsLoading: (isLoading: boolean) => void;
};

export default function FinalCtaSection({ setIsLoading }: FinalCtaSectionProps) {
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
    <section className="w-full py-10 sm:py-14 md:py-18 lg:py-24 bg-black">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight mb-3 sm:mb-4 md:mb-6 px-2">
            Your next client call is in your calendar right now
          </h2>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-muted-foreground mb-6 sm:mb-8 md:mb-10 max-w-2xl mx-auto px-2">
            Set up Kanbi in 2 minutes. Free forever. No credit card.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={handleClick}
              className="px-8 py-6 text-base font-semibold rounded-xl shadow-2xl hover:shadow-primary/50 transition-all duration-300 group"
            >
              {user ? "Go to Dashboard" : "Start Free kanbi No Credit Card"}
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Free plan forever · Cancel Pro anytime · No lock-in
          </p>
        </motion.div>
      </div>
    </section>
  );
}
