"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
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
    <section className="w-full relative overflow-hidden min-h-[80vh] flex items-center">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-muted/20" />
      
      <div className="container mx-auto text-center py-36 px-4 relative">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-primary">Portfolio Project • Live Demo</span>
        </div>

        {/* Crystal clear what it is */}
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
          Turn Messy Notes Into
          <br />
          <span className="text-primary bg-gradient-to-r from-primary to-primary/80 bg-clip-text">Organized To-Do Lists</span>
        </h1>

        {/* Exactly who and what problem */}
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-4">
          For busy founders and small teams who have great ideas scattered in random notes.
        </p>
        
        <p className="text-base text-muted-foreground max-w-xl mx-auto mb-8">
          Paste your meeting notes, get a clean task board. No signup required.
        </p>

        {/* Clear, specific CTA */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-8">
          <Button
            size="lg"
            onClick={handleClick}
            className="text-base px-8 py-6 shadow-lg hover:shadow-xl transition-all"
          >
            Try It Free Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            asChild
            className="text-base px-8 py-6"
          >
            <a href="https://muhammadtanveerabbas.vercel.app" target="_blank" rel="noopener noreferrer">
              View Developer Portfolio
            </a>
          </Button>
        </div>

        {/* Trustworthy proof */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            ✓ Works in your browser ✓ No account needed ✓ Your data stays private
          </p>
        </div>
      </div>
    </section>
  );
}