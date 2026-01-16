"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type FinalCtaSectionProps = {
  setIsLoading: (isLoading: boolean) => void;
};

export default function FinalCtaSection({ setIsLoading }: FinalCtaSectionProps) {
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
            Ready to Organize
            <br />
            <span className="bg-gradient-to-r from-gray-200 via-gray-400 to-gray-600 bg-clip-text text-transparent">
              Your Tasks?
            </span>
          </h2>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-muted-foreground mb-6 sm:mb-8 md:mb-10 max-w-2xl mx-auto px-2">
            Transform your messy notes into organized Kanban boards with AI-powered task extraction.
          </p>
          <Button
            size="lg"
            onClick={handleClick}
            className="text-sm sm:text-base md:text-lg lg:text-xl px-6 sm:px-8 md:px-10 lg:px-12 py-5 sm:py-6 md:py-7 lg:py-8 shadow-lg hover:shadow-xl transition-all min-h-[44px] sm:min-h-[48px] md:min-h-[56px] lg:min-h-[64px] rounded-lg sm:rounded-xl"
          >
            Get Started Free
            <ArrowRight className="ml-1.5 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
          </Button>
          <p className="mt-3 sm:mt-4 md:mt-6 text-[10px] sm:text-xs md:text-sm text-muted-foreground px-2">
            Free plan available • Secure authentication • Save your boards
          </p>
        </motion.div>
      </div>
    </section>
  );
}
