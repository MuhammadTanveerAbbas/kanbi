"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";

type HeroSectionProps = {
  setIsLoading: (isLoading: boolean) => void;
};

export default function HeroSection({ setIsLoading }: HeroSectionProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsLoading(true);
    requestAnimationFrame(() => {
      router.push("/board");
    });
  };

  return (
    <section className="w-full relative overflow-hidden min-h-[80vh] sm:min-h-[85vh] flex items-center bg-black">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-black to-black/90" />

      <div className="container mx-auto text-center py-16 sm:py-24 px-4 relative">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4 sm:mb-6">
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-primary">
            AI Powered Task Management
          </span>
        </div>

        {/* Crystal clear what it is */}
        <h1 className="text-3xl sm:text-4xl lg:text-7xl font-bold tracking-tight mb-4 sm:mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
          <span className="sm:hidden">
            Turn Messy Notes Into{" "}
            <span className="text-primary bg-gradient-to-r from-primary to-primary/80 bg-clip-text">
              Organized To Do Lists
            </span>
          </span>
          <span className="hidden sm:block">
            Turn Messy Notes Into
            <br />
            <span className="text-primary bg-gradient-to-r from-primary to-primary/80 bg-clip-text">
              Organized To Do Lists
            </span>
          </span>
        </h1>

        {/* Exactly who and what problem */}
        <p className="text-sm sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto mb-6 sm:mb-8">
          For busy founders and small teams who have great ideas scattered in random notes. Paste your meeting notes, get a clean task board. No signup required.
        </p>

        {/* Clear, specific CTA */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center mb-6 sm:mb-8">
          <Button
            size="lg"
            onClick={handleClick}
            className="text-sm sm:text-base px-6 py-4 sm:px-8 sm:py-6 shadow-lg hover:shadow-xl transition-all"
          >
            Try It Free Now
            <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            asChild
            className="text-xs sm:text-base px-4 py-4 sm:px-8 sm:py-6"
          >
            <a
              href="https://muhammadtanveerabbas.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
            >
              View Developer Portfolio
            </a>
          </Button>
        </div>

        {/* Trustworthy proof */}
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
          <div className="flex items-center gap-1.5">
            <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
            <p className="text-xs sm:text-sm text-muted-foreground">
              Works in your browser
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
            <p className="text-xs sm:text-sm text-muted-foreground">
              No account needed
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
            <p className="text-xs sm:text-sm text-muted-foreground">
              Your data stays private
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
